import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal, FlatList, Switch } from 'react-native';
import { C, BADGE } from './theme';
import * as DB from './db';

export const Header = ({ title, onBack, right }) => (
  <View style={s.header}>
    {onBack ? <TouchableOpacity onPress={onBack} style={s.hBtn}><Text style={s.hBtnTxt}>‹</Text></TouchableOpacity> : <View style={s.hBtn} />}
    <Text style={s.hTitle} numberOfLines={1}>{title}</Text>
    <View style={s.hBtn}>{right}</View>
  </View>
);

export const Button = ({ title, onPress, color = C.primary, style }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={[s.btn, { backgroundColor: color }, style]}>
    <Text style={s.btnTxt}>{title}</Text>
  </TouchableOpacity>
);

export const Badge = ({ label }) => !label ? null : (
  <View style={[s.badge, { backgroundColor: BADGE[label] || '#DDD' }]}><Text style={s.badgeTxt}>{label}</Text></View>
);

export const Input = (props) => (
  <TextInput placeholderTextColor={C.muted} {...props} style={[s.input, props.multiline && { height: 90, textAlignVertical: 'top' }, props.style]} />
);

export function Field({ field, value, onChange, error }) {
  const [open, setOpen] = useState(false);
  let control;
  if (field.computed) {
    control = <View style={[s.input, { backgroundColor: '#F7EEF2' }]}><Text style={{ color: C.text }}>{value}</Text></View>;
  } else if (field.type === 'bool') {
    control = <Switch value={!!value} onValueChange={onChange} trackColor={{ true: C.primary }} thumbColor="#fff" />;
  } else if (field.type === 'select') {
    control = (
      <View style={s.chips}>
        {field.options.map((o) => (
          <TouchableOpacity key={o} onPress={() => onChange(o)} style={[s.chip, value === o && s.chipOn]}>
            <Text style={[s.chipTxt, value === o && { color: '#fff' }]}>{o}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  } else if (field.type === 'student') {
    const st = value ? DB.getOne('students', value) : null;
    control = (
      <>
        <TouchableOpacity style={s.input} onPress={() => setOpen(true)}>
          <Text style={{ color: st ? C.text : C.muted }}>{st ? `${st.name} (${st.roll_no})` : 'Tap to choose a student…'}</Text>
        </TouchableOpacity>
        <StudentPicker visible={open} onClose={() => setOpen(false)} onPick={(id) => { onChange(id); setOpen(false); }} />
      </>
    );
  } else {
    const hint = { date: 'YYYY-MM-DD', datetime: 'YYYY-MM-DD HH:MM', phone: '10 digit number', aadhar: '12 digit number' }[field.type];
    control = (
      <Input value={value == null ? '' : String(value)} onChangeText={onChange} placeholder={hint || field.label}
        multiline={field.multiline}
        keyboardType={['number', 'phone', 'aadhar'].includes(field.type) ? 'number-pad' : 'default'} />
    );
  }
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={s.label}>{field.label}{field.required ? ' *' : ''}</Text>
      {control}
      {error ? <Text style={s.err}>{error}</Text> : null}
    </View>
  );
}

function StudentPicker({ visible, onClose, onPick }) {
  const [q, setQ] = useState('');
  const data = visible ? DB.list('students', q) : [];
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.modalBg}>
        <View style={s.modal}>
          <Text style={s.hTitle}>Choose Student 🎓</Text>
          <Input value={q} onChangeText={setQ} placeholder="Search name / roll no" style={{ marginVertical: 10 }} />
          <FlatList data={data} keyExtractor={(i) => String(i.student_id)} style={{ maxHeight: 380 }}
            ListEmptyComponent={<Text style={s.muted}>No students. Add one first!</Text>}
            renderItem={({ item }) => (
              <TouchableOpacity style={s.pickRow} onPress={() => onPick(item.student_id)}>
                <Text style={{ fontWeight: '700', color: C.text }}>{item.name}</Text>
                <Text style={s.muted}>{item.roll_no} • Room {item.room_no || '-'}</Text>
              </TouchableOpacity>
            )} />
          <Button title="Close" color={C.muted} onPress={onClose} style={{ marginTop: 10 }} />
        </View>
      </View>
    </Modal>
  );
}

export const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 12, backgroundColor: C.primary, borderBottomLeftRadius: 22, borderBottomRightRadius: 22 },
  hBtn: { width: 44, alignItems: 'center' },
  hBtnTxt: { color: '#fff', fontSize: 34, lineHeight: 36, fontWeight: '600' },
  hTitle: { flex: 1, textAlign: 'center', fontSize: 20, fontWeight: '800', color: C.text },
  btn: { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  btnTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start' },
  badgeTxt: { fontSize: 12, fontWeight: '700', color: '#3D2C3E' },
  input: { backgroundColor: '#fff', borderWidth: 1.5, borderColor: C.border, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: C.text },
  label: { fontWeight: '700', color: C.text, marginBottom: 6 },
  err: { color: C.danger, marginTop: 4, fontSize: 12 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#fff' },
  chipOn: { backgroundColor: C.primary, borderColor: C.primary },
  chipTxt: { color: C.text, fontWeight: '600' },
  modalBg: { flex: 1, backgroundColor: '#0006', justifyContent: 'flex-end' },
  modal: { backgroundColor: C.bg, padding: 18, borderTopLeftRadius: 26, borderTopRightRadius: 26 },
  pickRow: { padding: 12, backgroundColor: '#fff', borderRadius: 14, marginBottom: 8 },
  muted: { color: C.muted },
});
