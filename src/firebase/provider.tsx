'use client';

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
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
    const [firebaseValue, setFirebaseValue] = useState<FirebaseContextValue | null>(null);

    useEffect(() => {
        const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const firestore = getFirestore(app);
        setFirebaseValue({ app, auth, firestore });
    }, []);

    return (
        <FirebaseContext.Provider value={firebaseValue}>
            {children}
        </FirebaseContext.Provider>
    );
};

export const useFirebaseApp = (): FirebaseApp | null => {
    const context = useContext(FirebaseContext);
    return context?.app ?? null;
};

export const useAuth = (): Auth | null => {
    const context = useContext(FirebaseContext);
    return context?.auth ?? null;
};

export const useFirestore = (): Firestore | null => {
    const context = useContext(FirebaseContext);
    return context?.firestore ?? null;
};
