/**
 * Storage Factory
 * 
 * Creates appropriate storage adapter based on user authentication state:
 * - Firestore for authenticated users
 * - LocalStorage for unauthenticated users
 * - Fallback to LocalStorage on network errors
 * 
 * Requirements: 8.1, 8.2, 11.5
 */

import { Firestore } from 'firebase/firestore';
import { IStorageAdapter } from './storage-interface';
import { FirestoreAdapter } from './firestore-adapter';
import { LocalStorageAdapter } from './local-storage-adapter';
import { logger } from '@/lib/logger';

/**
 * Storage adapter wrapper with fallback support
 */
class StorageAdapterWithFallback implements IStorageAdapter {
  private primary: IStorageAdapter;
  private fallback: IStorageAdapter;
  private useFallback: boolean = false;

  constructor(primary: IStorageAdapter, fallback: IStorageAdapter) {
    this.primary = primary;
    this.fallback = fallback;
  }

  /**
   * Execute operation with automatic fallback on network errors
   */
  private async withFallback<T>(
    operation: (adapter: IStorageAdapter) => Promise<T>,
    operationName: string
  ): Promise<T> {
    // If already using fallback, continue with it
    if (this.useFallback) {
      return operation(this.fallback);
    }

    try {
      return await operation(this.primary);
    } catch (error) {
      // Check if it's a network error
      const isNetworkError = 
        error instanceof Error && 
        (error.message.includes('network') || 
         error.message.includes('offline') ||
         error.message.includes('fetch'));

      if (isNetworkError) {
        logger.log(
          `Network error detected in ${operationName}, falling back to LocalStorage`,
          error
        );
        this.useFallback = true;
        return operation(this.fallback);
      }

      // Re-throw non-network errors
      throw error;
    }
  }

  async get<T>(path: string): Promise<T | null> {
    return this.withFallback(
      adapter => adapter.get<T>(path),
      'get'
    );
  }

  async set<T>(path: string, data: T): Promise<void> {
    return this.withFallback(
      adapter => adapter.set(path, data),
      'set'
    );
  }

  async update<T>(path: string, data: Partial<T>): Promise<void> {
    return this.withFallback(
      adapter => adapter.update(path, data),
      'update'
    );
  }

  async delete(path: string): Promise<void> {
    return this.withFallback(
      adapter => adapter.delete(path),
      'delete'
    );
  }

  /**
   * Reset fallback state (e.g., when network is restored)
   */
  resetFallback(): void {
    this.useFallback = false;
    logger.log('Storage fallback reset, will retry primary adapter');
  }

  /**
   * Check if currently using fallback
   */
  isUsingFallback(): boolean {
    return this.useFallback;
  }
}

/**
 * Create storage adapter based on authentication state
 * 
 * @param firestore - Firestore instance (null if not available)
 * @param userId - User ID (null if not authenticated)
 * @returns Storage adapter instance
 */
export function createStorageAdapter(
  firestore: Firestore | null,
  userId: string | null
): IStorageAdapter {
  // If user is authenticated and Firestore is available, use Firestore with LocalStorage fallback
  if (firestore && userId) {
    logger.log(`Creating Firestore adapter for user: ${userId}`);
    const firestoreAdapter = new FirestoreAdapter(firestore, userId);
    const localStorageAdapter = new LocalStorageAdapter();
    return new StorageAdapterWithFallback(firestoreAdapter, localStorageAdapter);
  }

  // Otherwise, use LocalStorage
  logger.log('Creating LocalStorage adapter (user not authenticated)');
  return new LocalStorageAdapter();
}

/**
 * Storage factory singleton for easy access
 */
export class StorageFactory {
  private static instance: IStorageAdapter | null = null;
  private static currentUserId: string | null = null;

  /**
   * Initialize or update the storage adapter
   */
  static initialize(firestore: Firestore | null, userId: string | null): IStorageAdapter {
    // If user changed, recreate adapter
    if (this.currentUserId !== userId) {
      this.instance = createStorageAdapter(firestore, userId);
      this.currentUserId = userId;
      logger.log('Storage adapter initialized');
    }

    return this.instance!;
  }

  /**
   * Get current storage adapter instance
   * Throws error if not initialized
   */
  static getInstance(): IStorageAdapter {
    if (!this.instance) {
      throw new Error('StorageFactory not initialized. Call initialize() first.');
    }
    return this.instance;
  }

  /**
   * Check if storage is initialized
   */
  static isInitialized(): boolean {
    return this.instance !== null;
  }

  /**
   * Reset the storage factory (useful for testing)
   */
  static reset(): void {
    this.instance = null;
    this.currentUserId = null;
    logger.log('Storage factory reset');
  }
}
