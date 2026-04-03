# 任务拆分：禁止 Guest 公共访问并强制登录后才能使用

- [ ] 1. 收紧认证入口，阻断匿名访问
- [ ] 1.1 改造 `proxy.ts` 的未登录处理逻辑
  - 区分页面请求和 API 请求
  - 页面请求未登录时重定向到 `/login?redirectUrl=...`
  - 受保护 API 未登录时直接返回 401，而不是跳转到 guest 路由
  - 明确依赖根目录 `proxy.ts` 作为 Next.js 16 生效入口，而不是额外新增 `middleware.ts`
  - 保持 `/api/auth/*` 放行
  - _Requirements: R1, R2, R3, R5_

- [ ] 1.2 引入安全回跳地址 helper
  - 新增或复用用于校验 `redirectUrl` 的 helper
  - 仅允许站内相对路径
  - 避免开放重定向问题
  - 供 `proxy.ts`、登录页、登录 action 共同使用
  - _Requirements: R2, R5_

- [ ] 2. 移除 guest 自动登录链路
- [ ] 2.1 停用 `app/(auth)/auth.ts` 中的 guest provider
  - 删除或明确禁用 `Credentials({ id: "guest" ... })`
  - 确保默认认证流程只保留常规 credentials 登录
  - _Requirements: R1, R4, R6_

- [ ] 2.2 清理 guest 路由与 guest 用户创建默认入口
  - 处理 `app/(auth)/api/auth/guest/route.ts`
  - 删除或改为返回 404/410/重定向登录页
  - 确保 `createGuestUser()` 不再作为默认入站路径被触发
  - _Requirements: R1, R6_

- [ ] 3. 补齐登录回跳体验
- [ ] 3.1 更新登录页读取并传递 `redirectUrl`
  - 修改 `app/(auth)/login/page.tsx`
  - 在登录成功后优先跳转回合法目标页
  - 无合法目标时回退 `/`
  - _Requirements: R2, R5_

- [ ] 3.2 评估注册页的已登录跳转行为
  - 检查 `app/(auth)/register/page.tsx` 与相关逻辑
  - 确保已登录用户访问注册页不会停留在该页
  - 若存在合法目标页，可与登录页保持一致的回跳策略
  - _Requirements: R2, R5_

- [ ] 4. 确认受保护 API 与服务端动作的行为一致性
- [ ] 4.1 复查受保护 Route Handlers 的 `auth()` 校验
  - 重点检查 `/api/chat`、`/api/history`、`/api/document`、`/api/messages`、`/api/vote`、`/api/files/upload`、`/api/suggestions`
  - 明确移除 `/api/messages` 对 `public` chat 的匿名只读特例
  - 将 `/api/files/upload` 的鉴权判断统一为 `!session?.user`
  - 确保即使绕过代理层，路由本身仍会拒绝未授权请求
  - _Requirements: R3, R4_

- [ ] 4.2 校准前端对未授权响应的处理
  - 复查聊天调用与相关 fetch 逻辑
  - 确保 401 不会被误当作成功响应
  - 如有需要，补充重新登录提示或统一错误处理
  - _Requirements: R3, R5_

- [ ] 5. 清理 guest 遗留代码与说明
- [ ] 5.1 清理或标记废弃 guest 相关实现
  - 检查 `createGuestUser`、`guestRegex`、`entitlementsByUserType.guest`、`components/chat/sidebar-user-nav.tsx` 及相关文案
  - 删除完全无用的 guest 公共访问代码
  - 对暂时保留的兼容结构添加明确注释
  - _Requirements: R6_

- [ ] 5.2 更新 README 与相关文档
  - 明确说明项目已改为必须登录后才能使用
  - 说明匿名访客不会再自动获得聊天权限
  - 说明 `auth.config.ts` / `/login` / `proxy.ts` 的登录入口关系
  - 如有必要补充部署者对注册策略的后续可选项说明
  - _Requirements: R18, R19, R20_

- [ ] 6. 验证与回归测试
- [ ] 6.1 增加单元/集成测试
  - 覆盖 `redirectUrl` 安全校验
  - 覆盖未登录页面跳转、未登录 API 401、登录成功回跳
  - 覆盖未登录访问 `/api/messages`（含 public chat）被拒绝
  - 覆盖 guest 路由不可用或不再创建会话
  - _Requirements: R1, R2, R3, R5_

- [ ] 6.2 执行手工验证清单
  - 未登录访问首页 -> 跳登录
  - 未登录直接请求聊天 API -> 401
  - 登录成功后聊天、历史、文档、上传等正常使用
  - 已登录访问 `/login` 或 `/register` 行为正确
  - 记录结果并回填发现的实现差异
  - _Requirements: R2, R3, R4, R5, R20_
