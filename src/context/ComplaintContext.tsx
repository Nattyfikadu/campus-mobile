import React, { createContext, useContext, useEffect, useState } from 'react';
import { API_ROOT, apiClient } from '../api/client';

export type ComplaintStatus = 'pending' | 'approved' | 'in-progress' | 'resolved' | 'rejected';
export type ComplaintLocation =
  | 'cafeteria'
  | 'dormitory'
  | 'registrar'
  | 'hr-office'
  | 'faculty'
  | 'library'
  | 'unknown';
export type IssueType =
  | 'service-problem'
  | 'staff-behavior'
  | 'security-issue'
  | 'facility-problem'
  | 'academic-issue'
  | 'other';

export type Attachment = {
  url: string;
  type: 'image' | 'video' | 'audio';
  originalName: string;
};

export type LocalAttachment = {
  uri: string;
  name: string;
  type: string;
  kind: 'image' | 'video' | 'audio' | 'file';
};

export type Complaint = {
  id: string;
  type?: 'student' | 'visitor' | 'anonymous';
  trackingCode?: string;
  studentId?: string;
  title: string;
  description: string;
  category: IssueType;
  location: ComplaintLocation;
  status: ComplaintStatus;
  submittedBy: {
    id: string;
    name: string;
    email: string;
  };
  assignedTo?: {
    id: string;
    name: string;
  };
  supportStaff?: { id: string; name: string }[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  rejectionReason?: string;
  escalationType?: 'unavailable' | 'beyond-skill';
  escalationReason?: string;
  escalationReportedBy?: { id: string; name: string };
  resolutionDescription?: string;
  resolutionAttachments?: Attachment[];
  attachments?: Attachment[];
};

type ComplaintContextType = {
  complaints: Complaint[];
  isLoading: boolean;
  reloadComplaints: () => Promise<void>;
  addComplaint: (
    complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => Promise<Complaint | null>;
  uploadComplaintAttachments: (
    complaintId: string,
    files: LocalAttachment[]
  ) => Promise<{ success: boolean; error?: string }>;
  submitAnonymousComplaint: (payload: {
    title: string;
    description: string;
    location: ComplaintLocation;
    category: IssueType;
    files?: LocalAttachment[];
  }) => Promise<{ success: boolean; trackingCode?: string; error?: string }>;
  updateComplaintStatus: (
    id: string,
    status: ComplaintStatus,
    assignedTo?: { id: string; name: string },
    rejectionReason?: string,
    resolutionDescription?: string,
    resolutionAttachments?: Attachment[],
    escalationType?: 'unavailable' | 'beyond-skill',
    escalationReason?: string,
    escalationReportedBy?: { id: string; name: string },
    supportStaffAdd?: { id: string; name: string }
  ) => Promise<{ success: boolean; error?: string }>;
  trackComplaint: (
    trackingCode: string
  ) => Promise<{ success: boolean; complaint?: Partial<Complaint>; error?: string }>;
  getComplaintsByUser: (userId: string) => Complaint[];
  getComplaintsByStatus: (status: ComplaintStatus) => Complaint[];
  getComplaintsByAssignee: (assigneeId: string) => Complaint[];
};

const ComplaintContext = createContext<ComplaintContextType>({
  complaints: [],
  isLoading: true,
  reloadComplaints: async () => {},
  addComplaint: async () => null,
  uploadComplaintAttachments: async () => ({ success: false, error: 'Complaint provider not ready' }),
  submitAnonymousComplaint: async () => ({ success: false, error: 'Complaint provider not ready' }),
  updateComplaintStatus: async () => ({ success: false, error: 'Complaint provider not ready' }),
  trackComplaint: async () => ({ success: false, error: 'Complaint provider not ready' }),
  getComplaintsByUser: () => [],
  getComplaintsByStatus: () => [],
  getComplaintsByAssignee: () => [],
});

export function ComplaintProvider({ children }: { children: React.ReactNode }) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reloadComplaints = async () => {
    try {
      const response = await apiClient.get('/complaints');
      // API returns { data: [], pagination: {} } — handle both shapes
      const list = Array.isArray(response.data) ? response.data : (response.data?.data ?? []);
      setComplaints(list as Complaint[]);
    } catch (error) {
      console.error('Failed to load complaints', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    reloadComplaints();
  }, []);

  const addComplaint = async (
    complaint: Omit<Complaint, 'id' | 'createdAt' | 'updatedAt' | 'status'>
  ) => {
    try {
      const response = await apiClient.post('/complaints', {
        title: complaint.title,
        description: complaint.description,
        category: complaint.category,
        location: complaint.location,
        submittedBy: complaint.submittedBy,
      });

      const createdComplaint = response.data as Complaint;
      setComplaints((current) => [createdComplaint, ...current]);
      return createdComplaint;
    } catch (error) {
      console.error('Failed to create complaint', error);
      return null;
    }
  };

  const uploadComplaintAttachments = async (complaintId: string, files: LocalAttachment[]) => {
    if (!files.length) {
      return { success: true };
    }

    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });

      const response = await fetch(`${API_ROOT}/api/uploads/${complaintId}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => null);
        return {
          success: false,
          error: data?.error || 'Failed to upload attachments.',
        };
      }

      await reloadComplaints();
      return { success: true };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to upload attachments.',
      };
    }
  };

  const submitAnonymousComplaint = async (payload: {
    title: string;
    description: string;
    location: ComplaintLocation;
    category: IssueType;
    files?: LocalAttachment[];
  }) => {
    try {
      const formData = new FormData();
      formData.append('title', payload.title);
      formData.append('description', payload.description);
      formData.append('location', payload.location);
      formData.append('category', payload.category);

      payload.files?.forEach((file) => {
        formData.append('files', {
          uri: file.uri,
          name: file.name,
          type: file.type,
        } as any);
      });

      const response = await fetch(`${API_ROOT}/api/complaints/anonymous`, {
        method: 'POST',
        body: formData,
      });
      const data = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          success: false,
          error: data?.error || 'Failed to submit anonymous complaint.',
        };
      }

      const trackingCode = data?.trackingCode as string | undefined;
      await reloadComplaints();
      return { success: true, trackingCode };
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Failed to submit anonymous complaint.';
      return { success: false, error: message };
    }
  };

  const updateComplaintStatus = async (
    id: string,
    status: ComplaintStatus,
    assignedTo?: { id: string; name: string },
    rejectionReason?: string,
    resolutionDescription?: string,
    resolutionAttachments?: Attachment[],
    escalationType?: 'unavailable' | 'beyond-skill',
    escalationReason?: string,
    escalationReportedBy?: { id: string; name: string },
    supportStaffAdd?: { id: string; name: string }
  ) => {
    try {
      const response = await apiClient.patch(`/complaints/${id}/status`, {
        status,
        assignedTo,
        rejectionReason,
        resolutionDescription,
        resolutionAttachments,
        escalationType,
        escalationReason,
        escalationReportedBy,
        supportStaffAdd,
      });
      const updatedComplaint = response.data as Complaint;
      setComplaints((current) =>
        current.map((complaint) => (complaint.id === updatedComplaint.id ? updatedComplaint : complaint))
      );
      return { success: true };
    } catch (error: any) {
      const message =
        error.response?.data?.error || 'Failed to update complaint status.';
      return { success: false, error: message };
    }
  };

  const trackComplaint = async (trackingCode: string) => {
    try {
      const response = await apiClient.get(`/complaints/track/${encodeURIComponent(trackingCode)}`);
      return { success: true, complaint: response.data as Partial<Complaint> };
    } catch (error: any) {
      const message = error.response?.data?.error || 'Tracking code not found.';
      return { success: false, error: message };
    }
  };

  const getComplaintsByUser = (userId: string) =>
    complaints.filter((complaint) => complaint.submittedBy.id === userId);

  const getComplaintsByStatus = (status: ComplaintStatus) =>
    complaints.filter((complaint) => complaint.status === status);

  const getComplaintsByAssignee = (assigneeId: string) =>
    complaints.filter((complaint) => complaint.assignedTo?.id === assigneeId);

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        isLoading,
        reloadComplaints,
        addComplaint,
        uploadComplaintAttachments,
        submitAnonymousComplaint,
        updateComplaintStatus,
        trackComplaint,
        getComplaintsByUser,
        getComplaintsByStatus,
        getComplaintsByAssignee,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
}

export function useComplaints() {
  return useContext(ComplaintContext);
}
