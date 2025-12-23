import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { supabase, Chapter, PostReadResult, Card } from '../lib/supabase';
import { exportToAnki, exportToPrintable, shareCardsAsText } from '../lib/export';
import { RootStackParamList } from '../../App';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'PostReadResult'>;

export default function PostReadResultScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const { chapterId } = route.params;
  
  const { currentBook } = useStore();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [result, setResult] = useState<PostReadResult | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);

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

    // Load post-read result
    const { data: resultData } = await supabase
      .from('postread_results')
      .select('*')
      .eq('chapter_id', chapterId)
      .single();
    if (resultData) setResult(resultData);

    // Load cards
    const { data: cardsData } = await supabase
      .from('cards')
      .select('*')
      .eq('chapter_id', chapterId)
      .order('created_at');
    if (cardsData) setCards(cardsData);
  };

  const handleExport = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Export to Anki', 'Export as PDF', 'Share as Text'],
          cancelButtonIndex: 0,
          title: 'Export Cards',
          message: `Export ${cards.length} cards from this chapter`,
        },
        async (buttonIndex) => {
          try {
            if (buttonIndex === 1) {
              await exportToAnki({
                cards,
                bookTitle: currentBook?.title || 'Reading Companion',
              });
            } else if (buttonIndex === 2) {
              await exportToPrintable({
                cards,
                bookTitle: currentBook?.title || 'Reading Companion',
                chapterTitle: chapter?.title || 'Chapter',
                postReadResult: result || undefined,
              });
            } else if (buttonIndex === 3) {
              await shareCardsAsText(
                cards,
                `${currentBook?.title} - ${chapter?.title}`
              );
            }
          } catch (error) {
            Alert.alert('Export Error', 'Failed to export cards');
          }
        }
      );
    } else {
      // Android fallback - show alert with options
      Alert.alert(
        'Export Cards',
        `Export ${cards.length} cards from this chapter`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Anki',
            onPress: () => exportToAnki({ cards, bookTitle: currentBook?.title || '' }),
          },
          {
            text: 'PDF',
            onPress: () => exportToPrintable({
              cards,
              bookTitle: currentBook?.title || '',
              chapterTitle: chapter?.title || '',
              postReadResult: result || undefined,
            }),
          },
        ]
      );
    }
  };

  const flipCard = () => setIsFlipped(!isFlipped);
  
  const nextCard = () => {
    if (currentCardIndex < cards.length - 1) {
      setCurrentCardIndex(currentCardIndex + 1);
      setIsFlipped(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setCurrentCardIndex(currentCardIndex - 1);
      setIsFlipped(false);
    }
  };

  if (!result) return null;

  const currentCard = cards[currentCardIndex];

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Book Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bookTitle}>{currentBook?.title}</Text>
            <Text style={styles.chapterTitle}>{chapter?.title}</Text>
          </View>
          <TouchableOpacity style={styles.exportButton} onPress={handleExport}>
            <Ionicons name="share-outline" size={22} color="#4a9eff" />
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Chapter Summary</Text>
          <Text style={styles.summaryText}>{result.chapter_summary}</Text>
        </View>

        {/* Core Concepts */}
        {result.core_concepts?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Core Concepts</Text>
            {result.core_concepts.map((concept, index) => (
              <View key={index} style={styles.conceptCard}>
                <Text style={styles.conceptName}>{concept.name}</Text>
                <Text style={styles.conceptDef}>{concept.definition}</Text>
                <View style={styles.conceptMeta}>
                  <Text style={styles.metaLabel}>Significance: </Text>
                  <Text style={styles.metaText}>{concept.significance}</Text>
                </View>
                {concept.example && (
                  <View style={styles.conceptMeta}>
                    <Text style={styles.metaLabel}>Example: </Text>
                    <Text style={styles.metaText}>{concept.example}</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Key Claims */}
        {result.key_claims?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Key Claims</Text>
            {result.key_claims.map((claim, index) => (
              <View key={index} style={styles.claimCard}>
                <Text style={styles.claimText}>{claim.claim}</Text>
                <View style={styles.claimMeta}>
                  <Text style={styles.metaLabel}>Evidence: </Text>
                  <Text style={styles.metaText}>{claim.evidence}</Text>
                </View>
                <View style={styles.claimMeta}>
                  <Text style={styles.metaLabel}>Implications: </Text>
                  <Text style={styles.metaText}>{claim.implications}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Cards Preview */}
        {cards.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Review Cards ({cards.length})</Text>
              <TouchableOpacity onPress={handleExport}>
                <Text style={styles.exportLink}>Export</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.cardViewer}>
              <View style={styles.cardProgress}>
                <Text style={styles.cardProgressText}>
                  Card {currentCardIndex + 1} of {cards.length}
                </Text>
                <View style={styles.cardTags}>
                  <Text style={styles.cardTag}>{currentCard?.card_type}</Text>
                  <Text style={styles.cardTag}>{currentCard?.difficulty}</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.flashcard} onPress={flipCard}>
                {!isFlipped ? (
                  <View style={styles.cardContent}>
                    <Text style={styles.cardQuestion}>{currentCard?.front}</Text>
                    <Text style={styles.tapHint}>Tap to reveal</Text>
                  </View>
                ) : (
                  <View style={styles.cardContent}>
                    <Text style={styles.cardAnswer}>{currentCard?.back}</Text>
                  </View>
                )}
              </TouchableOpacity>

              <View style={styles.cardNav}>
                <TouchableOpacity
                  style={[styles.navButton, currentCardIndex === 0 && styles.navButtonDisabled]}
                  onPress={prevCard}
                  disabled={currentCardIndex === 0}
                >
                  <Ionicons name="chevron-back" size={20} color={currentCardIndex === 0 ? '#444' : '#888'} />
                  <Text style={[styles.navButtonText, currentCardIndex === 0 && styles.navButtonTextDisabled]}>
                    Previous
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.navButton, currentCardIndex === cards.length - 1 && styles.navButtonDisabled]}
                  onPress={nextCard}
                  disabled={currentCardIndex === cards.length - 1}
                >
                  <Text style={[styles.navButtonText, currentCardIndex === cards.length - 1 && styles.navButtonTextDisabled]}>
                    Next
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={currentCardIndex === cards.length - 1 ? '#444' : '#888'} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

        {/* Open Questions */}
        {result.open_questions?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Open Questions</Text>
            {result.open_questions.map((question, index) => (
              <View key={index} style={styles.questionCard}>
                <Ionicons name="help-circle-outline" size={18} color="#f59e0b" />
                <Text style={styles.questionText}>{question}</Text>
              </View>
            ))}
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
          style={styles.doneButton}
          onPress={() => navigation.navigate('Main' as any)}
        >
          <Ionicons name="checkmark-circle" size={20} color="#000" />
          <Text style={styles.doneButtonText}>Done</Text>
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
    paddingBottom: 40,
  },
  banner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#252525',
    flexDirection: 'row',
    alignItems: 'center',
  },
  bannerContent: {
    flex: 1,
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
  exportButton: {
    padding: 8,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 12,
  },
  exportLink: {
    fontSize: 14,
    color: '#4a9eff',
  },
  summaryText: {
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
  conceptName: {
    fontSize: 17,
    fontWeight: '600',
    color: '#4a9eff',
    marginBottom: 6,
  },
  conceptDef: {
    fontSize: 15,
    color: '#ccc',
    lineHeight: 22,
    marginBottom: 10,
  },
  conceptMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 6,
  },
  metaLabel: {
    fontSize: 13,
    color: '#888',
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    color: '#888',
    flex: 1,
  },
  claimCard: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#252525',
    borderLeftWidth: 3,
    borderLeftColor: '#4a9eff',
  },
  claimText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
    lineHeight: 24,
    marginBottom: 10,
  },
  claimMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 4,
  },
  cardViewer: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#252525',
  },
  cardProgress: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardProgressText: {
    fontSize: 13,
    color: '#888',
  },
  cardTags: {
    flexDirection: 'row',
    gap: 6,
  },
  cardTag: {
    fontSize: 11,
    color: '#666',
    backgroundColor: '#252525',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    textTransform: 'uppercase',
  },
  flashcard: {
    backgroundColor: '#252525',
    borderRadius: 12,
    padding: 24,
    minHeight: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    alignItems: 'center',
  },
  cardQuestion: {
    fontSize: 17,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 26,
  },
  cardAnswer: {
    fontSize: 16,
    color: '#4ade80',
    textAlign: 'center',
    lineHeight: 26,
  },
  tapHint: {
    fontSize: 12,
    color: '#666',
    marginTop: 16,
  },
  cardNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    gap: 4,
  },
  navButtonDisabled: {
    opacity: 0.5,
  },
  navButtonText: {
    fontSize: 14,
    color: '#888',
  },
  navButtonTextDisabled: {
    color: '#444',
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
  connectionsText: {
    fontSize: 15,
    color: '#bbb',
    lineHeight: 24,
    fontStyle: 'italic',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#252525',
  },
  doneButton: {
    backgroundColor: '#4a9eff',
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
});
