import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function DashboardScreen() {
  const { user, role, logout } = useAuth();
  const meta = user?.user_metadata || {};
  const email = user?.email || '';
  const name = meta.full_name || meta.name || (email ? email.split('@')[0] : 'User');
  const isAdmin = role === 'admin';

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.brand}>Fruit Shop</Text>
        <Pressable
          onPress={logout}
          style={({ pressed, hovered }) => [
            styles.logout,
            hovered && styles.logoutHovered,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.logoutText}>Log out</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{name[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.hello}>Hello, {name}</Text>
        {!!email && <Text style={styles.email}>{email}</Text>}
        <View style={[styles.badge, isAdmin && styles.badgeAdmin]}>
          <Text style={[styles.badgeText, isAdmin && styles.badgeTextAdmin]}>
            {isAdmin ? 'Admin' : 'User'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#000' },
  brand: { color: '#000', fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  logout: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 6, borderWidth: 1, borderColor: '#000' },
  logoutHovered: { backgroundColor: '#f4f4f4' },
  logoutText: { fontWeight: '600', color: '#000' },
  pressed: { opacity: 0.7 },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 30, fontWeight: '700' },
  hello: { fontSize: 26, fontWeight: '700', color: '#000' },
  email: { fontSize: 15, color: '#666', marginTop: 6 },
  badge: { marginTop: 14, paddingVertical: 4, paddingHorizontal: 12, borderRadius: 999, borderWidth: 1, borderColor: '#000' },
  badgeAdmin: { backgroundColor: '#000' },
  badgeText: { fontSize: 13, fontWeight: '600', color: '#000' },
  badgeTextAdmin: { color: '#fff' },
});