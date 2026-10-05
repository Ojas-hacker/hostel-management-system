// Every module of the app is described here. The generic list/form screens
// and the SQLite tables are all generated from these definitions.
// Field types: text | number | phone | date | datetime | select | bool | student

export const TABLES = {
  students: {
    title: 'Students', emoji: '🎓', color: '#FFB5C2', pk: 'student_id',
    titleField: 'name', subtitle: (r) => `Roll ${r.roll_no} • Room ${r.room_no || '-'} • ${r.branch} Y${r.year}`,
    fields: [
      { key: 'name', label: 'Name', type: 'text', required: true },
      { key: 'roll_no', label: 'Roll No', type: 'text', required: true, unique: true },
      { key: 'branch', label: 'Branch', type: 'select', options: ['CSE', 'IT', 'ECE', 'EE', 'ME', 'CE', 'Other'], required: true },
      { key: 'year', label: 'Year', type: 'select', options: ['1', '2', '3', '4'], required: true },
      { key: 'room_no', label: 'Room No', type: 'text' },
      { key: 'mobile', label: 'Mobile', type: 'phone', required: true },
      { key: 'aadhar_no', label: 'Aadhar No', type: 'aadhar' },
    ],
  },
  college: {
    title: 'College Details', emoji: '🏫', color: '#B5D8FF', pk: 'college_id', onePerStudent: true,
    titleField: 'student_name', subtitle: (r) => `${r.college_name} • ID ${r.college_student_id}`,
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'college_name', label: 'College Name', type: 'text', required: true },
      { key: 'college_student_id', label: 'College Student ID', type: 'text', required: true },
      { key: 'course', label: 'Course', type: 'text' },
      { key: 'email', label: 'College Email', type: 'text' },
      { key: 'mobile', label: 'Mobile Number', type: 'phone' },
      { key: 'admission_date', label: 'Admission Date', type: 'date' },
    ],
  },
  parents: {
    title: 'Parents', emoji: '👨‍👩‍👧', color: '#C9F2C7', pk: 'parent_id', onePerStudent: true,
    titleField: 'student_name', subtitle: (r) => `👨 ${r.father_name} • 👩 ${r.mother_name}`,
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'father_name', label: 'Father Name', type: 'text', required: true },
      { key: 'mother_name', label: 'Mother Name', type: 'text', required: true },
      { key: 'father_mobile', label: 'Father Mobile', type: 'phone', required: true },
      { key: 'mother_mobile', label: 'Mother Mobile', type: 'phone' },
      { key: 'address', label: 'Address', type: 'text', multiline: true, required: true },
      { key: 'occupation', label: 'Guardian Occupation', type: 'text' },
      { key: 'emergency_contact', label: 'Emergency Contact', type: 'phone' },
    ],
  },
  entry_exit: {
    title: 'Entry / Exit', emoji: '🚪', color: '#FFE3A3', pk: 'entryexit_id',
    titleField: 'student_name', subtitle: (r) => `Out: ${r.exit_time || '-'}  In: ${r.entry_time || 'not back'}\n${r.reason}`,
    badge: 'approval_status',
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'exit_time', label: 'Exit Time', type: 'datetime', required: true },
      { key: 'entry_time', label: 'Entry Time', type: 'datetime' },
      { key: 'reason', label: 'Reason', type: 'text', required: true },
      { key: 'approval_status', label: 'Approval Status', type: 'select', options: ['Pending', 'Approved', 'Rejected'], default: 'Pending' },
    ],
  },
  fees: {
    title: 'Fees', emoji: '💰', color: '#D9C2FF', pk: 'fee_id',
    titleField: 'student_name', subtitle: (r) => `Total ₹${r.total_fees} • Paid ₹${r.paid} • Pending ₹${r.pending}`,
    badge: (r) => (Number(r.pending) <= 0 ? 'Paid' : 'Due'),
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'total_fees', label: 'Total Fees (₹)', type: 'number', required: true },
      { key: 'paid', label: 'Paid (₹)', type: 'number', required: true },
      { key: 'pending', label: 'Pending (₹) — auto', type: 'number', computed: (v) => Math.max(0, Number(v.total_fees || 0) - Number(v.paid || 0)) },
      { key: 'payment_date', label: 'Payment Date', type: 'date' },
    ],
  },
  mess: {
    title: 'Mess', emoji: '🍱', color: '#FFCBA4', pk: 'mess_id',
    titleField: 'student_name',
    subtitle: (r) => `${r.date}   ${r.breakfast ? '🥞' : '✖️'} B   ${r.lunch ? '🍛' : '✖️'} L   ${r.dinner ? '🍲' : '✖️'} D`,
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'breakfast', label: 'Breakfast', type: 'bool' },
      { key: 'lunch', label: 'Lunch', type: 'bool' },
      { key: 'dinner', label: 'Dinner', type: 'bool' },
    ],
  },
  complaints: {
    title: 'Complaints', emoji: '📝', color: '#A8E6E2', pk: 'complaint_id',
    titleField: 'student_name', subtitle: (r) => `${r.date} • ${r.complaint}`,
    badge: 'status',
    fields: [
      { key: 'student_id', label: 'Student', type: 'student', required: true },
      { key: 'complaint', label: 'Complaint', type: 'text', multiline: true, required: true },
      { key: 'date', label: 'Date', type: 'date', required: true },
      { key: 'status', label: 'Status', type: 'select', options: ['Open', 'In Progress', 'Resolved'], default: 'Open' },
    ],
  },
};

export const MODULE_ORDER = ['students', 'college', 'parents', 'entry_exit', 'fees', 'mess', 'complaints'];

const pad = (n) => String(n).padStart(2, '0');
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
export const now = () => { const d = new Date(); return `${today()} ${pad(d.getHours())}:${pad(d.getMinutes())}`; };
