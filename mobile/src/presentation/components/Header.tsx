import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal } from 'react-native';
import { LogOut, ShieldCheck, QrCode, BookOpen, Bell, User } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title: string;
  subtitle?: string;
  onRoleSwitchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRoleSwitchClick }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const isLightMode = true;
  
  // Empty array to simulate no notifications for now
  const notifications: any[] = [];

  if (isLightMode) {
    return (
      <View style={s.lightContainer}>
        <View style={s.lightRow}>
          <View style={s.leftSection}>
            <View style={s.avatarBox}>
              <User size={24} color="#94A3B8" />
            </View>
            <Text style={s.greetingText}>Hi, {user?.first_name || 'User'}</Text>
          </View>

          <View style={s.centerSection}>
            <BookOpen size={30} color="#14B8A6" />
          </View>

          <View style={s.rightSection}>
            <TouchableOpacity onPress={() => setShowNotifications(true)} style={[s.lightIconBtn, { marginRight: 8 }]}>
              <Bell size={22} color="#0F172A" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={s.lightIconBtn}>
              <LogOut size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Modal */}
        <Modal visible={showNotifications} transparent={true} animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.notifBox}>
              <Text style={s.notifTitle}>Notifications</Text>
              
              {notifications.length === 0 ? (
                <View style={s.emptyNotifBox}>
                  <Bell size={32} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <Text style={s.emptyNotifText}>No notifications available</Text>
                </View>
              ) : (
                <View style={{ paddingVertical: 20 }}>
                  <Text>You have notifications!</Text>
                </View>
              )}

              <TouchableOpacity style={s.dismissBtn} onPress={() => setShowNotifications(false)}>
                <Text style={s.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
            <TouchableOpacity onPress={() => setShowNotifications(true)} style={s.iconBtn}>
              <Bell size={20} color="#CBD5E1" />
            </TouchableOpacity>
            <TouchableOpacity onPress={logout} style={[s.iconBtn, { marginLeft: 8 }]}>
              <LogOut size={20} color="#F87171" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Notifications Modal for Dark Theme */}
        <Modal visible={showNotifications} transparent={true} animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.notifBox}>
              <Text style={s.notifTitle}>Notifications</Text>
              
              {notifications.length === 0 ? (
                <View style={s.emptyNotifBox}>
                  <Bell size={32} color="#CBD5E1" style={{ marginBottom: 12 }} />
                  <Text style={s.emptyNotifText}>No notifications available</Text>
                </View>
              ) : (
                <View style={{ paddingVertical: 20 }}>
                  <Text>You have notifications!</Text>
                </View>
              )}

              <TouchableOpacity style={s.dismissBtn} onPress={() => setShowNotifications(false)}>
                <Text style={s.dismissBtnText}>Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  iconBtn: { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155', padding: 10, borderRadius: 12 },
  logoutBtn: { backgroundColor: 'rgba(251,113,133,0.1)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', padding: 10, borderRadius: 12 },
  
  // Light Theme Styles
  lightContainer: { backgroundColor: '#F8FAFC', paddingTop: 48, paddingBottom: 16, paddingHorizontal: 20 },
  lightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftSection: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
  avatarBox: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  greetingText: { color: '#0F172A', fontSize: 16, fontWeight: '700' },
  centerSection: { flex: 1, alignItems: 'center' },
  rightSection: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end' },
  lightIconBtn: { padding: 8 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  notifBox: { backgroundColor: '#FFF', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  notifTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  emptyNotifBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyNotifText: { color: '#64748B', fontSize: 15, fontWeight: '500' },
  dismissBtn: { backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  dismissBtnText: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
});
