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

// Track processed items in memory
const processedComments = new Set<string>();
const processedMessages = new Set<string>();

interface ChatMessage {
  role: "assistant" | "user";
  content: string;
}

interface ChatHistory {
  history: ChatMessage[];
  automationId: string | null;
  messageCount?: number;  // Track number of messages since keyword trigger
}

// Track active conversations and their message counts
const activeConversations = new Map<string, {
  messageCount: number;
  lastKeywordTrigger: number;
  limitNotificationSent: boolean;  // Track if we've sent the limit notification
}>();

// System messages that should not be processed
const SYSTEM_MESSAGES = new Set([
  "You've reached the message limit. Please trigger the keyword again to continue our conversation.",
  "I'm having trouble processing your message right now. Please try again shortly."
]);

// Helper function to check if message is a system message
function isSystemMessage(text: string): boolean {
  return SYSTEM_MESSAGES.has(text);
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

async function isMessageProcessed(messageId: string) {
  return processedMessages.has(messageId);
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

async function markMessageAsProcessed(messageId: string) {
  processedMessages.add(messageId);
}

// Helper function to check if conversation is still active
function isConversationActive(senderId: string): boolean {
  const conversation = activeConversations.get(senderId);
  if (!conversation) return false;
  
  // Check if conversation has exceeded 6 messages (increased from 3)
  return conversation.messageCount < 6;
}

// Helper function to increment message count
function incrementMessageCount(senderId: string): boolean {
  const conversation = activeConversations.get(senderId);
  if (conversation) {
    conversation.messageCount += 1;
    activeConversations.set(senderId, conversation);
    // Check for 6 messages instead of 3
    return conversation.messageCount >= 6 && !conversation.limitNotificationSent;
  }
  return false;
}

// Helper function to reset conversation
function resetConversation(senderId: string) {
  activeConversations.set(senderId, {
    messageCount: 0,
    lastKeywordTrigger: Date.now(),
    limitNotificationSent: false
  });
}

// Helper function to mark limit notification as sent
function markLimitNotificationSent(senderId: string) {
  const conversation = activeConversations.get(senderId);
  if (conversation) {
    conversation.limitNotificationSent = true;
    activeConversations.set(senderId, conversation);
  }
}

// Helper function to handle Smart AI responses with retries
async function generateAIResponseWithRetry(prompt: string, context: string, maxRetries: number = 3): Promise<any> {
  let lastError = null;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await generateResponse(prompt, context);
      if (response && !response.error) {
        return response;
      }
      lastError = response?.error || 'Empty response';
    } catch (error) {
      console.error(`[Webhook Debug] AI generation attempt ${i + 1} failed:`, error);
      lastError = error;
    }
    
    // Wait before retry (exponential backoff)
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
  
  throw new Error(`Failed to generate AI response after ${maxRetries} attempts. Last error: ${lastError}`);
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

    // Handle DM messages
    if (webhook_payload.object === "instagram" && webhook_payload.entry?.[0]?.messaging) {
      const message = webhook_payload.entry[0].messaging[0];
      const senderId = message.sender.id;
      
      if (!message?.message?.mid || !message?.message?.text) {
        console.error("[Webhook Debug] Invalid message payload - missing mid or text");
        return NextResponse.json(
          { message: "Invalid message payload" },
          { status: 400 }
        );
      }

      // Skip processing system messages
      if (isSystemMessage(message.message.text)) {
        console.error("[Webhook Debug] Skipping system message:", message.message.text);
        return NextResponse.json(
          { message: "System message skipped" },
          { status: 200 }
        );
      }

      console.error("[Webhook Debug] Processing DM with text:", message.message.text);

      // Check if message already processed
      if (await isMessageProcessed(message.message.mid)) {
        console.error("[Webhook Debug] Skipping already processed message:", message.message.mid);
        return NextResponse.json(
          { message: "Message already processed" },
          { status: 200 }
        );
      }

      // Try to match keyword
      matcher = await matchKeyword(message.message.text);
      console.error("[Webhook Debug] Keyword match result:", matcher);

      if (matcher && matcher.automationId) {
        // Reset conversation when keyword is triggered
        resetConversation(senderId);
        console.error("[Webhook Debug] Found matching automation:", matcher.automationId);
        const automation = await getKeywordAutomation(matcher.automationId, true);
        
        if (!automation) {
          console.error("[Webhook Debug] No automation found for ID:", matcher.automationId);
          await markMessageAsProcessed(message.message.mid);
          return NextResponse.json(
            { message: "No automation found" },
            { status: 200 }
          );
        }

        console.error("[Webhook Debug] Automation triggers:", automation.trigger);
        
        // Check if automation has DM trigger
        if (automation.trigger?.some(t => t.type === "DM")) {
          // Mark message as processed before handling to prevent duplicates
          await markMessageAsProcessed(message.message.mid);
          console.error("[Webhook Debug] Processing DM with automation:", automation.id);

          // Handle Smart AI responses
          if (
            automation.listener?.listener === "SMARTAI" &&
            automation.User?.subscription?.plan === "PRO"
          ) {
            console.error("[Webhook Debug] Using Smart AI response");
            return await handleSmartAIResponse(webhook_payload, automation);
          } 
          // Handle regular message responses
          else if (automation.listener?.listener === "MESSAGE") {
            console.error("[Webhook Debug] Using regular message response");
            return await handleRegularMessage(webhook_payload, automation);
          } else {
            console.error("[Webhook Debug] No valid listener type found:", automation.listener?.listener);
          }
        } else {
          console.error("[Webhook Debug] No DM trigger found for automation:", automation.id);
        }
      } else {
        // Check if this is part of an active conversation
        if (isConversationActive(senderId)) {
          console.error("[Webhook Debug] Continuing active conversation for user:", senderId);
          const lastConversation = await getChatHistory(senderId, webhook_payload.entry[0].id);
          
          if (lastConversation && lastConversation.automationId) {
            const automation = await getKeywordAutomation(lastConversation.automationId, true);
            
            if (automation?.trigger?.some(t => t.type === "DM")) {
              await markMessageAsProcessed(message.message.mid);
              
              if (automation.listener?.listener === "SMARTAI" && 
                  automation.User?.subscription?.plan === "PRO") {
                incrementMessageCount(senderId);
                const response = await handleSmartAIResponse(webhook_payload, automation);
                
                // If this was the third message, send reminder
                const conversation = activeConversations.get(senderId);
                if (conversation && conversation.messageCount >= 6) {
                  // Send reminder message after a short delay
                  setTimeout(async () => {
                    try {
                      await sendDM(
                        webhook_payload.entry[0].id,
                        senderId,
                        "You've reached the message limit. Please trigger the keyword again to continue our conversation.",
                        automation.User?.integrations[0].token!
                      );
                    } catch (error) {
                      console.error("[Webhook Error] Failed to send reminder message:", error);
                    }
                  }, 1000);
                }
                
                return response;
              }
            }
          }
        }
        
        console.error("[Webhook Debug] No matching keyword automation found for text:", message.message.text);
      }

      // Mark message as processed even if no automation matched
      await markMessageAsProcessed(message.message.mid);
      return NextResponse.json(
        { message: "No matching automation found" },
        { status: 200 }
      );
    }

    // Handle comments
    if (webhook_payload.object === "instagram" && webhook_payload.entry?.[0]?.changes?.[0]?.value?.text) {
      const comment = webhook_payload.entry[0].changes[0].value;
      matcher = await matchKeyword(comment.text);
      
      if (matcher && matcher.automationId) {
        const automation = await getKeywordAutomation(matcher.automationId, false);
        
        if (automation && automation.trigger) {
          const commentId = comment.id;
          const parentId = comment.parent_id;
          const userId = comment.from?.id;
          
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
                console.error("[Webhook Debug] Comment processed successfully:", commentId);
                
                // Check if DM trigger is also enabled
                const hasDmTrigger = automation.trigger.some(t => t.type === "DM");
                
                if (hasDmTrigger) {
                  console.error("[Webhook Debug] DM trigger found, sending DM to user:", userId);
                  const processedDmKey = `${commentId}_${userId}_dm`;
                  
                  // Only send DM if we haven't processed this combination before
                  if (!processedComments.has(processedDmKey)) {
                    processedComments.add(processedDmKey);
                    
                    // If Smart AI is enabled, use that for DM
                    if (
                      automation.listener?.listener === "SMARTAI" &&
                      automation.User?.subscription?.plan === "PRO"
                    ) {
                      console.error("[Webhook Debug] Using Smart AI for DM response");
                      const aiResponse = await handleSmartAIResponse(webhook_payload, automation, true);
                      if (aiResponse.status === 200) {
                        await trackResponses(automation.id, "DM");
                        console.error("[Webhook Debug] Smart AI DM sent successfully");
                      }
                    } 
                    // Otherwise send regular DM
                    else {
                      console.error("[Webhook Debug] Sending regular DM response");
                      const direct_message = await sendDM(
                        webhook_payload.entry[0].id,
                        userId,
                        automation.listener?.prompt || "",
                        automation.User?.integrations[0].token!
                      );
                      
                      if (direct_message.status === 200) {
                        await trackResponses(automation.id, "DM");
                        console.error("[Webhook Debug] Regular DM sent successfully");
                      } else {
                        console.error("[Webhook Debug] Failed to send DM, status:", direct_message.status);
                      }
                    }
                  } else {
                    console.error("[Webhook Debug] DM already sent for this comment-user combination");
                  }
                } else {
                  console.error("[Webhook Debug] No DM trigger configured for this automation");
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
            } else {
              console.error("[Webhook Debug] Failed to send comment reply, status:", comment_reply.status);
            }
          } catch (error) {
            console.error("[Webhook Error] Comment/DM reply error:", error);
            throw error;
          }
        } else {
          console.error("[Webhook Debug] No valid triggers found for automation:", matcher.automationId);
        }
      } else {
        console.error("[Webhook Debug] No matching keyword automation found for comment:", comment.text);
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
      // Filter out system messages from history
      const filteredHistory = history.history.filter(msg => !isSystemMessage(msg.content));
      context += filteredHistory
        .slice(-5) // Get last 5 messages for context
        .map((msg: ChatMessage) => `${msg.role}: ${msg.content}`)
        .join('\n');
    }
    
    context += `\nCurrent message: ${messageText}`;

    // Generate AI response with retries
    let aiResponse;
    try {
      aiResponse = await generateAIResponseWithRetry(
        automation.listener.prompt,
        context
      );
    } catch (error) {
      console.error("[Webhook Debug] AI generation error after retries:", error);
      return NextResponse.json(
        { 
          message: "Failed to generate AI response",
          error: error instanceof Error ? error.message : "Unknown error"
        },
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
        
        // Check if we need to send limit notification
        const shouldSendLimitNotification = incrementMessageCount(senderId);
        if (shouldSendLimitNotification) {
          try {
            // Mark as sent before sending to prevent race conditions
            markLimitNotificationSent(senderId);
            await sendDM(
              recipientId,
              senderId,
              "You've reached the message limit. Please trigger the keyword again to continue our conversation.",
              automation.User?.integrations[0].token!
            );
          } catch (error) {
            console.error("[Webhook Error] Failed to send limit notification:", error);
          }
        }
        
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
    console.error("[Webhook Debug] Handling regular message response");
    const senderId = webhook_payload.entry[0].messaging[0].sender.id;
    const pageId = webhook_payload.entry[0].id;
    const messageText = webhook_payload.entry[0].messaging[0].message.text;

    console.error("[Webhook Debug] Sending DM to:", senderId, "from page:", pageId, "with text:", messageText);

    const direct_message = await sendDM(
      pageId,
      senderId,
      automation.listener?.prompt || "",
      automation.User?.integrations[0].token!
    );

    console.error("[Webhook Debug] DM send response:", direct_message);

    if (direct_message.status === 200) {
      await trackResponses(automation.id, "DM");
      console.error("[Webhook Debug] Successfully tracked DM response");
      return NextResponse.json(
        { message: "Automated message sent" },
        { status: 200 }
      );
    }

    console.error("[Webhook Debug] Failed to send DM, status:", direct_message.status);
    return NextResponse.json(
      { message: "Failed to send automated message" },
      { status: 500 }
    );
  } catch (error) {
    console.error("[Webhook Error] Regular message error:", error);
    throw error;
  }
}
