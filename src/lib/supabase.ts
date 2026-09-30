import { createClient } from '@supabase/supabase-js';

const getSupabaseConfig = () => {
    let url = import.meta.env.VITE_SUPABASE_URL;
    let key = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Validation: Ensure URL is actually a URL
    if (!url || !url.startsWith('http') || url === 'YOUR_SUPABASE_URL') {
        console.warn('Mediconnect: Invalid Supabase URL provided. Using placeholder.');
        url = 'https://placeholder.supabase.co';
    }

    if (!key || key === 'YOUR_SUPABASE_ANON_KEY') {
        console.warn('Mediconnect: Invalid Supabase Anon Key provided. Using placeholder.');
        key = 'placeholder';
    }

    return { url, key, isMock: url === 'https://placeholder.supabase.co' || import.meta.env.VITE_SUPABASE_URL === 'YOUR_SUPABASE_URL' };
};

const { url, key, isMock } = getSupabaseConfig();

export const supabase = createClient(url, key);
export const isMockMode = isMock;
