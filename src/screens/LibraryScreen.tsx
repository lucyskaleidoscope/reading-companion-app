import React, { useState } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const GOAL_TYPES = [
  { id: 'enjoyment', label: 'Enjoyment', icon: '🎭' },
  { id: 'research', label: 'Research', icon: '🔬' },
  { id: 'skill_acquisition', label: 'Skill Building', icon: '🛠️' },
  { id: 'general_learning', label: 'General Learning', icon: '📚' },
] as const;

export default function LibraryScreen() {
  const navigation = useNavigation<NavigationProp>();
  const { books, createBook, deleteBook } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    domain: '',
    user_goal: '',
    goal_type: '' as typeof GOAL_TYPES[number]['id'] | '',
  });

  const handleAddBook = async () => {
    if (!newBook.title.trim()) {
      Alert.alert('Error', 'Please enter a book title');
      return;
    }

    const book = await createBook({
      title: newBook.title.trim(),
      author: newBook.author.trim() || null,
      domain: newBook.domain.trim() || null,
      user_goal: newBook.user_goal.trim() || null,
      goal_type: newBook.goal_type || null,
    });

    if (book) {
      setShowAddModal(false);
      setNewBook({ title: '', author: '', domain: '', user_goal: '', goal_type: '' });
      navigation.navigate('BookDetail', { bookId: book.id });
    }
  };

  const handleDeleteBook = (bookId: string, title: string) => {
    Alert.alert(
      'Delete Book',
      `Are you sure you want to delete "${title}"? This will also delete all chapters and cards.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteBook(bookId) },
      ]
    );
  };

  const readingBooks = books.filter(b => b.status === 'reading');
  const completedBooks = books.filter(b => b.status === 'completed');
  const pausedBooks = books.filter(b => b.status === 'paused');

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Library</Text>
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setShowAddModal(true)}
          >
            <Ionicons name="add" size={24} color="#000" />
          </TouchableOpacity>
        </View>

        {readingBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Currently Reading</Text>
            {readingBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                onDelete={() => handleDeleteBook(book.id, book.title)}
              />
            ))}
          </View>
        )}

        {pausedBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Paused</Text>
            {pausedBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                onDelete={() => handleDeleteBook(book.id, book.title)}
              />
            ))}
          </View>
        )}

        {completedBooks.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedBooks.map(book => (
              <BookCard
                key={book.id}
                book={book}
                onPress={() => navigation.navigate('BookDetail', { bookId: book.id })}
                onDelete={() => handleDeleteBook(book.id, book.title)}
              />
            ))}
          </View>
        )}

        {books.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>📚</Text>
            <Text style={styles.emptyTitle}>No Books Yet</Text>
            <Text style={styles.emptyText}>
              Add your first book to start building your reading library.
            </Text>
          </View>
        )}
      </ScrollView>

      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCancel}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Add Book</Text>
            <TouchableOpacity onPress={handleAddBook}>
              <Text style={styles.modalSave}>Add</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Title *</Text>
              <TextInput
                style={styles.input}
                value={newBook.title}
                onChangeText={(text) => setNewBook({ ...newBook, title: text })}
                placeholder="Book title"
                placeholderTextColor="#666"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Author</Text>
              <TextInput
                style={styles.input}
                value={newBook.author}
                onChangeText={(text) => setNewBook({ ...newBook, author: text })}
                placeholder="Author name"
                placeholderTextColor="#666"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Domain / Genre</Text>
              <TextInput
                style={styles.input}
                value={newBook.domain}
                onChangeText={(text) => setNewBook({ ...newBook, domain: text })}
                placeholder="e.g., Military theory, Philosophy"
                placeholderTextColor="#666"
                autoCapitalize="words"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Why are you reading this?</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={newBook.user_goal}
                onChangeText={(text) => setNewBook({ ...newBook, user_goal: text })}
                placeholder="What do you want to get out of this book?"
                placeholderTextColor="#666"
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
                      newBook.goal_type === goal.id && styles.goalTypeSelected,
                    ]}
                    onPress={() => setNewBook({ ...newBook, goal_type: goal.id })}
                  >
                    <Text style={styles.goalTypeIcon}>{goal.icon}</Text>
                    <Text style={[
                      styles.goalTypeLabel,
                      newBook.goal_type === goal.id && styles.goalTypeLabelSelected,
                    ]}>
                      {goal.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function BookCard({ book, onPress, onDelete }: { 
  book: any; 
  onPress: () => void;
  onDelete: () => void;
}) {
  return (
    <TouchableOpacity style={styles.bookCard} onPress={onPress}>
      <View style={styles.bookIcon}>
        <Text style={styles.bookEmoji}>📖</Text>
      </View>
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={1}>{book.title}</Text>
        {book.author && (
          <Text style={styles.bookAuthor} numberOfLines={1}>{book.author}</Text>
        )}
        <View style={styles.bookMeta}>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${book.progress_percent}%` }]} />
            </View>
            <Text style={styles.progressText}>{book.progress_percent}%</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
        <Ionicons name="trash-outline" size={20} color="#666" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  // Tech-Education Theme
  container: { flex: 1, backgroundColor: '#F8F1E9' },
  scrollView: { flex: 1 },
  content: { padding: 24, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 },
  title: { fontSize: 32, fontWeight: '700', color: '#2D2D2D', letterSpacing: 0.5 },
  addButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#D4AF37', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  section: { marginBottom: 40 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 16 },
  bookCard: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 20, flexDirection: 'row', alignItems: 'center', marginBottom: 12, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.08, shadowRadius: 12, elevation: 4 },
  bookIcon: { width: 56, height: 56, borderRadius: 8, backgroundColor: '#E8EEF8', alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  bookEmoji: { fontSize: 28 },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 17, fontWeight: '600', color: '#2D2D2D', marginBottom: 4 },
  bookAuthor: { fontSize: 14, color: '#5A5A5A', marginBottom: 10 },
  bookMeta: { flexDirection: 'row', alignItems: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  progressBar: { flex: 1, height: 6, backgroundColor: '#E8E0D4', borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#1E3A8A' },
  progressText: { fontSize: 13, color: '#5A5A5A', width: 40, fontWeight: '500' },
  deleteButton: { padding: 10, marginLeft: 8 },
  emptyState: { alignItems: 'center', padding: 48 },
  emptyEmoji: { fontSize: 72, marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '700', color: '#2D2D2D', marginBottom: 12 },
  emptyText: { fontSize: 16, color: '#5A5A5A', textAlign: 'center', lineHeight: 24 },
  modalContainer: { flex: 1, backgroundColor: '#F8F1E9' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E8E0D4' },
  modalCancel: { fontSize: 16, color: '#5A5A5A', fontWeight: '500' },
  modalTitle: { fontSize: 20, fontWeight: '700', color: '#2D2D2D' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#D4AF37' },
  modalContent: { flex: 1, padding: 24 },
  inputGroup: { marginBottom: 24 },
  label: { fontSize: 12, fontWeight: '600', color: '#5A5A5A', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  input: { backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E8E0D4', borderRadius: 8, padding: 18, fontSize: 17, color: '#2D2D2D' },
  textArea: { height: 120, textAlignVertical: 'top' },
  goalTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  goalType: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 2, borderColor: '#E8E0D4', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16, gap: 8 },
  goalTypeSelected: { borderColor: '#1E3A8A', backgroundColor: '#E8EEF8' },
  goalTypeIcon: { fontSize: 18 },
  goalTypeLabel: { fontSize: 15, color: '#5A5A5A' },
  goalTypeLabelSelected: { color: '#1E3A8A', fontWeight: '600' },
});
