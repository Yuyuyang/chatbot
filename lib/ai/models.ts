import { z } from "zod";
import { isTestEnvironment } from "../constants";

type JsonPrimitive = string | number | boolean | null;
type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
type JsonObject = { [key: string]: JsonValue };

type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  structuredOutputs?: boolean;
};

type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: ModelCapabilities;
  providerOptions?: JsonObject;
};

const fallbackTestModels: ChatModel[] = [
  {
    id: "moonshotai/kimi-k2-0905",
    name: "Kimi K2 0905",
    provider: "moonshotai",
    description: "Fast model with tool use",
    capabilities: {
      tools: true,
      vision: false,
      reasoning: false,
      structuredOutputs: true,
    },
  },
  {
    id: "mistral/mistral-small",
    name: "Mistral Small",
    provider: "mistral",
    description: "Fast model for title generation",
    capabilities: {
      tools: true,
      vision: true,
      reasoning: false,
      structuredOutputs: true,
    },
  },
  {
    id: "mistral/codestral",
    name: "Codestral",
    provider: "mistral",
    description: "Code-focused model with tool use",
    capabilities: {
      tools: true,
      vision: false,
      reasoning: false,
      structuredOutputs: true,
    },
  },
];

const modelCapabilitiesSchema = z.object({
  tools: z.boolean(),
  vision: z.boolean(),
  reasoning: z.boolean(),
  structuredOutputs: z.boolean().optional().default(false),
});

const jsonValueSchema: z.ZodType<JsonValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.null(),
    z.array(jsonValueSchema),
    z.record(jsonValueSchema),
  ])
);

const jsonObjectSchema: z.ZodType<JsonObject> = z.record(jsonValueSchema);

const chatModelSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  provider: z.string().trim().min(1).regex(/^[a-z0-9-]+$/),
  description: z.string().default(""),
  capabilities: modelCapabilitiesSchema,
  providerOptions: jsonObjectSchema.optional(),
});

const chatModelsSchema = z.array(chatModelSchema).min(1);

type ModelRegistry = {
  chatModels: ChatModel[];
  defaultChatModelId: string;
  titleModelId: string;
};

let cachedRegistry: ModelRegistry | null = null;

function getRawModelList(): string {
  if (process.env.MODEL_LIST?.trim()) {
    return process.env.MODEL_LIST;
  }

  if (isTestEnvironment) {
    return JSON.stringify(fallbackTestModels);
  }

  throw new Error(
    "Missing required environment variable: MODEL_LIST"
  );
}

function parseModelList(rawModelList: string): ChatModel[] {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawModelList);
  } catch {
    throw new Error("MODEL_LIST must be a valid JSON array string");
  }

  const result = chatModelsSchema.safeParse(parsed);

  if (!result.success) {
    throw new Error(`MODEL_LIST is invalid: ${result.error.message}`);
  }

  const modelIds = new Set<string>();

  for (const model of result.data) {
    if (modelIds.has(model.id)) {
      throw new Error(`MODEL_LIST contains duplicate model id: ${model.id}`);
    }
    modelIds.add(model.id);
  }

  return result.data;
}

function getDefaultChatModelId(models: ChatModel[]): string {
  const defaultModelId =
    process.env.DEFAULT_CHAT_MODEL?.trim() ||
    (isTestEnvironment ? models[0]?.id : "");

  if (!defaultModelId) {
    throw new Error("Missing required environment variable: DEFAULT_CHAT_MODEL");
  }

  if (!models.some((model) => model.id === defaultModelId)) {
    throw new Error(
      `DEFAULT_CHAT_MODEL must match a model id in MODEL_LIST: ${defaultModelId}`
    );
  }

  return defaultModelId;
}

function getTitleModelId(models: ChatModel[]): string {
  const titleModelId =
    process.env.TITLE_MODEL_ID?.trim() ||
    (isTestEnvironment ? "mistral/mistral-small" : "");

  if (!titleModelId) {
    throw new Error("Missing required environment variable: TITLE_MODEL_ID");
  }

  if (!models.some((model) => model.id === titleModelId)) {
    throw new Error(
      `TITLE_MODEL_ID must match a model id in MODEL_LIST: ${titleModelId}`
    );
  }

  return titleModelId;
}

function getModelRegistry(): ModelRegistry {
  if (cachedRegistry) {
    return cachedRegistry;
  }

  const models = parseModelList(getRawModelList());

  cachedRegistry = {
    chatModels: models,
    defaultChatModelId: getDefaultChatModelId(models),
    titleModelId: getTitleModelId(models),
  };

  return cachedRegistry;
}

const registry = getModelRegistry();

const DEFAULT_CHAT_MODEL = registry.defaultChatModelId;
const TITLE_MODEL_ID = registry.titleModelId;
const chatModels: ChatModel[] = registry.chatModels;

const allowedModelIds = new Set(chatModels.map((model) => model.id));

const modelsByProvider = chatModels.reduce(
  (acc, model) => {
    if (!acc[model.provider]) {
      acc[model.provider] = [];
    }

    acc[model.provider].push(model);
    return acc;
  },
  {} as Record<string, ChatModel[]>
);

const titleModel =
  chatModels.find((model) => model.id === TITLE_MODEL_ID) ?? chatModels[0];

function getCapabilities(): Record<string, ModelCapabilities> {
  return Object.fromEntries(
    chatModels.map((model) => [model.id, model.capabilities])
  );
}

function getChatModelConfig(modelId: string): ChatModel | undefined {
  return chatModels.find((model) => model.id === modelId);
}

function getActiveModels(): ChatModel[] {
  return chatModels;
}

export {
  allowedModelIds,
  chatModels,
  DEFAULT_CHAT_MODEL,
  getActiveModels,
  getCapabilities,
  getChatModelConfig,
  modelsByProvider,
  titleModel,
  TITLE_MODEL_ID,
};

export type { ChatModel, ModelCapabilities };
