# 任务拆分：历史聊天记录新增“对话总结”并重生成标题

- [ ] 1. 扩展标题生成基础能力
- [ ] 1.1 抽取通用标题生成 helper
  - 复用当前 `generateTitleFromUserMessage` 的模型调用与标题清洗逻辑
  - 将“根据文本生成标题”的通用部分抽离为可复用 helper
  - 保留 `getTextFromMessage` 在单条 `UIMessage` 场景中的职责
  - 确保现有新建聊天自动标题流程保持不变
  - _Acceptance: AC-04, AC-12, AC-21, AC-22_

- [ ] 1.2 新增整段对话标题 prompt 与上下文提取逻辑
  - 在 `lib/ai/prompts.ts` 中新增 conversation summary title prompt
  - 新增从 `DBMessage[]` 中提取文本上下文的 helper
  - 按“首条主题 + 最近上下文”构造输入，并加入 3000 字符上限裁剪策略
  - _Acceptance: AC-04, AC-05, AC-12, AC-15, AC-21_

- [ ] 2. 实现服务端标题重生成动作
- [ ] 2.1 在 `app/(chat)/actions.ts` 中新增 `regenerateChatTitle`
  - 校验当前用户会话
  - 校验聊天存在且归属于当前用户
  - 读取聊天消息并调用新的标题生成逻辑
  - 统一使用 `RegenerateChatTitleResult` 作为返回类型命名
  - _Acceptance: AC-04, AC-06, AC-16_

- [ ] 2.2 接入标题持久化与失败保护
  - 成功时调用 `updateChatTitleById({ chatId, title })`
  - 无有效标题、无可总结文本、数据库失败时保持原标题不变
  - 返回前端可消费的结果或受控错误
  - _Acceptance: AC-07, AC-08, AC-13, AC-17_

- [ ] 3. 扩展历史聊天菜单 UI
- [ ] 3.1 在 `components/chat/sidebar-history-item.tsx` 中新增“对话总结”入口
  - 在“共享”和“删除”之间插入新的一级菜单项
  - 为组件增加 `onSummarize` 与 `isSummarizing` 等必要 props
  - 不破坏现有分享子菜单与删除入口
  - _Acceptance: AC-01, AC-02, AC-03_

- [ ] 3.2 在 `components/chat/sidebar-history.tsx` 中接入总结动作
  - 增加当前总结中的聊天状态管理
  - 触发 `regenerateChatTitle({ chatId })`
  - 防止同一聊天重复提交，必要时限制并发
  - _Acceptance: AC-03, AC-16, AC-18_

- [ ] 4. 同步前端缓存与标题刷新机制
- [ ] 4.1 在 `useSWRInfinite` 多页缓存中精确更新标题
  - 遍历所有已加载页面的 `pages[].chats[]`
  - 定位 `chat.id === targetId` 的聊天并更新其 `title`
  - 覆盖非首页缓存中的聊天标题更新场景
  - _Acceptance: AC-09, AC-10, AC-11_

- [ ] 4.2 明确与现有 `data-stream-handler.tsx` 的并存策略
  - 保持新建聊天自动标题继续走 `data-chat-title` 流程
  - 保持历史记录“对话总结”走 server action + local mutate 流程
  - 如有必要增加背景 revalidate，但不改造现有 streaming 主链路
  - _Acceptance: AC-09, AC-10, AC-21, AC-22_

- [ ] 4.3 增加成功/失败提示与异常处理
  - 成功时提示标题已更新，或确保 UI 变化足够明显
  - 失败时保持原标题并显示错误提示
  - 对未授权或会话失效情况接入现有登录/错误处理流程
  - _Acceptance: AC-16, AC-17, AC-18_

- [ ] 5. 清理 rename 遗留入口与文案
- [ ] 5.1 处理 `components/chat/slash-commands.tsx` 中的 `/rename` 遗留交互
  - 明确保留、替换提示或移除其中一种策略
  - 避免继续把用户引导到不存在的手动 rename 入口
  - _Acceptance: AC-19, AC-20_

- [ ] 5.2 更新 `lib/i18n/types.ts` 与字典文案
  - 新增“对话总结”、处理中、成功/失败提示等字段类型
  - 更新 `lib/i18n/dictionaries/zh-CN.ts` 与 `lib/i18n/dictionaries/en.ts`
  - 清理或修正 rename 相关提示词，保持中英文结构一致
  - _Acceptance: AC-01, AC-18, AC-19, AC-20, AC-24_

- [ ] 6. 测试与回归验证
- [ ] 6.1 增加单元与服务端动作测试
  - 用例 1：有文本消息时成功更新标题
  - 用例 2：无文本消息时不更新标题
  - 用例 3：聊天不属于当前用户时报拒绝访问
  - 用例 4：模型返回空标题时不写库
  - 用例 5：标题清洗正确移除引号、Markdown 与换行
  - 用例 6：3000 字符裁剪策略生效
  - _Acceptance: AC-05, AC-06, AC-07, AC-12, AC-13, AC-16, AC-17_

- [ ] 6.2 增加缓存与集成交互测试
  - 用例 1：历史记录三点菜单出现“对话总结”入口
  - 用例 2：点击后进入加载/禁用状态
  - 用例 3：成功后首页缓存中的标题即时更新
  - 用例 4：成功后非首页缓存中的标题也能更新
  - 用例 5：失败时原标题保持不变并出现错误提示
  - _Acceptance: AC-01, AC-03, AC-09, AC-10, AC-11, AC-17, AC-18_

- [ ] 6.3 执行手工回归清单
  - 回归验证“共享”“删除”“新建聊天自动标题”功能不受影响
  - 验证 `data-stream-handler.tsx` 驱动的自动标题刷新仍正常
  - 验证 `/rename` 入口或提示不再误导用户
  - _Acceptance: AC-02, AC-19, AC-20, AC-22_
