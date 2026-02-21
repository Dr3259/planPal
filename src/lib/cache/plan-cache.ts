/**
 * 计划缓存管理
 * 
 * 在内存中缓存当前周/月/年的计划数据，提高性能
 * 
 * 验证需求: 12.7, 12.8
 */

import type {
  WeeklyPlan,
  MonthlyPlan,
  YearlyPlan,
  PlanMode,
} from '@/types/plan-sync';
import { logger } from '@/lib/logger';

/**
 * 缓存条目接口
 */
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

/**
 * 缓存键类型
 */
type CacheKey = string;

/**
 * 计划缓存类
 * 
 * 提供内存缓存功能，支持：
 * - 时间失效（默认5分钟）
 * - 手动失效
 * - 按模式和日期/周/月/年分别缓存
 */
export class PlanCache {
  private cache: Map<CacheKey, CacheEntry<any>>;
  private defaultTTL: number; // Time to live in milliseconds

  /**
   * 创建缓存实例
   * 
   * @param ttlMinutes - 缓存有效期（分钟），默认5分钟
   */
  constructor(ttlMinutes: number = 5) {
    this.cache = new Map();
    this.defaultTTL = ttlMinutes * 60 * 1000; // 转换为毫秒
    logger.log(`PlanCache initialized with TTL: ${ttlMinutes} minutes`);
  }

  /**
   * 生成缓存键
   * 
   * @param type - 计划类型 ('weekly' | 'monthly' | 'yearly')
   * @param id - 计划ID（weekId, monthId, 或 year）
   * @param mode - 计划模式
   * @param userId - 用户ID
   * @returns 缓存键
   */
  private generateKey(
    type: 'weekly' | 'monthly' | 'yearly',
    id: string | number,
    mode: PlanMode,
    userId: string
  ): CacheKey {
    return `${userId}:${type}:${id}:${mode}`;
  }

  /**
   * 检查缓存条目是否过期
   * 
   * @param entry - 缓存条目
   * @returns 是否过期
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() > entry.expiresAt;
  }

  /**
   * 获取缓存数据
   * 
   * @param type - 计划类型
   * @param id - 计划ID
   * @param mode - 计划模式
   * @param userId - 用户ID
   * @returns 缓存的数据，如果不存在或已过期则返回 null
   */
  get<T>(
    type: 'weekly' | 'monthly' | 'yearly',
    id: string | number,
    mode: PlanMode,
    userId: string
  ): T | null {
    const key = this.generateKey(type, id, mode, userId);
    const entry = this.cache.get(key);

    if (!entry) {
      logger.log(`Cache miss: ${key}`);
      return null;
    }

    if (this.isExpired(entry)) {
      logger.log(`Cache expired: ${key}`);
      this.cache.delete(key);
      return null;
    }

    logger.log(`Cache hit: ${key}`);
    return entry.data as T;
  }

  /**
   * 设置缓存数据
   * 
   * @param type - 计划类型
   * @param id - 计划ID
   * @param mode - 计划模式
   * @param userId - 用户ID
   * @param data - 要缓存的数据
   * @param ttl - 可选的自定义TTL（毫秒）
   */
  set<T>(
    type: 'weekly' | 'monthly' | 'yearly',
    id: string | number,
    mode: PlanMode,
    userId: string,
    data: T,
    ttl?: number
  ): void {
    const key = this.generateKey(type, id, mode, userId);
    const now = Date.now();
    const expiresAt = now + (ttl ?? this.defaultTTL);

    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      expiresAt,
    };

    this.cache.set(key, entry);
    logger.log(`Cache set: ${key} (expires in ${(expiresAt - now) / 1000}s)`);
  }

  /**
   * 使指定缓存失效
   * 
   * @param type - 计划类型
   * @param id - 计划ID
   * @param mode - 计划模式
   * @param userId - 用户ID
   */
  invalidate(
    type: 'weekly' | 'monthly' | 'yearly',
    id: string | number,
    mode: PlanMode,
    userId: string
  ): void {
    const key = this.generateKey(type, id, mode, userId);
    const deleted = this.cache.delete(key);
    
    if (deleted) {
      logger.log(`Cache invalidated: ${key}`);
    }
  }

  /**
   * 使指定用户的所有缓存失效
   * 
   * @param userId - 用户ID
   */
  invalidateUser(userId: string): void {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    logger.log(`Invalidated ${count} cache entries for user: ${userId}`);
  }

  /**
   * 使指定模式的所有缓存失效
   * 
   * @param mode - 计划模式
   * @param userId - 用户ID
   */
  invalidateMode(mode: PlanMode, userId: string): void {
    let count = 0;
    
    for (const key of this.cache.keys()) {
      if (key.startsWith(`${userId}:`) && key.endsWith(`:${mode}`)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    logger.log(`Invalidated ${count} cache entries for mode: ${mode}`);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    const size = this.cache.size;
    this.cache.clear();
    logger.log(`Cache cleared: ${size} entries removed`);
  }

  /**
   * 清理过期的缓存条目
   * 
   * @returns 清理的条目数量
   */
  cleanup(): number {
    let count = 0;
    
    for (const [key, entry] of this.cache.entries()) {
      if (this.isExpired(entry)) {
        this.cache.delete(key);
        count++;
      }
    }
    
    if (count > 0) {
      logger.log(`Cache cleanup: ${count} expired entries removed`);
    }
    
    return count;
  }

  /**
   * 获取缓存统计信息
   * 
   * @returns 缓存统计对象
   */
  getStats(): {
    size: number;
    expired: number;
    active: number;
  } {
    let expired = 0;
    
    for (const entry of this.cache.values()) {
      if (this.isExpired(entry)) {
        expired++;
      }
    }
    
    return {
      size: this.cache.size,
      expired,
      active: this.cache.size - expired,
    };
  }

  /**
   * 获取周计划缓存
   */
  getWeeklyPlan(weekId: string, mode: PlanMode, userId: string): WeeklyPlan | null {
    return this.get<WeeklyPlan>('weekly', weekId, mode, userId);
  }

  /**
   * 设置周计划缓存
   */
  setWeeklyPlan(weekId: string, mode: PlanMode, userId: string, data: WeeklyPlan): void {
    this.set('weekly', weekId, mode, userId, data);
  }

  /**
   * 获取月计划缓存
   */
  getMonthlyPlan(monthId: string, mode: PlanMode, userId: string): MonthlyPlan | null {
    return this.get<MonthlyPlan>('monthly', monthId, mode, userId);
  }

  /**
   * 设置月计划缓存
   */
  setMonthlyPlan(monthId: string, mode: PlanMode, userId: string, data: MonthlyPlan): void {
    this.set('monthly', monthId, mode, userId, data);
  }

  /**
   * 获取年计划缓存
   */
  getYearlyPlan(year: number, mode: PlanMode, userId: string): YearlyPlan | null {
    return this.get<YearlyPlan>('yearly', year, mode, userId);
  }

  /**
   * 设置年计划缓存
   */
  setYearlyPlan(year: number, mode: PlanMode, userId: string, data: YearlyPlan): void {
    this.set('yearly', year, mode, userId, data);
  }
}

/**
 * 全局缓存实例
 * 默认TTL为5分钟
 */
export const planCache = new PlanCache(5);

/**
 * 启动定期清理任务
 * 每分钟清理一次过期缓存
 */
if (typeof window !== 'undefined') {
  setInterval(() => {
    planCache.cleanup();
  }, 60 * 1000); // 每分钟清理一次
}
