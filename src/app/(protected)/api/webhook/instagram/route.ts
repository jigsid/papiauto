import { findAutomation } from "@/actions/automations/queries";
import {
  createChatHistory,
  getChatHistory,
  getKeywordAutomation,
  getKeywordPost,
  matchKeyword,
  trackResponses,
} from "@/actions/webhook/queries";
import { sendDM, sendPrivateMessage } from "@/lib/fetch";
import { generateResponse } from "@/lib/gemini";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Track processed comments in memory for now since we can't use the database
const processedComments = new Set<string>();

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

interface ChatHistory {
  history: ChatMessage[];
  automationId: string | null;
}

async function isCommentProcessed(commentId: string) {
  // First check in-memory cache
  if (processedComments.has(commentId)) {
    return true;
  }
  
  // Then check database
  const processed = await client.processedComment.findFirst({
    where: { commentId }
  });
  
  if (processed) {
    // Add to in-memory cache for future checks
    processedComments.add(commentId);
    return true;
  }
  
  return false;
}

async function markCommentAsProcessed(commentId: string, automationId: string) {
  processedComments.add(commentId);
  await client.processedComment.create({
    data: {
      commentId,
      automationId,
      processed: true
    }
  });
}

export async function GET(req: NextRequest) {
  const hub = req.nextUrl.searchParams.get("hub.challenge");
  return new NextResponse(hub);
}

export async function POST(req: NextRequest) {
  const webhook_payload = await req.json();
  let matcher;

  try {
    console.error("[Webhook Debug] Received payload:", JSON.stringify(webhook_payload));

    // Handle comments
    if (webhook_payload.entry?.[0]?.changes?.[0]?.value?.text) {
      matcher = await matchKeyword(webhook_payload.entry[0].changes[0].value.text);
      
      if (matcher && matcher.automationId) {
        const automation = await getKeywordAutomation(matcher.automationId, false);
        
        if (automation && automation.trigger) {
          const commentId = webhook_payload.entry[0].changes[0].value.id;
          const parentId = webhook_payload.entry[0].changes[0].value.parent_id;
          const userId = webhook_payload.entry[0].changes[0].value.from?.id;
          
          if (!userId) {
            console.error("[Webhook Debug] Missing user ID in payload");
            return NextResponse.json(
              { message: "Missing user ID" },
              { status: 400 }
            );
          }
          
          // Skip if it's a reply comment
          if (parentId) {
            console.error("[Webhook Debug] Skipping reply comment");
            return NextResponse.json(
              { message: "Skipping reply comment" },
              { status: 200 }
            );
          }

          // Check if comment is already processed
          try {
            const isProcessed = await isCommentProcessed(commentId);
            if (isProcessed) {
              console.error("[Webhook Debug] Skipping already processed comment");
              return NextResponse.json(
                { message: "Comment already processed" },
                { status: 200 }
              );
            }

            // Process the comment
            const comment_reply = await sendPrivateMessage(
              webhook_payload.entry[0].id,
              commentId,
              automation.listener?.commentReply || automation.listener?.prompt || "",
              automation.User?.integrations[0].token!
            );
            
            if (comment_reply.status === 200) {
              try {
                // Mark comment as processed before sending DM to prevent race conditions
                await markCommentAsProcessed(commentId, automation.id);
                await trackResponses(automation.id, "COMMENT");
                
                // Check if DM trigger is also enabled
                const hasDmTrigger = automation.trigger.some(t => t.type === "DM");
                
                if (hasDmTrigger) {
                  const processedDmKey = `${commentId}_${userId}_dm`;
                  
                  // Only send DM if we haven't processed this combination before
                  if (!processedComments.has(processedDmKey)) {
                    processedComments.add(processedDmKey);
                    
                    // If Smart AI is enabled, use that for DM
                    if (
                      automation.listener?.listener === "SMARTAI" &&
                      automation.User?.subscription?.plan === "PRO"
                    ) {
                      const aiResponse = await handleSmartAIResponse(webhook_payload, automation, true);
                      if (aiResponse.status === 200) {
                        await trackResponses(automation.id, "DM");
                      }
                    } 
                    // Otherwise send regular DM
                    else {
                      const direct_message = await sendDM(
                        webhook_payload.entry[0].id,
                        userId,
                        automation.listener?.prompt || "",
                        automation.User?.integrations[0].token!
                      );
                      
                      if (direct_message.status === 200) {
                        await trackResponses(automation.id, "DM");
                      }
                    }
                  }
                }
                
                return NextResponse.json(
                  { message: "Automated replies sent" },
                  { status: 200 }
                );
              } catch (error) {
                if (error && typeof error === 'object' && 'code' in error && error.code === 'P2002') {
                  // Handle duplicate comment gracefully
                  console.error("[Webhook Debug] Comment already processed (race condition)");
                  return NextResponse.json(
                    { message: "Comment already processed" },
                    { status: 200 }
                  );
                }
                throw error;
              }
            }
          } catch (error) {
            console.error("[Webhook Error] Comment/DM reply error:", error);
            throw error;
          }
        }
      }
    }

    return NextResponse.json(
      { message: "No valid automation type found" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[Webhook Error] Main error:", error);
    return NextResponse.json(
      {
        message: "Error processing webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Helper function to handle Smart AI responses
async function handleSmartAIResponse(webhook_payload: any, automation: any, isCommentDM: boolean = false) {
  try {
    const senderId = isCommentDM 
      ? webhook_payload.entry[0].changes[0].value.from?.id
      : webhook_payload.entry[0].messaging?.[0]?.sender?.id;
      
    const recipientId = isCommentDM
      ? webhook_payload.entry[0].id
      : webhook_payload.entry[0].messaging?.[0]?.recipient?.id;
      
    const messageText = isCommentDM
      ? webhook_payload.entry[0].changes[0].value.text
      : webhook_payload.entry[0].messaging?.[0]?.message?.text;

    if (!senderId || !recipientId || !messageText) {
      console.error("[Webhook Debug] Missing required fields for Smart AI response", {
        senderId,
        recipientId,
        messageText
      });
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Get chat history for context
    const history: ChatHistory = await getChatHistory(senderId, recipientId);
    let context = `Previous conversation:\n`;
    
    if (history && history.history) {
      context += history.history
        .slice(-5) // Get last 5 messages for context
        .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
        .join('\n');
    }
    
    context += `\nCurrent message: ${messageText}`;

    // Generate AI response
    const aiResponse = await generateResponse(
      automation.listener.prompt,
      context
    );

    if (!aiResponse || aiResponse.error) {
      console.error("[Webhook Debug] Failed to generate AI response:", aiResponse?.error);
      return NextResponse.json(
        { message: "Failed to generate response" },
        { status: 500 }
      );
    }

    try {
      // Save chat history before sending response
      await createChatHistory(
        automation.id,
        senderId,
        recipientId,
        messageText
      );

      await createChatHistory(
        automation.id,
        recipientId,
        senderId,
        aiResponse.text
      );

      // Send the response
      const direct_message = await sendDM(
        recipientId,
        senderId,
        aiResponse.text,
        automation.User?.integrations[0].token!
      );

      if (direct_message.status === 200) {
        await trackResponses(automation.id, "DM");
        return NextResponse.json(
          { message: "Message sent" },
          { status: 200 }
        );
      }
      
      throw new Error("Failed to send message");
    } catch (error) {
      console.error("[Webhook Error] Failed to save chat history or send message:", error);
      
      // Try sending a fallback message
      try {
        const fallback_message = await sendDM(
          recipientId,
          senderId,
          "I'm having trouble processing your message right now. Please try again shortly.",
          automation.User?.integrations[0].token!
        );

        if (fallback_message.status === 200) {
          return NextResponse.json(
            { message: "Fallback message sent" },
            { status: 200 }
          );
        }
      } catch (retryError) {
        console.error("[Webhook Error] Failed to send fallback message:", retryError);
      }
    }

    return NextResponse.json(
      { message: "Failed to process message" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Webhook Error] Smart AI response error:", error);
    return NextResponse.json(
      { message: "Error processing Smart AI response" },
      { status: 500 }
    );
  }
}

// Helper function to handle regular message responses
async function handleRegularMessage(webhook_payload: any, automation: any) {
  try {
    const direct_message = await sendDM(
      webhook_payload.entry[0].id,
      webhook_payload.entry[0].messaging[0].sender.id,
      automation.listener?.prompt || "",
      automation.User?.integrations[0].token!
    );

    if (direct_message.status === 200) {
      await trackResponses(automation.id, "DM");
      return NextResponse.json(
        { message: "Automated message sent" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { message: "Failed to send automated message" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Webhook Error] Regular message error:", error);
    throw error;
  }
}
