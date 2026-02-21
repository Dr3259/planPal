/**
 * 数据验证模块
 * 
 * 提供各种数据验证函数，确保输入数据的有效性和安全性
 * 验证需求: 10.1-10.10, 13.5
 */

import type { PlanMode } from '@/types/plan-sync';

/**
 * 验证日期字符串是否符合 ISO 8601 格式 (YYYY-MM-DD)
 * 
 * @param dateString - 待验证的日期字符串
 * @returns 如果日期格式有效且日期合法则返回 true
 * 
 * 验证需求: 10.1, 6.7
 * 
 * @example
 * validateDate("2024-01-15") // true
 * validateDate("2024-13-01") // false (无效月份)
 * validateDate("2024/01/15") // false (格式错误)
 */
export function validateDate(dateString: string): boolean {
  // 检查格式: YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) {
    return false;
  }

  // 尝试解析日期并验证其有效性
  const date = new Date(dateString);
  
  // 检查日期是否有效（不是 Invalid Date）
  if (isNaN(date.getTime())) {
    return false;
  }

  // 验证解析后的日期与输入字符串一致
  // 这可以捕获像 "2024-02-30" 这样的无效日期
  const [year, month, day] = dateString.split('-').map(Number);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 && // getMonth() 返回 0-11
    date.getDate() === day
  );
}

/**
 * 验证计划模式是否为有效的枚举值
 * 
 * @param mode - 待验证的计划模式
 * @returns 如果模式是四个枚举值之一则返回 true
 * 
 * 验证需求: 10.2
 * 
 * @example
 * validatePlanMode("work") // true
 * validatePlanMode("invalid") // false
 */
export function validatePlanMode(mode: string): mode is PlanMode {
  const validModes: PlanMode[] = ['work', 'study', 'life', 'travel'];
  return validModes.includes(mode as PlanMode);
}

/**
 * 验证计划项文本长度是否在有效范围内 (1-500字符)
 * 
 * @param text - 待验证的计划项文本
 * @returns 如果文本长度在 1-500 字符之间则返回 true
 * 
 * 验证需求: 10.3
 * 
 * @example
 * validatePlanItemText("完成项目报告") // true
 * validatePlanItemText("") // false (空字符串)
 * validatePlanItemText("a".repeat(501)) // false (超过500字符)
 */
export function validatePlanItemText(text: string): boolean {
  return text.length >= 1 && text.length <= 500;
}

/**
 * 验证周ID是否符合 ISO 8601 周编号格式 (YYYY-Www)
 * 
 * @param weekId - 待验证的周ID
 * @returns 如果周ID格式有效则返回 true
 * 
 * 验证需求: 10.5
 * 
 * @example
 * validateWeekId("2024-W03") // true
 * validateWeekId("2024-W54") // false (周数超出范围)
 * validateWeekId("2024-3") // false (格式错误)
 */
export function validateWeekId(weekId: string): boolean {
  // 检查格式: YYYY-Www (w 是小写)
  const weekRegex = /^\d{4}-W\d{2}$/;
  if (!weekRegex.test(weekId)) {
    return false;
  }

  // 提取年份和周数
  const [yearStr, weekStr] = weekId.split('-W');
  const year = parseInt(yearStr, 10);
  const week = parseInt(weekStr, 10);

  // 验证年份范围 (1000-9999)
  if (year < 1000 || year > 9999) {
    return false;
  }

  // 验证周数范围 (1-53)
  // ISO 8601 标准中，一年最多有53周
  if (week < 1 || week > 53) {
    return false;
  }

  return true;
}

/**
 * 验证月ID是否符合 "YYYY-MM" 格式
 * 
 * @param monthId - 待验证的月ID
 * @returns 如果月ID格式有效则返回 true
 * 
 * 验证需求: 10.6
 * 
 * @example
 * validateMonthId("2024-01") // true
 * validateMonthId("2024-13") // false (月份超出范围)
 * validateMonthId("2024-1") // false (格式错误)
 */
export function validateMonthId(monthId: string): boolean {
  // 检查格式: YYYY-MM
  const monthRegex = /^\d{4}-\d{2}$/;
  if (!monthRegex.test(monthId)) {
    return false;
  }

  // 提取年份和月份
  const [yearStr, monthStr] = monthId.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);

  // 验证年份范围 (1000-9999)
  if (year < 1000 || year > 9999) {
    return false;
  }

  // 验证月份范围 (1-12)
  if (month < 1 || month > 12) {
    return false;
  }

  return true;
}

/**
 * 验证年份是否为有效的四位数
 * 
 * @param year - 待验证的年份
 * @returns 如果年份是有效的四位数则返回 true
 * 
 * 验证需求: 10.7
 * 
 * @example
 * validateYear(2024) // true
 * validateYear(999) // false (不是四位数)
 * validateYear(10000) // false (超过四位数)
 */
export function validateYear(year: number): boolean {
  return Number.isInteger(year) && year >= 1000 && year <= 9999;
}

/**
 * 验证汇总数据的有效性
 * 确保 totalItems 和 completedItems 为非负数，且 completedItems 不大于 totalItems
 * 
 * @param totalItems - 总计划项数量
 * @param completedItems - 已完成计划项数量
 * @returns 如果汇总数据有效则返回 true
 * 
 * 验证需求: 10.8, 10.9
 * 
 * @example
 * validateSummaryData(10, 5) // true
 * validateSummaryData(10, 15) // false (已完成数大于总数)
 * validateSummaryData(-1, 0) // false (负数)
 */
export function validateSummaryData(
  totalItems: number,
  completedItems: number
): boolean {
  // 验证两者都是非负整数
  if (!Number.isInteger(totalItems) || totalItems < 0) {
    return false;
  }
  if (!Number.isInteger(completedItems) || completedItems < 0) {
    return false;
  }

  // 验证已完成数不大于总数
  return completedItems <= totalItems;
}

/**
 * 转义 HTML 特殊字符以防止 XSS 攻击
 * 
 * @param text - 待转义的文本
 * @returns 转义后的安全文本
 * 
 * 验证需求: 13.5
 * 
 * @example
 * sanitizeHtml("<script>alert('xss')</script>")
 * // "&lt;script&gt;alert(&#x27;xss&#x27;)&lt;&#x2F;script&gt;"
 */
export function sanitizeHtml(text: string): string {
  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return text.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * 验证计划项ID的唯一性（在给定的ID列表中）
 * 
 * @param id - 待验证的ID
 * @param existingIds - 已存在的ID列表
 * @returns 如果ID唯一则返回 true
 * 
 * 验证需求: 10.4
 * 
 * @example
 * validatePlanItemId("id-1", ["id-2", "id-3"]) // true
 * validatePlanItemId("id-1", ["id-1", "id-2"]) // false
 */
export function validatePlanItemId(id: string, existingIds: string[]): boolean {
  return !existingIds.includes(id);
}
