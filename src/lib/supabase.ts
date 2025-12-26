import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const SUPABASE_URL = 'https://biafwoobalkjofdbfagl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpYWZ3b29iYWxram9mZGJmYWdsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ4MjkwMzMsImV4cCI6MjA1MDQwNTAzM30.L-KOHNhIVOKsAlSdtN9j4zqngGI4XZh2LCgOW63cR3I';

const webStorage = {
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

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: webStorage,
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
    options: { emailRedirectTo: redirectUrl },
  });

  return { error };
}

export type Profile = {
  id: string;
  email: string;
  created_at: string;
  settings: Record<string, any>;
};

export type Book = {
  id: string;
  user_id: string;
  title: string;
  author: string | null;
  domain: string | null;
  user_goal: string | null;
  goal_type: string | null;
  status: 'reading' | 'completed' | 'paused';
  progress_percent: number;
  created_at: string;
  updated_at: string;
};

export type Chapter = {
  id: string;
  book_id: string;
  title: string;
  chapter_number: number;
  source_text: string | null;
  preread_complete: boolean;
  reading_complete: boolean;
  postread_complete: boolean;
  created_at: string;
};

export type PreReadResult = {
  id: string;
  chapter_id: string;
  chapter_overview: string;
  key_concepts: Array<{ term: string; definition: string; importance: string }>;
  questions_to_hold: string[];
  structure_overview: string;
  created_at: string;
};

export type PostReadResult = {
  id: string;
  chapter_id: string;
  chapter_summary: string;
  core_concepts: Array<{ name: string; explanation: string; connections: string[] }>;
  key_claims: Array<{ claim: string; evidence: string; significance: string }>;
  question_answers: Array<{ question: string; answer: string }>;
  open_questions: string[];
  created_at: string;
};

export type Card = {
  id: string;
  chapter_id: string;
  front: string;
  back: string;
  card_type: 'concept' | 'fact' | 'relationship' | 'application';
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
  easiness_factor: number;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  created_at: string;
};

export type StudyStats = {
  due_today: number;
  reviewed_today: number;
  total_cards: number;
  streak_days: number;
};
