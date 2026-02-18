import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = window.SUPABASE_URL || window.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || window.VITE_SUPABASE_ANON_KEY || '';

class AuthManager {
    constructor() {
        this.client = null;
        this.user = null;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) {
            return;
        }

        this.initialized = true;

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
            console.warn('[Auth] Missing Supabase config. Set SUPABASE_URL and SUPABASE_ANON_KEY on window.');
            return;
        }

        this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

        const {
            data: { session }
        } = await this.client.auth.getSession();

        this.user = session?.user || null;

        this.client.auth.onAuthStateChange((_event, sessionData) => {
            this.user = sessionData?.user || null;
        });
    }

    isConfigured() {
        return Boolean(this.client);
    }

    getCurrentUser() {
        return this.user;
    }

    async signUp(email, password) {
        if (!this.client) {
            throw new Error('Supabase is not configured.');
        }

        const { data, error } = await this.client.auth.signUp({ email, password });
        if (error) {
            throw error;
        }
        this.user = data.user || null;
        return data;
    }

    async signIn(email, password) {
        if (!this.client) {
            throw new Error('Supabase is not configured.');
        }

        const { data, error } = await this.client.auth.signInWithPassword({ email, password });
        if (error) {
            throw error;
        }
        this.user = data.user || null;
        return data;
    }

    async signOut() {
        if (!this.client) {
            return;
        }

        const { error } = await this.client.auth.signOut();
        if (error) {
            throw error;
        }

        this.user = null;
    }
}

export const authManager = new AuthManager();
