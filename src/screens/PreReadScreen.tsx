import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { supabase, Chapter } from '../lib/supabase';
import { generatePreRead } from '../lib/claude';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'PreRead'>;

type InputMode = 'paste' | 'url';

export default function PreReadScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { chapterId } = route.params;
  
  const { currentBook, updateChapter } = useStore();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('paste');
  const [text, setText] = useState('');
  const [url, setUrl] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
    
    if (data) {
      setChapter(data);
      if (data.source_text) {
        setText(data.source_text);
      }
    }
  };

  const handleProcess = async () => {
    if (!text.trim() || !currentBook || !chapter) {
      window.alert('Please provide chapter text');
      return;
    }

    setIsProcessing(true);

    try {
      // Save the source text
      await updateChapter(chapterId, {
        source_text: text,
        source_type: inputMode,
        word_count: text.split(/\s+/).length,
      });

      // Generate pre-read analysis
      const result = await generatePreRead({
        chapterText: text,
        bookTitle: currentBook.title,
        bookAuthor: currentBook.author,
        domain: currentBook.domain,
        userGoal: currentBook.user_goal,
        goalType: currentBook.goal_type,
      });

      // Save pre-read results
      const { error } = await supabase
        .from('preread_results')
        .insert({
          chapter_id: chapterId,
          user_id: (await supabase.auth.getUser()).data.user?.id,
          chapter_overview: result.overview,
          key_concepts: result.concepts.map(c => ({ term: c.term, preview: c.definition, watch_for: c.importance })),
          questions_to_hold: result.questions,
          structure_map: result.structure,
        })
        .select()
        .single();

      if (error) throw error;

      // Mark chapter as pre-read complete
      await updateChapter(chapterId, { preread_complete: true });

      // Navigate to results
      navigation.navigate('PreReadResult', { chapterId });
    } catch (error) {
      console.error('Pre-read error:', error);
      window.alert('Failed to generate pre-read briefing');
    } finally {
      setIsProcessing(false);
    }
  };


  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Pre-Read Setup</Text>
          <Text style={styles.subtitle}>
            Provide the chapter text to generate your reading briefing
          </Text>
        </View>

        {/* Chapter Info */}
        {chapter && (
          <View style={styles.chapterInfo}>
            <Text style={styles.bookTitle}>{currentBook?.title}</Text>
            <Text style={styles.chapterTitle}>{chapter.title}</Text>
          </View>
        )}

        {/* Input Mode Tabs */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, inputMode === 'paste' && styles.tabActive]}
            onPress={() => setInputMode('paste')}
          >
            <Ionicons 
              name="clipboard-outline" 
              size={18} 
              color={inputMode === 'paste' ? '#fff' : '#888'} 
            />
            <Text style={[styles.tabText, inputMode === 'paste' && styles.tabTextActive]}>
              Paste
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, inputMode === 'url' && styles.tabActive]}
            onPress={() => setInputMode('url')}
          >
            <Ionicons 
              name="link-outline" 
              size={18} 
              color={inputMode === 'url' ? '#fff' : '#888'} 
            />
            <Text style={[styles.tabText, inputMode === 'url' && styles.tabTextActive]}>
              URL
            </Text>
          </TouchableOpacity>
        </View>

        {/* Paste Input */}
        {inputMode === 'paste' && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Chapter Text</Text>
            <TextInput
              style={styles.textArea}
              value={text}
              onChangeText={setText}
              placeholder="Paste the full chapter text here..."
              placeholderTextColor="#666"
              multiline
              textAlignVertical="top"
            />
            <Text style={styles.charCount}>
              {text.length.toLocaleString()} characters
            </Text>
          </View>
        )}

        {/* URL Input */}
        {inputMode === 'url' && (
          <View style={styles.inputSection}>
            <Text style={styles.label}>Web Address</Text>
            <TextInput
              style={styles.input}
              value={url}
              onChangeText={setUrl}
              placeholder="https://example.com/article"
              placeholderTextColor="#666"
              keyboardType="url"
              autoCapitalize="none"
            />
            <Text style={styles.urlHint}>
              URL fetching coming soon. Please paste text for now.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Process Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.processButton, (!text.trim() || isProcessing) && styles.processButtonDisabled]}
          onPress={handleProcess}
          disabled={!text.trim() || isProcessing}
        >
          {isProcessing ? (
            <>
              <ActivityIndicator color="#000" />
              <Text style={styles.processButtonText}>Generating Briefing...</Text>
            </>
          ) : (
            <>
              <Ionicons name="sparkles" size={20} color="#000" />
              <Text style={styles.processButtonText}>Generate Pre-Read Briefing</Text>
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
    marginBottom: 20,
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 6,
  },
  tabActive: {
    backgroundColor: '#252525',
  },
  tabText: {
    fontSize: 14,
    color: '#888',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '500',
  },
  inputSection: {
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  textArea: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#fff',
    minHeight: 300,
    lineHeight: 22,
  },
  charCount: {
    fontSize: 12,
    color: '#666',
    textAlign: 'right',
    marginTop: 8,
  },
  input: {
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
  },
  urlHint: {
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  processButton: {
    backgroundColor: '#4a9eff',
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
