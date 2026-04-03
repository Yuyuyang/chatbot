# 设计文档：禁止 Guest 公共访问并强制登录后才能使用

## Overview

本设计将项目从“未登录自动创建 guest 会话”的开放访问模型，改为“必须显式登录后才能使用”的受保护访问模型。

设计重点：

1. 删除匿名访客自动登录入口；
2. 将页面访问与 API 访问的未登录处理分开；
3. 保持现有 Credentials 登录/注册能力；
4. 尽量少改聊天主链路，仅收紧访问控制与跳转体验。

本设计**不**改变模型调用方式、数据库 schema 或账号体系，只调整认证入口与授权前置行为。

---

## Architecture

### Current

```mermaid
flowchart TD
  Visitor[未登录访问者] --> Proxy[proxy.ts]
  Proxy --> GuestRoute[/api/auth/guest]
  GuestRoute --> GuestProvider[Auth.js guest provider]
  GuestProvider --> CreateGuestUser[createGuestUser()]
  CreateGuestUser --> Session[获得 guest session]
  Session --> ChatPages[聊天页面 / API]
```

### Target

```mermaid
flowchart TD
  Visitor[未登录访问者] --> Proxy[proxy.ts]
  Proxy -->|页面请求| LoginPage[/login?redirectUrl=...]
  Proxy -->|API 请求| Unauthorized[401 Unauthorized]

  LoginPage --> Credentials[Auth.js credentials provider]
  Credentials --> Session[regular session]
  Session --> ProtectedPages[聊天页面 / API]
```

### Key Changes

1. `proxy.ts`
   - 不再把未登录流量导向 `/api/auth/guest`
   - 对页面请求重定向到 `/login`
   - 对受保护 API 请求直接返回 401/JSON
   - 在当前 Next.js 16 项目中继续作为根目录入口保护文件，不新增 `middleware.ts`
2. `app/(auth)/auth.ts`
   - 停用 `guest` provider
   - 只保留 `credentials` provider 作为默认交互登录方式
3. `app/(auth)/api/auth/guest/route.ts`
   - 删除、废弃，或改为直接拒绝访问，避免继续作为可用入口
4. 登录页 / 登录 action
   - 识别 `redirectUrl`
   - 登录成功后安全回跳
5. 文档
   - 明确站点已改为必须登录后使用

---

## Components and Interfaces

### 1. 路由入口保护：`proxy.ts`

**职责：**
- 作为第一层访问控制入口
- 区分页面请求与 API 请求
- 对未登录请求执行一致的前置处理

**文件约定说明：**
- 当前项目使用 Next.js 16
- 根目录 `proxy.ts` 是有效的框架文件约定
- 本设计以 `proxy.ts` 为生效入口，不要求额外新增 `middleware.ts`

**当前问题：**
- 未登录即自动 guest 登录，导致匿名用户可直接使用系统
- `matcher` 覆盖 `/api/:path*`，因此入口层行为对 API 影响很大

**目标行为：**

#### 页面请求
对于以下页面型路径：
- `/`
- `/chat/:id`
- 其他未来需要保护的页面路由

未登录时：
- 重定向到 `/login?redirectUrl=<safe-path>`

已登录时：
- 正常放行

#### API 请求
对于以下受保护 API：
- `/api/chat`
- `/api/history`
- `/api/document`
- `/api/messages`
- `/api/vote`
- `/api/files/upload`
- `/api/suggestions`
- 其他需要登录的业务 API

未登录时：
- 直接返回 401
- 响应体应保持前端可识别，例如 JSON `{ error: "Unauthorized" }`

关于 `/api/messages`：
- 当前实现对 `public` chat 允许匿名只读访问
- 本次需求要求“必须强制登录才能使用”
- 因此本设计将取消该匿名读取特例，未登录访问 `/api/messages` 时无论 chat 可见性为何都返回未授权

Auth API：
- `/api/auth/*` 始终放行，避免破坏 Auth.js

**为什么页面与 API 要分开处理：**
- 页面请求适合重定向到登录页
- API 请求若返回 HTML 跳转，会破坏 `fetch/useChat` 的调用语义，并导致前端难以正确识别未授权状态

---

### 2. 认证配置：`app/(auth)/auth.ts`

**当前结构：**
- `credentials` provider：常规邮箱密码登录
- `guest` provider：匿名创建 guest 用户

**目标结构：**
- 保留 `credentials` provider
- 移除或停用 `guest` provider

**设计决策：**

#### Decision: guest provider 的处理方式
**Context:** 当前匿名访问路径通过 `signIn("guest")` 自动建立会话。

**Options Considered:**
1. 完全删除 guest provider
   - Pros: 结构最干净，不再产生误用入口
   - Cons: 若未来还要恢复 guest 模式，需要重新实现
2. 保留 guest provider 但不再暴露入口
   - Pros: 兼容未来实验性恢复
   - Cons: 代码中仍保留潜在误用路径

**Decision:** 优先删除或明确停用 guest provider。

**Rationale:** 本需求的核心是禁止匿名公共访问。继续保留可调用 guest provider 会增加回归风险。

---

### 2.1 Auth.js 页面映射配置：`app/(auth)/auth.config.ts`

**职责：**
- 定义 Auth.js 的 `basePath`
- 声明自定义登录页 `pages.signIn`
- 影响未登录跳转后最终落到哪个鉴权页面

**本次设计要求：**
- 保持 `basePath: "/api/auth"` 不变
- 保持 `pages.signIn` 与 `proxy.ts` 的重定向目标一致，均指向 `/login`
- 若后续补充登录成功回跳逻辑，应确保不与 `auth.config.ts` 中的页面映射发生冲突

**原因：**
- 本次改造的核心是“未登录进入登录页”而不是“未登录进入 guest 路由”
- 因此 `auth.config.ts` 是登录入口体验的一部分，设计中需要明确引用

---

### 3. Guest 路由处理：`app/(auth)/api/auth/guest/route.ts`

**目标：**
该路由不再承担正常用户访问入口。

**可选实现策略：**
1. 直接删除该文件与路由
2. 保留文件但返回 404/401/410，明确该入口已禁用

**推荐：**
- 若代码引用已全部移除，则直接删除更清晰
- 若短期内需要兼容旧链接，则返回 410 Gone 或重定向到 `/login`

---

### 4. 登录回跳：`/login` 页面与 `app/(auth)/actions.ts`

**当前问题：**
- 登录页没有消费 `redirectUrl`
- 用户从受保护页面被送到登录页后，登录成功通常只会回到首页或当前登录页刷新

**目标行为：**
- 登录页读取 `redirectUrl`
- 提交登录时将其一并带入 server action 或后续客户端跳转逻辑
- 登录成功后：
  - 若 `redirectUrl` 合法，则跳回该路径
  - 否则跳到 `/`

**安全规则：**
- 仅允许站内相对路径
- 禁止外部 URL
- 禁止 `//example.com` 形式
- 空值时使用 `/`

**建议接口：**

```ts
function getSafeRedirectUrl(input: string | null | undefined): string;
```

该 helper 可复用于：
- `proxy.ts`
- 登录页
- 可能的注册成功跳转逻辑

---

### 5. 受保护 API 的一致性

虽然多个 Route Handler 当前已经手动调用 `auth()` 进行会话校验，但为了防止：
- 某些新 API 漏写校验
- 代理层与路由层行为不一致

本设计要求形成“双层保护”：

1. **入口层（proxy.ts）**：未登录 API 直接拒绝
2. **路由层（route.ts / server actions）**：继续保留 `auth()` 校验

这样即使代理匹配规则将来被调整，业务路由本身仍然安全。

**实现对齐要求：**
- `/api/messages` 不再保留 “public chat 可匿名读取” 特例
- `/api/files/upload` 的鉴权判断应与其他路由统一为 `!session?.user`

---

### 6. 前端未授权体验

**目标：**
当前端在已打开页面后发生会话失效，再请求 API 时，应能识别未授权并引导重新登录。

**本次最小方案：**
- 保持后端返回 401
- 前端维持现有错误处理机制，不把 401 伪装成成功结果
- 如已有统一 toast / error boundary，则继续复用

**可后续增强但不强制本次完成：**
- 检测 401 后自动跳转 `/login?redirectUrl=<currentPath>`
- 在聊天输入区显示“请重新登录”提示

---

### 7. Guest 前端遗留 UI 清理

**目标：**
- 除服务端 guest 入口外，清理界面中对匿名模式的显式依赖

**重点文件：**
- `components/chat/sidebar-user-nav.tsx`

**需要处理的内容：**
- 移除基于 `guestRegex` 的 guest 判定分支
- 移除 `Guest` 标签
- 移除 “Login to your account” 这类仅在 guest 模式下出现的菜单项文案
- 保持已登录 regular 用户的邮箱展示、主题切换、登出功能正常

---

## Data Models

本需求不新增数据库表，也不修改 schema。

### 现有用户类型

```ts
export type UserType = "guest" | "regular";
```

**处理策略：**
- 短期内可以保留类型定义以兼容历史数据或现有分支逻辑
- 但新流程中不再自动创建 `guest` 用户
- 如果 `entitlementsByUserType` 等映射仍含 `guest`，应确认其不会再被匿名入口触发

### Redirect 参数

```ts
type SafeRedirect = string; // 仅允许应用内相对路径，如 / 或 /chat/123
```

---

## Error Handling

### 错误分类

| 场景 | 行为 | 备注 |
|---|---|---|
| 未登录访问受保护页面 | 302 跳转到 `/login?redirectUrl=...` | 不再进入 guest |
| 未登录访问受保护 API | 401 Unauthorized | 供前端识别 |
| 未登录访问 `/api/auth/*` | 放行 | Auth.js 正常工作 |
| 登录成功但回跳地址非法 | 跳回 `/` | 防止开放重定向 |
| 已登录访问 `/login` 或 `/register` | 重定向到主页或合法目标页 | 避免停留在鉴权页 |
| 已废弃的 guest 路由被访问 | 404/410 或重定向 `/login` | 取决于实现选择 |

### Recovery Strategy

- 用户未登录：引导登录
- 会话过期：前端重新发起登录流程
- 非法回跳参数：静默回退主页

---

## Testing Strategy

### Unit Tests
- `getSafeRedirectUrl()`
  - 合法站内路径
  - 空值
  - 外部 URL
  - `//` 开头路径
  - 非法字符串
- `proxy.ts` 的路径分类逻辑
  - 页面请求未登录 -> 跳登录
  - API 请求未登录 -> 401
  - `/api/auth/*` -> 放行

### Integration Tests
- 未登录访问 `/` 应跳转 `/login`
- 未登录请求 `/api/chat` 应返回 401
- 未登录请求 `/api/messages`（即使 chat 为 `public`）也应返回 401
- 登录成功后可正常请求 `/api/chat`
- 已登录访问 `/login` 应被带回主页或目标页
- guest 路由不再创建会话

### Regression Tests
- 已登录聊天主流程不受影响
- 历史记录、文档、上传、投票、建议接口仍保持原有授权判断
- 注册页仍可正常创建 regular 用户（若本次不关闭注册）

---

## Implementation Notes

推荐按以下顺序落地：

1. 先改 `proxy.ts`，切断匿名入口
2. 再移除 `guest` provider 与 guest 路由
3. 最后补登录回跳与文档

这样可以先确保“匿名不可访问”的核心目标最早达成。
