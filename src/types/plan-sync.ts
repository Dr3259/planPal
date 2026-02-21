/**
 * 计划层级联动 - 核心数据类型定义
 * 
 * 本文件定义了计划系统的所有核心接口和类型，包括：
 * - 计划项 (PlanItem)
 * - 日计划 (DailyPlan)
 * - 周计划 (WeeklyPlan)
 * - 月计划 (MonthlyPlan)
 * - 年计划 (YearlyPlan)
 * - 汇总数据结构
 * - Firestore 文档结构
 */

/**
 * 计划模式枚举
 * 支持四种计划类型：工作、学习、生活、旅行
 */
export type PlanMode = 'work' | 'study' | 'life' | 'travel';

/**
 * 计划项基础类型
 * 表示单个计划任务或活动
 */
export interface PlanItem {
  /** 唯一标识符 */
  id: string;
  /** 计划项文本内容 (1-500字符) */
  text: string;
  /** 是否已完成 */
  completed: boolean;
  /** 创建时间 */
  createdAt: Date;
  /** 最后更新时间 */
  updatedAt: Date;
}

/**
 * 日计划数据结构
 * 按日期存储，包含早中晚三个时间段的计划项
 */
export interface DailyPlan {
  /** 日期 (ISO 8601 格式: "2024-01-15") */
  date: string;
  /** 计划模式 */
  mode: PlanMode;
  /** 早上的计划项 */
  morning: PlanItem[];
  /** 下午的计划项 */
  afternoon: PlanItem[];
  /** 晚上的计划项 */
  evening: PlanItem[];
}

/**
 * 周计划数据结构
 * 包含一周内所有日计划的汇总
 */
export interface WeeklyPlan {
  /** 周ID (ISO 8601 周编号格式: "2024-W03") */
  weekId: string;
  /** 计划模式 */
  mode: PlanMode;
  /** 周开始日期 (周一, ISO 8601 格式) */
  startDate: string;
  /** 周结束日期 (周日, ISO 8601 格式) */
  endDate: string;
  /** 一周内的日计划，键为日期字符串 */
  days: {
    [date: string]: DailyPlan;
  };
  /** 周目标列表 (用户手动添加) */
  weeklyGoals: string[];
}

/**
 * 周汇总数据结构
 * 用于月计划中汇总周数据
 */
export interface WeeklySummary {
  /** 周ID */
  weekId: string;
  /** 周开始日期 */
  startDate: string;
  /** 周结束日期 */
  endDate: string;
  /** 总计划项数量 */
  totalItems: number;
  /** 已完成计划项数量 */
  completedItems: number;
  /** 关键亮点 (从周目标提取) */
  keyHighlights: string[];
}

/**
 * 月计划数据结构
 * 包含一个月内所有周汇总
 */
export interface MonthlyPlan {
  /** 月ID (格式: "2024-01") */
  monthId: string;
  /** 计划模式 */
  mode: PlanMode;
  /** 月内的周汇总，键为周ID */
  weeks: {
    [weekId: string]: WeeklySummary;
  };
  /** 月目标列表 (用户手动添加) */
  monthlyGoals: string[];
}

/**
 * 月汇总数据结构
 * 用于年计划中汇总月数据
 */
export interface MonthlySummary {
  /** 月ID */
  monthId: string;
  /** 总计划项数量 */
  totalItems: number;
  /** 已完成计划项数量 */
  completedItems: number;
  /** 关键亮点 (从月目标提取) */
  keyHighlights: string[];
}

/**
 * 年计划数据结构
 * 包含一年内所有月汇总
 */
export interface YearlyPlan {
  /** 年份 (例如: 2024) */
  year: number;
  /** 计划模式 */
  mode: PlanMode;
  /** 年内的月汇总，键为月ID */
  months: {
    [monthId: string]: MonthlySummary;
  };
  /** 年度目标列表 (用户手动添加) */
  yearlyGoals: string[];
}

/**
 * Firestore 用户计划文档结构
 * 存储用户的所有计划数据
 */
export interface UserPlansDocument {
  /** 用户ID */
  userId: string;
  /** 日计划数据，按日期和模式组织 */
  dailyPlans: {
    [date: string]: {
      [mode: string]: DailyPlan;
    };
  };
  /** 周计划数据，按周ID和模式组织 */
  weeklyPlans: {
    [weekId: string]: {
      [mode: string]: WeeklyPlan;
    };
  };
  /** 月计划数据，按月ID和模式组织 */
  monthlyPlans: {
    [monthId: string]: {
      [mode: string]: MonthlyPlan;
    };
  };
  /** 年计划数据，按年份和模式组织 */
  yearlyPlans: {
    [year: string]: {
      [mode: string]: YearlyPlan;
    };
  };
}
