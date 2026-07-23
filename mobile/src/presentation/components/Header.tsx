import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { LogOut, ShieldCheck, QrCode, BookOpen } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRoleSwitchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRoleSwitchClick }) => {
  const { user, logout } = useAuth();
  const isLightMode = user?.role === 'STUDENT' || user?.role === 'LIBRARIAN';

  if (isLightMode) {
    return (
      <View style={s.lightContainer}>
        <View style={s.lightRow}>
          <View style={s.leftSection}>
            <View style={s.avatarBox}>
              <Image 
                source={{ uri: 'https://i.pravatar.cc/100?img=47' }} 
                style={{ width: '100%', height: '100%' }} 
              />
            </View>
            <Text style={s.greetingText}>Hi, {user?.first_name || 'User'}</Text>
          </View>

          <View style={s.centerSection}>
            <BookOpen size={30} color="#14B8A6" />
          </View>

          <View style={s.rightSection}>
            <TouchableOpacity onPress={logout} style={s.lightIconBtn}>
              <LogOut size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  // Dark Theme for Librarian & Admin
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
  // Dark Theme Styles
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
  
  // Light Theme Styles
  lightContainer: { backgroundColor: '#F8FAFC', paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20 },
  lightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', overflow: 'hidden' },
  greetingText: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  centerSection: { flex: 1, alignItems: 'center' },
  rightSection: { flex: 1, alignItems: 'flex-end' },
  lightIconBtn: { padding: 8 },
});
