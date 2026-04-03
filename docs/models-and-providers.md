---
title: Models and Providers
description: Switch between different models and providers.
product: Chat SDK
type: guide
summary: Configure AI SDK Gateway to use models from OpenAI, Anthropic, Google, xAI, and other providers.
prerequisites:
  - /docs/setup
related:
  - /docs/customization/artifacts
---

# Models and Providers

Chatbot uses [AI SDK Gateway](https://ai-sdk.dev/providers/ai-sdk-providers/ai-gateway) as the default provider, which provides unified access to multiple AI models including xAI's Grok models. Since Chatbot is powered by the [AI SDK](https://ai-sdk.dev/), which supports [multiple providers](https://ai-sdk.dev/providers/ai-sdk-providers) out of the box, you can always switch to a different provider of your choice, anytime.

## Updating Models

To update the models, you will need to update the custom provider called `myProvider` shown below.

```ts title="lib/ai/models.ts"
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { gateway } from "@ai-sdk/gateway";

export const myProvider = customProvider({
  languageModels: {
    "chat-model": gateway.languageModel("xai/grok-2-vision-1212"),
    "chat-model-reasoning": wrapLanguageModel({
      model: gateway.languageModel('xai/grok-3-mini-beta'),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": gateway.languageModel("xai/grok-2-1212"),
    "artifact-model": gateway.languageModel("xai/grok-2-1212"),
  },
});
```

You can replace the models with any other provider supported by the AI SDK Gateway. The gateway provides access to models from OpenAI, Anthropic, Google, xAI, and many other providers through a unified interface.

For example, if you want to use Anthropic's `claude-3-5-sonnet` model for `chat-model`, you can update the model identifier as shown below.

```ts title="lib/ai/models.ts"
import { customProvider, extractReasoningMiddleware, wrapLanguageModel } from "ai";
import { gateway } from "@ai-sdk/gateway";

export const myProvider = customProvider({
  languageModels: {
    "chat-model": gateway.languageModel("anthropic/claude-3-5-sonnet-20241022"), // Using Anthropic model via gateway
    "chat-model-reasoning": wrapLanguageModel({
      model: gateway.languageModel('xai/grok-3-mini-beta'),
      middleware: extractReasoningMiddleware({ tagName: "think" }),
    }),
    "title-model": gateway.languageModel("xai/grok-2-1212"),
    "artifact-model": gateway.languageModel("xai/grok-2-1212"),
  },
});
```

You can find the provider library and model names in the [provider](https://ai-sdk.dev/providers/ai-sdk-providers)'s documentation. Once you have updated the models, you should be able to use the new models in your chatbot.
