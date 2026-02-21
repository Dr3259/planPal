/**
 * Firestore Storage Adapter
 * 
 * Implements IStorageAdapter for Firestore backend with:
 * - Incremental updates using merge: true
 * - Exponential backoff retry strategy (max 3 attempts)
 * - Error handling and logging
 * 
 * Requirements: 8.1, 8.3, 8.5, 8.6, 8.7
 */

import { Firestore, doc, getDoc, setDoc, updateDoc, deleteField } from 'firebase/firestore';
import { IStorageAdapter } from './storage-interface';
import { logger } from '@/lib/logger';

/**
 * Exponential backoff retry configuration
 */
const RETRY_CONFIG = {
  maxAttempts: 3,
  initialDelayMs: 100,
  maxDelayMs: 2000,
  backoffMultiplier: 2,
};

/**
 * Sleep utility for retry delays
 */
const sleep = (ms: number): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Calculate exponential backoff delay
 */
const getRetryDelay = (attempt: number): number => {
  const delay = RETRY_CONFIG.initialDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
};

/**
 * Firestore adapter implementing IStorageAdapter
 */
export class FirestoreAdapter implements IStorageAdapter {
  private firestore: Firestore;
  private userId: string;

  constructor(firestore: Firestore, userId: string) {
    this.firestore = firestore;
    this.userId = userId;
  }

  /**
   * Execute operation with exponential backoff retry
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < RETRY_CONFIG.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        
        if (attempt < RETRY_CONFIG.maxAttempts - 1) {
          const delay = getRetryDelay(attempt);
          logger.log(
            `${operationName} failed (attempt ${attempt + 1}/${RETRY_CONFIG.maxAttempts}), ` +
            `retrying in ${delay}ms...`,
            error
          );
          await sleep(delay);
        }
      }
    }

    // All retries exhausted
    logger.error(
      `${operationName} failed after ${RETRY_CONFIG.maxAttempts} attempts`,
      lastError
    );
    throw new Error(
      `Storage operation failed: ${operationName}. ${lastError?.message || 'Unknown error'}`
    );
  }

  /**
   * Parse nested path into Firestore document reference and field path
   * Example: "dailyPlans/2024-01-15/work" -> { docRef, fieldPath: "dailyPlans.2024-01-15.work" }
   */
  private parsePath(path: string): { docRef: ReturnType<typeof doc>; fieldPath: string } {
    const docRef = doc(this.firestore, 'plans', this.userId);
    const fieldPath = path.replace(/\//g, '.');
    return { docRef, fieldPath };
  }

  /**
   * Get nested value from object using dot notation path
   */
  private getNestedValue(obj: any, path: string): any {
    const keys = path.split('.');
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
   * Set nested value in object using dot notation path
   */
  private setNestedValue(obj: any, path: string, value: any): any {
    const keys = path.split('.');
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
   * Retrieve data from Firestore
   */
  async get<T>(path: string): Promise<T | null> {
    return this.withRetry(async () => {
      const { docRef, fieldPath } = this.parsePath(path);
      
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }
      
      const data = docSnap.data();
      const value = this.getNestedValue(data, fieldPath);
      
      return value as T | null;
    }, `get(${path})`);
  }

  /**
   * Store data at the specified path using incremental update
   */
  async set<T>(path: string, data: T): Promise<void> {
    return this.withRetry(async () => {
      const { docRef, fieldPath } = this.parsePath(path);
      
      // Use merge: true for incremental updates (Requirement 8.7)
      const updateData = this.setNestedValue({}, fieldPath, data);
      await setDoc(docRef, updateData, { merge: true });
      
      logger.log(`Firestore set: ${path}`);
    }, `set(${path})`);
  }

  /**
   * Update existing data at the specified path (partial update)
   */
  async update<T>(path: string, data: Partial<T>): Promise<void> {
    return this.withRetry(async () => {
      const { docRef, fieldPath } = this.parsePath(path);
      
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
      
      logger.log(`Firestore update: ${path}`);
    }, `update(${path})`);
  }

  /**
   * Delete data at the specified path
   */
  async delete(path: string): Promise<void> {
    return this.withRetry(async () => {
      const { docRef, fieldPath } = this.parsePath(path);
      
      // Use deleteField to remove the specific field
      const updateData = this.setNestedValue({}, fieldPath, deleteField());
      await updateDoc(docRef, updateData);
      
      logger.log(`Firestore delete: ${path}`);
    }, `delete(${path})`);
  }
}
