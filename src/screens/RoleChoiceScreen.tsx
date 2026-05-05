import React from 'react';
import {
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ComplaintLocation } from '../context/ComplaintContext';

// ─── colour tokens (same palette as HomeScreen) ───────────────────────────────
const C = {
  primary: '#1A56DB',
  primaryDark: '#1240A8',
  primaryLight: '#EEF4FF',
  bg: '#F0F4FA',
  card: '#FFFFFF',
  text: '#0F172A',
  textMid: '#475569',
  textLight: '#94A3B8',
  border: '#E2E8F0',
  student: '#1A56DB',
  studentBg: '#EEF4FF',
  visitor: '#0891B2',
  visitorBg: '#ECFEFF',
  anon: '#D97706',
  anonBg: '#FFFBEB',
  tip: '#7C3AED',
  tipBg: '#F5F3FF',
};

// ─── role option data ─────────────────────────────────────────────────────────
const ROLES = [
  {
    key: 'student',
    icon: '🎓',
    label: 'Continue as Student',
    sub: 'Sign in or register with your student account to submit and track complaints.',
    accent: C.student,
    bg: C.studentBg,
    badge: 'Recommended',
  },
  {
    key: 'visitor',
    icon: '🪪',
    label: 'Continue as Visitor',
    sub: 'Sign in or create a visitor account before sending the complaint.',
    accent: C.visitor,
    bg: C.visitorBg,
    badge: null,
  },
];

export function RoleChoiceScreen({ navigation, route }: any) {
  const location = (route.params?.location || 'unknown') as ComplaintLocation;
  const source = route.params?.source || 'qr-scan';
  const insets = useSafeAreaInsets();

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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" backgroundColor={C.primaryDark} />

      {/* ── CUSTOM HEADER ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Choose Identity</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* ── LOCATION BANNER ────────────────────────────────────────────────── */}
      <View style={styles.locationBanner}>
        <View style={styles.locationBannerInner}>
          <View style={styles.locationIconWrap}>
            <Text style={styles.locationIcon}>📍</Text>
          </View>
          <View style={styles.locationTextWrap}>
            <Text style={styles.locationLabel}>Submitting complaint for</Text>
            <Text style={styles.locationValue} numberOfLines={1}>
              {location}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── HEADING ──────────────────────────────────────────────────────── */}
        <Text style={styles.heading}>How would you like{'\n'}to continue?</Text>
        <Text style={styles.headingSub}>
          Choose the option that best describes you. Your identity affects how your complaint is tracked.
        </Text>

        {/* ── ROLE CARDS ───────────────────────────────────────────────────── */}
        {ROLES.map((r) => (
          <TouchableOpacity
            key={r.key}
            activeOpacity={0.82}
            style={styles.roleCard}
            onPress={() => openAuth(r.key as 'student' | 'visitor')}
          >
            {/* left accent bar */}
            <View style={[styles.roleAccentBar, { backgroundColor: r.accent }]} />

            <View style={[styles.roleIconWrap, { backgroundColor: r.bg }]}>
              <Text style={styles.roleIcon}>{r.icon}</Text>
            </View>

            <View style={styles.roleBody}>
              <View style={styles.roleTitleRow}>
                <Text style={styles.roleLabel}>{r.label}</Text>
                {r.badge && (
                  <View style={[styles.roleBadge, { backgroundColor: r.bg }]}>
                    <Text style={[styles.roleBadgeText, { color: r.accent }]}>{r.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.roleSub}>{r.sub}</Text>
            </View>

            <View style={[styles.roleArrow, { backgroundColor: r.bg }]}>
              <Text style={[styles.roleArrowText, { color: r.accent }]}>›</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── DIVIDER ──────────────────────────────────────────────────────── */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>or</Text>
          <View style={styles.orLine} />
        </View>

        {/* ── ANONYMOUS CARD ───────────────────────────────────────────────── */}
        <TouchableOpacity
          activeOpacity={0.82}
          style={styles.anonCard}
          onPress={openAnonymous}
        >
          <View style={styles.anonTop}>
            <View style={styles.anonIconWrap}>
              <Text style={styles.anonIcon}>🛡️</Text>
            </View>
            <View style={styles.anonTextWrap}>
              <Text style={styles.anonTitle}>Submit Anonymously</Text>
              <Text style={styles.anonSub}>No account needed</Text>
            </View>
            <View style={styles.anonArrow}>
              <Text style={[styles.roleArrowText, { color: C.anon }]}>›</Text>
            </View>
          </View>
          <Text style={styles.anonBody}>
            Your identity stays private. After submission, you'll receive a unique tracking code to follow up on your complaint.
          </Text>
        </TouchableOpacity>

        {/* ── TIP BANNER ───────────────────────────────────────────────────── */}
        <View style={styles.tipBanner}>
          <Text style={styles.tipIcon}>💡</Text>
          <Text style={styles.tipText}>
            Registered users can track <Text style={styles.tipBold}>all complaints</Text> in one dashboard and get direct updates.
          </Text>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
  },

  // header
  header: {
    backgroundColor: C.primaryDark,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 14,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    color: '#fff',
    fontSize: 26,
    lineHeight: 30,
    fontWeight: '300',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '800',
  },

  // location banner
  locationBanner: {
    backgroundColor: C.primary,
    paddingHorizontal: 20,
    paddingBottom: 18,
    paddingTop: 4,
  },
  locationBannerInner: {
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  locationIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  locationIcon: {
    fontSize: 18,
  },
  locationTextWrap: {
    flex: 1,
  },
  locationLabel: {
    color: '#BFDBFE',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  locationValue: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },

  // heading
  heading: {
    color: C.text,
    fontSize: 26,
    fontWeight: '800',
    lineHeight: 34,
    marginBottom: 8,
  },
  headingSub: {
    color: C.textMid,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 24,
  },

  // role cards
  roleCard: {
    backgroundColor: C.card,
    borderRadius: 18,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    paddingRight: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
    borderWidth: 1,
    borderColor: C.border,
  },
  roleAccentBar: {
    width: 4,
    alignSelf: 'stretch',
    borderRadius: 4,
    marginRight: 14,
  },
  roleIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  roleIcon: {
    fontSize: 22,
  },
  roleBody: {
    flex: 1,
  },
  roleTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  roleLabel: {
    color: C.text,
    fontSize: 15,
    fontWeight: '700',
  },
  roleBadge: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  roleSub: {
    color: C.textMid,
    fontSize: 12,
    lineHeight: 18,
  },
  roleArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  roleArrowText: {
    fontSize: 20,
    fontWeight: '700',
    lineHeight: 24,
  },

  // or divider
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
    gap: 10,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  orText: {
    color: C.textLight,
    fontSize: 13,
    fontWeight: '600',
  },

  // anonymous card
  anonCard: {
    backgroundColor: C.anonBg,
    borderRadius: 18,
    padding: 18,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    marginBottom: 20,
    shadowColor: C.anon,
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  anonTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  anonIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: 'rgba(217,119,6,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  anonIcon: {
    fontSize: 22,
  },
  anonTextWrap: {
    flex: 1,
  },
  anonTitle: {
    color: C.anon,
    fontSize: 15,
    fontWeight: '800',
  },
  anonSub: {
    color: '#92400E',
    fontSize: 11,
    marginTop: 2,
    opacity: 0.7,
  },
  anonArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: 'rgba(217,119,6,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  anonBody: {
    color: '#78350F',
    fontSize: 13,
    lineHeight: 19,
  },

  // tip banner
  tipBanner: {
    backgroundColor: C.tipBg,
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    borderWidth: 1,
    borderColor: '#DDD6FE',
  },
  tipIcon: {
    fontSize: 16,
    marginTop: 1,
  },
  tipText: {
    flex: 1,
    color: '#4C1D95',
    fontSize: 13,
    lineHeight: 19,
  },
  tipBold: {
    fontWeight: '800',
  },
});
