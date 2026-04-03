# 设计文档：OpenAI Compatible Provider 迁移（基于 MODEL_LIST）

## Overview

本设计将项目当前基于 Vercel AI Gateway 的模型调用链路，迁移为基于 AI SDK `@ai-sdk/openai-compatible` 的直连 provider。迁移后：

- 所有真实运行环境的 LLM 请求都通过一个 OpenAI Compatible provider 实例发出。
- 模型列表与模型能力不再从 AI Gateway 远端目录获取，也不再固定写死在 `lib/ai/models.ts`。
- 模型目录的唯一来源改为环境变量 `MODEL_LIST`，其值是一个 JSON 数组字符串。
- 测试环境仍复用现有 `customProvider + mock model` 方案。

该方案优先保证：

1. 对现有聊天功能改动最小；
2. Provider 配置集中、可读、可维护；
3. 模型变更优先通过环境变量完成，而不是改源码；
4. 不再依赖 Gateway 专有能力（如 `gatewayOrder`、远程模型目录）。

---

## Architecture

### Current

```mermaid
flowchart LR
  UI[useChat / DefaultChatTransport] --> ChatAPI[/api/chat]
  ChatAPI --> AI_SDK[AI SDK streamText/generateText]
  AI_SDK --> Gateway[gateway.languageModel(...)]
  Gateway --> Upstream[OpenAI / Mistral / xAI / ... via Vercel AI Gateway]
```

### Target

```mermaid
flowchart LR
  UI[useChat / DefaultChatTransport] --> ChatAPI[/api/chat]
  ChatAPI --> AI_SDK[AI SDK streamText/generateText]
  AI_SDK --> Provider[createOpenAICompatible(...)]
  Provider --> Upstream[OpenAI-compatible baseURL]

  Env[MODEL_LIST + DEFAULT_CHAT_MODEL + TITLE_MODEL_ID] --> ModelRegistry[lib/ai/models.ts parser/validator]
  ModelRegistry --> ModelAPI[/api/models]
  ModelRegistry --> ChatAPI
  ModelRegistry --> Actions[title / artifacts / suggestions]
```

### Key Changes

1. `lib/ai/providers.ts`
   - 从 `gateway.languageModel(modelId)` 改为 `openAICompatibleProvider.languageModel(modelId)`。
2. `lib/ai/models.ts`
   - 从“静态模型配置 + Gateway 远程模型能力探测”改为“解析 `MODEL_LIST` + 本地校验 + helper 输出”。
3. `app/(chat)/api/models/route.ts`
   - 从远程 Gateway 模型目录读取改为返回 `MODEL_LIST` 解析结果。
4. `app/(chat)/api/chat/route.ts`
   - 删除 `providerOptions.gateway.order` 等 Gateway 专属逻辑。
5. 文档与环境变量
   - 将 `AI_GATEWAY_API_KEY` 替换为 OpenAI Compatible 所需配置，并增加 `MODEL_LIST` / `DEFAULT_CHAT_MODEL` / `TITLE_MODEL_ID`。

---

## Components and Interfaces

### 1. Provider 配置模块

**建议新增文件：** `lib/ai/provider-config.ts`

**职责：**
- 集中解析 provider 相关环境变量
- 生成 OpenAI Compatible provider 初始化参数
- 做启动期/首次使用期配置校验
- 提供 provider 名称的规范化（用于 providerOptions key）

**建议接口：**

```ts
export type OpenAICompatibleRuntimeConfig = {
  providerName: string;
  baseURL: string;
  apiKey: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  includeUsage?: boolean;
  supportsStructuredOutputs?: boolean;
};

export function getOpenAICompatibleRuntimeConfig(): OpenAICompatibleRuntimeConfig;
export function getProviderOptionsKey(providerName: string): string;
```

**配置来源：**
- `OPENAI_COMPATIBLE_PROVIDER_NAME`
- `OPENAI_COMPATIBLE_BASE_URL`
- `OPENAI_COMPATIBLE_API_KEY`
- `OPENAI_COMPATIBLE_HEADERS_JSON`（可选）
- `OPENAI_COMPATIBLE_QUERY_PARAMS_JSON`（可选）
- `OPENAI_COMPATIBLE_INCLUDE_USAGE`（可选）
- `OPENAI_COMPATIBLE_SUPPORTS_STRUCTURED_OUTPUTS`（可选）

> `headers/queryParams` 使用 JSON 字符串，以便在环境变量中承载复杂配置。

---

### 2. 模型目录解析模块

**修改文件：** `lib/ai/models.ts`

该文件不再承担“静态写死模型列表”的职责，而是承担：
- 定义模型 schema 对应的 TypeScript 类型
- 解析 `MODEL_LIST`
- 校验 `DEFAULT_CHAT_MODEL` / `TITLE_MODEL_ID`
- 对外暴露 `chatModels`、`allowedModelIds`、`modelsByProvider`、`getCapabilities()` 等 helper

**建议数据结构：**

```ts
export type ModelCapabilities = {
  tools: boolean;
  vision: boolean;
  reasoning: boolean;
  structuredOutputs?: boolean;
};

export type ChatModel = {
  id: string;
  name: string;
  provider: string;
  description: string;
  capabilities: ModelCapabilities;
  providerOptions?: Record<string, unknown>;
};

export const DEFAULT_CHAT_MODEL: string;
export const TITLE_MODEL_ID: string;
export const chatModels: ChatModel[];
export const allowedModelIds: Set<string>;
export const modelsByProvider: Record<string, ChatModel[]>;
export function getCapabilities(): Record<string, ModelCapabilities>;
export function getChatModelConfig(modelId: string): ChatModel | undefined;
```

**环境变量来源：**
- `MODEL_LIST`
- `DEFAULT_CHAT_MODEL`
- `TITLE_MODEL_ID`

**核心解析流程：**
1. 读取原始 `MODEL_LIST` 字符串
2. `JSON.parse(...)`
3. 校验顶层必须是数组
4. 校验每个元素满足 schema
5. 将缺省字段补全（如 `description: ""`、`structuredOutputs: false`）
6. 校验 `id` 唯一
7. 校验默认模型和标题模型存在
8. 导出只读模型目录

**为什么用环境变量模型目录？**
- 便于部署时调整模型而不改代码
- 适合不同环境使用不同模型集合
- 更符合“供应商连接参数 + 模型目录”一并在部署环境配置的诉求

---

### 3. MODEL_LIST 正式格式规则

`MODEL_LIST` 必须是一个 JSON 数组字符串。数组元素是模型对象，每个模型对象遵循以下结构：

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
    "structuredOutputs": true
  },
  "providerOptions": {
    "reasoningEffort": "medium"
  }
}
```

**字段约束：**
- `id`: 必填，字符串，非空，唯一，真实传给上游的模型名
- `name`: 必填，字符串，非空，前端展示名
- `provider`: 必填，字符串，非空，仅用于 UI 分组和 logo
- `description`: 可选，字符串，缺省时补成空字符串
- `capabilities.tools`: 必填，布尔值
- `capabilities.vision`: 必填，布尔值
- `capabilities.reasoning`: 必填，布尔值
- `capabilities.structuredOutputs`: 可选，布尔值，缺省时补成 `false`
- `providerOptions`: 可选，对象，必须可 JSON 序列化

**说明：**
- `provider` 只影响 UI，不决定请求发往哪里；请求目标由 `OPENAI_COMPATIBLE_BASE_URL` 决定。
- `providerOptions` 是模型级额外请求参数，会被注入到 `providerOptions.<providerNameCamelCase>`。

---

### 4. Provider 解析模块

**修改文件：** `lib/ai/providers.ts`

**当前行为：**
- 测试环境：`customProvider` + mock model
- 非测试环境：`gateway.languageModel(modelId)`

**目标行为：**
- 测试环境：保持原样
- 非测试环境：初始化一次 `createOpenAICompatible(...)`

**建议接口：**

```ts
export function getLanguageModel(modelId: string): LanguageModel;
export function getTitleModel(): LanguageModel;
export function getModelRequestProviderOptions(modelId: string): Record<string, unknown> | undefined;
```

**请求级 provider options 处理策略：**
- OpenAI Compatible Provider 的 `providerOptions` key 依赖 provider 名称。
- 例如 provider name 为 `my-provider` 时，请求体应使用 `providerOptions.myProvider`。
- 因此需要一个辅助函数将 provider name 转换为 camelCase key。
- 每个模型可在 `MODEL_LIST` 中声明 `providerOptions`，请求时动态注入。

**示例：**

```ts
const providerOptionsKey = getProviderOptionsKey(runtimeConfig.providerName);

return model.providerOptions
  ? { [providerOptionsKey]: model.providerOptions }
  : undefined;
```

---

### 5. 聊天 API

**修改文件：** `app/(chat)/api/chat/route.ts`

**需要保留：**
- 认证
- 速率限制
- 消息持久化
- `convertToModelMessages(...)`
- `streamText(...)`
- 工具调用、审批流、流式 UI 输出

**需要移除/替换：**
- `providerOptions.gateway.order`
- 基于 Gateway 远程接口拉取能力

**新的请求构造逻辑：**
1. 校验 `selectedChatModel` 是否在 `allowedModelIds`
2. 从 `MODEL_LIST` 解析结果中读取 `capabilities`
3. 根据 `capabilities.tools` 决定 `experimental_activeTools`
4. 根据模型的 `providerOptions` 构造请求级 `providerOptions`
5. 调用 `streamText({ model: getLanguageModel(chatModel), ... })`

**兼容性考虑：**
- `supportsTools === false` 时，保持当前“禁用工具列表”的行为
- `reasoning` 仅用于 UI 决定是否发送 reasoning 内容，不再依赖远程 Gateway metadata

---

### 6. 标题生成 Server Action

**修改文件：** `app/(chat)/actions.ts`

**改造方案：**
- 标题模型来自 `TITLE_MODEL_ID`
- 删除 `gateway` 相关 `providerOptions`
- 如标题模型在 `MODEL_LIST` 中声明了 `providerOptions`，同样通过统一 helper 注入

---

### 7. `/api/models` 接口

**修改文件：** `app/(chat)/api/models/route.ts`

**目标行为：**
- 始终返回 `MODEL_LIST` 解析后的 `models + capabilities`
- 不再依赖 `isDemo` 分支或 Gateway 远程目录

**建议返回结构：**

```ts
{
  models: ChatModel[];
  capabilities: Record<string, ModelCapabilities>;
}
```

这样可以让前端模型选择器统一使用服务端返回的模型目录，避免前端静态构建和环境变量配置不一致。

---

### 8. 前端模型选择器

**相关文件：** `components/chat/multimodal-input.tsx`

前端已有 `/api/models` 拉取逻辑，因此无需大改，只需要保证：
- 服务端始终返回 `models + capabilities`
- 当本地 cookie 里的模型不存在时，回退默认模型
- 删除“静态 curated 模型 + Gateway 动态模型拼接”的特殊逻辑
- 直接以服务端返回模型列表作为展示来源

---

## Data Models

### OpenAICompatibleRuntimeConfig

| Field | Type | Required | Description |
|---|---|---:|---|
| providerName | string | Yes | Provider 实例名，同时影响 request `providerOptions` key |
| baseURL | string | Yes | OpenAI Compatible API base URL |
| apiKey | string | Yes | 认证密钥 |
| headers | Record<string, string> | No | 自定义请求头 |
| queryParams | Record<string, string> | No | 自定义查询参数 |
| includeUsage | boolean | No | 是否在流式响应中包含 usage |
| supportsStructuredOutputs | boolean | No | provider 是否支持结构化输出 |

### ChatModel

| Field | Type | Required | Description |
|---|---|---:|---|
| id | string | Yes | 模型 ID，即最终传给上游的 `model` 值 |
| name | string | Yes | UI 展示名 |
| provider | string | Yes | UI 分组/Logo 用 provider 标识 |
| description | string | No | 模型描述，缺省时补空字符串 |
| capabilities | ModelCapabilities | Yes | 来自 `MODEL_LIST` 的能力标签 |
| providerOptions | Record<string, unknown> | No | 模型级 provider 参数 |

### ModelCapabilities

| Field | Type | Required | Description |
|---|---|---:|---|
| tools | boolean | Yes | 是否支持工具调用 |
| vision | boolean | Yes | 是否支持视觉输入 |
| reasoning | boolean | Yes | 是否启用 reasoning UI 逻辑 |
| structuredOutputs | boolean | No | 是否适合结构化输出，缺省时为 false |

---

## Error Handling

### 错误分类

1. **配置错误**
   - 缺失 `OPENAI_COMPATIBLE_BASE_URL`
   - 缺失 `OPENAI_COMPATIBLE_API_KEY`
   - 缺失 `MODEL_LIST`
   - `MODEL_LIST` JSON 解析失败
   - `MODEL_LIST` 为空数组
   - 默认模型缺失
   - `providerOptions` 不是对象

2. **请求构造错误**
   - `selectedChatModel` 无效
   - provider options key 构造错误
   - title model 不存在

3. **上游服务错误**
   - 401/403 鉴权失败
   - 404 模型不存在
   - 429 限流
   - 5xx 服务端异常

### 处理策略

| 场景 | 系统行为 |
|---|---|
| `MODEL_LIST` 缺失或非法 | 抛出明确错误，不回退 Gateway |
| 默认模型失效 | 记录错误并阻止继续调用 |
| 用户传入模型无效 | 回退默认模型 |
| cookie 中模型已删除 | 前端选择器回退默认模型 |
| 上游 401/403 | 返回“provider 认证失败”类错误 |
| 上游 404 | 返回“模型不存在或 baseURL 配置错误”类错误 |
| 上游 429 | 保留现有错误提示通路并记录日志 |

---

## Testing Strategy

### Unit Tests

1. `lib/ai/provider-config.ts`
   - 环境变量解析
   - JSON 配置解析
   - 缺失配置报错
   - providerOptions key camelCase 转换

2. `lib/ai/models.ts`
   - `MODEL_LIST` JSON 解析
   - schema 校验
   - 重复 ID 校验
   - `DEFAULT_CHAT_MODEL` / `TITLE_MODEL_ID` 校验
   - `allowedModelIds`、`modelsByProvider`、`getCapabilities()` 输出

3. `lib/ai/providers.ts`
   - 测试环境走 mock provider
   - 非测试环境走 OpenAI Compatible provider

### Integration Tests

1. `/api/chat`
   - 有效模型调用成功
   - 无效模型回退默认模型
   - tools 开关按模型能力生效
   - providerOptions 注入正确

2. `/api/models`
   - 返回 `MODEL_LIST` 解析后的模型列表与能力
   - 不再访问 Gateway 接口

3. `generateTitleFromUserMessage`
   - 使用 `TITLE_MODEL_ID`

### Manual Verification

1. 配置一个 OpenAI Compatible baseURL 与 API key
2. 配置 `MODEL_LIST`、`DEFAULT_CHAT_MODEL`、`TITLE_MODEL_ID`
3. 打开模型选择器，确认显示 `MODEL_LIST` 中的模型
4. 发起聊天，确认流式输出正常
5. 测试一个支持 tools 的模型与一个不支持 tools 的模型
6. 测试标题生成、artifact 创建/更新、suggestions
7. 删除 cookie 中旧模型或更换 `MODEL_LIST`，确认回退逻辑可用

---

## Design Decisions

### Decision 1：模型能力改为 MODEL_LIST 显式声明
**Context:** OpenAI Compatible Provider 没有统一且稳定的能力探测接口。  
**Options Considered:**
1. 继续运行时探测远程能力接口 —— 优点：理论上自动化；缺点：不同上游不统一，可靠性差。
2. 将能力写入 `MODEL_LIST` —— 优点：稳定、可控；缺点：需要维护者手动维护。

**Decision:** 采用 `MODEL_LIST` 显式配置。  
**Rationale:** 这是兼容 OpenAI-compatible 生态差异的最稳妥方案。

### Decision 2：模型列表由环境变量统一管理
**Context:** 用户明确要求模型列表更新方便，不应固定写死在 `lib/ai/models.ts`。  
**Options Considered:**
1. 使用仓库内 TypeScript 常量维护模型列表。
2. 使用环境变量 `MODEL_LIST` 维护模型列表。

**Decision:** 使用环境变量 `MODEL_LIST` 作为唯一模型目录来源。  
**Rationale:** 更符合部署层配置诉求，也避免为增删模型改动源码。

### Decision 3：保留测试环境 mock provider
**Context:** 现有测试环境依赖 mock model，避免真实联网。  
**Decision:** 保留现有 `customProvider` mock 路径。  
**Rationale:** 降低迁移风险，保持测试稳定性。
