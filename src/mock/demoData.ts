import type {
  User,
  Department,
  Subject,
  StudentSubject,
  Timetable,
  TimetableSlot,
  ClassSession,
  AttendanceRecord,
  ChangeLog,
  NotificationItem,
  Announcement,
  CollegeSettings,
  ReminderJob,
  TimetableDocument,
} from '../types';

export const INITIAL_SETTINGS: CollegeSettings = {
  minAttendanceThreshold: 75,
  warningAttendanceThreshold: 65,
  timezone: 'Asia/Kolkata',
  collegeName: 'Institute of Technology',
  currentSemester: 'Odd Semester 2026 - 2027 (MCA Semester I - Section A)',
};

export const INITIAL_DEPARTMENTS: Department[] = [
  { departmentId: 'dept_mca', name: 'Department of Computer Applications - MCA', code: 'MCA' },
  { departmentId: 'dept_cse', name: 'Computer Science & Engineering', code: 'CSE' },
  { departmentId: 'dept_ece', name: 'Electronics & Communication', code: 'ECE' },
  { departmentId: 'dept_me', name: 'Mechanical Engineering', code: 'ME' },
];

export const INITIAL_USERS: User[] = [
  {
    userId: 'user_admin_01',
    name: 'College Administrator',
    email: 'admin@college.edu',
    role: 'ADMIN',
    departmentId: 'dept_mca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'user_prof_sharma',
    name: 'Prof. Dr. Rajesh Sharma',
    email: 'professor@college.edu',
    role: 'PROFESSOR',
    departmentId: 'dept_mca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'user_prof_dsa',
    name: 'Prof. Amit Verma',
    email: 'prof.dsa@college.edu',
    role: 'PROFESSOR',
    departmentId: 'dept_mca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'user_prof_adbs',
    name: 'Prof. Priya Patel',
    email: 'prof.adbs@college.edu',
    role: 'PROFESSOR',
    departmentId: 'dept_mca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'user_prof_dcn',
    name: 'Prof. Sneha Reddy',
    email: 'prof.dcn@college.edu',
    role: 'PROFESSOR',
    departmentId: 'dept_mca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'user_prof_rmpe',
    name: 'Prof. Vikram Rao',
    email: 'prof.rmpe@college.edu',
    role: 'PROFESSOR',
    departmentId: 'dept_mca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'user_prof_mfca',
    name: 'Prof. Ananya Gupta',
    email: 'prof.mfca@college.edu',
    role: 'PROFESSOR',
    departmentId: 'dept_mca',
    active: true,
    createdAt: new Date().toISOString(),
  },
  {
    userId: 'user_student_main',
    name: 'Rahul Verma',
    email: 'student@college.edu',
    role: 'STUDENT',
    departmentId: 'dept_mca',
    studentGroupId: 'grp_mca_1a',
    rollNumber: 'MCA-2026-001',
    active: true,
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_SUBJECTS: Subject[] = [
  { subjectId: 'sub_aos', name: 'Advanced Operating Systems (AOS)', code: 'AOS', departmentId: 'dept_mca', professorId: 'user_prof_sharma', defaultRoom: 'Room 301', creditHours: 4 },
  { subjectId: 'sub_dsa', name: 'Data Structures & Algorithms (DSA)', code: 'DSA', departmentId: 'dept_mca', professorId: 'user_prof_dsa', defaultRoom: 'Room 302', creditHours: 4 },
  { subjectId: 'sub_dsa_lab', name: 'DSA Lab-A1 / ADBS Lab-A2', code: 'DSA Lab', departmentId: 'dept_mca', professorId: 'user_prof_dsa', defaultRoom: 'Computing Lab 1', creditHours: 2 },
  { subjectId: 'sub_adbs', name: 'Advanced Database Systems (ADBS)', code: 'ADBS', departmentId: 'dept_mca', professorId: 'user_prof_adbs', defaultRoom: 'Room 303', creditHours: 4 },
  { subjectId: 'sub_adbs_lab', name: 'ADBS Lab-A1 / DCN Lab-A2', code: 'ADBS Lab', departmentId: 'dept_mca', professorId: 'user_prof_adbs', defaultRoom: 'Database Lab 2', creditHours: 2 },
  { subjectId: 'sub_dcn', name: 'Data Communication & Networks (DCN)', code: 'DCN', departmentId: 'dept_mca', professorId: 'user_prof_dcn', defaultRoom: 'Room 304', creditHours: 4 },
  { subjectId: 'sub_dcn_lab', name: 'DCN Lab-A1 / DSA Lab-A2', code: 'DCN Lab', departmentId: 'dept_mca', professorId: 'user_prof_dcn', defaultRoom: 'Network Lab', creditHours: 2 },
  { subjectId: 'sub_sspcs', name: 'Soft Skills & Personality Development', code: 'SSPCS', departmentId: 'dept_mca', professorId: 'user_prof_sharma', defaultRoom: 'Seminar Hall 1', creditHours: 2 },
  { subjectId: 'sub_rmpe', name: 'Research Methodology & Professional Ethics', code: 'RMPE', departmentId: 'dept_mca', professorId: 'user_prof_rmpe', defaultRoom: 'Room 305', creditHours: 3 },
  { subjectId: 'sub_mfca', name: 'Math Foundations for Computer Applications', code: 'MFCA', departmentId: 'dept_mca', professorId: 'user_prof_mfca', defaultRoom: 'Room 306', creditHours: 4 },
  { subjectId: 'sub_mentoring', name: 'Student Mentoring & Guidance', code: 'Mentoring', departmentId: 'dept_mca', professorId: 'user_prof_sharma', defaultRoom: 'Faculty Room', creditHours: 1 },
  { subjectId: 'sub_sparks', name: 'SPARKS Club Activities / Guest Lectures', code: 'SPARKS CLUB', departmentId: 'dept_mca', professorId: 'user_prof_sharma', defaultRoom: 'Main Auditorium', creditHours: 2 },
];

export const INITIAL_ENROLLMENTS: StudentSubject[] = [
  { enrollmentId: 'enr_01', studentId: 'user_student_main', subjectId: 'sub_aos', semester: '1' },
  { enrollmentId: 'enr_02', studentId: 'user_student_main', subjectId: 'sub_dsa', semester: '1' },
  { enrollmentId: 'enr_03', studentId: 'user_student_main', subjectId: 'sub_dsa_lab', semester: '1' },
  { enrollmentId: 'enr_04', studentId: 'user_student_main', subjectId: 'sub_adbs', semester: '1' },
  { enrollmentId: 'enr_05', studentId: 'user_student_main', subjectId: 'sub_adbs_lab', semester: '1' },
  { enrollmentId: 'enr_06', studentId: 'user_student_main', subjectId: 'sub_dcn', semester: '1' },
  { enrollmentId: 'enr_07', studentId: 'user_student_main', subjectId: 'sub_dcn_lab', semester: '1' },
  { enrollmentId: 'enr_08', studentId: 'user_student_main', subjectId: 'sub_sspcs', semester: '1' },
  { enrollmentId: 'enr_09', studentId: 'user_student_main', subjectId: 'sub_rmpe', semester: '1' },
  { enrollmentId: 'enr_10', studentId: 'user_student_main', subjectId: 'sub_mfca', semester: '1' },
  { enrollmentId: 'enr_11', studentId: 'user_student_main', subjectId: 'sub_mentoring', semester: '1' },
  { enrollmentId: 'enr_12', studentId: 'user_student_main', subjectId: 'sub_sparks', semester: '1' },
];

// Official uploaded timetable document from college
export const INITIAL_TIMETABLE_DOCUMENTS: TimetableDocument[] = [
  {
    docId: 'doc_mca_official_01',
    originalName: 'MCA_Semester_1_Section_A_Timetable.png',
    fileType: 'IMAGE',
    fileSizeFormatted: '184 KB',
    fileDataUrl: '/mca_timetable_official.png',
    uploadedAt: new Date().toISOString(),
  },
];

// Helper to build schedule slots
const buildSlot = (
  id: string,
  day: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY',
  period: number,
  startTime: string,
  endTime: string,
  subjectId: string,
  profId: string,
  room: string
): TimetableSlot => ({
  id,
  dayOfWeek: day,
  periodNumber: period,
  startTime,
  endTime,
  subjectId,
  professorId: profId,
  room,
});

export const INITIAL_TIMETABLE: Timetable = {
  timetableId: 'tt_mca_1a_2026',
  departmentId: 'dept_mca',
  studentGroupId: 'grp_mca_1a',
  semester: '1',
  version: 1,
  isPublished: true,
  weeklySchedule: [
    // --- MONDAY ---
    buildSlot('slot_mon_1', 'MONDAY', 1, '09:00', '09:55', 'sub_aos', 'user_prof_sharma', 'Room 301'),
    buildSlot('slot_mon_2', 'MONDAY', 2, '09:55', '10:50', 'sub_dsa_lab', 'user_prof_dsa', 'Computing Lab 1'),
    buildSlot('slot_mon_3', 'MONDAY', 3, '11:00', '11:55', 'sub_dsa_lab', 'user_prof_dsa', 'Computing Lab 1'),
    buildSlot('slot_mon_4', 'MONDAY', 4, '11:55', '12:50', 'sub_dsa_lab', 'user_prof_dsa', 'Computing Lab 1'),
    buildSlot('slot_mon_5', 'MONDAY', 5, '13:25', '14:20', 'sub_dcn', 'user_prof_dcn', 'Room 304'),
    buildSlot('slot_mon_6', 'MONDAY', 6, '14:20', '15:15', 'sub_dsa', 'user_prof_dsa', 'Room 302'),
    buildSlot('slot_mon_7', 'MONDAY', 7, '15:15', '16:10', 'sub_adbs', 'user_prof_adbs', 'Room 303 (Remedial)'),

    // --- TUESDAY ---
    buildSlot('slot_tue_1', 'TUESDAY', 1, '09:00', '09:55', 'sub_dcn', 'user_prof_dcn', 'Room 304'),
    buildSlot('slot_tue_2', 'TUESDAY', 2, '09:55', '10:50', 'sub_adbs', 'user_prof_adbs', 'Room 303'),
    buildSlot('slot_tue_3', 'TUESDAY', 3, '11:00', '11:55', 'sub_sspcs', 'user_prof_sharma', 'Seminar Hall 1'),
    buildSlot('slot_tue_4', 'TUESDAY', 4, '11:55', '12:50', 'sub_aos', 'user_prof_sharma', 'Room 301'),
    buildSlot('slot_tue_5', 'TUESDAY', 5, '13:25', '14:20', 'sub_dsa', 'user_prof_dsa', 'Room 302'),
    buildSlot('slot_tue_6', 'TUESDAY', 6, '14:20', '15:15', 'sub_dcn', 'user_prof_dcn', 'Room 304 (Remedial)'),
    buildSlot('slot_tue_7', 'TUESDAY', 7, '15:15', '16:10', 'sub_dsa', 'user_prof_dsa', 'Room 302 (Remedial)'),

    // --- WEDNESDAY ---
    buildSlot('slot_wed_1', 'WEDNESDAY', 1, '09:00', '09:55', 'sub_dcn', 'user_prof_dcn', 'Room 304'),
    buildSlot('slot_wed_2', 'WEDNESDAY', 2, '09:55', '10:50', 'sub_rmpe', 'user_prof_rmpe', 'Room 305'),
    buildSlot('slot_wed_3', 'WEDNESDAY', 3, '11:00', '11:55', 'sub_aos', 'user_prof_sharma', 'Room 301'),
    buildSlot('slot_wed_4', 'WEDNESDAY', 4, '11:55', '12:50', 'sub_mfca', 'user_prof_mfca', 'Room 306'),
    buildSlot('slot_wed_5', 'WEDNESDAY', 5, '13:25', '14:20', 'sub_dcn_lab', 'user_prof_dcn', 'Network Lab (DCN/ADBS)'),
    buildSlot('slot_wed_6', 'WEDNESDAY', 6, '14:20', '15:15', 'sub_dcn_lab', 'user_prof_dcn', 'Network Lab (DCN/ADBS)'),
    buildSlot('slot_wed_7', 'WEDNESDAY', 7, '15:15', '16:10', 'sub_dcn_lab', 'user_prof_dcn', 'Network Lab (DCN/ADBS)'),

    // --- THURSDAY ---
    buildSlot('slot_thu_1', 'THURSDAY', 1, '09:00', '09:55', 'sub_rmpe', 'user_prof_rmpe', 'Room 305'),
    buildSlot('slot_thu_2', 'THURSDAY', 2, '09:55', '10:50', 'sub_dsa', 'user_prof_dsa', 'Room 302'),
    buildSlot('slot_thu_3', 'THURSDAY', 3, '11:00', '11:55', 'sub_mfca', 'user_prof_mfca', 'Room 306'),
    buildSlot('slot_thu_4', 'THURSDAY', 4, '11:55', '12:50', 'sub_adbs', 'user_prof_adbs', 'Room 303'),
    buildSlot('slot_thu_5', 'THURSDAY', 5, '13:25', '14:20', 'sub_dsa_lab', 'user_prof_dsa', 'Computing Lab 1 (DSA/DCN)'),
    buildSlot('slot_thu_6', 'THURSDAY', 6, '14:20', '15:15', 'sub_dsa_lab', 'user_prof_dsa', 'Computing Lab 1 (DSA/DCN)'),
    buildSlot('slot_thu_7', 'THURSDAY', 7, '15:15', '16:10', 'sub_dsa_lab', 'user_prof_dsa', 'Computing Lab 1 (DSA/DCN)'),

    // --- FRIDAY ---
    buildSlot('slot_fri_1', 'FRIDAY', 1, '09:00', '09:55', 'sub_mfca', 'user_prof_mfca', 'Room 306'),
    buildSlot('slot_fri_2', 'FRIDAY', 2, '09:55', '10:50', 'sub_rmpe', 'user_prof_rmpe', 'Room 305'),
    buildSlot('slot_fri_3', 'FRIDAY', 3, '11:00', '11:55', 'sub_adbs', 'user_prof_adbs', 'Room 303'),
    buildSlot('slot_fri_4', 'FRIDAY', 4, '11:55', '12:50', 'sub_aos', 'user_prof_sharma', 'Room 301'),
    buildSlot('slot_fri_5', 'FRIDAY', 5, '13:25', '14:20', 'sub_dsa', 'user_prof_dsa', 'Room 302 (DSA Tutorial)'),
    buildSlot('slot_fri_6', 'FRIDAY', 6, '14:20', '15:15', 'sub_aos', 'user_prof_sharma', 'Room 301 (AOS Remedial)'),
    buildSlot('slot_fri_7', 'FRIDAY', 7, '15:15', '16:10', 'sub_rmpe', 'user_prof_rmpe', 'Room 305 (RMPE Remedial)'),

    // --- SATURDAY ---
    buildSlot('slot_sat_1', 'SATURDAY', 1, '09:00', '09:55', 'sub_mfca', 'user_prof_mfca', 'Room 306'),
    buildSlot('slot_sat_2', 'SATURDAY', 2, '09:55', '10:50', 'sub_dcn', 'user_prof_dcn', 'Room 304 (DCN Remedial)'),
    buildSlot('slot_sat_3', 'SATURDAY', 3, '11:00', '11:55', 'sub_mfca', 'user_prof_mfca', 'Room 306 (MFCA Remedial)'),
    buildSlot('slot_sat_4', 'SATURDAY', 4, '11:55', '12:50', 'sub_mentoring', 'user_prof_sharma', 'Faculty Room (Mentoring)'),
    buildSlot('slot_sat_5', 'SATURDAY', 5, '13:25', '14:20', 'sub_sparks', 'user_prof_sharma', 'Auditorium (SPARKS Club)'),
    buildSlot('slot_sat_6', 'SATURDAY', 6, '14:20', '15:15', 'sub_sparks', 'user_prof_sharma', 'Auditorium (Guest Lecture)'),
    buildSlot('slot_sat_7', 'SATURDAY', 7, '15:15', '16:10', 'sub_sparks', 'user_prof_sharma', 'Auditorium (Alumni Talks)'),
  ],
};

export const TODAY_DATE = new Date().toISOString().split('T')[0];

export const INITIAL_CLASS_SESSIONS: ClassSession[] = [];

export function generateInitialAttendance(): AttendanceRecord[] {
  return [];
}

export const INITIAL_CHANGE_LOGS: ChangeLog[] = [];

export const INITIAL_ANNOUNCEMENTS: Announcement[] = [
  {
    announcementId: 'ann_mca_01',
    professorId: 'user_prof_sharma',
    professorName: 'Prof. Dr. Rajesh Sharma',
    subjectId: 'sub_aos',
    subjectName: 'Advanced Operating Systems (AOS)',
    title: 'Welcome to MCA Odd Semester 2026 - 2027',
    message: 'Welcome students! Timetable is active. Please check your assigned labs and lecture rooms.',
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    notificationId: 'notif_welcome_mca',
    recipientId: 'user_student_main',
    recipientRole: 'STUDENT',
    title: 'MCA Timetable Published',
    message: 'Official timetable for Odd Semester 2026-2027 (Sec A) is now active.',
    type: 'TIMETABLE_PUBLISHED',
    read: false,
    createdAt: new Date().toISOString(),
    deliveryStatus: 'DELIVERED',
  },
];

export const INITIAL_REMINDER_JOBS: ReminderJob[] = [];
