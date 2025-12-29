import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Modal,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { supabase, Chapter } from '../lib/supabase';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'BookDetail'>;

const GOAL_TYPES = [
  { id: 'enjoyment', label: 'Enjoyment', icon: '🎭' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'skill_acquisition', label: 'Skill Building', icon: '🛠️' },
  { id: 'general_learning', label: 'General Learning', icon: '📚' },
] as const;

export default function BookDetailScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { bookId } = route.params;
  
  const { books, updateBook, deleteBook, fetchChapters, createChapter, setCurrentBook, setCurrentChapter, deleteChapter } = useStore();
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState('');
  const [editBook, setEditBook] = useState({
    title: '',
    author: '',
    domain: '',
    user_goal: '',
    goal_type: '' as typeof GOAL_TYPES[number]['id'] | '',
  });

  const book = books.find(b => b.id === bookId);

  useEffect(() => {
    if (book) {
      setCurrentBook(book);
      loadChapters();
      setEditBook({
        title: book.title || '',
        author: book.author || '',
        domain: book.domain || '',
        user_goal: book.user_goal || '',
        goal_type: (book.goal_type as typeof GOAL_TYPES[number]['id']) || '',
      });
    }
  }, [bookId, book]);

  const loadChapters = async () => {
    const data = await fetchChapters(bookId);
    setChapters(data);
  };

  const handleAddChapter = async () => {
    if (!newChapterTitle.trim()) return;

    const chapter = await createChapter({
      book_id: bookId,
      title: newChapterTitle.trim(),
      chapter_number: chapters.length + 1,
    });

    if (chapter) {
      setShowAddModal(false);
      setNewChapterTitle('');
      loadChapters();
      navigation.navigate('PreRead', { chapterId: chapter.id });
    }
  };

  const handleSaveEdit = async () => {
    if (!editBook.title.trim()) {
      Alert.alert('Error', 'Book title is required');
      return;
    }

    await updateBook(bookId, {
      title: editBook.title.trim(),
      author: editBook.author.trim() || null,
      domain: editBook.domain.trim() || null,
      user_goal: editBook.user_goal.trim() || null,
      goal_type: editBook.goal_type || null,
    });

    setShowEditModal(false);
  };

  const handleDeleteBook = () => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${book?.title}"? This will also delete all chapters, pre-read summaries, post-read summaries, and flashcards.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteBook(bookId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleDeleteChapter = (chapter: Chapter) => {
    Alert.alert(
      'Delete Chapter',
      `Are you sure you want to delete "${chapter.title}"? This will also delete any pre-read, post-read, and flashcards for this chapter.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteChapter(chapter.id);
            loadChapters();
          },
        },
      ]
    );
  };

  const handleChapterPress = (chapter: Chapter) => {
    setCurrentChapter(chapter);
    
    if (!chapter.preread_complete) {
      navigation.navigate('PreRead', { chapterId: chapter.id });
    } else if (!chapter.postread_complete) {
      navigation.navigate('PostRead', { chapterId: chapter.id });
    } else {
      navigation.navigate('PostReadResult', { chapterId: chapter.id });
    }
  };

  const getChapterStatus = (chapter: Chapter) => {
    if (chapter.postread_complete) return { label: 'Complete', color: '#4ade80' };
    if (chapter.reading_complete) return { label: 'Ready for Review', color: '#4a9eff' };
    if (chapter.preread_complete) return { label: 'Reading', color: '#f59e0b' };
    return { label: 'Not Started', color: '#aaa' };
  };

  if (!book) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.bookIcon}>
            <Text style={styles.bookEmoji}>📖</Text>
          </View>
          <Text style={styles.title}>{book.title}</Text>
          {book.author && <Text style={styles.author}>{book.author}</Text>}
          {book.domain && <Text style={styles.domain}>{book.domain}</Text>}
          
          <TouchableOpacity 
            style={styles.editButton}
            onPress={() => setShowEditModal(true)}
          >
            <Ionicons name="pencil-outline" size={16} color="#4a9eff" />
            <Text style={styles.editButtonText}>Edit Book Info</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressCard}>
          <View style={styles.progressHeader}>
            <Text style={styles.progressLabel}>Progress</Text>
            <Text style={styles.progressPercent}>{book.progress_percent}%</Text>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${book.progress_percent}%` }]} />
          </View>
          <Text style={styles.progressDetail}>
            {chapters.filter(c => c.postread_complete).length} of {chapters.length} chapters complete
          </Text>
        </View>

        {book.user_goal && (
          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>Reading Goal</Text>
            <Text style={styles.goalText}>{book.user_goal}</Text>
          </View>
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Chapters</Text>
            <TouchableOpacity
              style={styles.addChapterButton}
              onPress={() => setShowAddModal(true)}
            >
              <Ionicons name="add" size={20} color="#4a9eff" />
              <Text style={styles.addChapterText}>Add Chapter</Text>
            </TouchableOpacity>
          </View>

          {chapters.length === 0 ? (
            <View style={styles.emptyChapters}>
              <Text style={styles.emptyText}>No chapters yet</Text>
              <Text style={styles.emptyHint}>Add your first chapter to start the reading cycle</Text>
            </View>
          ) : (
            chapters.map((chapter, index) => {
              const status = getChapterStatus(chapter);
              return (
                <TouchableOpacity
                  key={chapter.id}
                  style={styles.chapterCard}
                  onPress={() => handleChapterPress(chapter)}
                >
                  <View style={styles.chapterNumber}>
                    <Text style={styles.chapterNumberText}>{index + 1}</Text>
                  </View>
                  <View style={styles.chapterInfo}>
                    <Text style={styles.chapterTitle}>{chapter.title}</Text>
                    <View style={styles.chapterMeta}>
                      <View style={[styles.statusDot, { backgroundColor: status.color }]} />
                      <Text style={[styles.statusText, { color: status.color }]}>
                        {status.label}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.chapterActions}>
                    {chapter.preread_complete && (
                      <TouchableOpacity
                        style={styles.actionIcon}
                        onPress={() => navigation.navigate('PreReadResult', { chapterId: chapter.id })}
                      >
                        <Ionicons name="document-text-outline" size={18} color="#aaa" />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity
                      style={styles.actionIcon}
                      onPress={(e) => {
                        e.stopPropagation();
                        handleDeleteChapter(chapter);
                      }}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                    </TouchableOpacity>
                    <Ionicons name="chevron-forward" size={20} color="#aaa" />
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Add Chapter Modal */}
      <Modal visible={showAddModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Chapter</Text>
            <TouchableOpacity onPress={handleAddChapter}>
              <Text style={styles.modalSave}>Add</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.modalContent}>
            <Text style={styles.label}>Chapter Title</Text>
            <TextInput
              style={styles.input}
              value={newChapterTitle}
              onChangeText={setNewChapterTitle}
              placeholder="e.g., Chapter 1: Introduction"
              placeholderTextColor="#888"
              autoCapitalize="words"
              autoFocus
            />
          </View>
        </View>
      </Modal>

      {/* Edit Book Modal */}
      <Modal visible={showEditModal} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowEditModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Book</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={styles.modalSave}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={editBook.title}
                onChangeText={(text) => setEditBook({ ...editBook, title: text })}
                placeholder="Book title"
                placeholderTextColor="#888"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author</Text>
              <TextInput
                style={styles.input}
                value={editBook.author}
                onChangeText={(text) => setEditBook({ ...editBook, author: text })}
                placeholder="Author name"
                placeholderTextColor="#888"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Domain / Genre</Text>
              <TextInput
                style={styles.input}
                value={editBook.domain}
                onChangeText={(text) => setEditBook({ ...editBook, domain: text })}
                placeholder="e.g., Military theory, Philosophy"
                placeholderTextColor="#888"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Why are you reading this?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editBook.user_goal}
                onChangeText={(text) => setEditBook({ ...editBook, user_goal: text })}
                placeholder="What do you want to get out of this book?"
                placeholderTextColor="#888"
                multiline
                numberOfLines={3}
                autoCapitalize="sentences"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Goal Type</Text>
              <View style={styles.goalTypes}>
                {GOAL_TYPES.map(goal => (
                  <TouchableOpacity
                    key={goal.id}
                    style={[
                      styles.goalType,
                      editBook.goal_type === goal.id && styles.goalTypeSelected,
                    ]}
                    onPress={() => setEditBook({ ...editBook, goal_type: goal.id })}
                  >
                    <Text style={styles.goalTypeIcon}>{goal.icon}</Text>
                    <Text style={[
                      styles.goalTypeLabel,
                      editBook.goal_type === goal.id && styles.goalTypeLabelSelected,
                    ]}>
                      {goal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Delete Book Section */}
            <View style={styles.dangerZone}>
              <Text style={styles.dangerLabel}>Danger Zone</Text>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setShowEditModal(false);
                  handleDeleteBook();
                }}
              >
                <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
                <Text style={styles.deleteButtonText}>Delete Book</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  scrollView: { flex: 1 },
  content: { padding: 20 },
  header: { alignItems: 'center', marginBottom: 24 },
  bookIcon: { width: 80, height: 80, borderRadius: 16, backgroundColor: '#1a1a1a', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  bookEmoji: { fontSize: 40 },
  title: { fontSize: 24, fontWeight: '600', color: '#fff', textAlign: 'center', marginBottom: 4 },
  author: { fontSize: 16, color: '#bbb', marginBottom: 2 },
  domain: { fontSize: 14, color: '#aaa', marginBottom: 12 },
  editButton: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, borderWidth: 1, borderColor: '#4a9eff' },
  editButtonText: { fontSize: 14, color: '#4a9eff' },
  progressCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#252525' },
  progressHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  progressLabel: { fontSize: 14, color: '#bbb' },
  progressPercent: { fontSize: 14, fontWeight: '600', color: '#4a9eff' },
  progressBar: { height: 6, backgroundColor: '#333', borderRadius: 3, overflow: 'hidden', marginBottom: 8 },
  progressFill: { height: '100%', backgroundColor: '#4a9eff' },
  progressDetail: { fontSize: 12, color: '#aaa' },
  goalCard: { backgroundColor: '#1a2a3a', borderRadius: 12, padding: 16, marginBottom: 24, borderWidth: 1, borderColor: '#2a4a5a' },
  goalLabel: { fontSize: 12, fontWeight: '600', color: '#4a9eff', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  goalText: { fontSize: 15, color: '#ccc', lineHeight: 22 },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  addChapterButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addChapterText: { fontSize: 14, color: '#4a9eff' },
  chapterCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#252525' },
  chapterNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  chapterNumberText: { fontSize: 14, fontWeight: '600', color: '#bbb' },
  chapterInfo: { flex: 1 },
  chapterTitle: { fontSize: 16, fontWeight: '500', color: '#fff', marginBottom: 4 },
  chapterMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 13 },
  chapterActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  actionIcon: { padding: 4 },
  emptyChapters: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 32, alignItems: 'center', borderWidth: 1, borderColor: '#252525' },
  emptyText: { fontSize: 16, color: '#bbb', marginBottom: 4 },
  emptyHint: { fontSize: 14, color: '#aaa', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#0d0d0d' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#252525' },
  modalCancel: { fontSize: 16, color: '#bbb' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#4a9eff' },
  modalContent: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#bbb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff' },
  textArea: { height: 100, textAlignVertical: 'top' },
  goalTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalType: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, gap: 6 },
  goalTypeSelected: { borderColor: '#4a9eff', backgroundColor: '#1a2a3a' },
  goalTypeIcon: { fontSize: 16 },
  goalTypeLabel: { fontSize: 14, color: '#bbb' },
  goalTypeLabelSelected: { color: '#fff' },
  dangerZone: { marginTop: 40, paddingTop: 20, borderTopWidth: 1, borderTopColor: '#333' },
  dangerLabel: { fontSize: 12, fontWeight: '600', color: '#ff6b6b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#2a1a1a', borderWidth: 1, borderColor: '#ff6b6b', borderRadius: 12, padding: 16, gap: 8 },
  deleteButtonText: { fontSize: 16, fontWeight: '600', color: '#ff6b6b' },
});
