export interface ClassItem {
  id: number;
  name: string;
  level?: number;
}

export interface UserInfo {
  id: number;
  first_name: string;
  last_name: string;
  role: string;
  school_id?: string;
}

export interface TenantUser {
  id: number;
  email?: string;
  phone?: string;
  first_name: string;
  last_name: string;
  middle_name?: string;
  passport?: string;
  role_id: number;
  role_name: string;
  class_id?: number;
  class_name?: string;
  student_id?: number;
  student_name?: string;
  address?: string;
  birthdate?: string;
  enrollment_date?: string;
  ina?: string;
  balance?: number;
  created_at: string;
}

export interface SubjectItem {
  id: number;
  name: string;
  target_levels?: number[];
}

export interface ClassTeacherItem {
  id: number;
  class_id: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone: string;
  is_main_teacher: boolean;
  role_name: string;
}

export interface RowError {
  row: number;
  error: string;
}

export interface ImportResult {
  success: boolean;
  imported_count: number;
  failed_count: number;
  errors: RowError[];
}

export interface ClassScheduleItem {
  id: number;
  class_id: number;
  day_of_week: number;
  lesson_number: number;
  subject_id: number;
  subject_name: string;
  start_date?: string;
  end_date?: string;
}

export interface GradingSystem {
  id: number;
  name: string;
  type: string;
  min_value?: number;
  max_value?: number;
  is_active: boolean;
  options?: any;
}

export interface PollOptionItem {
  id: number;
  option_text: string;
  vote_count: number;
  user_voted?: boolean;
}

export interface StudentAttendanceStat {
  student_id: number;
  user_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  class_id: number;
  class_name: string;
  class_level: number;
  absent_count: number;
  tardy_count?: number;
  present_count?: number;
  present_or_tardy_count: number;
  status: "absent" | "partial" | "tardy" | "present" | "no_data";
}

export interface DailyAttendanceStat {
  day: string;
  date: string;
  attendance_pct: number;
}

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name?: string;
  is_poll?: boolean;
  poll_options?: PollOptionItem[];
  class_ids?: number[];
  level_ids?: number[];
  student_ids?: number[];
  created_at: string;
}

export interface ClassTeacherHistoryItem {
  id: number;
  class_id: number;
  subject_id: number;
  subject_name: string;
  teacher_id: number;
  first_name: string;
  last_name: string;
  middle_name?: string;
  phone: string;
  is_main_teacher: boolean;
  is_deleted: boolean;
  created_at: string;
  deleted_at?: string | null;
}
