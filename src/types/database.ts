export type ServiceLine = 'CMS Hub' | 'CMS Endgame';

export type MemberRole = 'Developer' | 'Co-lead' | 'Team Lead' | 'Project Manager' | 'Operations Manager';

// Roles that automatically get admin access
export const ADMIN_ROLES: MemberRole[] = ['Operations Manager', 'Project Manager', 'Team Lead', 'Co-lead'];

// Super admin emails (highest privilege)
export const SUPER_ADMIN_EMAILS = ['nadiatul.sakib@gmail.com'];

export const ALL_ROLES: { value: MemberRole; label: string }[] = [
  { value: 'Developer', label: 'Developer' },
  { value: 'Co-lead', label: 'Co-lead' },
  { value: 'Team Lead', label: 'Team Lead' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' },
];

export function isAdminRole(role: string): boolean {
  return ADMIN_ROLES.includes(role as MemberRole);
}

export function isSuperAdmin(email: string | null | undefined): boolean {
  return !!email && SUPER_ADMIN_EMAILS.includes(email.toLowerCase());
}

export interface Team {
  id: string;
  name: string;
  service_line: ServiceLine;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface Member {
  id: string;
  member_id: string | null;
  name: string;
  email: string | null;
  role: MemberRole;
  team_id: string;
  profile_image: string | null;
  joined_at: string;
  created_at: string;
  updated_at: string;
  // Joined fields
  team?: Team;
}

export interface Rating {
  id: string;
  member_id: string;
  team_id: string;
  rating_value: number;
  order_id: string | null;
  client_name: string | null;
  review_text: string | null;
  screenshot_url: string | null;
  profile_name: string | null;
  date_received: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  member?: Member;
  team?: Team;
}

export interface TeamWithStats extends Team {
  member_count: number;
  rating_count: number;
}

export interface MemberWithStats extends Member {
  rating_count: number;
}

export interface DashboardStats {
  totalRatings: number;
  cmsHubRatings: number;
  cmsEndgameRatings: number;
  teamStats: TeamWithStats[];
  topMembers: MemberWithStats[];
  topTeams: TeamWithStats[];
  recentRatings: Rating[];
}

// Form types
export interface TeamFormData {
  name: string;
  service_line: ServiceLine;
  color?: string;
}

export interface MemberFormData {
  member_id: string;
  name: string;
  email: string;
  role: MemberRole;
  team_id: string;
  profile_image: string;
  joined_at: string;
}

export interface RatingFormData {
  member_id: string;
  team_id: string;
  rating_value: number;
  order_id: string;
  client_name: string;
  review_text: string;
  screenshot_url: string;
  profile_name: string;
  date_received: string;
  status?: 'pending' | 'approved' | 'rejected';
}

export interface RatingAuditLog {
  id: string;
  rating_id: string;
  action: 'created' | 'edited' | 'approved' | 'rejected' | 'status_changed';
  changed_by: string;
  changes: Record<string, { old: unknown; new: unknown }> | null;
  created_at: string;
}
