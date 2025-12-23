import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { signOut } from '../lib/supabase';
import { useStore } from '../store/useStore';

export default function SettingsScreen() {
  const { user, stats } = useStore();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: signOut },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Settings</Text>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="mail-outline" size={20} color="#888" />
              <Text style={styles.rowLabel}>Email</Text>
              <Text style={styles.rowValue}>{user?.email}</Text>
            </View>
          </View>
        </View>

        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="library-outline" size={20} color="#888" />
              <Text style={styles.rowLabel}>Total Books</Text>
              <Text style={styles.rowValue}>{stats?.total_books || 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Ionicons name="documents-outline" size={20} color="#888" />
              <Text style={styles.rowLabel}>Total Cards</Text>
              <Text style={styles.rowValue}>{stats?.total_cards || 0}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Ionicons name="flash-outline" size={20} color="#888" />
              <Text style={styles.rowLabel}>Reviewed Today</Text>
              <Text style={styles.rowValue}>{stats?.reviewed_today || 0}</Text>
            </View>
          </View>
        </View>

        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.card}>
            <View style={styles.row}>
              <Ionicons name="information-circle-outline" size={20} color="#888" />
              <Text style={styles.rowLabel}>Version</Text>
              <Text style={styles.rowValue}>1.0.0</Text>
            </View>
          </View>
        </View>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={20} color="#ff6b6b" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: '300',
    color: '#fff',
    marginBottom: 24,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#252525',
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  rowLabel: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  rowValue: {
    fontSize: 16,
    color: '#888',
  },
  divider: {
    height: 1,
    backgroundColor: '#252525',
    marginLeft: 48,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    marginTop: 24,
  },
  signOutText: {
    fontSize: 16,
    color: '#ff6b6b',
  },
});
