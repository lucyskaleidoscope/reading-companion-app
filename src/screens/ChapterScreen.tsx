import React, { useEffect, useState } from 'react';
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
import { supabase, Chapter } from '../lib/supabase';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'Chapter'>;

export default function ChapterScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { chapterId, bookId } = route.params;
  
  const { currentBook } = useStore();
  const [chapter, setChapter] = useState<Chapter | null>(null);

  useEffect(() => {
    loadChapter();
  }, [chapterId]);

  const loadChapter = async () => {
    const { data } = await supabase
      .from('chapters')
      .select('*')
      .eq('id', chapterId)
      .single();
    
    if (data) setChapter(data);
  };

  if (!chapter) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Chapter Header */}
        <View style={styles.header}>
          <Text style={styles.bookTitle}>{currentBook?.title}</Text>
          <Text style={styles.chapterTitle}>{chapter.title}</Text>
          {chapter.word_count && (
            <Text style={styles.wordCount}>
              {chapter.word_count.toLocaleString()} words
            </Text>
          )}
        </View>

        {/* Reading Cycle Steps */}
        <View style={styles.stepsContainer}>
          {/* Pre-Read */}
          <TouchableOpacity
            style={[
              styles.stepCard,
              chapter.preread_complete && styles.stepCardComplete,
            ]}
            onPress={() => {
              if (chapter.preread_complete) {
                navigation.navigate('PreReadResult', { chapterId });
              } else {
                navigation.navigate('PreRead', { chapterId });
              }
            }}
          >
            <View style={styles.stepIcon}>
              {chapter.preread_complete ? (
                <Ionicons name="checkmark-circle" size={32} color="#4ade80" />
              ) : (
                <Text style={styles.stepNumber}>1</Text>
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Pre-Read</Text>
              <Text style={styles.stepDesc}>
                {chapter.preread_complete
                  ? 'Briefing complete — tap to review'
                  : 'Prime your mind before reading'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#666" />
          </TouchableOpacity>

          {/* Reading */}
          <View
            style={[
              styles.stepCard,
              !chapter.preread_complete && styles.stepCardLocked,
              chapter.reading_complete && styles.stepCardComplete,
            ]}
          >
            <View style={styles.stepIcon}>
              {chapter.reading_complete ? (
                <Ionicons name="checkmark-circle" size={32} color="#4ade80" />
              ) : chapter.preread_complete ? (
                <Ionicons name="book" size={28} color="#f59e0b" />
              ) : (
                <Ionicons name="lock-closed" size={24} color="#666" />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, !chapter.preread_complete && styles.stepTitleLocked]}>
                Read
              </Text>
              <Text style={styles.stepDesc}>
                {chapter.reading_complete
                  ? 'Chapter read'
                  : chapter.preread_complete
                  ? 'Read the chapter on your Kindle'
                  : 'Complete pre-read first'}
              </Text>
            </View>
          </View>

          {/* Post-Read */}
          <TouchableOpacity
            style={[
              styles.stepCard,
              !chapter.preread_complete && styles.stepCardLocked,
              chapter.postread_complete && styles.stepCardComplete,
            ]}
            disabled={!chapter.preread_complete}
            onPress={() => {
              if (chapter.postread_complete) {
                navigation.navigate('PostReadResult', { chapterId });
              } else {
                navigation.navigate('PostRead', { chapterId });
              }
            }}
          >
            <View style={styles.stepIcon}>
              {chapter.postread_complete ? (
                <Ionicons name="checkmark-circle" size={32} color="#4ade80" />
              ) : chapter.preread_complete ? (
                <Text style={styles.stepNumber}>3</Text>
              ) : (
                <Ionicons name="lock-closed" size={24} color="#666" />
              )}
            </View>
            <View style={styles.stepContent}>
              <Text style={[styles.stepTitle, !chapter.preread_complete && styles.stepTitleLocked]}>
                Post-Read
              </Text>
              <Text style={styles.stepDesc}>
                {chapter.postread_complete
                  ? 'Knowledge extracted — tap to review'
                  : chapter.preread_complete
                  ? 'Extract knowledge and generate cards'
                  : 'Complete reading first'}
              </Text>
            </View>
            {chapter.preread_complete && (
              <Ionicons name="chevron-forward" size={20} color="#666" />
            )}
          </TouchableOpacity>
        </View>

        {/* Status Summary */}
        <View style={styles.statusCard}>
          <Text style={styles.statusTitle}>Chapter Status</Text>
          <View style={styles.statusRow}>
            <StatusItem
              label="Pre-Read"
              complete={chapter.preread_complete}
            />
            <StatusItem
              label="Reading"
              complete={chapter.reading_complete}
            />
            <StatusItem
              label="Post-Read"
              complete={chapter.postread_complete}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function StatusItem({ label, complete }: { label: string; complete: boolean }) {
  return (
    <View style={styles.statusItem}>
      <Ionicons
        name={complete ? 'checkmark-circle' : 'ellipse-outline'}
        size={24}
        color={complete ? '#4ade80' : '#666'}
      />
      <Text style={[styles.statusLabel, complete && styles.statusLabelComplete]}>
        {label}
      </Text>
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
    marginBottom: 32,
  },
  bookTitle: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 4,
  },
  wordCount: {
    fontSize: 13,
    color: '#666',
  },
  stepsContainer: {
    marginBottom: 24,
  },
  stepCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#252525',
  },
  stepCardComplete: {
    borderColor: '#2a4a2a',
    backgroundColor: '#1a2a1a',
  },
  stepCardLocked: {
    opacity: 0.5,
  },
  stepIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#252525',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  stepNumber: {
    fontSize: 20,
    fontWeight: '600',
    color: '#888',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 2,
  },
  stepTitleLocked: {
    color: '#666',
  },
  stepDesc: {
    fontSize: 14,
    color: '#888',
  },
  statusCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#252525',
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 16,
    textAlign: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 13,
    color: '#666',
  },
  statusLabelComplete: {
    color: '#4ade80',
  },
});
