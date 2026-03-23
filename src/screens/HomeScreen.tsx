import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ROLE_LABELS } from '../constants/complaints';
import { useAuth } from '../context/AuthContext';

export function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.heroCard}>
        <View style={styles.heroIconWrap}>
          <View style={styles.heroIconInner}>
            <Text style={styles.heroIcon}>💬</Text>
          </View>
        </View>
        <Text style={styles.title}>Campus Voice</Text>
        <Text style={styles.subtitle}>
          Help us improve the campus together with fast QR-based complaint submission.
        </Text>

        {user ? (
          <View style={styles.sessionCard}>
            <Text style={styles.sessionTitle}>Signed in as {user.fullName}</Text>
            <Text style={styles.sessionMeta}>
              {ROLE_LABELS[user.role]} account • {user.email}
            </Text>
          </View>
        ) : null}
      </View>

      <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.navigate('QRScanner')}>
        <View style={styles.primaryIconBox}>
          <Text style={styles.primaryIcon}>⌁</Text>
        </View>
        <View style={styles.primaryTextWrap}>
          <Text style={styles.primaryButtonText}>Scan QR Code</Text>
          <Text style={styles.primaryButtonSubtext}>Quick complaint submission</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() =>
          navigation.navigate(user ? 'ComplaintForm' : 'RoleChoice', {
            location: 'unknown',
            source: 'manual-entry',
          })
        }
      >
        <View style={styles.secondaryIconBox}>
          <Text style={styles.secondaryIcon}>📝</Text>
        </View>
        <View style={styles.secondaryTextWrap}>
          <Text style={styles.secondaryButtonText}>Submit Complaint</Text>
          <Text style={styles.secondaryButtonSubtext}>Manual entry</Text>
        </View>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('TrackComplaint')}
      >
        <View style={styles.secondaryIconBox}>
          <Text style={styles.secondaryIcon}>🔎</Text>
        </View>
        <View style={styles.secondaryTextWrap}>
          <Text style={styles.secondaryButtonText}>Track Complaint</Text>
          <Text style={styles.secondaryButtonSubtext}>Check status anonymously</Text>
        </View>
      </TouchableOpacity>

      {user ? (
        <>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.secondaryButtonText}>Open My Dashboard</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.logoutButton}
            onPress={async () => {
              await logout();
              navigation.replace('Home');
            }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </TouchableOpacity>
        </>
      ) : (
        <View style={styles.infoPanel}>
          <Text style={styles.infoTitle}>Expected mobile flow</Text>
          <Text style={styles.infoText}>1. Scan the QR fixed at the campus location.</Text>
          <Text style={styles.infoText}>2. Choose whether you are a student, visitor, or anonymous reporter.</Text>
          <Text style={styles.infoText}>3. If you already have an account, sign in. If not, register first.</Text>
          <Text style={styles.infoText}>4. Submit the complaint with the scanned location already filled in.</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#F4F7FB',
  },
  heroCard: {
    backgroundColor: '#2563EB',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 26,
    marginBottom: 20,
    alignItems: 'center',
  },
  heroIconWrap: {
    marginBottom: 14,
  },
  heroIconInner: {
    backgroundColor: '#FFFFFF',
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroIcon: {
    fontSize: 34,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: '#DBEAFE',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  sessionCard: {
    marginTop: 18,
    width: '100%',
    padding: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  sessionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '700',
  },
  sessionMeta: {
    color: '#B8D9FF',
    marginTop: 4,
  },
  primaryButton: {
    backgroundColor: '#2563EB',
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#2563EB',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  primaryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  primaryIcon: {
    color: '#FFFFFF',
    fontSize: 26,
  },
  primaryTextWrap: {
    flex: 1,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonSubtext: {
    color: '#DBEAFE',
    marginTop: 2,
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  secondaryIconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  secondaryIcon: {
    fontSize: 22,
  },
  secondaryTextWrap: {
    flex: 1,
  },
  secondaryButtonText: {
    color: '#15324B',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButtonSubtext: {
    color: '#6B7280',
    marginTop: 2,
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: '#FFE7E4',
    borderRadius: 18,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  logoutButtonText: {
    color: '#B42318',
    fontWeight: '800',
  },
  infoPanel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginTop: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#15324B',
    marginBottom: 8,
  },
  infoText: {
    color: '#486581',
    lineHeight: 22,
    marginBottom: 6,
  },
});
