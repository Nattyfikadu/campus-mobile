import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ComplaintLocation } from '../context/ComplaintContext';

export function RoleChoiceScreen({ navigation, route }: any) {
  const location = (route.params?.location || 'unknown') as ComplaintLocation;
  const source = route.params?.source || 'qr-scan';

  const openAuth = (role: 'student' | 'visitor') => {
    navigation.navigate('Login', { role, redirectLocation: location, source });
  };

  const openAnonymous = () => {
    navigation.navigate('ComplaintForm', {
      location,
      mode: 'anonymous',
      role: 'visitor',
      source,
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerCard}>
        <Text style={styles.title}>Choose Your Identity</Text>
        <Text style={styles.subtitle}>
          Select how you would like to submit this complaint for <Text style={styles.bold}>{location}</Text>.
        </Text>
      </View>

      <TouchableOpacity style={styles.optionCard} onPress={() => openAuth('student')}>
        <Text style={styles.optionTitle}>Continue as Student</Text>
        <Text style={styles.optionText}>
          Existing students can sign in and submit immediately. New students can register first and continue to the form.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.optionCard} onPress={() => openAuth('visitor')}>
        <Text style={styles.optionTitle}>Continue as Visitor</Text>
        <Text style={styles.optionText}>
          Visitors can sign in with an existing account or create a visitor account before sending the complaint.
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.anonymousCard} onPress={openAnonymous}>
        <Text style={styles.anonymousTitle}>Submit Anonymously</Text>
        <Text style={styles.anonymousText}>
          Use this when the person does not want to sign in. The system will return a tracking code after submission.
        </Text>
      </TouchableOpacity>
      <View style={styles.tipCard}>
        <Text style={styles.tipText}>
          Registered users can track all of their complaints in one dashboard.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F4F7FB',
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 22,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    color: '#111827',
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 10,
    color: '#6B7280',
    lineHeight: 22,
    textAlign: 'center',
  },
  bold: {
    fontWeight: '800',
    color: '#2563EB',
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#D7E1ED',
  },
  optionTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15324B',
    marginBottom: 6,
  },
  optionText: {
    color: '#486581',
    lineHeight: 22,
  },
  anonymousCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  anonymousTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#9A3412',
    marginBottom: 6,
  },
  anonymousText: {
    color: '#6B7280',
    lineHeight: 22,
  },
  tipCard: {
    marginTop: 18,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: 16,
    padding: 16,
  },
  tipText: {
    textAlign: 'center',
    color: '#374151',
    lineHeight: 20,
    fontSize: 13,
  },
});
