import React, { useEffect, useState } from 'react';
import {
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { getIssueTypeLabel, getLocationLabel, ROLE_LABELS, STATUS_LABELS } from '../constants/complaints';
import { useAuth } from '../context/AuthContext';
import { Complaint, ComplaintStatus, useComplaints } from '../context/ComplaintContext';

const dashboardTabs: ComplaintStatus[] = ['pending', 'approved', 'in-progress', 'resolved', 'rejected'];

export function DashboardScreen({ navigation }: any) {
  const { user, logout, getAllStaff } = useAuth();
  const {
    complaints,
    isLoading,
    reloadComplaints,
    getComplaintsByAssignee,
    getComplaintsByUser,
    updateComplaintStatus,
  } = useComplaints();
  const [activeTab, setActiveTab] = useState<ComplaintStatus>('pending');
  const [selectedStaffByComplaint, setSelectedStaffByComplaint] = useState<Record<string, string>>({});
  const [rejectionReasonByComplaint, setRejectionReasonByComplaint] = useState<Record<string, string>>({});
  const [staffDirectory, setStaffDirectory] = useState<Record<string, { id: string; name: string }[]>>({});

  useEffect(() => {
    if (user?.role === 'staff') {
      setActiveTab('in-progress');
      return;
    }

    setActiveTab('pending');
  }, [user?.role]);

  const visibleComplaints = (() => {
    if (!user) {
      return [];
    }

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

  const ensureStaffLoaded = async (complaintId: string) => {
    if (staffDirectory[complaintId]?.length) {
      return;
    }

    const staffMembers = await getAllStaff();
    setStaffDirectory((current) => ({
      ...current,
      [complaintId]: staffMembers.map((staffMember) => ({
        id: staffMember.id,
        name: staffMember.fullName,
      })),
    }));
  };

  const approveComplaint = async (complaint: Complaint) => {
    const result = await updateComplaintStatus(complaint.id, 'approved');
    if (!result.success) {
      Alert.alert('Unable to approve', result.error || 'Please try again.');
    }
  };

  const rejectComplaint = async (complaint: Complaint) => {
    const reason = rejectionReasonByComplaint[complaint.id];
    if (!reason) {
      Alert.alert('Missing reason', 'Please enter a rejection reason first.');
      return;
    }

    const result = await updateComplaintStatus(complaint.id, 'rejected', undefined, reason);
    if (!result.success) {
      Alert.alert('Unable to reject', result.error || 'Please try again.');
    }
  };

  const assignComplaint = async (complaint: Complaint) => {
    await ensureStaffLoaded(complaint.id);
    const selectedStaffId = selectedStaffByComplaint[complaint.id];
    const staffMember = staffDirectory[complaint.id]?.find((item) => item.id === selectedStaffId);

    if (!staffMember) {
      Alert.alert('Select staff', 'Choose a staff member before assigning.');
      return;
    }

    const result = await updateComplaintStatus(complaint.id, 'in-progress', staffMember);
    if (!result.success) {
      Alert.alert('Unable to assign', result.error || 'Please try again.');
    }
  };

  const resolveComplaint = async (complaint: Complaint) => {
    const result = await updateComplaintStatus(complaint.id, 'resolved');
    if (!result.success) {
      Alert.alert('Unable to resolve', result.error || 'Please try again.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={reloadComplaints} />}
    >
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

      <View style={styles.statsRow}>
        {availableTabs.map((tab, index) => (
          <View key={tab} style={[styles.statCard, index % 2 === 1 && styles.statCardLast]}>
            <Text style={styles.statCount}>{counts[tab]}</Text>
            <Text style={styles.statLabel}>{STATUS_LABELS[tab]}</Text>
          </View>
        ))}
      </View>

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
          <Text style={styles.emptyText}>Pull down to refresh after new submissions or status updates.</Text>
        </View>
      ) : null}

      {filteredComplaints.map((complaint) => (
        <View key={complaint.id} style={styles.complaintCard}>
          <Text style={styles.complaintTitle}>{complaint.title}</Text>
          <Text style={styles.metaText}>{STATUS_LABELS[complaint.status]}</Text>
          <Text style={styles.metaText}>
            {getLocationLabel(complaint.location)} • {getIssueTypeLabel(complaint.category)}
          </Text>
          <Text style={styles.description}>{complaint.description}</Text>
          <Text style={styles.smallText}>Submitted by: {complaint.submittedBy.name}</Text>
          {complaint.assignedTo ? (
            <Text style={styles.smallText}>Assigned to: {complaint.assignedTo.name}</Text>
          ) : null}
          {complaint.rejectionReason ? (
            <Text style={styles.rejectionText}>Rejection reason: {complaint.rejectionReason}</Text>
          ) : null}

          {(user.role === 'office' || user.role === 'admin') && complaint.status === 'pending' ? (
            <>
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.halfActionButton} onPress={() => approveComplaint(complaint)}>
                  <Text style={styles.actionButtonText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.halfDangerButton} onPress={() => rejectComplaint(complaint)}>
                  <Text style={styles.dangerButtonText}>Reject</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={styles.inlineInput}
                placeholder="Rejection reason"
                value={rejectionReasonByComplaint[complaint.id] || ''}
                onChangeText={(value) =>
                  setRejectionReasonByComplaint((current) => ({ ...current, [complaint.id]: value }))
                }
              />
            </>
          ) : null}

          {(user.role === 'office' || user.role === 'admin') && complaint.status === 'approved' ? (
            <>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => ensureStaffLoaded(complaint.id)}>
                <Text style={styles.secondaryButtonText}>Load Staff List</Text>
              </TouchableOpacity>
              {staffDirectory[complaint.id]?.map((staffMember) => (
                <TouchableOpacity
                  key={staffMember.id}
                  style={[
                    styles.staffOption,
                    selectedStaffByComplaint[complaint.id] === staffMember.id && styles.staffOptionActive,
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
                      selectedStaffByComplaint[complaint.id] === staffMember.id && styles.staffOptionTextActive,
                    ]}
                  >
                    {staffMember.name}
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity style={styles.actionButton} onPress={() => assignComplaint(complaint)}>
                <Text style={styles.actionButtonText}>Assign to Selected Staff</Text>
              </TouchableOpacity>
            </>
          ) : null}

          {((user.role === 'office' || user.role === 'admin') && complaint.status === 'in-progress') ||
          (user.role === 'staff' && complaint.status === 'in-progress') ? (
            <TouchableOpacity style={styles.actionButton} onPress={() => resolveComplaint(complaint)}>
              <Text style={styles.actionButtonText}>Mark Resolved</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      ))}

      <TouchableOpacity style={styles.secondaryButton} onPress={() => navigation.navigate('Home')}>
        <Text style={styles.secondaryButtonText}>Back Home</Text>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7FB',
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
  statCardLast: {
    marginRight: 0,
  },
  statCount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#15324B',
  },
  statLabel: {
    color: '#486581',
    marginTop: 4,
  },
  tabRow: {
    marginVertical: 8,
  },
  tabChip: {
    backgroundColor: '#E7EEF6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginRight: 8,
  },
  tabChipActive: {
    backgroundColor: '#0F6CBD',
  },
  tabChipText: {
    color: '#15324B',
    fontWeight: '700',
  },
  tabChipTextActive: {
    color: '#FFFFFF',
  },
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
  metaText: {
    color: '#486581',
    marginBottom: 4,
  },
  description: {
    color: '#243B53',
    marginTop: 8,
    lineHeight: 22,
  },
  smallText: {
    color: '#52667A',
    marginTop: 8,
  },
  rejectionText: {
    marginTop: 8,
    color: '#B42318',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 14,
  },
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
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  halfDangerButton: {
    flex: 1,
    backgroundColor: '#FFE7E4',
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
    marginLeft: 10,
  },
  dangerButtonText: {
    color: '#B42318',
    fontWeight: '800',
  },
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
  staffOptionActive: {
    backgroundColor: '#0F6CBD',
    borderColor: '#0F6CBD',
  },
  staffOptionText: {
    color: '#15324B',
    fontWeight: '700',
  },
  staffOptionTextActive: {
    color: '#FFFFFF',
  },
  primaryButton: {
    backgroundColor: '#0F6CBD',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#D7E1ED',
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
  },
  secondaryButtonText: {
    color: '#15324B',
    fontWeight: '700',
  },
  logoutButton: {
    backgroundColor: '#FFE7E4',
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 30,
  },
  logoutButtonText: {
    color: '#B42318',
    fontWeight: '800',
  },
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#15324B',
    marginBottom: 8,
  },
  emptyText: {
    color: '#486581',
  },
});
