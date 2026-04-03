# 需求规格：将 Provider 从 Vercel AI Gateway 切换为 OpenAI Compatible Provider

## 背景

当前项目通过 AI SDK 的 `gateway.languageModel(...)` 统一接入 Vercel AI Gateway，再由 Gateway 路由到具体模型供应商。新需求要求将该链路改为直接使用 **OpenAI Compatible Provider**，并允许项目维护者通过环境变量配置 `baseURL`、模型列表以及相关 provider 属性。

本次澄清后的关键约束是：

- 模型列表**不再固定写死**在 `lib/ai/models.ts`
- 模型目录的唯一来源改为环境变量 `MODEL_LIST`
- `MODEL_LIST` 的值必须是一个 **JSON 数组字符串**

## 目标

- 将运行时模型调用从 **Vercel AI Gateway** 迁移到 **OpenAI Compatible Provider**。
- 保持现有聊天、标题生成、Artifact 生成/更新、结构化输出、工具调用等能力继续可用。
- 允许维护者通过环境变量配置 OpenAI Compatible provider 连接参数。
- 允许维护者通过 `MODEL_LIST` 环境变量动态维护模型目录，而无需修改源码中的静态模型列表。

## 范围

### In Scope

- Provider 初始化方式迁移到 `createOpenAICompatible(...)`
- `baseURL`、`apiKey`、`provider name`、可选请求头/查询参数等配置能力
- 通过 `MODEL_LIST` 管理聊天模型列表、模型展示信息、模型能力声明、模型级 `providerOptions`
- 通过环境变量配置默认聊天模型与标题模型
- 主聊天 API、标题生成、Artifacts、Suggestions 等调用链路改造
- `/api/models` 与模型选择器的数据来源改造
- `MODEL_LIST` 的格式约束、解析校验、错误处理、文档与示例
- 测试环境下 mock provider 行为保持可用

### Out of Scope

- 同时支持多个不同类型 provider 的通用插件化管理
- 自动从 OpenAI Compatible 服务端动态发现全部模型
- 迁移数据库结构
- 改造与 provider 无关的 UI/鉴权/存储逻辑
- 提供可视化后台来编辑模型列表

## 假设

1. `baseURL`、`apiKey` 等敏感连接参数通过环境变量配置，且 `OPENAI_COMPATIBLE_API_KEY` 视为必填项。
2. `MODEL_LIST` 通过 `.env.local`、Vercel 环境变量或其他部署环境注入。
3. `MODEL_LIST` 是合法 JSON 数组字符串，每个元素都符合约定的模型 schema。
4. OpenAI Compatible 上游对当前所选模型支持聊天/流式输出；是否支持 tools、vision、reasoning、structured outputs 由 `MODEL_LIST` 显式声明。
5. 测试环境仍优先使用现有 mock model，不访问真实上游。

## 用户故事

### 用户故事 1
作为部署者，我希望配置 OpenAI Compatible 供应商的 `baseURL`、`apiKey` 和附加属性，以便项目可以连接到我自己的兼容 OpenAI 接口。

### 用户故事 2
作为部署者，我希望通过一个环境变量字符串维护模型列表、默认聊天模型和标题模型，以便不改代码即可更新可用模型目录。

### 用户故事 3
作为终端用户，我希望在 provider 迁移后，聊天、标题、工具调用、Artifacts 等功能行为保持一致，以便不影响现有使用体验。

## 验收标准（EARS）

### 功能需求

#### R1. Provider 初始化
1. IF 应用运行在非测试环境 THEN 系统 SHALL 使用 `createOpenAICompatible(...)` 创建单一的 OpenAI Compatible provider 实例。
2. WHEN provider 实例被创建 THEN 系统 SHALL 从配置中读取必填的 `OPENAI_COMPATIBLE_PROVIDER_NAME`、`OPENAI_COMPATIBLE_BASE_URL`、`OPENAI_COMPATIBLE_API_KEY`，以及可选的 `OPENAI_COMPATIBLE_HEADERS_JSON`、`OPENAI_COMPATIBLE_QUERY_PARAMS_JSON`、`OPENAI_COMPATIBLE_INCLUDE_USAGE`、`OPENAI_COMPATIBLE_SUPPORTS_STRUCTURED_OUTPUTS`。
3. IF `OPENAI_COMPATIBLE_PROVIDER_NAME`、`OPENAI_COMPATIBLE_BASE_URL`、`OPENAI_COMPATIBLE_API_KEY` 中任一必填 provider 配置缺失或非法 THEN 系统 SHALL 返回可操作的错误信息，并且 SHALL NOT 回退到 Vercel AI Gateway。

#### R2. 模型目录配置
4. WHEN 系统启动或首次加载模型配置 THEN 系统 SHALL 从环境变量 `MODEL_LIST` 读取聊天模型目录。
5. WHEN 系统解析 `MODEL_LIST` THEN 系统 SHALL 将其视为一个 JSON 数组字符串，并对每个模型对象进行 schema 校验。
6. IF `MODEL_LIST` 缺失、为空、不是合法 JSON、不是数组或任一元素不符合 schema THEN 系统 SHALL 报告配置错误并阻止继续使用真实 provider 发起模型请求。
7. WHEN 维护者更新 `MODEL_LIST` 配置 THEN 系统 SHALL 使用新的模型列表作为 API 校验与前端展示的唯一来源。
8. IF `DEFAULT_CHAT_MODEL` 或 `TITLE_MODEL_ID` 未出现在 `MODEL_LIST` 中 THEN 系统 SHALL 在启动或首次访问时报告配置错误。

#### R3. MODEL_LIST schema 约束
9. WHEN 系统校验 `MODEL_LIST` THEN 每个模型对象 SHALL 至少包含 `id`、`name`、`provider`，且 `capabilities` 对象 SHALL 至少包含 `tools`、`vision`、`reasoning`；`capabilities.structuredOutputs` 为可选字段。
10. IF 两个或以上模型对象具有相同的 `id` THEN 系统 SHALL 报告重复模型 ID 错误。
11. IF 模型对象包含 `providerOptions` THEN 系统 SHALL 要求其为可 JSON 序列化的对象。
12. IF 模型对象缺失 `description` 或 `capabilities.structuredOutputs` THEN 系统 SHALL 应用实现定义的默认值，而不是解析失败。

#### R4. 聊天调用链路
13. WHEN `/api/chat` 收到请求 THEN 系统 SHALL 仅允许使用 `MODEL_LIST` 中已声明的模型 ID。
14. IF 请求中的 `selectedChatModel` 不在允许列表内 THEN 系统 SHALL 回退到 `DEFAULT_CHAT_MODEL`。
15. WHEN 聊天请求开始生成 THEN 系统 SHALL 通过 OpenAI Compatible provider 发起 `streamText(...)` 调用，而不是通过 Gateway。
16. IF 当前模型未声明支持 tools THEN 系统 SHALL 禁用该次请求中的 AI 工具列表。
17. WHEN 当前模型声明了 provider 特定请求参数 THEN 系统 SHALL 将这些参数透传到对应模型请求中。

#### R5. 标题与附属生成链路
18. WHEN 新会话需要生成标题 THEN 系统 SHALL 使用 `TITLE_MODEL_ID` 对应的模型，并通过同一个 OpenAI Compatible provider 调用 `generateText(...)`。
19. WHEN 创建或更新 text/code/sheet artifact THEN 系统 SHALL 使用当前选中的聊天模型通过同一个 provider 调用 `streamText(...)`。
20. WHEN 请求 suggestions 等结构化输出 THEN 系统 SHALL 继续支持基于 AI SDK 的结构化输出能力，前提是 provider 配置与模型能力声明允许该能力。

#### R6. 模型元数据接口
21. WHEN 前端请求 `/api/models` THEN 系统 SHALL 返回来源于 `MODEL_LIST` 的模型列表与能力信息，而不是调用 AI Gateway 模型目录接口。
22. WHEN 模型选择器展示模型 THEN 系统 SHALL 使用 `MODEL_LIST` 中的 `name`、`provider`、`description` 和能力标签进行渲染。
23. IF 浏览器中缓存的模型 ID 已失效 THEN 系统 SHALL 回退到 `DEFAULT_CHAT_MODEL`，并保持界面可用。

#### R7. 测试与兼容
24. IF 应用运行在测试环境 THEN 系统 SHALL 保持现有 mock provider / mock model 机制继续工作。
25. WHEN 迁移完成 THEN 系统 SHALL 保持现有聊天消息持久化、工具审批流、流式输出与错误处理机制不被破坏。

### 非功能需求

26. WHEN 维护者阅读项目文档 THEN 文档 SHALL 明确说明 OpenAI Compatible Provider 的配置方式、`MODEL_LIST` 的格式规则以及 `.env` 示例。
27. WHEN provider 请求失败（如 401、404、超时、模型不存在） THEN 系统 SHALL 返回可诊断的错误信息，并记录服务端日志。
28. WHEN 无法从上游动态发现模型能力 THEN 系统 SHALL 使用 `MODEL_LIST` 中的显式能力声明，避免运行时依赖外部模型目录接口。
29. WHEN 维护者在部署环境中更新模型列表 THEN 该配置方式 SHALL 不要求修改 `lib/ai/models.ts` 中的静态模型常量。

## 边界情况

- `OPENAI_COMPATIBLE_BASE_URL` 缺失、格式非法或多余 `/v1` 导致路径拼接异常
- `OPENAI_COMPATIBLE_API_KEY` 缺失
- `MODEL_LIST` 缺失
- `MODEL_LIST` 不是合法 JSON
- `MODEL_LIST` 是对象或字符串而不是数组
- `MODEL_LIST` 为空数组
- `MODEL_LIST` 中某项缺失必填字段
- `MODEL_LIST` 中存在重复 `id`
- `DEFAULT_CHAT_MODEL` 或 `TITLE_MODEL_ID` 不存在于 `MODEL_LIST`
- 浏览器 cookie 中保存了已删除模型 ID
- 某模型支持聊天但不支持 tools / vision / reasoning / structured outputs
- OpenAI Compatible 服务返回 401、403、404、429、5xx
- 上游虽兼容 OpenAI，但对部分 provider options 使用自定义字段

## 完成定义

本规格完成时，应至少具备以下产物：

- Requirements 文档
- Design 文档
- Tasks 文档
- `MODEL_LIST` 正式 schema
- `.env.example` 中的 OpenAI Compatible + `MODEL_LIST` 示例
- 可追踪到聊天、标题、Artifacts、`/api/models` 的迁移任务拆分
