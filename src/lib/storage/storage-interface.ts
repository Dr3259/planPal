/**
 * Storage Interface Abstraction Layer
 * 
 * Provides a unified interface for data storage operations,
 * supporting both Firestore and LocalStorage implementations.
 * 
 * Requirements: 8.1, 8.2
 */

/**
 * Generic storage adapter interface
 * Abstracts storage operations to support multiple backends
 */
export interface IStorageAdapter {
  /**
   * Retrieve data from storage
   * @param path - Storage path (e.g., "dailyPlans/2024-01-15/work")
   * @returns Promise resolving to the data or null if not found
   */
  get<T>(path: string): Promise<T | null>;

  /**
   * Store data at the specified path
   * @param path - Storage path
   * @param data - Data to store
   * @returns Promise resolving when operation completes
   */
  set<T>(path: string, data: T): Promise<void>;

  /**
   * Update existing data at the specified path (incremental update)
   * @param path - Storage path
   * @param data - Partial data to merge with existing data
   * @returns Promise resolving when operation completes
   */
  update<T>(path: string, data: Partial<T>): Promise<void>;

  /**
   * Delete data at the specified path
   * @param path - Storage path
   * @returns Promise resolving when operation completes
   */
  delete(path: string): Promise<void>;
}
