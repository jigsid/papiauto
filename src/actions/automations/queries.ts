"use server";

import { client } from "@/lib/prisma";
import { v4 } from "uuid";

export const createAutomation = async (clerkId: string, id?: string) => {
  return await client.user.update({
    where: {
      clerkId,
    },
    data: {
      automations: {
        create: {
          ...(id && { id }),
        },
      },
    },
  });
};

export const getAutomations = async (clerkId: string) => {
  return await client.user.findUnique({
    where: {
      clerkId,
    },
    select: {
      automations: {
        orderBy: {
          createdAt: "asc",
        },
        include: {
          keywords: true,
          listener: true,
          dms: true,
        },
      },
    },
  });
};

export const findAutomation = async (id: string) => {
  return await client.automation.findUnique({
    where: {
      id,
    },
    include: {
      keywords: true,
      trigger: true,
      posts: true,
      listener: true,
      dms: true,
      User: {
        select: {
          subscription: true,
          integrations: true,
        },
      },
    },
  });
};

export const updateAutomation = async (
  id: string,
  update: {
    name?: string;
    active?: boolean;
  }
) => {
  return await client.automation.update({
    where: { id },
    data: {
      name: update.name,
      active: update.active,
    },
  });
};

export const addListener = async (
  automationId: string,
  listener: "SMARTAI" | "MESSAGE",
  prompt: string,
  reply?: string
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      listener: {
        create: {
          listener,
          prompt,
          commentReply: reply,
        },
      },
    },
  });
};

export const addTrigger = async (automationId: string, trigger: string[]) => {
  // First, remove existing triggers
  await client.trigger.deleteMany({
    where: { automationId }
  });

  // Then add new triggers
  return await client.automation.update({
    where: { id: automationId },
    data: {
      trigger: {
        createMany: {
          data: trigger.map(type => ({ type }))
        }
      }
    },
    include: {
      trigger: true
    }
  });
};

export const addKeyWord = async (automationId: string, keyword: string) => {
  return client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      keywords: {
        create: {
          word: keyword,
        },
      },
    },
  });
};

export const deleteKeywordQuery = async (id: string) => {
  return client.keyword.delete({
    where: { id },
  });
};

export const addPost = async (
  automationId: string,
  posts: {
    postid: string;
    caption?: string;
    media: string;
    mediaType: "IMAGE" | "VIDEO" | "CAROSEL_ALBUM";
  }[]
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      posts: {
        createMany: {
          data: posts,
        },
      },
    },
  });
};

export const saveDm = async (
  automationId: string,
  data: {
    senderId: string;
    receiverId: string;
    message: string;
  }
) => {
  return await client.automation.update({
    where: {
      id: automationId,
    },
    data: {
      dms: {
        create: {
          senderId: data.senderId,
          reciever: data.receiverId,
          message: data.message,
        },
      },
    },
    include: {
      dms: true,
    },
  });
};

export const deleteAutomation = async (id: string) => {
  // First delete all related records
  await client.keyword.deleteMany({
    where: { automationId: id },
  });

  await client.trigger.deleteMany({
    where: { automationId: id },
  });

  await client.post.deleteMany({
    where: { automationId: id },
  });

  await client.listener.deleteMany({
    where: { automationId: id },
  });

  await client.dms.deleteMany({
    where: { automationId: id },
  });

  // Then delete the automation itself
  return await client.automation.delete({
    where: { id },
  });
};

// Add this new type
interface ProcessedComment {
  id: string;
  automationId: string;
  commentId: string;
  processed: boolean;
  createdAt: Date;
}

// Add this new query
export const markCommentAsProcessed = async (automationId: string, commentId: string) => {
  return await client.processedComment.create({
    data: {
      automationId,
      commentId,
      processed: true
    }
  });
};

export const isCommentProcessed = async (automationId: string, commentId: string) => {
  const result = await client.processedComment.findUnique({
    where: {
      automationId_commentId: {
        automationId,
        commentId
      }
    }
  });
  return !!result;
};
