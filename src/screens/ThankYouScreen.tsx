import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export function ThankYouScreen({ navigation, route }: any) {
  const trackingCode = route.params?.trackingCode;
  const isAnonymous = !!route.params?.isAnonymous;

  return (
    <View style={styles.container}>
      <View style={styles.successWrap}>
        <View style={styles.glow} />
        <View style={styles.successIconCircle}>
          <Text style={styles.successIcon}>✓</Text>
        </View>
      </View>

      <Text style={styles.title}>Thank You!</Text>
      <Text style={styles.message}>
        Thank you for helping improve the campus. Your complaint has been submitted successfully.
      </Text>

      <View style={styles.card}>
        {trackingCode ? (
          <View style={styles.codeCard}>
            <Text style={styles.codeLabel}>Tracking code</Text>
            <Text style={styles.codeValue}>{trackingCode}</Text>
            <Text style={styles.codeHelp}>Keep this code so you can check complaint status later.</Text>
          </View>
        ) : null}

        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>What happens next?</Text>
          <Text style={styles.infoText}>1. Your complaint will be reviewed within 24-48 hours.</Text>
          <Text style={styles.infoText}>2. It can be approved, assigned, and resolved by the right office.</Text>
          <Text style={styles.infoText}>3. You can keep checking progress from the app.</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.replace(isAnonymous ? 'TrackComplaint' : 'Dashboard')}
        >
          <Text style={styles.primaryButtonText}>
            {isAnonymous ? 'Track Complaint' : 'Open Dashboard'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.secondaryButtonText}>Back Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  successWrap: {
    alignItems: 'center',
    marginBottom: 18,
  },
  glow: {
    position: 'absolute',
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: '#DCFCE7',
    opacity: 0.8,
  },
  successIconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIcon: {
    color: '#FFFFFF',
    fontSize: 42,
    fontWeight: '800',
  },
  card: {
    width: '100%',
    backgroundColor: 'transparent',
    borderRadius: 24,
    padding: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 20,
  },
  codeCard: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    padding: 18,
    marginTop: 20,
    marginBottom: 12,
  },
  codeLabel: {
    color: '#DBEAFE',
    marginBottom: 4,
  },
  codeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  codeHelp: {
    marginTop: 8,
    color: '#DBEAFE',
    lineHeight: 20,
  },
  infoCard: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 18,
    padding: 18,
    marginBottom: 8,
  },
  infoTitle: {
    fontWeight: '800',
    color: '#111827',
    marginBottom: 8,
  },
  infoText: {
    color: '#374151',
    lineHeight: 20,
    marginBottom: 6,
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
    fontWeight: '800',
  },
  secondaryButton: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  secondaryButtonText: {
    color: '#374151',
    fontWeight: '700',
  },
});
