import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

admin.initializeApp();
const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Triggered on attendance document write.
 * When a student is marked absent, immediately dispatches an in-app
 * notification and sends an FCM push notification.
 */
export const onAttendanceMarked = functions.firestore
  .document('attendance/{attendanceId}')
  .onWrite(async (change, context) => {
    const afterData = change.after.exists ? change.after.data() : null;
    if (!afterData) return;

    // Only process if status is ABSENT
    if (afterData.status !== 'ABSENT') return;

    // Avoid duplicate notifications if already absent
    const beforeData = change.before.exists ? change.before.data() : null;
    if (beforeData && beforeData.status === 'ABSENT') return;

    const { studentId, subjectId, sessionId } = afterData;

    // Fetch subject and session details
    const [subjectDoc, sessionDoc] = await Promise.all([
      db.collection('subjects').doc(subjectId).get(),
      db.collection('classSessions').doc(sessionId).get(),
    ]);

    const subjectName = subjectDoc.exists ? subjectDoc.data()?.name : 'Scheduled Lecture';
    const sessionData = sessionDoc.exists ? sessionDoc.data() : {};
    const dateStr = sessionData?.date || 'today';
    const timeStr = sessionData?.startTime ? `${sessionData.startTime} - ${sessionData.endTime}` : '';

    // 1. Create in-app notification in notifications collection
    await db.collection('notifications').add({
      recipientId: studentId,
      recipientRole: 'STUDENT',
      title: 'Attendance Alert',
      message: `You were marked ABSENT for ${subjectName} on ${dateStr} (${timeStr}).`,
      type: 'STUDENT_MARKED_ABSENT',
      sessionId,
      subjectId,
      read: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      deliveryStatus: 'DELIVERED',
    });

    // 2. Fetch device tokens and dispatch FCM Push Notification
    const tokensSnapshot = await db
      .collection('deviceTokens')
      .where('userId', '==', studentId)
      .get();

    if (!tokensSnapshot.empty) {
      const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);
      await messaging.sendEachForMulticast({
        tokens,
        notification: {
          title: 'ClassConnect • Absence Alert',
          body: `You were marked absent for ${subjectName} on ${dateStr}.`,
        },
        data: {
          type: 'STUDENT_MARKED_ABSENT',
          sessionId,
          subjectId,
        },
      });
    }
  });

/**
 * Instant-Log Rescheduling Cloud Function (HTTPS Callable)
 * Enforces ownership, increments version, logs immutable audit record,
 * invalidates old reminder jobs, and schedules new 10-minute reminders.
 */
export const rescheduleClassSession = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated.');
  }

  const { sessionId, newDate, newStartTime, newEndTime, newRoom, reason } = data;
  const professorId = context.auth.uid;

  if (!sessionId || !newDate || !newStartTime || !newEndTime || !newRoom || !reason) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing mandatory rescheduling parameters.');
  }

  const sessionRef = db.collection('classSessions').doc(sessionId);

  return await db.runTransaction(async (transaction) => {
    const sessionDoc = await transaction.get(sessionRef);
    if (!sessionDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Session not found.');
    }

    const sessionData = sessionDoc.data()!;

    // STRICT PERMISSION CHECK: Must be assigned professor
    if (sessionData.professorId !== professorId) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only the assigned professor can reschedule this session.'
      );
    }

    const oldVersion = sessionData.version || 1;
    const newVersion = oldVersion + 1;

    // Snapshot old state
    const oldDate = sessionData.date;
    const oldTime = `${sessionData.startTime} - ${sessionData.endTime}`;
    const oldRoom = sessionData.room;

    // 1. Update Class Session immediately
    transaction.update(sessionRef, {
      date: newDate,
      startTime: newStartTime,
      endTime: newEndTime,
      room: newRoom,
      version: newVersion,
      rescheduleReason: reason,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // 2. Create Immutable Audit Record
    const changeLogRef = db.collection('changeLogs').doc();
    transaction.set(changeLogRef, {
      sessionId,
      professorId,
      oldDate,
      newDate,
      oldTime,
      newTime: `${newStartTime} - ${newEndTime}`,
      oldRoom,
      newRoom,
      reason,
      sessionVersion: newVersion,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
      notificationDeliveryStatus: 'DELIVERED',
    });

    // 3. Invalidate old reminders for this session
    const oldReminders = await db
      .collection('reminderJobs')
      .where('sessionId', '==', sessionId)
      .where('status', '==', 'SCHEDULED')
      .get();

    oldReminders.docs.forEach((doc) => {
      transaction.update(doc.ref, { status: 'INVALIDATED' });
    });

    // 4. Schedule new reminder job
    const newReminderRef = db.collection('reminderJobs').doc();
    const reminderDate = new Date(`${newDate}T${newStartTime}:00`);
    reminderDate.setMinutes(reminderDate.getMinutes() - 10);

    transaction.set(newReminderRef, {
      sessionId,
      scheduledAt: reminderDate.toISOString(),
      sessionVersion: newVersion,
      status: 'SCHEDULED',
    });

    return {
      success: true,
      sessionId,
      version: newVersion,
      changeId: changeLogRef.id,
    };
  });
});

/**
 * Scheduled Cloud Function: 10-Minute Mandatory Class Reminders
 * Runs every 5 minutes in Asia/Kolkata timezone.
 * Finds upcoming sessions starting in 10 minutes and notifies
 * enrolled students and the assigned professor.
 */
export const dispatchTenMinuteClassReminders = functions.pubsub
  .schedule('every 5 minutes')
  .timeZone('Asia/Kolkata')
  .onRun(async () => {
    const now = new Date();
    const tenMinutesFromNow = new Date(now.getTime() + 10 * 60 * 1000);

    // Format target time strings for matching
    const targetDate = now.toISOString().split('T')[0];
    const targetHours = String(tenMinutesFromNow.getHours()).padStart(2, '0');
    const targetMins = String(tenMinutesFromNow.getMinutes()).padStart(2, '0');
    const targetTime = `${targetHours}:${targetMins}`;

    // Query active non-cancelled sessions scheduled for today
    const sessionsSnapshot = await db
      .collection('classSessions')
      .where('date', '==', targetDate)
      .where('startTime', '==', targetTime)
      .where('status', '==', 'ON')
      .get();

    if (sessionsSnapshot.empty) {
      console.log('No class sessions starting in 10 minutes.');
      return;
    }

    for (const sessionDoc of sessionsSnapshot.docs) {
      const session = sessionDoc.data();
      const subjectDoc = await db.collection('subjects').doc(session.subjectId).get();
      const subjectName = subjectDoc.exists ? subjectDoc.data()?.name : 'Class';

      // Find enrolled students
      const enrollments = await db
        .collection('studentSubjects')
        .where('subjectId', '==', session.subjectId)
        .get();

      const studentIds = enrollments.docs.map((e) => e.data().studentId);

      // 1. Dispatch reminder notifications to students
      const batch = db.batch();
      studentIds.forEach((studentId) => {
        const notifRef = db.collection('notifications').doc();
        batch.set(notifRef, {
          recipientId: studentId,
          recipientRole: 'STUDENT',
          title: `${subjectName} in 10 Minutes`,
          message: `Class starts at ${session.startTime} in ${session.room}.`,
          type: 'CLASS_REMINDER',
          sessionId: sessionDoc.id,
          subjectId: session.subjectId,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          deliveryStatus: 'DELIVERED',
        });
      });

      // 2. Dispatch reminder notification to assigned professor
      const profNotifRef = db.collection('notifications').doc();
      batch.set(profNotifRef, {
        recipientId: session.professorId,
        recipientRole: 'PROFESSOR',
        title: `Upcoming Lecture: ${subjectName}`,
        message: `Your lecture starts in 10 minutes at ${session.startTime} in ${session.room}.`,
        type: 'CLASS_REMINDER',
        sessionId: sessionDoc.id,
        subjectId: session.subjectId,
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        deliveryStatus: 'DELIVERED',
      });

      await batch.commit();
      console.log(`Dispatched 10-minute reminders for session ${sessionDoc.id}`);
    }
  });
