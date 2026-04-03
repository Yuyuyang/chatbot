# 任务拆分：OpenAI Compatible Provider 迁移（基于 MODEL_LIST）

- [ ] 1. 建立 OpenAI Compatible Provider 的配置基础设施
- [ ] 1.1 新增 provider 运行时配置模块
  - 新建 `lib/ai/provider-config.ts`
  - 解析 `OPENAI_COMPATIBLE_PROVIDER_NAME`、`OPENAI_COMPATIBLE_BASE_URL`、`OPENAI_COMPATIBLE_API_KEY`
  - 支持可选 `OPENAI_COMPATIBLE_HEADERS_JSON`、`OPENAI_COMPATIBLE_QUERY_PARAMS_JSON`、`OPENAI_COMPATIBLE_INCLUDE_USAGE`、`OPENAI_COMPATIBLE_SUPPORTS_STRUCTURED_OUTPUTS`
  - 增加 provider name -> providerOptions key 的 camelCase helper
  - 为配置缺失、JSON 解析失败添加明确错误
  - _Requirements: R1_

- [ ] 1.2 更新项目依赖与环境变量示例
  - 在 `package.json` 中添加 `@ai-sdk/openai-compatible`
  - 在 `.env.example` 中移除/替换 Gateway 相关说明
  - 增加 OpenAI Compatible provider 所需环境变量
  - 增加 `MODEL_LIST`、`DEFAULT_CHAT_MODEL`、`TITLE_MODEL_ID` 示例
  - _Requirements: R1, R26_

- [ ] 2. 将模型目录来源重构为 MODEL_LIST 环境变量
- [ ] 2.1 重构 `lib/ai/models.ts` 为解析/校验模块
  - 移除 `gatewayOrder`、`getAllGatewayModels()` 等 Gateway 专属结构
  - 不再写死聊天模型数组
  - 从 `MODEL_LIST` 解析模型列表
  - 补全默认字段（如 `description`、`structuredOutputs`）
  - 校验 `id` 唯一
  - 校验 `DEFAULT_CHAT_MODEL`、`TITLE_MODEL_ID` 存在
  - _Requirements: R2, R3, R29_

- [ ] 2.2 提供统一模型目录查询接口
  - 在 `lib/ai/models.ts` 中实现 `getChatModelConfig()`、`getCapabilities()` 等辅助函数
  - 保持 `allowedModelIds`、`modelsByProvider` 等现有调用点可继续工作
  - 让模型目录完全来自 `MODEL_LIST`
  - _Requirements: R2, R6_

- [ ] 2.3 提供 MODEL_LIST 正式 schema
  - 新增 `specs/openai-compatible-provider/model-list.schema.json`
  - 让 schema 与代码中的解析规则保持一致
  - 在文档中引用该 schema
  - _Requirements: R2, R3, R26_

- [ ] 3. 将 provider 解析层从 Gateway 迁移到 OpenAI Compatible
- [ ] 3.1 修改 `lib/ai/providers.ts`
  - 保留测试环境 mock provider 分支
  - 非测试环境改为初始化 `createOpenAICompatible(...)`
  - 改造 `getLanguageModel()`、`getTitleModel()`
  - 增加读取模型级 `providerOptions` 的 helper
  - _Requirements: R1, R5, R24_

- [ ] 3.2 改造主聊天 API 的请求构造逻辑
  - 修改 `app/(chat)/api/chat/route.ts`
  - 删除 `providerOptions.gateway.order`
  - 从 `MODEL_LIST` 解析结果读取能力和 provider-specific request options
  - 保持 tools、reasoning、审批流、持久化逻辑不变
  - _Requirements: R4, R25_

- [ ] 3.3 改造标题生成与附属生成链路
  - 修改 `app/(chat)/actions.ts` 中标题生成逻辑
  - 确保 `artifacts/text/server.ts`、`artifacts/code/server.ts`、`artifacts/sheet/server.ts`、`lib/ai/tools/request-suggestions.ts` 通过统一 provider 生效
  - 如有需要，将 providerOptions 注入抽象为可复用 helper
  - _Requirements: R5_

- [ ] 4. 改造模型元数据 API 与前端选择器
- [ ] 4.1 修改 `/api/models` 返回 MODEL_LIST 模型目录
  - 修改 `app/(chat)/api/models/route.ts`
  - 返回 `{ models, capabilities }`
  - 移除对 Gateway 远程目录接口的依赖
  - _Requirements: R6, R28_

- [ ] 4.2 调整模型选择器逻辑
  - 修改 `components/chat/multimodal-input.tsx`
  - 移除“curated + Gateway 动态模型”拼接逻辑
  - 直接使用服务端返回的模型列表
  - 当 cookie 中模型不存在时回退默认模型
  - 保持 provider 分组、能力图标展示正常
  - _Requirements: R6_

- [ ] 5. 更新文档与迁移说明
- [ ] 5.1 更新项目文档
  - 更新 `docs/models-and-providers.md`
  - 如有必要更新 `README.md`
  - 说明如何配置 OpenAI Compatible Provider
  - 说明 `MODEL_LIST` 的格式规则、约束和示例
  - _Requirements: R26, R29_

- [ ] 5.2 清理 Gateway 叙述与遗留实现
  - 检查并删除与 Vercel AI Gateway 强绑定的说明、注释与死代码
  - 确保不再存在真实运行路径回退 Gateway 的逻辑
  - _Requirements: R1, R25, R28_

- [ ] 6. 验证与测试
- [ ] 6.1 补充/更新测试
  - 更新与 `MODEL_LIST` 解析、provider 解析、`/api/models` 相关的单元/集成测试
  - 保证测试环境继续走 mock provider
  - 覆盖 `MODEL_LIST` 非法 JSON、空数组、重复 ID、默认模型缺失等场景
  - _Requirements: R2, R3, R24, R25_

- [ ] 6.2 执行手工验证清单
  - 验证聊天、标题、Artifact、Suggestions、工具调用
  - 验证 provider 配置错误、模型不存在、cookie 失效等异常场景
  - 验证修改 `MODEL_LIST` 后模型选择器和后端校验同步生效
  - 记录验证结果并对 spec 中的未决问题做回填
  - _Requirements: R4, R5, R6, R27_
