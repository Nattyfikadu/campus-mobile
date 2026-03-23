import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAuth, UserRole } from '../context/AuthContext';

type RegisterRole = Extract<UserRole, 'student' | 'visitor' | 'staff'>;

const initialFormState = {
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  studentId: '',
  staffId: '',
  phone: '',
  department: '',
  faculty: '',
  position: '',
};

export function RegisterScreen({ navigation, route }: any) {
  const requestedRole = (route.params?.role || 'student') as RegisterRole;
  const redirectLocation = route.params?.redirectLocation;
  const source = route.params?.source;
  const [role, setRole] = useState<RegisterRole>(requestedRole);
  const [formData, setFormData] = useState(initialFormState);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const updateField = (field: keyof typeof initialFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const submit = async () => {
    if (!formData.fullName || !formData.email || !formData.password) {
      Alert.alert('Missing details', 'Please fill in the required fields.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Password too short', 'Password must be at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Password mismatch', 'Confirm password must match the password.');
      return;
    }

    if (role === 'student' && !formData.studentId) {
      Alert.alert('Missing student ID', 'Student ID is required for student registration.');
      return;
    }

    if (role === 'staff' && !formData.staffId) {
      Alert.alert('Missing staff ID', 'Staff ID is required for staff registration.');
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: formData.fullName,
      email: formData.email,
      password: formData.password,
      role,
      studentId: role === 'student' ? formData.studentId : undefined,
      staffId: role === 'staff' ? formData.staffId : undefined,
      phone: formData.phone || undefined,
      department: formData.department || undefined,
      faculty: formData.faculty || undefined,
      position: role === 'staff' ? formData.position || undefined : undefined,
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Registration failed', result.error || 'Unable to create account.');
      return;
    }

    if (redirectLocation) {
      navigation.replace('ComplaintForm', { location: redirectLocation, source });
      return;
    }

    navigation.replace('Dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        {redirectLocation
          ? `Register first, then continue to submit the complaint for ${redirectLocation}.`
          : 'Create your mobile account for campus complaint submission and tracking.'}
      </Text>

      <View style={styles.roleRow}>
        {(['student', 'visitor', 'staff'] as RegisterRole[]).map((option, index) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.roleChip,
              role === option && styles.roleChipActive,
              index === 2 && styles.lastRoleChip,
            ]}
            onPress={() => setRole(option)}
          >
            <Text style={[styles.roleChipText, role === option && styles.roleChipTextActive]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TextInput style={styles.input} placeholder="Full name" value={formData.fullName} onChangeText={(value) => updateField('fullName', value)} />
      <TextInput
        style={styles.input}
        placeholder="Email address"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(value) => updateField('email', value)}
      />

      {role === 'student' ? (
        <TextInput
          style={styles.input}
          placeholder="Student ID"
          value={formData.studentId}
          onChangeText={(value) => updateField('studentId', value)}
        />
      ) : null}

      {role === 'staff' ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Staff ID"
            value={formData.staffId}
            onChangeText={(value) => updateField('staffId', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Position or job title"
            value={formData.position}
            onChangeText={(value) => updateField('position', value)}
          />
        </>
      ) : null}

      {(role === 'student' || role === 'staff') ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="Department"
            value={formData.department}
            onChangeText={(value) => updateField('department', value)}
          />
          <TextInput
            style={styles.input}
            placeholder="Faculty"
            value={formData.faculty}
            onChangeText={(value) => updateField('faculty', value)}
          />
        </>
      ) : null}

      <TextInput
        style={styles.input}
        placeholder="Phone number (optional)"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(value) => updateField('phone', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={formData.password}
        onChangeText={(value) => updateField('password', value)}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        secureTextEntry
        value={formData.confirmPassword}
        onChangeText={(value) => updateField('confirmPassword', value)}
      />

      <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.primaryButtonText}>Register</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Login', { role, redirectLocation, source })}
      >
        <Text style={styles.secondaryButtonText}>Already have an account? Sign in</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
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
    marginBottom: 20,
  },
  roleRow: {
    flexDirection: 'row',
    marginBottom: 18,
  },
  roleChip: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 16,
    alignItems: 'center',
  },
  lastRoleChip: {
    marginRight: 0,
  },
  roleChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  roleChipText: {
    color: '#111827',
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  roleChipTextActive: {
    color: '#FFFFFF',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 14,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  secondaryButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#2563EB',
    fontWeight: '700',
  },
});
