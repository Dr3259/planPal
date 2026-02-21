# 实现计划：计划层级联动

## 概述

本实现计划将计划层级联动功能分解为可执行的编码任务。该功能实现日计划、周计划、月计划、年计划之间的自动同步关系，使用 TypeScript 开发，采用分层架构设计。

## 任务列表

- [x] 1. 创建核心数据类型定义
  - 在 `src/types/plan-sync.ts` 中定义所有接口类型
  - 定义 `PlanItem`, `DailyPlan`, `WeeklyPlan`, `MonthlyPlan`, `YearlyPlan` 接口
  - 定义 `WeeklySummary`, `MonthlySummary` 接口
  - 定义 `UserPlansDocument` Firestore 文档结构
  - 定义 `PlanMode` 类型和相关枚举
  - _需求: 1.5, 1.6, 1.7, 6.1, 6.2, 6.3, 7.1_

- [x] 2. 实现日期工具函数
  - [x] 2.1 创建日期工具模块 `src/lib/date-utils.ts`
    - 实现 `getWeekId(date: Date): string` 函数，返回 ISO 8601 周编号
    - 实现 `getMonthId(date: Date): string` 函数，返回 "YYYY-MM" 格式
    - 实现 `getWeekStartDate(weekId: string): Date` 函数，返回周一日期
    - 实现 `getWeekEndDate(weekId: string): Date` 函数，返回周日日期
    - 实现 `parseDate(dateString: string): Date` 函数，解析 ISO 8601 日期
    - 实现 `formatDate(date: Date): string` 函数，格式化为 ISO 8601
    - _需求: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_
  
  - [ ]* 2.2 编写日期工具函数的属性测试
    - **属性 9: 日期格式一致性**
    - **属性 10: 周边界正确性**
    - **验证需求: 6.1, 6.2, 6.3, 6.4, 6.5**
  
  - [ ]* 2.3 编写日期工具函数的单元测试
    - 测试跨年周处理
    - 测试边界日期（年初、年末）
    - 测试无效日期格式处理
    - _需求: 6.6, 6.7_

- [x] 3. 实现数据验证模块
  - [x] 3.1 创建验证模块 `src/lib/validators.ts`
    - 实现 `validateDate(dateString: string): boolean` 函数
    - 实现 `validatePlanMode(mode: string): boolean` 函数
    - 实现 `validatePlanItemText(text: string): boolean` 函数（1-500字符）
    - 实现 `validateWeekId(weekId: string): boolean` 函数
    - 实现 `validateMonthId(monthId: string): boolean` 函数
    - 实现 `validateYear(year: number): boolean` 函数
    - 实现 `validateSummaryData(totalItems: number, completedItems: number): boolean` 函数
    - 实现 `sanitizeHtml(text: string): string` 函数，转义 HTML 特殊字符
    - _需求: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8, 10.9, 10.10, 13.5_
  
  - [ ]* 3.2 编写验证模块的单元测试
    - 测试各种有效和无效输入
    - 测试边界条件
    - 测试 XSS 攻击防护
    - _需求: 10.10, 13.5_

- [x] 4. 实现存储接口抽象层
  - [x] 4.1 创建存储接口 `src/lib/storage/storage-interface.ts`
    - 定义 `IStorageAdapter` 接口
    - 定义 `get<T>`, `set<T>`, `update<T>`, `delete` 方法签名
    - _需求: 8.1, 8.2_
  
  - [x] 4.2 实现 Firestore 适配器 `src/lib/storage/firestore-adapter.ts`
    - 实现 `FirestoreAdapter` 类
    - 实现增量更新逻辑（使用 `merge: true`）
    - 实现指数退避重试策略（最多3次）
    - 实现错误处理和日志记录
    - _需求: 8.1, 8.3, 8.5, 8.6, 8.7_
  
  - [x] 4.3 实现 LocalStorage 适配器 `src/lib/storage/local-storage-adapter.ts`
    - 实现 `LocalStorageAdapter` 类
    - 实现数据序列化和反序列化
    - 实现错误处理
    - _需求: 8.2_
  
  - [x] 4.4 创建存储工厂 `src/lib/storage/storage-factory.ts`
    - 根据用户登录状态选择存储适配器
    - 实现降级策略（网络错误时从 Firestore 降级到 LocalStorage）
    - _需求: 8.1, 8.2, 11.5_
  
  - [ ]* 4.5 编写存储层的单元测试
    - 测试 Firestore 适配器的 CRUD 操作
    - 测试 LocalStorage 适配器的 CRUD 操作
    - 测试重试逻辑
    - 测试降级策略
    - _需求: 8.5, 8.6, 11.5_

- [x] 5. 检查点 - 确保基础设施完成
  - 确保所有测试通过，询问用户是否有问题

- [x] 6. 实现同步引擎核心函数
  - [x] 6.1 创建同步引擎模块 `src/lib/sync-engine/sync-engine.ts`
    - 实现 `syncDailyToWeekly(dailyPlan: DailyPlan, weeklyPlan: WeeklyPlan): WeeklyPlan` 函数
    - 验证前置条件（日期范围、模式匹配）
    - 实现不可变更新逻辑
    - 抛出适当的错误（`DateOutOfRangeError`, `ModeMismatchError`）
    - _需求: 2.1, 2.2, 2.3, 2.4, 2.5, 11.1, 11.2_
  
  - [ ]* 6.2 编写 syncDailyToWeekly 的属性测试
    - **属性 2: 同步数据完整性**
    - **属性 3: 同步操作不可变性**
    - **属性 11: 日期范围验证**
    - **属性 12: 模式匹配验证**
    - **验证需求: 2.2, 2.3, 2.4, 2.5**
  
  - [x] 6.3 实现 `syncWeeklyToMonthly(weeklyPlan: WeeklyPlan, monthlyPlan: MonthlyPlan): MonthlyPlan` 函数
    - 遍历周计划的所有日期，计算汇总数据
    - 计算 `totalItems` 和 `completedItems`
    - 提取周目标作为关键亮点
    - 实现不可变更新逻辑
    - _需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7_
  
  - [ ]* 6.4 编写 syncWeeklyToMonthly 的属性测试
    - **属性 5: 周汇总计算准确性**
    - **属性 7: 汇总数据不变式**
    - **属性 8: 目标映射完整性**
    - **验证需求: 3.2, 3.3, 3.4, 3.5**
  
  - [x] 6.5 实现 `syncMonthlyToYearly(monthlyPlan: MonthlyPlan, yearlyPlan: YearlyPlan): YearlyPlan` 函数
    - 遍历月计划的所有周，计算汇总数据
    - 计算 `totalItems` 和 `completedItems`
    - 提取月目标作为关键亮点
    - 实现不可变更新逻辑
    - _需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7_
  
  - [ ]* 6.6 编写 syncMonthlyToYearly 的属性测试
    - **属性 6: 月汇总计算准确性**
    - **属性 7: 汇总数据不变式**
    - **属性 8: 目标映射完整性**
    - **验证需求: 4.2, 4.3, 4.4, 4.5**
  
  - [x] 6.7 实现级联同步函数 `cascadeSync(dailyPlan: DailyPlan, mode: PlanMode, userId: string): Promise<void>`
    - 保存日计划到存储层
    - 加载或创建周计划，调用 `syncDailyToWeekly`
    - 保存更新后的周计划
    - 加载或创建月计划，调用 `syncWeeklyToMonthly`
    - 保存更新后的月计划
    - 加载或创建年计划，调用 `syncMonthlyToYearly`
    - 保存更新后的年计划
    - 实现错误处理和日志记录
    - _需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_
  
  - [ ]* 6.8 编写级联同步的属性测试
    - **属性 1: 级联同步完整性**
    - **属性 4: 同步幂等性**
    - **验证需求: 2.1, 2.6, 3.1, 4.1, 5.1, 5.5, 5.6**
  
  - [ ]* 6.9 编写同步引擎的单元测试
    - 测试错误场景（日期范围错误、模式不匹配）
    - 测试边界条件
    - 测试空数据处理
    - _需求: 11.1, 11.2, 11.4_

- [x] 7. 检查点 - 确保同步引擎完成
  - 确保所有测试通过，询问用户是否有问题

- [x] 8. 实现计划服务层
  - [x] 8.1 创建计划服务 `src/lib/services/plan-service.ts`
    - 实现 `saveDailyPlan(date: string, mode: PlanMode, plan: DailyPlan): Promise<void>` 函数
    - 实现 `loadDailyPlan(date: string, mode: PlanMode, userId: string): Promise<DailyPlan | null>` 函数
    - 实现 `loadWeeklyPlan(weekId: string, mode: PlanMode, userId: string): Promise<WeeklyPlan | null>` 函数
    - 实现 `loadMonthlyPlan(monthId: string, mode: PlanMode, userId: string): Promise<MonthlyPlan | null>` 函数
    - 实现 `loadYearlyPlan(year: number, mode: PlanMode, userId: string): Promise<YearlyPlan | null>` 函数
    - 集成同步引擎，在保存日计划时触发级联同步
    - _需求: 1.1, 1.2, 1.3, 1.4, 5.2_
  
  - [x] 8.2 实现目标管理函数
    - 实现 `updateWeeklyGoals(weekId: string, mode: PlanMode, goals: string[]): Promise<void>` 函数
    - 实现 `updateMonthlyGoals(monthId: string, mode: PlanMode, goals: string[]): Promise<void>` 函数
    - 实现 `updateYearlyGoals(year: number, mode: PlanMode, goals: string[]): Promise<void>` 函数
    - _需求: 9.1, 9.2, 9.3, 9.7_
  
  - [x] 8.3 实现计划项操作辅助函数
    - 实现 `createPlanItem(text: string): PlanItem` 函数，生成唯一 ID 和时间戳
    - 实现 `updatePlanItem(item: PlanItem, updates: Partial<PlanItem>): PlanItem` 函数
    - 实现 `togglePlanItemCompletion(item: PlanItem): PlanItem` 函数
    - _需求: 1.2, 1.3, 1.6, 1.7_
  
  - [ ]* 8.4 编写计划服务的单元测试
    - 测试 CRUD 操作
    - 测试同步触发
    - 测试错误处理
    - _需求: 1.1, 1.2, 1.3, 1.4_
  
  - [ ]* 8.5 编写计划服务的属性测试
    - **属性 13: 计划项ID唯一性**
    - **属性 14: 计划项数据结构完整性**
    - **属性 15: 日计划时间段完整性**
    - **属性 16: 计划项更新时间戳**
    - **验证需求: 1.5, 1.6, 1.7**

- [x] 9. 实现性能优化
  - [x] 9.1 创建防抖工具 `src/lib/utils/debounce.ts`
    - 实现防抖函数，延迟 500ms 批量同步
    - _需求: 12.6_
  
  - [x] 9.2 实现缓存管理 `src/lib/cache/plan-cache.ts`
    - 实现内存缓存，缓存当前周/月/年计划
    - 实现缓存失效策略（5分钟或手动失效）
    - _需求: 12.7, 12.8_
  
  - [ ]* 9.3 编写性能测试
    - 测试日计划保存响应时间 < 200ms
    - 测试级联同步完成时间 < 500ms
    - 测试加载时间符合要求
    - _需求: 12.1, 12.2, 12.3, 12.4, 12.5_

- [x] 10. 实现数据迁移功能
  - [x] 10.1 创建迁移模块 `src/lib/migration/migrate-plan-data.ts`
    - 实现 `loadOldPlanData(userId: string): Promise<any>` 函数
    - 实现 `migratePlanData(userId: string): Promise<void>` 函数
    - 将旧的字符串数组转换为 `PlanItem` 对象
    - 为迁移的计划项生成唯一 ID 和时间戳
    - 实现备份功能
    - _需求: 14.1, 14.2, 14.3, 14.4, 14.5_
  
  - [x] 10.2 实现迁移验证和回滚
    - 实现 `validateMigration(userId: string): Promise<boolean>` 函数
    - 实现 `rollbackMigration(userId: string): Promise<void>` 函数
    - _需求: 14.6, 14.7_
  
  - [ ]* 10.3 编写迁移功能的单元测试
    - 测试数据转换正确性
    - 测试备份和回滚
    - _需求: 14.5, 14.6, 14.7_
  
  - [ ]* 10.4 编写迁移功能的属性测试
    - **属性 20: 数据迁移保持完整性**
    - **验证需求: 14.3, 14.4, 14.6**

- [x] 11. 检查点 - 确保后端逻辑完成
  - 确保所有测试通过，询问用户是否有问题

- [ ] 12. 重构日计划 UI 组件
  - [ ] 12.1 更新日计划组件 `src/components/plans/DailyPlanView.tsx`
    - 集成新的 `PlanService`
    - 使用 `PlanItem` 对象替代字符串
    - 添加计划项的创建、编辑、删除、完成状态切换功能
    - 在保存时触发级联同步
    - 添加加载状态和错误处理 UI
    - _需求: 1.1, 1.2, 1.3, 1.4, 15.1, 15.5, 15.6, 15.7_
  
  - [ ]* 12.2 编写日计划组件的集成测试
    - 测试用户添加计划项流程
    - 测试用户编辑计划项流程
    - 测试用户删除计划项流程
    - 测试完成状态切换
    - _需求: 1.1, 1.2, 1.3, 1.4_

- [ ] 13. 重构周计划 UI 组件
  - [ ] 13.1 更新周计划组件 `src/components/plans/WeeklyPlanView.tsx`
    - 集成新的 `PlanService`
    - 显示一周内所有日计划数据（从 `weeklyPlan.days` 读取）
    - 实现周目标的添加和编辑功能
    - 实现懒加载（仅在切换到周视图时加载）
    - 添加加载状态和错误处理 UI
    - _需求: 2.2, 9.1, 15.2, 15.6, 15.7, 15.8_
  
  - [ ]* 13.2 编写周计划组件的集成测试
    - 测试周计划显示日计划数据
    - 测试周目标管理
    - 测试懒加载
    - _需求: 2.2, 9.1, 15.8_

- [ ] 14. 重构月计划 UI 组件
  - [ ] 14.1 更新月计划组件 `src/components/plans/MonthlyPlanView.tsx`
    - 集成新的 `PlanService`
    - 显示月内所有周汇总数据（从 `monthlyPlan.weeks` 读取）
    - 显示每周的 `totalItems`, `completedItems`, `keyHighlights`
    - 实现月目标的添加和编辑功能
    - 实现懒加载
    - 添加加载状态和错误处理 UI
    - _需求: 3.2, 3.3, 3.5, 9.2, 15.3, 15.6, 15.7, 15.8_
  
  - [ ]* 14.2 编写月计划组件的集成测试
    - 测试月计划显示周汇总数据
    - 测试月目标管理
    - 测试懒加载
    - _需求: 3.2, 3.3, 3.5, 15.8_

- [ ] 15. 重构年计划 UI 组件
  - [ ] 15.1 更新年计划组件 `src/components/plans/YearlyPlanView.tsx`
    - 集成新的 `PlanService`
    - 显示年内所有月汇总数据（从 `yearlyPlan.months` 读取）
    - 显示每月的 `totalItems`, `completedItems`, `keyHighlights`
    - 实现年度目标的添加和编辑功能
    - 实现懒加载
    - 添加加载状态和错误处理 UI
    - _需求: 4.2, 4.3, 4.5, 9.3, 15.4, 15.6, 15.7, 15.8_
  
  - [ ]* 15.2 编写年计划组件的集成测试
    - 测试年计划显示月汇总数据
    - 测试年度目标管理
    - 测试懒加载
    - _需求: 4.2, 4.3, 4.5, 15.8_

- [ ] 16. 实现计划模式切换功能
  - [ ] 16.1 创建模式切换组件 `src/components/plans/PlanModeSelector.tsx`
    - 实现四种模式的切换 UI（work, study, life, travel）
    - 切换模式时清除缓存并重新加载数据
    - _需求: 7.4, 12.8_
  
  - [ ]* 16.2 编写模式切换的属性测试
    - **属性 17: 计划模式数据隔离**
    - **验证需求: 7.2, 7.5**

- [ ] 17. 实现 Firestore 安全规则
  - [ ] 17.1 更新 `firestore.rules` 文件
    - 添加用户数据隔离规则
    - 确保用户只能访问自己的计划数据
    - _需求: 8.3, 8.4, 13.1, 13.2, 13.3_
  
  - [ ]* 17.2 测试安全规则
    - 测试用户只能访问自己的数据
    - 测试未授权访问被拒绝
    - _需求: 13.1, 13.2, 13.3_

- [ ] 18. 实现迁移 UI（可选）
  - [ ] 18.1 创建迁移通知组件 `src/components/migration/MigrationNotice.tsx`
    - 在用户首次使用新版本时显示迁移通知
    - 提供"立即迁移"和"稍后提醒"按钮
    - _需求: 14.8_
  
  - [ ] 18.2 创建迁移进度组件 `src/components/migration/MigrationProgress.tsx`
    - 显示迁移进度
    - 显示迁移结果（成功/失败）
    - 提供回滚选项
    - _需求: 14.7, 14.8_

- [ ] 19. 检查点 - 确保 UI 集成完成
  - 确保所有测试通过，询问用户是否有问题

- [ ]* 20. 端到端测试
  - [ ]* 20.1 编写完整用户流程测试
    - 测试用户添加日计划 → 验证周/月/年计划自动更新
    - 测试用户修改日计划 → 验证所有层级同步更新
    - 测试用户删除日计划 → 验证汇总数据重新计算
    - 测试用户切换计划模式 → 验证数据隔离
    - _需求: 5.1, 5.5, 7.2, 17.1_
  
  - [ ]* 20.2 编写跨设备同步测试
    - 测试用户在不同设备登录 → 验证数据同步一致性
    - 测试用户从未登录切换到已登录 → 验证数据迁移
    - _需求: 8.1, 8.2, 14.1_
  
  - [ ]* 20.3 编写错误恢复测试
    - 测试网络错误场景
    - 测试存储失败场景
    - 测试数据验证失败场景
    - _需求: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 21. 性能优化和最终调整
  - [ ] 21.1 性能分析和优化
    - 使用 Chrome DevTools 分析性能瓶颈
    - 优化大数据量场景下的渲染性能
    - 验证性能指标符合要求
    - _需求: 12.1, 12.2, 12.3, 12.4, 12.5_
  
  - [ ] 21.2 代码审查和重构
    - 审查代码质量和可维护性
    - 添加必要的代码注释
    - 重构重复代码
    - _非功能需求: 可维护性_
  
  - [ ] 21.3 文档更新
    - 更新 README 文档
    - 添加 API 文档
    - 添加迁移指南
    - _需求: 14.8_

- [ ] 22. 最终检查点
  - 确保所有测试通过，询问用户是否准备好发布

## 注意事项

- 标记为 `*` 的任务是可选的测试任务，可以跳过以加快 MVP 开发
- 每个任务都引用了具体的需求编号，确保可追溯性
- 检查点任务确保增量验证，及时发现问题
- 属性测试验证通用正确性属性，单元测试验证具体示例和边界情况
- 所有核心实现任务必须完成，测试任务可根据时间安排选择性实施
