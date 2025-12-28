import React, { useEffect, useState, Component, ErrorInfo, ReactNode } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import { supabase } from './src/lib/supabase';
import { useStore } from './src/store/useStore';

import AuthScreen from './src/screens/AuthScreen';
import HomeScreen from './src/screens/HomeScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import ChapterScreen from './src/screens/ChapterScreen';
import PreReadScreen from './src/screens/PreReadScreen';
import PostReadScreen from './src/screens/PostReadScreen';
import PreReadResultScreen from './src/screens/PreReadResultScreen';
import PostReadResultScreen from './src/screens/PostReadResultScreen';

// Error Boundary for catching render errors
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('App Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <Text style={errorStyles.title}>Something went wrong</Text>
          <Text style={errorStyles.message}>{this.state.error?.message}</Text>
          <Text style={errorStyles.hint}>Try refreshing the page</Text>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0d0d0d', justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: '600', color: '#fff', marginBottom: 12 },
  message: { fontSize: 14, color: '#f66', textAlign: 'center', marginBottom: 20 },
  hint: { fontSize: 14, color: '#888' },
});

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  BookDetail: { bookId: string };
  Chapter: { chapterId: string; bookId: string };
  PreRead: { chapterId: string };
  PostRead: { chapterId: string };
  PreReadResult: { chapterId: string };
  PostReadResult: { chapterId: string };
};

export type HomeStackParamList = {
  HomeMain: undefined;
  BookDetail: { bookId: string };
  Chapter: { chapterId: string; bookId: string };
  PreRead: { chapterId: string };
  PostRead: { chapterId: string };
  PreReadResult: { chapterId: string };
  PostReadResult: { chapterId: string };
};

export type LibraryStackParamList = {
  LibraryMain: undefined;
  BookDetail: { bookId: string };
  Chapter: { chapterId: string; bookId: string };
  PreRead: { chapterId: string };
  PostRead: { chapterId: string };
  PreReadResult: { chapterId: string };
  PostReadResult: { chapterId: string };
};

export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Review: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const LibraryStack = createNativeStackNavigator<LibraryStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

const linking = {
  prefixes: [
    'http://localhost:8081',
    'https://reading-companion-web.vercel.app',
    'readingcompanion://',
  ],
  config: {
    screens: {
      Auth: 'auth/callback',
      Main: '',
    },
  },
};

const screenOptions = {
  headerStyle: { backgroundColor: '#0d0d0d' },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '600' as const },
  contentStyle: { backgroundColor: '#0d0d0d' },
};

function HomeStackNavigator() {
  return (
    <HomeStack.Navigator screenOptions={screenOptions}>
      <HomeStack.Screen
        name="HomeMain"
        component={HomeScreen}
        options={{ headerShown: false }}
      />
      <HomeStack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ title: 'Book' }}
      />
      <HomeStack.Screen
        name="Chapter"
        component={ChapterScreen}
        options={{ title: 'Chapter' }}
      />
      <HomeStack.Screen
        name="PreRead"
        component={PreReadScreen}
        options={{ title: 'Pre-Read Setup' }}
      />
      <HomeStack.Screen
        name="PostRead"
        component={PostReadScreen}
        options={{ title: 'Post-Read Review' }}
      />
      <HomeStack.Screen
        name="PreReadResult"
        component={PreReadResultScreen}
        options={{ title: 'Pre-Read Briefing' }}
      />
      <HomeStack.Screen
        name="PostReadResult"
        component={PostReadResultScreen}
        options={{ title: 'Post-Read Extraction' }}
      />
    </HomeStack.Navigator>
  );
}

function LibraryStackNavigator() {
  return (
    <LibraryStack.Navigator screenOptions={screenOptions}>
      <LibraryStack.Screen
        name="LibraryMain"
        component={LibraryScreen}
        options={{ headerShown: false }}
      />
      <LibraryStack.Screen
        name="BookDetail"
        component={BookDetailScreen}
        options={{ title: 'Book' }}
      />
      <LibraryStack.Screen
        name="Chapter"
        component={ChapterScreen}
        options={{ title: 'Chapter' }}
      />
      <LibraryStack.Screen
        name="PreRead"
        component={PreReadScreen}
        options={{ title: 'Pre-Read Setup' }}
      />
      <LibraryStack.Screen
        name="PostRead"
        component={PostReadScreen}
        options={{ title: 'Post-Read Review' }}
      />
      <LibraryStack.Screen
        name="PreReadResult"
        component={PreReadResultScreen}
        options={{ title: 'Pre-Read Briefing' }}
      />
      <LibraryStack.Screen
        name="PostReadResult"
        component={PostReadResultScreen}
        options={{ title: 'Post-Read Extraction' }}
      />
    </LibraryStack.Navigator>
  );
}

function TabNavigator() {
  const stats = useStore((s) => s.stats);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0d0d0d',
          borderTopColor: '#222',
          paddingTop: 8,
          paddingBottom: 8,
          height: 88,
        },
        tabBarActiveTintColor: '#4a9eff',
        tabBarInactiveTintColor: '#aaa',
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Library') {
            iconName = focused ? 'library' : 'library-outline';
          } else if (route.name === 'Review') {
            iconName = focused ? 'flash' : 'flash-outline';
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{ tabBarLabel: 'Today' }}
      />
      <Tab.Screen 
        name="Library" 
        component={LibraryStackNavigator}
        options={{ tabBarLabel: 'Library' }}
      />
      <Tab.Screen
        name="Review"
        component={ReviewScreen}
        options={{
          tabBarLabel: 'Review',
          tabBarBadge: stats?.due_today || undefined,
          tabBarBadgeStyle: { backgroundColor: '#4a9eff' },
        }}
      />
      <Tab.Screen 
        name="Settings" 
        component={SettingsScreen}
        options={{ tabBarLabel: 'Settings' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const { user, isLoading, setUser, setSession, setLoading, fetchBooks, fetchStats, fetchDueCards } = useStore();
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        // First, check if there's a hash with tokens (from magic link)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hash = window.location.hash.substring(1);
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (accessToken && refreshToken) {
            console.log('Found tokens in URL, setting session...');
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });

            if (error) {
              console.error('Error setting session:', error);
            } else if (data.session) {
              console.log('Session set successfully');
              setSession(data.session);
              setUser(data.session.user);
              // Clear the hash from URL
              window.history.replaceState(null, '', window.location.pathname);
              setLoading(false);
              setInitializing(false);
              fetchBooks();
              fetchStats();
              fetchDueCards();
              return;
            }
          }
        }

        // No tokens in URL, check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
        setInitializing(false);

        if (session?.user) {
          fetchBooks();
          fetchStats();
          fetchDueCards();
        }
      } catch (error) {
        console.error('Auth init error:', error);
        setLoading(false);
        setInitializing(false);
      }
    };

    initAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log('Auth state changed:', _event, session?.user?.email);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchBooks();
        fetchStats();
        fetchDueCards();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (initializing || isLoading) {
    return (
      <ErrorBoundary>
        <View style={{ flex: 1, backgroundColor: '#0d0d0d', justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#4a9eff" />
        </View>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <NavigationContainer linking={linking}>
        <StatusBar style="light" />
        <RootStack.Navigator screenOptions={{ headerShown: false }}>
          {!user ? (
            <RootStack.Screen
              name="Auth"
              component={AuthScreen}
            />
          ) : (
            <RootStack.Screen
              name="Main"
              component={TabNavigator}
            />
          )}
        </RootStack.Navigator>
      </NavigationContainer>
    </ErrorBoundary>
  );
}
