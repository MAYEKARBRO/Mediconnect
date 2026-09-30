import React, { createContext, useContext, useEffect, useState } from 'react';
import type { UserProfile, UserRole } from '../types';
import { supabase } from '../lib/supabase';

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, role: UserRole, fullName: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Unified function to handle user state update from session
    const updateUserFromSession = (session: any) => {
        if (!session?.user) {
            setUser(null);
            setLoading(false);
            return;
        }

        const metadata = session.user.user_metadata || {};
        const userData: UserProfile = {
            id: session.user.id,
            email: session.user.email!,
            role: (metadata.role as UserRole) || 'patient', // Fallback to patient
            full_name: metadata.full_name || session.user.email?.split('@')[0] || 'User',
        };

        console.log('User authenticated:', userData);
        setUser(userData);
        setLoading(false);
    };

    useEffect(() => {
        // Check active session
        const checkSession = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                updateUserFromSession(session);
            } catch (error) {
                console.error('Session check failed:', error);
                setLoading(false);
            }
        };

        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            updateUserFromSession(session);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);



    const signIn = async (email: string, password: string) => {
        // MOCK MODE: If Supabase not configured, use local state
        if (import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.warn('Mediconnect: Mock Sign In (No Backend)');
            // Attempt to deduce role from email if possible, or default to patient
            let role: UserRole = 'patient';
            if (email.includes('doctor')) role = 'doctor';
            if (email.includes('admin')) role = 'admin';

            setUser({
                id: 'mock-user-id',
                email,
                role,
                full_name: 'Mock User (Demo)',
            });
            return;
        }

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) throw error;
    };

    const signUp = async (email: string, password: string, role: UserRole, fullName: string) => {
        // MOCK MODE: If Supabase not configured, use local state
        if (import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL') {
            console.warn('Mediconnect: Mock Sign Up (No Backend)');
            setUser({
                id: 'mock-user-id-' + Math.random(),
                email,
                role,
                full_name: fullName,
            });
            return;
        }

        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    role,
                    full_name: fullName,
                },
            },
        });

        if (error) throw error;
    };

    const signOut = async () => {
        if (import.meta.env.VITE_SUPABASE_URL !== 'YOUR_SUPABASE_URL') {
            await supabase.auth.signOut();
        }
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
