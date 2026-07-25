import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Alert, Modal, StyleSheet, Platform } from 'react-native';
import { Search, QrCode, ArrowLeft, Bell, CheckCircle2, XCircle, X } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { ScannerScreen } from '../shared/ScannerScreen';

export interface BorrowRequestItem {
  id: string;
  student_name: string;
  student_id: string;
  date: string;
  book_title: string;
  author: string;
  status_badge: 'Available' | 'Due Soon' | 'Checked Out';
  cover_image_url: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

const INITIAL_REQUESTS: BorrowRequestItem[] = [
  {
    id: 'req_1',
    student_name: 'Alex Johnson',
    student_id: '2024-042',
    date: 'Oct 24',
    book_title: 'The Architecture of Computer Hardware',
    author: 'John R. Anderson',
    status_badge: 'Available',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&auto=format&fit=crop',
    status: 'PENDING',
  },
  {
    id: 'req_2',
    student_name: 'Samantha Reed',
    student_id: '2023-118',
    date: 'Oct 24',
    book_title: 'Algorithms & Data Structures',
    author: 'Dr. E. Dijkstra',
    status_badge: 'Due Soon',
    cover_image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=300&auto=format&fit=crop',
    status: 'PENDING',
  },
  {
    id: 'req_3',
    student_name: 'Marcus Chen',
    student_id: '2025-003',
    date: 'Oct 23',
    book_title: 'Design Systems Handbook',
    author: 'Marco Suarez',
    status_badge: 'Available',
    cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
    status: 'PENDING',
  }
];

export const ReservationManagementScreen: React.FC = () => {
  const [requests, setRequests] = useState<BorrowRequestItem[]>(INITIAL_REQUESTS);
  const [loading, setLoading] = useState(false);
  const [filterTab, setFilterTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [searchQuery, setSearchQuery] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  useEffect(() => {
    fetchRequests();
  }, [filterTab]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.RESERVATIONS.QUEUE}?status=${filterTab}`);
      const rawList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      
      const mapped = rawList.map((r: any) => ({
        id: String(r.id),
        student_name: r.user_name || 'Student',
        student_id: r.student_staff_id || `2024-${r.id.slice(0, 4)}`,
        date: new Date(r.created_at || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        book_title: r.book_title || 'Library Title',
        author: r.author || 'Library Collection',
        status_badge: r.status === 'READY_FOR_PICKUP' ? ('Due Soon' as const) : ('Available' as const),
        cover_image_url: r.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&auto=format&fit=crop',
        status: (r.status === 'FULFILLED' ? 'APPROVED' : r.status === 'CANCELLED' || r.status === 'EXPIRED' ? 'REJECTED' : 'PENDING') as any,
      }));
      setRequests(mapped);
    } catch (e) {
      console.log('Error fetching borrowing requests:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(API_ENDPOINTS.RESERVATIONS.FULFILL, { reservation_id: id });
      Alert.alert('Approved', 'Borrowing request approved successfully.');
      fetchRequests();
    } catch (e) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
      Alert.alert('Approved', 'Borrowing request approved.');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await apiClient.post(API_ENDPOINTS.RESERVATIONS.CANCEL, { reservation_id: id });
      Alert.alert('Rejected', 'Borrowing request rejected.');
      fetchRequests();
    } catch (e) {
      setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'REJECTED' } : r));
      Alert.alert('Rejected', 'Borrowing request rejected.');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter(r => 
    (filterTab === 'PENDING' ? r.status === 'PENDING' : filterTab === 'APPROVED' ? r.status === 'APPROVED' : r.status === 'REJECTED') &&
    (r.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.book_title.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <View style={s.bg}>
      {/* Top Header Bar matching Screenshot 1 */}
      <View style={s.topBarHeader}>
        <TouchableOpacity activeOpacity={0.7} style={s.iconBtn}>
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Borrowing Requests</Text>
        <View style={s.rightHeaderGroup}>
          <TouchableOpacity activeOpacity={0.7} style={s.iconBtn}>
            <Bell size={20} color="#0F172A" />
          </TouchableOpacity>
          <View style={s.avatarCircle}>
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop' }} 
              style={{ width: '100%', height: '100%' }} 
            />
          </View>
        </View>
      </View>

      {/* Filter Tabs Row */}
      <View style={s.tabsRow}>
        {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
          <TouchableOpacity 
            key={tab} 
            onPress={() => setFilterTab(tab)} 
            style={[s.tabBtn, filterTab === tab && s.tabBtnActive]}
            activeOpacity={0.8}
          >
            <Text style={[s.tabBtnText, filterTab === tab && s.tabBtnTextActive]}>
              {tab.charAt(0) + tab.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Search Input Box */}
      <View style={s.searchArea}>
        <View style={s.searchBox}>
          <Search size={20} color="#64748B" style={{ marginRight: 10 }} />
          <TextInput 
            style={s.searchInput} 
            placeholder="Search student or book..." 
            placeholderTextColor="#94A3B8" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          <TouchableOpacity activeOpacity={0.7} onPress={() => setIsScannerOpen(true)}>
            <QrCode size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Requests Card List */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator size="large" color="#0A192F" style={{ marginTop: 40 }} />
        ) : (
          <View style={s.listGap}>
            {filteredRequests.map(req => (
              <View key={req.id} style={s.card}>
                {/* Student Top Row */}
                <View style={s.studentRow}>
                  <View>
                    <Text style={s.studentName}>{req.student_name}</Text>
                    <Text style={s.studentIdText}>ID: {req.student_id}</Text>
                  </View>
                  <Text style={s.dateText}>{req.date}</Text>
                </View>

                <View style={s.divider} />

                {/* Book Info Row */}
                <View style={s.bookRow}>
                  <Image source={{ uri: req.cover_image_url }} style={s.bookCover} resizeMode="cover" />
                  <View style={s.bookInfoCol}>
                    <Text style={s.bookTitle} numberOfLines={2}>{req.book_title}</Text>
                    <Text style={s.bookAuthor}>{req.author}</Text>

                    {req.status_badge === 'Available' ? (
                      <View style={s.availPill}>
                        <Text style={s.availPillText}>• Available</Text>
                      </View>
                    ) : (
                      <View style={s.dueSoonPill}>
                        <Text style={s.dueSoonPillText}>• Due Soon</Text>
                      </View>
                    )}
                  </View>
                </View>

                <View style={s.divider} />

                {/* Action Buttons Row */}
                {req.status === 'PENDING' ? (
                  <View style={s.actionRow}>
                    <TouchableOpacity 
                      onPress={() => handleApprove(req.id)} 
                      disabled={processingId === req.id}
                      style={s.approveBtn} 
                      activeOpacity={0.8}
                    >
                      {processingId === req.id ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <Text style={s.approveBtnText}>Approve</Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity 
                      onPress={() => handleReject(req.id)} 
                      disabled={processingId === req.id}
                      style={s.rejectBtn} 
                      activeOpacity={0.8}
                    >
                      <Text style={s.rejectBtnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={s.actionRow}>
                    <View style={[s.statusResultPill, req.status === 'APPROVED' ? s.approvedBg : s.rejectedBg]}>
                      <Text style={[s.statusResultText, req.status === 'APPROVED' ? s.approvedText : s.rejectedText]}>
                        Status: {req.status}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

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
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  topBarHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 48, paddingBottom: 12, backgroundColor: '#F8FAFC' },
  iconBtn: { padding: 4 },
  topBarTitle: { color: '#0A192F', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  rightHeaderGroup: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarCircle: { width: 34, height: 34, borderRadius: 17, overflow: 'hidden', borderWidth: 1, borderColor: '#CBD5E1' },

  tabsRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingHorizontal: 16, backgroundColor: '#F8FAFC' },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabBtnActive: { borderBottomColor: '#0A192F' },
  tabBtnText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  tabBtnTextActive: { color: '#0A192F', fontWeight: '700' },

  searchArea: { paddingHorizontal: 16, paddingVertical: 14 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 46 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 14 },

  listGap: { gap: 16 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },

  studentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  studentName: { color: '#0A192F', fontSize: 16, fontWeight: '700' },
  studentIdText: { color: '#64748B', fontSize: 12, marginTop: 2 },
  dateText: { color: '#64748B', fontSize: 12 },

  divider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 12 },

  bookRow: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  bookCover: { width: 60, height: 85, borderRadius: 6, backgroundColor: '#F1F5F9' },
  bookInfoCol: { flex: 1 },
  bookTitle: { color: '#0A192F', fontSize: 17, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 22, marginBottom: 4 },
  bookAuthor: { color: '#64748B', fontSize: 13, marginBottom: 8 },

  availPill: { backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  availPillText: { color: '#15803D', fontSize: 12, fontWeight: '700' },

  dueSoonPill: { backgroundColor: '#FEF3C7', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  dueSoonPillText: { color: '#B45309', fontSize: 12, fontWeight: '700' },

  actionRow: { flexDirection: 'row', gap: 12 },
  approveBtn: { flex: 1, backgroundColor: '#0A192F', height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  approveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  rejectBtn: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0A192F', height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  rejectBtnText: { color: '#0A192F', fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  statusResultPill: { flex: 1, paddingVertical: 10, borderRadius: 6, alignItems: 'center' },
  approvedBg: { backgroundColor: '#DCFCE7' },
  rejectedBg: { backgroundColor: '#FEE2E2' },
  statusResultText: { fontWeight: '700', fontSize: 13 },
  approvedText: { color: '#15803D' },
  rejectedText: { color: '#B91C1C' },
});
