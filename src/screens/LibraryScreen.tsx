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
  container: { flex: 1, backgroundColor: '#0d0d0d' },
  scrollView: { flex: 1 },
  content: { padding: 20, paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 28, fontWeight: '300', color: '#fff' },
  addButton: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#4a9eff', alignItems: 'center', justifyContent: 'center' },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 },
  bookCard: { backgroundColor: '#1a1a1a', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 8, borderWidth: 1, borderColor: '#252525' },
  bookIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: '#252525', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  bookEmoji: { fontSize: 24 },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 16, fontWeight: '600', color: '#fff', marginBottom: 2 },
  bookAuthor: { fontSize: 14, color: '#888', marginBottom: 8 },
  bookMeta: { flexDirection: 'row', alignItems: 'center' },
  progressContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  progressBar: { flex: 1, height: 4, backgroundColor: '#333', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4a9eff' },
  progressText: { fontSize: 12, color: '#666', width: 36 },
  deleteButton: { padding: 8, marginLeft: 8 },
  emptyState: { alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 14, color: '#888', textAlign: 'center' },
  modalContainer: { flex: 1, backgroundColor: '#0d0d0d' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#252525' },
  modalCancel: { fontSize: 16, color: '#888' },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#fff' },
  modalSave: { fontSize: 16, fontWeight: '600', color: '#4a9eff' },
  modalContent: { flex: 1, padding: 20 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '600', color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 },
  input: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 12, padding: 16, fontSize: 16, color: '#fff' },
  textArea: { height: 100, textAlignVertical: 'top' },
  goalTypes: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  goalType: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 14, gap: 6 },
  goalTypeSelected: { borderColor: '#4a9eff', backgroundColor: '#1a2a3a' },
  goalTypeIcon: { fontSize: 16 },
  goalTypeLabel: { fontSize: 14, color: '#888' },
  goalTypeLabelSelected: { color: '#fff' },
});
