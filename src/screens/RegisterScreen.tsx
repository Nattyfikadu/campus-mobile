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

const ALL_LOCATIONS = [
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'registrar', label: 'Registrar' },
  { value: 'hr-office', label: 'HR Office' },
  { value: 'faculty', label: 'Faculty' },
  { value: 'library', label: 'Library' },
];

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

// Basic client-side student ID validation (mirrors server logic)
// Format: 7 digits, first 2 = EC year, next 2 = month (01-12)
function validateStudentId(id: string): string | null {
  if (!/^\d{7}$/.test(id)) return 'Student ID must be exactly 7 digits (e.g. 1205001).';
  const month = parseInt(id.substring(2, 4), 10);
  if (month < 1 || month > 12) return 'Invalid month in student ID (digits 3-4 must be 01–12).';
  const joinYear = 2000 + parseInt(id.substring(0, 2), 10);
  const studyDuration = 2018 - joinYear;
  if (studyDuration < 0) return 'Student ID has a future join year.';
  if (studyDuration > 6) return 'Student ID expired — only current students (within 6 years) can register.';
  return null;
}

export function RegisterScreen({ navigation, route }: any) {
  const requestedRole = (route.params?.role || 'student') as RegisterRole;
  const redirectLocation = route.params?.redirectLocation;
  const source = route.params?.source;
  const [role, setRole] = useState<RegisterRole>(requestedRole);
  const [formData, setFormData] = useState(initialFormState);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  const updateField = (field: keyof typeof initialFormState, value: string) => {
    setFormData((current) => ({ ...current, [field]: value }));
  };

  const toggleLocation = (value: string) => {
    setSelectedLocations((current) =>
      current.includes(value) ? current.filter((l) => l !== value) : [...current, value]
    );
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
    if (role === 'student') {
      if (!formData.studentId) {
        Alert.alert('Missing student ID', 'Student ID is required for student registration.');
        return;
      }
      const idError = validateStudentId(formData.studentId);
      if (idError) {
        Alert.alert('Invalid student ID', idError);
        return;
      }
    }
    if (role === 'staff') {
      if (!formData.staffId) {
        Alert.alert('Missing staff ID', 'Staff ID is required for staff registration.');
        return;
      }
      if (selectedLocations.length === 0) {
        Alert.alert('Select locations', 'Staff must select at least one working location.');
        return;
      }
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
      staffLocations: role === 'staff' ? selectedLocations : undefined,
    });
    setLoading(false);

    if (!result.success) {
      Alert.alert('Registration failed', result.error || 'Unable to create account.');
      return;
    }

    // Staff accounts need office/admin approval before they can log in
    if (result.requiresApproval) {
      const details = [
        `Name: ${formData.fullName}`,
        `Email: ${formData.email}`,
        `Staff ID: ${formData.staffId}`,
        formData.department ? `Department: ${formData.department}` : null,
        formData.faculty ? `Faculty: ${formData.faculty}` : null,
        formData.position ? `Position: ${formData.position}` : null,
        `Locations: ${selectedLocations.join(', ')}`,
      ]
        .filter(Boolean)
        .join('\n');

      Alert.alert(
        'Registration Submitted ✅',
        `Your staff account is pending office approval.\n\nSubmitted details:\n${details}\n\nYou will be able to sign in once approved.`,
        [{ text: 'OK', onPress: () => navigation.navigate('Login', { role, redirectLocation, source }) }]
      );
      return;
    }

    if (redirectLocation && redirectLocation !== 'unknown') {
      navigation.replace('ComplaintForm', { location: redirectLocation, source });
      return;
    }

    navigation.replace('Dashboard');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>
        {redirectLocation && redirectLocation !== 'unknown'
          ? `Register first, then continue to submit the complaint for ${redirectLocation}.`
          : 'Create your campus account for complaint submission and tracking.'}
      </Text>

      {/* Role selector */}
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

      {/* Common fields */}
      <TextInput
        style={styles.input}
        placeholder="Full name"
        placeholderTextColor="#9CA3AF"
        value={formData.fullName}
        onChangeText={(v) => updateField('fullName', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Email address"
        placeholderTextColor="#9CA3AF"
        keyboardType="email-address"
        autoCapitalize="none"
        value={formData.email}
        onChangeText={(v) => updateField('email', v)}
      />

      {/* Student-specific */}
      {role === 'student' && (
        <TextInput
          style={styles.input}
          placeholder="Student ID (7 digits, e.g. 1205001)"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          value={formData.studentId}
          onChangeText={(v) => updateField('studentId', v)}
        />
      )}

      {/* Staff-specific */}
      {role === 'staff' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Staff ID"
            placeholderTextColor="#9CA3AF"
            value={formData.staffId}
            onChangeText={(v) => updateField('staffId', v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Position / job title"
            placeholderTextColor="#9CA3AF"
            value={formData.position}
            onChangeText={(v) => updateField('position', v)}
          />
          <Text style={styles.label}>Working Locations (select all that apply)</Text>
          <View style={styles.locationGrid}>
            {ALL_LOCATIONS.map((loc) => {
              const active = selectedLocations.includes(loc.value);
              return (
                <TouchableOpacity
                  key={loc.value}
                  style={[styles.locationChip, active && styles.locationChipActive]}
                  onPress={() => toggleLocation(loc.value)}
                >
                  <Text style={[styles.locationChipText, active && styles.locationChipTextActive]}>
                    {loc.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {/* Department / Faculty for student & staff */}
      {(role === 'student' || role === 'staff') && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Department"
            placeholderTextColor="#9CA3AF"
            value={formData.department}
            onChangeText={(v) => updateField('department', v)}
          />
          <TextInput
            style={styles.input}
            placeholder="Faculty"
            placeholderTextColor="#9CA3AF"
            value={formData.faculty}
            onChangeText={(v) => updateField('faculty', v)}
          />
        </>
      )}

      <TextInput
        style={styles.input}
        placeholder="Phone number (optional)"
        placeholderTextColor="#9CA3AF"
        keyboardType="phone-pad"
        value={formData.phone}
        onChangeText={(v) => updateField('phone', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={formData.password}
        onChangeText={(v) => updateField('password', v)}
      />
      <TextInput
        style={styles.input}
        placeholder="Confirm password"
        placeholderTextColor="#9CA3AF"
        secureTextEntry
        value={formData.confirmPassword}
        onChangeText={(v) => updateField('confirmPassword', v)}
      />

      {role === 'staff' && (
        <View style={styles.approvalNotice}>
          <Text style={styles.approvalNoticeText}>
            ⏳ Staff accounts require office approval before you can sign in.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.primaryButton} onPress={submit} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Register</Text>
        )}
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
  lastRoleChip: { marginRight: 0 },
  roleChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  roleChipText: { color: '#111827', fontWeight: '700', textTransform: 'capitalize' },
  roleChipTextActive: { color: '#FFFFFF' },
  label: {
    color: '#374151',
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 4,
  },
  locationGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  locationChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
  },
  locationChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  locationChipText: { color: '#374151', fontWeight: '600', fontSize: 13 },
  locationChipTextActive: { color: '#FFFFFF' },
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
  approvalNotice: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
  },
  approvalNoticeText: {
    color: '#92400E',
    fontSize: 13,
    lineHeight: 19,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  secondaryButton: { paddingVertical: 16, alignItems: 'center' },
  secondaryButtonText: { color: '#2563EB', fontWeight: '700' },
});
