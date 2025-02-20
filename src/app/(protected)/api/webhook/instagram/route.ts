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
    console.error(
      "[Webhook Debug] Received payload: " +
        JSON.stringify(webhook_payload, null, 2)
    );

    // Handle DM messages
    if (webhook_payload.entry[0].messaging) {
      const messageText = webhook_payload.entry[0].messaging[0].message.text;
      const senderId = webhook_payload.entry[0].messaging[0].sender.id;
      const recipientId = webhook_payload.entry[0].messaging[0].recipient.id;

      // First try to match keyword
      matcher = await matchKeyword(messageText);
      
      let automation;
      if (matcher && matcher.automationId) {
        automation = await getKeywordAutomation(matcher.automationId, true);
      } else {
        // If no keyword match, check if there's an existing conversation with Smart AI
        const history = await getChatHistory(senderId, recipientId);
        if (history && history.automationId) {
          // Get the automation from the last conversation
          automation = await findAutomation(history.automationId);
        }
      }
      
      if (automation && automation.trigger) {
        // Handle Smart AI responses
        if (
          automation.listener &&
          automation.listener.listener === "SMARTAI" &&
          automation.User?.subscription?.plan === "PRO"
        ) {
          return await handleSmartAIResponse(webhook_payload, automation);
        } 
        // Handle regular message responses (only for keyword triggers)
        else if (matcher && automation.listener && automation.listener.listener === "MESSAGE") {
          return await handleRegularMessage(webhook_payload, automation);
        }
      }
    }
    
    // Handle comments
    if (webhook_payload.entry[0].changes) {
      matcher = await matchKeyword(
        webhook_payload.entry[0].changes[0].value.text
      );
      
      if (matcher && matcher.automationId) {
        const automation = await getKeywordAutomation(matcher.automationId, false);
        
        if (automation && automation.trigger) {
          const commentId = webhook_payload.entry[0].changes[0].value.id;
          const parentId = webhook_payload.entry[0].changes[0].value.parent_id;
          
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
                  const userId = webhook_payload.entry[0].changes[0].value.from.id;
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
                        webhook_payload.entry[0].changes[0].value.from.id,
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
      ? webhook_payload.entry[0].changes[0].value.from.id
      : webhook_payload.entry[0].messaging[0].sender.id;
    
    const recipientId = isCommentDM
      ? webhook_payload.entry[0].id
      : webhook_payload.entry[0].messaging[0].recipient.id;
    
    const messageText = isCommentDM
      ? webhook_payload.entry[0].changes[0].value.text
      : webhook_payload.entry[0].messaging[0].message.text;

    const customer_history = await getChatHistory(senderId, recipientId);

    // Convert chat history to Gemini format and ensure user messages come first
    const messageHistory: { role: 'user' | 'model'; text: string }[] = [];
    
    // Add current message first to ensure user message starts the conversation
    messageHistory.push({
      role: 'user',
      text: messageText
    });

    // Then add historical messages if they exist
    if (customer_history?.history?.length) {
      customer_history.history.forEach(msg => {
        messageHistory.push({
          role: msg.role === 'assistant' ? 'model' : 'user',
          text: msg.content
        });
      });
    }

    let aiResponse: string;
    try {
      // Generate response using Gemini
      const context = `This is an Instagram ${isCommentDM ? 'comment' : 'DM'} conversation. You are a helpful AI assistant managing this Instagram account. Keep responses concise and engaging.`;
      const smart_ai_response = await generateResponse(
        messageText,
        context,
        messageHistory
      );

      if (!smart_ai_response.text) {
        throw new Error("Empty response from AI");
      }
      
      aiResponse = smart_ai_response.text;
    } catch (error) {
      console.error("[Webhook Error] AI generation error:", error);
      // Fallback response when AI fails
      aiResponse = "I apologize, but I'm experiencing high traffic at the moment. Please try again in a few minutes, or let me know if you need immediate assistance with something specific.";
    }

    try {
      // Save user's message to history
      await createChatHistory(
        automation.id,
        senderId,
        recipientId,
        messageText
      );

      // Save AI's response to history
      await createChatHistory(
        automation.id,
        recipientId,
        senderId,
        aiResponse
      );

      // For DMs, send to the sender's ID, not the page ID
      const direct_message = await sendDM(
        webhook_payload.entry[0].id,  // Page ID
        isCommentDM ? webhook_payload.entry[0].changes[0].value.from.id : webhook_payload.entry[0].messaging[0].sender.id,  // Recipient ID
        aiResponse,
        automation.User?.integrations[0].token!
      );

      if (direct_message.status === 200) {
        await trackResponses(automation.id, "DM");
        return NextResponse.json(
          { message: "Message sent" },
          { status: 200 }
        );
      }
    } catch (error) {
      console.error("[Webhook Error] Failed to save chat history or send message:", error);
      // If sending fails, try one more time with a simpler message
      try {
        const fallback_message = await sendDM(
          webhook_payload.entry[0].id,
          isCommentDM ? webhook_payload.entry[0].changes[0].value.from.id : webhook_payload.entry[0].messaging[0].sender.id,
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
    try {
      const direct_message = await sendDM(
        webhook_payload.entry[0].id,
        isCommentDM ? webhook_payload.entry[0].changes[0].value.from.id : webhook_payload.entry[0].messaging[0].sender.id,
        "I apologize, but I'm currently experiencing technical difficulties. Please try again later or contact support.",
        automation.User?.integrations[0].token!
      );

      if (direct_message.status === 200) {
        return NextResponse.json(
          { message: "Fallback message sent" },
          { status: 200 }
        );
      }
    } catch (sendError) {
      console.error("[Webhook Error] Failed to send error message:", sendError);
    }
    throw error;
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
