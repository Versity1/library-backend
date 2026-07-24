import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image } from 'react-native';
import { LogOut, User, Mail, Briefcase, ChevronRight, Bell, Shield, BookOpen, Clock } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';

export const StudentProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  if (!user) return null;

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>My Profile</Text>
          <TouchableOpacity onPress={logout} style={s.logoutBtn}>
            <LogOut size={18} color="#EF4444" />
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        <View style={s.profileCard}>
          <View style={s.avatarBox}>
              <User size={36} color="#94A3B8" />
          </View>
          <View style={s.profileInfo}>
            <Text style={s.name}>{user.first_name} {user.last_name}</Text>
            <View style={s.infoRow}>
              <Mail size={14} color="#64748B" />
              <Text style={s.infoText}>{user.email}</Text>
            </View>
            <View style={s.infoRow}>
              <Briefcase size={14} color="#64748B" />
              <Text style={s.infoText}>{user.department || 'General'}</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={s.content}>
        {/* Digital Library Card */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Digital Library Card</Text>
          <View style={s.idCard}>
            <View style={s.idCardHeader}>
              <BookOpen size={20} color="#14B8A6" />
              <Text style={s.idCardTitle}>University Library</Text>
            </View>
            <View style={s.idCardBody}>
              <View style={s.qrBox}>
                <Image 
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user.student_staff_id}&color=0F172A` }} 
                  style={{ width: 120, height: 120 }} 
                />
              </View>
              <View style={s.idDetails}>
                <Text style={s.idLabel}>STUDENT ID</Text>
                <Text style={s.idValue}>{user.student_staff_id}</Text>
                <Text style={s.idLabel}>STATUS</Text>
                <Text style={[s.idValue, { color: '#10B981' }]}>Active</Text>
              </View>
            </View>
            <View style={s.idCardFooter}>
              <Text style={s.idCardFooterText}>Present this QR code at the desk for checkouts.</Text>
            </View>
          </View>
        </View>

        {/* Settings Links */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Settings</Text>
          <View style={s.settingsCard}>
            <TouchableOpacity style={s.settingsRow}>
              <View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <User size={20} color="#3B82F6" />
              </View>
              <Text style={s.settingsText}>Personal Information</Text>
              <ChevronRight size={20} color="#CBD5E1" />
            </TouchableOpacity>
            
            <View style={s.divider} />
            
            <TouchableOpacity style={s.settingsRow}>
              <View style={[s.iconBox, { backgroundColor: '#FEF2F2' }]}>
                <Bell size={20} color="#EF4444" />
              </View>
              <Text style={s.settingsText}>Notifications</Text>
              <ChevronRight size={20} color="#CBD5E1" />
            </TouchableOpacity>
            
            <View style={s.divider} />
            
            <TouchableOpacity style={s.settingsRow}>
              <View style={[s.iconBox, { backgroundColor: '#F0FDFA' }]}>
                <Shield size={20} color="#14B8A6" />
              </View>
              <Text style={s.settingsText}>Privacy & Security</Text>
              <ChevronRight size={20} color="#CBD5E1" />
            </TouchableOpacity>
            
            <View style={s.divider} />
            
            <TouchableOpacity style={s.settingsRow}>
              <View style={[s.iconBox, { backgroundColor: '#F8FAFC' }]}>
                <Clock size={20} color="#64748B" />
              </View>
              <Text style={s.settingsText}>Reading History</Text>
              <ChevronRight size={20} color="#CBD5E1" />
            </TouchableOpacity>
          </View>
        </View>

      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },
  
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#E2E8F0', overflow: 'hidden', borderWidth: 2, borderColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, alignItems: 'center', justifyContent: 'center' },
  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 6 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  infoText: { fontSize: 13, color: '#64748B' },

  content: { padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  
  // Digital ID Card
  idCard: { backgroundColor: '#0F172A', borderRadius: 24, overflow: 'hidden', shadowColor: '#0F172A', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 10 },
  idCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 20, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  idCardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', letterSpacing: 1 },
  idCardBody: { flexDirection: 'row', padding: 24, alignItems: 'center', gap: 24 },
  qrBox: { width: 140, height: 140, backgroundColor: '#FFF', borderRadius: 16, alignItems: 'center', justifyContent: 'center', padding: 10 },
  idDetails: { flex: 1, gap: 4 },
  idLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1, marginTop: 8 },
  idValue: { color: '#FFF', fontSize: 16, fontWeight: '700', fontFamily: 'monospace' },
  idCardFooter: { backgroundColor: '#1E293B', padding: 16, alignItems: 'center' },
  idCardFooterText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },

  // Settings
  settingsCard: { backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 16 },
  settingsText: { flex: 1, fontSize: 15, fontWeight: '600', color: '#0F172A' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 72 },
});
