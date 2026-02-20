'use client';

import React, { useState, useEffect, ReactNode } from 'react';
import { FirebaseProvider } from './provider';

export const FirebaseClientProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) {
        return <>{children}</>;
    }

    return <FirebaseProvider>{children}</FirebaseProvider>;
};
