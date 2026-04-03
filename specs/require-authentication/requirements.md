# 需求规格：禁止 Guest 公共访问并强制登录后才能使用

## 背景

当前项目通过 `proxy.ts` 将未登录访问者自动重定向到 `/api/auth/guest`，并由 `guest` provider 为其创建匿名账户。因此，任何访问站点的人都可以在无需显式登录的情况下获得会话并调用聊天能力。

新需求要求移除该匿名使用路径，使项目变为 **必须先登录，登录后才能访问聊天页面与相关 API**。

## 目标

- 禁止未登录用户通过 guest 自动登录进入系统。
- 所有聊天能力、聊天历史、文档、上传、投票、建议等受保护功能都必须在已登录状态下才能使用。
- 保留现有基于账号密码的登录能力。
- 在不改变核心聊天功能的前提下，收紧访问入口，避免公网匿名消耗模型额度。

## 范围

### In Scope

- 移除或停用 guest 自动登录链路
- 调整 `proxy.ts` 的未登录访问处理逻辑
- 明确页面访问与 API 访问在未登录时的行为
- 确保登录后才能进入聊天主页、历史会话、文档能力及相关 API
- 清理与 guest 公共访问相关的代码、文案与说明
- 更新 README / 文档中的访问方式说明

### Out of Scope

- 引入第三方 OAuth 登录方式
- 增加邮箱验证码、双因素认证、组织成员邀请等高级鉴权能力
- 基于邮箱白名单限制注册
- 关闭现有注册页面
- 改造数据库 schema

> 说明：本规格只解决“匿名访客可直接使用”的问题，不直接关闭公开注册。如果后续需要“只有你本人或白名单账号可用”，应新增一份注册限制 spec。

## 假设

1. 项目将继续使用现有 Auth.js + Credentials 登录方案。
2. `AUTH_SECRET`、数据库连接等基础鉴权依赖已正确配置。
3. 登录页 `/login` 与注册页 `/register` 继续保留。
4. 受保护 API 当前大多已具备服务端 `auth()` 校验，本次主要补齐入口层与 guest 链路的行为一致性。

## 用户故事

### 用户故事 1
作为站点拥有者，我希望匿名访问者不能直接进入聊天系统，以避免任何知道网址的人都能消耗我的模型额度。

### 用户故事 2
作为未登录用户，我希望在访问受保护页面时被引导到登录页，而不是被静默创建 guest 账号，以便我明确知道该站点需要登录。

### 用户故事 3
作为已登录用户，我希望在完成登录后继续正常访问聊天、历史记录、文档和上传能力，而不影响原有使用体验。

## 验收标准（EARS）

### 功能需求

#### R1. 禁止 guest 自动登录
1. WHEN 未登录用户访问站点受保护资源 THEN 系统 SHALL NOT 再调用 `/api/auth/guest` 为其创建匿名会话。
2. IF 系统配置中仍存在 guest provider 路径 THEN 系统 SHALL 停用该路径，使其不再作为正常访问流程的一部分。
3. WHEN 本次改造完成 THEN 系统 SHALL 不再依赖 `createGuestUser()` 作为默认入站行为。

#### R2. 页面访问强制登录
4. WHEN 未登录用户访问 `/`、`/chat/:id` 或其他受保护页面 THEN 系统 SHALL 将其重定向到 `/login`。
5. WHEN 系统执行上述重定向 THEN 系统 SHALL 保留原始目标地址，以便登录成功后可以返回目标页面或至少保留跳转意图。
6. IF 已登录用户访问 `/login` 或 `/register` THEN 系统 SHALL 将其重定向到应用主页或原始目标页，而不是继续停留在鉴权页。
7. WHEN 项目运行在当前 Next.js 版本约定下 THEN 系统 SHALL 通过根目录 `proxy.ts` 作为入口保护实现，而 SHALL NOT 额外依赖 `middleware.ts` 才能生效。

#### R3. API 访问必须鉴权
8. WHEN 未登录用户请求受保护 API（包括但不限于 `/api/chat`、`/api/history`、`/api/document`、`/api/messages`、`/api/vote`、`/api/files/upload`、`/api/suggestions`） THEN 系统 SHALL 返回未授权响应，而不是返回 guest 会话或隐式登录。
9. IF 请求命中 `/api/auth/*` 的 Auth.js 鉴权接口 THEN 系统 SHALL 允许其按现有登录/登出流程继续工作。
10. WHEN 未登录用户请求 `/api/messages` AND 对应聊天的可见性为 `public` THEN 系统 SHALL 仍然返回未授权响应；公开聊天 SHALL NOT 再作为匿名只读特例开放。
11. WHEN 前端在未登录状态下收到未授权响应 THEN 系统 SHALL 能够回到登录流程，而不是误认为聊天调用成功。

#### R4. 登录后正常使用
12. WHEN 用户使用有效账号密码登录成功 THEN 系统 SHALL 创建 regular 用户会话并允许访问受保护页面与 API。
13. WHEN 已登录用户进入聊天页面 THEN 系统 SHALL 保持现有聊天、历史、文档、上传、投票、建议等功能继续可用。
14. WHEN 已登录用户访问自己拥有的聊天或文档资源 THEN 系统 SHALL 继续沿用现有资源归属校验逻辑。
15. WHEN 已登录用户访问被标记为 `public` 的聊天消息 THEN 系统 SHALL 继续允许读取，但是否可编辑仍 SHALL 由现有资源归属与只读逻辑决定。

#### R5. 登录流程与跳转体验
16. WHEN 未登录用户因访问受保护页面而进入登录页 THEN 系统 SHALL 保持清晰的“需要登录才能使用”提示。
17. WHEN 用户登录成功 AND 请求中存在合法的回跳目标 THEN 系统 SHALL 优先返回该目标页。
18. IF 回跳目标缺失、为空或非法 THEN 系统 SHALL 安全地回退到主页，而不是跳转到外部地址。

#### R6. 清理 guest 遗留实现
19. WHEN 本次改造完成 THEN 与 guest 公共访问强绑定的代码路径、说明文案和默认入口 SHALL 被清理或标记废弃。
20. WHEN 清理 guest 遗留实现 THEN 系统 SHALL 同步清理用户导航等前端 guest 专用展示，避免继续出现 “Guest” 或 “Login to your account” 等匿名模式文案。
21. IF 代码中仍保留 `guest` 用户类型用于兼容历史数据或未来扩展 THEN 系统 SHALL 确保该类型不会再被匿名访问流程自动创建。

### 非功能需求

22. WHEN 维护者阅读项目文档 THEN 文档 SHALL 明确说明应用已改为必须登录后才能使用。
23. WHEN 未登录访问被拒绝 THEN 系统 SHALL 返回一致、可诊断的行为（页面跳转或 API 401/403），避免同一类场景出现互相矛盾的处理方式。
24. WHEN 本次改造上线 THEN 系统 SHALL 不降低现有聊天主流程的稳定性，也 SHALL NOT 引入对模型供应商调用链路的额外修改。
25. WHEN 维护者审阅认证配置 THEN 设计与实现 SHALL 明确 `auth.config.ts` 在自定义登录页、Auth.js basePath 与跳转行为中的作用。

## 边界情况

- 用户直接访问 `/api/chat` 等受保护 API，但浏览器中没有会话 cookie
- 用户直接访问 `/api/messages?chatId=...`，且该 chat 为 `public`
- 前端页面加载后会话过期，随后发起聊天/上传/投票请求
- 用户手动访问 `/login?redirectUrl=/chat/123`
- `redirectUrl` 为空、非法、为外部域名、或以 `//` 开头
- 已登录用户再次打开 `/login` 或 `/register`
- 历史数据库中存在 `isAnonymous = true` 的用户记录
- 某些服务端 action / route 已有 `auth()` 校验，但入口代理层之前仍会自动 guest 登录
- `proxy.ts` 作为 Next.js 16 的入口文件约定生效，但实现误以为必须存在 `middleware.ts`
- `/api/files/upload` 使用 `!session` 而其他路由使用 `!session?.user`
- 侧边栏用户菜单仍展示 guest 文案
- 前端对 401 响应的处理与页面级重定向可能存在不一致

## 完成定义

本规格完成时，应至少具备以下产物：

- Requirements 文档
- Design 文档
- Tasks 文档
- 一套明确的“未登录页面跳转 / 未登录 API 拒绝 / 登录后回跳”设计说明
- 可追踪到 `proxy.ts`、`app/(auth)`、受保护 API 与文档更新的任务拆分
