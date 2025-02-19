import { prisma } from "@/lib/prisma";
import { generateResponse } from "@/lib/gemini";
import type { Prisma } from "@prisma/client";

type MessageType = 'COMMENT' | 'DM' | 'SYSTEM';

interface MessageContext {
  userId: string;
  automationId?: string;
  messageType: MessageType;
  content: string;
  metadata?: Record<string, any>;
}

interface TriggerRule {
  type: 'keyword' | 'intent' | 'event';
  value: string;
  confidence?: number;
}

interface ConversationHistoryType {
  id: string;
  userId: string;
  messageType: MessageType;
  content: string;
  metadata?: Record<string, any>;
  context?: string;
  createdAt: Date;
  automationId?: string;
}

export class ContextProcessor {
  private async getConversationHistory(userId: string, limit = 10): Promise<ConversationHistoryType[]> {
    const history = await prisma.$queryRaw`
      SELECT id, user_id as "userId", message_type as "messageType", 
             content, metadata, context, created_at as "createdAt", 
             automation_id as "automationId"
      FROM "ConversationHistory"
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;
    return history as ConversationHistoryType[];
  }

  private async storeContext(userId: string, key: string, value: string) {
    const result = await prisma.$executeRaw`
      INSERT INTO "ContextMemory" (id, user_id, key, value, created_at, updated_at)
      VALUES (gen_random_uuid(), ${userId}, ${key}, ${value}, NOW(), NOW())
      ON CONFLICT (user_id, key)
      DO UPDATE SET value = ${value}, updated_at = NOW()
      RETURNING *
    `;
    return result;
  }

  private async getContextValue(userId: string, key: string) {
    const result = await prisma.$queryRaw`
      SELECT value
      FROM "ContextMemory"
      WHERE user_id = ${userId}
        AND key = ${key}
        AND (expires_at IS NULL OR expires_at > NOW())
      LIMIT 1
    `;
    return Array.isArray(result) && result.length > 0 ? result[0].value : null;
  }

  private async evaluateTriggers(
    content: string,
    automationId: string
  ): Promise<boolean> {
    const automation = await prisma.automation.findUnique({
      where: { id: automationId },
      include: { keywords: true }
    });

    if (!automation) return false;

    // Check keyword triggers
    const hasKeywordMatch = automation.keywords.some(k => 
      content.toLowerCase().includes(k.word.toLowerCase())
    );
    if (hasKeywordMatch) return true;

    // Check custom trigger rules from the database
    const customTriggers = await prisma.trigger.findMany({
      where: { automationId }
    });

    for (const trigger of customTriggers) {
      if (content.toLowerCase().includes(trigger.type.toLowerCase())) {
        return true;
      }
    }

    return false;
  }

  public async processMessage(message: MessageContext) {
    // Store the message in history
    await prisma.$executeRaw`
      INSERT INTO "ConversationHistory" (
        id, user_id, automation_id, message_type, 
        content, metadata, created_at
      )
      VALUES (
        gen_random_uuid(), ${message.userId}, ${message.automationId}, 
        ${message.messageType}, ${message.content}, 
        ${message.metadata ? JSON.stringify(message.metadata) : null}::jsonb,
        NOW()
      )
    `;

    // Get relevant automations
    const automations = await prisma.automation.findMany({
      where: {
        userId: message.userId,
        active: true,
      },
      include: {
        listener: true,
      },
    });

    const responses: Array<{
      automationId: string;
      response: string;
      type: MessageType;
    }> = [];

    // Process each automation
    for (const automation of automations) {
      const shouldTrigger = await this.evaluateTriggers(
        message.content,
        automation.id
      );

      if (!shouldTrigger) continue;

      // Get conversation history for context
      const history = await this.getConversationHistory(message.userId);
      const contextString = history
        .map(h => `${h.messageType}: ${h.content}`)
        .join('\n');

      if (automation.listener?.listener === 'SMARTAI') {
        // Generate AI response with context
        const aiResponse = await generateResponse(
          automation.listener.prompt,
          `Previous context:\n${contextString}\n\nCurrent message: ${message.content}`
        );

        if (!aiResponse.error) {
          responses.push({
            automationId: automation.id,
            response: aiResponse.text,
            type: message.messageType
          });
        }
      } else if (automation.listener?.listener === 'MESSAGE') {
        responses.push({
          automationId: automation.id,
          response: automation.listener.commentReply || '',
          type: message.messageType
        });
      }
    }

    return responses;
  }
}

export const contextProcessor = new ContextProcessor(); 