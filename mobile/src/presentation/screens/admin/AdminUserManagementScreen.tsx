import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Users, UserPlus, Trash2, Edit3, ShieldAlert, CheckCircle2, UserX } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Badge } from '../../components/Badge';

export const AdminUserManagementScreen: React.FC = () => {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState<'STUDENT' | 'LIBRARIAN'>('STUDENT');
  const [search, setSearch] = useState('');

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  
  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [studentStaffId, setStudentStaffId] = useState('');
  const [department, setDepartment] = useState('');
  const [borrowingLimit, setBorrowingLimit] = useState('3');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.USERS);
      setUsers(res.data);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => u.role === roleFilter && 
    (u.first_name?.toLowerCase().includes(search.toLowerCase()) || 
     u.last_name?.toLowerCase().includes(search.toLowerCase()) ||
     u.email?.toLowerCase().includes(search.toLowerCase()) ||
     u.student_staff_id?.toLowerCase().includes(search.toLowerCase()))
  );

  const openAddModal = () => {
    setEditingUser(null);
    setEmail('');
    setPassword('');
    setFirstName('');
    setLastName('');
    setStudentStaffId('');
    setDepartment('');
    setBorrowingLimit('3');
    setModalVisible(true);
  };

  const openEditModal = (user: any) => {
    setEditingUser(user);
    setEmail(user.email);
    setPassword('');
    setFirstName(user.first_name);
    setLastName(user.last_name);
    setStudentStaffId(user.student_staff_id);
    setDepartment(user.department || '');
    setBorrowingLimit(user.borrowing_limit?.toString() || '3');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!email || !firstName || !lastName || !studentStaffId) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        email,
        first_name: firstName,
        last_name: lastName,
        student_staff_id: studentStaffId,
        department,
        role: roleFilter,
        borrowing_limit: parseInt(borrowingLimit, 10),
      };
      if (password) payload.password = password;

      if (editingUser) {
        await apiClient.patch(`${API_ENDPOINTS.ADMIN.USERS}${editingUser.id}/`, payload);
        Alert.alert('Success', 'User updated successfully');
      } else {
        if (!password) {
          Alert.alert('Error', 'Password is required for new users');
          setIsSubmitting(false);
          return;
        }
        await apiClient.post(API_ENDPOINTS.ADMIN.USERS, payload);
        Alert.alert('Success', 'User added successfully');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (e: any) {
      Alert.alert('Error', JSON.stringify(e.response?.data) || 'Failed to save user');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert('Confirm Delete', `Are you sure you want to delete ${name}? This cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`${API_ENDPOINTS.ADMIN.USERS}${id}/`);
          Alert.alert('Deleted', 'User has been removed');
          fetchUsers();
        } catch(e: any) {
          Alert.alert('Error', 'Failed to delete user');
        }
      }}
    ]);
  };

  const toggleSuspend = async (user: any) => {
    const action = user.is_active ? 'suspend' : 'activate';
    Alert.alert(`Confirm ${action}`, `Are you sure you want to ${action} ${user.first_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Yes', onPress: async () => {
        try {
          await apiClient.patch(`${API_ENDPOINTS.ADMIN.USERS}${user.id}/`, { is_active: !user.is_active });
          fetchUsers();
        } catch(e) {
          Alert.alert('Error', `Failed to ${action} user`);
        }
      }}
    ]);
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <View style={s.tabContainer}>
          <TouchableOpacity 
            style={[s.tabBtn, roleFilter === 'STUDENT' && s.tabActive]} 
            onPress={() => setRoleFilter('STUDENT')}>
            <Text style={[s.tabText, roleFilter === 'STUDENT' && s.tabTextActive]}>Students</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[s.tabBtn, roleFilter === 'LIBRARIAN' && s.tabActive]} 
            onPress={() => setRoleFilter('LIBRARIAN')}>
            <Text style={[s.tabText, roleFilter === 'LIBRARIAN' && s.tabTextActive]}>Librarians</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchRow}>
          <TextInput 
            style={s.searchInput}
            placeholder={`Search ${roleFilter.toLowerCase()}s...`}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="#94A3B8"
          />
          <TouchableOpacity style={s.addBtn} onPress={openAddModal}>
            <UserPlus size={18} color="#FFF" />
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator color="#14B8A6" size="large"/></View>
      ) : (
        <FlatList 
          data={filteredUsers}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          renderItem={({ item }) => (
            <View style={[s.userCard, !item.is_active && s.suspendedCard]}>
              <View style={s.userInfo}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={s.userName}>{item.first_name} {item.last_name}</Text>
                  {!item.is_active && <Badge label="Suspended" variant="danger" />}
                </View>
                <Text style={s.userMeta}>{item.email} • {item.student_staff_id}</Text>
                <Text style={s.userMeta}>{item.department || 'N/A'} • Limit: {item.borrowing_limit}</Text>
              </View>
              <View style={s.actionRow}>
                <TouchableOpacity style={s.actionBtn} onPress={() => toggleSuspend(item)}>
                  {item.is_active ? <UserX size={18} color="#F59E0B" /> : <CheckCircle2 size={18} color="#10B981" />}
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => openEditModal(item)}>
                  <Edit3 size={18} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity style={s.actionBtn} onPress={() => handleDelete(item.id, item.first_name)}>
                  <Trash2 size={18} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={<View style={s.center}><Text style={{color: '#94A3B8'}}>No users found.</Text></View>}
        />
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={s.modalOverlay}>
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>{editingUser ? 'Edit User' : 'Add New User'}</Text>
            
            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              <Text style={s.label}>First Name</Text>
              <TextInput style={s.input} value={firstName} onChangeText={setFirstName} />
              
              <Text style={s.label}>Last Name</Text>
              <TextInput style={s.input} value={lastName} onChangeText={setLastName} />

              <Text style={s.label}>Email Address</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

              <Text style={s.label}>{editingUser ? 'New Password (leave blank to keep current)' : 'Password'}</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry />

              <Text style={s.label}>ID Number (Student/Staff ID)</Text>
              <TextInput style={s.input} value={studentStaffId} onChangeText={setStudentStaffId} />

              <Text style={s.label}>Department</Text>
              <TextInput style={s.input} value={department} onChangeText={setDepartment} />

              <Text style={s.label}>Borrowing Limit</Text>
              <TextInput style={s.input} value={borrowingLimit} onChangeText={setBorrowingLimit} keyboardType="numeric" />
            </ScrollView>

            <View style={s.modalActions}>
              <TouchableOpacity style={s.cancelBtn} onPress={() => setModalVisible(false)} disabled={isSubmitting}>
                <Text style={s.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>Save</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { padding: 16, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  tabContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 8, padding: 4, marginBottom: 12 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  tabActive: { backgroundColor: '#FFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 1 },
  tabText: { color: '#64748B', fontWeight: '600', fontSize: 13 },
  tabTextActive: { color: '#0F172A', fontWeight: '700' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: { flex: 1, backgroundColor: '#F1F5F9', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, color: '#0F172A' },
  addBtn: { backgroundColor: '#14B8A6', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, borderRadius: 12, gap: 6 },
  addBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  
  userCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', alignItems: 'center' },
  suspendedCard: { opacity: 0.7, backgroundColor: '#FEF2F2' },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  userMeta: { fontSize: 12, color: '#64748B', marginTop: 4 },
  actionRow: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 8 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A', marginBottom: 20 },
  label: { fontSize: 12, fontWeight: '700', color: '#64748B', marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, color: '#0F172A' },
  
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 24, paddingBottom: 24 },
  cancelBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#F1F5F9', borderRadius: 12, alignItems: 'center' },
  cancelBtnText: { color: '#475569', fontWeight: '800', fontSize: 15 },
  saveBtn: { flex: 1, paddingVertical: 14, backgroundColor: '#14B8A6', borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
