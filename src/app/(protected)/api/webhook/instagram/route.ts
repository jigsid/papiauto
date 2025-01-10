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
              const smart_ai_message = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener?.prompt}: Keep responses under 2 sentences`,
                  },
                ],
              });
              console.error(
                "[Webhook Debug] OpenAI response received: " +
                  smart_ai_message.choices[0].message.content
              );

              if (smart_ai_message.choices[0].message.content) {
                console.error("[Webhook Debug] Creating chat history");
                const reciever = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].messaging[0].sender.id,
                  webhook_payload.entry[0].messaging[0].message.text
                );

                const sender = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
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
              throw error;
            }
          } else {
            console.error("[Webhook Debug] Automation conditions not met:", {
              hasListener: !!automation.listener,
              listenerType: automation.listener?.listener,
              plan: automation.User?.subscription?.plan,
            });
          }
        }
      }

      if (
        webhook_payload.entry[0].changes &&
        webhook_payload.entry[0].changes[0].field === "comments"
      ) {
        const automation = await getKeywordAutomation(
          matcher.automationId,
          false
        );

        console.log("geting the automations");

        const automations_post = await getKeywordPost(
          webhook_payload.entry[0].changes[0].value.media.id,
          automation?.id!
        );

        console.log("found keyword ", automations_post);

        if (automation && automations_post && automation.trigger) {
          console.log("first if");
          if (automation.listener) {
            console.log("first if");
            if (automation.listener.listener === "MESSAGE") {
              console.log(
                "SENDING DM, WEB HOOK PAYLOAD",
                webhook_payload,
                "changes",
                webhook_payload.entry[0].changes[0].value.from
              );

              console.log(
                "COMMENT VERSION:",
                webhook_payload.entry[0].changes[0].value.from.id
              );

              const direct_message = await sendPrivateMessage(
                webhook_payload.entry[0].id,
                webhook_payload.entry[0].changes[0].value.id,
                automation.listener?.prompt,
                automation.User?.integrations[0].token!
              );

              console.log("DM SENT", direct_message.data);
              if (direct_message.status === 200) {
                const tracked = await trackResponses(automation.id, "COMMENT");

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
            if (
              automation.listener.listener === "SMARTAI" &&
              automation.User?.subscription?.plan === "PRO"
            ) {
              const smart_ai_message = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [
                  {
                    role: "assistant",
                    content: `${automation.listener?.prompt}: keep responses under 2 sentences`,
                  },
                ],
              });
              if (smart_ai_message.choices[0].message.content) {
                const reciever = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.from.id,
                  webhook_payload.entry[0].changes[0].value.text
                );

                const sender = createChatHistory(
                  automation.id,
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.from.id,
                  smart_ai_message.choices[0].message.content
                );

                await client.$transaction([reciever, sender]);

                const direct_message = await sendPrivateMessage(
                  webhook_payload.entry[0].id,
                  webhook_payload.entry[0].changes[0].value.id,
                  automation.listener?.prompt,
                  automation.User?.integrations[0].token!
                );

                if (direct_message.status === 200) {
                  const tracked = await trackResponses(
                    automation.id,
                    "COMMENT"
                  );

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
            }
          }
        }
      }
    }

    if (!matcher) {
      const customer_history = await getChatHistory(
        webhook_payload.entry[0].messaging[0].recipient.id,
        webhook_payload.entry[0].messaging[0].sender.id
      );

      if (customer_history.history.length > 0) {
        const automation = await findAutomation(customer_history.automationId!);

        if (
          automation?.User?.subscription?.plan === "PRO" &&
          automation.listener?.listener === "SMARTAI"
        ) {
          const smart_ai_message = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
              {
                role: "assistant",
                content: `${automation.listener?.prompt}: keep responses under 2 sentences`,
              },
              ...customer_history.history,
              {
                role: "user",
                content: webhook_payload.entry[0].messaging[0].message.text,
              },
            ],
          });

          if (smart_ai_message.choices[0].message.content) {
            const reciever = createChatHistory(
              automation.id,
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              webhook_payload.entry[0].messaging[0].message.text
            );

            const sender = createChatHistory(
              automation.id,
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content
            );
            await client.$transaction([reciever, sender]);
            const direct_message = await sendDM(
              webhook_payload.entry[0].id,
              webhook_payload.entry[0].messaging[0].sender.id,
              smart_ai_message.choices[0].message.content,
              automation.User?.integrations[0].token!
            );

            if (direct_message.status === 200) {
              //if successfully send we return

              return NextResponse.json(
                {
                  message: "Message sent",
                },
                { status: 200 }
              );
            }
          }
        }
      }

      return NextResponse.json(
        {
          message: "No automation set",
        },
        { status: 200 }
      );
    }
    return NextResponse.json(
      {
        message: "No automation set",
      },
      { status: 200 }
    );
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
