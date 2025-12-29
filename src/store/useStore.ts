import { create } from 'zustand';
import { supabase, Book, Chapter, Card, StudyStats } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AppState {
  // Auth
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  
  // Data
  books: Book[];
  currentBook: Book | null;
  currentChapter: Chapter | null;
  dueCards: Card[];
  stats: StudyStats | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Data fetching
  fetchBooks: () => Promise<void>;
  fetchChapters: (bookId: string) => Promise<Chapter[]>;
  fetchDueCards: () => Promise<void>;
  fetchStats: () => Promise<void>;
  
  // Book actions
  setCurrentBook: (book: Book | null) => void;
  createBook: (book: Partial<Book>) => Promise<Book | null>;
  updateBook: (id: string, updates: Partial<Book>) => Promise<void>;
  deleteBook: (id: string) => Promise<void>;
  
  // Chapter actions
  setCurrentChapter: (chapter: Chapter | null) => void;
  createChapter: (chapter: Partial<Chapter>) => Promise<Chapter | null>;
  updateChapter: (id: string, updates: Partial<Chapter>) => Promise<void>;
  deleteChapter: (id: string) => Promise<void>;
  
  // Result actions
  deletePreReadResult: (chapterId: string) => Promise<void>;
  deletePostReadResult: (chapterId: string) => Promise<void>;
  
  // Card actions
  reviewCard: (cardId: string, rating: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
}

export const useStore = create<AppState>((set, get) => ({
  // Initial state
  user: null,
  session: null,
  isLoading: true,
  books: [],
  currentBook: null,
  currentChapter: null,
  dueCards: [],
  stats: null,

  // Setters
  setUser: (user) => set({ user }),
  setSession: (session) => set({ session }),
  setLoading: (isLoading) => set({ isLoading }),

  // Fetch all books for current user
  fetchBooks: async () => {
    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      set({ books: data });
    }
  },

  // Fetch chapters for a book
  fetchChapters: async (bookId: string) => {
    const { data, error } = await supabase
      .from('chapters')
      .select('*')
      .eq('book_id', bookId)
      .order('chapter_number', { ascending: true });
    
    return error ? [] : (data || []);
  },

  // Fetch cards due for review
  fetchDueCards: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_due_cards', { p_user_id: user.id, p_limit: 50 });
    
    if (!error && data) {
      set({ dueCards: data });
    }
  },

  // Fetch study stats
  fetchStats: async () => {
    const { user } = get();
    if (!user) return;

    const { data, error } = await supabase
      .rpc('get_study_stats', { p_user_id: user.id });
    
    if (!error && data) {
      set({ stats: data });
    }
  },

  // Set current book
  setCurrentBook: (book) => set({ currentBook: book }),

  // Create a new book
  createBook: async (book) => {
    const { user } = get();
    if (!user) return null;

    const { data, error } = await supabase
      .from('books')
      .insert({ ...book, user_id: user.id })
      .select()
      .single();
    
    if (!error && data) {
      set({ books: [data, ...get().books] });
      return data;
    }
    return null;
  },

  // Update a book
  updateBook: async (id, updates) => {
    const { error } = await supabase
      .from('books')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (!error) {
      set({
        books: get().books.map(b => b.id === id ? { ...b, ...updates } : b),
        currentBook: get().currentBook?.id === id 
          ? { ...get().currentBook!, ...updates }
          : get().currentBook,
      });
    }
  },

  // Delete a book
  deleteBook: async (id) => {
    const { error } = await supabase
      .from('books')
      .delete()
      .eq('id', id);
    
    if (!error) {
      set({
        books: get().books.filter(b => b.id !== id),
        currentBook: get().currentBook?.id === id ? null : get().currentBook,
      });
      
      // Refresh stats
      get().fetchStats();
      get().fetchDueCards();
    }
  },

  // Set current chapter
  setCurrentChapter: (chapter) => set({ currentChapter: chapter }),

  // Create a chapter
  createChapter: async (chapter) => {
    const { user } = get();
    if (!user) return null;

    const { data, error } = await supabase
      .from('chapters')
      .insert({ ...chapter, user_id: user.id })
      .select()
      .single();
    
    return error ? null : data;
  },

  // Update a chapter
  updateChapter: async (id, updates) => {
    await supabase
      .from('chapters')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id);
  },

  // Delete a chapter (also deletes related pre-read, post-read, and cards)
  deleteChapter: async (id) => {
    // Delete related data first (cascade)
    await supabase.from('cards').delete().eq('chapter_id', id);
    await supabase.from('postread_results').delete().eq('chapter_id', id);
    await supabase.from('preread_results').delete().eq('chapter_id', id);
    
    // Delete the chapter
    await supabase.from('chapters').delete().eq('id', id);
    
    // Refresh stats
    get().fetchStats();
    get().fetchDueCards();
  },

  // Delete pre-read result for a chapter
  deletePreReadResult: async (chapterId) => {
    await supabase.from('preread_results').delete().eq('chapter_id', chapterId);
    // Reset chapter pre-read status
    await supabase.from('chapters').update({ preread_complete: false }).eq('id', chapterId);
    
    // Refresh stats
    get().fetchStats();
    get().fetchDueCards();
  },

  // Delete post-read result for a chapter (also deletes cards)
  deletePostReadResult: async (chapterId) => {
    await supabase.from('cards').delete().eq('chapter_id', chapterId);
    await supabase.from('postread_results').delete().eq('chapter_id', chapterId);
    // Reset chapter post-read status
    await supabase.from('chapters').update({ postread_complete: false, reading_complete: false }).eq('id', chapterId);
    
    // Refresh stats
    get().fetchStats();
    get().fetchDueCards();
  },

  // Review a card
  reviewCard: async (cardId, rating) => {
    const { error } = await supabase
      .rpc('update_card_after_review', { p_card_id: cardId, p_rating: rating });
    
    if (!error) {
      // Refresh due cards
      get().fetchDueCards();
      get().fetchStats();
    }
  },
}));
