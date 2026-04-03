import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { customProvider } from "ai";
import { isTestEnvironment } from "../constants";
import { getOpenAICompatibleRuntimeConfig, getProviderOptionsKey } from "./provider-config";
import { chatModels, getChatModelConfig, TITLE_MODEL_ID } from "./models";

export const myProvider = isTestEnvironment
  ? (() => {
      const { chatModel, titleModel } = require("./models.mock");

      return customProvider({
        languageModels: {
          ...Object.fromEntries(chatModels.map((model) => [model.id, chatModel])),
          [TITLE_MODEL_ID]: titleModel,
        },
      });
    })()
  : null;

const openAICompatibleProvider = !isTestEnvironment
  ? createOpenAICompatible(getOpenAICompatibleRuntimeConfig())
  : null;

export function getLanguageModel(modelId: string) {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(modelId);
  }

  if (!openAICompatibleProvider) {
    throw new Error("OpenAI Compatible provider is not initialized");
  }

  return openAICompatibleProvider.languageModel(modelId);
}

export function getTitleModel() {
  if (isTestEnvironment && myProvider) {
    return myProvider.languageModel(TITLE_MODEL_ID);
  }

  return getLanguageModel(TITLE_MODEL_ID);
}

export function getModelRequestProviderOptions(modelId: string) {
  if (isTestEnvironment) {
    return undefined;
  }

  const modelConfig = getChatModelConfig(modelId);

  if (!modelConfig?.providerOptions) {
    return undefined;
  }

  const providerKey = getProviderOptionsKey(
    getOpenAICompatibleRuntimeConfig().providerName
  );

  return {
    [providerKey]: modelConfig.providerOptions,
  };
}
