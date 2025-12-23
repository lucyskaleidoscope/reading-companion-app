import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '../store/useStore';
import { exportToAnki, exportToPrintable, shareCardsAsText } from '../lib/export';

export default function ReviewScreen() {
  const { dueCards, stats, fetchDueCards, reviewCard } = useStore();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [showExportMenu, setShowExportMenu] = useState(false);

  const flipAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    fetchDueCards();
  }, []);

  const currentCard = dueCards[currentIndex];

  const flipCard = () => {
    Animated.spring(flipAnim, {
      toValue: isFlipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
    setIsFlipped(!isFlipped);
  };

  const handleRating = async (rating: 'again' | 'hard' | 'good' | 'easy') => {
    if (!currentCard) return;

    await reviewCard(currentCard.id, rating);
    
    setSessionStats(prev => ({
      reviewed: prev.reviewed + 1,
      correct: rating !== 'again' ? prev.correct + 1 : prev.correct,
    }));

    if (currentIndex < dueCards.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      flipAnim.setValue(0);
    } else {
      Alert.alert(
        'Session Complete! 🎉',
        `You reviewed ${sessionStats.reviewed + 1} cards.\n${sessionStats.correct + (rating !== 'again' ? 1 : 0)} correct.`,
        [{ text: 'Done', onPress: () => {
          setCurrentIndex(0);
          setSessionStats({ reviewed: 0, correct: 0 });
          fetchDueCards();
        }}]
      );
    }
  };

  const handleExport = async (type: 'anki' | 'pdf' | 'text') => {
    setShowExportMenu(false);
    
    try {
      if (type === 'anki') {
        await exportToAnki({ cards: dueCards, bookTitle: 'All Due Cards' });
      } else if (type === 'pdf') {
        await exportToPrintable({
          cards: dueCards,
          bookTitle: 'Due Cards',
          chapterTitle: `${dueCards.length} cards due for review`,
        });
      } else {
        await shareCardsAsText(dueCards, 'Due Cards');
      }
    } catch (error) {
      Alert.alert('Export Error', 'Failed to export cards');
    }
  };

  if (dueCards.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🎉</Text>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptyText}>
            No cards due for review right now.{'\n'}
            Come back later or read a new chapter.
          </Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.total_cards || 0}</Text>
              <Text style={styles.statLabel}>Total Cards</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats?.reviewed_today || 0}</Text>
              <Text style={styles.statLabel}>Reviewed Today</Text>
            </View>
          </View>
        </View>
      </View>
    );
  }

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['180deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Review</Text>
        <View style={styles.headerRight}>
          <Text style={styles.progress}>
            {currentIndex + 1} / {dueCards.length}
          </Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={() => setShowExportMenu(!showExportMenu)}
          >
            <Ionicons name="share-outline" size={24} color="#aaa" />
          </TouchableOpacity>
        </View>
      </View>

      {showExportMenu && (
        <View style={styles.exportMenu}>
          <TouchableOpacity style={styles.exportOption} onPress={() => handleExport('anki')}>
            <Ionicons name="download-outline" size={20} color="#4a9eff" />
            <Text style={styles.exportOptionText}>Export to Anki</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportOption} onPress={() => handleExport('pdf')}>
            <Ionicons name="document-outline" size={20} color="#4a9eff" />
            <Text style={styles.exportOptionText}>Export as PDF</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.exportOption} onPress={() => handleExport('text')}>
            <Ionicons name="text-outline" size={20} color="#4a9eff" />
            <Text style={styles.exportOptionText}>Share as Text</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.progressBar}>
        <View 
          style={[
            styles.progressFill, 
            { width: `${((currentIndex + 1) / dueCards.length) * 100}%` }
          ]} 
        />
      </View>

      <View style={styles.cardContainer}>
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={flipCard}
          style={styles.cardTouchable}
        >
          <Animated.View
            style={[
              styles.card,
              styles.cardFront,
              { transform: [{ rotateY: frontInterpolate }] },
            ]}
          >
            <View style={styles.cardMeta}>
              <Text style={styles.cardType}>{currentCard?.card_type}</Text>
              <Text style={styles.cardDifficulty}>{currentCard?.difficulty}</Text>
            </View>
            <Text style={styles.cardQuestion}>{currentCard?.front}</Text>
            <Text style={styles.tapHint}>Tap to reveal answer</Text>
          </Animated.View>

          <Animated.View
            style={[
              styles.card,
              styles.cardBack,
              { transform: [{ rotateY: backInterpolate }] },
            ]}
          >
            <Text style={styles.cardAnswer}>{currentCard?.back}</Text>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isFlipped && (
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingPrompt}>How well did you know this?</Text>
          <View style={styles.ratingButtons}>
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingAgain]}
              onPress={() => handleRating('again')}
            >
              <Text style={styles.ratingButtonText}>Again</Text>
              <Text style={styles.ratingHint}>&lt;1 min</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingHard]}
              onPress={() => handleRating('hard')}
            >
              <Text style={styles.ratingButtonText}>Hard</Text>
              <Text style={styles.ratingHint}>~1 day</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingGood]}
              onPress={() => handleRating('good')}
            >
              <Text style={styles.ratingButtonText}>Good</Text>
              <Text style={styles.ratingHint}>~3 days</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.ratingButton, styles.ratingEasy]}
              onPress={() => handleRating('easy')}
            >
              <Text style={styles.ratingButtonText}>Easy</Text>
              <Text style={styles.ratingHint}>~7 days</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <View style={styles.sessionStats}>
        <Text style={styles.sessionStatsText}>
          Session: {sessionStats.reviewed} reviewed • {sessionStats.correct} correct
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', paddingTop: 60 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '300', color: '#fff' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  progress: { fontSize: 16, color: '#bbb' },
  exportButton: { padding: 4 },
  exportMenu: { position: 'absolute', top: 100, right: 20, backgroundColor: '#1a1a1a', borderRadius: 12, borderWidth: 1, borderColor: '#333', zIndex: 100, overflow: 'hidden' },
  exportOption: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, borderBottomWidth: 1, borderBottomColor: '#252525' },
  exportOptionText: { fontSize: 15, color: '#fff' },
  progressBar: { height: 3, backgroundColor: '#252525', marginHorizontal: 20, borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#4a9eff' },
  cardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  cardTouchable: { width: '100%', height: 300 },
  card: { position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', borderRadius: 16, padding: 24, justifyContent: 'center', alignItems: 'center' },
  cardFront: { backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#333' },
  cardBack: { backgroundColor: '#1a2a1a', borderWidth: 1, borderColor: '#2a4a2a' },
  cardMeta: { position: 'absolute', top: 16, left: 16, flexDirection: 'row', gap: 8 },
  cardType: { fontSize: 11, color: '#bbb', textTransform: 'uppercase', backgroundColor: '#252525', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  cardDifficulty: { fontSize: 11, color: '#bbb', textTransform: 'uppercase', backgroundColor: '#252525', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4 },
  cardQuestion: { fontSize: 20, color: '#fff', textAlign: 'center', lineHeight: 30 },
  cardAnswer: { fontSize: 18, color: '#4ade80', textAlign: 'center', lineHeight: 28 },
  tapHint: { position: 'absolute', bottom: 20, fontSize: 13, color: '#aaa' },
  ratingContainer: { padding: 20 },
  ratingPrompt: { fontSize: 14, color: '#bbb', textAlign: 'center', marginBottom: 12 },
  ratingButtons: { flexDirection: 'row', gap: 8 },
  ratingButton: { flex: 1, padding: 14, borderRadius: 12, alignItems: 'center' },
  ratingAgain: { backgroundColor: '#3d1f1f', borderWidth: 1, borderColor: '#6b3030' },
  ratingHard: { backgroundColor: '#3d3d1f', borderWidth: 1, borderColor: '#6b6b30' },
  ratingGood: { backgroundColor: '#1f3d2a', borderWidth: 1, borderColor: '#306b40' },
  ratingEasy: { backgroundColor: '#1f2a3d', borderWidth: 1, borderColor: '#30406b' },
  ratingButtonText: { fontSize: 14, fontWeight: '600', color: '#fff', marginBottom: 2 },
  ratingHint: { fontSize: 11, color: '#bbb' },
  sessionStats: { padding: 16, alignItems: 'center', borderTopWidth: 1, borderTopColor: '#252525' },
  sessionStatsText: { fontSize: 13, color: '#aaa' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyEmoji: { fontSize: 64, marginBottom: 16 },
  emptyTitle: { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#bbb', textAlign: 'center', lineHeight: 24, marginBottom: 32 },
  statsRow: { flexDirection: 'row', gap: 40 },
  statItem: { alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: '600', color: '#4a9eff' },
  statLabel: { fontSize: 13, color: '#aaa', marginTop: 4 },
});
