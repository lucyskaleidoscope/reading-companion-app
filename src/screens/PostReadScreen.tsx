import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { supabase, Chapter, PreReadResult } from '../lib/supabase';
import { generatePostRead } from '../lib/claude';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'PostRead'>;

export default function PostReadScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { chapterId } = route.params;
  
  const { currentBook, updateChapter } = useStore();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [preReadResult, setPreReadResult] = useState<PreReadResult | null>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showNotes, setShowNotes] = useState(false);

  useEffect(() => {
    loadData();
  }, [chapterId]);

  const loadData = async () => {
    // Load chapter
    const { data: chapterData } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
    
    if (chapterData) setChapter(chapterData);

    // Load pre-read results
    const { data: preReadData } = await supabase
      .from('preread_results')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();
    
    if (preReadData) setPreReadResult(preReadData);
  };

  const handleProcess = async () => {
    if (!chapter?.source_text || !currentBook) {
      Alert.alert('Error', 'Chapter text not found');
      return;
    }

    setIsProcessing(true);

    try {
      // Generate post-read analysis
      const result = await generatePostRead(
        currentBook.title,
        chapter.title,
        chapter.source_text,
        notes || undefined
      );

      const userId = (await supabase.auth.getUser()).data.user?.id;

      // Save post-read results
      const { error: postReadError } = await supabase
        .from('postread_results')
        .insert({
          chapter_id: chapterId,
          user_id: userId,
          chapter_summary: result.chapter_summary,
          core_concepts: result.core_concepts,
          key_claims: result.key_claims,
          open_questions: result.open_questions,
          connections: result.connections,
          reader_notes: notes || null,
        });

      if (postReadError) throw postReadError;

      // Save cards
      const cardsToInsert = result.cards.map(card => ({
        chapter_id: chapterId,
        book_id: currentBook.id,
        user_id: userId,
        front: card.front,
        back: card.back,
        card_type: card.type,
        difficulty: card.difficulty,
      }));

      const { error: cardsError } = await supabase
        .from('cards')
        .insert(cardsToInsert);

      if (cardsError) throw cardsError;

      // Mark chapter as complete
      await updateChapter(chapterId, {
        reading_complete: true,
        postread_complete: true,
      });

      // Navigate to results
      navigation.replace('PostReadResult', { chapterId });

    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="checkmark-circle" size={48} color="#4ade80" />
          </View>
          <Text style={styles.title}>Ready to Review</Text>
          <Text style={styles.subtitle}>
            Let's consolidate what you learned
          </Text>
        </View>

        {/* Chapter Info */}
        {chapter && (
          <View style={styles.chapterInfo}>
            <Text style={styles.bookTitle}>{currentBook?.title}</Text>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
          </View>
        )}

        {/* Stats from Pre-Read */}
        {preReadResult && (
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {preReadResult.key_concepts?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Concepts</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {preReadResult.questions_to_hold?.length || 0}
              </Text>
              <Text style={styles.statLabel}>Questions</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>8-12</Text>
              <Text style={styles.statLabel}>Cards</Text>
            </View>
          </View>
        )}

        {/* Optional Notes */}
        <View style={styles.notesSection}>
          <TouchableOpacity
            style={styles.notesToggle}
            onPress={() => setShowNotes(!showNotes)}
          >
            <Ionicons 
              name={showNotes ? "chevron-down" : "chevron-forward"} 
              size={20} 
              color="#888" 
            />
            <Text style={styles.notesToggleText}>
              Add highlights or notes (optional)
            </Text>
          </TouchableOpacity>
          
          {showNotes && (
            <TextInput
              style={styles.notesInput}
              value={notes}
              onChangeText={setNotes}
              placeholder="Paste any highlights, margin notes, or thoughts from your reading..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
            />
          )}
        </View>

        {/* What Will Be Generated */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What you'll get</Text>
          <View style={styles.infoItem}>
            <Ionicons name="document-text-outline" size={18} color="#4a9eff" />
            <Text style={styles.infoText}>Chapter summary and core concepts</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="bulb-outline" size={18} color="#4a9eff" />
            <Text style={styles.infoText}>Key claims with evidence</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="flash-outline" size={18} color="#4a9eff" />
            <Text style={styles.infoText}>8-12 spaced repetition cards</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="help-circle-outline" size={18} color="#4a9eff" />
            <Text style={styles.infoText}>Open questions for further thinking</Text>
          </View>
        </View>
      </ScrollView>

      {/* Process Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.processButton, isProcessing && styles.processButtonDisabled]}
          onPress={handleProcess}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="#000" />
              <Text style={styles.processButtonText}>Extracting Knowledge...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#000" />
              <Text style={styles.processButtonText}>Extract Knowledge & Generate Cards</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0d0d0d',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#888',
  },
  chapterInfo: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#252525',
    alignItems: 'center',
  },
  bookTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 2,
  },
  chapterTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#252525',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '600',
    color: '#4a9eff',
  },
  statLabel: {
    fontSize: 13,
    color: '#666',
    marginTop: 4,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: '#252525',
  },
  notesToggleText: {
    fontSize: 15,
    color: '#888',
  },
  notesInput: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    minHeight: 120,
    lineHeight: 22,
  },
  infoCard: {
    backgroundColor: '#1a2a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#2a4a2a',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ade80',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 15,
    color: '#ccc',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  processButton: {
    backgroundColor: '#4ade80',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  processButtonDisabled: {
    opacity: 0.5,
  },
  processButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
