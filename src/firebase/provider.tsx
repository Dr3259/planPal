'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import { getAuth, onAuthStateChanged, setPersistence, browserLocalPersistence } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './config';
import { logger } from '@/lib/logger';

const migrateLocalDataToFirestore = async (userId: string, firestore: Firestore) => {
    const localDataKeys = Object.keys(localStorage).filter(key => key.startsWith('plan-app-data-'));

    if (localDataKeys.length === 0) {
        return;
    }

    logger.log('开始将本地数据迁移到 Firestore，用户ID:', userId);

    const dataToMigrate: Record<string, unknown> = {};
    const localDataKeysToRemove: string[] = [];

    const parseLocalValue = (raw: string) => {
        try {
            return { value: JSON.parse(raw), parsed: true };
        } catch {
            return { value: raw, parsed: false };
        }
    };

    for (const storageKey of localDataKeys) {
        const dataStr = localStorage.getItem(storageKey);
        if (dataStr !== null) {
            const { value, parsed } = parseLocalValue(dataStr);
            const firestoreKey = storageKey.substring('plan-app-data-'.length).replace(/-/g, '_');
            
            dataToMigrate[firestoreKey] = value;
            localDataKeysToRemove.push(storageKey);

            if (!parsed) {
                logger.log(`本地数据非 JSON，已按原始字符串迁移，键: ${storageKey}`);
            }
        }
    }

    if (Object.keys(dataToMigrate).length === 0) {
        logger.log('未找到有效的本地数据进行迁移。');
        return;
    }

    try {
        const planDocRef = doc(firestore, 'plans', userId);
        await setDoc(planDocRef, dataToMigrate, { merge: true });

        for (const key of localDataKeysToRemove) {
            localStorage.removeItem(key);
        }
        logger.log('本地数据成功迁移到 Firestore。');

    } catch (error) {
        logger.error('迁移本地数据到 Firestore 时出错:', error);
    }
};

interface FirebaseContextValue {
    app: FirebaseApp | null;
    auth: Auth | null;
    firestore: Firestore | null;
    user: User | null;
    loading: boolean;
}

const FirebaseContext = createContext<FirebaseContextValue>({
    app: null,
    auth: null,
    firestore: null,
    user: null,
    loading: true,
});

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [services, setServices] = useState<{
        app: FirebaseApp;
        auth: Auth;
        firestore: Firestore;
    } | null>(null);

    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
            const auth = getAuth(app);
            const firestore = getFirestore(app);
            
            // 设置持久化为本地存储，确保刷新页面后快速恢复
            setPersistence(auth, browserLocalPersistence).catch(error => {
                logger.error('设置认证持久化失败:', error);
            });
            
            // 立即检查当前用户状态，减少初始加载时间
            const currentUser = auth.currentUser;
            if (currentUser) {
                setUser(currentUser);
                setLoading(false);
            }
            
            setServices({ app, auth, firestore });
        }
    }, []);

    useEffect(() => {
        if (!services) {
            return;
        }

        const { auth, firestore } = services;
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setUser(user);
            setLoading(false);
            
            if (user) {
                // 异步操作不阻塞 UI 更新
                Promise.all([
                    migrateLocalDataToFirestore(user.uid, firestore),
                    setDoc(doc(firestore, 'users', user.uid), {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        lastLogin: serverTimestamp(),
                    }, { merge: true })
                ]).catch(error => {
                    logger.error("更新用户数据时出错:", error);
                });
            }
        });

        return () => unsubscribe();
    }, [services]);

    const value = useMemo(() => ({
        app: services?.app ?? null,
        auth: services?.auth ?? null,
        firestore: services?.firestore ?? null,
        user,
        loading,
    }), [services, user, loading]);

    return (
        <FirebaseContext.Provider value={value}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebaseApp = (): FirebaseApp | null => useContext(FirebaseContext).app;
export const useAuth = (): Auth | null => useContext(FirebaseContext).auth;
export const useFirestore = (): Firestore | null => useContext(FirebaseContext).firestore;
export const useUser = () => {
    const { user, loading } = useContext(FirebaseContext);
    return { user, loading };
};
