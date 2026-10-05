# Hostel Manager — Technical Overview

**Hostel Manager** is an offline Android app for running a college hostel. A warden uses it to manage students, college and parent details, entry/exit passes, fees, mess meals and complaints. All data is stored on the phone.

## Tech Stack
| Layer | Technology |
|---|---|
| Framework | React Native 0.86 with Expo SDK 57 |
| Language | JavaScript (React function components and hooks) |
| Database | SQLite via `expo-sqlite` (stored on the device) |
| Icons | `@expo/vector-icons` (Ionicons) |
| Build | Expo Go for testing, EAS Build for the APK |

## Architecture
```
App.js             → Login check, screen navigation, Android back button
src/schema.js      → Definitions of all 7 modules (fields, types, rules)
src/db.js          → Table creation, add/edit/delete/search, dashboard stats, sample data
src/screens.js     → Login, Dashboard, List, Form, Student Profile
src/components.js  → Reusable UI pieces (inputs, buttons, status tags, student picker)
src/theme.js       → Colour palette
```

- **Schema-driven design:** each module is described once in `schema.js`. The SQLite tables, list screens and add/edit forms are all generated from these definitions, so adding a module only needs a new definition.
- **Navigation:** the app keeps a simple list of open screens in memory. Opening a screen adds it; going back (including the Android back button) removes it.
- **Data refresh:** after every save or delete a counter is updated, and screens reload their data from SQLite.

## Database Design
| Table | Key fields |
|---|---|
| `students` | student_id (PK), name, roll_no (unique), branch, year, room_no, mobile, aadhar_no |
| `college` | college_id (PK), student_id (FK, unique), college_name, college_student_id, course, email, mobile, admission_date |
| `parents` | parent_id (PK), student_id (FK, unique), father/mother name & mobile, address, occupation, emergency_contact |
| `entry_exit` | entryexit_id (PK), student_id (FK), exit_time, entry_time, reason, approval_status |
| `fees` | fee_id (PK), student_id (FK), total_fees, paid, pending, payment_date |
| `mess` | mess_id (PK), student_id (FK), date, breakfast, lunch, dinner |
| `complaints` | complaint_id (PK), student_id (FK), complaint, date, status |
| `users` | username (PK), password (warden login) |

- Every table links to `students` with `ON DELETE CASCADE`, so deleting a student removes all their records.
- College and parents allow only one record per student.
- Pending fees are calculated automatically as total minus paid.

## Features
- Warden login (demo: `admin` / `admin123`)
- Dashboard: students, rooms occupied, students out, pending passes, fees due/collected, open complaints, meals today
- Add, edit, delete and search in every module
- Student profile showing all of a student's records together
- Pass approval workflow (Pending / Approved / Rejected) with one-tap "Mark returned now"
- Input checks: 10-digit mobile, 12-digit Aadhar, date format, paid ≤ total fees, entry after exit
- Sample data added on first launch

## Running
```bash
npm install
npx expo start        # scan the QR code with Expo Go
```
