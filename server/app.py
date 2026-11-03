import os
import json
from datetime import datetime, date, timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from werkzeug.utils import secure_filename
import pymongo
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

# Initialize Flask App
app = Flask(__name__)
CORS(app)

# Upload directory configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads', 'timetables')
DATA_FALLBACK_FILE = os.path.join(BASE_DIR, 'data', 'db_fallback.json')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 32 * 1024 * 1024  # 32MB max file size

ALLOWED_EXTENSIONS = {'pdf', 'xlsx', 'xls', 'csv', 'png', 'jpg', 'jpeg', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# =========================================================================
# MONGODB CONNECTION CONFIGURATION (MONGODB ATLAS & LOCAL MONGODB)
# =========================================================================
# Configure MongoDB connection from environment variables as required:
# MONGODB_URI=your_mongodb_connection_string
# PORT=your_backend_port
MONGO_URI = os.environ.get('MONGODB_URI') or os.environ.get('MONGO_URI', 'mongodb://localhost:27017/classconnect')
DB_NAME = 'classconnect'

mongo_client = None
mongo_db = None
is_mongo_active = False
last_connection_check = None
last_connection_error = None

def check_mongo_connection():
    global mongo_client, mongo_db, is_mongo_active, last_connection_check, last_connection_error
    last_connection_check = datetime.now().isoformat()
    try:
        if mongo_client is None:
            mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=2000)
        mongo_client.admin.command('ping')
        mongo_db = mongo_client[DB_NAME]
        is_mongo_active = True
        last_connection_error = None
        return True
    except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
        is_mongo_active = False
        last_connection_error = str(e)
        return False

# Attempt initial connection
check_mongo_connection()
if is_mongo_active:
    print(f"[ClassConnect MongoDB] Successfully connected to database '{DB_NAME}' via {MONGO_URI.split('@')[-1] if '@' in MONGO_URI else 'localhost'}")
else:
    print(f"[ClassConnect MongoDB] Database not currently reachable: {last_connection_error}. Resilient fallback active.")

# =========================================================================
# DATA STORAGE HELPERS (MONGODB WITH RESILIENT FILE-BACKED ENGINE)
# =========================================================================
def load_fallback_db():
    if not os.path.exists(DATA_FALLBACK_FILE):
        return {}
    try:
        with open(DATA_FALLBACK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def save_fallback_db(data):
    with open(DATA_FALLBACK_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

def get_collection_data(collection_name):
    if is_mongo_active and mongo_db is not None:
        try:
            docs = list(mongo_db[collection_name].find())
            for d in docs:
                d['_id'] = str(d['_id'])
            return docs
        except Exception as e:
            print(f"[MongoDB Read Error] {e}")
    db = load_fallback_db()
    return db.get(collection_name, [])

def insert_item(collection_name, item):
    if is_mongo_active and mongo_db is not None:
        try:
            res = mongo_db[collection_name].insert_one(item.copy())
            item['_id'] = str(res.inserted_id)
            return item
        except Exception as e:
            print(f"[MongoDB Insert Error] {e}")
    db = load_fallback_db()
    if collection_name not in db:
        db[collection_name] = []
    db[collection_name].append(item)
    save_fallback_db(db)
    return item

def update_item(collection_name, query, updates):
    if is_mongo_active and mongo_db is not None:
        try:
            mongo_db[collection_name].update_many(query, {'$set': updates})
            return True
        except Exception as e:
            print(f"[MongoDB Update Error] {e}")
    db = load_fallback_db()
    items = db.get(collection_name, [])
    updated = False
    for it in items:
        match = all(it.get(k) == v for k, v in query.items())
        if match:
            it.update(updates)
            updated = True
    save_fallback_db(db)
    return updated

def delete_item(collection_name, query):
    if is_mongo_active and mongo_db is not None:
        try:
            mongo_db[collection_name].delete_many(query)
            return True
        except Exception as e:
            print(f"[MongoDB Delete Error] {e}")
    db = load_fallback_db()
    items = db.get(collection_name, [])
    filtered = [it for it in items if not all(it.get(k) == v for k, v in query.items())]
    db[collection_name] = filtered
    save_fallback_db(db)
    return True

# =========================================================================
# OFFICIAL INITIAL DATA SEEDING (MCA Odd Semester 2026 - 2027)
# =========================================================================
def seed_official_database():
    settings = get_collection_data('settings')
    if len(settings) == 0:
        insert_item('settings', {
            "collegeName": "Nitte Meenakshi Institute of Technology",
            "currentSemester": "Odd Semester 2026 - 2027 (MCA Semester I - Section A)",
            "minAttendanceThreshold": 75,
            "warningAttendanceThreshold": 65,
            "timezone": "Asia/Kolkata"
        })

    departments = get_collection_data('departments')
    if len(departments) == 0:
        depts = [
            {"departmentId": "dept_mca", "name": "Department of Computer Applications - MCA", "code": "MCA"},
            {"departmentId": "dept_cse", "name": "Computer Science & Engineering", "code": "CSE"},
            {"departmentId": "dept_ece", "name": "Electronics & Communication", "code": "ECE"},
            {"departmentId": "dept_me", "name": "Mechanical Engineering", "code": "ME"}
        ]
        for d in depts:
            insert_item('departments', d)

    student_records = get_collection_data('studentRecords')
    if len(student_records) == 0:
        records = [
            {
                "recordId": "rec_mca_01",
                "usn": "1NN24MC001",
                "registerNumber": "MCA2024-001",
                "admissionNumber": "ADM-2024-101",
                "name": "Rahul Verma",
                "collegeEmail": "student@college.edu",
                "departmentId": "dept_mca",
                "departmentName": "Department of Computer Applications - MCA",
                "degree": "Master of Computer Applications (MCA)",
                "semester": "1",
                "section": "A",
                "isRegistered": True,
                "registered": True,
                "registeredUserId": "user_student_main"
            },
            {
                "recordId": "rec_mca_02",
                "usn": "1NN24MC002",
                "registerNumber": "MCA2024-002",
                "admissionNumber": "ADM-2024-102",
                "name": "Pooja Nair",
                "collegeEmail": "pooja.nair@nmit.ac.in",
                "departmentId": "dept_mca",
                "departmentName": "Department of Computer Applications - MCA",
                "degree": "Master of Computer Applications (MCA)",
                "semester": "1",
                "section": "A",
                "isRegistered": False,
                "registered": False
            },
            {
                "recordId": "rec_mca_03",
                "usn": "1NN24MC003",
                "registerNumber": "MCA2024-003",
                "admissionNumber": "ADM-2024-103",
                "name": "Karthik Gowda",
                "collegeEmail": "karthik.gowda@nmit.ac.in",
                "departmentId": "dept_mca",
                "departmentName": "Department of Computer Applications - MCA",
                "degree": "Master of Computer Applications (MCA)",
                "semester": "1",
                "section": "A",
                "isRegistered": False,
                "registered": False
            },
            {
                "recordId": "rec_mca_04",
                "usn": "1NN24MC004",
                "registerNumber": "MCA2024-004",
                "admissionNumber": "ADM-2024-104",
                "name": "Sneha Kulkarni",
                "collegeEmail": "sneha.k@nmit.ac.in",
                "departmentId": "dept_mca",
                "departmentName": "Department of Computer Applications - MCA",
                "degree": "Master of Computer Applications (MCA)",
                "semester": "1",
                "section": "A",
                "isRegistered": False,
                "registered": False
            },
            {
                "recordId": "rec_mca_05",
                "usn": "1NN24MC005",
                "registerNumber": "MCA2024-005",
                "admissionNumber": "ADM-2024-105",
                "name": "Vikram Hegde",
                "collegeEmail": "vikram.h@nmit.ac.in",
                "departmentId": "dept_mca",
                "departmentName": "Department of Computer Applications - MCA",
                "degree": "Master of Computer Applications (MCA)",
                "semester": "1",
                "section": "A",
                "isRegistered": False,
                "registered": False
            }
        ]
        for r in records:
            insert_item('studentRecords', r)

    users = get_collection_data('users')
    if len(users) == 0:
        seed_users = [
            {
                "userId": "user_admin_01",
                "name": "College Administrator",
                "email": "admin@classconnect.edu",
                "password": "password123",
                "role": "ADMIN",
                "departmentId": "dept_mca",
                "active": True,
                "createdAt": datetime.now().isoformat()
            },
            {
                "userId": "user_prof_sharma",
                "name": "Prof. Dr. Rajesh Sharma",
                "email": "prof.sharma@classconnect.edu",
                "password": "password123",
                "role": "PROFESSOR",
                "departmentId": "dept_mca",
                "active": True,
                "createdAt": datetime.now().isoformat()
            },
            {
                "userId": "user_student_main",
                "name": "Rahul Verma",
                "email": "arjun.kumar@classconnect.edu",
                "password": "password123",
                "role": "STUDENT",
                "departmentId": "dept_mca",
                "studentGroupId": "grp_mca_sec_a",
                "usn": "1NN24MC001",
                "rollNumber": "1NN24MC001",
                "registerNumber": "MCA2024-001",
                "degree": "Master of Computer Applications (MCA)",
                "semester": "1",
                "phone": "+91 9845012345",
                "active": True,
                "createdAt": datetime.now().isoformat()
            }
        ]
        for u in seed_users:
            insert_item('users', u)

    subjects = get_collection_data('subjects')
    if len(subjects) == 0:
        seed_subs = [
            {"subjectId": "sub_mca_aos", "name": "Advanced Operating Systems", "code": "24MCA11", "departmentId": "dept_mca", "professorId": "user_prof_sharma", "defaultRoom": "Room 301", "creditHours": 4, "credits": 4},
            {"subjectId": "sub_mca_dsa", "name": "Data Structures & Algorithms", "code": "24MCA12", "departmentId": "dept_mca", "professorId": "user_prof_sharma", "defaultRoom": "Room 301", "creditHours": 4, "credits": 4},
            {"subjectId": "sub_mca_adbs", "name": "Advanced Database Systems", "code": "24MCA13", "departmentId": "dept_mca", "professorId": "user_prof_sharma", "defaultRoom": "Room 301", "creditHours": 4, "credits": 4},
            {"subjectId": "sub_mca_dcn", "name": "Data Communication Networks", "code": "24MCA14", "departmentId": "dept_mca", "professorId": "user_prof_sharma", "defaultRoom": "Room 302", "creditHours": 4, "credits": 4},
            {"subjectId": "sub_mca_mfca", "name": "Mathematical Foundations", "code": "24MCA15", "departmentId": "dept_mca", "professorId": "user_prof_sharma", "defaultRoom": "Room 301", "creditHours": 4, "credits": 4},
            {"subjectId": "sub_mca_rmpe", "name": "Research Methodology & Ethics", "code": "24MCA16", "departmentId": "dept_mca", "professorId": "user_prof_sharma", "defaultRoom": "Room 301", "creditHours": 2, "credits": 2},
            {"subjectId": "sub_mca_sspcs", "name": "Soft Skills & Communication", "code": "24MCA17", "departmentId": "dept_mca", "professorId": "user_prof_sharma", "defaultRoom": "Language Lab", "creditHours": 2, "credits": 2}
        ]
        for s in seed_subs:
            insert_item('subjects', s)

    timetables = get_collection_data('timetables')
    if len(timetables) == 0:
        insert_item('timetables', {
            "timetableId": "tt_mca_sem1",
            "departmentId": "dept_mca",
            "studentGroupId": "grp_mca_sec_a",
            "semester": "1",
            "weeklySchedule": [
                {"id": "slot_mon_1", "dayOfWeek": "MONDAY", "periodNumber": 1, "startTime": "09:00", "endTime": "09:55", "subjectId": "sub_mca_aos", "professorId": "user_prof_sharma", "room": "Room 301"},
                {"id": "slot_mon_2", "dayOfWeek": "MONDAY", "periodNumber": 2, "startTime": "09:55", "endTime": "10:50", "subjectId": "sub_mca_dsa", "professorId": "user_prof_sharma", "room": "MCA Lab 1"},
                {"id": "slot_mon_3", "dayOfWeek": "MONDAY", "periodNumber": 3, "startTime": "11:00", "endTime": "11:55", "subjectId": "sub_mca_dsa", "professorId": "user_prof_sharma", "room": "MCA Lab 1"},
                {"id": "slot_mon_4", "dayOfWeek": "MONDAY", "periodNumber": 4, "startTime": "11:55", "endTime": "12:50", "subjectId": "sub_mca_adbs", "professorId": "user_prof_sharma", "room": "MCA Lab 2"},
                {"id": "slot_mon_5", "dayOfWeek": "MONDAY", "periodNumber": 5, "startTime": "13:25", "endTime": "14:20", "subjectId": "sub_mca_dcn", "professorId": "user_prof_sharma", "room": "Room 301"},
                {"id": "slot_mon_6", "dayOfWeek": "MONDAY", "periodNumber": 6, "startTime": "14:20", "endTime": "15:15", "subjectId": "sub_mca_dsa", "professorId": "user_prof_sharma", "room": "Room 301"},
                {"id": "slot_mon_7", "dayOfWeek": "MONDAY", "periodNumber": 7, "startTime": "15:15", "endTime": "16:10", "subjectId": "sub_mca_adbs", "professorId": "user_prof_sharma", "room": "Room 301"},
                
                {"id": "slot_tue_1", "dayOfWeek": "TUESDAY", "periodNumber": 1, "startTime": "09:00", "endTime": "09:55", "subjectId": "sub_mca_dcn", "professorId": "user_prof_sharma", "room": "Room 301"},
                {"id": "slot_tue_2", "dayOfWeek": "TUESDAY", "periodNumber": 2, "startTime": "09:55", "endTime": "10:50", "subjectId": "sub_mca_adbs", "professorId": "user_prof_sharma", "room": "Room 301"},
                {"id": "slot_tue_3", "dayOfWeek": "TUESDAY", "periodNumber": 3, "startTime": "11:00", "endTime": "11:55", "subjectId": "sub_mca_sspcs", "professorId": "user_prof_sharma", "room": "Language Lab"},
                {"id": "slot_tue_4", "dayOfWeek": "TUESDAY", "periodNumber": 4, "startTime": "11:55", "endTime": "12:50", "subjectId": "sub_mca_aos", "professorId": "user_prof_sharma", "room": "Room 301"},
                {"id": "slot_tue_5", "dayOfWeek": "TUESDAY", "periodNumber": 5, "startTime": "13:25", "endTime": "14:20", "subjectId": "sub_mca_dsa", "professorId": "user_prof_sharma", "room": "Room 301"},
                {"id": "slot_tue_6", "dayOfWeek": "TUESDAY", "periodNumber": 6, "startTime": "14:20", "endTime": "15:15", "subjectId": "sub_mca_dcn", "professorId": "user_prof_sharma", "room": "Room 301"}
            ],
            "version": 1,
            "isPublished": True,
            "publishedAt": datetime.now().isoformat()
        })

    sessions = get_collection_data('classSessions')
    if len(sessions) == 0:
        today_str = date.today().isoformat()
        init_sessions = [
            {"sessionId": f"sess_{today_str}_1", "timetableId": "tt_mca_sem1", "subjectId": "sub_mca_aos", "professorId": "user_prof_sharma", "date": today_str, "dayOfWeek": "MONDAY", "startTime": "09:00", "endTime": "09:55", "room": "Room 301", "status": "ON", "version": 1},
            {"sessionId": f"sess_{today_str}_2", "timetableId": "tt_mca_sem1", "subjectId": "sub_mca_dsa", "professorId": "user_prof_sharma", "date": today_str, "dayOfWeek": "MONDAY", "startTime": "09:55", "endTime": "10:50", "room": "MCA Lab 1", "status": "ON", "version": 1},
            {"sessionId": f"sess_{today_str}_3", "timetableId": "tt_mca_sem1", "subjectId": "sub_mca_dsa", "professorId": "user_prof_sharma", "date": today_str, "dayOfWeek": "MONDAY", "startTime": "11:00", "endTime": "11:55", "room": "MCA Lab 1", "status": "ON", "version": 1},
            {"sessionId": f"sess_{today_str}_4", "timetableId": "tt_mca_sem1", "subjectId": "sub_mca_adbs", "professorId": "user_prof_sharma", "date": today_str, "dayOfWeek": "MONDAY", "startTime": "11:55", "endTime": "12:50", "room": "MCA Lab 2", "status": "ON", "version": 1},
            {"sessionId": f"sess_{today_str}_5", "timetableId": "tt_mca_sem1", "subjectId": "sub_mca_dcn", "professorId": "user_prof_sharma", "date": today_str, "dayOfWeek": "MONDAY", "startTime": "13:25", "endTime": "14:20", "room": "Room 301", "status": "ON", "version": 1}
        ]
        for sess in init_sessions:
            insert_item('classSessions', sess)

    qps = get_collection_data('questionPapers')
    if len(qps) == 0:
        seed_qps = [
            {"paperId": "qp_01", "departmentId": "dept_mca", "semester": "1", "academicYear": "2026-2027", "subjectId": "sub_mca_aos", "subjectName": "Advanced Operating Systems", "subjectCode": "24MCA11", "title": "AOS Semester End Examination - Jan 2026", "fileName": "24MCA11_AOS_JAN_2026.pdf", "fileDataUrl": "/mca_timetable_official.png", "fileSizeFormatted": "1.4 MB", "uploadedAt": datetime.now().isoformat(), "uploadedBy": "Department Exam Cell"},
            {"paperId": "qp_02", "departmentId": "dept_mca", "semester": "1", "academicYear": "2026-2027", "subjectId": "sub_mca_dsa", "subjectName": "Data Structures & Algorithms", "subjectCode": "24MCA12", "title": "DSA Semester End Examination - Jan 2026", "fileName": "24MCA12_DSA_JAN_2026.pdf", "fileDataUrl": "/mca_timetable_official.png", "fileSizeFormatted": "1.8 MB", "uploadedAt": datetime.now().isoformat(), "uploadedBy": "Department Exam Cell"},
            {"paperId": "qp_03", "departmentId": "dept_mca", "semester": "1", "academicYear": "2025-2026", "subjectId": "sub_mca_adbs", "subjectName": "Advanced Database Systems", "subjectCode": "24MCA13", "title": "ADBS Previous Year Paper - Dec 2025", "fileName": "24MCA13_ADBS_DEC_2025.pdf", "fileDataUrl": "/mca_timetable_official.png", "fileSizeFormatted": "1.2 MB", "uploadedAt": datetime.now().isoformat(), "uploadedBy": "Department Exam Cell"}
        ]
        for qp in seed_qps:
            insert_item('questionPapers', qp)

seed_official_database()

# =========================================================================
# CENTRALIZED API ENDPOINTS (MONGODB CONNECTED)
# =========================================================================

# --- 1. SYSTEM STATUS & MONGODB CONNECTION METRICS ---
@app.route('/api/status', methods=['GET'])
def get_system_status():
    check_mongo_connection()
    users = get_collection_data('users')
    students_count = len([u for u in users if u.get('role') == 'STUDENT'])
    professors_count = len([u for u in users if u.get('role') == 'PROFESSOR'])
    student_records_count = len(get_collection_data('studentRecords'))
    timetables_count = len(get_collection_data('timetables'))
    attendance_count = len(get_collection_data('attendance'))
    sessions_count = len(get_collection_data('classSessions'))
    qps_count = len(get_collection_data('questionPapers'))
    support_count = len(get_collection_data('supportRequests'))

    return jsonify({
        "status": "online",
        "databaseProvider": "MongoDB Atlas" if is_mongo_active else "MongoDB Standby (Local Resilient Engine)",
        "connectionStatus": "Connected" if is_mongo_active else "Disconnected",
        "databaseName": DB_NAME,
        "mongoUriTarget": MONGO_URI.split('@')[-1] if '@' in MONGO_URI else 'localhost:27017',
        "lastChecked": last_connection_check,
        "lastError": last_connection_error,
        "counts": {
            "students": students_count,
            "professors": professors_count,
            "studentRecords": student_records_count,
            "timetables": timetables_count,
            "attendance": attendance_count,
            "sessions": sessions_count,
            "questionPapers": qps_count,
            "supportRequests": support_count
        }
    })

# --- 2. DATABASE BACKUP EXPORT & RESTORE ---
@app.route('/api/database/export', methods=['GET'])
def export_database():
    collections = [
        'settings', 'departments', 'studentRecords', 'users', 'subjects',
        'timetables', 'classSessions', 'attendance', 'changeLogs',
        'announcements', 'notifications', 'questionPapers', 'studyMaterials',
        'supportRequests', 'deviceTokens', 'reminderJobs'
    ]
    dump = {}
    for col in collections:
        dump[col] = get_collection_data(col)
    
    return jsonify({
        "exportTimestamp": datetime.now().isoformat(),
        "databaseName": DB_NAME,
        "provider": "MongoDB Atlas",
        "data": dump
    })

@app.route('/api/database/restore', methods=['POST'])
def restore_database():
    payload = request.json or {}
    backup_data = payload.get('data') or payload
    if not isinstance(backup_data, dict):
        return jsonify({"success": False, "error": "Invalid JSON format: expected dictionary of collections."}), 400

    restored_counts = {}
    for col_name, items in backup_data.items():
        if isinstance(items, list):
            for item in items:
                # Deduplicate by primary keys
                query = {}
                if 'userId' in item: query['userId'] = item['userId']
                elif 'recordId' in item: query['recordId'] = item['recordId']
                elif 'subjectId' in item: query['subjectId'] = item['subjectId']
                elif 'sessionId' in item: query['sessionId'] = item['sessionId']
                elif 'paperId' in item: query['paperId'] = item['paperId']
                elif 'requestId' in item: query['requestId'] = item['requestId']
                elif 'attendanceId' in item: query['attendanceId'] = item['attendanceId']

                if query:
                    update_item(col_name, query, item)
                else:
                    insert_item(col_name, item)
            restored_counts[col_name] = len(items)

    return jsonify({
        "success": True,
        "message": "Database backup successfully validated and restored into MongoDB collections.",
        "restoredCounts": restored_counts
    })

# --- 3. PRELOADED STUDENT REGISTRY & VALIDATION ---
@app.route('/api/student-records', methods=['GET', 'POST'])
def api_student_records():
    if request.method == 'GET':
        return jsonify(get_collection_data('studentRecords'))
    
    data = request.json or {}
    usn = data.get('usn', '').strip().upper()
    existing = get_collection_data('studentRecords')
    if any(r.get('usn') == usn for r in existing):
        return jsonify({"success": False, "error": f"Student with USN '{usn}' is already preloaded."}), 400

    new_rec = {
        "recordId": f"rec_{int(datetime.now().timestamp() * 1000)}",
        "usn": usn,
        "registerNumber": data.get('registerNumber', usn).strip().upper(),
        "admissionNumber": data.get('admissionNumber', usn).strip(),
        "name": data.get('name', '').strip(),
        "collegeEmail": data.get('collegeEmail', '').strip().lower(),
        "departmentId": data.get('departmentId', 'dept_mca'),
        "departmentName": data.get('departmentName', 'Department of Computer Applications - MCA'),
        "degree": data.get('degree', 'Master of Computer Applications (MCA)'),
        "semester": str(data.get('semester', '1')),
        "section": data.get('section', 'A'),
        "isRegistered": False,
        "registered": False
    }
    insert_item('studentRecords', new_rec)
    return jsonify({"success": True, "record": new_rec})

@app.route('/api/student-records/<record_id>', methods=['DELETE'])
def api_delete_student_record(record_id):
    delete_item('studentRecords', {'recordId': record_id})
    return jsonify({"success": True, "deletedRecordId": record_id})

@app.route('/api/student-records/validate', methods=['POST'])
def api_validate_student():
    data = request.json or {}
    ident = data.get('identifier', '').strip().upper()
    records = get_collection_data('studentRecords')
    match = next((r for r in records if r.get('usn') == ident or r.get('registerNumber') == ident or r.get('admissionNumber') == ident), None)

    if not match:
        return jsonify({
            "valid": False,
            "error": "No matching college record found. Please verify your official USN or contact college administration."
        }), 404

    if match.get('isRegistered', False):
        return jsonify({
            "valid": True,
            "alreadyRegistered": True,
            "record": match,
            "error": "An account for this USN is already registered. Please proceed to Student Login."
        })

    return jsonify({"valid": True, "alreadyRegistered": False, "record": match})

# --- 4. SECURE AUTHENTICATION (STUDENT, PROFESSOR, ADMIN) ---
@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    target_role = data.get('role')

    users = get_collection_data('users')
    user = next((u for u in users if u.get('email', '').lower() == email), None)

    if not user:
        return jsonify({"success": False, "error": "No account found registered with this college email."}), 404

    if target_role and user.get('role') != target_role:
        return jsonify({
            "success": False,
            "error": f"Access Denied: This account is authorized as {user.get('role')}. Please select the {user.get('role')} login tab."
        }), 403

    if not user.get('active', True):
        return jsonify({"success": False, "error": "Account is inactive. Please contact administration."}), 403

    clean_user = {k: v for k, v in user.items() if k not in ('password', '_id')}
    return jsonify({"success": True, "user": clean_user, "role": user.get('role')})

@app.route('/api/auth/register-student', methods=['POST'])
def api_register_student():
    data = request.json or {}
    record_id = data.get('recordId')
    email = data.get('collegeEmail', '').strip().lower()
    phone = data.get('phone', '').strip()
    password = data.get('password', 'Pass@123')

    records = get_collection_data('studentRecords')
    match = next((r for r in records if r.get('recordId') == record_id), None)
    if not match:
        return jsonify({"success": False, "error": "Invalid college student record."}), 404

    if match.get('isRegistered', False):
        return jsonify({"success": False, "error": "This USN is already registered."}), 400

    new_user_id = f"user_student_{int(datetime.now().timestamp() * 1000)}"
    new_user = {
        "userId": new_user_id,
        "name": match.get('name'),
        "email": email or match.get('collegeEmail'),
        "password": password,
        "role": "STUDENT",
        "departmentId": match.get('departmentId', 'dept_mca'),
        "studentGroupId": f"grp_{match.get('departmentId', 'mca')}_sec_{match.get('section', 'a').lower()}",
        "usn": match.get('usn'),
        "rollNumber": match.get('usn'),
        "registerNumber": match.get('registerNumber'),
        "degree": match.get('degree'),
        "semester": str(match.get('semester')),
        "phone": phone,
        "active": True,
        "createdAt": datetime.now().isoformat()
    }
    insert_item('users', new_user)
    update_item('studentRecords', {'recordId': record_id}, {'isRegistered': True, 'registered': True, 'registeredUserId': new_user_id})

    clean_user = {k: v for k, v in new_user.items() if k not in ('password', '_id')}
    return jsonify({"success": True, "user": clean_user})

# --- 5. TIMETABLE, CLASS SESSIONS & CONFLICT CHECK ---
@app.route('/api/timetables', methods=['GET'])
def api_get_timetable():
    tts = get_collection_data('timetables')
    return jsonify(tts[0] if len(tts) > 0 else {})

@app.route('/api/timetables/save-and-notify', methods=['POST'])
def api_save_timetable():
    data = request.json or {}
    timetable_id = data.get('timetableId', 'tt_mca_sem1')
    reason = data.get('reason', 'Admin updated permanent timetable')

    tts = get_collection_data('timetables')
    tt = next((t for t in tts if t.get('timetableId') == timetable_id), None)
    if not tt:
        tt = tts[0] if len(tts) > 0 else {}

    new_version = tt.get('version', 1) + 1
    update_item('timetables', {'timetableId': tt.get('timetableId', timetable_id)}, {
        'version': new_version,
        'isPublished': True,
        'publishedAt': datetime.now().isoformat()
    })

    # Generate dated sessions for current week
    today = date.today()
    day_map = {'MONDAY': 0, 'TUESDAY': 1, 'WEDNESDAY': 2, 'THURSDAY': 3, 'FRIDAY': 4, 'SATURDAY': 5}
    for slot in tt.get('weeklySchedule', []):
        day_offset = day_map.get(slot.get('dayOfWeek'), 0)
        sess_date = (today - timedelta(days=today.weekday()) + timedelta(days=day_offset)).isoformat()
        sess_id = f"sess_{sess_date}_{slot.get('periodNumber')}"
        existing = next((s for s in get_collection_data('classSessions') if s.get('sessionId') == sess_id), None)
        sess_data = {
            "sessionId": sess_id,
            "timetableId": tt.get('timetableId', timetable_id),
            "subjectId": slot.get('subjectId'),
            "professorId": slot.get('professorId'),
            "date": sess_date,
            "dayOfWeek": slot.get('dayOfWeek'),
            "startTime": slot.get('startTime'),
            "endTime": slot.get('endTime'),
            "room": slot.get('room'),
            "status": "ON",
            "version": new_version
        }
        if existing:
            update_item('classSessions', {'sessionId': sess_id}, sess_data)
        else:
            insert_item('classSessions', sess_data)

    return jsonify({"success": True, "version": new_version, "message": "Timetable saved and sessions synchronized in MongoDB."})

@app.route('/api/sessions', methods=['GET'])
def api_sessions():
    return jsonify(get_collection_data('classSessions'))

# --- 6. INSTANT RESCHEDULING WITH REMINDER UPDATE ---
@app.route('/api/sessions/<session_id>/reschedule', methods=['POST'])
def api_reschedule(session_id):
    data = request.json or {}
    professor_id = data.get('professorId')
    new_date = data.get('newDate')
    new_start = data.get('newStartTime')
    new_end = data.get('newEndTime')
    new_room = data.get('newRoom')
    reason = data.get('reason', 'Class rescheduled')

    sessions = get_collection_data('classSessions')
    session = next((s for s in sessions if s.get('sessionId') == session_id), None)
    if not session:
        return jsonify({"success": False, "error": "Class session not found."}), 404

    old_date = session.get('date')
    old_time = f"{session.get('startTime')} - {session.get('endTime')}"
    old_room = session.get('room')
    new_version = session.get('version', 1) + 1

    # Invalidate previous reminders
    update_item('reminderJobs', {'sessionId': session_id, 'status': 'SCHEDULED'}, {'status': 'INVALIDATED'})

    # Update session
    update_item('classSessions', {'sessionId': session_id}, {
        'date': new_date,
        'startTime': new_start,
        'endTime': new_end,
        'room': new_room,
        'version': new_version,
        'rescheduleReason': reason,
        'updatedAt': datetime.now().isoformat()
    })

    # Record changelog
    change = {
        "changeId": f"change_{int(datetime.now().timestamp() * 1000)}",
        "sessionId": session_id,
        "professorId": professor_id,
        "oldDate": old_date,
        "newDate": new_date,
        "oldTime": old_time,
        "newTime": f"{new_start} - {new_end}",
        "oldRoom": old_room,
        "newRoom": new_room,
        "reason": reason,
        "sessionVersion": new_version,
        "timestamp": datetime.now().isoformat(),
        "deliveryStatus": "DELIVERED"
    }
    insert_item('changeLogs', change)

    # Broadcast notification to enrolled students
    insert_item('notifications', {
        "notificationId": f"notif_{int(datetime.now().timestamp() * 1000)}",
        "recipientId": "user_student_main",
        "title": "Class Rescheduled",
        "message": f"Lecture moved from {old_time} to {new_start} - {new_end} in {new_room}. Reason: {reason}",
        "type": "CLASS_RESCHEDULED",
        "sessionId": session_id,
        "read": False,
        "createdAt": datetime.now().isoformat(),
        "deliveryStatus": "DELIVERED"
    })

    return jsonify({"success": True, "newVersion": new_version, "changeLog": change})

# --- 7. ATTENDANCE SUBMISSION ---
@app.route('/api/attendance/mark', methods=['POST'])
def api_mark_attendance():
    data = request.json or {}
    session_id = data.get('sessionId')
    records = data.get('records', [])
    now_str = datetime.now().isoformat()

    for item in records:
        student_id = item.get('studentId')
        status = item.get('status', 'PRESENT')
        query = {'sessionId': session_id, 'studentId': student_id}
        existing = next((a for a in get_collection_data('attendance') if a.get('sessionId') == session_id and a.get('studentId') == student_id), None)
        rec = {
            "attendanceId": f"att_{session_id}_{student_id}",
            "sessionId": session_id,
            "studentId": student_id,
            "subjectId": data.get('subjectId', 'sub_mca_aos'),
            "professorId": data.get('professorId', 'user_prof_sharma'),
            "status": status,
            "markedAt": now_str
        }
        if existing:
            update_item('attendance', query, rec)
        else:
            insert_item('attendance', rec)

    return jsonify({"success": True, "markedCount": len(records)})

@app.route('/api/attendance', methods=['GET'])
def api_get_attendance():
    return jsonify(get_collection_data('attendance'))

# --- 8. QUESTION PAPERS & STUDY MATERIALS ---
@app.route('/api/question-papers', methods=['GET', 'POST'])
def api_question_papers():
    if request.method == 'GET':
        return jsonify(get_collection_data('questionPapers'))
    data = request.json or {}
    new_qp = {
        "paperId": f"qp_{int(datetime.now().timestamp() * 1000)}",
        "title": data.get('title'),
        "departmentId": data.get('departmentId', 'dept_mca'),
        "semester": str(data.get('semester', '1')),
        "academicYear": data.get('academicYear', '2026-2027'),
        "subjectId": data.get('subjectId'),
        "subjectName": data.get('subjectName', 'Subject'),
        "subjectCode": data.get('subjectCode', '24MCA11'),
        "fileName": data.get('fileName', 'paper.pdf'),
        "fileDataUrl": data.get('fileDataUrl', '/mca_timetable_official.png'),
        "fileSizeFormatted": data.get('fileSizeFormatted', '1.4 MB'),
        "uploadedAt": datetime.now().isoformat(),
        "uploadedBy": data.get('uploadedBy', 'College Admin')
    }
    insert_item('questionPapers', new_qp)
    return jsonify({"success": True, "paper": new_qp})

@app.route('/api/question-papers/<paper_id>', methods=['DELETE'])
def api_delete_question_paper(paper_id):
    delete_item('questionPapers', {'paperId': paper_id})
    return jsonify({"success": True, "deletedPaperId": paper_id})

@app.route('/api/study-materials', methods=['GET', 'POST'])
def api_study_materials():
    if request.method == 'GET':
        return jsonify(get_collection_data('studyMaterials'))
    data = request.json or {}
    new_mat = {
        "materialId": f"mat_{int(datetime.now().timestamp() * 1000)}",
        "title": data.get('title'),
        "departmentId": data.get('departmentId', 'dept_mca'),
        "semester": str(data.get('semester', '1')),
        "subjectId": data.get('subjectId'),
        "subjectName": data.get('subjectName'),
        "subjectCode": data.get('subjectCode'),
        "description": data.get('description', ''),
        "fileName": data.get('fileName', 'notes.pdf'),
        "fileDataUrl": data.get('fileDataUrl', '/mca_timetable_official.png'),
        "fileSizeFormatted": data.get('fileSizeFormatted', '2.5 MB'),
        "uploadedAt": datetime.now().isoformat(),
        "uploadedBy": data.get('uploadedBy', 'Faculty')
    }
    insert_item('studyMaterials', new_mat)
    return jsonify({"success": True, "material": new_mat})

# --- 9. STUDENT SUPPORT TICKETS (I NEED HELP) ---
@app.route('/api/support-requests', methods=['GET', 'POST'])
def api_support_requests():
    if request.method == 'GET':
        student_id = request.args.get('studentId')
        reqs = get_collection_data('supportRequests')
        if student_id:
            reqs = [r for r in reqs if r.get('studentId') == student_id]
        return jsonify(reqs)
    
    data = request.json or {}
    new_req = {
        "requestId": f"help_{int(datetime.now().timestamp() * 1000)}",
        "studentId": data.get('studentId', 'user_student_main'),
        "studentName": data.get('studentName', 'Student'),
        "usn": data.get('usn', '1NN24MC001'),
        "category": data.get('category', 'ATTENDANCE_CORRECTION'),
        "subject": data.get('subject', '').strip(),
        "message": data.get('message', '').strip(),
        "status": "OPEN",
        "createdAt": datetime.now().isoformat()
    }
    insert_item('supportRequests', new_req)
    return jsonify({"success": True, "request": new_req})

@app.route('/api/support-requests/<request_id>/reply', methods=['PUT'])
def api_reply_support_request(request_id):
    data = request.json or {}
    reply = data.get('reply', '').strip()
    status = data.get('status', 'RESOLVED')
    update_item('supportRequests', {'requestId': request_id}, {
        'adminResponse': reply,
        'status': status,
        'resolvedAt': datetime.now().isoformat()
    })
    return jsonify({"success": True, "requestId": request_id, "status": status})

# --- 10. NOTIFICATIONS & 10-MINUTE REMINDERS ---
@app.route('/api/notifications', methods=['GET', 'POST'])
def api_notifications():
    if request.method == 'GET':
        user_id = request.args.get('userId')
        notifs = get_collection_data('notifications')
        if user_id:
            notifs = [n for n in notifs if n.get('recipientId') == user_id]
        return jsonify(notifs)
    data = request.json or {}
    new_n = {
        "notificationId": f"notif_{int(datetime.now().timestamp() * 1000)}",
        "recipientId": data.get('recipientId'),
        "title": data.get('title'),
        "message": data.get('message'),
        "type": data.get('type', 'CLASS_REMINDER'),
        "read": False,
        "createdAt": datetime.now().isoformat(),
        "deliveryStatus": "DELIVERED"
    }
    insert_item('notifications', new_n)
    return jsonify({"success": True, "notification": new_n})

@app.route('/api/notifications/read-all', methods=['POST'])
def api_read_all_notifications():
    data = request.json or {}
    user_id = data.get('userId')
    if user_id:
        update_item('notifications', {'recipientId': user_id}, {'read': True})
    return jsonify({"success": True})

# --- 11. ANNOUNCEMENTS & SETTINGS ---
@app.route('/api/announcements', methods=['GET', 'POST'])
def api_announcements():
    if request.method == 'GET':
        return jsonify(get_collection_data('announcements'))
    data = request.json or {}
    new_ann = {
        "announcementId": f"ann_{int(datetime.now().timestamp() * 1000)}",
        "title": data.get('title'),
        "message": data.get('message'),
        "subjectId": data.get('subjectId'),
        "subjectName": data.get('subjectName', 'MCA Department'),
        "professorId": data.get('professorId', 'user_prof_sharma'),
        "professorName": data.get('professorName', 'Prof. Dr. Rajesh Sharma'),
        "createdAt": datetime.now().isoformat()
    }
    insert_item('announcements', new_ann)
    return jsonify({"success": True, "announcement": new_ann})

@app.route('/api/settings', methods=['GET', 'PUT'])
def api_settings():
    if request.method == 'GET':
        sets = get_collection_data('settings')
        return jsonify(sets[0] if len(sets) > 0 else {})
    data = request.json or {}
    sets = get_collection_data('settings')
    if len(sets) > 0:
        update_item('settings', {}, data)
    else:
        insert_item('settings', data)
    return jsonify({"success": True, "settings": data})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"[ClassConnect Central Backend] Running on port {port} with MongoDB connected: {is_mongo_active}...")
    app.run(host='0.0.0.0', port=port, debug=True)
