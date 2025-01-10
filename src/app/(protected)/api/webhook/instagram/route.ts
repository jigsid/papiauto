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
import { openai } from "@/lib/openai";
import { client } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

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

    if (webhook_payload.entry[0].messaging) {
      matcher = await matchKeyword(
        webhook_payload.entry[0].messaging[0].message.text
      );
      console.error(
        "[Webhook Debug] Message text: " +
          webhook_payload.entry[0].messaging[0].message.text
      );
    }

    if (webhook_payload.entry[0].changes) {
      matcher = await matchKeyword(
        webhook_payload.entry[0].changes[0].value.text
      );
      console.error(
        "[Webhook Debug] Changes text: " +
          webhook_payload.entry[0].changes[0].value.text
      );
    }

    if (matcher && matcher.automationId) {
      console.error(
        "[Webhook Debug] Matched automation ID: " + matcher.automationId
      );

      if (webhook_payload.entry[0].messaging) {
        const automation = await getKeywordAutomation(
          matcher.automationId,
          true
        );
        console.error(
          "[Webhook Debug] Found automation: " +
            JSON.stringify({
              id: automation?.id,
              listener: automation?.listener?.listener,
              plan: automation?.User?.subscription?.plan,
            })
        );

        if (automation && automation.trigger) {
          if (
            automation.listener &&
            automation.listener.listener === "SMARTAI" &&
            automation.User?.subscription?.plan === "PRO"
          ) {
            console.error("[Webhook Debug] Starting Smart AI processing");
            try {
              const customer_history = await getChatHistory(
                webhook_payload.entry[0].messaging[0].sender.id,
                webhook_payload.entry[0].messaging[0].recipient.id
              );

              const messages = [
                {
                  role: "system" as const,
                  content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
                },
                ...(customer_history?.history || []).map((msg) => ({
                  role: msg.role as "assistant" | "user",
                  content: msg.content,
                })),
                {
                  role: "user" as const,
                  content: webhook_payload.entry[0].messaging[0].message.text,
                },
              ];

              console.error(
                "[Webhook Debug] Sending messages to OpenAI:",
                JSON.stringify(messages)
              );

              const smart_ai_message = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages,
                temperature: 0.7,
                max_tokens: 150,
              });

              console.error(
                "[Webhook Debug] OpenAI response received: " +
                  smart_ai_message.choices[0].message.content
              );

              if (smart_ai_message.choices[0].message.content) {
                console.error("[Webhook Debug] Creating chat history");
                const reciever = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].messaging[0].sender.id,
                  webhook_payload.entry[0].messaging[0].recipient.id,
                  webhook_payload.entry[0].messaging[0].message.text
                );

                const sender = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].messaging[0].recipient.id,
                  webhook_payload.entry[0].messaging[0].sender.id,
                  smart_ai_message.choices[0].message.content
                );

                await client.$transaction([reciever, sender]);
                console.error(
                  "[Webhook Debug] Chat history created successfully"
                );

                console.error("[Webhook Debug] Sending DM");
                const direct_message = await sendDM(
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].messaging[0].sender.id,
                  smart_ai_message.choices[0].message.content,
                  automation.User?.integrations[0].token!
                );
                console.error(
                  "[Webhook Debug] DM response status: " + direct_message.status
                );

                if (direct_message.status === 200) {
                  const tracked = await trackResponses(automation.id, "DM");
                  console.error("[Webhook Debug] Response tracked: " + tracked);
                  if (tracked) {
                    return NextResponse.json(
                      {
                        message: "Message sent",
                      },
                      { status: 200 }
                    );
                  }
                }
              }
            } catch (error) {
              console.error(
                "[Webhook Error] Smart AI processing error: " +
                  (error instanceof Error ? error.message : "Unknown error")
              );
              console.error(
                "[Webhook Error] Full error: " + JSON.stringify(error)
              );

              // If it's a quota error, send a fallback message
              if (error instanceof Error && error.message.includes("quota")) {
                console.error(
                  "[Webhook Debug] Using fallback response due to quota error"
                );
                const direct_message = await sendDM(
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].messaging[0].sender.id,
                  "I apologize, but I'm currently experiencing high traffic. Please try again later or contact support.",
                  automation.User?.integrations[0].token!
                );

                if (direct_message.status === 200) {
                  return NextResponse.json(
                    {
                      message: "Fallback message sent",
                    },
                    { status: 200 }
                  );
                }
              }

              throw error;
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(
      "[Webhook Error] Main error: " +
        (error instanceof Error ? error.message : "Unknown error")
    );
    console.error(
      "[Webhook Error] Full error details: " + JSON.stringify(error)
    );
    return NextResponse.json(
      {
        message: "Error processing webhook",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
