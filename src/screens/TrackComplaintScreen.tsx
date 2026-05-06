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
import { STATUS_LABELS } from '../constants/complaints';
import { ComplaintStatus, useComplaints } from '../context/ComplaintContext';

export function TrackComplaintScreen() {
  const { trackComplaint } = useComplaints();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    title?: string;
    trackingCode?: string;
    status?: ComplaintStatus;
    rejectionReason?: string;
  } | null>(null);

  const handleTrack = async () => {
    if (!code.trim()) {
      Alert.alert('Missing code', 'Enter the complaint tracking code first.');
      return;
    }

    setLoading(true);
    const response = await trackComplaint(code.trim());
    setLoading(false);

    if (!response.success) {
      setResult(null);
      Alert.alert('Tracking failed', response.error || 'Unable to find that complaint.');
      return;
    }

    setResult(response.complaint || null);
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Text style={styles.iconText}>🔎</Text>
      </View>
      <Text style={styles.title}>Track Your Complaint</Text>
      <Text style={styles.subtitle}>
        Enter your tracking code to check the current complaint status.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="CMP-12345"
        placeholderTextColor="#9CA3AF"
        autoCapitalize="characters"
        value={code}
        onChangeText={setCode}
      />

      <TouchableOpacity style={styles.button} onPress={handleTrack} disabled={loading}>
        {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.buttonText}>Check Status</Text>}
      </TouchableOpacity>

      {result ? (
        <View style={styles.resultCard}>
          <Text style={styles.resultTitle}>{result.title}</Text>
          <Text style={styles.resultText}>Code: {result.trackingCode}</Text>
          <Text style={styles.resultText}>
            Status: {result.status ? STATUS_LABELS[result.status] || result.status : 'Unknown'}
          </Text>
          {result.rejectionReason ? (
            <Text style={styles.rejectionText}>Rejection reason: {result.rejectionReason}</Text>
          ) : null}
        </View>
      ) : null}

      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>Where to find your tracking code?</Text>
        <Text style={styles.infoText}>Check the confirmation screen right after submitting a complaint.</Text>
        <Text style={styles.infoText}>If contact details were provided, it may also be shared in follow-up communication.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    alignSelf: 'center',
    backgroundColor: '#EFF6FF',
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  iconText: {
    fontSize: 34,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    color: '#6B7280',
    lineHeight: 22,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 15,
    marginBottom: 14,
    textAlign: 'center',
    fontSize: 18,
    letterSpacing: 1,
    color: '#111827',
  },
  button: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  resultCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  resultTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15324B',
    marginBottom: 8,
  },
  resultText: {
    color: '#486581',
    marginBottom: 6,
  },
  rejectionText: {
    color: '#B42318',
    fontWeight: '700',
    marginTop: 8,
  },
  infoCard: {
    marginTop: 20,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    padding: 18,
  },
  infoTitle: {
    color: '#111827',
    fontWeight: '800',
    marginBottom: 8,
  },
  infoText: {
    color: '#374151',
    lineHeight: 20,
    marginBottom: 6,
  },
});
