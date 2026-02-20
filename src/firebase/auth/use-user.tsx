'use client';

import { useEffect, useState } from 'react';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { doc, setDoc, serverTimestamp, type Firestore } from 'firebase/firestore';
import { useAuth, useFirestore } from '../provider';

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
                // Transform storageKey to firestoreKey, e.g.,
                // 'plan-app-data-work-Daily-goals' -> 'work_Daily_goals'
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
        // Use merge: true to avoid overwriting existing fields in Firestore not present in localStorage
        await setDoc(planDocRef, dataToMigrate, { merge: true });

        // If write is successful, remove the migrated data from localStorage
        for (const key of localDataKeysToRemove) {
            localStorage.removeItem(key);
        }
        console.log('Local data migration to Firestore successful.');

    } catch (error) {
        console.error('Error migrating local data to Firestore:', error);
        // We don't remove local data if the migration fails, so the user can try again on next login.
    }
};


export const useUser = () => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    
    const auth = useAuth();
    const firestore = useFirestore();


    useEffect(() => {
        if (!auth || !firestore) {
            setLoading(false);
            return;
        }
        
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                // User is signed in.
                
                // First, migrate any existing local data to the user's account.
                await migrateLocalDataToFirestore(user.uid, firestore);

                setUser(user);
                
                const userRef = doc(firestore, 'users', user.uid);
                try {
                    // Update user profile information in Firestore
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
                // User is signed out.
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [auth, firestore]);

    return { user, loading };
};
