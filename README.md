<a href="https://chatbot.ai-sdk.dev/demo">
  <img alt="Chatbot" src="app/(chat)/opengraph-image.png">
  <h1 align="center">Chatbot</h1>
</a>

<p align="center">
    Chatbot (formerly AI Chatbot) is a free, open-source template built with Next.js and the AI SDK that helps you quickly build powerful chatbot applications.
</p>

<p align="center">
  <a href="https://chatbot.ai-sdk.dev/docs"><strong>Read Docs</strong></a> ·
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#model-providers"><strong>Model Providers</strong></a> ·
  <a href="#deploy-your-own"><strong>Deploy Your Own</strong></a> ·
  <a href="#running-locally"><strong>Running locally</strong></a>
</p>
<br/>

## Features

- [Next.js](https://nextjs.org) App Router
  - Advanced routing for seamless navigation and performance
  - React Server Components (RSCs) and Server Actions for server-side rendering and increased performance
- [AI SDK](https://ai-sdk.dev/docs/introduction)
  - Unified API for generating text, structured objects, and tool calls with LLMs
  - Hooks for building dynamic chat and generative user interfaces
  - Uses an OpenAI Compatible provider for custom model gateway integration
- [shadcn/ui](https://ui.shadcn.com)
  - Styling with [Tailwind CSS](https://tailwindcss.com)
  - Component primitives from [Radix UI](https://radix-ui.com) for accessibility and flexibility
- Data Persistence
  - [Neon Serverless Postgres](https://vercel.com/marketplace/neon) for saving chat history and user data
  - [Vercel Blob](https://vercel.com/storage/blob) for efficient file storage
- [Auth.js](https://authjs.dev)
  - Simple and secure authentication
  - This fork requires an authenticated account before chat pages or chat APIs can be used

## Model Providers

This fork no longer uses Vercel AI Gateway as the runtime model provider. Instead, it uses the [AI SDK OpenAI Compatible provider](https://ai-sdk.dev/providers/openai-compatible-providers) so you can connect the app to any OpenAI-compatible endpoint by configuring environment variables.

### Custom provider changes

Compared with the upstream template, the following provider customizations were made:

- Runtime model calls now use `@ai-sdk/openai-compatible`
- Provider connection is configured with:
  - `OPENAI_COMPATIBLE_PROVIDER_NAME`
  - `OPENAI_COMPATIBLE_BASE_URL`
  - `OPENAI_COMPATIBLE_API_KEY`
- Model catalog is no longer hard-coded for routing; it is loaded from the `MODEL_LIST` environment variable
- Default models are controlled by:
  - `DEFAULT_CHAT_MODEL`
  - `TITLE_MODEL_ID`
- `/api/models` now returns the parsed local model registry instead of querying AI Gateway
- Model capabilities such as tool calling, vision, and reasoning are declared explicitly in `MODEL_LIST`

### Required provider environment variables

At minimum, configure the following variables:

```env
OPENAI_COMPATIBLE_PROVIDER_NAME=openaiCompatible
OPENAI_COMPATIBLE_BASE_URL=https://your-openai-compatible-endpoint.example.com/v1
OPENAI_COMPATIBLE_API_KEY=****
MODEL_LIST=[{"id":"gpt-4o-mini","name":"GPT-4o Mini","provider":"openai","description":"Fast general model","capabilities":{"tools":true,"vision":true,"reasoning":false}}]
DEFAULT_CHAT_MODEL=gpt-4o-mini
TITLE_MODEL_ID=gpt-4o-mini
```

Optional variables:

```env
OPENAI_COMPATIBLE_HEADERS_JSON={"HTTP-Referer":"https://your-app.example.com","X-App-Name":"Chatbox"}
OPENAI_COMPATIBLE_QUERY_PARAMS_JSON={"api-version":"2024-10-01"}
OPENAI_COMPATIBLE_INCLUDE_USAGE=true
OPENAI_COMPATIBLE_SUPPORTS_STRUCTURED_OUTPUTS=false
```

### MODEL_LIST format

`MODEL_LIST` must be a JSON array string. Each item should look like:

```json
{
  "id": "gpt-4o-mini",
  "name": "GPT-4o Mini",
  "provider": "openai",
  "description": "Fast general model",
  "capabilities": {
    "tools": true,
    "vision": true,
    "reasoning": false,
    "structuredOutputs": false
  },
  "providerOptions": {
    "reasoningEffort": "medium"
  }
}
```

Rules:

- `id`, `name`, `provider`, and `capabilities.tools|vision|reasoning` are required
- `description`, `capabilities.structuredOutputs`, and `providerOptions` are optional
- `id` must be unique across the list
- `id` must match the real model name accepted by your OpenAI-compatible backend

See [.env.example](.env.example) and [`specs/openai-compatible-provider/model-list.schema.json`](specs/openai-compatible-provider/model-list.schema.json) for a complete example and schema.

## Deploy Your Own

You can deploy your own version of Chatbot to Vercel with one click:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/templates/next.js/chatbot)

## Authentication behavior

This fork no longer auto-creates guest sessions for anonymous visitors.

- Unauthenticated page requests are redirected to `/login`
- Unauthenticated protected API requests return `401`
- After login or registration, the app safely redirects back to the requested page when `redirectUrl` is valid

The Auth.js route base remains `/api/auth`, configured in `app/(auth)/auth.config.ts`, and the entry protection is implemented through the root `proxy.ts` file convention used by Next.js 16.

## Running locally

You will need to use the environment variables [defined in `.env.example`](.env.example) to run Chatbot. It's recommended you use [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables) for this, but a `.env` file is all that is necessary.

> Note: You should not commit your `.env` file or it will expose secrets that will allow others to control access to your various AI and authentication provider accounts.

1. Install Vercel CLI: `npm i -g vercel`
2. Link local instance with Vercel and GitHub accounts (creates `.vercel` directory): `vercel link`
3. Download your environment variables: `vercel env pull`

```bash
pnpm install
pnpm db:migrate # Setup database or apply latest database changes
pnpm dev
```

Your app template should now be running on [localhost:3000](http://localhost:3000).
