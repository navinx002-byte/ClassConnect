export type UserRole = 'ADMIN' | 'PROFESSOR' | 'STUDENT';

export type ClassStatus = 'ON' | 'CANCELLED' | 'POSTPONED';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE';

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';

export type NotificationType = 
  | 'CLASS_REMINDER'
  | 'CLASS_CONFIRMED'
  | 'CLASS_RESCHEDULED'
  | 'CLASSROOM_CHANGED'
  | 'CLASS_CANCELLED'
  | 'CLASS_POSTPONED'
  | 'STUDENT_MARKED_ABSENT'
  | 'PROFESSOR_ANNOUNCEMENT'
  | 'TIMETABLE_SAVED'
  | 'TIMETABLE_PUBLISHED'
  | 'TIMETABLE_UPDATED'
  | 'ATTENDANCE_WARNING'
  | 'SUPPORT_REPLY';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
  studentGroupId?: string;
  rollNumber?: string;
  usn?: string;
  registerNumber?: string;
  admissionNumber?: string;
  degree?: string;
  semester?: string;
  phone?: string;
  profilePhoto?: string;
  active: boolean;
  createdAt: string;
}

// Preloaded college student record for secure registration validation
export interface StudentRecord {
  recordId: string;
  usn: string;
  registerNumber: string;
  admissionNumber: string;
  name: string;
  collegeEmail: string;
  departmentId: string;
  departmentName: string;
  degree: string; // e.g. "Master of Computer Applications (MCA)"
  semester: string; // e.g. "1"
  section: string; // e.g. "A"
  isRegistered: boolean;
  registered?: boolean;
  registeredUserId?: string;
  registeredAt?: string;
}

export interface Department {
  departmentId: string;
  name: string;
  code: string;
}

export interface Subject {
  subjectId: string;
  name: string;
  code: string;
  departmentId: string;
  professorId: string;
  defaultRoom: string;
  creditHours?: number;
  credits?: number;
}

export interface StudentSubject {
  enrollmentId: string;
  studentId: string;
  subjectId: string;
  semester: string;
}

export interface TimetableSlot {
  id: string;
  periodNumber: number;
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  subjectId: string;
  professorId: string;
  room: string;
}

export interface Timetable {
  timetableId: string;
  departmentId: string;
  studentGroupId: string;
  semester: string;
  weeklySchedule: TimetableSlot[];
  version: number;
  isPublished: boolean;
  publishedAt?: string;
}

export interface TimetableDocument {
  docId: string;
  originalName: string;
  fileType: string;
  fileDataUrl: string;
  fileSizeFormatted: string;
  uploadedAt: string;
  parsedSlotsCount?: number;
}

export interface ClassSession {
  sessionId: string;
  timetableId: string;
  subjectId: string;
  professorId: string;
  studentGroupId: string;
  date: string; // YYYY-MM-DD
  dayOfWeek: DayOfWeek;
  startTime: string; // "09:00"
  endTime: string;   // "10:00"
  room: string;
  status: ClassStatus;
  version: number;
  isFinalized?: boolean;
  postponedUntil?: string;
  cancellationReason?: string;
  rescheduleReason?: string;
  updatedAt?: string;
}

export interface AttendanceRecord {
  attendanceId: string;
  studentId: string;
  subjectId: string;
  professorId: string;
  sessionId: string;
  status: AttendanceStatus;
  markedAt: string;
  updatedAt?: string;
}

export interface ChangeLog {
  changeId: string;
  sessionId: string;
  professorId: string;
  professorName: string;
  subjectName: string;
  oldDate: string;
  newDate: string;
  oldTime: string;
  newTime: string;
  oldRoom: string;
  newRoom: string;
  reason: string;
  timestamp: string;
  sessionVersion: number;
  notificationDeliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED';
}

export interface NotificationItem {
  notificationId: string;
  id?: string;
  recipientId: string;
  recipientRole?: UserRole;
  title: string;
  message: string;
  body?: string;
  type: NotificationType;
  sessionId?: string;
  subjectId?: string;
  targetPage?: string;
  read: boolean;
  createdAt: string;
  timestamp?: string;
  deliveryStatus: 'SENT' | 'DELIVERED' | 'FAILED';
}

export interface DeviceToken {
  tokenId: string;
  userId: string;
  token: string;
  platform: 'web' | 'android' | 'ios';
  updatedAt: string;
}

export interface ReminderJob {
  reminderId: string;
  sessionId: string;
  scheduledAt: string; // ISO or HH:MM
  sessionVersion: number;
  status: 'SCHEDULED' | 'INVALIDATED' | 'EXECUTED';
}

export interface Announcement {
  announcementId: string;
  professorId: string;
  professorName: string;
  subjectId: string;
  subjectName: string;
  title: string;
  message: string;
  attachmentName?: string;
  attachmentUrl?: string;
  createdAt: string;
}

export interface QuestionPaper {
  paperId: string;
  departmentId: string;
  semester: string;
  academicYear: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  title: string;
  fileName: string;
  fileDataUrl: string;
  fileUrl?: string;
  fileSizeFormatted: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface StudyMaterial {
  materialId: string;
  departmentId: string;
  semester: string;
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  title: string;
  description: string;
  fileName: string;
  fileDataUrl: string;
  fileUrl?: string;
  fileSizeFormatted: string;
  fileSize?: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface SupportRequest {
  requestId: string;
  studentId: string;
  studentName: string;
  studentEmail?: string;
  usn: string;
  category: 'ACADEMIC' | 'ATTENDANCE_CORRECTION' | 'EXAMINATION' | 'FEE_PAYMENT' | 'TECHNICAL' | 'OTHER';
  subject: string;
  message: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
  createdAt: string;
  adminResponse?: string;
  resolvedAt?: string;
}

export interface CollegeSettings {
  minAttendanceThreshold: number; // e.g. 75
  warningAttendanceThreshold: number; // e.g. 65
  timezone: string; // "Asia/Kolkata"
  collegeName: string;
  currentSemester: string;
}

export interface SubjectAttendanceSummary {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  professorName: string;
  attended: number;
  totalHeld: number;
  absences: number;
  percentage: number;
  consecutiveNeeded: number;
  statusColor: 'green' | 'yellow' | 'red';
}

export interface OverallAttendanceSummary {
  totalAttended: number;
  totalHeld: number;
  totalAbsences: number;
  percentage: number;
  statusColor: 'green' | 'yellow' | 'red';
  subjects: SubjectAttendanceSummary[];
}
