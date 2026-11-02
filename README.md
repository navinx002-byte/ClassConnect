# ClassConnect — Production-Ready College Management Application

A complete, mobile-first college management system built for high performance, clarity, and rock-solid role-based security.

ClassConnect provides three distinct, dedicated dashboards (**Student**, **Professor**, and **Admin**), powered by a unified common login architecture with automatic role resolution, Firebase backend architecture, permanent and dated timetables, subject-wise attendance tracking, an immutable **instant-log** professor rescheduling policy, and automated 10-minute class reminders.

---

## 🎨 Design System & Visual Identity

ClassConnect is designed around simplicity, minimalism, and professional clarity:
- **Primary Color:** Navy Blue (`#173D72`)
- **Primary Background:** Crisp White (`#FFFFFF`)
- **Secondary Background:** Subtle Cool Grey (`#F5F7FA`)
- **Body & Heading Text:** Dark Charcoal Slate (`#202938`)
- **Success / Attendance Above 75%:** Emerald Green (`#10B981`)
- **Warnings / Attendance 65–74%:** Amber Yellow (`#F59E0B`)
- **Absences / Cancellations / Under 65%:** Crimson Red (`#EF4444`)
- **Borders:** Refined Light Grey (`#E5E7EB`)
- **Typography:** Inter Modern Sans-Serif
- **Navigation:**
  - **Mobile:** Fixed Bottom Navigation Bar with live badge alerts
  - **Desktop:** Clean sidebar with college hierarchy context

---

## 🚀 Key Modules & Architecture

### 1. Unified Common Login (No Role Dropdown)
- Single entry point for students, professors, and administrators.
- Fields: College Email, Password (with eye toggle), Sign In button, and Forgot Password recovery.
- **Security:** The login form never asks the user to select their role. On authentication, role and status are verified against the authoritative database. Inactive or unassigned accounts are rejected immediately.

### 2. Student Dashboard
- **Section 1 (Top): Today's Classes** — Shows today's dated sessions with status (`ON`, `CANCELLED`, `POSTPONED`), subject, professor, time, and room.
- **Section 2 (Directly Underneath): MY ATTENDANCE**
  - Weighted overall attendance calculation: `(Attended Sessions / Finalized Sessions Held) * 100`.
  - Upcoming and cancelled sessions are excluded.
  - Overall attendance bar and individual subject progress bars with colored status indicators (Green $\ge 75\%$, Yellow $65\text{--}74\%$, Red $< 65\%$).
  - Dynamic mathematical calculator showing how many consecutive classes the student must attend to reach the 75% examination threshold.
- Full Weekly Timetable Grid & Mobile Day-by-Day view.
- Date-wise absence history and professor announcements.

### 3. Professor Dashboard & Instant-Log Rescheduling
- **Assigned Subjects View:** Professors see only courses assigned to them.
- **Strict Subject Permissions for Attendance:**
  - Enforced in both frontend service and `firestore.rules`.
  - Professor A can mark attendance only for their own assigned subject sessions. Attempting to mark another professor's subject is rejected with a `PERMISSION_DENIED` security error.
- **Instant-Log Rescheduling Policy:**
  - Professors can instantly reschedule date, time, and room for their sessions without requiring admin approval.
  - Generates an immutable record in `changeLogs`.
  - Increments session version (`v1` $\rightarrow$ `v2`).
  - Invalidates stale reminder jobs and schedules new reminders.
  - Dispatches immediate notifications to enrolled students, professor, and college administration.
  - The permanent college weekly timetable remains untouched.
- **Class Status Management:** Toggle sessions to `ON`, `CANCELLED`, or `POSTPONED` with immediate broadcast.

### 4. Admin Dashboard
- Live institutional metrics: Total Students, Total Professors, Subjects, Departments, Today's Classes, and Attendance Overview.
- **User Management:** Create student and faculty accounts, assign departments, student groups, roll numbers, and toggle account activation.
- **Subject Management:** Create courses, assign professors, and designate default lecture rooms.
- **Permanent Timetable Editor:** Edit weekly periods (Mon–Sat) across all time slots and publish updates (which bumps timetable version and broadcasts notifications).
- **Professor Change Monitoring (Audit Log):** Real-time monitoring of all rescheduling events with old/new date, time, venue, professor name, reason, and notification delivery status.
- **College Settings:** Configurable attendance thresholds (e.g., 75% minimum, 65% warning) and college timezone (`Asia/Kolkata`).

### 5. Campus Notification Center & 10-Minute Reminders
- Multi-channel notification center with filtering: All, Unread, 10-Min Reminders, Absence Alerts, and Class Changes.
- **Mandatory 10-Minute Reminder:** Automated reminders dispatched 10 minutes prior to scheduled lecture starts to enrolled students and the assigned professor.

---

## 🔑 Demo Accounts & Pre-Seeded Realistic Data

| Role | Name | Email | Password | Details |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | Dr. Ramesh Kulkarni | `admin@classconnect.edu` | `Admin@123` | Institutional Dean |
| **Professor** | Dr. Rajesh Sharma | `prof.sharma@classconnect.edu` | `Prof@123` | Computer Science (CS-301) |
| **Professor** | Dr. Anita Verma | `prof.verma@classconnect.edu` | `Prof@123` | Mathematics (MA-302) |
| **Professor** | Dr. Vikram Patel | `prof.patel@classconnect.edu` | `Prof@123` | Applied Physics (PH-303) |
| **Professor** | Prof. Priya Sen | `prof.sen@classconnect.edu` | `Prof@123` | English & Comm (EN-304) |
| **Student** | Arjun Kumar | `arjun.kumar@classconnect.edu` | `Student@123` | CSE-2026-01 (Overall 85%) |
| **Inactive** | Kunal Verma | `inactive.user@classconnect.edu` | `Test@123` | Deactivated account test |

*A total of 25 realistic student accounts (`CSE-2026-01` through `CSE-2026-25`) are pre-enrolled with attendance logs matching the exact sample distributions.*

---

## 🧪 Specification Demo Tests Guide

Click the **"Demo Test Guide"** button in the top navigation bar to run any of the 7 tests with live state inspection:

- **TEST 1: Student Timetable & Attendance Hierarchy**
  - Log in as Arjun Kumar. Today's classes display at the top, and **MY ATTENDANCE** displays directly underneath with weighted percentages:
    - Computer Science: **90%** (9/10)
    - Mathematics: **80%** (4/5)
    - Physics: **75%** (3/4)
    - English: **100%** (1/1)
    - **Overall Attendance: 85% (17/20)**
- **TEST 2: Professor A Marks Computer Science Attendance**
  - Dr. Rajesh Sharma logs in and successfully submits attendance for CS-301.
- **TEST 3: Strict Subject Permission Guard (Critical Security)**
  - Dr. Rajesh Sharma attempts to mark Mathematics (assigned to Dr. Anita Verma).
  - System throws `PERMISSION_DENIED: Professor Dr. Rajesh Sharma is not authorized to mark attendance for Discrete Mathematics & Probability`.
- **TEST 4: Instant-Log Rescheduling Policy**
  - Professor reschedules session venue or time.
  - Version increments, immutable audit log created in `changeLogs`, notifications sent to students, professor, and admin.
- **TEST 5: Absence Notification**
  - Student is marked absent. Immediate high-priority absence notification is dispatched to their notification drawer.
- **TEST 6: 10-Minute Class Reminder**
  - Dispatches class reminders to enrolled students and the assigned professor 10 minutes prior to lecture start.
- **TEST 7: Admin Publishes Permanent Timetable**
  - Admin edits slots and publishes permanent timetable. Version increments and a college broadcast notification is dispatched.

---

## 💻 Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Tailwind CSS v4, Lucide React Icons
- **Backend Architecture:** Firebase Authentication, Cloud Firestore, Firebase Cloud Messaging, Firebase Cloud Functions
- **Security Rules:** `firestore.rules` with role verification and assigned professor checks

---

## 🛠️ Getting Started

### 1. Installation & Local Development
```bash
cd classconnect
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

### 2. Run Automated Test Suite
```bash
npm test
```

### 3. Production Firebase Setup
1. Create a Firebase project at [https://console.firebase.google.com/](https://console.firebase.google.com/).
2. Enable **Authentication** (Email/Password).
3. Enable **Cloud Firestore** and deploy `firestore.rules`:
   ```bash
   firebase deploy --only firestore:rules
   ```
4. Deploy **Cloud Functions**:
   ```bash
   cd functions
   npm install
   npm run deploy
   ```
5. Copy `.env.example` to `.env` and fill in your Firebase web app keys:
   ```env
   VITE_FIREBASE_API_KEY=AIzaSy...
   VITE_FIREBASE_AUTH_DOMAIN=classconnect-app.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=classconnect-app
   VITE_FIREBASE_STORAGE_BUCKET=classconnect-app.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
6. Build for production:
   ```bash
   npm run build
   ```
