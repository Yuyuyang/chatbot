"use server";

import { generateText, type UIMessage } from "ai";
import { cookies } from "next/headers";
import { auth } from "@/app/(auth)/auth";
import type { VisibilityType } from "@/components/chat/visibility-selector";
import { TITLE_MODEL_ID } from "@/lib/ai/models";
import { conversationTitlePrompt, titlePrompt } from "@/lib/ai/prompts";
import {
  getModelRequestProviderOptions,
  getTitleModel,
} from "@/lib/ai/providers";
import {
  deleteMessagesByChatIdAfterTimestamp,
  getChatById,
  getMessageById,
  getMessagesByChatId,
  updateChatTitleById,
  updateChatVisibilityById,
} from "@/lib/db/queries";
import type { DBMessage } from "@/lib/db/schema";
import { getTextFromMessage } from "@/lib/utils";

const MAX_CONVERSATION_TITLE_SOURCE_LENGTH = 3000;

type TitleGenerationReason =
  | "unauthorized"
  | "not_found"
  | "forbidden"
  | "no_content"
  | "invalid_title"
  | "update_failed";

export type RegenerateChatTitleResult =
  | {
      success: true;
      chatId: string;
      title: string;
    }
  | {
      success: false;
      reason: TitleGenerationReason;
    };

export async function saveChatModelAsCookie(model: string) {
  const cookieStore = await cookies();
  cookieStore.set("chat-model", model);
}

function sanitizeGeneratedTitle(text: string) {
  return text
    .replace(/^[#*"\s]+/, "")
    .replace(/["]+$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

async function generateTitleFromText({
  input,
  systemPrompt,
}: {
  input: string;
  systemPrompt: string;
}) {
  const titleModelProviderOptions =
    getModelRequestProviderOptions(TITLE_MODEL_ID);

  const { text } = await generateText({
    model: getTitleModel(),
    system: systemPrompt,
    prompt: input,
    ...(titleModelProviderOptions && {
      providerOptions: titleModelProviderOptions,
    }),
  });

  return sanitizeGeneratedTitle(text);
}

export function generateTitleFromUserMessage({
  message,
}: {
  message: UIMessage;
}) {
  return generateTitleFromText({
    input: getTextFromMessage(message),
    systemPrompt: titlePrompt,
  });
}

function buildConversationTitleSource(messages: DBMessage[]) {
  const conversationLines = messages
    .filter(
      (message) => message.role === "user" || message.role === "assistant"
    )
    .flatMap((message) => {
      if (!Array.isArray(message.parts)) {
        return [];
      }

      const text = message.parts
        .filter(
          (
            part
          ): part is {
            type: "text";
            text: string;
          } =>
            typeof part === "object" &&
            part !== null &&
            "type" in part &&
            "text" in part &&
            part.type === "text" &&
            typeof part.text === "string"
        )
        .map((part) => part.text.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .join(" ");

      if (!text) {
        return [];
      }

      const speaker = message.role === "user" ? "User" : "Assistant";
      return [`${speaker}: ${text}`];
    });

  if (conversationLines.length === 0) {
    return "";
  }

  const firstMeaningfulIndex = conversationLines.findIndex((line) =>
    line.startsWith("User:")
  );
  const firstLine =
    conversationLines[firstMeaningfulIndex >= 0 ? firstMeaningfulIndex : 0];

  if (firstLine.length >= MAX_CONVERSATION_TITLE_SOURCE_LENGTH) {
    return firstLine.slice(0, MAX_CONVERSATION_TITLE_SOURCE_LENGTH);
  }

  const selectedRecentLines: string[] = [];
  let remainingCharacters =
    MAX_CONVERSATION_TITLE_SOURCE_LENGTH - firstLine.length;

  for (let i = conversationLines.length - 1; i >= 0; i--) {
    if (i === (firstMeaningfulIndex >= 0 ? firstMeaningfulIndex : 0)) {
      continue;
    }

    const line = conversationLines[i];
    const separatorLength = selectedRecentLines.length > 0 ? 2 : 0;
    const requiredLength = line.length + separatorLength;

    if (requiredLength <= remainingCharacters) {
      selectedRecentLines.unshift(line);
      remainingCharacters -= requiredLength;
    }
  }

  return [firstLine, ...selectedRecentLines].join("\n\n");
}

export async function regenerateChatTitle({
  chatId,
}: {
  chatId: string;
}): Promise<RegenerateChatTitleResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { success: false, reason: "unauthorized" };
  }

  const chat = await getChatById({ id: chatId });
  if (!chat) {
    return { success: false, reason: "not_found" };
  }

  if (chat.userId !== session.user.id) {
    return { success: false, reason: "forbidden" };
  }

  const messages = await getMessagesByChatId({ id: chatId });
  const titleSource = buildConversationTitleSource(messages);

  if (!titleSource) {
    return { success: false, reason: "no_content" };
  }

  const title = await generateTitleFromText({
    input: titleSource,
    systemPrompt: conversationTitlePrompt,
  });

  if (!title) {
    return { success: false, reason: "invalid_title" };
  }

  const updated = await updateChatTitleById({ chatId, title });

  if (!updated) {
    return { success: false, reason: "update_failed" };
  }

  return {
    success: true,
    chatId,
    title,
  };
}

export async function deleteTrailingMessages({ id }: { id: string }) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const [message] = await getMessageById({ id });
  if (!message) {
    throw new Error("Message not found");
  }

  const chat = await getChatById({ id: message.chatId });
  if (!chat || chat.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await deleteMessagesByChatIdAfterTimestamp({
    chatId: message.chatId,
    timestamp: message.createdAt,
  });
}

export async function updateChatVisibility({
  chatId,
  visibility,
}: {
  chatId: string;
  visibility: VisibilityType;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const chat = await getChatById({ id: chatId });
  if (!chat || chat.userId !== session.user.id) {
    throw new Error("Unauthorized");
  }

  await updateChatVisibilityById({ chatId, visibility });
}
