/**
 * 防抖工具函数
 * 
 * 用于延迟执行频繁触发的操作，减少不必要的调用
 * 
 * 验证需求: 12.6
 */

/**
 * 防抖函数
 * 
 * 当函数被频繁调用时，只在最后一次调用后的指定延迟时间后执行
 * 
 * @param func - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * ```typescript
 * const debouncedSave = debounce(async () => {
 *   await savePlan();
 * }, 500);
 * 
 * // 快速调用多次，只会在最后一次调用后 500ms 执行一次
 * debouncedSave();
 * debouncedSave();
 * debouncedSave();
 * ```
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    // 清除之前的定时器
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // 设置新的定时器
    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };
}

/**
 * 可取消的防抖函数
 * 
 * 返回一个对象，包含防抖函数和取消函数
 * 
 * @param func - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 包含 debounced 和 cancel 方法的对象
 * 
 * @example
 * ```typescript
 * const { debounced, cancel } = debounceCancelable(async () => {
 *   await savePlan();
 * }, 500);
 * 
 * debounced();
 * debounced();
 * 
 * // 取消待执行的调用
 * cancel();
 * ```
 */
export function debounceCancelable<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): {
  debounced: (...args: Parameters<T>) => void;
  cancel: () => void;
} {
  let timeoutId: NodeJS.Timeout | null = null;

  const debounced = function (...args: Parameters<T>) {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null;
    }, delay);
  };

  const cancel = function () {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return { debounced, cancel };
}

/**
 * 立即执行的防抖函数
 * 
 * 第一次调用立即执行，后续调用在延迟时间内被忽略
 * 
 * @param func - 要防抖的函数
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * ```typescript
 * const debouncedClick = debounceImmediate(() => {
 *   console.log('Clicked!');
 * }, 1000);
 * 
 * debouncedClick(); // 立即执行
 * debouncedClick(); // 被忽略
 * debouncedClick(); // 被忽略
 * // 1秒后可以再次执行
 * ```
 */
export function debounceImmediate<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout | null = null;

  return function debounced(...args: Parameters<T>) {
    const shouldExecute = timeoutId === null;

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
    }, delay);

    if (shouldExecute) {
      func(...args);
    }
  };
}

/**
 * 批量防抖函数
 * 
 * 收集多次调用的参数，在延迟时间后批量执行
 * 
 * @param func - 要防抖的函数，接收参数数组
 * @param delay - 延迟时间（毫秒）
 * @returns 防抖后的函数
 * 
 * @example
 * ```typescript
 * const batchedSave = debounceBatch(async (items: string[]) => {
 *   await saveMultipleItems(items);
 * }, 500);
 * 
 * batchedSave('item1');
 * batchedSave('item2');
 * batchedSave('item3');
 * // 500ms 后执行一次: saveMultipleItems(['item1', 'item2', 'item3'])
 * ```
 */
export function debounceBatch<T>(
  func: (args: T[]) => any,
  delay: number
): (arg: T) => void {
  let timeoutId: NodeJS.Timeout | null = null;
  let batch: T[] = [];

  return function debounced(arg: T) {
    batch.push(arg);

    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(batch);
      batch = [];
      timeoutId = null;
    }, delay);
  };
}
