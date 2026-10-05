import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import * as DB from './db';
import { TABLES, MODULE_ORDER, today, now } from './schema';
import { C } from './theme';
import { Header, Button, Badge, Input, Field } from './components';

// Re-reads data whenever `deps` change (screens get a `version` prop bumped after saves).
function useData(fn, deps) {
  const [data, setData] = useState(() => fn());
  useEffect(() => { setData(fn()); }, deps); // eslint-disable-line react-hooks/exhaustive-deps
  return data;
}

export function LoginScreen({ onLogin }) {
  const [u, setU] = useState('admin');
  const [p, setP] = useState('');
  const submit = () => (DB.login(u, p) ? onLogin(u) : Alert.alert('Oops 🙈', 'Wrong username or password'));
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.loginWrap}>
      <Text style={{ fontSize: 72, textAlign: 'center' }}>🏠</Text>
      <Text style={st.loginTitle}>Cozy Hostel</Text>
      <Text style={st.loginSub}>Hostel Management System</Text>
      <View style={st.loginCard}>
        <Input value={u} onChangeText={setU} placeholder="Username" autoCapitalize="none" />
        <Input value={p} onChangeText={setP} placeholder="Password" secureTextEntry style={{ marginTop: 12 }} onSubmitEditing={submit} />
        <Button title="Login 💖" onPress={submit} style={{ marginTop: 18 }} />
        <Text style={[st.muted, { textAlign: 'center', marginTop: 12 }]}>Demo: admin / admin123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

export function DashboardScreen({ nav, version, onLogout }) {
  const sx = useData(DB.stats, [version]);
  const tiles = [
    ['🎓', 'Students', sx.students], ['🛏️', 'Rooms used', sx.rooms], ['🚶', 'Out now', sx.out],
    ['⏳', 'Pass requests', sx.pendingPasses], ['💸', 'Fees due', `₹${sx.feesDue}`], ['✅', 'Fees paid', `₹${sx.feesPaid}`],
    ['📝', 'Open complaints', sx.openComplaints], ['🍽️', 'Meals today', sx.mealsToday],
  ];
  return (
    <View style={{ flex: 1 }}>
      <Header title="Cozy Hostel 🏠" right={<TouchableOpacity onPress={onLogout}><Text style={{ fontSize: 22 }}>🚪</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={st.hello}>Hello, Warden! 👋</Text>
        <View style={st.grid}>
          {tiles.map(([e, l, v]) => (
            <View key={l} style={st.stat}><Text style={{ fontSize: 22 }}>{e}</Text><Text style={st.statVal}>{v}</Text><Text style={st.muted}>{l}</Text></View>
          ))}
        </View>
        <Text style={st.section}>Modules</Text>
        <View style={st.grid}>
          {MODULE_ORDER.map((m) => (
            <TouchableOpacity key={m} style={[st.mod, { backgroundColor: TABLES[m].color }]} onPress={() => nav.push({ name: 'list', table: m })}>
              <Text style={{ fontSize: 36 }}>{TABLES[m].emoji}</Text>
              <Text style={st.modTxt}>{TABLES[m].title}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

export function ListScreen({ nav, table, version }) {
  const t = TABLES[table];
  const [q, setQ] = useState('');
  const rows = useData(() => DB.list(table, q), [version, q]);
  const badgeOf = (r) => (typeof t.badge === 'function' ? t.badge(r) : r[t.badge]);
  return (
    <View style={{ flex: 1 }}>
      <Header title={`${t.emoji} ${t.title}`} onBack={() => nav.pop()} />
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Input value={q} onChangeText={setQ} placeholder="🔍 Search by name / roll no" />
      </View>
      <FlatList data={rows} keyExtractor={(r) => String(r[t.pk])} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={[st.muted, { textAlign: 'center', marginTop: 40 }]}>Nothing here yet ✨{'\n'}Tap + to add</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity style={[st.card, { borderLeftColor: t.color }]}
            onPress={() => nav.push(table === 'students' ? { name: 'profile', id: item.student_id } : { name: 'form', table, id: item[t.pk] })}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={st.cardTitle}>{item[t.titleField]}{item.student_roll ? `  · ${item.student_roll}` : ''}</Text>
              <Badge label={t.badge ? badgeOf(item) : null} />
            </View>
            <Text style={st.muted}>{t.subtitle(item)}</Text>
          </TouchableOpacity>
        )} />
      <TouchableOpacity style={st.fab} onPress={() => nav.push({ name: 'form', table })}><Text style={st.fabTxt}>+</Text></TouchableOpacity>
    </View>
  );
}

const PHONE = /^[6-9]\d{9}$/;
function validate(t, v) {
  const e = {};
  for (const f of t.fields) {
    const val = v[f.key];
    const empty = val == null || String(val).trim() === '';
    if (f.required && empty && f.type !== 'bool') { e[f.key] = 'Required'; continue; }
    if (empty) continue;
    if (f.type === 'phone' && !PHONE.test(String(val))) e[f.key] = 'Enter a valid 10 digit mobile number';
    if (f.type === 'aadhar' && !/^\d{12}$/.test(String(val))) e[f.key] = 'Aadhar must be 12 digits';
    if (f.type === 'number' && (isNaN(Number(val)) || Number(val) < 0)) e[f.key] = 'Enter a valid amount';
    if (f.type === 'date' && !/^\d{4}-\d{2}-\d{2}$/.test(val)) e[f.key] = 'Use YYYY-MM-DD';
    if (f.type === 'datetime' && !/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/.test(val)) e[f.key] = 'Use YYYY-MM-DD HH:MM';
  }
  if (t === TABLES.fees && !e.paid && Number(v.paid) > Number(v.total_fees)) e.paid = 'Paid cannot exceed total fees';
  if (t === TABLES.entry_exit && v.entry_time && v.exit_time && !e.entry_time && v.entry_time < v.exit_time) e.entry_time = 'Entry must be after exit';
  return e;
}

export function FormScreen({ nav, table, id, preset, onSaved }) {
  const t = TABLES[table];
  const [v, setV] = useState(() => {
    if (id) return DB.getOne(table, id);
    const init = { ...preset };
    for (const f of t.fields) {
      if (init[f.key] !== undefined) continue;
      init[f.key] = f.default ?? (f.type === 'date' ? today() : f.type === 'datetime' && f.required ? now() : f.type === 'bool' ? true : '');
    }
    return init;
  });
  const [err, setErr] = useState({});
  const set = (k) => (val) => setV((o) => ({ ...o, [k]: val }));

  const submit = () => {
    const e = validate(t, v);
    setErr(e);
    if (Object.keys(e).length) return;
    try {
      DB.save(table, v, id);
      onSaved();
      nav.pop();
    } catch (ex) {
      const msg = String(ex.message || ex);
      Alert.alert('Could not save 😿', msg.includes('UNIQUE')
        ? (t.onePerStudent ? 'This student already has a record here. Edit the existing one instead.' : 'Roll No already exists.')
        : msg);
    }
  };
  const del = () => Alert.alert('Delete?', table === 'students' ? 'This also deletes all records of this student.' : 'This cannot be undone.', [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => { DB.remove(table, id); onSaved(); nav.pop(table === 'students' ? 2 : 1); } },
  ]);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Header title={`${id ? 'Edit' : 'Add'} ${t.title}`} onBack={() => nav.pop()} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
        {t.fields.map((f) => (
          <Field key={f.key} field={f} error={err[f.key]} onChange={set(f.key)}
            value={f.computed ? f.computed(v) : v[f.key]} />
        ))}
        {table === 'entry_exit' && !v.entry_time ? (
          <Button title="🏠 Mark returned now" color="#7EC8E3" onPress={() => set('entry_time')(now())} style={{ marginBottom: 12 }} />
        ) : null}
        <Button title={id ? 'Save changes 💾' : 'Add ✨'} onPress={submit} />
        {id ? <Button title="Delete 🗑️" color={C.danger} onPress={del} style={{ marginTop: 12 }} /> : null}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function ProfileScreen({ nav, id, version }) {
  const s = useData(() => DB.getOne('students', id), [version]);
  const related = useData(() => Object.fromEntries(MODULE_ORDER.slice(1).map((m) => [m, DB.listForStudent(m, id)])), [version]);
  if (!s) return null;
  const Row = ({ k, v }) => <View style={st.row}><Text style={st.muted}>{k}</Text><Text style={st.rowVal}>{v || '-'}</Text></View>;
  const Section = ({ table, children }) => {
    const t = TABLES[table];
    const rows = related[table];
    const canAdd = !(t.onePerStudent && rows.length);
    return (
      <View style={[st.card, { borderLeftColor: t.color }]}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
          <Text style={st.cardTitle}>{t.emoji} {t.title}</Text>
          {canAdd ? <TouchableOpacity onPress={() => nav.push({ name: 'form', table, preset: { student_id: id } })}><Text style={st.link}>+ Add</Text></TouchableOpacity> : null}
        </View>
        {rows.length === 0 ? <Text style={st.muted}>No records</Text> : rows.map((r) => (
          <TouchableOpacity key={r[t.pk]} onPress={() => nav.push({ name: 'form', table, id: r[t.pk] })}>
            {children ? children(r) : <Text style={st.muted}>{t.subtitle({ ...r, student_name: s.name })}</Text>}
          </TouchableOpacity>
        ))}
      </View>
    );
  };
  return (
    <View style={{ flex: 1 }}>
      <Header title="Student Profile" onBack={() => nav.pop()}
        right={<TouchableOpacity onPress={() => nav.push({ name: 'form', table: 'students', id })}><Text style={{ fontSize: 20 }}>✏️</Text></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={st.avatarCard}>
          <View style={st.avatar}><Text style={{ fontSize: 30, fontWeight: '800', color: '#fff' }}>{s.name[0]}</Text></View>
          <Text style={st.hello}>{s.name}</Text>
          <Text style={st.muted}>{s.branch} • Year {s.year} • Room {s.room_no || '-'}</Text>
        </View>
        <View style={[st.card, { borderLeftColor: TABLES.students.color }]}>
          <Row k="Student ID" v={String(s.student_id)} /><Row k="Roll No" v={s.roll_no} /><Row k="Mobile" v={s.mobile} />
          <Row k="Aadhar No" v={s.aadhar_no ? `XXXX XXXX ${s.aadhar_no.slice(-4)}` : ''} />
        </View>
        <Section table="college">{(r) => (<>
          <Row k="College" v={r.college_name} /><Row k="College ID" v={r.college_student_id} /><Row k="Course" v={r.course} />
          <Row k="Email" v={r.email} /><Row k="Mobile" v={r.mobile} /><Row k="Admission" v={r.admission_date} /></>)}
        </Section>
        <Section table="parents">{(r) => (<>
          <Row k="Father" v={`${r.father_name} (${r.father_mobile})`} /><Row k="Mother" v={`${r.mother_name}${r.mother_mobile ? ` (${r.mother_mobile})` : ''}`} />
          <Row k="Address" v={r.address} /><Row k="Occupation" v={r.occupation} /><Row k="Emergency" v={r.emergency_contact} /></>)}
        </Section>
        {['fees', 'entry_exit', 'mess', 'complaints'].map((m) => <Section key={m} table={m} />)}
      </ScrollView>
    </View>
  );
}

const st = StyleSheet.create({
  loginWrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#FFE4EC' },
  loginTitle: { fontSize: 34, fontWeight: '900', textAlign: 'center', color: C.primaryDark },
  loginSub: { textAlign: 'center', color: C.muted, marginBottom: 24 },
  loginCard: { backgroundColor: '#fff', padding: 20, borderRadius: 26, elevation: 4 },
  hello: { fontSize: 22, fontWeight: '800', color: C.text, marginBottom: 12 },
  section: { fontSize: 18, fontWeight: '800', color: C.text, marginVertical: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stat: { width: '48%', backgroundColor: '#fff', borderRadius: 20, padding: 14, marginBottom: 12, elevation: 2 },
  statVal: { fontSize: 22, fontWeight: '900', color: C.primaryDark, marginTop: 4 },
  mod: { width: '48%', aspectRatio: 1.25, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 12, elevation: 2 },
  modTxt: { fontWeight: '800', color: C.text, marginTop: 6 },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 14, marginBottom: 12, borderLeftWidth: 6, elevation: 2 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: C.text, flexShrink: 1, marginBottom: 4 },
  muted: { color: C.muted },
  fab: { position: 'absolute', right: 22, bottom: 30, width: 62, height: 62, borderRadius: 31, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 6 },
  fabTxt: { color: '#fff', fontSize: 34, fontWeight: '700', marginTop: -3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 12 },
  rowVal: { color: C.text, fontWeight: '600', flexShrink: 1, textAlign: 'right' },
  link: { color: C.primaryDark, fontWeight: '800' },
  avatarCard: { alignItems: 'center', marginBottom: 14 },
  avatar: { width: 76, height: 76, borderRadius: 38, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
