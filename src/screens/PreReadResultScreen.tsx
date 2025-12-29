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
  
  const { currentBook, updateChapter, deletePreReadResult } = useStore();
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
    navigation.goBack();
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      'Are you sure you want to delete this pre-read summary? You can regenerate it later.'
    );
    if (confirmed) {
      deletePreReadResult(chapterId).then(() => {
        navigation.goBack();
      });
    }
  };

  const handlePrint = () => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pre-Read Briefing - ${chapter?.title || 'Chapter'}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 800px;
            margin: 0 auto;
            padding: 40px 20px;
          }
          .header {
            border-bottom: 2px solid #333;
            padding-bottom: 16px;
            margin-bottom: 24px;
          }
          .book-title { font-size: 14px; color: #666; margin-bottom: 4px; }
          .chapter-title { font-size: 24px; font-weight: 600; }
          .section { margin-bottom: 28px; }
          .section-title { 
            font-size: 18px; 
            font-weight: 600; 
            margin-bottom: 12px;
            color: #1a1a1a;
            border-bottom: 1px solid #ddd;
            padding-bottom: 6px;
          }
          .overview { font-size: 16px; line-height: 1.7; }
          .concept-card {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 16px;
            margin-bottom: 12px;
            border-left: 4px solid #4a9eff;
          }
          .concept-term { font-size: 17px; font-weight: 600; color: #2563eb; margin-bottom: 6px; }
          .concept-preview { font-size: 15px; color: #444; margin-bottom: 10px; }
          .watch-for { 
            background: #e8e8e8; 
            padding: 10px; 
            border-radius: 4px; 
            font-size: 13px;
          }
          .watch-for-label { font-weight: 600; color: #2563eb; }
          .question-card {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-left: 4px solid #4a9eff;
          }
          .question-text { font-size: 15px; }
          .structure-card {
            background: #f5f5f5;
            border-radius: 8px;
            padding: 16px;
            white-space: pre-wrap;
          }
          .structure-text { font-size: 15px; }
          .connections { font-style: italic; color: #555; }
          @media print {
            body { padding: 20px; }
            .concept-card, .question-card, .structure-card { 
              break-inside: avoid; 
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="book-title">${currentBook?.title || ''}</div>
          <div class="chapter-title">${chapter?.title || ''} — Pre-Read Briefing</div>
        </div>

        <div class="section">
          <div class="section-title">Overview</div>
          <div class="overview">${result?.chapter_overview || ''}</div>
        </div>

        ${result?.key_concepts?.length ? `
          <div class="section">
            <div class="section-title">Key Concepts to Watch For</div>
            ${result.key_concepts.map(concept => `
              <div class="concept-card">
                <div class="concept-term">${concept.term}</div>
                <div class="concept-preview">${concept.preview}</div>
                <div class="watch-for">
                  <span class="watch-for-label">Watch for: </span>
                  <span>${concept.watch_for}</span>
                </div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${result?.questions_to_hold?.length ? `
          <div class="section">
            <div class="section-title">Questions to Hold in Mind</div>
            ${result.questions_to_hold.map(question => `
              <div class="question-card">
                <div class="question-text">• ${question}</div>
              </div>
            `).join('')}
          </div>
        ` : ''}

        ${result?.structure_map ? `
          <div class="section">
            <div class="section-title">Chapter Structure</div>
            <div class="structure-card">
              <div class="structure-text">${result.structure_map}</div>
            </div>
          </div>
        ` : ''}

        ${result?.connections ? `
          <div class="section">
            <div class="section-title">Connections</div>
            <div class="connections">${result.connections}</div>
          </div>
        ` : ''}
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.focus();
        printWindow.print();
      };
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  if (!result) return null;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.banner}>
          <Text style={styles.bookTitle}>{currentBook?.title}</Text>
          <Text style={styles.chapterTitle}>{chapter?.title}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Overview</Text>
          <Text style={styles.overview}>{result.chapter_overview}</Text>
        </View>

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

        {result.structure_map && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Chapter Structure</Text>
            <View style={styles.structureCard}>
              <Text style={styles.structureText}>{result.structure_map}</Text>
            </View>
          </View>
        )}

        {result.connections && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connections</Text>
            <Text style={styles.connectionsText}>{result.connections}</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash-outline" size={18} color="#ff6b6b" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.printButton} onPress={handlePrint}>
          <Ionicons name="print-outline" size={18} color="#4a9eff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.primaryButton} onPress={handleReadyToRead}>
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
  deleteButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ff6b6b',
    backgroundColor: '#2a1a1a',
  },
  printButton: {
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#4a9eff',
    backgroundColor: '#1a2a3a',
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
