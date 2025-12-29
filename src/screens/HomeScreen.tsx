import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { supabase, Chapter, PreReadResult, PostReadResult, Card } from '../lib/supabase';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { user, books, stats, dueCards, fetchBooks, fetchStats, fetchDueCards } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [bookChapters, setBookChapters] = useState<{[bookId: string]: Chapter[]}>({});
  const [preReadResults, setPreReadResults] = useState<{[chapterId: string]: PreReadResult}>({});
  const [postReadResults, setPostReadResults] = useState<{[chapterId: string]: PostReadResult}>({});
  const [chapterCards, setChapterCards] = useState<{[chapterId: string]: Card[]}>({});

  // Refresh stats every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      fetchStats();
      fetchDueCards();
      fetchBooks();
    }, [])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchBooks(), fetchStats(), fetchDueCards()]);
    setRefreshing(false);
  };

  useEffect(() => {
    fetchStats();
    fetchDueCards();
  }, []);

  useEffect(() => {
    const loadChaptersAndResults = async () => {
      const readingBooks = books.filter(b => b.status === 'reading');
      
      for (const book of readingBooks) {
        const { data: chapters } = await supabase
          .from('chapters')
          .select('*')
          .eq('book_id', book.id)
          .order('chapter_number');
        
        if (chapters) {
          setBookChapters(prev => ({ ...prev, [book.id]: chapters }));
          
          for (const chapter of chapters) {
            if (chapter.preread_complete) {
              const { data: preRead } = await supabase
                .from('preread_results')
                .select('*')
                .eq('chapter_id', chapter.id)
                .single();
              
              if (preRead) {
                setPreReadResults(prev => ({ ...prev, [chapter.id]: preRead }));
              }
            }
            
            if (chapter.postread_complete) {
              const { data: postRead } = await supabase
                .from('postread_results')
                .select('*')
                .eq('chapter_id', chapter.id)
                .single();
              
              if (postRead) {
                setPostReadResults(prev => ({ ...prev, [chapter.id]: postRead }));
              }
              
              const { data: cards } = await supabase
                .from('cards')
                .select('*')
                .eq('chapter_id', chapter.id);
              
              if (cards) {
                setChapterCards(prev => ({ ...prev, [chapter.id]: cards }));
              }
            }
          }
        }
      }
    };
    
    if (books.length > 0) {
      loadChaptersAndResults();
    }
  }, [books]);

  const readingBooks = books.filter(b => b.status === 'reading').slice(0, 3);

  const getCurrentChapter = (bookId: string) => {
    const chapters = bookChapters[bookId] || [];
    return chapters.find(c => !c.postread_complete) || chapters[chapters.length - 1];
  };

  const getCompletedChapters = (bookId: string) => {
    const chapters = bookChapters[bookId] || [];
    return chapters.filter(c => c.postread_complete);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#4a9eff" />
        }
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.date}>
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statRow}>
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats?.due_today || 0}</Text>
              <Text style={styles.statLabel}>Due Today</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats?.reviewed_today || 0}</Text>
              <Text style={styles.statLabel}>Reviewed</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statNumber}>{stats?.total_cards || 0}</Text>
              <Text style={styles.statLabel}>Total Cards</Text>
            </View>
          </View>

          {(stats?.due_today || 0) > 0 && (
            <TouchableOpacity
              style={styles.reviewButton}
              onPress={() => navigation.navigate('Main', { screen: 'Review' } as any)}
            >
              <Ionicons name="flash" size={20} color="#000" />
              <Text style={styles.reviewButtonText}>Start Review Session</Text>
            </TouchableOpacity>
          )}
        </View>

        {readingBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Continue Reading</Text>
            {readingBooks.map(book => {
              const currentChapter = getCurrentChapter(book.id);
              const completedChapters = getCompletedChapters(book.id);
              const preRead = currentChapter ? preReadResults[currentChapter.id] : null;
              
              return (
                <View key={book.id} style={styles.bookContainer}>
                  <TouchableOpacity
                    style={styles.bookCard}
                    onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                  >
                    <View style={styles.bookIcon}>
                      <Text style={styles.bookEmoji}>📖</Text>
                    </View>
                    <View style={styles.bookInfo}>
                      <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
                      <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
                      <View style={styles.progressBar}>
                        <View style={[styles.progressFill, { width: `${book.progress_percent}%` }]} />
                      </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color="#aaa" />
                  </TouchableOpacity>
                  
                  {/* Pre-Read Card for current chapter */}
                  {preRead && currentChapter && (
                    <TouchableOpacity 
                      style={styles.preReadCard}
                      onPress={() => navigation.navigate('PreReadResult', { chapterId: currentChapter.id })}
                    >
                      <View style={styles.cardHeader}>
                        <Ionicons name="bulb-outline" size={16} color="#4a9eff" />
                        <Text style={styles.cardHeaderText}>
                          {currentChapter.title} — Pre-Read
                        </Text>
                      </View>
                      <Text style={styles.cardOverview} numberOfLines={2}>
                        {preRead.chapter_overview}
                      </Text>
                      {preRead.questions_to_hold && preRead.questions_to_hold.length > 0 && (
                        <View style={styles.questionsPreview}>
                          <Text style={styles.questionsLabel}>Key question:</Text>
                          <Text style={styles.questionText} numberOfLines={1}>
                            {preRead.questions_to_hold[0]}
                          </Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  )}
                  
                  {/* Post-Read Cards for completed chapters */}
                  {completedChapters.map(chapter => {
                    const postRead = postReadResults[chapter.id];
                    const cards = chapterCards[chapter.id];
                    
                    if (!postRead) return null;
                    
                    return (
                      <TouchableOpacity 
                        key={chapter.id}
                        style={styles.postReadCard}
                        onPress={() => navigation.navigate('PostReadResult', { chapterId: chapter.id })}
                      >
                        <View style={styles.cardHeader}>
                          <Ionicons name="checkmark-circle-outline" size={16} color="#4ade80" />
                          <Text style={styles.postReadHeaderText}>
                            {chapter.title} — Post-Read
                          </Text>
                        </View>
                        <Text style={styles.cardOverview} numberOfLines={2}>
                          {postRead.chapter_summary}
                        </Text>
                        
                        <View style={styles.quickLinks}>
                          {postRead.core_concepts && postRead.core_concepts.length > 0 && (
                            <View style={styles.quickLink}>
                              <Ionicons name="library-outline" size={14} color="#bbb" />
                              <Text style={styles.quickLinkText}>
                                {postRead.core_concepts.length} concepts
                              </Text>
                            </View>
                          )}
                          {cards && cards.length > 0 && (
                            <View style={styles.quickLink}>
                              <Ionicons name="flash-outline" size={14} color="#bbb" />
                              <Text style={styles.quickLinkText}>
                                {cards.length} cards
                              </Text>
                            </View>
                          )}
                          {postRead.open_questions && postRead.open_questions.length > 0 && (
                            <View style={styles.quickLink}>
                              <Ionicons name="help-circle-outline" size={14} color="#bbb" />
                              <Text style={styles.quickLinkText}>
                                {postRead.open_questions.length} questions
                              </Text>
                            </View>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Main', { screen: 'Library' } as any)}
            >
              <Ionicons name="add-circle-outline" size={32} color="#4a9eff" />
              <Text style={styles.actionLabel}>New Book</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Main', { screen: 'Review' } as any)}
            >
              <Ionicons name="flash-outline" size={32} color="#4ade80" />
              <Text style={styles.actionLabel}>Review</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => navigation.navigate('Main', { screen: 'Library' } as any)}
            >
              <Ionicons name="library-outline" size={32} color="#f59e0b" />
              <Text style={styles.actionLabel}>Library</Text>
            </TouchableOpacity>
          </View>
        </View>

        {books.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>Start Your Learning Journey</Text>
            <Text style={styles.emptyText}>
              Add your first book to begin creating durable knowledge through spaced repetition.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => navigation.navigate('Main', { screen: 'Library' } as any)}
            >
              <Text style={styles.emptyButtonText}>Add Your First Book</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 28, fontWeight: '300', color: '#fff', marginBottom: 4 },
  date: { fontSize: 14, color: '#aaa' },
  statsCard: { backgroundColor: '#1a1a1a', borderRadius: 16, padding: 20, marginBottom: 24, borderWidth: 1, borderColor: '#252525' },
  statRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 16 },
  stat: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: '600', color: '#fff' },
  statLabel: { fontSize: 12, color: '#aaa', marginTop: 4 },
  statDivider: { width: 1, backgroundColor: '#333' },
  reviewButton: { backgroundColor: '#4a9eff', borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  reviewButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff', marginBottom: 12 },
  bookContainer: { marginBottom: 16 },
  bookCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: '#252525' },
  bookIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bookEmoji: { fontSize: 24 },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  bookAuthor: { fontSize: 14, color: '#bbb', marginBottom: 8 },
  progressBar: { height: 4, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4a9eff' },
  preReadCard: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#2a4a5a' },
  postReadCard: { backgroundColor: '#1a2a1a', borderRadius: 12, padding: 14, marginTop: 8, borderWidth: 1, borderColor: '#2a4a2a' },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  cardHeaderText: { fontSize: 13, fontWeight: '600', color: '#4a9eff' },
  postReadHeaderText: { fontSize: 13, fontWeight: '600', color: '#4ade80' },
  cardOverview: { fontSize: 14, color: '#ccc', lineHeight: 20, marginBottom: 8 },
  questionsPreview: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  questionsLabel: { fontSize: 12, color: '#4a9eff', fontWeight: '600' },
  questionText: { fontSize: 12, color: '#aaa', flex: 1 },
  quickLinks: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 4 },
  quickLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  quickLinkText: { fontSize: 12, color: '#bbb' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  actionCard: { flex: 1, backgroundColor: '#1a1a1a', borderRadius: 12, padding: 20, alignItems: 'center', borderWidth: 1, borderColor: '#252525' },
  actionLabel: { fontSize: 14, color: '#bbb', marginTop: 8 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#bbb', textAlign: 'center', lineHeight: 22, marginBottom: 24 },
  emptyButton: { backgroundColor: '#4a9eff', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 24 },
  emptyButtonText: { fontSize: 16, fontWeight: '600', color: '#000' },
});
