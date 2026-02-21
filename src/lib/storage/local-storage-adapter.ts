/**
 * LocalStorage Storage Adapter
 * 
 * Implements IStorageAdapter for browser LocalStorage backend with:
 * - Data serialization and deserialization
 * - Error handling for quota exceeded and other storage errors
 * - Nested path support
 * 
 * Requirements: 8.2
 */

import { IStorageAdapter } from './storage-interface';
import { logger } from '@/lib/logger';

/**
 * LocalStorage key prefix to avoid conflicts
 */
const STORAGE_PREFIX = 'plan-app-data-';

/**
 * LocalStorage adapter implementing IStorageAdapter
 */
export class LocalStorageAdapter implements IStorageAdapter {
  /**
   * Get the full storage key with prefix
   */
  private getStorageKey(path: string): string {
    return `${STORAGE_PREFIX}${path.replace(/\//g, '-')}`;
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('/');
    let current = obj;
    
    for (const key of keys) {
      if (current === null || current === undefined) {
        return null;
      }
      current = current[key];
    }
    
    return current === undefined ? null : current;
  }

  /**
   * Set nested value in object using path segments
   */
  private setNestedValue(obj: any, path: string, value: any): any {
    const keys = path.split('/');
    const result = { ...obj };
    let current = result;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      } else {
        current[key] = { ...current[key] };
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return result;
  }

  /**
   * Delete nested value from object using path segments
   */
  private deleteNestedValue(obj: any, path: string): any {
    const keys = path.split('/');
    const result = { ...obj };
    let current = result;
    const parents: any[] = [result];
    
    // Navigate to parent of target
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        return result; // Path doesn't exist, nothing to delete
      }
      current[key] = { ...current[key] };
      current = current[key];
      parents.push(current);
    }
    
    // Delete the target key
    const lastKey = keys[keys.length - 1];
    delete current[lastKey];
    
    return result;
  }

  /**
   * Retrieve data from LocalStorage
   */
  async get<T>(path: string): Promise<T | null> {
    try {
      const storageKey = this.getStorageKey(path);
      const dataStr = localStorage.getItem(storageKey);
      
      if (dataStr === null) {
        return null;
      }
      
      const data = JSON.parse(dataStr);
      return data as T;
    } catch (error) {
      logger.error(`LocalStorage get error for path ${path}:`, error);
      return null;
    }
  }

  /**
   * Store data at the specified path
   */
  async set<T>(path: string, data: T): Promise<void> {
    try {
      const storageKey = this.getStorageKey(path);
      const dataStr = JSON.stringify(data);
      
      localStorage.setItem(storageKey, dataStr);
      logger.log(`LocalStorage set: ${path}`);
    } catch (error) {
      // Handle quota exceeded error
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        logger.error('LocalStorage quota exceeded:', error);
        throw new Error('Storage quota exceeded. Please clear some data or use cloud storage.');
      }
      
      logger.error(`LocalStorage set error for path ${path}:`, error);
      throw new Error(`Failed to save data to LocalStorage: ${(error as Error).message}`);
    }
  }

  /**
   * Update existing data at the specified path (partial update)
   */
  async update<T>(path: string, data: Partial<T>): Promise<void> {
    try {
      // Get existing data
      const existing = await this.get<T>(path);
      
      if (existing === null) {
        // If data doesn't exist, create it
        await this.set(path, data as T);
        return;
      }
      
      // Merge with existing data
      const merged = { ...existing, ...data };
      await this.set(path, merged);
      
      logger.log(`LocalStorage update: ${path}`);
    } catch (error) {
      logger.error(`LocalStorage update error for path ${path}:`, error);
      throw error;
    }
  }

  /**
   * Delete data at the specified path
   */
  async delete(path: string): Promise<void> {
    try {
      const storageKey = this.getStorageKey(path);
      localStorage.removeItem(storageKey);
      
      logger.log(`LocalStorage delete: ${path}`);
    } catch (error) {
      logger.error(`LocalStorage delete error for path ${path}:`, error);
      throw new Error(`Failed to delete data from LocalStorage: ${(error as Error).message}`);
    }
  }

  /**
   * Clear all plan data from LocalStorage (utility method)
   */
  async clearAll(): Promise<void> {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX));
      
      for (const key of keys) {
        localStorage.removeItem(key);
      }
      
      logger.log(`LocalStorage cleared ${keys.length} items`);
    } catch (error) {
      logger.error('LocalStorage clearAll error:', error);
      throw new Error(`Failed to clear LocalStorage: ${(error as Error).message}`);
    }
  }
}
