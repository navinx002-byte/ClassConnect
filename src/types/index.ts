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
  | 'TIMETABLE_PUBLISHED'
  | 'TIMETABLE_UPDATED'
  | 'ATTENDANCE_WARNING';

export interface User {
  userId: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId: string;
  studentGroupId?: string;
  rollNumber?: string;
  phone?: string;
  active: boolean;
  createdAt: string;
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
  recipientId: string;
  recipientRole?: UserRole;
  title: string;
  message: string;
  type: NotificationType;
  sessionId?: string;
  subjectId?: string;
  read: boolean;
  createdAt: string;
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
  scheduledAt: string;
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
  createdAt: string;
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
