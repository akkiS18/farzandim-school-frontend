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
  role_id: number;
  role_name: string;
  class_id?: number;
  class_name?: string;
  student_id?: number;
  student_name?: string;
  address?: string;
  birthdate?: string;
  ina?: string;
  balance?: number;
  created_at: string;
}

export interface SubjectItem {
  id: number;
  name: string;
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

export interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  author_id: number;
  author_name?: string;
  class_ids?: number[];
  created_at: string;
}
