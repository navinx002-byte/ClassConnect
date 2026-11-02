import os
import json
import csv
from datetime import datetime, date
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

# --- MONGODB CONNECTION WITH LOCAL FALLBACK ---
MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
DB_NAME = 'classconnect'

mongo_client = None
mongo_db = None
is_mongo_active = False

try:
    mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=1500)
    # Test connection
    mongo_client.admin.command('ping')
    mongo_db = mongo_client[DB_NAME]
    is_mongo_active = True
    print(f"[ClassConnect Backend] Connected to MongoDB database '{DB_NAME}' successfully!")
except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
    print(f"[ClassConnect Backend] MongoDB offline or unreachable ({e}). Using file-backed JSON engine.")
    is_mongo_active = False

# Helper to read/write fallback database when Mongo daemon is not running locally
def load_fallback_db():
    if not os.path.exists(DATA_FALLBACK_FILE):
        initial = {
            "settings": {
                "collegeName": "My College of Engineering & Technology",
                "currentSemester": "Semester 1",
                "minAttendanceThreshold": 75,
                "warningAttendanceThreshold": 65,
                "timezone": "Asia/Kolkata"
            },
            "departments": [
                {"departmentId": "dept_cse", "name": "Computer Science & Engineering", "code": "CSE"},
                {"departmentId": "dept_ece", "name": "Electronics & Communication", "code": "ECE"},
                {"departmentId": "dept_me", "name": "Mechanical Engineering", "code": "ME"}
            ],
            "users": [
                {
                    "userId": "user_admin_01",
                    "name": "College Administrator",
                    "email": "admin@college.edu",
                    "password": "Admin@123",
                    "role": "ADMIN",
                    "departmentId": "dept_cse",
                    "active": True,
                    "createdAt": datetime.now().isoformat()
                },
                {
                    "userId": "user_prof_main",
                    "name": "Prof. Dr. Rajesh Sharma",
                    "email": "professor@college.edu",
                    "password": "Prof@123",
                    "role": "PROFESSOR",
                    "departmentId": "dept_cse",
                    "active": True,
                    "createdAt": datetime.now().isoformat()
                },
                {
                    "userId": "user_student_main",
                    "name": "Rahul Verma",
                    "email": "student@college.edu",
                    "password": "Student@123",
                    "role": "STUDENT",
                    "departmentId": "dept_cse",
                    "studentGroupId": "grp_sec_a",
                    "rollNumber": "CS-2026-001",
                    "active": True,
                    "createdAt": datetime.now().isoformat()
                }
            ],
            "subjects": [],
            "timetables": [
                {
                    "timetableId": "tt_main",
                    "departmentId": "dept_cse",
                    "studentGroupId": "grp_sec_a",
                    "semester": "1",
                    "weeklySchedule": [],
                    "version": 1,
                    "isPublished": False
                }
            ],
            "timetableDocuments": [],
            "classSessions": [],
            "attendance": [],
            "changeLogs": [],
            "announcements": [],
            "notifications": []
        }
        save_fallback_db(initial)
        return initial
    try:
        with open(DATA_FALLBACK_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception:
        return {}

def save_fallback_db(data):
    with open(DATA_FALLBACK_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2)

# Generic collection helpers
def get_collection_data(collection_name):
    if is_mongo_active:
        docs = list(mongo_db[collection_name].find())
        for d in docs:
            d['_id'] = str(d['_id'])
        return docs
    else:
        db = load_fallback_db()
        return db.get(collection_name, [])

def insert_item(collection_name, item):
    if is_mongo_active:
        res = mongo_db[collection_name].insert_one(item)
        item['_id'] = str(res.inserted_id)
        return item
    else:
        db = load_fallback_db()
        if collection_name not in db:
            db[collection_name] = []
        db[collection_name].append(item)
        save_fallback_db(db)
        return item

def update_item(collection_name, query, updates):
    if is_mongo_active:
        mongo_db[collection_name].update_many(query, {'$set': updates})
        return True
    else:
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

# Seed initial admin if database is empty
def seed_initial_admin():
    users = get_collection_data('users')
    if len(users) == 0:
        admin_data = {
            "userId": "user_admin_01",
            "name": "College Administrator",
            "email": "admin@college.edu",
            "password": "Admin@123",
            "role": "ADMIN",
            "departmentId": "dept_cse",
            "active": True,
            "createdAt": datetime.now().isoformat()
        }
        insert_item('users', admin_data)
        insert_item('departments', {"departmentId": "dept_cse", "name": "Computer Science & Engineering", "code": "CSE"})
        insert_item('departments', {"departmentId": "dept_ece", "name": "Electronics & Communication", "code": "ECE"})
        insert_item('departments', {"departmentId": "dept_me", "name": "Mechanical Engineering", "code": "ME"})
        insert_item('timetables', {
            "timetableId": "tt_main",
            "departmentId": "dept_cse",
            "studentGroupId": "grp_sec_a",
            "semester": "1",
            "weeklySchedule": [],
            "version": 1,
            "isPublished": False
        })
        print("[ClassConnect] Clean starter admin created: admin@college.edu / Admin@123")

seed_initial_admin()

# ==============================================================
# API ROUTES
# ==============================================================

@app.route('/api/status', methods=['GET'])
def get_system_status():
    users_count = len(get_collection_data('users'))
    subjects_count = len(get_collection_data('subjects'))
    sessions_count = len(get_collection_data('classSessions'))
    docs_count = len(get_collection_data('timetableDocuments'))

    return jsonify({
        "status": "online",
        "databaseEngine": "MongoDB" if is_mongo_active else "Local Engine (MongoDB Standby)",
        "mongoConnected": is_mongo_active,
        "databaseName": DB_NAME,
        "counts": {
            "users": users_count,
            "subjects": subjects_count,
            "sessions": sessions_count,
            "timetableDocuments": docs_count
        }
    })

# --- AUTHENTICATION & REGISTRATION ---
@app.route('/api/auth/login', methods=['POST'])
def api_login():
    data = request.json or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    users = get_collection_data('users')
    user = next((u for u in users if u.get('email', '').lower() == email), None)

    if not user:
        return jsonify({"success": False, "error": "No account registered with this college email."}), 404

    if not user.get('active', True):
        return jsonify({"success": False, "error": "This account is inactive. Please contact administration."}), 403

    # Remove password from response
    user_resp = {k: v for k, v in user.items() if k not in ('password', '_id')}
    return jsonify({
        "success": True,
        "user": user_resp,
        "role": user.get('role')
    })

@app.route('/api/auth/register', methods=['POST'])
def api_register():
    data = request.json or {}
    email = data.get('email', '').strip().lower()

    users = get_collection_data('users')
    if any(u.get('email', '').lower() == email for u in users):
        return jsonify({"success": False, "error": "An account with this email already exists."}), 400

    new_user = {
        "userId": f"user_{int(datetime.now().timestamp() * 1000)}",
        "name": data.get('name', 'User'),
        "email": email,
        "password": data.get('password', 'Pass@123'),
        "role": data.get('role', 'STUDENT'),
        "departmentId": data.get('departmentId', 'dept_cse'),
        "studentGroupId": data.get('studentGroupId'),
        "rollNumber": data.get('rollNumber'),
        "active": True,
        "createdAt": datetime.now().isoformat()
    }

    insert_item('users', new_user)
    user_resp = {k: v for k, v in new_user.items() if k not in ('password', '_id')}
    return jsonify({"success": True, "user": user_resp, "role": new_user['role']})

# --- USERS MANAGEMENT ---
@app.route('/api/users', methods=['GET', 'POST'])
def api_users():
    if request.method == 'GET':
        users = get_collection_data('users')
        clean_users = [{k: v for k, v in u.items() if k not in ('password', '_id')} for u in users]
        return jsonify(clean_users)
    
    data = request.json or {}
    new_user = {
        "userId": f"user_{int(datetime.now().timestamp() * 1000)}",
        "name": data.get('name'),
        "email": data.get('email', '').strip().lower(),
        "password": data.get('password', 'College@123'),
        "role": data.get('role', 'STUDENT'),
        "departmentId": data.get('departmentId', 'dept_cse'),
        "studentGroupId": data.get('studentGroupId'),
        "rollNumber": data.get('rollNumber'),
        "active": True,
        "createdAt": datetime.now().isoformat()
    }
    insert_item('users', new_user)
    return jsonify({"success": True, "user": {k: v for k, v in new_user.items() if k != 'password'}})

@app.route('/api/users/<user_id>', methods=['PUT'])
def api_update_user(user_id):
    data = request.json or {}
    updates = {}
    if 'active' in data:
        updates['active'] = data['active']
    if 'name' in data:
        updates['name'] = data['name']
    if 'departmentId' in data:
        updates['departmentId'] = data['departmentId']
    
    update_item('users', {'userId': user_id}, updates)
    return jsonify({"success": True, "userId": user_id, "updated": updates})

# --- DEPARTMENTS & SUBJECTS ---
@app.route('/api/departments', methods=['GET', 'POST'])
def api_departments():
    if request.method == 'GET':
        return jsonify(get_collection_data('departments'))
    data = request.json or {}
    new_dept = {
        "departmentId": f"dept_{int(datetime.now().timestamp())}",
        "name": data.get('name'),
        "code": data.get('code', 'ENG')
    }
    insert_item('departments', new_dept)
    return jsonify(new_dept)

@app.route('/api/subjects', methods=['GET', 'POST'])
def api_subjects():
    if request.method == 'GET':
        return jsonify(get_collection_data('subjects'))
    data = request.json or {}
    new_subject = {
        "subjectId": f"sub_{int(datetime.now().timestamp() * 1000)}",
        "name": data.get('name'),
        "code": data.get('code'),
        "departmentId": data.get('departmentId', 'dept_cse'),
        "professorId": data.get('professorId'),
        "defaultRoom": data.get('defaultRoom', 'Room 101'),
        "createdAt": datetime.now().isoformat()
    }
    insert_item('subjects', new_subject)
    return jsonify(new_subject)

# --- TIMETABLE: MANUAL SLOTS & FILE EXPLORER UPLOAD ---
@app.route('/api/timetables', methods=['GET'])
def api_get_timetable():
    timetables = get_collection_data('timetables')
    if len(timetables) == 0:
        initial_tt = {
            "timetableId": "tt_main",
            "departmentId": "dept_cse",
            "studentGroupId": "grp_sec_a",
            "semester": "1",
            "weeklySchedule": [],
            "version": 1,
            "isPublished": False
        }
        insert_item('timetables', initial_tt)
        return jsonify(initial_tt)
    return jsonify(timetables[0])

@app.route('/api/timetables/slots', methods=['POST'])
def api_add_slot():
    data = request.json or {}
    timetables = get_collection_data('timetables')
    tt = timetables[0] if len(timetables) > 0 else {}
    
    new_slot = {
        "id": f"slot_{int(datetime.now().timestamp() * 1000)}",
        "dayOfWeek": data.get('dayOfWeek', 'MONDAY'),
        "periodNumber": int(data.get('periodNumber', 1)),
        "startTime": data.get('startTime', '09:00'),
        "endTime": data.get('endTime', '10:00'),
        "subjectId": data.get('subjectId'),
        "professorId": data.get('professorId'),
        "room": data.get('room', 'Room 101')
    }
    
    schedule = tt.get('weeklySchedule', [])
    schedule.append(new_slot)
    update_item('timetables', {'timetableId': tt.get('timetableId', 'tt_main')}, {'weeklySchedule': schedule})
    return jsonify({"success": True, "slot": new_slot})

@app.route('/api/timetables/slots/<slot_id>', methods=['DELETE'])
def api_delete_slot(slot_id):
    timetables = get_collection_data('timetables')
    tt = timetables[0] if len(timetables) > 0 else {}
    schedule = [s for s in tt.get('weeklySchedule', []) if s.get('id') != slot_id]
    update_item('timetables', {'timetableId': tt.get('timetableId', 'tt_main')}, {'weeklySchedule': schedule})
    return jsonify({"success": True, "deletedSlotId": slot_id})

# --- FILE EXPLORER UPLOAD FOR TIMETABLES (PDF, Excel, Images) ---
@app.route('/api/timetables/upload-file', methods=['POST'])
def api_upload_timetable_file():
    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": f"Invalid format. Allowed: {ALLOWED_EXTENSIONS}"}), 400

    filename = secure_filename(f"{int(datetime.now().timestamp())}_{file.filename}")
    save_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(save_path)

    file_ext = filename.rsplit('.', 1)[1].lower()
    parsed_slots_count = 0

    # Auto-parse Excel / CSV files if table columns exist
    if file_ext in ('xlsx', 'xls'):
        try:
            import openpyxl
            wb = openpyxl.load_workbook(save_path)
            sheet = wb.active
            rows = list(sheet.iter_rows(values_only=True))
            if len(rows) > 1:
                # First row as headers
                headers = [str(c).strip().lower() if c else '' for c in rows[0]]
                # Map columns
                day_idx = next((i for i, h in enumerate(headers) if 'day' in h), 0)
                period_idx = next((i for i, h in enumerate(headers) if 'period' in h), 1)
                time_idx = next((i for i, h in enumerate(headers) if 'time' in h), 2)
                sub_idx = next((i for i, h in enumerate(headers) if 'sub' in h or 'course' in h), 3)
                room_idx = next((i for i, h in enumerate(headers) if 'room' in h), 4)

                timetables = get_collection_data('timetables')
                tt = timetables[0] if len(timetables) > 0 else {}
                schedule = tt.get('weeklySchedule', [])

                for r in rows[1:]:
                    if not r or not any(r): continue
                    day_val = str(r[day_idx] or 'MONDAY').upper()
                    time_val = str(r[time_idx] or '09:00 - 10:00')
                    times = time_val.split('-')
                    start_t = times[0].strip() if len(times) > 0 else '09:00'
                    end_t = times[1].strip() if len(times) > 1 else '10:00'

                    schedule.append({
                        "id": f"slot_{int(datetime.now().timestamp() * 1000)}_{parsed_slots_count}",
                        "dayOfWeek": day_val if day_val in ('MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY') else 'MONDAY',
                        "periodNumber": int(r[period_idx]) if str(r[period_idx]).isdigit() else (parsed_slots_count + 1),
                        "startTime": start_t,
                        "endTime": end_t,
                        "subjectId": str(r[sub_idx] or 'Subject'),
                        "professorId": 'Prof',
                        "room": str(r[room_idx] or 'Hall 1')
                    })
                    parsed_slots_count += 1

                update_item('timetables', {'timetableId': tt.get('timetableId', 'tt_main')}, {'weeklySchedule': schedule})
        except Exception as e:
            print(f"[ClassConnect] Excel parse notice: {e}")

    # Record document metadata
    doc_info = {
        "docId": f"doc_{int(datetime.now().timestamp() * 1000)}",
        "originalName": file.filename,
        "savedFilename": filename,
        "fileType": file_ext,
        "fileUrl": f"/api/timetables/files/{filename}",
        "uploadedAt": datetime.now().isoformat(),
        "parsedSlotsCount": parsed_slots_count
    }
    insert_item('timetableDocuments', doc_info)

    return jsonify({
        "success": True,
        "message": f"Timetable file '{file.filename}' uploaded successfully!",
        "document": doc_info
    })

@app.route('/api/timetables/files/<filename>', methods=['GET'])
def api_serve_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

@app.route('/api/timetables/documents', methods=['GET'])
def api_list_documents():
    return jsonify(get_collection_data('timetableDocuments'))

# --- SESSIONS, ATTENDANCE & RESCHEDULING ---
@app.route('/api/timetables/publish', methods=['POST'])
def api_publish_timetable():
    timetables = get_collection_data('timetables')
    tt = timetables[0] if len(timetables) > 0 else {}
    version = tt.get('version', 1) + 1
    update_item('timetables', {'timetableId': tt.get('timetableId', 'tt_main')}, {
        'version': version,
        'isPublished': True,
        'publishedAt': datetime.now().isoformat()
    })

    # Generate current week sessions from published timetable
    today = date.today()
    monday = today - datetime.timedelta(days=today.weekday()) if hasattr(datetime, 'timedelta') else today
    # Generate dated sessions for current week
    day_map = {'MONDAY': 0, 'TUESDAY': 1, 'WEDNESDAY': 2, 'THURSDAY': 3, 'FRIDAY': 4, 'SATURDAY': 5}
    
    for slot in tt.get('weeklySchedule', []):
        day_offset = day_map.get(slot.get('dayOfWeek'), 0)
        from datetime import timedelta
        sess_date = (today - timedelta(days=today.weekday()) + timedelta(days=day_offset)).isoformat()
        
        insert_item('classSessions', {
            "sessionId": f"sess_{sess_date}_{slot.get('periodNumber')}",
            "timetableId": tt.get('timetableId', 'tt_main'),
            "subjectId": slot.get('subjectId'),
            "professorId": slot.get('professorId'),
            "date": sess_date,
            "dayOfWeek": slot.get('dayOfWeek'),
            "startTime": slot.get('startTime'),
            "endTime": slot.get('endTime'),
            "room": slot.get('room'),
            "status": "ON",
            "version": 1
        })

    return jsonify({"success": True, "publishedVersion": version})

@app.route('/api/sessions', methods=['GET'])
def api_sessions():
    sessions = get_collection_data('classSessions')
    return jsonify(sessions)

# STRICT ATTENDANCE MARKING
@app.route('/api/attendance/mark', methods=['POST'])
def api_mark_attendance():
    data = request.json or {}
    professor_id = data.get('professorId')
    session_id = data.get('sessionId')
    student_records = data.get('studentRecords', [])

    sessions = get_collection_data('classSessions')
    session = next((s for s in sessions if s.get('sessionId') == session_id), None)
    if not session:
        return jsonify({"success": False, "error": "Class session not found."}), 404

    # Strict subject permission verification
    if session.get('professorId') != professor_id:
        return jsonify({
            "success": False,
            "error": f"PERMISSION_DENIED: You are not authorized to mark attendance for session {session_id}."
        }), 403

    now_str = datetime.now().isoformat()
    for item in student_records:
        rec = {
            "attendanceId": f"att_{session_id}_{item.get('studentId')}",
            "sessionId": session_id,
            "subjectId": session.get('subjectId'),
            "professorId": professor_id,
            "studentId": item.get('studentId'),
            "status": item.get('status', 'PRESENT'),
            "markedAt": now_str
        }
        insert_item('attendance', rec)

        if item.get('status') == 'ABSENT':
            # Send immediate alert notification
            insert_item('notifications', {
                "notificationId": f"notif_{int(datetime.now().timestamp() * 1000)}",
                "recipientId": item.get('studentId'),
                "title": "Absence Alert",
                "message": f"You were marked ABSENT for class on {session.get('date')} ({session.get('startTime')}).",
                "type": "STUDENT_MARKED_ABSENT",
                "read": False,
                "createdAt": now_str
            })

    return jsonify({"success": True, "markedCount": len(student_records)})

# INSTANT-LOG RESCHEDULING
@app.route('/api/sessions/<session_id>/reschedule', methods=['POST'])
def api_reschedule_session(session_id):
    data = request.json or {}
    professor_id = data.get('professorId')
    new_date = data.get('newDate')
    new_start = data.get('newStartTime')
    new_end = data.get('newEndTime')
    new_room = data.get('newRoom')
    reason = data.get('reason', 'Class rescheduled by professor')

    sessions = get_collection_data('classSessions')
    session = next((s for s in sessions if s.get('sessionId') == session_id), None)
    if not session:
        return jsonify({"success": False, "error": "Session not found."}), 404

    if session.get('professorId') != professor_id:
        return jsonify({"success": False, "error": "PERMISSION_DENIED: Only assigned professor can reschedule."}), 403

    old_date = session.get('date')
    old_time = f"{session.get('startTime')} - {session.get('endTime')}"
    old_room = session.get('room')
    new_version = session.get('version', 1) + 1

    # Update session immediately
    update_item('classSessions', {'sessionId': session_id}, {
        'date': new_date,
        'startTime': new_start,
        'endTime': new_end,
        'room': new_room,
        'version': new_version,
        'rescheduleReason': reason,
        'updatedAt': datetime.now().isoformat()
    })

    # Create immutable audit record
    change_log = {
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
    insert_item('changeLogs', change_log)

    return jsonify({"success": True, "newVersion": new_version, "changeLog": change_log})

@app.route('/api/changelogs', methods=['GET'])
def api_changelogs():
    return jsonify(get_collection_data('changeLogs'))

@app.route('/api/notifications', methods=['GET'])
def api_notifications():
    user_id = request.args.get('userId')
    notifs = get_collection_data('notifications')
    if user_id:
        notifs = [n for n in notifs if n.get('recipientId') == user_id]
    return jsonify(notifs)

if __name__ == '__main__':
    print("[ClassConnect Flask Server] Starting on port 5000...")
    app.run(host='0.0.0.0', port=5000, debug=True)
