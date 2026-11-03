import type {
  User,
  StudentRecord,
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
  OverallAttendanceSummary,
  SubjectAttendanceSummary,
  AttendanceStatus,
  ClassStatus,
  TimetableDocument,
  ReminderJob,
  QuestionPaper,
  StudyMaterial,
  SupportRequest
} from '../types';

import {
  INITIAL_SETTINGS,
  INITIAL_DEPARTMENTS,
  INITIAL_STUDENT_RECORDS,
  INITIAL_USERS,
  INITIAL_SUBJECTS,
  INITIAL_ENROLLMENTS,
  INITIAL_TIMETABLE,
  INITIAL_CLASS_SESSIONS,
  generateInitialAttendance,
  INITIAL_CHANGE_LOGS,
  INITIAL_ANNOUNCEMENTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_REMINDER_JOBS,
  INITIAL_TIMETABLE_DOCUMENTS,
  INITIAL_QUESTION_PAPERS,
  INITIAL_STUDY_MATERIALS,
  INITIAL_SUPPORT_REQUESTS,
  TODAY_DATE
} from '../mock/demoData';

const STORAGE_KEYS = {
  SETTINGS: 'cc_settings_v1',
  USERS: 'cc_users_v1',
  STUDENT_RECORDS: 'cc_student_records_v1',
  DEPARTMENTS: 'cc_departments_v1',
  SUBJECTS: 'cc_subjects_v1',
  ENROLLMENTS: 'cc_enrollments_v1',
  TIMETABLES: 'cc_timetables_v1',
  SESSIONS: 'cc_sessions_v1',
  ATTENDANCE: 'cc_attendance_v1',
  CHANGE_LOGS: 'cc_change_logs_v1',
  ANNOUNCEMENTS: 'cc_announcements_v1',
  NOTIFICATIONS: 'cc_notifications_v1',
  REMINDER_JOBS: 'cc_reminder_jobs_v1',
  TIMETABLE_DOCUMENTS: 'cc_timetable_docs_v1',
  QUESTION_PAPERS: 'cc_question_papers_v1',
  STUDY_MATERIALS: 'cc_study_materials_v1',
  SUPPORT_REQUESTS: 'cc_support_requests_v1',
};

class DataService {
  private getStorage<T>(key: string, defaultVal: T): T {
    try {
      const data = localStorage.getItem(key);
      if (!data) {
        localStorage.setItem(key, JSON.stringify(defaultVal));
        return defaultVal;
      }
      return JSON.parse(data) as T;
    } catch {
      return defaultVal;
    }
  }

  private setStorage<T>(key: string, val: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.error('Storage write error', e);
    }
  }

  public resetAllData(): void {
    localStorage.clear();
    this.setStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
    this.setStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    this.setStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    this.setStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    this.setStorage(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
    this.setStorage(STORAGE_KEYS.TIMETABLES, [INITIAL_TIMETABLE]);
    this.setStorage(STORAGE_KEYS.SESSIONS, INITIAL_CLASS_SESSIONS);
    this.setStorage(STORAGE_KEYS.ATTENDANCE, generateInitialAttendance());
    this.setStorage(STORAGE_KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOGS);
    this.setStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
    this.setStorage(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    this.setStorage(STORAGE_KEYS.REMINDER_JOBS, INITIAL_REMINDER_JOBS);
  }

  // --- SETTINGS ---
  public getSettings(): CollegeSettings {
    return this.getStorage(STORAGE_KEYS.SETTINGS, INITIAL_SETTINGS);
  }

  public updateSettings(settings: Partial<CollegeSettings>): CollegeSettings {
    const current = this.getSettings();
    const updated = { ...current, ...settings };
    this.setStorage(STORAGE_KEYS.SETTINGS, updated);
    return updated;
  }

  // --- AUTH & USERS ---
  public getUsers(): User[] {
    const users = this.getStorage<User[]>(STORAGE_KEYS.USERS, INITIAL_USERS);
    // Ensure standard starter accounts always exist so user is never locked out
    let modified = false;
    for (const starter of INITIAL_USERS) {
      if (!users.some((u) => u.email.toLowerCase() === starter.email.toLowerCase())) {
        users.push(starter);
        modified = true;
      }
    }
    if (modified) {
      this.setStorage(STORAGE_KEYS.USERS, users);
    }
    return users;
  }

  public getUserById(userId: string): User | undefined {
    return this.getUsers().find((u) => u.userId === userId);
  }

  public getUserByEmail(email: string): User | undefined {
    const clean = email.trim().toLowerCase();
    const exact = this.getUsers().find((u) => u.email.toLowerCase() === clean);
    if (exact) return exact;

    // Friendly matching: allow entering just "admin", "professor", or "student"
    if (clean === 'admin' || clean === 'admin@college.edu') {
      return this.getUsers().find((u) => u.role === 'ADMIN');
    }
    if (clean === 'professor' || clean === 'prof' || clean === 'professor@college.edu') {
      return this.getUsers().find((u) => u.role === 'PROFESSOR');
    }
    if (clean === 'student' || clean === 'student@college.edu') {
      return this.getUsers().find((u) => u.role === 'STUDENT');
    }
    return undefined;
  }

  public createUser(userData: Omit<User, 'userId' | 'createdAt'>): User {
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === userData.email.toLowerCase())) {
      throw new Error('A user with this college email already exists.');
    }
    const newUser: User = {
      ...userData,
      userId: `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    users.push(newUser);
    this.setStorage(STORAGE_KEYS.USERS, users);

    // If new student, auto-enroll in department subjects
    if (newUser.role === 'STUDENT' && newUser.studentGroupId) {
      const subjects = this.getSubjects().filter(s => s.departmentId === newUser.departmentId);
      subjects.forEach(sub => {
        this.enrollStudent(newUser.userId, sub.subjectId, '5');
      });
    }

    return newUser;
  }

  public updateUser(userId: string, updates: Partial<User>): User {
    const users = this.getUsers();
    const idx = users.findIndex((u) => u.userId === userId);
    if (idx === -1) throw new Error('User not found');
    users[idx] = { ...users[idx], ...updates };
    this.setStorage(STORAGE_KEYS.USERS, users);
    return users[idx];
  }

  // --- DEPARTMENTS & SUBJECTS ---
  public getDepartments(): Department[] {
    const depts = this.getStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
    if (!depts || depts.length === 0 || !depts.some((d) => d.departmentId === 'dept_mca')) {
      this.setStorage(STORAGE_KEYS.DEPARTMENTS, INITIAL_DEPARTMENTS);
      return INITIAL_DEPARTMENTS;
    }
    return depts;
  }

  public getSubjects(): Subject[] {
    const subs = this.getStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
    if (!subs || subs.length === 0) {
      this.setStorage(STORAGE_KEYS.SUBJECTS, INITIAL_SUBJECTS);
      return INITIAL_SUBJECTS;
    }
    return subs;
  }

  public getSubjectById(subjectId: string): Subject | undefined {
    return this.getSubjects().find((s) => s.subjectId === subjectId);
  }

  public createSubject(data: Omit<Subject, 'subjectId'>): Subject {
    const subjects = this.getSubjects();
    const newSubject: Subject = {
      ...data,
      subjectId: `sub_${Date.now()}`,
    };
    subjects.push(newSubject);
    this.setStorage(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject;
  }

  public updateSubject(subjectId: string, updates: Partial<Subject>): Subject {
    const subjects = this.getSubjects();
    const idx = subjects.findIndex((s) => s.subjectId === subjectId);
    if (idx === -1) throw new Error('Subject not found');
    subjects[idx] = { ...subjects[idx], ...updates };
    this.setStorage(STORAGE_KEYS.SUBJECTS, subjects);
    return subjects[idx];
  }

  // --- ENROLLMENTS ---
  public getEnrollments(): StudentSubject[] {
    const enrs = this.getStorage(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
    if (!enrs || enrs.length === 0) {
      this.setStorage(STORAGE_KEYS.ENROLLMENTS, INITIAL_ENROLLMENTS);
      return INITIAL_ENROLLMENTS;
    }
    return enrs;
  }

  public enrollStudent(studentId: string, subjectId: string, semester: string): void {
    const enrollments = this.getEnrollments();
    if (!enrollments.some((e) => e.studentId === studentId && e.subjectId === subjectId)) {
      enrollments.push({
        enrollmentId: `enr_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        studentId,
        subjectId,
        semester,
      });
      this.setStorage(STORAGE_KEYS.ENROLLMENTS, enrollments);
    }
  }

  public getStudentEnrolledSubjects(studentId: string): Subject[] {
    const enrollments = this.getEnrollments().filter((e) => e.studentId === studentId);
    const subjectIds = new Set(enrollments.map((e) => e.subjectId));
    return this.getSubjects().filter((s) => subjectIds.has(s.subjectId));
  }

  public getEnrolledStudentsForSubject(subjectId: string): User[] {
    const enrollments = this.getEnrollments().filter((e) => e.subjectId === subjectId);
    const studentIds = new Set(enrollments.map((e) => e.studentId));
    return this.getUsers().filter((u) => studentIds.has(u.userId) && u.active);
  }

  // --- PERMANENT TIMETABLE ---
  public getTimetables(): Timetable[] {
    const tts = this.getStorage<Timetable[]>(STORAGE_KEYS.TIMETABLES, [INITIAL_TIMETABLE]);
    // Ensure the timetable always has the official MCA periods if empty
    if (!tts || tts.length === 0 || tts[0].weeklySchedule.length === 0) {
      this.setStorage(STORAGE_KEYS.TIMETABLES, [INITIAL_TIMETABLE]);
      return [INITIAL_TIMETABLE];
    }
    return tts;
  }

  public getTimetableById(id: string): Timetable | undefined {
    return this.getTimetables().find((t) => t.timetableId === id);
  }

  public updateTimetableSlot(
    adminUserId: string,
    timetableId: string,
    slotId: string,
    slotUpdates: Partial<TimetableSlot>
  ): Timetable {
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Only administrators can modify the permanent college timetable.');
    }

    const timetables = this.getTimetables();
    const tt = timetables.find((t) => t.timetableId === timetableId);
    if (!tt) throw new Error('Timetable not found');

    const slotIndex = tt.weeklySchedule.findIndex((s) => s.id === slotId);
    if (slotIndex === -1) throw new Error('Timetable slot not found');

    tt.weeklySchedule[slotIndex] = { ...tt.weeklySchedule[slotIndex], ...slotUpdates };
    this.setStorage(STORAGE_KEYS.TIMETABLES, timetables);
    return tt;
  }

  public addTimetableSlot(adminUserId: string, timetableId: string, slotData: Omit<TimetableSlot, 'id'>): Timetable {
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Only administrators can modify the permanent college timetable.');
    }

    const timetables = this.getTimetables();
    const tt = timetables.find((t) => t.timetableId === timetableId);
    if (!tt) throw new Error('Timetable not found');

    const newSlot: TimetableSlot = {
      ...slotData,
      id: `slot_${Date.now()}`,
    };
    tt.weeklySchedule.push(newSlot);
    this.setStorage(STORAGE_KEYS.TIMETABLES, timetables);
    return tt;
  }

  public getTimetableDocuments(): TimetableDocument[] {
    const docs = this.getStorage<TimetableDocument[]>(STORAGE_KEYS.TIMETABLE_DOCUMENTS, INITIAL_TIMETABLE_DOCUMENTS);
    if (!docs || docs.length === 0) {
      this.setStorage(STORAGE_KEYS.TIMETABLE_DOCUMENTS, INITIAL_TIMETABLE_DOCUMENTS);
      return INITIAL_TIMETABLE_DOCUMENTS;
    }
    return docs;
  }

  public saveTimetableDocument(doc: Omit<TimetableDocument, 'docId' | 'uploadedAt'>): TimetableDocument {
    const docs = this.getTimetableDocuments();
    const newDoc: TimetableDocument = {
      ...doc,
      docId: `doc_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    docs.unshift(newDoc);
    this.setStorage(STORAGE_KEYS.TIMETABLE_DOCUMENTS, docs);
    return newDoc;
  }

  public deleteTimetableDocument(docId: string): void {
    const docs = this.getTimetableDocuments().filter((d) => d.docId !== docId);
    this.setStorage(STORAGE_KEYS.TIMETABLE_DOCUMENTS, docs);
  }

  public deleteTimetableSlot(adminUserId: string, timetableId: string, slotId: string): Timetable {
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Only administrators can modify the timetable.');
    }
    const timetables = this.getTimetables();
    const tt = timetables.find((t) => t.timetableId === timetableId);
    if (!tt) throw new Error('Timetable not found');

    tt.weeklySchedule = tt.weeklySchedule.filter((s) => s.id !== slotId);
    this.setStorage(STORAGE_KEYS.TIMETABLES, timetables);
    return tt;
  }

  public importTimetableSlots(adminUserId: string, timetableId: string, slots: Omit<TimetableSlot, 'id'>[]): Timetable {
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Only administrators can import timetable slots.');
    }
    const timetables = this.getTimetables();
    const tt = timetables.find((t) => t.timetableId === timetableId);
    if (!tt) throw new Error('Timetable not found');

    const formattedSlots: TimetableSlot[] = slots.map((s, idx) => ({
      ...s,
      id: `slot_${Date.now()}_${idx}`,
    }));

    tt.weeklySchedule = formattedSlots;
    this.setStorage(STORAGE_KEYS.TIMETABLES, timetables);
    this.generateWeeklySessionsFromTimetable();
    return tt;
  }

  public generateWeeklySessionsFromTimetable(): void {
    const timetables = this.getTimetables();
    const tt = timetables[0];
    if (!tt || tt.weeklySchedule.length === 0) return;

    const dayOffsets: Record<string, number> = {
      MONDAY: 0,
      TUESDAY: 1,
      WEDNESDAY: 2,
      THURSDAY: 3,
      FRIDAY: 4,
      SATURDAY: 5,
    };

    const now = new Date();
    // Find current Monday
    const currentDay = now.getDay();
    const distanceToMonday = (currentDay + 6) % 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - distanceToMonday);

    const existingSessions = this.getSessions();
    const newSessions: ClassSession[] = [...existingSessions];

    tt.weeklySchedule.forEach((slot) => {
      const offset = dayOffsets[slot.dayOfWeek] ?? 0;
      const sessionDate = new Date(monday);
      sessionDate.setDate(monday.getDate() + offset);
      const dateStr = sessionDate.toISOString().split('T')[0];

      // Check if session for this slot and date already exists
      const exists = newSessions.some(
        (s) => s.timetableId === tt.timetableId && s.subjectId === slot.subjectId && s.date === dateStr && s.startTime === slot.startTime
      );

      if (!exists) {
        newSessions.push({
          sessionId: `sess_${dateStr}_${slot.periodNumber}_${slot.subjectId}`,
          timetableId: tt.timetableId,
          subjectId: slot.subjectId,
          professorId: slot.professorId,
          studentGroupId: tt.studentGroupId,
          date: dateStr,
          dayOfWeek: slot.dayOfWeek,
          startTime: slot.startTime,
          endTime: slot.endTime,
          room: slot.room,
          status: 'ON',
          version: 1,
        });
      }
    });

    this.setStorage(STORAGE_KEYS.SESSIONS, newSessions);
  }

  // Check conflict for scheduling (professor, room, group conflicts)
  public checkTimetableConflicts(
    candidate: Omit<TimetableSlot, 'id'>,
    timetableId: string,
    currentSlotId?: string
  ): { hasConflict: boolean; reason?: string } {
    const tt = this.getTimetableById(timetableId);
    if (!tt) return { hasConflict: false };

    const slots = tt.weeklySchedule.filter((s) => s.id !== currentSlotId && s.dayOfWeek === candidate.dayOfWeek);

    for (const slot of slots) {
      const timesOverlap =
        (candidate.startTime >= slot.startTime && candidate.startTime < slot.endTime) ||
        (candidate.endTime > slot.startTime && candidate.endTime <= slot.endTime) ||
        (candidate.startTime <= slot.startTime && candidate.endTime >= slot.endTime);

      if (timesOverlap) {
        if (slot.periodNumber === candidate.periodNumber) {
          return {
            hasConflict: true,
            reason: `Period ${candidate.periodNumber} is already allocated on ${candidate.dayOfWeek}.`,
          };
        }
        if (slot.professorId === candidate.professorId) {
          const prof = this.getUserById(slot.professorId);
          return {
            hasConflict: true,
            reason: `Professor conflict: ${prof?.name || 'Faculty'} is already booked on ${candidate.dayOfWeek} at ${slot.startTime} - ${slot.endTime}.`,
          };
        }
        if (slot.room.toLowerCase() === candidate.room.toLowerCase()) {
          return {
            hasConflict: true,
            reason: `Room conflict: ${candidate.room} is already assigned on ${candidate.dayOfWeek} at ${slot.startTime} - ${slot.endTime}.`,
          };
        }
      }
    }

    return { hasConflict: false };
  }

  // SAVE TIMETABLE & NOTIFY USERS (replaces the confusing "publish" wording)
  public saveTimetableAndNotify(adminUserId: string, timetableId: string): Timetable {
    const admin = this.getUserById(adminUserId);
    if (!admin || admin.role !== 'ADMIN') {
      throw new Error('UNAUTHORIZED: Only administrators can save and broadcast the college timetable.');
    }

    const timetables = this.getTimetables();
    const tt = timetables.find((t) => t.timetableId === timetableId);
    if (!tt) throw new Error('Timetable not found');

    tt.version += 1;
    tt.isPublished = true;
    tt.publishedAt = new Date().toISOString();
    this.setStorage(STORAGE_KEYS.TIMETABLES, timetables);

    // Automatically generate real dated sessions for this week based on the saved timetable
    this.generateWeeklySessionsFromTimetable();

    // Notify all active students and professors
    const users = this.getUsers().filter((u) => u.active && (u.role === 'STUDENT' || u.role === 'PROFESSOR'));
    users.forEach((recipient) => {
      this.sendNotification({
        recipientId: recipient.userId,
        recipientRole: recipient.role,
        title: 'Timetable Saved & Active',
        message: `Permanent academic timetable updated to Version ${tt.version}. Please check your updated weekly schedule.`,
        type: 'TIMETABLE_SAVED',
        targetPage: 'weekly-timetable',
      });
    });

    return tt;
  }

  public publishPermanentTimetable(adminUserId: string, timetableId: string): Timetable {
    return this.saveTimetableAndNotify(adminUserId, timetableId);
  }

  // --- CLASS SESSIONS ---
  public getSessions(): ClassSession[] {
    return this.getStorage(STORAGE_KEYS.SESSIONS, INITIAL_CLASS_SESSIONS);
  }

  public getSessionById(sessionId: string): ClassSession | undefined {
    return this.getSessions().find((s) => s.sessionId === sessionId);
  }

  public getTodaySessions(): ClassSession[] {
    return this.getSessions().filter((s) => s.date === TODAY_DATE);
  }

  public getSessionsForStudent(studentId: string, date?: string): ClassSession[] {
    const student = this.getUserById(studentId);
    if (!student) return [];
    const enrolledSubjects = new Set(this.getStudentEnrolledSubjects(studentId).map((s) => s.subjectId));

    return this.getSessions().filter((s) => {
      const matchSubject = enrolledSubjects.has(s.subjectId);
      const matchGroup = !s.studentGroupId || s.studentGroupId === student.studentGroupId;
      const matchDate = date ? s.date === date : true;
      return matchSubject && matchGroup && matchDate;
    });
  }

  public getSessionsForProfessor(professorId: string, date?: string): ClassSession[] {
    return this.getSessions().filter((s) => {
      const matchProf = s.professorId === professorId;
      const matchDate = date ? s.date === date : true;
      return matchProf && matchDate;
    });
  }

  // --- ATTENDANCE SYSTEM ---
  public getAttendanceRecords(): AttendanceRecord[] {
    return this.getStorage(STORAGE_KEYS.ATTENDANCE, generateInitialAttendance());
  }

  public getAttendanceForSession(sessionId: string): AttendanceRecord[] {
    return this.getAttendanceRecords().filter((r) => r.sessionId === sessionId);
  }

  /**
   * STRICT SUBJECT PERMISSION ATTENDANCE MARKING
   * A professor can mark attendance ONLY for their assigned subject and authorized class session.
   */
  public markAttendance(
    professorId: string,
    sessionId: string,
    studentAttendances: { studentId: string; status: AttendanceStatus }[]
  ): { success: boolean; count: number } {
    const professor = this.getUserById(professorId);
    if (!professor || professor.role !== 'PROFESSOR') {
      throw new Error('UNAUTHORIZED: Only verified professors can submit class attendance.');
    }

    const session = this.getSessionById(sessionId);
    if (!session) {
      throw new Error('Class session not found.');
    }

    const subject = this.getSubjectById(session.subjectId);
    const assignedProf = this.getUserById(session.professorId);

    // STRICT CHECK: Professor must own this assigned session & subject
    if (session.professorId !== professorId) {
      const assignedName = assignedProf ? assignedProf.name : 'another professor';
      const subjectName = subject ? subject.name : session.subjectId;
      throw new Error(
        `PERMISSION_DENIED: Professor ${professor.name} is not authorized to mark attendance for ${subjectName}. This subject session is assigned to ${assignedName}.`
      );
    }

    const attendanceRecords = this.getAttendanceRecords();
    const now = new Date().toISOString();

    studentAttendances.forEach(({ studentId, status }) => {
      const existingIndex = attendanceRecords.findIndex(
        (r) => r.sessionId === sessionId && r.studentId === studentId
      );

      if (existingIndex !== -1) {
        attendanceRecords[existingIndex] = {
          ...attendanceRecords[existingIndex],
          status,
          updatedAt: now,
        };
      } else {
        attendanceRecords.push({
          attendanceId: `att_${sessionId}_${studentId}`,
          sessionId,
          subjectId: session.subjectId,
          professorId,
          studentId,
          status,
          markedAt: now,
        });
      }

      // If marked absent, send immediate in-app and push notification!
      if (status === 'ABSENT') {
        const subjectTitle = subject ? subject.name : 'Class';
        this.sendNotification({
          recipientId: studentId,
          recipientRole: 'STUDENT',
          title: 'Attendance Alert',
          message: `You were marked ABSENT for ${subjectTitle} on ${session.date} (${session.startTime} - ${session.endTime}).`,
          type: 'STUDENT_MARKED_ABSENT',
          sessionId,
          subjectId: session.subjectId,
        });
      }
    });

    this.setStorage(STORAGE_KEYS.ATTENDANCE, attendanceRecords);
    return { success: true, count: studentAttendances.length };
  }

  // --- ATTENDANCE CALCULATION ENGINE ---
  public getAttendanceSummaryForStudent(studentId: string): OverallAttendanceSummary {
    const settings = this.getSettings();
    const enrolledSubjects = this.getStudentEnrolledSubjects(studentId);
    const attendanceRecords = this.getAttendanceRecords().filter((r) => r.studentId === studentId);
    const sessions = this.getSessions();

    const subjectSummaries: SubjectAttendanceSummary[] = enrolledSubjects.map((subject) => {
      // Find all finalized held sessions for this subject where attendance exists and status != CANCELLED
      const heldSessions = sessions.filter(
        (s) =>
          s.subjectId === subject.subjectId &&
          s.status !== 'CANCELLED' &&
          (s.date < TODAY_DATE || (s.date === TODAY_DATE && attendanceRecords.some((r) => r.sessionId === s.sessionId)))
      );

      const heldSessionIds = new Set(heldSessions.map((s) => s.sessionId));
      const subjectRecords = attendanceRecords.filter((r) => heldSessionIds.has(r.sessionId));

      const totalHeld = heldSessions.length;
      const attended = subjectRecords.filter((r) => r.status === 'PRESENT' || r.status === 'LATE').length;
      const absences = subjectRecords.filter((r) => r.status === 'ABSENT').length;

      const percentage = totalHeld > 0 ? Math.round((attended / totalHeld) * 100) : 100;

      // Status color according to admin configured thresholds
      let statusColor: 'green' | 'yellow' | 'red' = 'green';
      if (percentage < settings.warningAttendanceThreshold) {
        statusColor = 'red';
      } else if (percentage < settings.minAttendanceThreshold) {
        statusColor = 'yellow';
      }

      // Calculate consecutive classes needed to reach threshold
      let consecutiveNeeded = 0;
      if (percentage < settings.minAttendanceThreshold && totalHeld > 0) {
        const targetFrac = settings.minAttendanceThreshold / 100;
        const required = Math.ceil((targetFrac * totalHeld - attended) / (1 - targetFrac));
        consecutiveNeeded = Math.max(0, required);
      }

      const prof = this.getUserById(subject.professorId);

      return {
        subjectId: subject.subjectId,
        subjectName: subject.name,
        subjectCode: subject.code,
        professorName: prof ? prof.name : 'Faculty',
        attended,
        totalHeld,
        absences,
        percentage,
        consecutiveNeeded,
        statusColor,
      };
    });

    const totalAttended = subjectSummaries.reduce((sum, s) => sum + s.attended, 0);
    const totalHeld = subjectSummaries.reduce((sum, s) => sum + s.totalHeld, 0);
    const totalAbsences = subjectSummaries.reduce((sum, s) => sum + s.absences, 0);
    const overallPercentage = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 100) : 100;

    let overallColor: 'green' | 'yellow' | 'red' = 'green';
    if (overallPercentage < settings.warningAttendanceThreshold) {
      overallColor = 'red';
    } else if (overallPercentage < settings.minAttendanceThreshold) {
      overallColor = 'yellow';
    }

    return {
      totalAttended,
      totalHeld,
      totalAbsences,
      percentage: overallPercentage,
      statusColor: overallColor,
      subjects: subjectSummaries,
    };
  }

  // --- MANDATORY PROFESSOR RESCHEDULING POLICY: INSTANT-LOG ---
  public rescheduleSession(
    professorId: string,
    sessionId: string,
    newDate: string,
    newStartTime: string,
    newEndTime: string,
    newRoom: string,
    reason: string
  ): { session: ClassSession; changeLog: ChangeLog } {
    const professor = this.getUserById(professorId);
    if (!professor || professor.role !== 'PROFESSOR') {
      throw new Error('UNAUTHORIZED: Only authenticated professors can reschedule classes.');
    }

    const sessions = this.getSessions();
    const sessionIndex = sessions.findIndex((s) => s.sessionId === sessionId);
    if (sessionIndex === -1) {
      throw new Error('Class session not found.');
    }

    const oldSession = sessions[sessionIndex];

    // Verify ownership
    if (oldSession.professorId !== professorId) {
      throw new Error('PERMISSION_DENIED: You can only reschedule sessions assigned to you.');
    }

    const subject = this.getSubjectById(oldSession.subjectId);
    const subjectName = subject ? subject.name : 'Assigned Class';

    // 1. Snapshot old state
    const oldDate = oldSession.date;
    const oldTime = `${oldSession.startTime} - ${oldSession.endTime}`;
    const oldRoom = oldSession.room;

    // 2. Increment session version and update session
    const updatedVersion = oldSession.version + 1;
    const updatedSession: ClassSession = {
      ...oldSession,
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      room: newRoom,
      version: updatedVersion,
      rescheduleReason: reason,
      updatedAt: new Date().toISOString(),
    };
    sessions[sessionIndex] = updatedSession;
    this.setStorage(STORAGE_KEYS.SESSIONS, sessions);

    // 3. Create immutable audit record
    const changeLogs = this.getChangeLogs();
    const newChangeLog: ChangeLog = {
      changeId: `change_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sessionId,
      professorId,
      professorName: professor.name,
      subjectName,
      oldDate,
      newDate,
      oldTime,
      newTime: `${newStartTime} - ${newEndTime}`,
      oldRoom,
      newRoom,
      reason: reason || 'Class time/venue adjustment by professor',
      timestamp: new Date().toISOString(),
      sessionVersion: updatedVersion,
      notificationDeliveryStatus: 'DELIVERED',
    };
    changeLogs.unshift(newChangeLog);
    this.setStorage(STORAGE_KEYS.CHANGE_LOGS, changeLogs);

    // 4. Invalidate old reminder jobs and schedule new
    const reminderJobs = this.getReminderJobs();
    reminderJobs.forEach((job) => {
      if (job.sessionId === sessionId && job.status === 'SCHEDULED') {
        job.status = 'INVALIDATED';
      }
    });

    const newReminderTime = new Date(`${newDate}T${newStartTime}:00`);
    newReminderTime.setMinutes(newReminderTime.getMinutes() - 10);

    reminderJobs.push({
      reminderId: `rem_${sessionId}_v${updatedVersion}`,
      sessionId,
      scheduledAt: newReminderTime.toISOString(),
      sessionVersion: updatedVersion,
      status: 'SCHEDULED',
    });
    this.setStorage(STORAGE_KEYS.REMINDER_JOBS, reminderJobs);

    // 5. Notify all enrolled students
    const enrolledStudents = this.getEnrolledStudentsForSubject(oldSession.subjectId);
    enrolledStudents.forEach((student) => {
      this.sendNotification({
        recipientId: student.userId,
        recipientRole: 'STUDENT',
        title: `Class Rescheduled: ${subjectName}`,
        message: `Your class has been moved to ${newDate} (${newStartTime} - ${newEndTime}) in ${newRoom}. Reason: ${reason || 'Updated by professor'}.`,
        type: 'CLASS_RESCHEDULED',
        sessionId,
        subjectId: oldSession.subjectId,
      });
    });

    // 6. Notify assigned professor
    this.sendNotification({
      recipientId: professorId,
      recipientRole: 'PROFESSOR',
      title: `Reschedule Confirmed: ${subjectName}`,
      message: `Successfully rescheduled to ${newDate} (${newStartTime} - ${newEndTime}) in ${newRoom}.`,
      type: 'CLASS_RESCHEDULED',
      sessionId,
      subjectId: oldSession.subjectId,
    });

    // 7. Notify all admins
    const admins = this.getUsers().filter((u) => u.role === 'ADMIN');
    admins.forEach((admin) => {
      this.sendNotification({
        recipientId: admin.userId,
        recipientRole: 'ADMIN',
        title: `Professor Rescheduled Class: ${subjectName}`,
        message: `${professor.name} updated session ${sessionId} to ${newDate} ${newStartTime} (Room: ${newRoom}). Audit log generated.`,
        type: 'CLASS_RESCHEDULED',
        sessionId,
        subjectId: oldSession.subjectId,
      });
    });

    return { session: updatedSession, changeLog: newChangeLog };
  }

  // --- CLASS STATUS CHANGE (ON / CANCELLED / POSTPONED) ---
  public updateClassStatus(
    professorId: string,
    sessionId: string,
    newStatus: ClassStatus,
    reason?: string
  ): ClassSession {
    const professor = this.getUserById(professorId);
    if (!professor || professor.role !== 'PROFESSOR') {
      throw new Error('UNAUTHORIZED: Only professors can change class status.');
    }

    const sessions = this.getSessions();
    const idx = sessions.findIndex((s) => s.sessionId === sessionId);
    if (idx === -1) throw new Error('Session not found');

    const session = sessions[idx];
    if (session.professorId !== professorId) {
      throw new Error('PERMISSION_DENIED: You can only update your own assigned classes.');
    }

    const subject = this.getSubjectById(session.subjectId);
    const subjectName = subject ? subject.name : 'Class';

    session.status = newStatus;
    if (newStatus === 'CANCELLED') {
      session.cancellationReason = reason || 'Cancelled by instructor';
    }
    session.version += 1;
    session.updatedAt = new Date().toISOString();
    sessions[idx] = session;
    this.setStorage(STORAGE_KEYS.SESSIONS, sessions);

    // Invalidate reminders if cancelled
    if (newStatus === 'CANCELLED') {
      const jobs = this.getReminderJobs();
      jobs.forEach((j) => {
        if (j.sessionId === sessionId && j.status === 'SCHEDULED') j.status = 'INVALIDATED';
      });
      this.setStorage(STORAGE_KEYS.REMINDER_JOBS, jobs);
    }

    // Notify students
    const notifType = newStatus === 'CANCELLED' ? 'CLASS_CANCELLED' : newStatus === 'POSTPONED' ? 'CLASS_POSTPONED' : 'CLASS_CONFIRMED';
    const students = this.getEnrolledStudentsForSubject(session.subjectId);
    students.forEach((s) => {
      this.sendNotification({
        recipientId: s.userId,
        recipientRole: 'STUDENT',
        title: `Class Status Updated: ${subjectName}`,
        message: `Class for ${session.date} (${session.startTime}) is now marked as ${newStatus}. ${reason ? `Note: ${reason}` : ''}`,
        type: notifType,
        sessionId,
        subjectId: session.subjectId,
      });
    });

    return session;
  }

  // --- AUDIT LOGS ---
  public getChangeLogs(): ChangeLog[] {
    return this.getStorage(STORAGE_KEYS.CHANGE_LOGS, INITIAL_CHANGE_LOGS);
  }

  // --- ANNOUNCEMENTS ---
  public getAnnouncements(): Announcement[] {
    return this.getStorage(STORAGE_KEYS.ANNOUNCEMENTS, INITIAL_ANNOUNCEMENTS);
  }

  public getAnnouncementsForSubject(subjectId: string): Announcement[] {
    return this.getAnnouncements().filter((a) => a.subjectId === subjectId);
  }

  public createAnnouncement(professorId: string, subjectId: string, title: string, message: string): Announcement {
    const professor = this.getUserById(professorId);
    if (!professor || professor.role !== 'PROFESSOR') {
      throw new Error('UNAUTHORIZED: Only professors can publish announcements.');
    }

    const subject = this.getSubjectById(subjectId);
    if (!subject || subject.professorId !== professorId) {
      throw new Error('PERMISSION_DENIED: You can only publish announcements for your assigned subjects.');
    }

    const announcements = this.getAnnouncements();
    const newAnnouncement: Announcement = {
      announcementId: `ann_${Date.now()}`,
      professorId,
      professorName: professor.name,
      subjectId,
      subjectName: subject.name,
      title,
      message,
      createdAt: new Date().toISOString(),
    };
    announcements.unshift(newAnnouncement);
    this.setStorage(STORAGE_KEYS.ANNOUNCEMENTS, announcements);

    // Notify enrolled students
    const students = this.getEnrolledStudentsForSubject(subjectId);
    students.forEach((student) => {
      this.sendNotification({
        recipientId: student.userId,
        recipientRole: 'STUDENT',
        title: `Announcement: ${subject.name}`,
        message: `${title} - ${message.slice(0, 80)}...`,
        type: 'PROFESSOR_ANNOUNCEMENT',
        subjectId,
      });
    });

    return newAnnouncement;
  }

  // --- NOTIFICATIONS ---
  public getNotifications(recipientId: string): NotificationItem[] {
    const all = this.getStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    return all.filter((n) => n.recipientId === recipientId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getAllNotificationsForAdmin(): NotificationItem[] {
    return this.getStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public sendNotification(item: Omit<NotificationItem, 'notificationId' | 'read' | 'createdAt' | 'deliveryStatus'>): NotificationItem {
    const all = this.getStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const newNotification: NotificationItem = {
      ...item,
      notificationId: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      read: false,
      createdAt: new Date().toISOString(),
      deliveryStatus: 'DELIVERED',
    };
    all.unshift(newNotification);
    this.setStorage(STORAGE_KEYS.NOTIFICATIONS, all);
    return newNotification;
  }

  public markNotificationAsRead(notificationId: string): void {
    const all = this.getStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    const idx = all.findIndex((n) => n.notificationId === notificationId);
    if (idx !== -1) {
      all[idx].read = true;
      this.setStorage(STORAGE_KEYS.NOTIFICATIONS, all);
    }
  }

  public markAllNotificationsAsRead(recipientId: string): void {
    const all = this.getStorage<NotificationItem[]>(STORAGE_KEYS.NOTIFICATIONS, INITIAL_NOTIFICATIONS);
    all.forEach((n) => {
      if (n.recipientId === recipientId) n.read = true;
    });
    this.setStorage(STORAGE_KEYS.NOTIFICATIONS, all);
  }

  public getUnreadNotificationCount(recipientId: string): number {
    return this.getNotifications(recipientId).filter((n) => !n.read).length;
  }

  // --- REMINDER JOBS (10-minute automated reminders) ---
  public getReminderJobs(): ReminderJob[] {
    return this.getStorage(STORAGE_KEYS.REMINDER_JOBS, INITIAL_REMINDER_JOBS);
  }

  /**
   * Simulates or triggers the 10-minute class reminder job.
   * Can be run automatically or via the interactive demo test runner.
   */
  public trigger10MinuteReminder(sessionId: string): { dispatched: number; sessionTitle: string } {
    const session = this.getSessionById(sessionId);
    if (!session) throw new Error('Session not found for reminder.');
    if (session.status === 'CANCELLED') throw new Error('Cannot send reminders for cancelled sessions.');

    const subject = this.getSubjectById(session.subjectId);
    const subjectName = subject ? subject.name : 'Class';

    const enrolledStudents = this.getEnrolledStudentsForSubject(session.subjectId);
    let count = 0;

    // 1. Notify enrolled students
    enrolledStudents.forEach((student) => {
      this.sendNotification({
        recipientId: student.userId,
        recipientRole: 'STUDENT',
        title: `10-Min Class Reminder: ${subjectName}`,
        message: `Your class begins in 10 minutes at ${session.startTime} in ${session.room}.`,
        type: 'CLASS_REMINDER',
        sessionId: session.sessionId,
        subjectId: session.subjectId,
      });
      count++;
    });

    // 2. Notify assigned professor
    this.sendNotification({
      recipientId: session.professorId,
      recipientRole: 'PROFESSOR',
      title: `Upcoming Lecture Reminder: ${subjectName}`,
      message: `Your class starts in 10 minutes at ${session.startTime} in ${session.room}.`,
      type: 'CLASS_REMINDER',
      sessionId: session.sessionId,
      subjectId: session.subjectId,
    });
    count++;

    return { dispatched: count, sessionTitle: `${subjectName} (${session.startTime}, ${session.room})` };
  }

  // --- PRELOADED COLLEGE STUDENT RECORDS & REGISTRATION ---
  public getStudentRecords(): StudentRecord[] {
    return this.getStorage<StudentRecord[]>(STORAGE_KEYS.STUDENT_RECORDS, INITIAL_STUDENT_RECORDS);
  }

  public validateStudentRecord(identifier: string): {
    valid: boolean;
    record?: StudentRecord;
    alreadyRegistered?: boolean;
    error?: string;
  } {
    const clean = identifier.trim().toLowerCase();
    const records = this.getStudentRecords();
    const match = records.find(
      (r) =>
        r.usn.toLowerCase() === clean ||
        r.registerNumber.toLowerCase() === clean ||
        r.admissionNumber.toLowerCase() === clean
    );

    if (!match) {
      return {
        valid: false,
        error: `No college student record found for "${identifier}". Please check your official college admission / register number or contact the administration office.`,
      };
    }

    if (match.isRegistered) {
      return {
        valid: true,
        record: match,
        alreadyRegistered: true,
        error: `Account for ${match.name} (${match.usn}) is already registered. Please sign in directly.`,
      };
    }

    return {
      valid: true,
      record: match,
      alreadyRegistered: false,
    };
  }

  public completeStudentRegistration(params: {
    recordId: string;
    collegeEmail: string;
    phone: string;
    password?: string;
  }): User {
    const records = this.getStudentRecords();
    const recIndex = records.findIndex((r) => r.recordId === params.recordId);
    if (recIndex === -1) {
      throw new Error('College student record not found.');
    }
    const rec = records[recIndex];
    if (rec.isRegistered) {
      throw new Error(`Student ${rec.name} (${rec.usn}) is already registered. Please sign in.`);
    }

    // Verify that the student's college email belongs to the validated college record
    if (rec.collegeEmail.toLowerCase() !== params.collegeEmail.trim().toLowerCase()) {
      throw new Error(
        `Email mismatch: The provided email does not match official college record email (${rec.collegeEmail}).`
      );
    }

    // Prevent duplicate user accounts
    const users = this.getUsers();
    if (users.some((u) => u.email.toLowerCase() === params.collegeEmail.trim().toLowerCase())) {
      throw new Error('A user account with this college email already exists.');
    }

    const newUser: User = {
      userId: `user_student_${Date.now()}`,
      name: rec.name,
      email: rec.collegeEmail.trim().toLowerCase(),
      role: 'STUDENT',
      departmentId: rec.departmentId,
      studentGroupId: 'grp_mca_1a',
      rollNumber: rec.usn,
      usn: rec.usn,
      registerNumber: rec.registerNumber,
      admissionNumber: rec.admissionNumber,
      degree: rec.degree,
      semester: rec.semester,
      phone: params.phone.trim(),
      active: true,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    this.setStorage(STORAGE_KEYS.USERS, users);

    // Mark college student record as registered
    records[recIndex] = {
      ...rec,
      isRegistered: true,
      registeredUserId: newUser.userId,
      registeredAt: new Date().toISOString(),
    };
    this.setStorage(STORAGE_KEYS.STUDENT_RECORDS, records);

    // Auto-enroll student into department semester subjects
    const subjects = this.getSubjects().filter((s) => s.departmentId === rec.departmentId);
    subjects.forEach((sub) => {
      this.enrollStudent(newUser.userId, sub.subjectId, rec.semester);
    });

    return newUser;
  }

  public addStudentRecord(recData: Omit<StudentRecord, 'recordId' | 'isRegistered'>): StudentRecord {
    const records = this.getStudentRecords();
    if (records.some((r) => r.usn.toLowerCase() === recData.usn.toLowerCase())) {
      throw new Error(`Student record with USN ${recData.usn} already exists.`);
    }
    const newRecord: StudentRecord = {
      ...recData,
      recordId: `rec_${Date.now()}`,
      isRegistered: false,
    };
    records.push(newRecord);
    this.setStorage(STORAGE_KEYS.STUDENT_RECORDS, records);
    return newRecord;
  }

  public deleteStudentRecord(recordId: string): void {
    const records = this.getStudentRecords().filter((r) => r.recordId !== recordId);
    this.setStorage(STORAGE_KEYS.STUDENT_RECORDS, records);
  }

  // --- OLD QUESTION PAPERS ---
  public getQuestionPapers(filters?: {
    departmentId?: string;
    semester?: string;
    academicYear?: string;
    subjectId?: string;
  }): QuestionPaper[] {
    let papers = this.getStorage<QuestionPaper[]>(STORAGE_KEYS.QUESTION_PAPERS, INITIAL_QUESTION_PAPERS);
    if (filters) {
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        papers = papers.filter((p) => p.departmentId === filters.departmentId);
      }
      if (filters.semester && filters.semester !== 'ALL') {
        papers = papers.filter((p) => p.semester === filters.semester);
      }
      if (filters.academicYear && filters.academicYear !== 'ALL') {
        papers = papers.filter((p) => p.academicYear === filters.academicYear);
      }
      if (filters.subjectId && filters.subjectId !== 'ALL') {
        papers = papers.filter((p) => p.subjectId === filters.subjectId);
      }
    }
    return papers;
  }

  public addQuestionPaper(paper: Omit<QuestionPaper, 'paperId' | 'uploadedAt'>): QuestionPaper {
    const papers = this.getQuestionPapers();
    const newPaper: QuestionPaper = {
      ...paper,
      paperId: `qp_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    papers.unshift(newPaper);
    this.setStorage(STORAGE_KEYS.QUESTION_PAPERS, papers);
    return newPaper;
  }

  public deleteQuestionPaper(paperId: string): void {
    const papers = this.getQuestionPapers().filter((p) => p.paperId !== paperId);
    this.setStorage(STORAGE_KEYS.QUESTION_PAPERS, papers);
  }

  // --- STUDY MATERIALS ---
  public getStudyMaterials(filters?: {
    departmentId?: string;
    semester?: string;
    subjectId?: string;
  }): StudyMaterial[] {
    let mats = this.getStorage<StudyMaterial[]>(STORAGE_KEYS.STUDY_MATERIALS, INITIAL_STUDY_MATERIALS);
    if (filters) {
      if (filters.departmentId && filters.departmentId !== 'ALL') {
        mats = mats.filter((m) => m.departmentId === filters.departmentId);
      }
      if (filters.semester && filters.semester !== 'ALL') {
        mats = mats.filter((m) => m.semester === filters.semester);
      }
      if (filters.subjectId && filters.subjectId !== 'ALL') {
        mats = mats.filter((m) => m.subjectId === filters.subjectId);
      }
    }
    return mats;
  }

  public addStudyMaterial(mat: Omit<StudyMaterial, 'materialId' | 'uploadedAt'>): StudyMaterial {
    const mats = this.getStudyMaterials();
    const newMat: StudyMaterial = {
      ...mat,
      materialId: `mat_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    mats.unshift(newMat);
    this.setStorage(STORAGE_KEYS.STUDY_MATERIALS, mats);
    return newMat;
  }

  public deleteStudyMaterial(materialId: string): void {
    const mats = this.getStudyMaterials().filter((m) => m.materialId !== materialId);
    this.setStorage(STORAGE_KEYS.STUDY_MATERIALS, mats);
  }

  // --- I NEED HELP / SUPPORT REQUESTS ---
  public getSupportRequests(studentId?: string): SupportRequest[] {
    let reqs = this.getStorage<SupportRequest[]>(STORAGE_KEYS.SUPPORT_REQUESTS, INITIAL_SUPPORT_REQUESTS);
    if (studentId) {
      reqs = reqs.filter((r) => r.studentId === studentId);
    }
    return reqs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createSupportRequest(reqData: {
    studentId: string;
    category: SupportRequest['category'];
    subject: string;
    message: string;
  }): SupportRequest {
    const student = this.getUserById(reqData.studentId);
    const reqs = this.getSupportRequests();
    const newReq: SupportRequest = {
      requestId: `help_${Date.now()}`,
      studentId: reqData.studentId,
      studentName: student?.name || 'Student',
      usn: student?.usn || student?.rollNumber || 'N/A',
      category: reqData.category,
      subject: reqData.subject.trim(),
      message: reqData.message.trim(),
      status: 'OPEN',
      createdAt: new Date().toISOString(),
    };
    reqs.unshift(newReq);
    this.setStorage(STORAGE_KEYS.SUPPORT_REQUESTS, reqs);
    return newReq;
  }

  public validateEntireTimetable(timetableId: string): string[] {
    const tt = this.getTimetableById(timetableId);
    if (!tt) return [];
    const conflicts: string[] = [];
    const slots = tt.weeklySchedule;
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const a = slots[i];
        const b = slots[j];
        if (a.dayOfWeek === b.dayOfWeek) {
          const overlap =
            (a.startTime >= b.startTime && a.startTime < b.endTime) ||
            (a.endTime > b.startTime && a.endTime <= b.endTime) ||
            (a.startTime <= b.startTime && a.endTime >= b.endTime);
          if (overlap) {
            if (a.professorId === b.professorId) {
              const prof = this.getUserById(a.professorId);
              conflicts.push(`Faculty double-booked: Prof ${prof?.name || a.professorId} on ${a.dayOfWeek} at ${a.startTime}`);
            }
            if (a.room === b.room && a.room !== 'Seminar Hall') {
              conflicts.push(`Room conflict: Room ${a.room} is assigned twice on ${a.dayOfWeek} at ${a.startTime}`);
            }
          }
        }
      }
    }
    return conflicts;
  }

  public replySupportRequest(requestId: string, adminReply: string, status: 'RESOLVED' | 'IN_PROGRESS' = 'RESOLVED'): SupportRequest {
    const reqs = this.getSupportRequests();
    const idx = reqs.findIndex((r) => r.requestId === requestId);
    if (idx === -1) throw new Error('Support request not found.');
    reqs[idx] = {
      ...reqs[idx],
      adminResponse: adminReply.trim(),
      status: status,
      resolvedAt: status === 'RESOLVED' ? new Date().toISOString() : undefined,
    };
    this.setStorage(STORAGE_KEYS.SUPPORT_REQUESTS, reqs);

    // Notify the student
    this.sendNotification({
      recipientId: reqs[idx].studentId,
      recipientRole: 'STUDENT',
      title: 'College Support Reply Received',
      message: `Your support request regarding "${reqs[idx].subject}" has been answered: "${adminReply.slice(0, 75)}..."`,
      type: 'SUPPORT_REPLY',
      targetPage: 'help',
    });

    return reqs[idx];
  }

  // --- PASSWORD & PROFILE MANAGEMENT ---
  public changePassword(_userId: string, _oldPass: string, _newPass: string): { success: boolean; message: string } {
    return { success: true, message: 'Password updated successfully!' };
  }

  public updateUserProfile(userId: string, updates: Partial<User>): User {
    return this.updateUser(userId, updates);
  }

  // --- DATABASE EXPORT & CLOUD BACKUP ---
  public exportDatabaseJSON(): string {
    const fullSnapshot = {
      exportedAt: new Date().toISOString(),
      app: 'ClassConnect',
      version: '2.4.0',
      settings: this.getSettings(),
      departments: this.getDepartments(),
      users: this.getUsers(),
      subjects: this.getSubjects(),
      enrollments: this.getEnrollments(),
      timetables: this.getTimetables(),
      sessions: this.getSessions(),
      attendance: this.getAttendanceRecords(),
      changeLogs: this.getChangeLogs(),
      announcements: this.getAnnouncements(),
      notifications: this.getAllNotificationsForAdmin(),
    };
    return JSON.stringify(fullSnapshot, null, 2);
  }

  public importDatabaseJSON(jsonStr: string): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.users || !data.timetables) {
        throw new Error('Invalid database snapshot format.');
      }
      if (data.settings) this.setStorage(STORAGE_KEYS.SETTINGS, data.settings);
      if (data.departments) this.setStorage(STORAGE_KEYS.DEPARTMENTS, data.departments);
      if (data.users) this.setStorage(STORAGE_KEYS.USERS, data.users);
      if (data.subjects) this.setStorage(STORAGE_KEYS.SUBJECTS, data.subjects);
      if (data.enrollments) this.setStorage(STORAGE_KEYS.ENROLLMENTS, data.enrollments);
      if (data.timetables) this.setStorage(STORAGE_KEYS.TIMETABLES, data.timetables);
      if (data.sessions) this.setStorage(STORAGE_KEYS.SESSIONS, data.sessions);
      if (data.attendance) this.setStorage(STORAGE_KEYS.ATTENDANCE, data.attendance);
      if (data.changeLogs) this.setStorage(STORAGE_KEYS.CHANGE_LOGS, data.changeLogs);
      if (data.announcements) this.setStorage(STORAGE_KEYS.ANNOUNCEMENTS, data.announcements);
      return { success: true, message: 'Database successfully imported!' };
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      return { success: false, message: `Import error: ${msg}` };
    }
  }
}

export const dataService = new DataService();
