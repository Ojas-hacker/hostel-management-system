# 🏠 Cozy Hostel — Hostel Management System

A cute React Native (Expo) Android app for managing a college hostel, with a local **SQLite** database on the phone.

## Features
- 🔐 Warden login (demo: `admin` / `admin123`)
- 📊 Dashboard: students, rooms, students out, pass requests, fees due/paid, open complaints, meals today
- 🎓 **Students**: Student_ID, Name, Roll_No, Branch, Year, Room_No, Mobile, Aadhar No
- 🏫 **College details**: college name, college student ID, course, email, mobile, admission date
- 👨‍👩‍👧 **Parents**: father/mother name & mobile, address, occupation, emergency contact
- 🚪 **Entry/Exit**: exit/entry time, reason, approval status (Pending/Approved/Rejected), "mark returned now"
- 💰 **Fees**: total, paid, pending (auto-calculated), payment date
- 🍱 **Mess**: date, breakfast/lunch/dinner toggles
- 📝 **Complaints**: complaint, date, status (Open/In Progress/Resolved)
- Student profile page showing all of a student's records in one place
- Add / edit / delete / search everywhere, input validation (10‑digit mobile, 12‑digit Aadhar, dates)
- Deleting a student cascades to all their records. Sample data is seeded on first launch.

## Run it
```bash
npm install
npx expo start
```
Scan the QR code with the **Expo Go** app on your Android phone (or press `a` for an emulator).

## Build an APK
```bash
npm install -g eas-cli
eas build -p android --profile preview
```
(or `npx expo run:android` with Android Studio installed).

## Project structure
```
App.js              navigation + login state
src/schema.js       table/field definitions for every module
src/db.js           SQLite tables, CRUD, dashboard stats, seed data
src/screens.js      Login, Dashboard, List, Form, Student Profile
src/components.js   UI kit (header, inputs, chips, student picker)
src/theme.js        colours
```
