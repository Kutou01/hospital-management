'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { createClient } from './client';
import { Session, SupabaseClient } from '@supabase/supabase-js';

type SupabaseContextType = {
    supabase: SupabaseClient;
    session: Session | null;
};

const SupabaseContext = createContext<SupabaseContextType | undefined>(undefined);

export function useSupabase() {
    const context = useContext(SupabaseContext);
    if (context === undefined) {
        throw new Error('useSupabase must be used within a SupabaseProvider');
    }
    return context;
}

export function SupabaseProvider({ children }: { children: ReactNode }) {
    const [supabase] = useState(() => createClient());
    const [session, setSession] = useState<Session | null>(null);

    useEffect(() => {
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [supabase]);

    return (
        <SupabaseContext.Provider value={{ supabase, session }}>
            {children}
        </SupabaseContext.Provider>
    );
} 