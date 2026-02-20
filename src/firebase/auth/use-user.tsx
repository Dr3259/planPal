'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

export const useUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    // It's possible to use the provider hooks before the provider is initialized.
    // This can happen in server components. We'll handle this gracefully.
    let auth, firestore;
    try {
        auth = useAuth();
        firestore = useFirestore();
    } catch (e) {
        // We are likely on the server.
    }


    useEffect(() => {
        if (!auth || !firestore) {
            setLoading(false);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setUser(user);
                
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

            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth, firestore]);

    return { user, loading };
};
