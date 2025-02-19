"use server";

import { generateResponse } from "@/lib/gemini";
import { onCurrentUser } from "../user";
import { findUser } from "../user/queries";
import {
  addKeyWord,
  addListener,
  addPost,
  addTrigger,
  createAutomation,
  deleteAutomation as deleteAutomationQuery,
  deleteKeywordQuery,
  findAutomation,
  getAutomations,
  updateAutomation,
  saveDm,
} from "./queries";
import { contextProcessor } from "@/lib/context-processor";

export const createAutomations = async (id?: string) => {
  const user = await onCurrentUser();
  try {
    const create = await createAutomation(user.id, id);
    if (create) return { status: 200, data: "Automation created", res: create };

    return { status: 404, data: "Oops! something went wrong" };
  } catch (error) {
    return { status: 500, data: "Internal server error" };
  }
};

export const getAllAutomations = async () => {
  const user = await onCurrentUser();
  try {
    const automations = await getAutomations(user.id);
    if (automations) return { status: 200, data: automations.automations };
    return { status: 404, data: [] };
  } catch (error) {
    return { status: 500, data: [] };
  }
};

export const getAutomationInfo = async (id: string) => {
  await onCurrentUser();
  try {
    const automation = await findAutomation(id);
    if (automation) return { status: 200, data: automation };

    return { status: 404 };
  } catch (error) {
    return { status: 500 };
  }
};

export const updateAutomationName = async (
  automationId: string,
  data: {
    name?: string;
    active?: boolean;
    automation?: string;
  }
) => {
  await onCurrentUser();
  try {
    const update = await updateAutomation(automationId, data);
    if (update) {
      return { status: 200, data: "Automation successfully updated" };
    }
    return { status: 404, data: "Oops! could not find automation" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string
) => {
  await onCurrentUser();
  try {
    const create = await addListener(automationId, listener, prompt, reply);
    if (create) return { status: 200, data: "Listener created" };
    return { status: 404, data: "Cant save listener" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveTrigger = async (automationId: string, trigger: string[]) => {
  await onCurrentUser();
  try {
    const create = await addTrigger(automationId, trigger);
    if (create) return { status: 200, data: "Trigger saved" };
    return { status: 404, data: "Cannot save trigger" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const saveKeyword = async (automationId: string, keyword: string) => {
  await onCurrentUser();
  try {
    const create = await addKeyWord(automationId, keyword);

    if (create) return { status: 200, data: "Keyword added successfully" };

    return { status: 404, data: "Cannot add this keyword" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const deleteKeyword = async (id: string) => {
  await onCurrentUser();
  try {
    const deleted = await deleteKeywordQuery(id);
    if (deleted)
      return {
        status: 200,
        data: "Keyword deleted",
      };
    return { status: 404, data: "Keyword not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const getProfilePosts = async () => {
  const user = await onCurrentUser();
  try {
    const profile = await findUser(user.id);
    const posts = await fetch(
      `${process.env.INSTAGRAM_BASE_URL}/me/media?fields=id,caption,media_url,media_type,timestamp&limit=10&access_token=${profile?.integrations[0].token}`
    );
    const parsed = await posts.json();
    if (parsed) return { status: 200, data: parsed };
    console.log("🔴 Error in getting posts");
    return { status: 404 };
  } catch (error) {
    console.log("🔴 server side Error in getting posts ", error);
    return { status: 500 };
  }
};

export const savePosts = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  await onCurrentUser();
  try {
    const create = await addPost(automationId, posts);

    if (create) return { status: 200, data: "Posts attached" };

    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const activateAutomation = async (id: string, state: boolean) => {
  await onCurrentUser();
  try {
    const update = await updateAutomation(id, { active: state });
    if (update)
      return {
        status: 200,
        data: `Automation ${state ? "activated" : "disabled"}`,
      };
    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const deleteAutomation = async (id: string) => {
  await onCurrentUser();
  try {
    const deleted = await deleteAutomationQuery(id);
    if (deleted) {
      return { status: 200, data: "Automation deleted successfully" };
    }
    return { status: 404, data: "Automation not found" };
  } catch (error) {
    return { status: 500, data: "Oops! something went wrong" };
  }
};

// New functions for handling DMs and AI responses

export const handleMessage = async (
  userId: string,
  messageType: 'COMMENT' | 'DM' | 'SYSTEM',
  content: string,
  metadata?: Record<string, any>
) => {
  await onCurrentUser();
  try {
    const responses = await contextProcessor.processMessage({
      userId,
      messageType,
      content,
      metadata
    });

    // Handle responses
    for (const response of responses) {
      if (response.type === 'DM') {
        await saveDm(response.automationId, {
          senderId: userId,
          receiverId: userId,
          message: response.response
        });
      } else {
        // Handle comment responses
        // This would integrate with your Instagram API to post comments
        console.log('Posting comment:', response.response);
      }
    }

    return {
      status: 200,
      data: "Messages processed successfully",
      responses
    };
  } catch (error) {
    console.error("Error processing message:", error);
    return { status: 500, data: "Oops! something went wrong" };
  }
};

export const handleDirectMessage = async (
  automationId: string,
  senderId: string,
  receiverId: string,
  message: string,
  isAiResponse: boolean = false
) => {
  await onCurrentUser();
  try {
    const responses = await contextProcessor.processMessage({
      userId: senderId,
      automationId,
      messageType: 'DM',
      content: message,
      metadata: {
        receiverId,
        isAiResponse
      }
    });

    // If we got responses, use those. Otherwise, fall back to the original behavior
    if (responses.length > 0) {
      const savedMessages = await Promise.all(
        responses.map(response =>
          saveDm(response.automationId, {
            senderId,
            receiverId,
            message: response.response
          })
        )
      );

      return {
        status: 200,
        data: "Messages sent successfully",
        responses: savedMessages
      };
    }

    // Original fallback behavior
    const automation = await findAutomation(automationId);
    if (!automation) {
      return { status: 404, data: "Automation not found" };
    }

    let responseMessage = message;

    if (isAiResponse && automation.listener?.listener === "SMARTAI") {
      const context = `This is an Instagram DM conversation. Previous message: ${message}`;
      const aiResponse = await generateResponse(
        automation.listener.prompt,
        context
      );

      if (aiResponse.error) {
        return { status: 500, data: aiResponse.error };
      }

      responseMessage = aiResponse.text;
    }

    const savedDm = await saveDm(automationId, {
      senderId,
      receiverId,
      message: responseMessage,
    });

    if (savedDm) {
      return {
        status: 200,
        data: "Message sent successfully",
        response: responseMessage
      };
    }

    return { status: 404, data: "Failed to send message" };
  } catch (error) {
    console.error("Error handling direct message:", error);
    return { status: 500, data: "Oops! something went wrong" };
  }
};
