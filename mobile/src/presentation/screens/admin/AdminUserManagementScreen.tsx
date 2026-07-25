import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Users, UserPlus, Trash2, Edit3, ShieldAlert, CheckCircle2, UserX, Search, X, Shield, Lock, Mail, User } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';

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
      const userList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setUsers(userList);
    } catch (e: any) {
      console.log('Error fetching users:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => u.role === roleFilter && 
    ((u.first_name || '').toLowerCase().includes(search.toLowerCase()) || 
     (u.last_name || '').toLowerCase().includes(search.toLowerCase()) ||
     (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
     (u.student_staff_id || '').toLowerCase().includes(search.toLowerCase()))
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
    setEmail(user.email || '');
    setPassword('');
    setFirstName(user.first_name || '');
    setLastName(user.last_name || '');
    setStudentStaffId(user.student_staff_id || '');
    setDepartment(user.department || '');
    setBorrowingLimit(user.borrowing_limit?.toString() || '3');
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!email || !firstName || !lastName || !studentStaffId) {
      Alert.alert('Error', 'Please fill all required fields (Email, First Name, Last Name, ID)');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload: any = {
        email,
        username: email,
        first_name: firstName,
        last_name: lastName,
        student_staff_id: studentStaffId,
        department,
        role: roleFilter,
        borrowing_limit: parseInt(borrowingLimit, 10) || 3,
      };
      if (password) payload.password = password;

      if (editingUser) {
        await apiClient.patch(`${API_ENDPOINTS.ADMIN.USERS}${editingUser.id}/`, payload);
        Alert.alert('Success', 'User updated successfully.');
      } else {
        if (!password) {
          Alert.alert('Error', 'Password is required for creating new users');
          setIsSubmitting(false);
          return;
        }
        await apiClient.post(API_ENDPOINTS.ADMIN.USERS, payload);
        Alert.alert('Success', 'New user account created successfully.');
      }
      setModalVisible(false);
      fetchUsers();
    } catch (e: any) {
      const errData = e.response?.data;
      const msg = typeof errData === 'object' && errData ? Object.values(errData)[0] : 'Failed to save user account.';
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleUserStatus = async (user: any) => {
    const actionText = user.is_active ? 'Suspend' : 'Reactivate';
    Alert.alert(
      `${actionText} Account`,
      `Are you sure you want to ${actionText.toLowerCase()} ${user.first_name} ${user.last_name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: actionText, 
          style: user.is_active ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await apiClient.patch(`${API_ENDPOINTS.ADMIN.USERS}${user.id}/`, { is_active: !user.is_active });
              fetchUsers();
            } catch (e) {
              Alert.alert('Error', `Failed to ${actionText.toLowerCase()} user`);
            }
          }
        }
      ]
    );
  };

  const handleDeleteUser = (user: any) => {
    Alert.alert(
      'Delete User',
      `Permanently remove ${user.first_name} ${user.last_name} from system database?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`${API_ENDPOINTS.ADMIN.USERS}${user.id}/`);
              fetchUsers();
            } catch (e) {
              Alert.alert('Error', 'Failed to delete user');
            }
          }
        }
      ]
    );
  };

  return (
    <View style={s.bg}>
      {/* Role Segmented Filter */}
      <View style={s.topFilterBar}>
        <View style={s.roleSegmentContainer}>
          <TouchableOpacity 
            style={[s.roleTab, roleFilter === 'STUDENT' && s.roleTabActive]}
            onPress={() => setRoleFilter('STUDENT')}
            activeOpacity={0.8}
          >
            <Users size={14} color={roleFilter === 'STUDENT' ? '#0A192F' : '#64748B'} />
            <Text style={[s.roleTabText, roleFilter === 'STUDENT' && s.roleTabTextActive]}>Students</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.roleTab, roleFilter === 'LIBRARIAN' && s.roleTabActive]}
            onPress={() => setRoleFilter('LIBRARIAN')}
            activeOpacity={0.8}
          >
            <Shield size={14} color={roleFilter === 'LIBRARIAN' ? '#0A192F' : '#64748B'} />
            <Text style={[s.roleTabText, roleFilter === 'LIBRARIAN' && s.roleTabTextActive]}>Librarians</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search & Action Bar */}
      <View style={s.actionBar}>
        <View style={s.searchBox}>
          <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
          <TextInput 
            style={s.searchInput}
            placeholder={`Search ${roleFilter.toLowerCase()}s...`}
            placeholderTextColor="#94A3B8"
            value={search}
            onChangeText={setSearch}
          />
          {search ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          ) : null}
        </View>

        <TouchableOpacity style={s.addBtn} onPress={openAddModal} activeOpacity={0.85}>
          <UserPlus size={18} color="#FFF" />
          <Text style={s.addBtnText}>+ Add {roleFilter === 'STUDENT' ? 'Student' : 'Librarian'}</Text>
        </TouchableOpacity>
      </View>

      {/* Users List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#0A192F" style={{ marginTop: 40 }} />
        ) : filteredUsers.length === 0 ? (
          <View style={s.emptyBox}>
            <Users size={40} color="#94A3B8" style={{ marginBottom: 10 }} />
            <Text style={s.emptyTitle}>No {roleFilter.toLowerCase()} accounts found</Text>
            <Text style={s.emptySub}>Register a new user or adjust your search filter.</Text>
          </View>
        ) : (
          <View style={{ gap: 12 }}>
            {filteredUsers.map((item) => {
              const fullName = `${item.first_name || ''} ${item.last_name || ''}`.trim() || item.username || 'User';
              const initials = fullName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <View key={item.id} style={s.userCard}>
                  <View style={s.cardTopRow}>
                    <View style={s.avatarBox}>
                      <Text style={s.avatarText}>{initials}</Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Text style={s.userName}>{fullName}</Text>
                        {!item.is_active && (
                          <View style={s.suspendedBadge}>
                            <Text style={s.suspendedBadgeText}>Suspended</Text>
                          </View>
                        )}
                      </View>
                      <Text style={s.userSub}>ID: {item.student_staff_id || 'N/A'} • {item.department || 'General'}</Text>
                      <Text style={s.userEmail}>{item.email}</Text>
                    </View>

                    <View style={s.limitPill}>
                      <Text style={s.limitPillText}>Limit: {item.borrowing_limit || 3}</Text>
                    </View>
                  </View>

                  <View style={s.divider} />

                  {/* Actions Footer */}
                  <View style={s.cardActionsRow}>
                    <TouchableOpacity 
                      style={[s.statusToggleBtn, item.is_active ? s.suspendBtn : s.reactivateBtn]} 
                      onPress={() => toggleUserStatus(item)}
                      activeOpacity={0.8}
                    >
                      {item.is_active ? <UserX size={14} color="#EF4444" /> : <CheckCircle2 size={14} color="#10B981" />}
                      <Text style={[s.statusToggleText, { color: item.is_active ? '#EF4444' : '#10B981' }]}>
                        {item.is_active ? 'Suspend' : 'Reactivate'}
                      </Text>
                    </TouchableOpacity>

                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity style={s.editActionBtn} onPress={() => openEditModal(item)} activeOpacity={0.8}>
                        <Edit3 size={14} color="#0A192F" />
                        <Text style={s.editActionText}>Edit</Text>
                      </TouchableOpacity>

                      <TouchableOpacity style={s.deleteActionBtn} onPress={() => handleDeleteUser(item)} activeOpacity={0.8}>
                        <Trash2 size={14} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Add / Edit User Modal */}
      <Modal visible={modalVisible} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          <View style={s.modalHeader}>
            <View>
              <Text style={s.modalTitle}>{editingUser ? 'Edit User Account' : `Register New ${roleFilter === 'STUDENT' ? 'Student' : 'Librarian'}`}</Text>
              <Text style={s.modalSub}>Update personal info, role and limits</Text>
            </View>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={{ padding: 6 }}>
              <X size={22} color="#0A192F" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1, padding: 20 }}>
            <View style={{ gap: 14 }}>
              <View>
                <Text style={s.fieldLabel}>First Name *</Text>
                <TextInput style={s.modalInput} value={firstName} onChangeText={setFirstName} placeholder="First Name" placeholderTextColor="#94A3B8" />
              </View>

              <View>
                <Text style={s.fieldLabel}>Last Name *</Text>
                <TextInput style={s.modalInput} value={lastName} onChangeText={setLastName} placeholder="Last Name" placeholderTextColor="#94A3B8" />
              </View>

              <View>
                <Text style={s.fieldLabel}>Email Address *</Text>
                <TextInput style={s.modalInput} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholder="email@university.edu" placeholderTextColor="#94A3B8" />
              </View>

              <View>
                <Text style={s.fieldLabel}>{editingUser ? 'New Password (Leave blank to keep)' : 'Password *'}</Text>
                <TextInput style={s.modalInput} value={password} onChangeText={setPassword} secureTextEntry placeholder="••••••••" placeholderTextColor="#94A3B8" />
              </View>

              <View>
                <Text style={s.fieldLabel}>Student / Staff ID *</Text>
                <TextInput style={s.modalInput} value={studentStaffId} onChangeText={setStudentStaffId} placeholder="e.g. 2024-042" placeholderTextColor="#94A3B8" />
              </View>

              <View>
                <Text style={s.fieldLabel}>Department</Text>
                <TextInput style={s.modalInput} value={department} onChangeText={setDepartment} placeholder="e.g. Computer Science" placeholderTextColor="#94A3B8" />
              </View>

              <View>
                <Text style={s.fieldLabel}>Max Borrowing Limit</Text>
                <TextInput style={s.modalInput} value={borrowingLimit} onChangeText={setBorrowingLimit} keyboardType="number-pad" placeholder="3" placeholderTextColor="#94A3B8" />
              </View>

              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={isSubmitting}>
                {isSubmitting ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>{editingUser ? 'Save Changes' : 'Create Account'}</Text>}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  topFilterBar: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 4 },
  roleSegmentContainer: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 10, padding: 3, gap: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  roleTab: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: 8 },
  roleTabActive: { backgroundColor: '#FFFFFF', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  roleTabText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  roleTabTextActive: { color: '#0A192F', fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  // Action Bar
  actionBar: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 10, gap: 10 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 13 },
  addBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0A192F', height: 46, borderRadius: 8 },
  addBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  emptyBox: { alignItems: 'center', justifyContent: 'center', marginTop: 40, paddingHorizontal: 20 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  emptySub: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 },

  // User Card
  userCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  cardTopRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0A192F', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  userName: { fontSize: 16, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  userSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  userEmail: { fontSize: 11, color: '#94A3B8', marginTop: 1 },

  suspendedBadge: { backgroundColor: '#FEE2E2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  suspendedBadgeText: { color: '#EF4444', fontSize: 10, fontWeight: '700' },

  limitPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  limitPillText: { color: '#64748B', fontSize: 11, fontWeight: '700' },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  cardActionsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusToggleBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  suspendBtn: { backgroundColor: '#FEF2F2' },
  reactivateBtn: { backgroundColor: '#ECFDF5' },
  statusToggleText: { fontSize: 12, fontWeight: '700' },

  editActionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editActionText: { color: '#0A192F', fontSize: 12, fontWeight: '700' },
  deleteActionBtn: { backgroundColor: '#FEF2F2', padding: 8, borderRadius: 8 },

  // Modal
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', backgroundColor: '#FFFFFF' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  modalSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: '#0F172A', marginBottom: 6 },
  saveBtn: { backgroundColor: '#0A192F', height: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginTop: 12 },
  saveBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
