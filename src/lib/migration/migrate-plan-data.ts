/**
 * 数据迁移模块
 * 
 * 将旧的计划数据结构（字符串数组）迁移到新的数据结构（PlanItem对象）
 * 
 * 旧数据结构示例：
 * {
 *   work_Daily_goals: { morning: string[], afternoon: string[], evening: string[] },
 *   work_Weekly_goals: { monday: {...}, tuesday: {...}, ... },
 *   work_Monthly_goals: { week1: string[], week2: string[], ... },
 *   work_Yearly_goals: string[],
 *   // study, life, travel 类似
 * }
 * 
 * 新数据结构：UserPlansDocument (见 src/types/plan-sync.ts)
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */

import { Firestore, doc, getDoc, setDoc } from 'firebase/firestore';
import { PlanItem, DailyPlan, PlanMode, UserPlansDocument } from '@/types/plan-sync';
import { formatDate } from '@/lib/date-utils';
import { logger } from '@/lib/logger';

/**
 * 旧数据结构类型定义
 */
interface OldDailyGoals {
  morning?: string[];
  afternoon?: string[];
  evening?: string[];
}

interface OldWeeklyGoals {
  monday?: OldDailyGoals;
  tuesday?: OldDailyGoals;
  wednesday?: OldDailyGoals;
  thursday?: OldDailyGoals;
  friday?: OldDailyGoals;
  saturday?: OldDailyGoals;
  sunday?: OldDailyGoals;
}

interface OldMonthlyGoals {
  week1?: string[];
  week2?: string[];
  week3?: string[];
  week4?: string[];
  week5?: string[];
}

interface OldPlanData {
  // Work mode
  work_Daily_goals?: OldDailyGoals;
  work_Weekly_goals?: OldWeeklyGoals;
  work_Monthly_goals?: OldMonthlyGoals;
  work_Yearly_goals?: string[];
  
  // Study mode
  study_Daily_goals?: OldDailyGoals;
  study_Weekly_goals?: OldWeeklyGoals;
  study_Monthly_goals?: OldMonthlyGoals;
  study_Yearly_goals?: string[];
  
  // Life mode
  life_Daily_goals?: OldDailyGoals;
  life_Weekly_goals?: OldWeeklyGoals;
  life_Monthly_goals?: OldMonthlyGoals;
  life_Yearly_goals?: string[];
  
  // Travel mode
  travel_Daily_goals?: OldDailyGoals;
  travel_Weekly_goals?: OldWeeklyGoals;
  travel_Monthly_goals?: OldMonthlyGoals;
  travel_Yearly_goals?: string[];
}

/**
 * 备份数据结构
 */
interface BackupData {
  userId: string;
  backupDate: string;
  originalData: OldPlanData;
}

/**
 * 创建 PlanItem 对象
 * 为迁移的计划项生成唯一ID和时间戳
 * 
 * Requirement 14.4: 为迁移的计划项生成唯一ID
 */
function createPlanItem(text: string): PlanItem {
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
 * 转换字符串数组为 PlanItem 数组
 */
function convertStringArrayToPlanItems(strings: string[] | undefined): PlanItem[] {
  if (!strings || !Array.isArray(strings)) {
    return [];
  }
  
  return strings
    .filter(text => text && text.trim().length > 0)
    .map(text => createPlanItem(text.trim()));
}

/**
 * 加载旧的计划数据
 * 
 * Requirement 14.1: 提供数据迁移功能
 */
export async function loadOldPlanData(
  firestore: Firestore,
  userId: string
): Promise<OldPlanData | null> {
  try {
    const docRef = doc(firestore, 'plans', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.log(`No existing plan data found for user ${userId}`);
      return null;
    }
    
    const data = docSnap.data() as OldPlanData;
    logger.log(`Loaded old plan data for user ${userId}`);
    return data;
  } catch (error) {
    logger.error('Failed to load old plan data', error);
    throw new Error(`Failed to load old plan data: ${error}`);
  }
}

/**
 * 备份旧数据到单独的集合
 * 
 * Requirement 14.5: 在迁移前备份旧数据
 */
export async function backupOldData(
  firestore: Firestore,
  userId: string,
  oldData: OldPlanData
): Promise<void> {
  try {
    const backupRef = doc(firestore, 'plan_backups', userId);
    const backupData: BackupData = {
      userId,
      backupDate: new Date().toISOString(),
      originalData: oldData,
    };
    
    await setDoc(backupRef, backupData);
    logger.log(`Backed up old plan data for user ${userId}`);
  } catch (error) {
    logger.error('Failed to backup old plan data', error);
    throw new Error(`Failed to backup old plan data: ${error}`);
  }
}

/**
 * 迁移日计划数据
 * 将旧的字符串数组转换为新的 PlanItem 对象
 * 
 * Requirement 14.3: 将旧的计划项文本转换为新的PlanItem对象
 */
function migrateDailyPlan(
  oldDaily: OldDailyGoals | undefined,
  date: string,
  mode: PlanMode
): DailyPlan | null {
  if (!oldDaily) {
    return null;
  }
  
  const morning = convertStringArrayToPlanItems(oldDaily.morning);
  const afternoon = convertStringArrayToPlanItems(oldDaily.afternoon);
  const evening = convertStringArrayToPlanItems(oldDaily.evening);
  
  // 如果所有时间段都为空，返回 null
  if (morning.length === 0 && afternoon.length === 0 && evening.length === 0) {
    return null;
  }
  
  return {
    date,
    mode,
    morning,
    afternoon,
    evening,
  };
}

/**
 * 执行数据迁移
 * 
 * Requirements: 14.1, 14.2, 14.3, 14.4, 14.5
 */
export async function migratePlanData(
  firestore: Firestore,
  userId: string
): Promise<void> {
  try {
    logger.log(`Starting migration for user ${userId}`);
    
    // 1. 加载旧数据
    const oldData = await loadOldPlanData(firestore, userId);
    
    if (!oldData) {
      logger.log('No old data to migrate');
      return;
    }
    
    // 2. 备份旧数据 (Requirement 14.5)
    await backupOldData(firestore, userId, oldData);
    
    // 3. 创建新数据结构
    const newData: UserPlansDocument = {
      userId,
      dailyPlans: {},
      weeklyPlans: {},
      monthlyPlans: {},
      yearlyPlans: {},
    };
    
    // 4. 迁移日计划（使用当前日期）
    // 注意：旧数据结构不包含历史日期，只能迁移当前数据
    const today = formatDate(new Date());
    const modes: PlanMode[] = ['work', 'study', 'life', 'travel'];
    
    for (const mode of modes) {
      const oldDailyKey = `${mode}_Daily_goals` as keyof OldPlanData;
      const oldDaily = oldData[oldDailyKey] as OldDailyGoals | undefined;
      
      if (oldDaily) {
        const migratedDaily = migrateDailyPlan(oldDaily, today, mode);
        
        if (migratedDaily) {
          if (!newData.dailyPlans[today]) {
            newData.dailyPlans[today] = {};
          }
          newData.dailyPlans[today][mode] = migratedDaily;
          
          logger.log(`Migrated ${mode} daily plan for ${today}`);
        }
      }
    }
    
    // 5. 保存新数据结构
    const docRef = doc(firestore, 'plans', userId);
    await setDoc(docRef, newData);
    
    logger.log(`Migration completed successfully for user ${userId}`);
  } catch (error) {
    logger.error('Migration failed', error);
    throw new Error(`Migration failed: ${error}`);
  }
}

/**
 * 检查是否需要迁移
 * 通过检查数据结构判断是否为旧格式
 */
export async function needsMigration(
  firestore: Firestore,
  userId: string
): Promise<boolean> {
  try {
    const docRef = doc(firestore, 'plans', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      return false;
    }
    
    const data = docSnap.data();
    
    // 如果存在旧格式的字段，需要迁移
    const hasOldFormat = 
      'work_Daily_goals' in data ||
      'study_Daily_goals' in data ||
      'life_Daily_goals' in data ||
      'travel_Daily_goals' in data;
    
    // 如果已经有新格式的字段，不需要迁移
    const hasNewFormat = 'dailyPlans' in data || 'weeklyPlans' in data;
    
    return hasOldFormat && !hasNewFormat;
  } catch (error) {
    logger.error('Failed to check migration status', error);
    return false;
  }
}

/**
 * 验证迁移结果
 * 确保迁移后的数据完整性
 * 
 * Requirement 14.6: 验证迁移后的数据完整性
 */
export async function validateMigration(
  firestore: Firestore,
  userId: string
): Promise<boolean> {
  try {
    logger.log(`Validating migration for user ${userId}`);
    
    // 1. 加载旧数据（从备份）
    const backupRef = doc(firestore, 'plan_backups', userId);
    const backupSnap = await getDoc(backupRef);
    
    if (!backupSnap.exists()) {
      logger.error('No backup found for validation');
      return false;
    }
    
    const backupData = backupSnap.data() as BackupData;
    const oldData = backupData.originalData;
    
    // 2. 加载新数据
    const docRef = doc(firestore, 'plans', userId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      logger.error('No new data found after migration');
      return false;
    }
    
    const newData = docSnap.data() as UserPlansDocument;
    
    // 3. 验证数据完整性
    const today = formatDate(new Date());
    const modes: PlanMode[] = ['work', 'study', 'life', 'travel'];
    
    for (const mode of modes) {
      const oldDailyKey = `${mode}_Daily_goals` as keyof OldPlanData;
      const oldDaily = oldData[oldDailyKey] as OldDailyGoals | undefined;
      
      if (oldDaily) {
        // 计算旧数据的总计划项数量
        const oldMorningCount = oldDaily.morning?.length || 0;
        const oldAfternoonCount = oldDaily.afternoon?.length || 0;
        const oldEveningCount = oldDaily.evening?.length || 0;
        const oldTotal = oldMorningCount + oldAfternoonCount + oldEveningCount;
        
        // 如果旧数据为空，跳过
        if (oldTotal === 0) {
          continue;
        }
        
        // 检查新数据是否存在
        const newDaily = newData.dailyPlans?.[today]?.[mode];
        
        if (!newDaily) {
          logger.error(`Missing migrated data for ${mode} on ${today}`);
          return false;
        }
        
        // 计算新数据的总计划项数量
        const newTotal = 
          newDaily.morning.length +
          newDaily.afternoon.length +
          newDaily.evening.length;
        
        // 验证数量是否匹配
        if (oldTotal !== newTotal) {
          logger.error(
            `Item count mismatch for ${mode}: old=${oldTotal}, new=${newTotal}`
          );
          return false;
        }
        
        // 验证每个计划项都有唯一ID和时间戳
        const allItems = [
          ...newDaily.morning,
          ...newDaily.afternoon,
          ...newDaily.evening,
        ];
        
        const ids = new Set<string>();
        for (const item of allItems) {
          // 检查必需字段
          if (!item.id || !item.text || !item.createdAt || !item.updatedAt) {
            logger.error(`Invalid plan item structure in ${mode}`);
            return false;
          }
          
          // 检查ID唯一性
          if (ids.has(item.id)) {
            logger.error(`Duplicate ID found: ${item.id}`);
            return false;
          }
          ids.add(item.id);
        }
        
        logger.log(`Validation passed for ${mode} daily plan`);
      }
    }
    
    logger.log('Migration validation completed successfully');
    return true;
  } catch (error) {
    logger.error('Migration validation failed', error);
    return false;
  }
}

/**
 * 回滚迁移
 * 从备份恢复旧数据
 * 
 * Requirement 14.7: 提供回滚功能恢复到旧版本
 */
export async function rollbackMigration(
  firestore: Firestore,
  userId: string
): Promise<void> {
  try {
    logger.log(`Rolling back migration for user ${userId}`);
    
    // 1. 加载备份数据
    const backupRef = doc(firestore, 'plan_backups', userId);
    const backupSnap = await getDoc(backupRef);
    
    if (!backupSnap.exists()) {
      throw new Error('No backup found for rollback');
    }
    
    const backupData = backupSnap.data() as BackupData;
    const oldData = backupData.originalData;
    
    // 2. 恢复旧数据
    const docRef = doc(firestore, 'plans', userId);
    await setDoc(docRef, oldData);
    
    logger.log(`Rollback completed successfully for user ${userId}`);
  } catch (error) {
    logger.error('Rollback failed', error);
    throw new Error(`Rollback failed: ${error}`);
  }
}

/**
 * 执行完整的迁移流程（包含验证）
 * 
 * Requirements: 14.1, 14.2, 14.6, 14.7
 */
export async function migrateWithValidation(
  firestore: Firestore,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. 检查是否需要迁移
    const needsIt = await needsMigration(firestore, userId);
    
    if (!needsIt) {
      logger.log('Migration not needed');
      return { success: true };
    }
    
    // 2. 执行迁移
    await migratePlanData(firestore, userId);
    
    // 3. 验证迁移结果
    const isValid = await validateMigration(firestore, userId);
    
    if (!isValid) {
      // 验证失败，自动回滚
      logger.error('Migration validation failed, rolling back...');
      await rollbackMigration(firestore, userId);
      return { 
        success: false, 
        error: 'Migration validation failed. Data has been rolled back to original state.' 
      };
    }
    
    logger.log('Migration completed and validated successfully');
    return { success: true };
  } catch (error) {
    logger.error('Migration with validation failed', error);
    
    // 尝试回滚
    try {
      await rollbackMigration(firestore, userId);
      return { 
        success: false, 
        error: `Migration failed: ${error}. Data has been rolled back.` 
      };
    } catch (rollbackError) {
      return { 
        success: false, 
        error: `Migration failed: ${error}. Rollback also failed: ${rollbackError}` 
      };
    }
  }
}
