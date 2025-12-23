import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://biafwoobalkjofdbfagl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYWZ3b29iYWxram9mZGJmYWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjYzNTQ3MTUsImV4cCI6MjA4MTkzMDcxNX0.LIxGen3VwminhEVJnf9rydMbgEMFR31iqqRuHHWxQoc';

const createStorageAdapter = () => {
  if (Platform.OS === 'web') {
    return {
      getItem: (key: string) => {
        const value = localStorage.getItem(key);
        return Promise.resolve(value);
      },
      setItem: (key: string, value: string) => {
        localStorage.setItem(key, value);
        return Promise.resolve();
      },
      removeItem: (key: string) => {
        localStorage.removeItem(key);
        return Promise.resolve();
      },
    };
  } else {
    const SecureStore = require('expo-secure-store');
    return {
      getItem: (key: string) => SecureStore.getItemAsync(key),
      setItem: (key: string, value: string) => SecureStore.setItemAsync(key, value),
      removeItem: (key: string) => SecureStore.deleteItemAsync(key),
    };
  }
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: createStorageAdapter(),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

export async function signInWithMagicLink(email: string) {
  let redirectUrl = 'readingcompanion://auth/callback';
  
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    redirectUrl = window.location.origin;
  }
    
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectUrl,
    },
  });
  return { error };
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  return { error };
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export interface Book {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  domain: string | null;
  cover_url: string | null;
  user_goal: string | null;
  goal_type: 'enjoyment' | 'research' | 'skill_acquisition' | 'general_learning' | null;
  progress_percent: number;
  status: 'reading' | 'completed' | 'paused';
  created_at: string;
  updated_at: string;
}

export interface Chapter {
  id: string;
  book_id: string;
  user_id: string;
  title: string;
  chapter_number: number | null;
  source_text: string | null;
  source_type: 'paste' | 'file' | 'url' | null;
  source_url: string | null;
  word_count: number | null;
  preread_complete: boolean;
  reading_complete: boolean;
  postread_complete: boolean;
  created_at: string;
  updated_at: string;
}

export interface PreReadResult {
  id: string;
  chapter_id: string;
  user_id: string;
  chapter_overview: string | null;
  key_concepts: Array<{
    term: string;
    preview: string;
    watch_for: string;
  }>;
  questions_to_hold: string[];
  structure_map: string | null;
  connections: string | null;
  created_at: string;
}

export interface PostReadResult {
  id: string;
  chapter_id: string;
  user_id: string;
  chapter_summary: string | null;
  core_concepts: Array<{
    name: string;
    definition: string;
    significance: string;
    example: string | null;
  }>;
  key_claims: Array<{
    claim: string;
    evidence: string;
    implications: string;
  }>;
  open_questions: string[];
  connections: string | null;
  reader_notes: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  chapter_id: string;
  book_id: string;
  user_id: string;
  front: string;
  back: string;
  card_type: 'basic' | 'conceptual' | 'application' | 'syntopical';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  ease_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_date: string;
  last_review_date: string | null;
  is_active: boolean;
  is_approved: boolean;
  created_at: string;
  updated_at: string;
}

export interface StudyStats {
  total_cards: number;
  due_today: number;
  reviewed_today: number;
  total_books: number;
  streak_days: number;
}