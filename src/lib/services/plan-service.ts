/**
 * 计划服务层
 * 
 * 提供计划数据的 CRUD 操作，集成同步引擎和存储层
 * 
 * 验证需求: 1.1, 1.2, 1.3, 1.4, 5.2
 */

import type {
  DailyPlan,
  WeeklyPlan,
  MonthlyPlan,
  YearlyPlan,
  PlanMode,
  PlanItem,
} from '@/types/plan-sync';
import type { IStorageAdapter } from '@/lib/storage/storage-interface';
import { cascadeSync } from '@/lib/sync-engine/sync-engine';
import { getWeekId, getMonthId, formatDate, getWeekStartDate, getWeekEndDate } from '@/lib/date-utils';
import { logger } from '@/lib/logger';
import { planCache } from '@/lib/cache/plan-cache';

/**
 * 创建新的计划项
 * 生成唯一ID和时间戳
 * 
 * @param text - 计划项文本内容
 * @returns 新的计划项对象
 * 
 * 验证需求: 1.6, 1.7
 */
export function createPlanItem(text: string): PlanItem {
  const now = new Date();
  
  return {
    id: crypto.randomUUID(),
    text,
    completed: false,
    createdAt: now,
    updatedAt: now,
  };
}

/**
 * 更新计划项
 * 返回更新后的新计划项对象（不可变更新）
 * 
 * @param item - 原计划项
 * @param updates - 要更新的字段
 * @returns 更新后的计划项对象
 * 
 * 验证需求: 1.2, 1.3
 */
export function updatePlanItem(item: PlanItem, updates: Partial<PlanItem>): PlanItem {
  return {
    ...item,
    ...updates,
    updatedAt: new Date(), // 总是更新时间戳
  };
}

/**
 * 切换计划项的完成状态
 * 
 * @param item - 计划项
 * @returns 更新后的计划项对象
 * 
 * 验证需求: 1.3
 */
export function togglePlanItemCompletion(item: PlanItem): PlanItem {
  return updatePlanItem(item, {
    completed: !item.completed,
  });
}

/**
 * 计划服务类
 * 封装计划数据的所有业务逻辑操作
 */
export class PlanService {
  private storageAdapter: IStorageAdapter;
  private userId: string;

  constructor(storageAdapter: IStorageAdapter, userId: string) {
    this.storageAdapter = storageAdapter;
    this.userId = userId;
  }

  /**
   * 保存日计划并触发级联同步
   * 
   * @param date - 日期字符串 (ISO 8601 格式)
   * @param mode - 计划模式
   * @param plan - 日计划数据
   * @returns Promise<void>
   * 
   * 验证需求: 1.1, 5.2
   */
  async saveDailyPlan(date: string, mode: PlanMode, plan: DailyPlan): Promise<void> {
    try {
      logger.log(`Saving daily plan for ${date} (${mode})`);
      
      // 触发级联同步（会自动保存日计划和更新所有层级）
      await cascadeSync(plan, mode, this.userId, this.storageAdapter);
      
      // 使相关缓存失效
      const parsedDate = new Date(date);
      const weekId = getWeekId(parsedDate);
      const monthId = getMonthId(parsedDate);
      const year = parsedDate.getFullYear();
      
      planCache.invalidate('weekly', weekId, mode, this.userId);
      planCache.invalidate('monthly', monthId, mode, this.userId);
      planCache.invalidate('yearly', year, mode, this.userId);
      
      logger.log(`Daily plan saved and synced successfully for ${date}`);
    } catch (error) {
      logger.log(`Failed to save daily plan for ${date}:`, error);
      throw error;
    }
  }

  /**
   * 加载日计划
   * 
   * @param date - 日期字符串 (ISO 8601 格式)
   * @param mode - 计划模式
   * @param userId - 用户ID
   * @returns Promise<DailyPlan | null>
   * 
   * 验证需求: 1.1
   */
  async loadDailyPlan(date: string, mode: PlanMode, userId: string): Promise<DailyPlan | null> {
    try {
      const path = `users/${userId}/dailyPlans/${date}/${mode}`;
      const plan = await this.storageAdapter.get<DailyPlan>(path);
      
      if (plan) {
        logger.log(`Loaded daily plan for ${date} (${mode})`);
      } else {
        logger.log(`No daily plan found for ${date} (${mode})`);
      }
      
      return plan;
    } catch (error) {
      logger.log(`Failed to load daily plan for ${date}:`, error);
      throw error;
    }
  }

  /**
   * 加载周计划
   * 
   * @param weekId - 周ID (ISO 8601 周编号格式)
   * @param mode - 计划模式
   * @param userId - 用户ID
   * @returns Promise<WeeklyPlan | null>
   * 
   * 验证需求: 2.2
   */
  async loadWeeklyPlan(weekId: string, mode: PlanMode, userId: string): Promise<WeeklyPlan | null> {
    try {
      // 先检查缓存
      const cached = planCache.getWeeklyPlan(weekId, mode, userId);
      if (cached) {
        logger.log(`Loaded weekly plan from cache for ${weekId} (${mode})`);
        return cached;
      }
      
      // 从存储加载
      const path = `users/${userId}/weeklyPlans/${weekId}/${mode}`;
      const plan = await this.storageAdapter.get<WeeklyPlan>(path);
      
      if (plan) {
        logger.log(`Loaded weekly plan for ${weekId} (${mode})`);
        // 缓存结果
        planCache.setWeeklyPlan(weekId, mode, userId, plan);
      } else {
        logger.log(`No weekly plan found for ${weekId} (${mode}), creating empty plan`);
        
        // 创建空的周计划
        const startDate = getWeekStartDate(weekId);
        const endDate = getWeekEndDate(weekId);
        
        const emptyPlan: WeeklyPlan = {
          weekId,
          mode,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          days: {},
          weeklyGoals: [],
        };
        
        return emptyPlan;
      }
      
      return plan;
    } catch (error) {
      logger.log(`Failed to load weekly plan for ${weekId}:`, error);
      throw error;
    }
  }

  /**
   * 加载月计划
   * 
   * @param monthId - 月ID (格式: "YYYY-MM")
   * @param mode - 计划模式
   * @param userId - 用户ID
   * @returns Promise<MonthlyPlan | null>
   * 
   * 验证需求: 3.1
   */
  async loadMonthlyPlan(monthId: string, mode: PlanMode, userId: string): Promise<MonthlyPlan | null> {
    try {
      // 先检查缓存
      const cached = planCache.getMonthlyPlan(monthId, mode, userId);
      if (cached) {
        logger.log(`Loaded monthly plan from cache for ${monthId} (${mode})`);
        return cached;
      }
      
      // 从存储加载
      const path = `users/${userId}/monthlyPlans/${monthId}/${mode}`;
      const plan = await this.storageAdapter.get<MonthlyPlan>(path);
      
      if (plan) {
        logger.log(`Loaded monthly plan for ${monthId} (${mode})`);
        // 缓存结果
        planCache.setMonthlyPlan(monthId, mode, userId, plan);
      } else {
        logger.log(`No monthly plan found for ${monthId} (${mode}), creating empty plan`);
        
        // 创建空的月计划
        const emptyPlan: MonthlyPlan = {
          monthId,
          mode,
          weeks: {},
          monthlyGoals: [],
        };
        
        return emptyPlan;
      }
      
      return plan;
    } catch (error) {
      logger.log(`Failed to load monthly plan for ${monthId}:`, error);
      throw error;
    }
  }

  /**
   * 加载年计划
   * 
   * @param year - 年份
   * @param mode - 计划模式
   * @param userId - 用户ID
   * @returns Promise<YearlyPlan | null>
   * 
   * 验证需求: 4.1
   */
  async loadYearlyPlan(year: number, mode: PlanMode, userId: string): Promise<YearlyPlan | null> {
    try {
      // 先检查缓存
      const cached = planCache.getYearlyPlan(year, mode, userId);
      if (cached) {
        logger.log(`Loaded yearly plan from cache for ${year} (${mode})`);
        return cached;
      }
      
      // 从存储加载
      const path = `users/${userId}/yearlyPlans/${year}/${mode}`;
      const plan = await this.storageAdapter.get<YearlyPlan>(path);
      
      if (plan) {
        logger.log(`Loaded yearly plan for ${year} (${mode})`);
        // 缓存结果
        planCache.setYearlyPlan(year, mode, userId, plan);
      } else {
        logger.log(`No yearly plan found for ${year} (${mode}), creating empty plan`);
        
        // 创建空的年计划
        const emptyPlan: YearlyPlan = {
          year,
          mode,
          months: {},
          yearlyGoals: [],
        };
        
        return emptyPlan;
      }
      
      return plan;
    } catch (error) {
      logger.log(`Failed to load yearly plan for ${year}:`, error);
      throw error;
    }
  }

  /**
   * 更新周目标
   * 
   * @param weekId - 周ID (ISO 8601 周编号格式)
   * @param mode - 计划模式
   * @param goals - 周目标列表
   * @returns Promise<void>
   * 
   * 验证需求: 9.1, 9.7
   */
  async updateWeeklyGoals(weekId: string, mode: PlanMode, goals: string[]): Promise<void> {
    try {
      logger.log(`Updating weekly goals for ${weekId} (${mode})`);
      
      const path = `users/${this.userId}/weeklyPlans/${weekId}/${mode}`;
      
      // 加载现有周计划
      let weeklyPlan = await this.storageAdapter.get<WeeklyPlan>(path);
      
      if (!weeklyPlan) {
        // 如果周计划不存在，创建新的
        const startDate = getWeekStartDate(weekId);
        const endDate = getWeekEndDate(weekId);
        
        weeklyPlan = {
          weekId,
          mode,
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          days: {},
          weeklyGoals: goals,
        };
      } else {
        // 更新周目标
        weeklyPlan = {
          ...weeklyPlan,
          weeklyGoals: goals,
        };
      }
      
      // 保存更新后的周计划
      await this.storageAdapter.set(path, weeklyPlan);
      
      // 使缓存失效
      planCache.invalidate('weekly', weekId, mode, this.userId);
      
      logger.log(`Weekly goals updated successfully for ${weekId}`);
    } catch (error) {
      logger.log(`Failed to update weekly goals for ${weekId}:`, error);
      throw error;
    }
  }

  /**
   * 更新月目标
   * 
   * @param monthId - 月ID (格式: "YYYY-MM")
   * @param mode - 计划模式
   * @param goals - 月目标列表
   * @returns Promise<void>
   * 
   * 验证需求: 9.2, 9.7
   */
  async updateMonthlyGoals(monthId: string, mode: PlanMode, goals: string[]): Promise<void> {
    try {
      logger.log(`Updating monthly goals for ${monthId} (${mode})`);
      
      const path = `users/${this.userId}/monthlyPlans/${monthId}/${mode}`;
      
      // 加载现有月计划
      let monthlyPlan = await this.storageAdapter.get<MonthlyPlan>(path);
      
      if (!monthlyPlan) {
        // 如果月计划不存在，创建新的
        monthlyPlan = {
          monthId,
          mode,
          weeks: {},
          monthlyGoals: goals,
        };
      } else {
        // 更新月目标
        monthlyPlan = {
          ...monthlyPlan,
          monthlyGoals: goals,
        };
      }
      
      // 保存更新后的月计划
      await this.storageAdapter.set(path, monthlyPlan);
      
      // 使缓存失效
      planCache.invalidate('monthly', monthId, mode, this.userId);
      
      logger.log(`Monthly goals updated successfully for ${monthId}`);
    } catch (error) {
      logger.log(`Failed to update monthly goals for ${monthId}:`, error);
      throw error;
    }
  }

  /**
   * 更新年度目标
   * 
   * @param year - 年份
   * @param mode - 计划模式
   * @param goals - 年度目标列表
   * @returns Promise<void>
   * 
   * 验证需求: 9.3, 9.7
   */
  async updateYearlyGoals(year: number, mode: PlanMode, goals: string[]): Promise<void> {
    try {
      logger.log(`Updating yearly goals for ${year} (${mode})`);
      
      const path = `users/${this.userId}/yearlyPlans/${year}/${mode}`;
      
      // 加载现有年计划
      let yearlyPlan = await this.storageAdapter.get<YearlyPlan>(path);
      
      if (!yearlyPlan) {
        // 如果年计划不存在，创建新的
        yearlyPlan = {
          year,
          mode,
          months: {},
          yearlyGoals: goals,
        };
      } else {
        // 更新年度目标
        yearlyPlan = {
          ...yearlyPlan,
          yearlyGoals: goals,
        };
      }
      
      // 保存更新后的年计划
      await this.storageAdapter.set(path, yearlyPlan);
      
      // 使缓存失效
      planCache.invalidate('yearly', year, mode, this.userId);
      
      logger.log(`Yearly goals updated successfully for ${year}`);
    } catch (error) {
      logger.log(`Failed to update yearly goals for ${year}:`, error);
      throw error;
    }
  }
}

/**
 * 创建计划服务实例的工厂函数
 * 
 * @param storageAdapter - 存储适配器
 * @param userId - 用户ID
 * @returns PlanService 实例
 */
export function createPlanService(
  storageAdapter: IStorageAdapter,
  userId: string
): PlanService {
  return new PlanService(storageAdapter, userId);
}
