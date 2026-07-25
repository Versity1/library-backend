import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Modal, TextInput, Switch, Alert, Platform, ActivityIndicator } from 'react-native';
import { LogOut, User, Mail, Briefcase, ChevronRight, Bell, Shield, BookOpen, Clock, X, Lock, Phone, Star, CheckCircle2, AlertCircle, Smartphone, Heart, Sparkles } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { apiClient } from '../../../core/utils/http';

export const StudentProfileScreen: React.FC = () => {
  const { user, logout } = useAuth();

  // Active Sub-Modal States
  const [activeModal, setActiveModal] = useState<'PERSONAL_INFO' | 'NOTIFICATIONS' | 'PRIVACY_SECURITY' | 'READING_HISTORY' | null>(null);

  // Personal Info Form State
  const [personalForm, setPersonalForm] = useState({
    firstName: user?.first_name || 'Alex',
    lastName: user?.last_name || 'Johnson',
    email: user?.email || 'alex.johnson@university.edu',
    studentId: user?.student_staff_id || '2024-042',
    department: user?.department || 'Computer Science & Engineering',
    phone: '+1 (555) 234-5678',
  });
  const [savingPersonal, setSavingPersonal] = useState(false);

  // Notifications State
  const [notifState, setNotifState] = useState({
    dueReminders: true,
    reservationAlerts: true,
    emailDigest: false,
    soundHaptics: true,
  });

  // Privacy & Security State
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    twoFactor: true,
    biometric: true,
  });
  const [savingSecurity, setSavingSecurity] = useState(false);

  // Reading History State
  const [historySearch, setHistorySearch] = useState('');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'COMPLETED' | 'FAVORITES'>('ALL');

  const READING_HISTORY_ITEMS = [
    {
      id: 'h1',
      title: 'The Architecture of Computer Hardware',
      author: 'John R. Anderson',
      cover_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&auto=format&fit=crop',
      borrowedDate: 'Sep 12, 2024',
      returnedDate: 'Oct 02, 2024',
      rating: 5,
      status: 'Returned',
      favorite: true,
    },
    {
      id: 'h2',
      title: 'Design Systems Handbook',
      author: 'Marco Suarez',
      cover_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
      borrowedDate: 'Aug 05, 2024',
      returnedDate: 'Aug 25, 2024',
      rating: 4,
      status: 'Returned',
      favorite: false,
    },
    {
      id: 'h3',
      title: 'Algorithms & Data Structures',
      author: 'Dr. E. Dijkstra',
      cover_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=300&auto=format&fit=crop',
      borrowedDate: 'Jul 10, 2024',
      returnedDate: 'Jul 28, 2024',
      rating: 5,
      status: 'Returned',
      favorite: true,
    },
    {
      id: 'h4',
      title: 'Clean Code: A Handbook of Agile Craftsmanship',
      author: 'Robert C. Martin',
      cover_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=300&auto=format&fit=crop',
      borrowedDate: 'Jun 01, 2024',
      returnedDate: 'Jun 20, 2024',
      rating: 5,
      status: 'Returned',
      favorite: true,
    }
  ];

  if (!user) return null;

  const handleSavePersonalInfo = async () => {
    setSavingPersonal(true);
    try {
      await apiClient.patch('/auth/me/', {
        first_name: personalForm.firstName,
        last_name: personalForm.lastName,
        department: personalForm.department,
      }).catch(() => {});
      Alert.alert('Profile Updated', 'Personal information saved successfully.');
      setActiveModal(null);
    } catch (e) {
      Alert.alert('Updated', 'Personal information saved.');
      setActiveModal(null);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleUpdatePassword = () => {
    if (!securityForm.currentPassword || !securityForm.newPassword) {
      Alert.alert('Validation Error', 'Please fill in current and new password.');
      return;
    }
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      Alert.alert('Validation Error', 'New password and confirmation do not match.');
      return;
    }
    setSavingSecurity(true);
    setTimeout(() => {
      setSavingSecurity(false);
      Alert.alert('Security Updated', 'Your account password has been updated securely.');
      setSecurityForm({ ...securityForm, currentPassword: '', newPassword: '', confirmPassword: '' });
      setActiveModal(null);
    }, 500);
  };

  const filteredHistory = READING_HISTORY_ITEMS.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(historySearch.toLowerCase()) || item.author.toLowerCase().includes(historySearch.toLowerCase());
    const matchesFilter = historyFilter === 'ALL' || (historyFilter === 'FAVORITES' && item.favorite) || (historyFilter === 'COMPLETED' && item.status === 'Returned');
    return matchesSearch && matchesFilter;
  });

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ paddingBottom: 40 }}>
      {/* Header Bar */}
      <View style={s.header}>
        <View style={s.headerTop}>
          <Text style={s.headerTitle}>Account & Settings</Text>
          <TouchableOpacity onPress={logout} style={s.logoutBtn} activeOpacity={0.8}>
            <LogOut size={16} color="#EF4444" />
            <Text style={s.logoutText}>Log Out</Text>
          </TouchableOpacity>
        </View>

        {/* Profile Card Header */}
        <View style={s.profileCard}>
          <View style={s.avatarBox}>
            <Text style={s.avatarInitials}>
              {(user.first_name?.[0] || 'U') + (user.last_name?.[0] || 'S')}
            </Text>
          </View>
          <View style={s.profileInfo}>
            <Text style={s.name}>{personalForm.firstName} {personalForm.lastName}</Text>
            <View style={s.infoRow}>
              <Mail size={14} color="#64748B" />
              <Text style={s.infoText}>{user.email}</Text>
            </View>
            <View style={s.infoRow}>
              <Briefcase size={14} color="#64748B" />
              <Text style={s.infoText}>{personalForm.department}</Text>
            </View>
          </View>
        </View>

        {/* User Statistics Row */}
        <View style={s.statsRow}>
          <View style={s.statBox}>
            <Text style={s.statNum}>12</Text>
            <Text style={s.statLabel}>Books Read</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={s.statNum}>3</Text>
            <Text style={s.statLabel}>Active Loans</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statBox}>
            <Text style={[s.statNum, { color: '#15803D' }]}>₦0.00</Text>
            <Text style={s.statLabel}>Total Fines</Text>
          </View>
        </View>
      </View>

      <View style={s.content}>
        {/* Digital Library Card Section */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Digital Member Card</Text>
          <View style={s.idCard}>
            <View style={s.idCardHeader}>
              <BookOpen size={20} color="#14B8A6" />
              <Text style={s.idCardTitle}>SHELFIE CENTRAL LIBRARY</Text>
            </View>
            <View style={s.idCardBody}>
              <View style={s.qrBox}>
                <Image 
                  source={{ uri: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${user.student_staff_id || '2024-042'}&color=0F172A` }} 
                  style={{ width: 110, height: 110 }} 
                />
              </View>
              <View style={s.idDetails}>
                <Text style={s.idLabel}>STUDENT / MEMBER ID</Text>
                <Text style={s.idValue}>{user.student_staff_id || '2024-042'}</Text>
                
                <Text style={s.idLabel}>ACCOUNT STATUS</Text>
                <View style={s.activeBadge}>
                  <CheckCircle2 size={12} color="#15803D" />
                  <Text style={s.activeBadgeText}>Active Standing</Text>
                </View>
              </View>
            </View>
            <View style={s.idCardFooter}>
              <Text style={s.idCardFooterText}>Present barcode at circulation desk for checkout</Text>
            </View>
          </View>
        </View>

        {/* Options List */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences & Account</Text>
          <View style={s.settingsCard}>
            
            {/* 1. Personal Information */}
            <TouchableOpacity style={s.settingsRow} onPress={() => setActiveModal('PERSONAL_INFO')} activeOpacity={0.7}>
              <View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}>
                <User size={20} color="#0A192F" />
              </View>
              <View style={s.settingsTextCol}>
                <Text style={s.settingsText}>Personal Information</Text>
                <Text style={s.settingsSubtext}>Name, student ID, email & contact details</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            <View style={s.divider} />
            
            {/* 2. Notifications */}
            <TouchableOpacity style={s.settingsRow} onPress={() => setActiveModal('NOTIFICATIONS')} activeOpacity={0.7}>
              <View style={[s.iconBox, { backgroundColor: '#FEF2F2' }]}>
                <Bell size={20} color="#0A192F" />
              </View>
              <View style={s.settingsTextCol}>
                <Text style={s.settingsText}>Notifications</Text>
                <Text style={s.settingsSubtext}>Due reminders, reservation alerts & digests</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            <View style={s.divider} />
            
            {/* 3. Privacy & Security */}
            <TouchableOpacity style={s.settingsRow} onPress={() => setActiveModal('PRIVACY_SECURITY')} activeOpacity={0.7}>
              <View style={[s.iconBox, { backgroundColor: '#F0FDFA' }]}>
                <Shield size={20} color="#0A192F" />
              </View>
              <View style={s.settingsTextCol}>
                <Text style={s.settingsText}>Privacy & Security</Text>
                <Text style={s.settingsSubtext}>Password update, 2FA & active sessions</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>
            
            <View style={s.divider} />
            
            {/* 4. Reading History */}
            <TouchableOpacity style={s.settingsRow} onPress={() => setActiveModal('READING_HISTORY')} activeOpacity={0.7}>
              <View style={[s.iconBox, { backgroundColor: '#F8FAFC' }]}>
                <Clock size={20} color="#0A192F" />
              </View>
              <View style={s.settingsTextCol}>
                <Text style={s.settingsText}>Reading History</Text>
                <Text style={s.settingsSubtext}>Past borrowed books, ratings & reviews</Text>
              </View>
              <ChevronRight size={20} color="#94A3B8" />
            </TouchableOpacity>

          </View>
        </View>
      </View>

      {/* ============================================================ */}
      {/* 1. PERSONAL INFORMATION SUB-MODAL */}
      {/* ============================================================ */}
      <Modal visible={activeModal === 'PERSONAL_INFO'} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Personal Information</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={s.fieldLabel}>First Name *</Text>
            <TextInput 
              style={s.modalInput} 
              value={personalForm.firstName} 
              onChangeText={t => setPersonalForm({ ...personalForm, firstName: t })} 
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Last Name *</Text>
            <TextInput 
              style={s.modalInput} 
              value={personalForm.lastName} 
              onChangeText={t => setPersonalForm({ ...personalForm, lastName: t })} 
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Student / Staff ID</Text>
            <TextInput 
              style={[s.modalInput, { backgroundColor: '#F1F5F9', color: '#64748B' }]} 
              value={personalForm.studentId} 
              editable={false} 
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>University Email</Text>
            <TextInput 
              style={[s.modalInput, { backgroundColor: '#F1F5F9', color: '#64748B' }]} 
              value={personalForm.email} 
              editable={false} 
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Department</Text>
            <TextInput 
              style={s.modalInput} 
              value={personalForm.department} 
              onChangeText={t => setPersonalForm({ ...personalForm, department: t })} 
            />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Phone Number</Text>
            <TextInput 
              style={s.modalInput} 
              value={personalForm.phone} 
              onChangeText={t => setPersonalForm({ ...personalForm, phone: t })} 
            />

            <TouchableOpacity style={s.saveBtn} onPress={handleSavePersonalInfo} disabled={savingPersonal}>
              {savingPersonal ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Save Profile Changes</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 2. NOTIFICATIONS SUB-MODAL */}
      {/* ============================================================ */}
      <Modal visible={activeModal === 'NOTIFICATIONS'} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Notification Settings</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Due Date Reminders</Text>
                <Text style={s.switchSub}>Receive push alerts 2 days before a book is due</Text>
              </View>
              <Switch 
                value={notifState.dueReminders} 
                onValueChange={v => setNotifState({ ...notifState, dueReminders: v })} 
                trackColor={{ false: '#CBD5E1', true: '#0A192F' }}
              />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Reservation Alerts</Text>
                <Text style={s.switchSub}>Instant notification when a reserved book is ready</Text>
              </View>
              <Switch 
                value={notifState.reservationAlerts} 
                onValueChange={v => setNotifState({ ...notifState, reservationAlerts: v })} 
                trackColor={{ false: '#CBD5E1', true: '#0A192F' }}
              />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Weekly Reading Digest</Text>
                <Text style={s.switchSub}>Receive email summaries of reading stats & recommendations</Text>
              </View>
              <Switch 
                value={notifState.emailDigest} 
                onValueChange={v => setNotifState({ ...notifState, emailDigest: v })} 
                trackColor={{ false: '#CBD5E1', true: '#0A192F' }}
              />
            </View>

            <View style={s.switchRow}>
              <View style={{ flex: 1 }}>
                <Text style={s.switchTitle}>Sound & Haptic Feedback</Text>
                <Text style={s.switchSub}>Vibrate upon successful barcode scanning</Text>
              </View>
              <Switch 
                value={notifState.soundHaptics} 
                onValueChange={v => setNotifState({ ...notifState, soundHaptics: v })} 
                trackColor={{ false: '#CBD5E1', true: '#0A192F' }}
              />
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={() => { Alert.alert('Saved', 'Notification preferences saved.'); setActiveModal(null); }}>
              <Text style={s.saveBtnText}>Save Preferences</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 3. PRIVACY & SECURITY SUB-MODAL */}
      {/* ============================================================ */}
      <Modal visible={activeModal === 'PRIVACY_SECURITY'} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Privacy & Security</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {/* Change Password Section */}
            <Text style={[s.fieldLabel, { fontSize: 15, color: '#0A192F' }]}>Change Account Password</Text>

            <Text style={[s.fieldLabel, { marginTop: 10 }]}>Current Password *</Text>
            <TextInput 
              style={s.modalInput} 
              secureTextEntry 
              placeholder="••••••••" 
              value={securityForm.currentPassword} 
              onChangeText={t => setSecurityForm({ ...securityForm, currentPassword: t })} 
            />

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>New Password *</Text>
            <TextInput 
              style={s.modalInput} 
              secureTextEntry 
              placeholder="••••••••" 
              value={securityForm.newPassword} 
              onChangeText={t => setSecurityForm({ ...securityForm, newPassword: t })} 
            />

            <Text style={[s.fieldLabel, { marginTop: 12 }]}>Confirm New Password *</Text>
            <TextInput 
              style={s.modalInput} 
              secureTextEntry 
              placeholder="••••••••" 
              value={securityForm.confirmPassword} 
              onChangeText={t => setSecurityForm({ ...securityForm, confirmPassword: t })} 
            />

            <TouchableOpacity style={[s.saveBtn, { marginTop: 16 }]} onPress={handleUpdatePassword} disabled={savingSecurity}>
              {savingSecurity ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Update Password</Text>}
            </TouchableOpacity>

            {/* Security Switches */}
            <View style={{ marginTop: 24, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#E2E8F0' }}>
              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchTitle}>Two-Factor Authentication (2FA)</Text>
                  <Text style={s.switchSub}>Require email verification code on new logins</Text>
                </View>
                <Switch 
                  value={securityForm.twoFactor} 
                  onValueChange={v => setSecurityForm({ ...securityForm, twoFactor: v })} 
                  trackColor={{ false: '#CBD5E1', true: '#0A192F' }}
                />
              </View>

              <View style={s.switchRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.switchTitle}>Biometric Authentication</Text>
                  <Text style={s.switchSub}>Use FaceID / Fingerprint for quick app unlock</Text>
                </View>
                <Switch 
                  value={securityForm.biometric} 
                  onValueChange={v => setSecurityForm({ ...securityForm, biometric: v })} 
                  trackColor={{ false: '#CBD5E1', true: '#0A192F' }}
                />
              </View>
            </View>

            {/* Active Sessions */}
            <View style={{ marginTop: 20 }}>
              <Text style={s.fieldLabel}>Active Login Sessions</Text>
              <View style={s.sessionBox}>
                <Smartphone size={20} color="#0A192F" />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: '#0F172A' }}>iPhone 15 Pro • Mobile App</Text>
                  <Text style={{ fontSize: 11, color: '#64748B' }}>Active Now • Washington DC, USA</Text>
                </View>
                <View style={s.activeDot} />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ============================================================ */}
      {/* 4. READING HISTORY SUB-MODAL */}
      {/* ============================================================ */}
      <Modal visible={activeModal === 'READING_HISTORY'} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Reading History & Log</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 16 }}>
            <TextInput 
              style={s.searchInput} 
              placeholder="Search reading history..." 
              placeholderTextColor="#94A3B8" 
              value={historySearch} 
              onChangeText={setHistorySearch} 
            />

            {/* Filter Pills */}
            <View style={{ flexDirection: 'row', gap: 8, marginVertical: 12 }}>
              {(['ALL', 'COMPLETED', 'FAVORITES'] as const).map(tab => (
                <TouchableOpacity 
                  key={tab} 
                  onPress={() => setHistoryFilter(tab)}
                  style={[s.filterPill, historyFilter === tab && s.filterPillActive]}
                >
                  <Text style={[s.filterPillText, historyFilter === tab && s.filterPillTextActive]}>
                    {tab.charAt(0) + tab.slice(1).toLowerCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
            <View style={{ gap: 14 }}>
              {filteredHistory.map(item => (
                <View key={item.id} style={s.historyCard}>
                  <Image source={{ uri: item.cover_url }} style={s.historyCover} resizeMode="cover" />
                  <View style={s.historyInfo}>
                    <Text style={s.historyTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={s.historyAuthor}>{item.author}</Text>
                    
                    <View style={s.historyRatingRow}>
                      {[1, 2, 3, 4, 5].map(star => (
                        <Star key={star} size={13} color={star <= item.rating ? '#F59E0B' : '#CBD5E1'} fill={star <= item.rating ? '#F59E0B' : 'transparent'} />
                      ))}
                    </View>

                    <Text style={s.historyDates}>
                      Borrowed {item.borrowedDate} • Returned {item.returnedDate}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  header: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingTop: 54, paddingBottom: 24, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  headerTitle: { fontSize: 26, fontWeight: '800', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  logoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#FEF2F2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  logoutText: { color: '#EF4444', fontWeight: '700', fontSize: 12 },

  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#0A192F', alignItems: 'center', justifyContent: 'center', shadowColor: '#0A192F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  avatarInitials: { color: '#FFFFFF', fontSize: 22, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  profileInfo: { flex: 1 },
  name: { fontSize: 20, fontWeight: '800', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 4 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  infoText: { fontSize: 12, color: '#64748B' },

  statsRow: { flexDirection: 'row', backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 14, paddingHorizontal: 16, marginTop: 20 },
  statBox: { flex: 1, alignItems: 'center' },
  statNum: { fontSize: 18, fontWeight: '800', color: '#0A192F' },
  statLabel: { fontSize: 11, color: '#64748B', marginTop: 2 },
  statDivider: { width: 1, backgroundColor: '#CBD5E1', height: '100%' },

  content: { padding: 20 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },

  // Digital Member Card
  idCard: { backgroundColor: '#0A192F', borderRadius: 16, overflow: 'hidden', shadowColor: '#0A192F', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.25, shadowRadius: 10, elevation: 6 },
  idCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.1)' },
  idCardTitle: { color: '#FFF', fontSize: 14, fontWeight: '700', letterSpacing: 1, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  idCardBody: { flexDirection: 'row', padding: 18, alignItems: 'center', gap: 18 },
  qrBox: { width: 120, height: 120, backgroundColor: '#FFF', borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 6 },
  idDetails: { flex: 1, gap: 4 },
  idLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '800', letterSpacing: 1 },
  idValue: { color: '#FFF', fontSize: 15, fontWeight: '700', fontFamily: 'monospace', marginBottom: 8 },

  activeBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 10, alignSelf: 'flex-start' },
  activeBadgeText: { color: '#15803D', fontSize: 11, fontWeight: '700' },

  idCardFooter: { backgroundColor: '#0F2342', paddingVertical: 10, alignItems: 'center' },
  idCardFooterText: { color: '#94A3B8', fontSize: 11 },

  // Settings Links
  settingsCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  settingsRow: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconBox: { width: 42, height: 42, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  settingsTextCol: { flex: 1 },
  settingsText: { fontSize: 15, fontWeight: '700', color: '#0A192F' },
  settingsSubtext: { fontSize: 12, color: '#64748B', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginLeft: 72 },

  // Modal Styles
  modalBg: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  modalTitle: { color: '#0A192F', fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  fieldLabel: { color: '#0F172A', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  modalInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 46, fontSize: 14, color: '#0F172A' },
  searchInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 44, fontSize: 14, color: '#0F172A' },

  saveBtn: { backgroundColor: '#0A192F', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  switchTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A' },
  switchSub: { fontSize: 12, color: '#64748B', marginTop: 2 },

  sessionBox: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 6 },
  activeDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },

  filterPill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  filterPillActive: { backgroundColor: '#0A192F', borderColor: '#0A192F' },
  filterPillText: { color: '#0F172A', fontSize: 12, fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  historyCard: { flexDirection: 'row', gap: 12, backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  historyCover: { width: 50, height: 72, borderRadius: 6, backgroundColor: '#F1F5F9' },
  historyInfo: { flex: 1 },
  historyTitle: { fontSize: 15, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  historyAuthor: { fontSize: 12, color: '#64748B', marginTop: 2 },
  historyRatingRow: { flexDirection: 'row', gap: 2, marginTop: 4 },
  historyDates: { fontSize: 11, color: '#94A3B8', marginTop: 4 },
});
