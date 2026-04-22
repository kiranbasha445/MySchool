export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: 'Principal' | 'Teacher' | 'Student' | 'Parent';
  linkedStudentId: number | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface Student {
  id: number;
  name: string;
  profileImage?: string;
  classId: number;
  className: string;
  marksCount: number;
  averageScore: number | null;
}

export interface StudentDetail {
  id: number;
  name: string;
  profileImage?: string;
  classId: number;
  class: { id: number; name: string };
  marks: Mark[];
  achievements: Achievement[];
}

export interface Class {
  id: number;
  name: string;
  studentCount: number;
}

export interface Mark {
  id: number;
  subject: string;
  score: number;
  term?: string;
  studentId?: number;
  studentName?: string;
  className?: string;
}

export interface Achievement {
  id: number;
  title: string;
  description: string;
  imageUrl?: string;
  isPublic: boolean;
  studentId?: number;
  studentName?: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalClasses: number;
  totalMarks: number;
  totalAchievements: number;
  averageScore: number;
  topStudents: TopStudent[];
}

export interface ManagedUser {
  id: number;
  name: string;
  email: string;
  role: 'Principal' | 'Teacher' | 'Student' | 'Parent';
  isActive: boolean;
  createdAt: string;
  linkedStudentId: number | null;
  linkedStudentName: string | null;
}

export interface UnlinkedStudent {
  id: number;
  name: string;
  className: string;
  hasStudentAccount: boolean;
}

export interface PublicClass {
  id: number;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  enquiries: number;
}

export interface PublicClassDetail {
  id: number;
  name: string;
  capacity: number;
  occupied: number;
  available: number;
  enquiries: number;
  seats: boolean[]; // true = occupied
}

export interface TopStudent {
  id: number;
  name: string;
  className: string;
  average: number;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface AttendanceRow {
  studentId: number;
  studentName: string;
  status: AttendanceStatus;
  notes?: string;
  recordId?: number;
}

export interface AttendanceSummaryRow {
  studentId: number;
  studentName: string;
  total: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  rate: number | null;
}
