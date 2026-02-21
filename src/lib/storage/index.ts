/**
 * Storage Module Exports
 * 
 * Provides unified access to storage abstraction layer
 */

export { IStorageAdapter } from './storage-interface';
export { FirestoreAdapter } from './firestore-adapter';
export { LocalStorageAdapter } from './local-storage-adapter';
export { StorageFactory, createStorageAdapter } from './storage-factory';
