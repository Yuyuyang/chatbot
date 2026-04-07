# 任务拆分：支持中英双语 UI，并允许用户在右上角切换语言

- [ ] 1. 建立双语 UI 的基础设施
- [ ] 1.1 新增 locale 配置与请求解析 helper
  - 新增 `lib/i18n/config.ts`、`lib/i18n/get-request-locale.ts` 等基础模块
  - 定义 `AppLocale`、默认语言、cookie 名称与支持语言校验逻辑
  - 实现 cookie -> `Accept-Language` -> 默认值 的解析优先级
  - _Requirements: R1, R4, R7_

- [ ] 1.2 新增中英文词典与统一取词能力
  - 新增 `en`、`zh-CN` 两套词典文件
  - 定义统一 dictionary 结构、点路径 key 约定与 `t()` / fallback 机制
  - 补齐 history、theme toggle、toast、visibility、suggestions 等关键文案分组
  - 缺失翻译时回退英文，避免 UI 崩溃
  - _Requirements: R5, R7_

- [ ] 1.3 将 locale 接入根布局与全局 provider
  - 修改 `app/layout.tsx`，按请求语言设置 `<html lang>`
  - 新增 I18n Provider / hook，供 client component 读取当前语言与翻译文本
  - 确保服务端与客户端使用同一份 locale / dictionary
  - _Requirements: R1, R5, R6, R7_

- [ ] 2. 实现语言切换与持久化
- [ ] 2.1 新增语言偏好写入接口
  - 新增 locale persistence route handler：`app/api/preferences/locale/route.ts`
  - 校验目标语言是否合法
  - 成功后写入语言 cookie，失败时返回可诊断错误
  - _Requirements: R2, R3, R4, R7_

- [ ] 2.2 实现可复用的右上角语言切换器组件
  - 新增 `components/chat/language-selector.tsx`
  - 复用现有下拉菜单 / 按钮组件展示 `English` 与 `中文`
  - 支持当前语言高亮、切换时 pending 状态、`router.refresh()` 与失败 toast
  - _Requirements: R2, R3, R4, R7, R8_

- [ ] 2.3 将语言切换器接入登录 / 注册页面右上角
  - 修改 `app/(auth)/layout.tsx`
  - 保留现有 Back 链接，同时将切换器放到顶部右侧
  - 处理窄屏响应式布局，避免与 Back 链接重叠
  - 确保移动端与桌面端均可见
  - _Requirements: R2, R3, R8_

- [ ] 2.4 将语言切换器接入聊天主界面顶部右上角
  - 修改 `components/chat/chat-header.tsx`
  - 与现有侧边栏按钮、可见性选择器共存
  - 切换语言后保持当前聊天路由不变
  - _Requirements: R2, R3, R4_

- [ ] 3. 本地化鉴权与入口界面文案
- [ ] 3.1 本地化登录 / 注册文案与交互提示
  - 修改 `app/(auth)/login/page.tsx`、`app/(auth)/register/page.tsx`
  - 本地化标题、副标题、按钮、辅助链接与基于 `@/components/chat/toast` 的错误 / 成功提示
  - _Requirements: R5, R6_

- [ ] 3.2 本地化认证表单与通用按钮文案
  - 修改 `components/chat/auth-form.tsx`、`components/chat/submit-button.tsx`
  - 本地化 Email / Password 标签、placeholder、提交状态文案
  - _Requirements: R5, R6_

- [ ] 3.3 本地化 preview 与 auth layout 静态文案
  - 修改 `components/chat/preview.tsx`
  - 复查并补齐 `app/(auth)/layout.tsx` 中除切换器结构外的静态文案，如 Back、顶部说明等
  - 本地化 Powered by 区域内预置文案、预览欢迎语与输入占位文案
  - _Requirements: R2, R5, R6_

- [ ] 4. 本地化聊天主界面文案
- [ ] 4.1 本地化欢迎语与建议问题策略
  - 修改 `components/chat/greeting.tsx`、`components/chat/suggested-actions.tsx`、`lib/constants.ts` 或等价 locale 数据源
  - 为 `en` 与 `zh-CN` 维护两套建议问题集合，可按语言自然表达改写，而不要求逐字翻译
  - 本地化欢迎标题、说明与建议问题入口文案
  - _Requirements: R5, R6_

- [ ] 4.2 本地化 `multimodal-input.tsx` 这一高复杂度聊天输入组件
  - 单独处理 `components/chat/multimodal-input.tsx`（约 791 行）
  - 覆盖输入占位符、删除确认、上传失败、等待提示、菜单项与直接 `sonner` toast 调用
  - _Requirements: R5, R6, R7_

- [ ] 4.3 本地化侧边栏、用户菜单与历史记录分组
  - 修改 `components/chat/app-sidebar.tsx`、`components/chat/sidebar-history.tsx`、`components/chat/sidebar-history-item.tsx`、`components/chat/sidebar-user-nav.tsx`
  - 本地化 `New chat`、`Delete all`、`History`、`Today`、`Yesterday`、`Last 7 days`、`Last 30 days`、`Sign out` 等文本
  - 覆盖 `sidebar-user-nav.tsx` 中的 theme toggle 与内联 sign-out 文案
  - _Requirements: R5, R6_

- [ ] 4.4 本地化可见性选择器、弹窗与直接 `sonner` toast 调用点
  - 修改 `components/chat/visibility-selector.tsx`、相关 alert dialog 与直接 `sonner` 的调用点
  - 覆盖 `app-sidebar.tsx`、`sidebar-history.tsx`、`document.tsx`、`artifact-actions.tsx`、`message-actions.tsx` 等组件中的提示文案
  - 本地化 `Private` / `Public` 及其说明、删除确认、成功 / 失败提示
  - _Requirements: R5, R6, R7_

- [ ] 4.5 本地化 AI Elements 内的辅助文案（不含 PromptInput）
  - 修改 `components/ai-elements/message.tsx`、`components/ai-elements/model-selector.tsx` 等组件
  - 覆盖 tooltip、aria-label、搜索占位符、消息操作等辅助文案
  - _Requirements: R5, R6_

- [ ] 4.6 本地化 `prompt-input.tsx` 这一超大组件
  - 单独处理 `components/ai-elements/prompt-input.tsx`（约 1341 行）
  - 覆盖 `Upload files`、`Submit`、`Stop` 等基础交互文案
  - 评估该文件是否需要额外拆分，避免在同一提交中混入过多无关重构
  - _Requirements: R5, R6_

- [ ] 5. 完善显示与容错细节
- [ ] 5.1 优化中文显示的字体回退与根文档语义
  - 在全局样式或布局中加入适合中文的字体 fallback
  - 确保中文界面主要文案显示自然、可读
  - _Requirements: R6, R8_

- [ ] 5.2 增加缺失翻译与非法 locale 的保护逻辑
  - 在 `t()` / dictionary helper 中加入英文回退与开发期告警
  - 对非法 cookie / 非法请求体做安全处理
  - _Requirements: R1, R7_

- [ ] 5.3 清理或标记未使用的本地化相关旧组件
  - 复查 `components/chat/sign-out-form.tsx` 等当前未接入主流程的组件
  - 若确认无用则移除；若暂时保留则标注为未使用，避免误导后续本地化范围
  - _Requirements: R8_

- [ ] 6. 验证与回归测试
- [ ] 6.1 增加单元 / 集成测试
  - 覆盖 locale 解析优先级、cookie 持久化、缺失翻译回退与 `<html lang>` 输出
  - 覆盖语言切换接口与 provider / hook 的核心行为
  - _Requirements: R1, R4, R6, R7_

- [ ] 6.2 增加端到端或手工验证清单
  - 验证登录页、注册页、聊天页右上角切换器存在且可用
  - 验证切换后当前路由不变、刷新后语言保持、关键 UI 文案已本地化
  - 验证非法 locale 与切换失败场景的降级体验
  - _Requirements: R2, R3, R4, R5, R7, R8_
