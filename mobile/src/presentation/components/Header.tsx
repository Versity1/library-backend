import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Modal, Platform } from 'react-native';
import { LogOut, ShieldCheck, Bell, Menu, BookOpen } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
  onRoleSwitchClick?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, onRoleSwitchClick }) => {
  const { user, logout } = useAuth();
  const [showNotifications, setShowNotifications] = useState(false);
  const isLightMode = user?.role === 'STUDENT' || user?.role === 'LIBRARIAN';
  
  const notifications: any[] = [];

  if (isLightMode) {
    return (
      <View style={s.lightContainer}>
        <View style={s.lightRow}>
          {/* Left Avatar / Menu Icon */}
          <View style={s.leftSection}>
            {user?.role === 'STUDENT' ? (
              <View style={s.avatarBox}>
                <Image 
                  source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop' }} 
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            ) : (
              <TouchableOpacity activeOpacity={0.7} style={s.lightIconBtn}>
                <Menu size={22} color="#0F172A" />
              </TouchableOpacity>
            )}
          </View>

          {/* Title Center Logo */}
          <View style={s.centerSection}>
            <View style={s.logoWrapper}>
              <BookOpen size={24} color="#0F172A" />
              <Text style={s.appTitle}>{title || 'Shelfie'}</Text>
            </View>
          </View>

          {/* Bell Icon Right */}
          <View style={s.rightSection}>
            <TouchableOpacity onPress={() => setShowNotifications(true)} style={s.lightIconBtn} activeOpacity={0.7}>
              <Bell size={22} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Notifications Modal */}
        <Modal visible={showNotifications} transparent={true} animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.notifBox}>
              <View style={s.notifHeaderRow}>
                <Text style={s.notifTitle}>Notifications</Text>
                <TouchableOpacity onPress={logout} style={s.logoutBtn}>
                  <LogOut size={16} color="#EF4444" />
                  <Text style={s.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
              
              {notifications.length === 0 ? (
                <View style={s.emptyNotifBox}>
                  <Bell size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
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

  // Dark Theme for Admin (Compact Header)
  return (
    <View style={s.container}>
      <View style={s.row}>
        {/* Left Section: Role */}
        <View style={{ width: 60 }}>
          <View style={s.roleRow}>
            <View style={s.pulseDot} />
            <Text style={s.roleLabel}>ADMIN</Text>
          </View>
        </View>

        {/* Center Logo */}
        <View style={s.adminCenterSection}>
          <View style={s.logoWrapper}>
            <BookOpen size={22} color="#14B8A6" />
            <Text style={s.title}>{title || 'Shelfie Admin'}</Text>
          </View>
        </View>

        {/* Right Section: Action Buttons */}
        {user ? (
          <View style={s.actionsRow}>
            <TouchableOpacity onPress={() => setShowNotifications(true)} style={s.iconBtn} activeOpacity={0.7}>
              <Bell size={16} color="#94A3B8" />
            </TouchableOpacity>
            
            <TouchableOpacity onPress={logout} style={s.logoutBtn} activeOpacity={0.7}>
              <LogOut size={14} color="#EF4444" />
              <Text style={s.logoutBtnText}>Log Out</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Notifications Modal */}
        <Modal visible={showNotifications} transparent={true} animationType="fade">
          <View style={s.modalOverlay}>
            <View style={s.notifBox}>
              <View style={s.notifHeaderRow}>
                <Text style={s.notifTitle}>Notifications</Text>
                <TouchableOpacity onPress={logout} style={s.modalLogoutBtn}>
                  <LogOut size={16} color="#EF4444" />
                  <Text style={s.logoutText}>Log Out</Text>
                </TouchableOpacity>
              </View>
              
              {notifications.length === 0 ? (
                <View style={s.emptyNotifBox}>
                  <Bell size={36} color="#94A3B8" style={{ marginBottom: 12 }} />
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
  // Dark Theme Styles for Admin (Slim & Compact)
  container: { backgroundColor: '#0A192F', paddingTop: Platform.OS === 'ios' ? 42 : 12, paddingBottom: 10, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  roleRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: 2 },
  pulseDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#10B981' },
  roleLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '800', letterSpacing: 0.8 },
  title: { color: '#FFFFFF', fontSize: 18, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  subtitle: { color: '#94A3B8', fontSize: 11, marginTop: 1 },
  actionsRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { backgroundColor: 'rgba(255,255,255,0.08)', padding: 8, borderRadius: 8 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  logoutBtnText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },
  modalLogoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  
  // Light Theme (Student & Librarian Header)
  lightContainer: { backgroundColor: '#F8FAFC', paddingTop: 48, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  lightRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  leftSection: { width: 50, alignItems: 'flex-start' },
  avatarBox: { width: 38, height: 38, borderRadius: 19, backgroundColor: '#E2E8F0', overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1' },
  logoWrapper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  adminCenterSection: { flex: 1, alignItems: 'center' },
  centerSection: { flex: 1, alignItems: 'center' },
  appTitle: { color: '#0A192F', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  rightSection: { width: 50, alignItems: 'flex-end' },
  lightIconBtn: { padding: 6 },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  notifBox: { backgroundColor: '#FFF', width: '100%', maxWidth: 400, borderRadius: 24, padding: 24, shadowColor: '#000', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 },
  notifHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  notifTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },
  emptyNotifBox: { paddingVertical: 40, alignItems: 'center', justifyContent: 'center' },
  emptyNotifText: { color: '#64748B', fontSize: 15, fontWeight: '500' },
  dismissBtn: { backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, alignItems: 'center', marginTop: 8 },
  dismissBtnText: { color: '#0F172A', fontSize: 15, fontWeight: '700' },
});
