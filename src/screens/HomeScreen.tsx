import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ROLE_LABELS } from '../constants/complaints';
import { useAuth } from '../context/AuthContext';

const { width } = Dimensions.get('window');

// ─── colour tokens ────────────────────────────────────────────────────────────
const C = {
  primary: '#1A56DB',
  primaryDark: '#1240A8',
  primaryLight: '#EEF4FF',
  accent: '#F59E0B',
  bg: '#F0F4FA',
  card: '#FFFFFF',
  text: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  success: '#10B981',
  border: '#E2E8F0',
};

// ─── action card data ─────────────────────────────────────────────────────────
const ACTIONS = [
  {
    key: 'qr',
    icon: '⚡',
    label: 'Scan QR Code',
    sub: 'Fastest way to submit',
    primary: true,
    route: 'QRScanner',
  },
  {
    key: 'form',
    icon: '📝',
    label: 'Submit Complaint',
    sub: 'Fill in manually',
    primary: false,
    route: null, // handled separately
  },
  {
    key: 'track',
    icon: '🔍',
    label: 'Track Complaint',
    sub: 'Check your status',
    primary: false,
    route: 'TrackComplaint',
  },
];

export function HomeScreen({ navigation }: any) {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  // Staff / office / admin should go straight to their dashboard
  const isWorkRole = user?.role === 'staff' || user?.role === 'office' || user?.role === 'admin';

  const handleAction = (key: string) => {
    if (key === 'qr') navigation.navigate('QRScanner');
    else if (key === 'track') navigation.navigate('TrackComplaint');
    else
      navigation.navigate(user ? 'ComplaintForm' : 'RoleChoice', {
        location: 'unknown',
        source: 'manual-entry',
      });
  };

  // Role-specific hero stats
  const heroStats = isWorkRole
    ? [
        { value: '📋', label: 'Manage' },
        { value: '✅', label: 'Resolve' },
        { value: '📊', label: 'Track' },
      ]
    : [
        { value: 'Fast', label: 'QR Submit' },
        { value: '24h', label: 'Avg. Response' },
        { value: '100%', label: 'Anonymous' },
      ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <View style={styles.headerLeft}>
          <Image
            source={require('../../assets/log.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
          <View>
            <Text style={styles.headerTitle}>Campus Voice</Text>
            <Text style={styles.headerSub}>Complaint Management</Text>
          </View>
        </View>
        {user ? (
          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.avatarText}>
              {user.fullName?.charAt(0).toUpperCase() ?? 'U'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.signInChip}
            onPress={() => navigation.navigate('RoleChoice')}
          >
            <Text style={styles.signInChipText}>Sign In</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── HERO BANNER ────────────────────────────────────────────────────── */}
      <View style={styles.hero}>
        <View style={styles.heroCircle1} />
        <View style={styles.heroCircle2} />

        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>🏫  University Portal</Text>
        </View>

        <Text style={styles.heroHeading}>
          {user ? `Welcome back,\n${user.fullName?.split(' ')[0]}` : 'Your Voice\nMatters'}
        </Text>
        <Text style={styles.heroBody}>
          {user
            ? `Signed in as ${ROLE_LABELS[user.role]}`
            : 'Submit, track and resolve campus issues — fast and transparently.'}
        </Text>

        <View style={styles.statsRow}>
          {heroStats.map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={styles.statValue}>{s.value}</Text>
              <Text style={styles.statLabel}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── STAFF / OFFICE / ADMIN VIEW ────────────────────────────────────── */}
      {isWorkRole && (
        <>
          <Text style={styles.sectionLabel}>Your workspace</Text>

          <TouchableOpacity
            style={[styles.card, styles.cardPrimary]}
            activeOpacity={0.82}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <View style={[styles.cardIconWrap, styles.cardIconWrapPrimary]}>
              <Text style={styles.cardIcon}>📊</Text>
            </View>
            <View style={styles.cardBody}>
              <Text style={[styles.cardLabel, styles.cardLabelPrimary]}>Open Dashboard</Text>
              <Text style={[styles.cardSub, styles.cardSubPrimary]}>
                {user?.role === 'staff'
                  ? 'View and manage your assigned complaints'
                  : 'Review, assign and resolve complaints'}
              </Text>
            </View>
            <View style={[styles.cardArrow, styles.cardArrowPrimary]}>
              <Text style={[styles.cardArrowText, styles.cardArrowTextPrimary]}>›</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={async () => {
              await logout();
              navigation.replace('Home');
            }}
          >
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        </>
      )}

      {/* ── STUDENT / VISITOR / GUEST VIEW ─────────────────────────────────── */}
      {!isWorkRole && (
        <>
          <Text style={styles.sectionLabel}>What would you like to do?</Text>

          {ACTIONS.map((a) => (
            <TouchableOpacity
              key={a.key}
              activeOpacity={0.82}
              style={[styles.card, a.primary && styles.cardPrimary]}
              onPress={() => handleAction(a.key)}
            >
              <View style={[styles.cardIconWrap, a.primary && styles.cardIconWrapPrimary]}>
                <Text style={styles.cardIcon}>{a.icon}</Text>
              </View>
              <View style={styles.cardBody}>
                <Text style={[styles.cardLabel, a.primary && styles.cardLabelPrimary]}>
                  {a.label}
                </Text>
                <Text style={[styles.cardSub, a.primary && styles.cardSubPrimary]}>{a.sub}</Text>
              </View>
              <View style={[styles.cardArrow, a.primary && styles.cardArrowPrimary]}>
                <Text style={[styles.cardArrowText, a.primary && styles.cardArrowTextPrimary]}>›</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Logged-in student/visitor extras */}
          {user && (
            <>
              <View style={styles.divider} />
              <TouchableOpacity
                style={styles.dashboardBtn}
                onPress={() => navigation.navigate('Dashboard')}
              >
                <Text style={styles.dashboardBtnIcon}>📊</Text>
                <Text style={styles.dashboardBtnText}>Open My Dashboard</Text>
                <Text style={styles.cardArrowText}>›</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={async () => {
                  await logout();
                  navigation.replace('Home');
                }}
              >
                <Text style={styles.logoutBtnText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          )}

          {/* Guest footer */}
          {!user && (
            <View style={styles.guestFooter}>
              <View style={styles.guestFooterInner}>
                <Text style={styles.guestFooterTitle}>Have an account?</Text>
                <Text style={styles.guestFooterSub}>
                  Sign in to track your complaints and get faster responses.
                </Text>
                <TouchableOpacity
                  style={styles.guestFooterBtn}
                  onPress={() => navigation.navigate('RoleChoice')}
                >
                  <Text style={styles.guestFooterBtnText}>Sign In / Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </>
      )}

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },
  scroll: {
    flexGrow: 1,
  },

  // header
  header: {
    backgroundColor: C.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 14,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerLogo: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#fff',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  headerSub: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 1,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: C.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
  },
  signInChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  signInChipText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
  },

  // hero
  hero: {
    backgroundColor: C.primary,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
    overflow: 'hidden',
  },
  heroCircle1: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(255,255,255,0.06)',
    top: -60,
    right: -60,
  },
  heroCircle2: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: 'rgba(255,255,255,0.05)',
    bottom: -40,
    left: -30,
  },
  heroBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  heroBadgeText: {
    color: '#E0EEFF',
    fontSize: 12,
    fontWeight: '600',
  },
  heroHeading: {
    color: '#fff',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 38,
    marginBottom: 10,
  },
  heroBody: {
    color: '#BFDBFE',
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 16,
    paddingVertical: 14,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '800',
  },
  statLabel: {
    color: '#93C5FD',
    fontSize: 11,
    marginTop: 2,
  },

  // section label
  sectionLabel: {
    color: C.textMid,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 24,
    marginBottom: 12,
    marginHorizontal: 20,
  },

  // action cards
  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  cardPrimary: {
    backgroundColor: C.primary,
    borderColor: C.primary,
    shadowColor: C.primary,
    shadowOpacity: 0.35,
    elevation: 6,
  },
  cardIconWrap: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  cardIconWrapPrimary: {
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  cardIcon: {
    fontSize: 22,
  },
  cardBody: {
    flex: 1,
  },
  cardLabel: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
  },
  cardLabelPrimary: {
    color: '#fff',
  },
  cardSub: {
    color: C.textLight,
    fontSize: 12,
    marginTop: 2,
  },
  cardSubPrimary: {
    color: '#BFDBFE',
  },
  cardArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardArrowPrimary: {
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  cardArrowText: {
    color: C.primary,
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },
  cardArrowTextPrimary: {
    color: '#fff',
  },

  // divider
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginHorizontal: 16,
    marginVertical: 16,
  },

  // dashboard button
  dashboardBtn: {
    backgroundColor: C.card,
    borderRadius: 18,
    marginHorizontal: 16,
    marginBottom: 10,
    paddingVertical: 18,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  dashboardBtnIcon: {
    fontSize: 22,
    marginRight: 14,
  },
  dashboardBtnText: {
    flex: 1,
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
  },

  // logout
  logoutBtn: {
    marginHorizontal: 16,
    marginTop: 4,
    paddingVertical: 15,
    borderRadius: 18,
    backgroundColor: C.dangerBg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutBtnText: {
    color: C.danger,
    fontWeight: '700',
    fontSize: 15,
  },

  // guest footer
  guestFooter: {
    marginHorizontal: 16,
    marginTop: 20,
  },
  guestFooterInner: {
    backgroundColor: C.card,
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  guestFooterTitle: {
    color: C.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  guestFooterSub: {
    color: C.textMid,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 18,
  },
  guestFooterBtn: {
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 32,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  guestFooterBtnText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 14,
  },
});
