import { ComplaintLocation, ComplaintStatus, IssueType } from '../context/ComplaintContext';
import { UserRole } from '../context/AuthContext';

export const LOCATIONS: { value: ComplaintLocation; label: string }[] = [
  { value: 'cafeteria', label: 'Cafeteria' },
  { value: 'dormitory', label: 'Dormitory' },
  { value: 'registrar', label: 'Registrar Office' },
  { value: 'hr-office', label: 'HR Office' },
  { value: 'faculty', label: 'Faculty Building' },
  { value: 'library', label: 'Library' },
  { value: 'unknown', label: 'Unknown / Other' },
];

export const ISSUE_TYPES: { value: IssueType; label: string }[] = [
  { value: 'service-problem', label: 'Service Problem' },
  { value: 'staff-behavior', label: 'Staff Behavior' },
  { value: 'security-issue', label: 'Security Issue' },
  { value: 'facility-problem', label: 'Facility Problem' },
  { value: 'academic-issue', label: 'Academic Issue' },
  { value: 'other', label: 'Other' },
];

export const STATUS_LABELS: Record<ComplaintStatus, string> = {
  pending: 'Pending Review',
  approved: 'Approved',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  rejected: 'Rejected',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  student: 'Student',
  visitor: 'Visitor',
  staff: 'Staff',
  office: 'Office',
  admin: 'Admin',
};

export function getLocationLabel(location: ComplaintLocation) {
  return LOCATIONS.find((item) => item.value === location)?.label || location;
}

export function getIssueTypeLabel(category: IssueType) {
  return ISSUE_TYPES.find((item) => item.value === category)?.label || category;
}
