-- Reading Companion App - Supabase Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USERS (extends Supabase auth.users)
-- ============================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  settings JSONB DEFAULT '{
    "daily_review_goal": 20,
    "notification_enabled": true,
    "theme": "dark"
  }'::jsonb
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- BOOKS
-- ============================================
CREATE TABLE public.books (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  domain TEXT, -- e.g., "military theory", "philosophy"
  cover_url TEXT,
  user_goal TEXT, -- why they're reading it
  goal_type TEXT CHECK (goal_type IN ('enjoyment', 'research', 'skill_acquisition', 'general_learning')),
  progress_percent INTEGER DEFAULT 0,
  status TEXT DEFAULT 'reading' CHECK (status IN ('reading', 'completed', 'paused')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own books" ON public.books
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_books_user_id ON public.books(user_id);

-- ============================================
-- CHAPTERS
-- ============================================
CREATE TABLE public.chapters (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  chapter_number INTEGER,
  source_text TEXT, -- the full chapter text
  source_type TEXT CHECK (source_type IN ('paste', 'file', 'url')),
  source_url TEXT, -- if from URL
  word_count INTEGER,
  
  -- Reading cycle status
  preread_complete BOOLEAN DEFAULT FALSE,
  reading_complete BOOLEAN DEFAULT FALSE,
  postread_complete BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own chapters" ON public.chapters
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_chapters_book_id ON public.chapters(book_id);

-- ============================================
-- PRE-READ RESULTS
-- ============================================
CREATE TABLE public.preread_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  chapter_overview TEXT,
  key_concepts JSONB DEFAULT '[]'::jsonb,
  -- Array of: { term, preview, watch_for }
  
  questions_to_hold JSONB DEFAULT '[]'::jsonb,
  -- Array of strings
  
  structure_map TEXT,
  connections TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.preread_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own preread results" ON public.preread_results
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_preread_chapter_id ON public.preread_results(chapter_id);

-- ============================================
-- POST-READ RESULTS
-- ============================================
CREATE TABLE public.postread_results (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  chapter_summary TEXT,
  
  core_concepts JSONB DEFAULT '[]'::jsonb,
  -- Array of: { name, definition, significance, example }
  
  key_claims JSONB DEFAULT '[]'::jsonb,
  -- Array of: { claim, evidence, implications }
  
  open_questions JSONB DEFAULT '[]'::jsonb,
  -- Array of strings
  
  connections TEXT,
  reader_notes TEXT, -- optional notes user added
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.postread_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own postread results" ON public.postread_results
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_postread_chapter_id ON public.postread_results(chapter_id);

-- ============================================
-- CARDS (Flashcards for Spaced Repetition)
-- ============================================
CREATE TABLE public.cards (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  chapter_id UUID REFERENCES public.chapters(id) ON DELETE CASCADE NOT NULL,
  book_id UUID REFERENCES public.books(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  front TEXT NOT NULL, -- question
  back TEXT NOT NULL, -- answer
  card_type TEXT CHECK (card_type IN ('basic', 'conceptual', 'application', 'syntopical')),
  difficulty TEXT CHECK (difficulty IN ('easy', 'medium', 'hard')),
  tags JSONB DEFAULT '[]'::jsonb,
  
  -- Spaced repetition fields (SM-2 algorithm compatible)
  ease_factor FLOAT DEFAULT 2.5,
  interval_days INTEGER DEFAULT 0,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_review_date DATE,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE, -- user can disable cards
  is_approved BOOLEAN DEFAULT TRUE, -- user approved after generation
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own cards" ON public.cards
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_cards_user_id ON public.cards(user_id);
CREATE INDEX idx_cards_chapter_id ON public.cards(chapter_id);
CREATE INDEX idx_cards_book_id ON public.cards(book_id);
CREATE INDEX idx_cards_next_review ON public.cards(user_id, next_review_date) WHERE is_active = TRUE;

-- ============================================
-- CARD REVIEWS (History of each review)
-- ============================================
CREATE TABLE public.card_reviews (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  card_id UUID REFERENCES public.cards(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  rating TEXT CHECK (rating IN ('again', 'hard', 'good', 'easy')) NOT NULL,
  response_time_ms INTEGER, -- how long user took to answer
  
  -- Snapshot of card state after this review
  ease_factor_after FLOAT,
  interval_days_after INTEGER,
  
  reviewed_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.card_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own reviews" ON public.card_reviews
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_reviews_card_id ON public.card_reviews(card_id);
CREATE INDEX idx_reviews_user_date ON public.card_reviews(user_id, reviewed_at);

-- ============================================
-- STUDY SESSIONS (Track daily study)
-- ============================================
CREATE TABLE public.study_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  
  cards_reviewed INTEGER DEFAULT 0,
  cards_correct INTEGER DEFAULT 0,
  
  session_type TEXT CHECK (session_type IN ('review', 'learn', 'cram'))
);

ALTER TABLE public.study_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own sessions" ON public.study_sessions
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX idx_sessions_user_date ON public.study_sessions(user_id, started_at);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get cards due for review
CREATE OR REPLACE FUNCTION get_due_cards(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS SETOF public.cards AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM public.cards
  WHERE user_id = p_user_id
    AND is_active = TRUE
    AND next_review_date <= CURRENT_DATE
  ORDER BY next_review_date ASC, ease_factor ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update card after review (SM-2 algorithm)
CREATE OR REPLACE FUNCTION update_card_after_review(
  p_card_id UUID,
  p_rating TEXT -- 'again', 'hard', 'good', 'easy'
)
RETURNS public.cards AS $$
DECLARE
  v_card public.cards;
  v_quality INTEGER;
  v_new_ease FLOAT;
  v_new_interval INTEGER;
  v_new_reps INTEGER;
BEGIN
  SELECT * INTO v_card FROM public.cards WHERE id = p_card_id;
  
  -- Convert rating to quality (0-5 scale for SM-2)
  v_quality := CASE p_rating
    WHEN 'again' THEN 0
    WHEN 'hard' THEN 2
    WHEN 'good' THEN 4
    WHEN 'easy' THEN 5
  END;
  
  -- SM-2 Algorithm
  IF v_quality < 3 THEN
    -- Failed: reset
    v_new_reps := 0;
    v_new_interval := 1;
  ELSE
    -- Passed
    v_new_reps := v_card.repetitions + 1;
    
    IF v_new_reps = 1 THEN
      v_new_interval := 1;
    ELSIF v_new_reps = 2 THEN
      v_new_interval := 6;
    ELSE
      v_new_interval := CEIL(v_card.interval_days * v_card.ease_factor);
    END IF;
  END IF;
  
  -- Update ease factor
  v_new_ease := v_card.ease_factor + (0.1 - (5 - v_quality) * (0.08 + (5 - v_quality) * 0.02));
  IF v_new_ease < 1.3 THEN
    v_new_ease := 1.3;
  END IF;
  
  -- Update card
  UPDATE public.cards
  SET
    ease_factor = v_new_ease,
    interval_days = v_new_interval,
    repetitions = v_new_reps,
    last_review_date = CURRENT_DATE,
    next_review_date = CURRENT_DATE + v_new_interval,
    updated_at = NOW()
  WHERE id = p_card_id
  RETURNING * INTO v_card;
  
  -- Log the review
  INSERT INTO public.card_reviews (card_id, user_id, rating, ease_factor_after, interval_days_after)
  VALUES (p_card_id, v_card.user_id, p_rating, v_new_ease, v_new_interval);
  
  RETURN v_card;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get study stats for a user
CREATE OR REPLACE FUNCTION get_study_stats(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_stats JSON;
BEGIN
  SELECT json_build_object(
    'total_cards', (SELECT COUNT(*) FROM public.cards WHERE user_id = p_user_id AND is_active = TRUE),
    'due_today', (SELECT COUNT(*) FROM public.cards WHERE user_id = p_user_id AND is_active = TRUE AND next_review_date <= CURRENT_DATE),
    'reviewed_today', (SELECT COUNT(*) FROM public.card_reviews WHERE user_id = p_user_id AND reviewed_at::date = CURRENT_DATE),
    'total_books', (SELECT COUNT(*) FROM public.books WHERE user_id = p_user_id),
    'streak_days', 0 -- TODO: implement streak calculation
  ) INTO v_stats;
  
  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
