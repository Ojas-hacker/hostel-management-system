import { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, FlatList, TouchableOpacity, Alert, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import * as DB from './db';
import { TABLES, MODULE_ORDER, today, now } from './schema';
import { Ionicons } from '@expo/vector-icons';
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
  const submit = () => (DB.login(u, p) ? onLogin(u) : Alert.alert('Login failed', 'Wrong username or password'));
  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={st.loginWrap}>
      <View style={st.logo}><Ionicons name="business" size={34} color="#fff" /></View>
      <Text style={st.loginTitle}>Hostel Manager</Text>
      <Text style={st.loginSub}>Sign in to continue</Text>
      <View style={st.loginCard}>
        <Input value={u} onChangeText={setU} placeholder="Username" autoCapitalize="none" />
        <Input value={p} onChangeText={setP} placeholder="Password" secureTextEntry style={{ marginTop: 12 }} onSubmitEditing={submit} />
        <Button title="Sign in" onPress={submit} style={{ marginTop: 18 }} />
        <Text style={[st.muted, { textAlign: 'center', marginTop: 12 }]}>Demo: admin / admin123</Text>
      </View>
    </KeyboardAvoidingView>
  );
}

export function DashboardScreen({ nav, version, onLogout }) {
  const sx = useData(DB.stats, [version]);
  const tiles = [
    ['Students', sx.students], ['Rooms occupied', sx.rooms], ['Currently out', sx.out],
    ['Pending passes', sx.pendingPasses], ['Fees due', `₹${sx.feesDue}`], ['Fees collected', `₹${sx.feesPaid}`],
    ['Open complaints', sx.openComplaints], ['Meals today', sx.mealsToday],
  ];
  return (
    <View style={{ flex: 1 }}>
      <Header title="Hostel Manager" right={<TouchableOpacity onPress={onLogout}><Ionicons name="log-out-outline" size={22} color={C.text} /></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={st.hello}>Overview</Text>
        <View style={st.grid}>
          {tiles.map(([l, v]) => (
            <View key={l} style={st.stat}><Text style={st.statLbl}>{l}</Text><Text style={st.statVal}>{v}</Text></View>
          ))}
        </View>
        <Text style={st.section}>Modules</Text>
        <View style={st.grid}>
          {MODULE_ORDER.map((m) => (
            <TouchableOpacity key={m} style={st.mod} onPress={() => nav.push({ name: 'list', table: m })}>
              <View style={[st.modIcon, { backgroundColor: TABLES[m].color + '14' }]}><Ionicons name={TABLES[m].icon} size={22} color={TABLES[m].color} /></View>
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
      <Header title={t.title} onBack={() => nav.pop()} />
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Input value={q} onChangeText={setQ} placeholder="Search by name or roll no" />
      </View>
      <FlatList data={rows} keyExtractor={(r) => String(r[t.pk])} contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        ListEmptyComponent={<Text style={[st.muted, { textAlign: 'center', marginTop: 40 }]}>No records yet{'\n'}Tap + to add one</Text>}
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
      <TouchableOpacity style={st.fab} onPress={() => nav.push({ name: 'form', table })}><Ionicons name="add" size={28} color="#fff" /></TouchableOpacity>
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
      Alert.alert('Could not save', msg.includes('UNIQUE')
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
          <Button title="Mark returned now" color="#4B5D7A" onPress={() => set('entry_time')(now())} style={{ marginBottom: 12 }} />
        ) : null}
        <Button title={id ? 'Save changes' : 'Save'} onPress={submit} />
        {id ? <Button title="Delete" color={C.danger} onPress={del} style={{ marginTop: 12 }} /> : null}
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
          <Text style={st.cardTitle}>{t.title}</Text>
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
        right={<TouchableOpacity onPress={() => nav.push({ name: 'form', table: 'students', id })}><Ionicons name="create-outline" size={22} color={C.text} /></TouchableOpacity>} />
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <View style={st.avatarCard}>
          <View style={st.avatar}><Text style={{ fontSize: 28, fontWeight: '600', color: '#fff' }}>{s.name[0]}</Text></View>
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

const card = { backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border };
const st = StyleSheet.create({
  loginWrap: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: C.bg },
  logo: { width: 64, height: 64, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 16 },
  loginTitle: { fontSize: 26, fontWeight: '700', textAlign: 'center', color: C.text },
  loginSub: { textAlign: 'center', color: C.muted, marginBottom: 24, marginTop: 4 },
  loginCard: { ...card, padding: 20 },
  hello: { fontSize: 20, fontWeight: '700', color: C.text, marginBottom: 12 },
  section: { fontSize: 13, fontWeight: '600', color: C.muted, marginTop: 12, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.8 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  stat: { ...card, width: '48.5%', padding: 14, marginBottom: 10 },
  statLbl: { color: C.muted, fontSize: 12 },
  statVal: { fontSize: 20, fontWeight: '700', color: C.text, marginTop: 4 },
  mod: { ...card, width: '48.5%', padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  modIcon: { width: 38, height: 38, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 10 },
  modTxt: { fontWeight: '600', color: C.text, flexShrink: 1 },
  card: { ...card, padding: 14, marginBottom: 10, borderLeftWidth: 3 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: C.text, flexShrink: 1, marginBottom: 4 },
  muted: { color: C.muted },
  fab: { position: 'absolute', right: 20, bottom: 28, width: 56, height: 56, borderRadius: 28, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4, gap: 12 },
  rowVal: { color: C.text, fontWeight: '500', flexShrink: 1, textAlign: 'right' },
  link: { color: C.primary, fontWeight: '600' },
  avatarCard: { alignItems: 'center', marginBottom: 14 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
});
