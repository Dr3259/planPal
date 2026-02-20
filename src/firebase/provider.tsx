'use client';

import React, { createContext, useContext, ReactNode, useMemo } from 'react';
import type { FirebaseApp } from 'firebase/app';
import { initializeApp, getApps } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config';


interface FirebaseContextValue {
    app: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
}

const FirebaseContext = createContext<FirebaseContextValue | null>(null);

export const FirebaseProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const firebaseValue = useMemo(() => {
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        return { app, auth, firestore };
    }, []);

    return (
        <FirebaseContext.Provider value={firebaseValue}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebaseApp = (): FirebaseApp => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebaseApp must be used within a FirebaseProvider');
    }
    return context.app;
};

export const useAuth = (): Auth => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useAuth must be used within a FirebaseProvider');
    }
    return context.auth;
};

export const useFirestore = (): Firestore => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirestore must be used within a FirebaseProvider');
    }
    return context.firestore;
};
