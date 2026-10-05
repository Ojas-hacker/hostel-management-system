import * as SQLite from 'expo-sqlite';
import { TABLES, MODULE_ORDER, today, now } from './schema';

const db = SQLite.openDatabaseSync('hostel.db');

const sqlType = (f) => (f.type === 'number' || f.type === 'bool' || f.type === 'student' ? 'INTEGER' : 'TEXT');

export function initDb() {
  db.execSync('PRAGMA foreign_keys = ON;');
  db.execSync(`CREATE TABLE IF NOT EXISTS users (
    username TEXT PRIMARY KEY, password TEXT NOT NULL);`);
  db.runSync(`INSERT OR IGNORE INTO users VALUES ('admin', 'admin123')`);
  for (const name of MODULE_ORDER) {
    const t = TABLES[name];
    const cols = t.fields.map((f) => {
      let c = `${f.key} ${sqlType(f)}`;
      if (f.required) c += ' NOT NULL';
      if (f.unique || (t.onePerStudent && f.key === 'student_id')) c += ' UNIQUE';
      if (f.type === 'student') c += ' REFERENCES students(student_id) ON DELETE CASCADE';
      return c;
    });
    db.execSync(`CREATE TABLE IF NOT EXISTS ${name} (
      ${t.pk} INTEGER PRIMARY KEY AUTOINCREMENT, ${cols.join(', ')});`);
  }
  seedIfEmpty();
}

export function login(username, password) {
  return !!db.getFirstSync('SELECT 1 FROM users WHERE username = ? AND password = ?', [username.trim(), password]);
}

export function list(name, search = '') {
  const t = TABLES[name];
  const hasStudent = name !== 'students';
  const sql = hasStudent
    ? `SELECT x.*, s.name AS student_name, s.roll_no AS student_roll FROM ${name} x
       JOIN students s ON s.student_id = x.student_id
       WHERE s.name LIKE ? OR s.roll_no LIKE ? ORDER BY x.${t.pk} DESC`
    : `SELECT * FROM students WHERE name LIKE ? OR roll_no LIKE ? OR room_no LIKE ? ORDER BY name`;
  const q = `%${search}%`;
  return db.getAllSync(sql, hasStudent ? [q, q] : [q, q, q]);
}

export function listForStudent(name, studentId) {
  return db.getAllSync(`SELECT * FROM ${name} WHERE student_id = ? ORDER BY ${TABLES[name].pk} DESC`, [studentId]);
}

export function getOne(name, id) {
  return db.getFirstSync(`SELECT * FROM ${name} WHERE ${TABLES[name].pk} = ?`, [id]);
}

export function save(name, values, id) {
  const t = TABLES[name];
  const keys = t.fields.map((f) => f.key);
  const vals = t.fields.map((f) => {
    const v = f.computed ? f.computed(values) : values[f.key];
    if (f.type === 'bool') return v ? 1 : 0;
    if (f.type === 'number' || f.type === 'student') return v === '' || v == null ? null : Number(v);
    return v == null ? '' : String(v).trim();
  });
  if (id) {
    db.runSync(`UPDATE ${name} SET ${keys.map((k) => `${k} = ?`).join(', ')} WHERE ${t.pk} = ?`, [...vals, id]);
    return id;
  }
  return db.runSync(`INSERT INTO ${name} (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`, vals).lastInsertRowId;
}

export function remove(name, id) {
  db.runSync(`DELETE FROM ${name} WHERE ${TABLES[name].pk} = ?`, [id]);
}

export function stats() {
  const n = (sql) => db.getFirstSync(sql).c ?? 0;
  return {
    students: n('SELECT COUNT(*) c FROM students'),
    rooms: n(`SELECT COUNT(DISTINCT room_no) c FROM students WHERE room_no <> ''`),
    out: n(`SELECT COUNT(*) c FROM entry_exit WHERE (entry_time IS NULL OR entry_time = '') AND approval_status <> 'Rejected'`),
    pendingPasses: n(`SELECT COUNT(*) c FROM entry_exit WHERE approval_status = 'Pending'`),
    feesDue: n('SELECT COALESCE(SUM(pending),0) c FROM fees'),
    feesPaid: n('SELECT COALESCE(SUM(paid),0) c FROM fees'),
    openComplaints: n(`SELECT COUNT(*) c FROM complaints WHERE status <> 'Resolved'`),
    mealsToday: n(`SELECT COALESCE(SUM(breakfast + lunch + dinner),0) c FROM mess WHERE date = '${today()}'`),
  };
}

function seedIfEmpty() {
  if (db.getFirstSync('SELECT COUNT(*) c FROM students').c > 0) return;
  const s1 = save('students', { name: 'Aarav Sharma', roll_no: '22CS101', branch: 'CSE', year: '3', room_no: 'A-101', mobile: '9876543210', aadhar_no: '123412341234' });
  const s2 = save('students', { name: 'Priya Patel', roll_no: '23IT045', branch: 'IT', year: '2', room_no: 'B-204', mobile: '9123456780', aadhar_no: '567856785678' });
  save('college', { student_id: s1, college_name: 'Govt. Engineering College', college_student_id: 'GEC22101', course: 'B.Tech', email: 'aarav@gec.edu', mobile: '9876543210', admission_date: '2022-08-01' });
  save('parents', { student_id: s1, father_name: 'Rakesh Sharma', mother_name: 'Sunita Sharma', father_mobile: '9811111111', mother_mobile: '9822222222', address: '12 MG Road, Pune', occupation: 'Business', emergency_contact: '9811111111' });
  save('parents', { student_id: s2, father_name: 'Mahesh Patel', mother_name: 'Kavita Patel', father_mobile: '9833333333', mother_mobile: '9844444444', address: '45 Ring Road, Surat', occupation: 'Teacher', emergency_contact: '9833333333' });
  save('entry_exit', { student_id: s2, exit_time: now(), entry_time: '', reason: 'Going home for weekend', approval_status: 'Pending' });
  save('fees', { student_id: s1, total_fees: 60000, paid: 40000, payment_date: today() });
  save('fees', { student_id: s2, total_fees: 60000, paid: 60000, payment_date: today() });
  save('mess', { student_id: s1, date: today(), breakfast: true, lunch: true, dinner: false });
  save('complaints', { student_id: s1, complaint: 'Fan not working in room A-101', date: today(), status: 'Open' });
}
