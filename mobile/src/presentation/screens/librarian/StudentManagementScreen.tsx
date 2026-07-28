import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Alert, StyleSheet, Platform, RefreshControl } from 'react-native';
import { Search, QrCode, UserPlus, MoreVertical, BookOpen, ShieldAlert, X, User, Edit, DollarSign, Trash2, ShieldX, ShieldCheck, Clock } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Transaction } from '../../../domain/types';
import { ScannerScreen } from '../shared/ScannerScreen';
import { LibraryAccessLogsScreen } from './LibraryAccessLogsScreen';

export interface StudentItem {
  id: string;
  name: string;
  student_id: string;
  department: string;
  status: 'Active' | 'Pending' | 'Suspended';
  borrowed_count: number;
  fines_amount?: number;
  avatar_url?: string;
  initials?: string;
  email?: string;
  phone?: string;
}

const INITIAL_STUDENTS: StudentItem[] = [
  {
    id: 's1',
    name: 'Eleanor Vance',
    student_id: '2023-0891',
    department: 'Dept. of History',
    status: 'Active',
    borrowed_count: 3,
    avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 's2',
    name: 'Julian Sorel',
    student_id: '2022-1142',
    department: 'Dept. of Literature',
    status: 'Pending',
    borrowed_count: 0,
    avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop',
  },
  {
    id: 's3',
    name: 'Mina Harker',
    student_id: '2021-0455',
    department: 'Dept. of Education',
    status: 'Suspended',
    borrowed_count: 0,
    fines_amount: 15.50,
    initials: 'MH',
  }
];

export const StudentManagementScreen: React.FC = () => {
  const [students, setStudents] = useState<StudentItem[]>(INITIAL_STUDENTS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals State
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAccessLogsOpen, setIsAccessLogsOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentItem | null>(null);
  const [isActionMenuOpen, setIsActionMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isFineOpen, setIsFineOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [studentLoans, setStudentLoans] = useState<Transaction[]>([]);
  const [loadingLoans, setLoadingLoans] = useState(false);

  // Form States
  const [newStudent, setNewStudent] = useState({ name: '', student_id: '', department: 'Dept. of CS' });
  const [editStudentData, setEditStudentData] = useState({ name: '', student_id: '', department: '' });
  const [fineAmount, setFineAmount] = useState('10.00');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, [searchQuery]);

  const fetchStudents = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.USERS);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      
      if (data && data.length > 0) {
        const studentUsers = data.filter((u: any) => u.role === 'STUDENT' || !u.role);
        const mapped: StudentItem[] = (studentUsers.length > 0 ? studentUsers : data).map((u: any) => {
          const fullName = `${u.first_name || ''} ${u.last_name || ''}`.trim() || u.name || u.email || u.username;
          const parts = fullName.split(' ');
          const init = parts.length > 1 ? (parts[0][0] + parts[1][0]).toUpperCase() : fullName.slice(0, 2).toUpperCase();
          return {
            id: String(u.id),
            name: fullName,
            student_id: u.student_staff_id || `2024-00${u.id}`,
            department: u.department || 'Dept. of CS',
            status: u.is_active === false ? 'Suspended' : 'Active',
            borrowed_count: u.active_loans_count || 0,
            fines_amount: u.fines_amount ? parseFloat(u.fines_amount) : 0,
            avatar_url: u.avatar_url,
            initials: init,
            email: u.email || '',
            phone: u.phone || '+1 (555) 000-0000', // Backend doesn't return phone right now, placeholder
          };
        });
        setStudents(mapped);
      }
    } catch (e) {
      console.log('[StudentManagement] Error fetching from backend API:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePressStudent = async (st: StudentItem) => {
    setSelectedStudent(st);
    setIsDetailsOpen(true);
    setLoadingLoans(true);
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TRANSACTIONS.MY_LOANS}?user_id=${st.id}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      setStudentLoans(data);
    } catch (e) {
      console.log('Error fetching student loans', e);
      setStudentLoans([]);
    } finally {
      setLoadingLoans(false);
    }
  };

  const handleRegisterStudent = async () => {
    if (!newStudent.name || !newStudent.student_id) {
      Alert.alert('Validation Error', 'Please enter student name and ID.');
      return;
    }
    setSaving(true);
    const nameParts = newStudent.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || 'Student';
    const email = `${newStudent.student_id.toLowerCase().replace(/[^a-z0-9]/g, '')}@shelfie.edu`;

    try {
      await apiClient.post(API_ENDPOINTS.ADMIN.USERS, {
        email: email,
        password: 'Password123!',
        first_name: firstName,
        last_name: lastName,
        student_staff_id: newStudent.student_id,
        department: newStudent.department,
        role: 'STUDENT',
        is_active: true,
      });
      Alert.alert('Success', `Student ${newStudent.name} registered in backend.`);
      setIsRegisterOpen(false);
      setNewStudent({ name: '', student_id: '', department: 'Dept. of CS' });
      fetchStudents();
    } catch (err: any) {
      // Fallback local update if offline
      const created: StudentItem = {
        id: `s_${Date.now()}`,
        name: newStudent.name,
        student_id: newStudent.student_id,
        department: newStudent.department,
        status: 'Active',
        borrowed_count: 0,
        initials: newStudent.name.split(' ').map(n => n[0]).join('').toUpperCase(),
      };
      setStudents(prev => [created, ...prev]);
      setIsRegisterOpen(false);
      setNewStudent({ name: '', student_id: '', department: 'Dept. of CS' });
      Alert.alert('Success', `Student ${newStudent.name} registered.`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!selectedStudent || !editStudentData.name) return;
    const nameParts = editStudentData.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ');

    try {
      await apiClient.patch(`${API_ENDPOINTS.ADMIN.USERS}${selectedStudent.id}/`, {
        first_name: firstName,
        last_name: lastName,
        student_staff_id: editStudentData.student_id,
        department: editStudentData.department,
      });
      Alert.alert('Updated', 'Student details updated in backend.');
      fetchStudents();
    } catch (e) {
      setStudents(prev => prev.map(st => st.id === selectedStudent.id ? {
        ...st,
        name: editStudentData.name,
        student_id: editStudentData.student_id,
        department: editStudentData.department,
      } : st));
      Alert.alert('Updated', 'Student details updated.');
    } finally {
      setIsEditOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleToggleSuspend = async (st: StudentItem) => {
    const nextActive = st.status === 'Suspended';
    try {
      await apiClient.patch(`${API_ENDPOINTS.ADMIN.USERS}${st.id}/`, {
        is_active: nextActive,
      });
      Alert.alert('Status Updated', `${st.name} is now ${nextActive ? 'Active' : 'Suspended'}.`);
      fetchStudents();
    } catch (e) {
      const nextStatus = nextActive ? 'Active' : 'Suspended';
      setStudents(prev => prev.map(item => item.id === st.id ? { ...item, status: nextStatus } : item));
      Alert.alert('Status Updated', `${st.name} is now ${nextStatus}.`);
    } finally {
      setIsActionMenuOpen(false);
    }
  };

  const handleApplyFine = async () => {
    if (!selectedStudent) return;
    const amount = parseFloat(fineAmount) || 0;
    
    try {
      await apiClient.post('/fines/apply/', {
        user_id: selectedStudent.id,
        amount: amount,
        reason: 'Manual Fine from Librarian'
      });
      Alert.alert('Fine Updated', `Fine of ₦${amount.toFixed(2)} applied successfully.`);
      fetchStudents();
    } catch (e) {
      console.log('Error applying fine', e);
      Alert.alert('Error', 'Could not apply fine to backend.');
      // Fallback
      setStudents(prev => prev.map(st => st.id === selectedStudent.id ? { ...st, fines_amount: amount } : st));
    } finally {
      setIsFineOpen(false);
      setSelectedStudent(null);
    }
  };

  const handleDeleteStudent = async (st: StudentItem) => {
    Alert.alert('Delete Student', `Are you sure you want to delete ${st.name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await apiClient.delete(`${API_ENDPOINTS.ADMIN.USERS}${st.id}/`);
            fetchStudents();
          } catch (e) {
            setStudents(prev => prev.filter(item => item.id !== st.id));
          } finally {
            setIsActionMenuOpen(false);
          }
        }
      }
    ]);
  };

  const openActionMenu = (st: StudentItem) => {
    setSelectedStudent(st);
    setEditStudentData({ name: st.name, student_id: st.student_id, department: st.department });
    setFineAmount(st.fines_amount ? String(st.fines_amount) : '10.00');
    setIsActionMenuOpen(true);
  };

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.student_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchStudents();
    setRefreshing(false);
  };

  return (
    <View style={s.bg}>
      {/* Top Search & Register Area */}
      <View style={s.topArea}>
        <View style={s.searchBox}>
          <Search size={20} color="#64748B" style={{ marginRight: 10 }} />
          <TextInput 
            style={s.searchInput} 
            placeholder="Search by name or ID..." 
            placeholderTextColor="#94A3B8" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          <TouchableOpacity activeOpacity={0.7} onPress={() => setIsScannerOpen(true)}>
            <QrCode size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity onPress={() => setIsRegisterOpen(true)} style={[s.registerBtn, { flex: 1 }]} activeOpacity={0.8}>
            <UserPlus size={18} color="#FFF" style={{ marginRight: 6 }} />
            <Text style={s.registerBtnText}>+ Register Student</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsAccessLogsOpen(true)} style={s.accessLogsBtn} activeOpacity={0.8}>
            <Clock size={18} color="#0A192F" style={{ marginRight: 6 }} />
            <Text style={s.accessLogsBtnText}>Gate Check-ins</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Student List */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A192F']} tintColor="#0A192F" />}
      >
        {loading ? (
          <ActivityIndicator size="large" color="#0A192F" style={{ marginTop: 40 }} />
        ) : (
          <View style={s.listGap}>
            {filteredStudents.map(st => (
              <TouchableOpacity key={st.id} style={s.card} activeOpacity={0.8} onPress={() => handlePressStudent(st)}>
              {/* Header Info Row */}
              <View style={s.cardTopRow}>
                {st.avatar_url ? (
                  <Image source={{ uri: st.avatar_url }} style={s.avatarImage} resizeMode="cover" />
                ) : (
                  <View style={s.initialsBox}>
                    <Text style={s.initialsText}>{st.initials || 'ST'}</Text>
                  </View>
                )}

                <View style={s.studentInfoCol}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={s.studentName}>{st.name}</Text>
                    <TouchableOpacity onPress={() => openActionMenu(st)} style={{ padding: 4 }}>
                      <MoreVertical size={20} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <Text style={s.studentIdText}>ID: {st.student_id}</Text>
                  <Text style={s.deptText}>{st.department}</Text>
                </View>
              </View>

              <View style={s.divider} />

              {/* Bottom Meta Row */}
              <View style={s.cardBottomRow}>
                {st.status === 'Active' ? (
                  <View style={s.activePill}>
                    <Text style={s.activePillText}>Active</Text>
                  </View>
                ) : st.status === 'Pending' ? (
                  <View style={s.pendingPill}>
                    <Text style={s.pendingPillText}>Pending</Text>
                  </View>
                ) : (
                  <View style={s.suspendedPill}>
                    <Text style={s.suspendedPillText}>Suspended</Text>
                  </View>
                )}

                {st.fines_amount && st.fines_amount > 0 ? (
                  <Text style={s.finesText}>₦{st.fines_amount.toFixed(2)} Fines</Text>
                ) : st.borrowed_count > 0 ? (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <BookOpen size={16} color="#0F172A" />
                    <Text style={s.borrowedText}>{st.borrowed_count} Borrowed</Text>
                  </View>
                ) : null}
              </View>
              </TouchableOpacity>
          ))}
        </View>
      )}
      </ScrollView>

      {/* Action Options Modal */}
      <Modal visible={isActionMenuOpen} transparent animationType="fade">
        <TouchableOpacity style={s.modalOverlay} activeOpacity={1} onPress={() => setIsActionMenuOpen(false)}>
          <View style={s.actionSheetBox}>
            <Text style={s.actionSheetTitle}>{selectedStudent?.name}</Text>
            <Text style={s.actionSheetSub}>Manage student profile & standing</Text>

            <TouchableOpacity 
              style={s.actionOptionRow} 
              onPress={() => { setIsActionMenuOpen(false); setIsEditOpen(true); }}
            >
              <Edit size={18} color="#0A192F" />
              <Text style={s.actionOptionText}>Edit Student Details</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={s.actionOptionRow} 
              onPress={() => selectedStudent && handleToggleSuspend(selectedStudent)}
            >
              {selectedStudent?.status === 'Suspended' ? (
                <>
                  <ShieldCheck size={18} color="#15803D" />
                  <Text style={[s.actionOptionText, { color: '#15803D' }]}>Reactivate Student</Text>
                </>
              ) : (
                <>
                  <ShieldX size={18} color="#B91C1C" />
                  <Text style={[s.actionOptionText, { color: '#B91C1C' }]}>Suspend Account</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity 
              style={s.actionOptionRow} 
              onPress={() => { setIsActionMenuOpen(false); setIsFineOpen(true); }}
            >
              <DollarSign size={18} color="#D97706" />
              <Text style={s.actionOptionText}>Manage / Apply Fine</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.actionOptionRow, { borderBottomWidth: 0 }]} 
              onPress={() => selectedStudent && handleDeleteStudent(selectedStudent)}
            >
              <Trash2 size={18} color="#EF4444" />
              <Text style={[s.actionOptionText, { color: '#EF4444' }]}>Delete Student</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Student Modal */}
      <Modal visible={isEditOpen} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Edit Student Details</Text>
            <TouchableOpacity onPress={() => setIsEditOpen(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={s.fieldLabel}>Full Name</Text>
            <TextInput style={s.modalInput} value={editStudentData.name} onChangeText={t => setEditStudentData({...editStudentData, name: t})} />

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Student ID</Text>
            <TextInput style={s.modalInput} value={editStudentData.student_id} onChangeText={t => setEditStudentData({...editStudentData, student_id: t})} />

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Department</Text>
            <TextInput style={s.modalInput} value={editStudentData.department} onChangeText={t => setEditStudentData({...editStudentData, department: t})} />

            <TouchableOpacity style={s.saveBtn} onPress={handleSaveEdit}>
              <Text style={s.saveBtnText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Manage Fines Modal */}
      <Modal visible={isFineOpen} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Manage Fines</Text>
            <TouchableOpacity onPress={() => setIsFineOpen(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <View style={{ padding: 20 }}>
            <Text style={s.fieldLabel}>Fine Amount (₦)</Text>
            <TextInput 
              style={s.modalInput} 
              keyboardType="decimal-pad"
              value={fineAmount} 
              onChangeText={setFineAmount} 
              placeholder="0.00" 
            />

            <TouchableOpacity style={s.saveBtn} onPress={handleApplyFine}>
              <Text style={s.saveBtnText}>Update Fine Amount</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[s.saveBtn, { backgroundColor: '#DCFCE7', marginTop: 12 }]} 
              onPress={() => { setFineAmount('0.00'); handleApplyFine(); }}
            >
              <Text style={[s.saveBtnText, { color: '#15803D' }]}>Clear All Fines (₦0.00)</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Register New Student Modal */}
      <Modal visible={isRegisterOpen} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>Register New Student</Text>
            <TouchableOpacity onPress={() => setIsRegisterOpen(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            <Text style={s.fieldLabel}>Full Name *</Text>
            <TextInput style={s.modalInput} placeholder="e.g. Eleanor Vance" value={newStudent.name} onChangeText={t => setNewStudent({...newStudent, name: t})} />

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Student ID *</Text>
            <TextInput style={s.modalInput} placeholder="e.g. 2024-089" value={newStudent.student_id} onChangeText={t => setNewStudent({...newStudent, student_id: t})} />

            <Text style={[s.fieldLabel, { marginTop: 16 }]}>Department</Text>
            <TextInput style={s.modalInput} placeholder="e.g. Dept. of History" value={newStudent.department} onChangeText={t => setNewStudent({...newStudent, department: t})} />

            <TouchableOpacity style={s.saveBtn} onPress={handleRegisterStudent} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Register Student</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* QR Code Scanner Modal */}
      <Modal visible={isScannerOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}
            onPress={() => setIsScannerOpen(false)}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <ScannerScreen />
        </View>
      </Modal>

      {/* Student Details Modal */}
      <Modal visible={isDetailsOpen} transparent animationType="slide">
        <View style={s.modalOverlayDark}>
          <View style={s.bottomSheet}>
            <View style={s.sheetHeader}>
              <Text style={s.sheetTitle}>{selectedStudent?.name}</Text>
              <TouchableOpacity onPress={() => setIsDetailsOpen(false)} style={{ padding: 4 }}>
                <X size={20} color="#64748B" />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
              <Text style={s.sheetSectionTitle}>Contact Details</Text>
              <View style={s.contactCard}>
                <Text style={s.contactText}>Email: {selectedStudent?.email}</Text>
                <Text style={s.contactText}>Phone: {selectedStudent?.phone}</Text>
                <Text style={s.contactText}>ID: {selectedStudent?.student_id}</Text>
                <Text style={s.contactText}>Department: {selectedStudent?.department}</Text>
              </View>

              <Text style={[s.sheetSectionTitle, { marginTop: 24 }]}>Borrowed Books</Text>
              {loadingLoans ? (
                <ActivityIndicator size="small" color="#0A192F" style={{ marginTop: 20 }} />
              ) : studentLoans.length === 0 ? (
                <View style={s.emptyStateBox}>
                  <Text style={s.emptyStateText}>No borrowings</Text>
                </View>
              ) : (
                studentLoans.map((loan) => (
                  <View key={loan.id} style={s.loanCard}>
                    <Text style={s.loanTitle} numberOfLines={2}>{loan.book_title}</Text>
                    <View style={s.loanDatesRow}>
                      <Text style={s.loanDateText}>Borrowed: {loan.issue_date ? new Date(loan.issue_date).toLocaleDateString() : 'N/A'}</Text>
                      <Text style={s.loanDateText}>Due: {loan.due_date ? new Date(loan.due_date).toLocaleDateString() : 'N/A'}</Text>
                    </View>
                    <View style={s.loanStatusBadge}>
                      <Text style={s.loanStatusText}>{loan.status}</Text>
                    </View>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Library Access & Gate Check-ins Modal */}
      <Modal visible={isAccessLogsOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(15,23,42,0.8)', padding: 8, borderRadius: 20 }}
            onPress={() => setIsAccessLogsOpen(false)}
          >
            <X size={20} color="#FFF" />
          </TouchableOpacity>
          <LibraryAccessLogsScreen />
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  topArea: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 46, marginBottom: 12 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 14 },

  registerBtn: { flexDirection: 'row', backgroundColor: '#0A192F', height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  registerBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  accessLogsBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0A192F', height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  accessLogsBtnText: { color: '#0A192F', fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  listGap: { gap: 14 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },
  
  cardTopRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  avatarImage: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#E2E8F0' },
  initialsBox: { width: 64, height: 64, borderRadius: 14, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  initialsText: { color: '#0A192F', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  studentInfoCol: { flex: 1 },
  studentName: { color: '#0A192F', fontSize: 18, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  studentIdText: { color: '#64748B', fontSize: 13, marginTop: 2 },
  deptText: { color: '#64748B', fontSize: 13, marginTop: 1 },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 14 },

  cardBottomRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  activePill: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  activePillText: { color: '#15803D', fontSize: 12, fontWeight: '700' },

  pendingPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  pendingPillText: { color: '#B45309', fontSize: 12, fontWeight: '700' },

  suspendedPill: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12 },
  suspendedPillText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },

  borrowedText: { color: '#0F172A', fontSize: 13, fontWeight: '600' },
  finesText: { color: '#B91C1C', fontSize: 14, fontWeight: '700' },

  // Action Modal Overlay
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  actionSheetBox: { backgroundColor: '#FFFFFF', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24 },
  actionSheetTitle: { color: '#0A192F', fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  actionSheetSub: { color: '#64748B', fontSize: 13, marginBottom: 16 },
  actionOptionRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  actionOptionText: { color: '#0A192F', fontSize: 15, fontWeight: '600' },

  // Modal
  modalBg: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { color: '#0A192F', fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  fieldLabel: { color: '#0F172A', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  modalInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 46, fontSize: 14, color: '#0F172A' },
  saveBtn: { backgroundColor: '#0A192F', height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 24 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  // Added Styles for Details Modal
  modalOverlayDark: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  bottomSheet: { backgroundColor: '#F8FAFC', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  sheetTitle: { color: '#0A192F', fontSize: 18, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sheetSectionTitle: { color: '#0A192F', fontSize: 15, fontWeight: '700', marginBottom: 12 },
  contactCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', gap: 6 },
  contactText: { color: '#334155', fontSize: 14 },
  emptyStateBox: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyStateText: { color: '#64748B', fontSize: 14, fontStyle: 'italic' },
  loanCard: { backgroundColor: '#FFF', padding: 14, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  loanTitle: { color: '#0A192F', fontSize: 15, fontWeight: '600', marginBottom: 8 },
  loanDatesRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  loanDateText: { color: '#64748B', fontSize: 12 },
  loanStatusBadge: { backgroundColor: '#F1F5F9', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  loanStatusText: { color: '#334155', fontSize: 12, fontWeight: '600' }
});
