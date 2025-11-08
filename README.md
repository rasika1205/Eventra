# Eventra

## Overview

Eventra is an event management platform built with Flask and MySQL, providing a RESTful API for managing university events, student profiles, registrations, and organizers. It supports authentication via Supabase and includes robust endpoints for interacting with the event database.

This backend is designed to serve as the core of an event management application, handling user registration, event creation, sponsor management, student authentication, and more.

---

## Features

- **Student Registration & Profile Management:** Create student profiles securely.
- **Serach Engine:** Students can search for events.
- **Department & Sponsor APIs:** Fetch available departments and sponsors.
- **Event Management:** Create, list, and manage events; supports association with departments and sponsors.
- **Event Registration:** Students can register for events and view/cancel their registrations.
- **Organizer Dashboard:** Organizers can log in, manage their events, view and update sponsor details.
- **Supabase Authentication:** Integration with Supabase for secure user authentication.
- **Robust MySQL Integration:** Utilizes `flask_mysqldb` for powerful data operations.

---
## Demo
<img width="1847" height="891" alt="Screenshot 2025-11-03 164731" src="https://github.com/user-attachments/assets/3b089012-add2-40e3-8329-d9a9912666f3" />
<img width="1850" height="601" alt="Screenshot 2025-11-04 191042" src="https://github.com/user-attachments/assets/6a9b479d-ce9c-483d-ad5c-6135991106b8" />
<img width="1874" height="915" alt="Screenshot 2025-11-04 191104" src="https://github.com/user-attachments/assets/60ebe9cf-f683-454d-b6d7-290efca861d0" />
<img width="1873" height="768" alt="Screenshot 2025-11-08 144849" src="https://github.com/user-attachments/assets/886164d0-68af-442b-b0b1-68af6ef79a08" />
<img width="1865" height="894" alt="Screenshot 2025-11-08 145139" src="https://github.com/user-attachments/assets/531b7498-a0a7-4bb9-9ea9-5f4303147cab" />

## Technologies Used

- **Python 3.8+**
- **Flask** (web framework)
- **MySQL** (database)
- **flask_mysqldb** (database connector)
- **Supabase** (authentication backend)
- **Flask-CORS** (cross-origin support)
- **python-dotenv** (environment variable management)

---

## Getting Started

### Prerequisites

- Python 3.8+
- MySQL Server (with Eventra schema and tables created)
- Supabase account (for auth)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/rasika1205/Eventra.git
   cd Eventra/backend
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables**

   Create a `.env` file in the `backend` directory and provide the following variables:

   ```
   MYSQL_HOST=your_mysql_host
   MYSQL_USER=your_mysql_user
   MYSQL_PASSWORD=your_mysql_password
   MYSQL_DB=your_database_name
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the server**
   ```bash
   python app.py
   ```
   Server runs on [http://localhost:8000](http://localhost:8000).

---

## API Endpoints

| Endpoint                                  | Method  | Description                                      |
|--------------------------------------------|---------|--------------------------------------------------|
| `/api/student/register`                    | POST    | Register or update a student profile (requires Supabase auth) |
| `/api/student/profile`                     | GET     | Get the authenticated student's profile (Supabase auth) |
| `/api/departments`                         | GET     | List all departments                             |
| `/api/events`                              | GET     | List all events                                  |
| `/api/register_event`                      | POST    | Register the authenticated student for an event  |
| `/api/registrations/<student_id>`          | GET     | List a student's event registrations             |
| `/api/cancel_registration/<registration_id>`| DELETE  | Cancel a student's registration for an event     |
| `/api/organizer/login`                     | POST    | Organizer login (email/password required)        |
| `/api/organizer/event`                     | POST    | Create a new event (organizer access)            |
| `/api/organizer/<organizer_id>`            | GET     | Organizer dashboard (overview, events, sponsors) |
| `/api/sponsors`                            | GET     | List all sponsors                                |

### Request/Response Format

- All requests and responses use JSON format.
- Some endpoints require authentication via Supabase token in the `Authorization` header:
  ```
  Authorization: Bearer <supabase_token>
  ```

---

## Example .env File

```dotenv
MYSQL_HOST=localhost
MYSQL_USER=root
MYSQL_PASSWORD=password123
MYSQL_DB=eventra
SUPABASE_URL=https://xyzcompany.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

---

## Database Schema

Ensure the following tables exist in your MySQL database:

- `Student`
- `Department`
- `Event`
- `Sponsor`
- `Registration`
- `Organizer`
- `EventOrganizer`

Columns should match those referenced in the code or documentation. Review `app.py` for insertion/query details.

---

## Security Notes

- Passwords for organizers are **not hashed**; use only for development or update for production use.
- Environment variables are required for all sensitive credentials.
- Supabase authentication is in use for student-related endpoints.

---

## Troubleshooting

- Ensure all dependencies are installed.
- Make sure your MySQL tables are created and columns match expectations.
- Check `.env` for correct database and Supabase credentials.
- Review CORS settings if accessing from different domains.

---

## License

This project is **proprietary** and protected by copyright © 2025 Rasika Gautam.

You are welcome to view the code for educational or evaluation purposes (e.g., portfolio review by recruiters).  
However, you may **not copy, modify, redistribute, or claim this project as your own** under any circumstances — including in interviews or job applications — without written permission.

---

## 🧑‍💻 Author

**Rasika Gautam**
*Data Science & AI Enthusiast* | B.Tech MAC, NSUT
[GitHub](https://github.com/rasika1205)
