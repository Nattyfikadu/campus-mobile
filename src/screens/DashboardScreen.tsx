import React, { useEffect, useState } from 'react';
import {
  Alert,
  Linking,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getIssueTypeLabel, getLocationLabel, ROLE_LABELS, STATUS_LABELS } from '../constants/complaints';
import { useAuth, User } from '../context/AuthContext';
import { Complaint, ComplaintStatus, useComplaints } from '../context/ComplaintContext';

const dashboardTabs: ComplaintStatus[] = ['pending', 'approved', 'in-progress', 'resolved', 'rejected'];

export function DashboardScreen({ navigation }: any) {
  const { user, logout, getAllStaff, getPendingStaff, approveStaff, rejectStaff } = useAuth();
  const insets = useSafeAreaInsets();
  const {
    complaints,
    isLoading,
    reloadComplaints,
    getComplaintsByAssignee,
    getComplaintsByUser,
    updateComplaintStatus,
    deleteComplaint,
  } = useComplaints();

  const [activeTab, setActiveTab] = useState<ComplaintStatus>('pending');
  const [selectedStaffByComplaint, setSelectedStaffByComplaint] = useState<Record<string, string>>({});
  const [rejectionReasonByComplaint, setRejectionReasonByComplaint] = useState<Record<string, string>>({});
  const [staffDirectory, setStaffDirectory] = useState<Record<string, { id: string; name: string }[]>>({});
  const [selectedSupportStaffByComplaint, setSelectedSupportStaffByComplaint] = useState<Record<string, string>>({});
  const [showSupportPickerFor, setShowSupportPickerFor] = useState<string | null>(null);

  // Pending staff approval state (office/admin only)
  const [pendingStaff, setPendingStaff] = useState<User[]>([]);
  const [pendingStaffLoading, setPendingStaffLoading] = useState(false);
  const [staffRejectReasons, setStaffRejectReasons] = useState<Record<string, string>>({});
  const [showPendingStaff, setShowPendingStaff] = useState(false);

  // Escalation state (staff "I Can't Resolve This")
  const [escalationComplaintId, setEscalationComplaintId] = useState<string | null>(null);
  const [escalationType, setEscalationType] = useState<'unavailable' | 'beyond-skill'>('unavailable');
  const [escalationReason, setEscalationReason] = useState('');

  // Resolution state (resolve with description)
  const [resolveComplaintId, setResolveComplaintId] = useState<string | null>(null);
  const [resolutionDescription, setResolutionDescription] = useState('');

  const isOfficeOrAdmin = user?.role === 'office' || user?.role === 'admin';

  const loadPendingStaff = async () => {
    if (!isOfficeOrAdmin) return;
    setPendingStaffLoading(true);
    const list = await getPendingStaff();
    setPendingStaff(list);
    setPendingStaffLoading(false);
  };

  useEffect(() => {
    if (user?.role === 'staff') {
      setActiveTab('in-progress');
      return;
    }
    setActiveTab('pending');
  }, [user?.role]);

  useEffect(() => {
    if (isOfficeOrAdmin) loadPendingStaff();
  }, [user?.role]);

  const visibleComplaints = (() => {
    if (!user) return [];
    switch (user.role) {
      case 'student':
      case 'visitor':
        return getComplaintsByUser(user.id);
      case 'staff':
        return getComplaintsByAssignee(user.id);
      case 'office':
      case 'admin':
        return complaints;
      default:
        return [];
    }
  })();

  if (!user) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>No active session</Text>
        <TouchableOpacity style={styles.primaryButton} onPress={() => navigation.replace('Home')}>
          <Text style={styles.primaryButtonText}>Go Home</Text>
        </TouchableOpacity>
      </View>
    );
  }
  const filteredComplaints = visibleComplaints.filter((complaint) =>
    user.role === 'staff'
      ? complaint.status === activeTab && (activeTab === 'in-progress' || activeTab === 'resolved')
      : complaint.status === activeTab
  );

  const counts = {
    pending: visibleComplaints.filter((item) => item.status === 'pending').length,
    approved: visibleComplaints.filter((item) => item.status === 'approved').length,
    'in-progress': visibleComplaints.filter((item) => item.status === 'in-progress').length,
    resolved: visibleComplaints.filter((item) => item.status === 'resolved').length,
    rejected: visibleComplaints.filter((item) => item.status === 'rejected').length,
  };

  const availableTabs =
    user.role === 'staff' ? (['in-progress', 'resolved'] as ComplaintStatus[]) : dashboardTabs;

  const ensureStaffLoaded = async (complaintId: string, location?: string) => {
    if (staffDirectory[complaintId]?.length) return;
    const staffMembers = await getAllStaff(location);
    setStaffDirectory((current) => ({
      ...current,
      [complaintId]: staffMembers.map((s) => ({ id: s.id, name: s.fullName })),
    }));
  };

  const approveComplaint = async (complaint: Complaint) => {
    const result = await updateComplaintStatus(complaint.id, 'approved');
    if (!result.success) Alert.alert('Unable to approve', result.error || 'Please try again.');
  };

  const rejectComplaint = async (complaint: Complaint) => {
    const reason = rejectionReasonByComplaint[complaint.id];
    if (!reason) {
      Alert.alert('Missing reason', 'Please enter a rejection reason first.');
      return;
    }
    const result = await updateComplaintStatus(complaint.id, 'rejected', undefined, reason);
    if (!result.success) Alert.alert('Unable to reject', result.error || 'Please try again.');
  };

  const assignComplaint = async (complaint: Complaint) => {
    await ensureStaffLoaded(complaint.id, complaint.location);
    const selectedStaffId = selectedStaffByComplaint[complaint.id];
    const staffMember = staffDirectory[complaint.id]?.find((item) => item.id === selectedStaffId);
    if (!staffMember) {
      Alert.alert('Select staff', 'Choose a staff member before assigning.');
      return;
    }
    const result = await updateComplaintStatus(complaint.id, 'in-progress', staffMember);
    if (!result.success) Alert.alert('Unable to assign', result.error || 'Please try again.');
  };

  const addSupportStaff = async (complaint: Complaint) => {
    await ensureStaffLoaded(complaint.id, complaint.location);
    const selectedId = selectedSupportStaffByComplaint[complaint.id];
    const staffMember = staffDirectory[complaint.id]?.find((s) => s.id === selectedId);
    if (!staffMember) {
      Alert.alert('Select staff', 'Choose a support staff member first.');
      return;
    }
    const result = await updateComplaintStatus(
      complaint.id,
      complaint.status,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      staffMember
    );
    if (!result.success) {
      Alert.alert('Unable to add support', result.error || 'Please try again.');
      return;
    }
    setShowSupportPickerFor(null);
    setSelectedSupportStaffByComplaint((prev) => ({ ...prev, [complaint.id]: '' }));
  };

  const resolveComplaint = async (complaint: Complaint) => {
    // Open resolution modal
    setResolveComplaintId(complaint.id);
    setResolutionDescription('');
  };

  const confirmResolve = async () => {
    if (!resolveComplaintId) return;
    if (!resolutionDescription.trim()) {
      Alert.alert('Description required', 'Please describe how the complaint was resolved.');
      return;
    }
    const result = await updateComplaintStatus(
      resolveComplaintId,
      'resolved',
      undefined,
      undefined,
      resolutionDescription.trim()
    );
    if (!result.success) {
      Alert.alert('Unable to resolve', result.error || 'Please try again.');
      return;
    }
    setResolveComplaintId(null);
    setResolutionDescription('');
  };

  const submitEscalation = async () => {
    if (!escalationComplaintId) return;
    if (!escalationReason.trim()) {
      Alert.alert('Reason required', 'Please explain why you cannot resolve this complaint.');
      return;
    }
    const result = await updateComplaintStatus(
      escalationComplaintId,
      'in-progress',
      undefined,
      undefined,
      undefined,
      undefined,
      escalationType,
      escalationReason.trim(),
      { id: user!.id, name: user!.fullName }
    );
    if (!result.success) {
      Alert.alert('Failed', result.error || 'Please try again.');
      return;
    }
    setEscalationComplaintId(null);
    setEscalationReason('');
    setEscalationType('unavailable');
    await reloadComplaints();
  };

  const handleApproveStaff = async (staffMember: User) => {
    const ok = await approveStaff(staffMember.id);
    if (ok) {
      setPendingStaff((prev) => prev.filter((s) => s.id !== staffMember.id));
      Alert.alert('Approved ✅', `${staffMember.fullName} can now sign in.`);
    } else {
      Alert.alert('Failed', 'Could not approve staff. Please try again.');
    }
  };

  const handleRejectStaff = async (staffMember: User) => {
    const reason = staffRejectReasons[staffMember.id]?.trim();
    if (!reason) {
      Alert.alert('Reason required', 'Enter a rejection reason before rejecting.');
      return;
    }
    const ok = await rejectStaff(staffMember.id, reason);
    if (ok) {
      setPendingStaff((prev) => prev.filter((s) => s.id !== staffMember.id));
      Alert.alert('Rejected', `${staffMember.fullName}'s registration has been rejected.`);
    } else {
      Alert.alert('Failed', 'Could not reject staff. Please try again.');
    }
  };

  const handleWithdrawComplaint = (complaint: Complaint) => {
    Alert.alert(
      'Withdraw Complaint',
      `Are you sure you want to withdraw "${complaint.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Withdraw',
          style: 'destructive',
          onPress: async () => {
            const ok = await deleteComplaint(complaint.id);
            if (!ok) Alert.alert('Failed', 'Could not withdraw complaint. Please try again.');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.screenWrapper}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={{ paddingBottom: 16 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || pendingStaffLoading}
            onRefresh={async () => {
              await reloadComplaints();
              await loadPendingStaff();
            }}
          />
        }
      >
      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <View style={styles.headerCard}>
        <Text style={styles.headerEyebrow}>{ROLE_LABELS[user.role]} dashboard</Text>
        <Text style={styles.headerTitle}>{user.fullName}</Text>
        <Text style={styles.headerSubtitle}>{user.email}</Text>
      </View>

      {(user.role === 'student' || user.role === 'visitor') ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('ComplaintForm', { location: 'unknown', source: 'dashboard' })}
        >
          <Text style={styles.primaryButtonText}>New Complaint</Text>
        </TouchableOpacity>
      ) : null}

      {/* ── PENDING STAFF APPROVALS (office / admin only) ───────────────────── */}
      {isOfficeOrAdmin && (
        <>
          <TouchableOpacity
            style={[
              styles.pendingStaffToggle,
              pendingStaff.length > 0 && styles.pendingStaffToggleAlert,
            ]}
            onPress={() => setShowPendingStaff((v) => !v)}
          >
            <View style={styles.pendingStaffToggleLeft}>
              <Text style={styles.pendingStaffToggleIcon}>👤</Text>
              <Text style={styles.pendingStaffToggleText}>Pending Staff Approvals</Text>
              {pendingStaff.length > 0 && (
                <View style={styles.pendingBadge}>
                  <Text style={styles.pendingBadgeText}>{pendingStaff.length}</Text>
                </View>
              )}
            </View>
            <Text style={styles.pendingStaffChevron}>{showPendingStaff ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {showPendingStaff && (
            <View style={styles.pendingStaffSection}>
              {pendingStaff.length === 0 ? (
                <Text style={styles.pendingStaffEmpty}>No pending staff registrations.</Text>
              ) : (
                pendingStaff.map((s) => (
                  <View key={s.id} style={styles.staffApprovalCard}>
                    {/* Header row */}
                    <View style={styles.staffApprovalHeader}>
                      <View style={styles.staffAvatarCircle}>
                        <Text style={styles.staffAvatarText}>
                          {s.fullName?.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <View style={styles.staffApprovalHeaderText}>
                        <Text style={styles.staffApprovalName}>{s.fullName}</Text>
                        <Text style={styles.staffApprovalSubtitle}>Staff Registration</Text>
                      </View>
                      <View style={styles.pendingChip}>
                        <Text style={styles.pendingChipText}>Pending</Text>
                      </View>
                    </View>

                    {/* Detail rows — only show filled fields */}
                    <View style={styles.staffDetailGrid}>
                      {(
                        [
                          { icon: '✉️', label: 'Email', value: s.email },
                          { icon: '🪪', label: 'Staff ID', value: s.staffId },
                          { icon: '🏢', label: 'Department', value: s.department },
                          { icon: '🎓', label: 'Faculty', value: s.faculty },
                          { icon: '💼', label: 'Position', value: s.position },
                          {
                            icon: '📍',
                            label: 'Locations',
                            value: s.staffLocations?.length
                              ? s.staffLocations.join(', ')
                              : undefined,
                          },
                          { icon: '📞', label: 'Phone', value: s.phone },
                        ] as { icon: string; label: string; value?: string }[]
                      )
                        .filter((row) => row.value)
                        .map((row) => (
                          <View key={row.label} style={styles.staffDetailRow}>
                            <Text style={styles.staffDetailIcon}>{row.icon}</Text>
                            <Text style={styles.staffDetailLabel}>{row.label}:</Text>
                            <Text style={styles.staffDetailValue} numberOfLines={2}>
                              {row.value}
                            </Text>
                          </View>
                        ))}
                    </View>

                    {/* Rejection reason input */}
                    <TextInput
                      style={styles.inlineInput}
                      placeholder="Rejection reason (required to reject)"
                      placeholderTextColor="#9CA3AF"
                      value={staffRejectReasons[s.id] || ''}
                      onChangeText={(v) =>
                        setStaffRejectReasons((prev) => ({ ...prev, [s.id]: v }))
                      }
                    />

                    {/* Approve / Reject buttons */}
                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={styles.halfActionButton}
                        onPress={() => handleApproveStaff(s)}
                      >
                        <Text style={styles.actionButtonText}>✓  Approve</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.halfDangerButton}
                        onPress={() => handleRejectStaff(s)}
                      >
                        <Text style={styles.dangerButtonText}>✕  Reject</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </>
      )}

      {/* ── STATS ──────────────────────────────────────────────────────────── */}
      <View style={styles.statsRow}>
        {availableTabs.map((tab, index) => (
          <View key={tab} style={[styles.statCard, index % 2 === 1 && styles.statCardLast]}>
            <Text style={styles.statCount}>{counts[tab]}</Text>
            <Text style={styles.statLabel}>{STATUS_LABELS[tab]}</Text>
          </View>
        ))}
      </View>

      {/* ── TABS ───────────────────────────────────────────────────────────── */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
        {availableTabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabChip, activeTab === tab && styles.tabChipActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabChipText, activeTab === tab && styles.tabChipTextActive]}>
              {STATUS_LABELS[tab]} ({counts[tab]})
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {filteredComplaints.length === 0 ? (
        <View style={styles.emptyStateCard}>
          <Text style={styles.emptyTitle}>No complaints in this section yet.</Text>
          <Text style={styles.emptyText}>
            Pull down to refresh after new submissions or status updates.
          </Text>
        </View>
      ) : null}

      {/* ── COMPLAINT CARDS ────────────────────────────────────────────────── */}
      {filteredComplaints.map((complaint) => (
        <View key={complaint.id} style={styles.complaintCard}>
          {/* Title + withdraw button row */}
          <View style={styles.complaintTitleRow}>
            <Text style={[styles.complaintTitle, { flex: 1 }]}>{complaint.title}</Text>
            {/* Withdraw — only for student/visitor on pending complaints */}
            {(user.role === 'student' || user.role === 'visitor') &&
              complaint.status === 'pending' && (
                <TouchableOpacity
                  style={styles.withdrawBtn}
                  onPress={() => handleWithdrawComplaint(complaint)}
                >
                  <Text style={styles.withdrawBtnText}>✕ Withdraw</Text>
                </TouchableOpacity>
              )}
          </View>

          <Text style={styles.metaText}>{STATUS_LABELS[complaint.status]}</Text>
          <Text style={styles.metaText}>
            {getLocationLabel(complaint.location)} • {getIssueTypeLabel(complaint.category)}
          </Text>
          <Text style={styles.description}>{complaint.description}</Text>

          {/* Attachments — visible to all roles, tappable to open */}
          {complaint.attachments && complaint.attachments.length > 0 ? (
            <View style={styles.attachmentsSection}>
              <Text style={styles.attachmentsSectionTitle}>📎 Attachments ({complaint.attachments.length})</Text>
              {complaint.attachments.map((att, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={styles.attachmentRow}
                  onPress={() => {
                    if (att.url) Linking.openURL(att.url);
                  }}
                >
                  <Text style={styles.attachmentIcon}>
                    {att.type === 'image' ? '🖼️' : att.type === 'video' ? '🎥' : att.type === 'audio' ? '🎵' : '📄'}
                  </Text>
                  <Text style={styles.attachmentName} numberOfLines={1}>{att.originalName}</Text>
                  <Text style={styles.attachmentOpen}>Open ›</Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}

          <Text style={styles.smallText}>Submitted by: {complaint.submittedBy.name}</Text>
          {complaint.assignedTo ? (
            <Text style={styles.smallText}>Assigned to: {complaint.assignedTo.name}</Text>
          ) : null}
          {complaint.resolvedAt ? (
            <Text style={[styles.smallText, { color: '#15803D' }]}>
              ✅ Resolved: {new Date(complaint.resolvedAt).toLocaleDateString()}
            </Text>
          ) : null}

          {/* Rejection reason */}
          {complaint.status === 'rejected' && complaint.rejectionReason ? (
            <View style={styles.rejectionBanner}>
              <Text style={styles.rejectionBannerTitle}>Rejection Reason</Text>
              <Text style={styles.rejectionBannerText}>{complaint.rejectionReason}</Text>
            </View>
          ) : null}

          {isOfficeOrAdmin && complaint.status === 'pending' ? (
            <>
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={styles.halfActionButton}
                  onPress={() => approveComplaint(complaint)}
                >
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.halfDangerButton}
                  onPress={() => rejectComplaint(complaint)}
                >
                  <Text style={styles.dangerButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.inlineInput}
                placeholder="Rejection reason"
                placeholderTextColor="#9CA3AF"
                value={rejectionReasonByComplaint[complaint.id] || ''}
                onChangeText={(value) =>
                  setRejectionReasonByComplaint((current) => ({
                    ...current,
                    [complaint.id]: value,
                  }))
                }
              />
            </>
          ) : null}

          {isOfficeOrAdmin && complaint.status === 'approved' ? (
            <>
              <TouchableOpacity
                style={styles.secondaryButton}
                onPress={() => ensureStaffLoaded(complaint.id, complaint.location)}
              >
                <Text style={styles.secondaryButtonText}>Load Staff List</Text>
              </TouchableOpacity>
              {staffDirectory[complaint.id]?.map((staffMember) => (
                <TouchableOpacity
                  key={staffMember.id}
                  style={[
                    styles.staffOption,
                    selectedStaffByComplaint[complaint.id] === staffMember.id &&
                      styles.staffOptionActive,
                  ]}
                  onPress={() =>
                    setSelectedStaffByComplaint((current) => ({
                      ...current,
                      [complaint.id]: staffMember.id,
                    }))
                  }
                >
                  <Text
                    style={[
                      styles.staffOptionText,
                      selectedStaffByComplaint[complaint.id] === staffMember.id &&
                        styles.staffOptionTextActive,
                    ]}
                  >
                    {staffMember.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => assignComplaint(complaint)}
              >
                <Text style={styles.actionButtonText}>Assign to Selected Staff</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {/* Escalation banner — visible to office/admin when staff escalated */}
          {isOfficeOrAdmin && complaint.escalationReason ? (
            <View style={styles.escalationBanner}>
              <Text style={styles.escalationBannerTitle}>⚠️ Staff Escalation</Text>
              <Text style={styles.escalationBannerRow}>
                Type: {complaint.escalationType === 'beyond-skill' ? 'Beyond ability' : 'Unavailable'}
              </Text>
              <Text style={styles.escalationBannerRow}>
                Reason: {complaint.escalationReason}
              </Text>
              {complaint.escalationReportedBy?.name ? (
                <Text style={styles.escalationBannerRow}>
                  Reported by: {complaint.escalationReportedBy.name}
                </Text>
              ) : null}
            </View>
          ) : null}

          {/* Resolution description — shown when resolved */}
          {complaint.status === 'resolved' && complaint.resolutionDescription ? (
            <View style={styles.resolutionBanner}>
              <Text style={styles.resolutionBannerTitle}>✅ Resolution</Text>
              <Text style={styles.resolutionBannerText}>{complaint.resolutionDescription}</Text>
            </View>
          ) : null}

          {/* Support staff list */}
          {complaint.supportStaff && complaint.supportStaff.length > 0 ? (
            <Text style={styles.smallText}>
              Support: {complaint.supportStaff.map((s) => s.name).join(', ')}
            </Text>
          ) : null}

          {(isOfficeOrAdmin && complaint.status === 'in-progress') ||
          (user.role === 'staff' && complaint.status === 'in-progress') ? (
            <>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => resolveComplaint(complaint)}
              >
                <Text style={styles.actionButtonText}>✅  Mark Resolved</Text>
              </TouchableOpacity>

              {/* Add Support Staff — office/admin only */}
              {isOfficeOrAdmin ? (
                <>
                  <TouchableOpacity
                    style={styles.supportStaffBtn}
                    onPress={async () => {
                      await ensureStaffLoaded(complaint.id, complaint.location);
                      setShowSupportPickerFor(
                        showSupportPickerFor === complaint.id ? null : complaint.id
                      );
                    }}
                  >
                    <Text style={styles.supportStaffBtnText}>👥  Add Support Staff</Text>
                  </TouchableOpacity>

                  {showSupportPickerFor === complaint.id && (
                    <View style={styles.supportPickerBox}>
                      <Text style={styles.supportPickerLabel}>Select support staff:</Text>
                      {staffDirectory[complaint.id]
                        ?.filter((s) => s.id !== complaint.assignedTo?.id)
                        .filter((s) => !(complaint.supportStaff || []).some((x) => x.id === s.id))
                        .map((s) => (
                          <TouchableOpacity
                            key={s.id}
                            style={[
                              styles.staffOption,
                              selectedSupportStaffByComplaint[complaint.id] === s.id &&
                                styles.staffOptionActive,
                            ]}
                            onPress={() =>
                              setSelectedSupportStaffByComplaint((prev) => ({
                                ...prev,
                                [complaint.id]: s.id,
                              }))
                            }
                          >
                            <Text
                              style={[
                                styles.staffOptionText,
                                selectedSupportStaffByComplaint[complaint.id] === s.id &&
                                  styles.staffOptionTextActive,
                              ]}
                            >
                              {s.name}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => addSupportStaff(complaint)}
                      >
                        <Text style={styles.actionButtonText}>Add Support</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              ) : null}

              {/* "I Can't Resolve This" — staff only */}
              {user.role === 'staff' ? (
                <TouchableOpacity
                  style={styles.cantResolveButton}
                  onPress={() => {
                    setEscalationComplaintId(complaint.id);
                    setEscalationReason('');
                    setEscalationType('unavailable');
                  }}
                >
                  <Text style={styles.cantResolveText}>⚠️  I Can't Resolve This</Text>
                </TouchableOpacity>
              ) : null}
            </>
          ) : null}
        </View>
      ))}

      </ScrollView>

      {/* ── FIXED FOOTER ───────────────────────────────────────────────────── */}
      <View style={[styles.footer, { paddingBottom: insets.bottom || 16 }]}>
        <TouchableOpacity
          style={styles.footerBackButton}
          onPress={() => navigation.navigate('Home')}
        >
          <Text style={styles.footerBackText}>← Back Home</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.footerSignOutButton}
          onPress={async () => {
            await logout();
            navigation.replace('Home');
          }}
        >
          <Text style={styles.footerSignOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      {/* ── RESOLVE MODAL ──────────────────────────────────────────────────── */}
      <Modal
        visible={resolveComplaintId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setResolveComplaintId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>✅  Mark as Resolved</Text>
            <Text style={styles.modalSubtitle}>
              Describe how the complaint was resolved. This will be visible to the submitter.
            </Text>
            <TextInput
              style={[styles.inlineInput, styles.modalTextArea]}
              placeholder="Describe the resolution..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              value={resolutionDescription}
              onChangeText={setResolutionDescription}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setResolveComplaintId(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirmBtn} onPress={confirmResolve}>
                <Text style={styles.modalConfirmText}>Mark Resolved</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── ESCALATION MODAL ───────────────────────────────────────────────── */}
      <Modal
        visible={escalationComplaintId !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setEscalationComplaintId(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalSheet}>
            <Text style={styles.modalTitle}>⚠️  I Can't Resolve This</Text>
            <Text style={styles.modalSubtitle}>
              Explain why so the office/admin can reassign or add support staff.
            </Text>

            {/* Type selector */}
            <Text style={styles.modalLabel}>Reason Type</Text>
            <View style={styles.escalationTypeRow}>
              {(
                [
                  { value: 'unavailable', label: 'Unavailable' },
                  { value: 'beyond-skill', label: 'Beyond My Ability' },
                ] as { value: 'unavailable' | 'beyond-skill'; label: string }[]
              ).map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.escalationTypeChip,
                    escalationType === opt.value && styles.escalationTypeChipActive,
                  ]}
                  onPress={() => setEscalationType(opt.value)}
                >
                  <Text
                    style={[
                      styles.escalationTypeText,
                      escalationType === opt.value && styles.escalationTypeTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.modalLabel}>Details</Text>
            <TextInput
              style={[styles.inlineInput, styles.modalTextArea]}
              placeholder="Explain why you cannot resolve this complaint..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={4}
              value={escalationReason}
              onChangeText={setEscalationReason}
              textAlignVertical="top"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setEscalationComplaintId(null)}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalWarnBtn} onPress={submitEscalation}>
                <Text style={styles.modalConfirmText}>Submit Escalation</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenWrapper: {
    flex: 1,
    backgroundColor: '#F4F7FB',
  },
  container: {
    flex: 1,
    padding: 18,
  },
  headerCard: {
    backgroundColor: '#123C69',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
  },
  headerEyebrow: {
    color: '#B8D9FF',
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#D7E8FF',
    marginTop: 6,
  },

  // ── Pending staff toggle button ──────────────────────────────────────────
  pendingStaffToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  pendingStaffToggleAlert: {
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
  },
  pendingStaffToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pendingStaffToggleIcon: { fontSize: 18 },
  pendingStaffToggleText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  pendingBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  pendingBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  pendingStaffChevron: {
    color: '#64748B',
    fontSize: 12,
  },

  // ── Pending staff section ────────────────────────────────────────────────
  pendingStaffSection: {
    marginBottom: 14,
  },
  pendingStaffEmpty: {
    color: '#64748B',
    textAlign: 'center',
    paddingVertical: 16,
    fontStyle: 'italic',
  },

  // ── Staff approval card ──────────────────────────────────────────────────
  staffApprovalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  staffApprovalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  staffAvatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1A56DB',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  staffAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
  },
  staffApprovalHeaderText: { flex: 1 },
  staffApprovalName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  staffApprovalSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  pendingChip: {
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  pendingChipText: {
    color: '#92400E',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Staff detail grid ────────────────────────────────────────────────────
  staffDetailGrid: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    gap: 8,
  },
  staffDetailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  staffDetailIcon: { fontSize: 14, marginTop: 1 },
  staffDetailLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
    width: 80,
  },
  staffDetailValue: {
    flex: 1,
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '500',
  },

  // ── Stats ────────────────────────────────────────────────────────────────
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  statCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginRight: '4%',
    marginBottom: 10,
  },
  statCardLast: { marginRight: 0 },
  statCount: { fontSize: 24, fontWeight: '800', color: '#15324B' },
  statLabel: { color: '#486581', marginTop: 4 },

  // ── Tabs ─────────────────────────────────────────────────────────────────
  tabRow: { marginVertical: 8 },
  tabChip: {
    backgroundColor: '#E7EEF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  tabChipActive: { backgroundColor: '#0F6CBD' },
  tabChipText: { color: '#15324B', fontWeight: '700' },
  tabChipTextActive: { color: '#FFFFFF' },

  // ── Complaint cards ───────────────────────────────────────────────────────
  complaintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
  },
  complaintTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: '#15324B',
    marginBottom: 6,
  },
  metaText: { color: '#486581', marginBottom: 4 },
  description: { color: '#243B53', marginTop: 8, lineHeight: 22 },
  smallText: { color: '#52667A', marginTop: 8 },
  rejectionText: { marginTop: 8, color: '#B42318', fontWeight: '700' },

  actionRow: { flexDirection: 'row', marginTop: 14 },
  actionButton: {
    backgroundColor: '#0F6CBD',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  halfActionButton: {
    flex: 1,
    backgroundColor: '#0F6CBD',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  actionButtonText: { color: '#FFFFFF', fontWeight: '800' },
  halfDangerButton: {
    flex: 1,
    backgroundColor: '#FFE7E4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginLeft: 10,
  },
  dangerButtonText: { color: '#B42318', fontWeight: '800' },
  inlineInput: {
    backgroundColor: '#F9FBFD',
    borderWidth: 1,
    borderColor: '#D7E1ED',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 12,
  },
  staffOption: {
    borderWidth: 1,
    borderColor: '#D7E1ED',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: 10,
  },
  staffOptionActive: { backgroundColor: '#0F6CBD', borderColor: '#0F6CBD' },
  staffOptionText: { color: '#15324B', fontWeight: '700' },
  staffOptionTextActive: { color: '#FFFFFF' },

  // ── Bottom buttons ────────────────────────────────────────────────────────
  primaryButton: {
    backgroundColor: '#0F6CBD',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E1ED',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: { color: '#15324B', fontWeight: '700' },

  // ── Fixed footer ──────────────────────────────────────────────────────────
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    paddingHorizontal: 18,
    paddingTop: 12,
    gap: 10,
  },
  footerBackButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D7E1ED',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerBackText: {
    color: '#15324B',
    fontWeight: '700',
    fontSize: 14,
  },
  footerSignOutButton: {
    flex: 1,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  footerSignOutText: {
    color: '#DC2626',
    fontWeight: '700',
    fontSize: 14,
  },

  // ── Empty states ──────────────────────────────────────────────────────────
  emptyStateCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 12,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F4F7FB',
  },
  emptyTitle: { fontSize: 20, fontWeight: '800', color: '#15324B', marginBottom: 8 },
  emptyText: { color: '#486581' },

  // ── Attachments ───────────────────────────────────────────────────────────
  attachmentsSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  attachmentsSectionTitle: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  attachmentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 3,
  },
  attachmentIcon: { fontSize: 14 },
  attachmentName: {
    flex: 1,
    color: '#1A56DB',
    fontSize: 12,
    fontWeight: '500',
  },
  attachmentOpen: {
    color: '#1A56DB',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 4,
  },

  // ── Support staff button ──────────────────────────────────────────────────
  supportStaffBtn: {
    backgroundColor: '#F0F4FA',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  supportStaffBtnText: {
    color: '#1A56DB',
    fontWeight: '700',
    fontSize: 13,
  },
  supportPickerBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  supportPickerLabel: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 8,
  },

  // ── Complaint title row ───────────────────────────────────────────────────
  complaintTitleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    gap: 8,
  },
  withdrawBtn: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 2,
  },
  withdrawBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },

  // ── Rejection banner ──────────────────────────────────────────────────────
  rejectionBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  rejectionBannerTitle: {
    color: '#B91C1C',
    fontWeight: '800',
    fontSize: 12,
    marginBottom: 4,
  },
  rejectionBannerText: {
    color: '#DC2626',
    fontSize: 12,
    lineHeight: 18,
  },

  // ── Escalation banner ─────────────────────────────────────────────────────
  escalationBanner: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  escalationBannerTitle: {
    color: '#92400E',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },
  escalationBannerRow: {
    color: '#78350F',
    fontSize: 12,
    lineHeight: 18,
  },

  // ── Resolution banner ─────────────────────────────────────────────────────
  resolutionBanner: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
  },
  resolutionBannerTitle: {
    color: '#166534',
    fontWeight: '800',
    fontSize: 13,
    marginBottom: 4,
  },
  resolutionBannerText: {
    color: '#15803D',
    fontSize: 12,
    lineHeight: 18,
  },

  // ── Can't resolve button ──────────────────────────────────────────────────
  cantResolveButton: {
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  cantResolveText: {
    color: '#92400E',
    fontWeight: '700',
    fontSize: 13,
  },

  // ── Modals ────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  modalLabel: {
    color: '#374151',
    fontWeight: '700',
    fontSize: 13,
    marginBottom: 8,
    marginTop: 4,
  },
  modalTextArea: {
    minHeight: 110,
    marginTop: 0,
    marginBottom: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#64748B',
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#0F6CBD',
    alignItems: 'center',
  },
  modalWarnBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#D97706',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },

  // ── Escalation type chips ─────────────────────────────────────────────────
  escalationTypeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  escalationTypeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  escalationTypeChipActive: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  escalationTypeText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 13,
  },
  escalationTypeTextActive: {
    color: '#FFFFFF',
  },
});
