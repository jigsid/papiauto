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
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// Track processed comments in memory for now since we can't use the database
const processedComments = new Set<string>();

async function isCommentProcessed(commentId: string) {
  return processedComments.has(commentId);
}

async function markCommentAsProcessed(commentId: string) {
  processedComments.add(commentId);
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
      matcher = await matchKeyword(
        webhook_payload.entry[0].messaging[0].message.text
      );
      
      if (matcher && matcher.automationId) {
        const automation = await getKeywordAutomation(matcher.automationId, true);
        
        if (automation && automation.trigger) {
          // Handle Smart AI responses
          if (
            automation.listener &&
            automation.listener.listener === "SMARTAI" &&
            automation.User?.subscription?.plan === "PRO"
          ) {
            return await handleSmartAIResponse(webhook_payload, automation);
          } 
          // Handle regular message responses
          else if (automation.listener && automation.listener.listener === "MESSAGE") {
            return await handleRegularMessage(webhook_payload, automation);
          }
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
          
          // Only process if it's a new parent comment and hasn't been processed
          if (!parentId && !(await isCommentProcessed(commentId))) {
            try {
              // Send comment reply first
              const comment_reply = await sendPrivateMessage(
                webhook_payload.entry[0].id,
                commentId,
                automation.listener?.commentReply || automation.listener?.prompt || "",
                automation.User?.integrations[0].token!
              );
              
              if (comment_reply.status === 200) {
                await markCommentAsProcessed(commentId);
                await trackResponses(automation.id, "COMMENT");
                
                // Check if DM trigger is also enabled
                const hasDmTrigger = automation.trigger.some(t => t.type === "DM");
                
                if (hasDmTrigger) {
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
                
                return NextResponse.json(
                  { message: "Automated replies sent" },
                  { status: 200 }
                );
              }
            } catch (error) {
              console.error("[Webhook Error] Comment/DM reply error:", error);
              throw error;
            }
          } else {
            console.error("[Webhook Debug] Skipping already processed or reply comment");
            return NextResponse.json(
              { message: "Comment already processed or is a reply" },
              { status: 200 }
            );
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

    // Convert chat history to Gemini format with proper type assertion
    const messageHistory = customer_history?.history.map(msg => ({
      role: (msg.role === 'assistant' ? 'model' : 'user') as 'model' | 'user',
      text: msg.content
    }));

    // Generate response using Gemini
    const context = `This is an Instagram ${isCommentDM ? 'comment' : 'DM'} conversation.`;
    const smart_ai_response = await generateResponse(
      messageText,
      context,
      messageHistory
    );

    if (smart_ai_response.text) {
      const reciever = createChatHistory(
        automation.id,
        senderId,
        recipientId,
        messageText
      );

      const sender = createChatHistory(
        automation.id,
        recipientId,
        senderId,
        smart_ai_response.text
      );

      await prisma.$transaction([reciever, sender]);

      const direct_message = await sendDM(
        webhook_payload.entry[0].id,
        senderId,
        smart_ai_response.text,
        automation.User?.integrations[0].token!
      );

      if (direct_message.status === 200) {
        await trackResponses(automation.id, "DM");
        return NextResponse.json(
          { message: "Message sent" },
          { status: 200 }
        );
      }
    }

    return NextResponse.json(
      { message: "Failed to generate or send message" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Webhook Error] Smart AI response error:", error);
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
