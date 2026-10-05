import { useState, useEffect, useMemo } from 'react';
import { View, BackHandler, StatusBar as RNStatusBar, Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { initDb } from './src/db';
import { C } from './src/theme';
import { LoginScreen, DashboardScreen, ListScreen, FormScreen, ProfileScreen } from './src/screens';

initDb();

export default function App() {
  const [user, setUser] = useState(null);
  const [stack, setStack] = useState([{ name: 'dashboard' }]);
  const [version, setVersion] = useState(0); // bumped after every write so screens refresh

  const nav = useMemo(() => ({
    push: (route) => setStack((st) => [...st, route]),
    pop: (n = 1) => setStack((st) => (st.length > 1 ? st.slice(0, Math.max(1, st.length - n)) : st)),
  }), []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (stack.length > 1) { nav.pop(); return true; }
      return false;
    });
    return () => sub.remove();
  }, [stack.length, nav]);

  const route = stack[stack.length - 1];
  const common = { nav, version, onSaved: () => setVersion((v) => v + 1) };
  let screen;
  if (!user) screen = <LoginScreen onLogin={setUser} />;
  else if (route.name === 'dashboard') screen = <DashboardScreen {...common} onLogout={() => { setUser(null); setStack([{ name: 'dashboard' }]); }} />;
  else if (route.name === 'list') screen = <ListScreen {...common} table={route.table} />;
  else if (route.name === 'profile') screen = <ProfileScreen {...common} id={route.id} />;
  else screen = <FormScreen key={stack.length} {...common} table={route.table} id={route.id} preset={route.preset} />;

  return (
    <View style={{ flex: 1, backgroundColor: C.bg, paddingTop: Platform.OS === 'android' ? RNStatusBar.currentHeight : 44 }}>
      <StatusBar style="dark" />
      {screen}
    </View>
  );
}
