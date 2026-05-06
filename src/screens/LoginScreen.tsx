import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';

export function LoginScreen({ navigation, route }: any) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const selectedRole = route.params?.role || 'student';
  const redirectLocation = route.params?.redirectLocation;
  const source = route.params?.source;

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing details', 'Please enter both your email and password.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Sign in failed', result.error || 'Unable to sign in.');
      return;
    }

    if (redirectLocation && redirectLocation !== 'unknown') {
      navigation.replace('ComplaintForm', { location: redirectLocation, source });
      return;
    }

    navigation.replace('Dashboard');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.headingBlock}>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>
            {redirectLocation
              ? `Sign in as ${selectedRole} to continue your complaint for ${redirectLocation}.`
              : 'Sign in to continue to your dashboard.'}
          </Text>
        </View>

        <Text style={styles.fieldLabel}>Email Address</Text>
        <TextInput
          style={styles.input}
          placeholder="your.email@campus.edu"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <Text style={styles.fieldLabel}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="#9CA3AF"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Sign In</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.footerLink}
          onPress={() => navigation.navigate('RoleChoice', { redirectLocation, source })}
        >
          <Text style={styles.secondaryButtonText}>Don&apos;t have an account? Sign Up</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  headingBlock: {
    marginBottom: 26,
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 22,
  },
  fieldLabel: {
    color: '#374151',
    fontWeight: '700',
    marginBottom: 8,
    marginTop: 2,
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
    color: '#111827',
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 22,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  footerLink: {
    alignItems: 'center',
  },
  secondaryButton: {
    marginTop: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
