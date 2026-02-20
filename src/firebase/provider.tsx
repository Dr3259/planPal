'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import type { Auth, User } from 'firebase/auth';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from './config';

const migrateLocalDataToFirestore = async (userId: string, firestore: Firestore) => {
    const localDataKeys = Object.keys(localStorage).filter(key => key.startsWith('plan-app-data-'));

    if (localDataKeys.length === 0) {
        return;
    }

    console.log('Starting migration of local data to Firestore for user:', userId);

    const dataToMigrate: { [key: string]: any } = {};
    const localDataKeysToRemove: string[] = [];

    for (const storageKey of localDataKeys) {
        const dataStr = localStorage.getItem(storageKey);
        if (dataStr) {
            try {
                const data = JSON.parse(dataStr);
                const firestoreKey = storageKey.substring('plan-app-data-'.length).replace(/-/g, '_');
                
                dataToMigrate[firestoreKey] = data;
                localDataKeysToRemove.push(storageKey);
            } catch (e) {
                console.error(`Error parsing local data for key ${storageKey}:`, e);
            }
        }
    }

    if (Object.keys(dataToMigrate).length === 0) {
        console.log('No valid local data found to migrate.');
        return;
    }

    try {
        const planDocRef = doc(firestore, 'plans', userId);
        await setDoc(planDocRef, dataToMigrate, { merge: true });

        for (const key of localDataKeysToRemove) {
            localStorage.removeItem(key);
        }
        console.log('Local data migration to Firestore successful.');

    } catch (error) {
        console.error('Error migrating local data to Firestore:', error);
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
    const [value, setValue] = useState<FirebaseContextValue>({
        app: null,
        auth: null,
        firestore: null,
        user: null,
        loading: true,
    });

    useEffect(() => {
        const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
        const auth = getAuth(app);
        const firestore = getFirestore(app);

        setValue(prev => ({ ...prev, app, auth, firestore }));

        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                await migrateLocalDataToFirestore(user.uid, firestore);
                const userRef = doc(firestore, 'users', user.uid);
                try {
                    await setDoc(userRef, {
                        uid: user.uid,
                        email: user.email,
                        displayName: user.displayName,
                        photoURL: user.photoURL,
                        lastLogin: serverTimestamp(),
                    }, { merge: true });
                } catch (error) {
                    console.error("Error updating user document:", error);
                }
            }
            setValue(prev => ({ ...prev, user, loading: false }));
        });

        return () => unsubscribe();
    }, []);

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
