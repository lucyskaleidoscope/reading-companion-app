import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { supabase, Chapter, PreReadResult } from '../lib/supabase';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'PreReadResult'>;

export default function PreReadResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { chapterId } = route.params;
  
  const { currentBook, updateChapter } = useStore();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [result, setResult] = useState<PreReadResult | null>(null);

  useEffect(() => {
    loadData();
  }, [chapterId]);

  const loadData = async () => {
    const { data: chapterData } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
    
    if (chapterData) setChapter(chapterData);

    const { data: resultData } = await supabase
      .from('preread_results')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();
    
    if (resultData) setResult(resultData);
  };

  const handleReadyToRead = async () => {
    await updateChapter(chapterId, { reading_complete: false });
    navigation.navigate('Main' as any);
  };

  if (!result) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Book Banner */}
        <View style={styles.banner}>
          <Text style={styles.bookTitle}>{currentBook?.title}</Text>
          <Text style={styles.chapterTitle}>{chapter?.title}</Text>
        </View>

        {/* Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{result.chapter_overview}</Text>
        </View>

        {/* Key Concepts */}
        {result.key_concepts?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Concepts to Watch For</Text>
            {result.key_concepts.map((concept, index) => (
              <View key={index} style={styles.conceptCard}>
                <Text style={styles.conceptTerm}>{concept.term}</Text>
                <Text style={styles.conceptPreview}>{concept.preview}</Text>
                <View style={styles.watchFor}>
                  <Text style={styles.watchForLabel}>Watch for: </Text>
                  <Text style={styles.watchForText}>{concept.watch_for}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Questions */}
        {result.questions_to_hold?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Questions to Hold in Mind</Text>
            {result.questions_to_hold.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                <Ionicons name="help-circle-outline" size={18} color="#4a9eff" />
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Structure */}
        {result.structure_map && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapter Structure</Text>
            <View style={styles.structureCard}>
              <Text style={styles.structureText}>{result.structure_map}</Text>
            </View>
          </View>
        )}

        {/* Connections */}
        {result.connections && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connections</Text>
            <Text style={styles.connectionsText}>{result.connections}</Text>
          </View>
        )}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Back</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleReadyToRead}
        >
          <Ionicons name="checkmark" size={20} color="#000" />
          <Text style={styles.primaryButtonText}>Got It — I'll Read Now</Text>
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
  banner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
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
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  overview: {
    fontSize: 16,
    color: '#ccc',
    lineHeight: 26,
  },
  conceptCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#252525',
  },
  conceptTerm: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4a9eff',
    marginBottom: 6,
  },
  conceptPreview: {
    fontSize: 15,
    color: '#bbb',
    lineHeight: 22,
    marginBottom: 10,
  },
  watchFor: {
    backgroundColor: '#252525',
    borderRadius: 6,
    padding: 10,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  watchForLabel: {
    fontSize: 13,
    color: '#4a9eff',
    fontWeight: '600',
  },
  watchForText: {
    fontSize: 13,
    color: '#888',
    flex: 1,
  },
  questionCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#252525',
  },
  questionText: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    flex: 1,
  },
  structureCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#252525',
  },
  structureText: {
    fontSize: 15,
    color: '#bbb',
    lineHeight: 24,
  },
  connectionsText: {
    fontSize: 15,
    color: '#bbb',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  footer: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#888',
  },
  primaryButton: {
    flex: 1,
    backgroundColor: '#4ade80',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});
