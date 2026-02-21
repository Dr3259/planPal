/**
 * 同步引擎核心模块
 * 
 * 实现计划层级之间的数据同步逻辑：
 * - 日计划 → 周计划
 * - 周计划 → 月计划
 * - 月计划 → 年计划
 * - 级联同步
 * 
 * 验证需求: 2.1-2.6, 3.1-3.7, 4.1-4.7, 5.1-5.6
 */

import type {
  DailyPlan,
  WeeklyPlan,
  MonthlyPlan,
  YearlyPlan,
  WeeklySummary,
  MonthlySummary,
  PlanMode,
} from '@/types/plan-sync';
import { parseDate, formatDate, getWeekId, getMonthId } from '@/lib/date-utils';

/**
 * 自定义错误类：日期范围错误
 * 当日计划的日期不在周计划的日期范围内时抛出
 */
export class DateOutOfRangeError extends Error {
  constructor(date: string, weekId: string, startDate: string, endDate: string) {
    super(
      `Date ${date} is out of range for week ${weekId} (${startDate} to ${endDate})`
    );
    this.name = 'DateOutOfRangeError';
  }
}

/**
 * 自定义错误类：模式不匹配错误
 * 当源计划和目标计划的模式不同时抛出
 */
export class ModeMismatchError extends Error {
  constructor(sourceMode: PlanMode, targetMode: PlanMode) {
    super(
      `Plan mode mismatch: source mode is "${sourceMode}" but target mode is "${targetMode}"`
    );
    this.name = 'ModeMismatchError';
  }
}

/**
 * 同步日计划到周计划
 * 
 * 将日计划数据同步到对应周计划的指定日期位置
 * 
 * @param dailyPlan - 要同步的日计划
 * @param weeklyPlan - 目标周计划
 * @returns 更新后的周计划（不可变更新）
 * @throws {DateOutOfRangeError} 如果日期不在周范围内
 * @throws {ModeMismatchError} 如果计划模式不匹配
 * 
 * 验证需求: 2.1, 2.2, 2.3, 2.4, 2.5
 * 
 * 前置条件：
 * - dailyPlan 非空且包含有效的日期
 * - dailyPlan.date 在 weeklyPlan.startDate 和 weeklyPlan.endDate 之间
 * - dailyPlan.mode 与 weeklyPlan.mode 相同
 * 
 * 后置条件：
 * - 返回更新后的 WeeklyPlan 对象
 * - weeklyPlan.days[dailyPlan.date] 包含最新的日计划数据
 * - 原始 weeklyPlan 对象不被修改（不可变更新）
 */
export function syncDailyToWeekly(
  dailyPlan: DailyPlan,
  weeklyPlan: WeeklyPlan
): WeeklyPlan {
  // 验证前置条件：模式匹配
  if (dailyPlan.mode !== weeklyPlan.mode) {
    throw new ModeMismatchError(dailyPlan.mode, weeklyPlan.mode);
  }

  // 验证前置条件：日期范围
  const dailyDate = dailyPlan.date;
  const { startDate, endDate, weekId } = weeklyPlan;

  if (dailyDate < startDate || dailyDate > endDate) {
    throw new DateOutOfRangeError(dailyDate, weekId, startDate, endDate);
  }

  // 不可变更新：创建新的周计划对象
  const updatedWeeklyPlan: WeeklyPlan = {
    ...weeklyPlan,
    days: {
      ...weeklyPlan.days,
      [dailyDate]: dailyPlan,
    },
  };

  return updatedWeeklyPlan;
}

/**
 * 同步周计划到月计划
 * 
 * 计算周汇总数据并同步到对应月计划
 * 
 * @param weeklyPlan - 要同步的周计划
 * @param monthlyPlan - 目标月计划
 * @returns 更新后的月计划（不可变更新）
 * @throws {ModeMismatchError} 如果计划模式不匹配
 * 
 * 验证需求: 3.1, 3.2, 3.3, 3.4, 3.5, 3.7
 * 
 * 前置条件：
 * - weeklyPlan 非空且包含有效的 weekId
 * - weeklyPlan.weekId 属于 monthlyPlan.monthId 对应的月份
 * - weeklyPlan.mode 与 monthlyPlan.mode 相同
 * 
 * 后置条件：
 * - 返回更新后的 MonthlyPlan 对象
 * - monthlyPlan.weeks[weeklyPlan.weekId] 包含周汇总数据
 * - 汇总数据正确计算：totalItems 和 completedItems 准确
 * - 原始 monthlyPlan 对象不被修改
 * 
 * 循环不变式：
 * - 遍历 weeklyPlan.days 时，已处理的天数统计准确
 * - totalItems 和 completedItems 始终非负
 */
export function syncWeeklyToMonthly(
  weeklyPlan: WeeklyPlan,
  monthlyPlan: MonthlyPlan
): MonthlyPlan {
  // 验证前置条件：模式匹配
  if (weeklyPlan.mode !== monthlyPlan.mode) {
    throw new ModeMismatchError(weeklyPlan.mode, monthlyPlan.mode);
  }

  // 计算周汇总数据
  let totalItems = 0;
  let completedItems = 0;

  // 遍历周计划的所有日期
  for (const date in weeklyPlan.days) {
    const dailyPlan = weeklyPlan.days[date];

    // 统计所有时间段的计划项
    const allItems = [
      ...dailyPlan.morning,
      ...dailyPlan.afternoon,
      ...dailyPlan.evening,
    ];

    totalItems += allItems.length;
    completedItems += allItems.filter((item) => item.completed).length;

    // 循环不变式：确保计数器非负
    if (totalItems < 0 || completedItems < 0) {
      throw new Error('Invalid state: counters became negative');
    }
  }

  // 创建周汇总对象
  const weeklySummary: WeeklySummary = {
    weekId: weeklyPlan.weekId,
    startDate: weeklyPlan.startDate,
    endDate: weeklyPlan.endDate,
    totalItems,
    completedItems,
    keyHighlights: weeklyPlan.weeklyGoals, // 周目标作为关键亮点
  };

  // 不可变更新：创建新的月计划对象
  const updatedMonthlyPlan: MonthlyPlan = {
    ...monthlyPlan,
    weeks: {
      ...monthlyPlan.weeks,
      [weeklyPlan.weekId]: weeklySummary,
    },
  };

  return updatedMonthlyPlan;
}

/**
 * 同步月计划到年计划
 * 
 * 计算月汇总数据并同步到对应年计划
 * 
 * @param monthlyPlan - 要同步的月计划
 * @param yearlyPlan - 目标年计划
 * @returns 更新后的年计划（不可变更新）
 * @throws {ModeMismatchError} 如果计划模式不匹配
 * 
 * 验证需求: 4.1, 4.2, 4.3, 4.4, 4.5, 4.7
 * 
 * 前置条件：
 * - monthlyPlan 非空且包含有效的 monthId
 * - monthlyPlan.monthId 属于 yearlyPlan.year 对应的年份
 * - monthlyPlan.mode 与 yearlyPlan.mode 相同
 * 
 * 后置条件：
 * - 返回更新后的 YearlyPlan 对象
 * - yearlyPlan.months[monthlyPlan.monthId] 包含月汇总数据
 * - 汇总数据正确计算
 * - 原始 yearlyPlan 对象不被修改
 * 
 * 循环不变式：
 * - 遍历 monthlyPlan.weeks 时，已处理的周数统计准确
 * - totalItems 和 completedItems 始终非负
 */
export function syncMonthlyToYearly(
  monthlyPlan: MonthlyPlan,
  yearlyPlan: YearlyPlan
): YearlyPlan {
  // 验证前置条件：模式匹配
  if (monthlyPlan.mode !== yearlyPlan.mode) {
    throw new ModeMismatchError(monthlyPlan.mode, yearlyPlan.mode);
  }

  // 计算月汇总数据
  let totalItems = 0;
  let completedItems = 0;

  // 遍历月计划的所有周
  for (const weekId in monthlyPlan.weeks) {
    const weeklySummary = monthlyPlan.weeks[weekId];

    totalItems += weeklySummary.totalItems;
    completedItems += weeklySummary.completedItems;

    // 循环不变式：确保计数器非负
    if (totalItems < 0 || completedItems < 0) {
      throw new Error('Invalid state: counters became negative');
    }
  }

  // 创建月汇总对象
  const monthlySummary: MonthlySummary = {
    monthId: monthlyPlan.monthId,
    totalItems,
    completedItems,
    keyHighlights: monthlyPlan.monthlyGoals, // 月目标作为关键亮点
  };

  // 不可变更新：创建新的年计划对象
  const updatedYearlyPlan: YearlyPlan = {
    ...yearlyPlan,
    months: {
      ...yearlyPlan.months,
      [monthlyPlan.monthId]: monthlySummary,
    },
  };

  return updatedYearlyPlan;
}

/**
 * 级联同步函数
 * 
 * 执行完整的级联同步流程：日计划 → 周计划 → 月计划 → 年计划
 * 
 * @param dailyPlan - 要同步的日计划
 * @param mode - 计划模式
 * @param userId - 用户ID
 * @param storageAdapter - 存储适配器
 * @returns Promise<void>
 * 
 * 验证需求: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6
 * 
 * 前置条件：
 * - dailyPlan 已验证且格式正确
 * - userId 对应的用户存在
 * - 存储层可访问
 * 
 * 后置条件：
 * - 所有层级的计划已更新
 * - 数据一致性得到保证
 * - 无数据丢失
 * 
 * 算法流程：
 * 1. 保存日计划到存储层
 * 2. 加载或创建周计划，调用 syncDailyToWeekly
 * 3. 保存更新后的周计划
 * 4. 加载或创建月计划，调用 syncWeeklyToMonthly
 * 5. 保存更新后的月计划
 * 6. 加载或创建年计划，调用 syncMonthlyToYearly
 * 7. 保存更新后的年计划
 */
export async function cascadeSync(
  dailyPlan: DailyPlan,
  mode: PlanMode,
  userId: string,
  storageAdapter: any // IStorageAdapter type
): Promise<void> {
  try {
    const date = dailyPlan.date;
    const parsedDate = parseDate(date);

    // 步骤 1: 保存日计划
    const dailyPlanPath = `users/${userId}/dailyPlans/${date}/${mode}`;
    await storageAdapter.set(dailyPlanPath, dailyPlan);

    // 步骤 2: 同步到周计划
    const weekId = getWeekId(parsedDate);
    const weeklyPlanPath = `users/${userId}/weeklyPlans/${weekId}/${mode}`;
    
    // 加载现有周计划或创建新的
    let weeklyPlan = (await storageAdapter.get(weeklyPlanPath)) as WeeklyPlan | null;
    
    if (!weeklyPlan) {
      // 创建空的周计划
      const weekStartDate = getWeekStartDate(weekId);
      const weekEndDate = getWeekEndDate(weekId);
      
      weeklyPlan = {
        weekId,
        mode,
        startDate: formatDate(weekStartDate),
        endDate: formatDate(weekEndDate),
        days: {},
        weeklyGoals: [],
      };
    }

    // 同步日计划到周计划
    const updatedWeeklyPlan = syncDailyToWeekly(dailyPlan, weeklyPlan);
    await storageAdapter.set(weeklyPlanPath, updatedWeeklyPlan);

    // 步骤 3: 同步到月计划
    const monthId = getMonthId(parsedDate);
    const monthlyPlanPath = `users/${userId}/monthlyPlans/${monthId}/${mode}`;
    
    // 加载现有月计划或创建新的
    let monthlyPlan = (await storageAdapter.get(monthlyPlanPath)) as MonthlyPlan | null;
    
    if (!monthlyPlan) {
      // 创建空的月计划
      monthlyPlan = {
        monthId,
        mode,
        weeks: {},
        monthlyGoals: [],
      };
    }

    // 同步周计划到月计划
    const updatedMonthlyPlan = syncWeeklyToMonthly(updatedWeeklyPlan, monthlyPlan);
    await storageAdapter.set(monthlyPlanPath, updatedMonthlyPlan);

    // 步骤 4: 同步到年计划
    const year = parsedDate.getFullYear();
    const yearlyPlanPath = `users/${userId}/yearlyPlans/${year}/${mode}`;
    
    // 加载现有年计划或创建新的
    let yearlyPlan = (await storageAdapter.get(yearlyPlanPath)) as YearlyPlan | null;
    
    if (!yearlyPlan) {
      // 创建空的年计划
      yearlyPlan = {
        year,
        mode,
        months: {},
        yearlyGoals: [],
      };
    }

    // 同步月计划到年计划
    const updatedYearlyPlan = syncMonthlyToYearly(updatedMonthlyPlan, yearlyPlan);
    await storageAdapter.set(yearlyPlanPath, updatedYearlyPlan);

  } catch (error) {
    // 记录错误并重新抛出
    console.error('Cascade sync failed:', error);
    throw error;
  }
}

/**
 * 辅助函数：获取周开始日期
 * 从 date-utils 导入的 getWeekStartDate 的包装
 */
function getWeekStartDate(weekId: string): Date {
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);
  
  // January 4th is always in week 1
  const jan4 = new Date(Date.UTC(year, 0, 4));
  
  // Get the Monday of week 1
  const dayNum = jan4.getUTCDay() || 7;
  const week1Monday = new Date(jan4);
  week1Monday.setUTCDate(jan4.getUTCDate() - dayNum + 1);
  
  // Add weeks to get to the target week
  const targetMonday = new Date(week1Monday);
  targetMonday.setUTCDate(week1Monday.getUTCDate() + (week - 1) * 7);
  
  return targetMonday;
}

/**
 * 辅助函数：获取周结束日期
 * 从 date-utils 导入的 getWeekEndDate 的包装
 */
function getWeekEndDate(weekId: string): Date {
  const monday = getWeekStartDate(weekId);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  return sunday;
}
