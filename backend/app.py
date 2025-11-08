from flask import request, jsonify, Flask
import requests
from flask_mysqldb import MySQL
from MySQLdb.cursors import DictCursor
from datetime import datetime, date, time, timedelta
from decimal import Decimal
from dotenv import load_dotenv
import os
load_dotenv() 
app = Flask(__name__)

app.config['MYSQL_HOST'] = os.getenv('MYSQL_HOST')
app.config['MYSQL_USER'] = os.getenv('MYSQL_USER')
app.config['MYSQL_PASSWORD'] = os.getenv('MYSQL_PASSWORD')
app.config['MYSQL_DB'] = os.getenv('MYSQL_DB')

mysql = MySQL(app)


from flask_cors import CORS
CORS(app)

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

def verify_supabase_token():
    token = request.headers.get("Authorization", "").replace("Bearer ", "")
    if not token:
        return None
    
    response = requests.get(f"{SUPABASE_URL}/auth/v1/user", headers={
        "Authorization": f"Bearer {token}",
        "apikey": SUPABASE_ANON_KEY
    })
    
    if response.status_code == 200:
        return response.json()
    return None

@app.route("/api/student/register", methods=["POST"])
def create_student_profile():
    user = verify_supabase_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    print(data)
    cur = mysql.connection.cursor()
    dept_id = data.get("department_id")
    dept_id = int(dept_id) if dept_id not in (None, "", "null") else None


    cur.execute("""
        INSERT INTO Student (Supabase_ID, First_Name, Last_Name, Email, Phone, Year, Department_ID)
    VALUES (%s, %s, %s, %s, %s, %s, %s)
    ON DUPLICATE KEY UPDATE
      First_Name = VALUES(First_Name),
      Last_Name = VALUES(Last_Name),
      Phone = VALUES(Phone),
      Year = VALUES(Year),
      Department_ID = VALUES(Department_ID)
    """, (user["id"], data["first_name"], data["last_name"], user["email"], data["phone"], data["year"], dept_id))
    
    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Profile created"})

@app.route("/api/departments", methods=["GET"])
def get_departments():
    cur = mysql.connection.cursor()
    cur.execute("SELECT Department_ID, Dept_Name FROM Department")
    departments = [
        {"department_id": row[0], "dept_name": row[1]} for row in cur.fetchall()
    ]
    cur.close()
    return jsonify(departments)

@app.route("/api/student/profile", methods=["GET"])
def get_student_profile():
    user = verify_supabase_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT s.*, d.Dept_Name
        FROM Student s
        JOIN Department d ON s.Department_ID = d.Department_ID
        WHERE Supabase_ID = %s
    """, (user["id"],))
    student = cur.fetchone()
    cur.close()
    return jsonify(student)

@app.route("/api/events", methods=["GET"])
def get_events():
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT e.*, d.Dept_Name AS Department_Name, s.Name AS Sponsor_Name
        FROM Event e
        JOIN Department d ON e.Department_ID = d.Department_ID
        LEFT JOIN Sponsor s ON e.Sponsor_ID = s.Sponsor_ID
        ORDER BY e.Date ASC
    """)
    rows = cur.fetchall()
    cur.close()

    events = []
    for row in rows:
        event_time = row["Time"]
        if isinstance(event_time, timedelta):
            total_seconds = int(event_time.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            event_time = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        elif isinstance(event_time, time):
            event_time = event_time.strftime("%H:%M:%S")

        registration_fee = (
            float(row["Registration_Fee"]) if isinstance(row["Registration_Fee"], Decimal) else row["Registration_Fee"]
        )
        event_date = (
            row["Date"].isoformat() if isinstance(row["Date"], (date, datetime)) else row["Date"]
        )

        event = {
            "event_id": row["Event_ID"],
            "event_name": row["Event_Name"],
            "description": row["Description"],
            "date": event_date,
            "time": event_time,
            "venue": row["Venue"],
            "department_id": row["Department_ID"],
            "sponsor_id": row["Sponsor_ID"],
            "max_participants": row["Max_Participants"],
            "registration_fee": registration_fee,
            "event_type": row["Event_Type"],
            "department_name": row["Department_Name"],
            "sponsor_name": row["Sponsor_Name"],
        }
        events.append(event)

    return jsonify(events)


@app.route("/api/registrations/<int:student_id>", methods=["GET"])
def get_registrations(student_id):
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("""
        SELECT 
            r.Registration_ID,
            r.Event_ID,
            r.Student_ID,
            r.Registration_Date,
            r.Payment_Status,
            e.Event_Name,
            e.Description,
            e.Date,
            e.Time,
            e.Venue,
            e.Event_Type,
            e.Max_Participants,
            e.Registration_Fee
        FROM Registration r
        JOIN Event e ON r.Event_ID = e.Event_ID
        WHERE r.Student_ID = %s
        ORDER BY r.Registration_Date DESC
    """, (student_id,))
    
    rows = cur.fetchall()
    cur.close()

    registrations = []
    for row in rows:
        # Convert time
        event_time = row["Time"]
        if isinstance(event_time, timedelta):
            total_seconds = int(event_time.total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            event_time = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        elif isinstance(event_time, time):
            event_time = event_time.strftime("%H:%M:%S")

        # Convert Decimal → float
        registration_fee = (
            float(row["Registration_Fee"]) if isinstance(row["Registration_Fee"], Decimal) else row["Registration_Fee"]
        )

        # Convert date → string
        reg_date = (
            row["Registration_Date"].isoformat() if isinstance(row["Registration_Date"], (date, datetime)) else row["Registration_Date"]
        )
        event_date = (
            row["Date"].isoformat() if isinstance(row["Date"], (date, datetime)) else row["Date"]
        )

        registration = {
            "registration_id": row["Registration_ID"],
            "event_id": row["Event_ID"],
            "student_id": row["Student_ID"],
            "registration_date": reg_date,
            "payment_status": row["Payment_Status"],
            "event_name": row["Event_Name"],
            "description": row["Description"],
            "date": event_date,
            "time": event_time,
            "venue": row["Venue"],
            "event_type": row["Event_Type"],
            "max_participants": row["Max_Participants"],
            "registration_fee": registration_fee,
        }
        registrations.append(registration)
    return jsonify(registrations)


@app.route("/api/register_event", methods=["POST"])
def register_event():
    user = verify_supabase_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    data = request.json
    cur = mysql.connection.cursor()

    cur.execute("SELECT Student_ID FROM Student WHERE Supabase_ID = %s", (user["id"],))
    student = cur.fetchone()
    if not student:
        return jsonify({"error": "Student not found"}), 404

    cur.execute("""
        INSERT INTO Registration (Event_ID, Student_ID, Payment_Status)
        VALUES (%s, %s, %s)
    """, (data["event_id"], student[0], "Pending"))

    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Registered successfully!"})

@app.route("/api/cancel_registration/<int:registration_id>", methods=["DELETE"])
def cancel_registration(registration_id):
    user = verify_supabase_token()
    if not user:
        return jsonify({"error": "Unauthorized"}), 401

    cur = mysql.connection.cursor()
    cur.execute("DELETE FROM Registration WHERE Registration_ID = %s", (registration_id,))
    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Registration canceled"})

@app.route("/api/organizer/login", methods=["POST"])
def organizer_login():
    data = request.json
    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400

    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT * FROM Organizer WHERE Email = %s AND Password = %s", (email, password))
    organizer = cur.fetchone()
    cur.close()

    if not organizer:
        return jsonify({"error": "Invalid credentials"}), 401

    return jsonify({
        "message": "Login successful",
        "organizer": organizer
    }), 200

@app.route("/api/organizer/event", methods=["POST"])
def create_event():

    data = request.json
    cur = mysql.connection.cursor()
    sponsor_id = data.get("sponsor_id")

    cur.execute("""
        INSERT INTO Event (
            Event_Name, Description, Date, Time, Venue, 
            Department_ID, Sponsor_ID, Max_Participants, 
            Registration_Fee, Event_Type
        )
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
    """, (
        data["name"], 
        data["description"], 
        data["date"], 
        data["time"], 
        data["venue"],
        data["department_id"], 
        sponsor_id, 
        data["max_participants"], 
        data["fee"], 
        data["type"]
    ))

    mysql.connection.commit()
    cur.close()

    return jsonify({"message": "Event created successfully!"}), 201

@app.route("/api/events/<int:event_id>", methods=["PUT"])
def update_event(event_id):
    data = request.json
    cur = mysql.connection.cursor()
    
    cur.execute("""
        UPDATE Event
        SET Event_Name=%s, Description=%s, Date=%s, Time=%s, Venue=%s,
            Sponsor_ID=%s, Max_Participants=%s, Registration_Fee=%s, Event_Type=%s
        WHERE Event_ID=%s
    """, (
        data.get("name"),
        data.get("description"),
        data.get("date"),
        data.get("time"),
        data.get("venue"),
        data.get("sponsor_id"),
        data.get("max_participants"),
        data.get("fee"),
        data.get("type"),
        event_id
    ))

    mysql.connection.commit()
    cur.close()
    return jsonify({"message": "Event updated successfully!"}), 200

@app.route("/api/events/search", methods=["GET"])
def search_events():
    query = request.args.get("q", "")
    cur = mysql.connection.cursor(DictCursor)

    cur.execute("""
        SELECT e.*, d.Dept_Name, s.Name AS Sponsor_Name
        FROM Event e
        JOIN Department d ON e.Department_ID = d.Department_ID
        LEFT JOIN Sponsor s ON e.Sponsor_ID = s.Sponsor_ID
        WHERE e.Event_Name LIKE %s
        ORDER BY e.Date ASC
    """, (f"%{query}%",))

    events = cur.fetchall()
    cur.close()

    return jsonify(events)



@app.route("/api/organizer/<int:organizer_id>", methods=["GET"])
def get_organizer_dashboard(organizer_id):
    cur = mysql.connection.cursor(DictCursor)

    cur.execute("""
        SELECT o.*, d.Dept_Name
        FROM Organizer o
        JOIN Department d ON o.Department_ID = d.Department_ID
        WHERE o.Organizer_ID = %s
    """, (organizer_id,))
    organizer = cur.fetchone()

    if not organizer:
        cur.close()
        return jsonify({"error": "Organizer not found"}), 404

    cur.execute("""
        SELECT e.*, d.Dept_Name, s.Name AS Sponsor_Name
        FROM Event e
        JOIN Department d ON e.Department_ID = d.Department_ID
        LEFT JOIN Sponsor s ON e.Sponsor_ID = s.Sponsor_ID
        WHERE e.Department_ID = %s
        ORDER BY e.Date ASC
    """, (organizer["Department_ID"],))
    events = cur.fetchall()

    # Convert timedelta/time fields to readable strings
    for event in events:
        if isinstance(event.get("Time"), timedelta):
            total_seconds = int(event["Time"].total_seconds())
            hours = total_seconds // 3600
            minutes = (total_seconds % 3600) // 60
            seconds = total_seconds % 60
            event["Time"] = f"{hours:02d}:{minutes:02d}:{seconds:02d}"
        elif isinstance(event.get("Time"), time):
            event["Time"] = event["Time"].strftime("%H:%M:%S")

    cur.execute("SELECT * FROM Sponsor")
    sponsors = cur.fetchall()

    cur.close()

    return jsonify({
        "organizer": organizer,
        "events": events,
        "sponsors": sponsors
    })

@app.route("/api/sponsors", methods=["GET"])
def get_sponsors():
    cur = mysql.connection.cursor(DictCursor)
    cur.execute("SELECT Sponsor_ID, Name FROM Sponsor ORDER BY Name ASC")
    sponsors = cur.fetchall()
    cur.close()
    return jsonify(sponsors)


if __name__ == "__main__":
    app.run( port=8000, debug=True)