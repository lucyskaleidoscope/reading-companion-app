import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { signInWithMagicLink } from '../lib/supabase';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSignIn = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    const { error } = await signInWithMagicLink(email.trim().toLowerCase());
    setIsLoading(false);

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setIsSent(true);
    }
  };

  if (isSent) {
    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>✉️</Text>
          </View>
          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We sent a magic link to{'\n'}
            <Text style={styles.email}>{email}</Text>
          </Text>
          <Text style={styles.hint}>
            Click the link in the email to sign in.{'\n'}
            The link expires in 1 hour.
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setIsSent(false)}
          >
            <Text style={styles.secondaryButtonText}>Use a different email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.logo}>📚</Text>
          <Text style={styles.title}>Reading Companion</Text>
          <Text style={styles.subtitle}>
            Turn your reading into durable knowledge
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor="#666"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
          />

          <TouchableOpacity
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>Send Magic Link</Text>
            )}
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>
          No password required. We'll send you a{'\n'}
          secure link to sign in instantly.
        </Text>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  // Tech-Education Theme
  container: {
    flex: 1,
    backgroundColor: '#F8F1E9',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 56,
  },
  logo: {
    fontSize: 72,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#2D2D2D',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 17,
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 26,
  },
  form: {
    marginBottom: 40,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5A5A5A',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 2,
    borderColor: '#E8E0D4',
    borderRadius: 8,
    padding: 18,
    fontSize: 17,
    color: '#2D2D2D',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#D4AF37',
    borderRadius: 6,
    padding: 18,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#F8F1E9',
  },
  footer: {
    fontSize: 15,
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 28,
  },
  icon: {
    fontSize: 72,
  },
  email: {
    color: '#1E3A8A',
    fontWeight: '600',
  },
  hint: {
    fontSize: 15,
    color: '#5A5A5A',
    textAlign: 'center',
    lineHeight: 24,
    marginTop: 20,
    marginBottom: 40,
  },
  secondaryButton: {
    padding: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 15,
    color: '#1E3A8A',
    fontWeight: '500',
  },
});
