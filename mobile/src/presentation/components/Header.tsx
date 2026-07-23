import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogOut, ShieldCheck } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRoleSwitchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRoleSwitchClick }) => {
  const { user, logout } = useAuth();

  return (
    <View style={s.container}>
      <View style={s.row}>
        <View style={{ flex: 1 }}>
          <View style={s.roleRow}>
            <View style={s.roleIcon}>
              <ShieldCheck size={18} color="#14B8A6" />
            </View>
            <Text style={s.roleLabel}>{user ? `${user.role} PORTAL` : 'GUEST PORTAL'}</Text>
          </View>
          <Text style={s.title}>{title}</Text>
          {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
        </View>

        {user ? (
          <View style={s.actionsRow}>
            {onRoleSwitchClick && (
              <TouchableOpacity onPress={onRoleSwitchClick} style={s.switchBtn}>
                <Text style={s.switchText}>Switch Role</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={logout} style={s.logoutBtn}>
              <LogOut size={16} color="#FB7185" />
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const s = StyleSheet.create({
  container: { backgroundColor: '#0F172A', paddingTop: 48, paddingBottom: 20, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  roleIcon: { backgroundColor: 'rgba(20,184,166,0.2)', padding: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(20,184,166,0.3)' },
  roleLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', marginTop: 4 },
  subtitle: { color: '#94A3B8', fontSize: 13, marginTop: 2 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  switchBtn: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12 },
  switchText: { color: '#CBD5E1', fontSize: 11, fontWeight: '700' },
  logoutBtn: { backgroundColor: 'rgba(251,113,133,0.1)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', padding: 10, borderRadius: 12 },
});
