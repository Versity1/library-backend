import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity, TextInput, Platform, RefreshControl, Modal, Alert } from 'react-native';
import { BookOpen, Bookmark, Search, Scan, CreditCard, ExternalLink, ShieldAlert, Clock, Bell, X, RotateCcw, CheckCircle2, ArrowLeft, Calendar, Hash, Info } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/constants/api';
import { Transaction, Reservation, Fine } from '../../../domain/types';
import { useAuth } from '../../context/AuthContext';

const getFullImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

interface StudentBooksScreenProps {
  onNavigateScan?: () => void;
  onNavigateCatalog?: () => void;
  onNavigateFines?: () => void;
}

interface PushNotificationState {
  title: string;
  message: string;
}

export const StudentBooksScreen: React.FC<StudentBooksScreenProps> = ({ 
  onNavigateScan, 
  onNavigateCatalog,
  onNavigateFines 
}) => {
  const { user } = useAuth();
  const [loans, setLoans] = useState<Transaction[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Loan Details Modal & Admin Approval Requests
  const [selectedLoan, setSelectedLoan] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [pushNotification, setPushNotification] = useState<PushNotificationState | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-dismiss push notification banner after 5s
  useEffect(() => {
    if (pushNotification) {
      const timer = setTimeout(() => {
        setPushNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [pushNotification]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, resRes, finesRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.TRANSACTIONS.MY_LOANS),
        apiClient.get(API_ENDPOINTS.RESERVATIONS.MY_RESERVATIONS),
        apiClient.get(API_ENDPOINTS.FINES.MY_FINES)
      ]);

      const extractArray = (data: any): any[] => {
        if (Array.isArray(data)) return data;
        if (Array.isArray(data?.results)) return data.results;
        if (Array.isArray(data?.data)) return data.data;
        return [];
      };

      setLoans(extractArray(loansRes.data));
      setReservations(extractArray(resRes.data));
      setFines(extractArray(finesRes.data));
    } catch (error) {
      console.log('Error fetching books data:', error);
    } finally {
      setLoading(false);
    }
  };

  const showPushNotification = (title: string, message: string) => {
    setPushNotification({ title, message });
  };

  const handleRequestExtension = (loan: Transaction) => {
    Alert.alert(
      'Extend Loan Duration',
      `Submit a request to extend "${loan.book_title}" return due date by 14 days?\n\nNote: Requires Librarian/Admin approval.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Request',
          onPress: async () => {
            setActionLoading('extension');
            try {
              const res = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.RENEW, { transaction_id: loan.id });
              const updatedStatus: Transaction = res.data;
              setLoans(prev => prev.map(l => l.id === loan.id ? updatedStatus : l));
              setSelectedLoan(updatedStatus);
              showPushNotification(
                '🔔 Request Pending Admin Approval',
                `Your extension request for "${loan.book_title}" has been submitted to the Admin.`
              );
            } catch (err: any) {
              Alert.alert('Extension Error', err.response?.data?.error || err.response?.data?.detail || 'Failed to submit extension request.');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  const handleRequestReturn = (loan: Transaction) => {
    Alert.alert(
      'Return Book',
      `Submit a return request for "${loan.book_title}"?\n\nNote: Requires Librarian/Admin verification upon physical return.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Submit Return Request',
          onPress: async () => {
            setActionLoading('return');
            try {
              const res = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.RETURN, { qr_code_id: loan.qr_code_id });
              const updatedStatus: Transaction = res.data;
              setLoans(prev => prev.map(l => l.id === loan.id ? updatedStatus : l));
              setSelectedLoan(updatedStatus);
              showPushNotification(
                '🔔 Return Request Submitted',
                `Your return request for "${loan.book_title}" is pending Admin verification.`
              );
            } catch (err: any) {
              Alert.alert('Return Error', err.response?.data?.error || err.response?.data?.detail || 'Failed to submit return request.');
            } finally {
              setActionLoading(null);
            }
          }
        }
      ]
    );
  };

  // Only show active loans borrowed by the student
  const activeLoans = loans.filter(l => {
    const status = l.status ? String(l.status).toUpperCase() : '';
    const isBorrowed = status === 'BORROWED' || status === 'OVERDUE';
    if (!isBorrowed) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (l.book_title && l.book_title.toLowerCase().includes(q)) ||
      (l.author && l.author.toLowerCase().includes(q)) ||
      (l.isbn && l.isbn.toLowerCase().includes(q))
    );
  });
  const activeReservations = reservations.filter(r => r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP');
  const totalFines = fines.reduce((sum, f) => sum + (f.status === 'UNPAID' ? Number(f.amount) : 0), 0);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  if (loading) {
    return (
      <View style={[s.bg, s.center]}>
        <ActivityIndicator size="large" color="#0A192F" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      
      {/* Realtime In-App Push Notification Banner */}
      {pushNotification && (
        <View style={s.pushNotificationBanner}>
          <Bell size={22} color="#14B8A6" style={{ marginRight: 12 }} />
          <View style={{ flex: 1 }}>
            <Text style={s.pushTitle}>{pushNotification.title}</Text>
            <Text style={s.pushMessage}>{pushNotification.message}</Text>
          </View>
          <TouchableOpacity onPress={() => setPushNotification(null)} style={{ padding: 4 }}>
            <X size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      )}

      <ScrollView 
        style={s.bg} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A192F']} tintColor="#0A192F" />}
      >
        
        {/* Welcome & Search Card */}
        <View style={s.welcomeCard}>
          <Text style={s.welcomeTitle}>Welcome back, {user?.first_name || 'Alex'}.</Text>
          <Text style={s.welcomeSub}>Your academic journey continues. Manage your active library loans below.</Text>

          <View style={s.searchBox}>
            <Search size={18} color="#94A3B8" style={{ marginRight: 8 }} />
            <TextInput 
              style={s.searchInput}
              placeholder="Search by ISBN, Title, Author..."
              placeholderTextColor="#94A3B8"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          <TouchableOpacity onPress={onNavigateScan} style={s.scanBtn} activeOpacity={0.8}>
            <Scan size={18} color="#FFF" style={{ marginRight: 8 }} />
            <Text style={s.scanBtnText}>Scan QR Code</Text>
          </TouchableOpacity>
        </View>

        {/* Stat Grid */}
        <View style={s.statGrid}>
          <View style={s.statCard}>
            <BookOpen size={24} color="#16A34A" style={{ marginBottom: 12 }} />
            <Text style={s.statNumber}>{activeLoans.length}</Text>
            <Text style={s.statLabel}>Active Borrows</Text>
          </View>

          <View style={s.statCard}>
            <Bookmark size={24} color="#4F46E5" style={{ marginBottom: 12 }} />
            <Text style={s.statNumber}>{activeReservations.length}</Text>
            <Text style={s.statLabel}>Reservations</Text>
          </View>
        </View>

        {/* Current Fines Card */}
        <TouchableOpacity style={s.finesCard} onPress={onNavigateFines}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <CreditCard size={20} color="#64748B" />
            <Text style={s.finesLabel}>Current Fines</Text>
          </View>
          <Text style={s.finesValue}>₦{totalFines.toFixed(2)}</Text>
        </TouchableOpacity>

        {/* Currently Borrowed Section Header */}
        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>Currently Borrowed</Text>
          {onNavigateCatalog && (
            <TouchableOpacity onPress={onNavigateCatalog}>
              <Text style={s.viewAllText}>Browse Catalog</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Currently Borrowed Cards List */}
        {activeLoans.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingRight: 16, paddingBottom: 8 }}>
            {activeLoans.map(item => (
              <TouchableOpacity key={item.id} onPress={() => setSelectedLoan(item)} style={s.borrowCard} activeOpacity={0.85}>
                <View style={s.coverWrapper}>
                  <Image source={{ uri: getFullImageUrl(item.cover_image_url) || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop' }} style={s.borrowCover} resizeMode="cover" />
                  
                  {/* Status Badges */}
                  {item.request_status === 'PENDING_EXTENSION' || item.request_status === 'PENDING_RETURN' ? (
                    <View style={[s.statusPillBadge, { backgroundColor: '#FEF3C7' }]}>
                      <Text style={[s.statusPillText, { color: '#D97706' }]}>⏳ Pending Approval</Text>
                    </View>
                  ) : item.status === 'OVERDUE' ? (
                    <View style={[s.statusPillBadge, { backgroundColor: '#FEE2E2' }]}>
                      <Text style={[s.statusPillText, { color: '#DC2626' }]}>⚠️ Overdue</Text>
                    </View>
                  ) : (
                    <View style={[s.statusPillBadge, { backgroundColor: '#DCFCE7' }]}>
                      <Text style={[s.statusPillText, { color: '#15803D' }]}>Active Loan</Text>
                    </View>
                  )}
                </View>

                <View style={s.borrowInfoBox}>
                  <Text style={s.borrowTitle} numberOfLines={1}>{item.book_title}</Text>
                  <Text style={s.borrowAuthor} numberOfLines={1}>{item.author}</Text>
                  
                  <View style={s.borrowFooterRow}>
                    <Text style={s.dueLabelText}>Due: {item.due_date ? new Date(item.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'N/A'}</Text>
                    <View style={s.tapPillBtn}>
                      <Text style={s.tapPillText}>Details</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          /* Empty State if student has no borrowed books */
          <View style={s.emptyBorrowCard}>
            <BookOpen size={36} color="#CBD5E1" style={{ marginBottom: 8 }} />
            <Text style={s.emptyBorrowTitle}>No Borrowed Books</Text>
            <Text style={s.emptyBorrowSub}>You currently have no books checked out. Explore the catalog to borrow books.</Text>
            {onNavigateCatalog && (
              <TouchableOpacity onPress={onNavigateCatalog} style={s.browseBtn} activeOpacity={0.8}>
                <Text style={s.browseBtnText}>Browse Catalog</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

      </ScrollView>

      {/* Borrowing Details & Request Modal */}
      {selectedLoan && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalHeaderBar}>
              <TouchableOpacity onPress={() => setSelectedLoan(null)} style={s.backBar} activeOpacity={0.7}>
                <ArrowLeft size={20} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={s.backBarText}>Back to My Books</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.modalScrollContent}>
              {/* Cover Photo */}
              <View style={s.modalCoverCard}>
                <Image 
                  source={{ uri: getFullImageUrl(selectedLoan.cover_image_url) || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop' }} 
                  style={s.modalCoverImage} 
                  resizeMode="cover"
                />
              </View>

              {/* Book Metadata */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.modalBookTitle}>{selectedLoan.book_title}</Text>
                <Text style={s.modalBookAuthor}>by {selectedLoan.author}</Text>
              </View>

              {/* Realtime Request Tracker Banner */}
              <View style={s.realtimeTrackerCard}>
                <Text style={s.trackerHeader}>Realtime Approval Status Tracker</Text>
                
                {selectedLoan.request_status === 'PENDING_EXTENSION' ? (
                  <View style={[s.trackerStatusBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Clock size={18} color="#D97706" style={{ marginRight: 8 }} />
                    <Text style={[s.trackerStatusText, { color: '#B45309' }]}>
                      ⏳ Extension Requested — Pending Admin Approval
                    </Text>
                  </View>
                ) : selectedLoan.request_status === 'PENDING_RETURN' ? (
                  <View style={[s.trackerStatusBadge, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                    <Clock size={18} color="#D97706" style={{ marginRight: 8 }} />
                    <Text style={[s.trackerStatusText, { color: '#B45309' }]}>
                      ⏳ Return Requested — Pending Admin Approval
                    </Text>
                  </View>
                ) : selectedLoan.request_status === 'APPROVED' ? (
                  <View style={[s.trackerStatusBadge, { backgroundColor: '#DCFCE7', borderColor: '#22C55E' }]}>
                    <CheckCircle2 size={18} color="#15803D" style={{ marginRight: 8 }} />
                    <Text style={[s.trackerStatusText, { color: '#15803D' }]}>
                      ✅ Request Approved by Librarian
                    </Text>
                  </View>
                ) : selectedLoan.request_status === 'REJECTED' ? (
                  <View style={[s.trackerStatusBadge, { backgroundColor: '#FEE2E2', borderColor: '#EF4444' }]}>
                    <ShieldAlert size={18} color="#DC2626" style={{ marginRight: 8 }} />
                    <Text style={[s.trackerStatusText, { color: '#DC2626' }]}>
                      ❌ Request Declined by Librarian
                    </Text>
                  </View>
                ) : (
                  <View style={[s.trackerStatusBadge, { backgroundColor: '#EFF6FF', borderColor: '#3B82F6' }]}>
                    <CheckCircle2 size={18} color="#2563EB" style={{ marginRight: 8 }} />
                    <Text style={[s.trackerStatusText, { color: '#1D4ED8' }]}>
                      🟢 Active Loan — No Pending Requests
                    </Text>
                  </View>
                )}
              </View>

              {/* Borrowing Timeline Metadata */}
              <View style={s.metaGrid}>
                <View style={s.metaCard}>
                  <Calendar size={16} color="#3B82F6" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>Issue Date</Text>
                  <Text style={s.metaValue}>
                    {selectedLoan.issue_date ? new Date(selectedLoan.issue_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </Text>
                </View>

                <View style={s.metaCard}>
                  <Clock size={16} color="#EAB308" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>Due Date</Text>
                  <Text style={s.metaValue}>
                    {selectedLoan.due_date ? new Date(selectedLoan.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                  </Text>
                </View>

                <View style={s.metaCard}>
                  <Hash size={16} color="#8B5CF6" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>Copy QR Code</Text>
                  <Text style={s.metaValue} numberOfLines={1}>{selectedLoan.qr_code_id || `QR-${selectedLoan.id}`}</Text>
                </View>

                <View style={s.metaCard}>
                  <Info size={16} color="#14B8A6" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>Loan Status</Text>
                  <Text style={[s.metaValue, { color: selectedLoan.status === 'OVERDUE' ? '#DC2626' : '#15803D' }]}>
                    {selectedLoan.status}
                  </Text>
                </View>
              </View>

              {/* Call to Actions (Require Admin Approval) */}
              <View style={s.ctaSection}>
                <Text style={s.ctaSectionHeader}>Borrowing Actions (Requires Admin Approval)</Text>

                {/* Extend Return Date (Renew) CTA */}
                <TouchableOpacity 
                  onPress={() => handleRequestExtension(selectedLoan)} 
                  disabled={actionLoading === 'extension' || selectedLoan.request_status === 'PENDING_EXTENSION'} 
                  style={[
                    s.actionBtnSecondary, 
                    selectedLoan.request_status === 'PENDING_EXTENSION' && { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }
                  ]} 
                  activeOpacity={0.85}
                >
                  {actionLoading === 'extension' ? (
                    <ActivityIndicator color="#0A192F" />
                  ) : (
                    <>
                      <RotateCcw size={18} color={selectedLoan.request_status === 'PENDING_EXTENSION' ? '#B45309' : '#0A192F'} style={{ marginRight: 8 }} />
                      <Text style={[s.actionBtnSecondaryText, selectedLoan.request_status === 'PENDING_EXTENSION' && { color: '#B45309' }]}>
                        {selectedLoan.request_status === 'PENDING_EXTENSION' ? 'Extension Request Pending' : 'Extend Return Date (Renew)'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {/* Return Book CTA */}
                <TouchableOpacity 
                  onPress={() => handleRequestReturn(selectedLoan)} 
                  disabled={actionLoading === 'return' || selectedLoan.request_status === 'PENDING_RETURN'} 
                  style={[
                    s.actionBtnPrimary, 
                    { backgroundColor: '#3B82F6' },
                    selectedLoan.request_status === 'PENDING_RETURN' && { backgroundColor: '#F59E0B' }
                  ]} 
                  activeOpacity={0.85}
                >
                  {actionLoading === 'return' ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <CheckCircle2 size={18} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={s.actionBtnText}>
                        {selectedLoan.request_status === 'PENDING_RETURN' ? 'Return Pending Verification' : 'Return Book'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </Modal>
      )}

    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Push Notification Banner
  pushNotificationBanner: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0A192F', paddingHorizontal: 16, paddingVertical: 12, marginHorizontal: 16, marginTop: 12, borderRadius: 10, borderWidth: 1, borderColor: '#14B8A6', zIndex: 100 },
  pushTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  pushMessage: { color: '#CBD5E1', fontSize: 12, marginTop: 2 },

  // Welcome Card
  welcomeCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 20, marginBottom: 16, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  welcomeTitle: { color: '#0A192F', fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 6 },
  welcomeSub: { color: '#475569', fontSize: 13, lineHeight: 18, marginBottom: 16 },

  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6, paddingHorizontal: 12, height: 42, marginBottom: 12 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 13 },

  scanBtn: { flexDirection: 'row', backgroundColor: '#0A192F', height: 44, borderRadius: 6, alignItems: 'center', justifyContent: 'center' },
  scanBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  // Stat Grid
  statGrid: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, alignItems: 'center', justifyContent: 'center' },
  statNumber: { color: '#0A192F', fontSize: 28, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 4 },
  statLabel: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  // Fines Card
  finesCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 14, alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  finesLabel: { color: '#0F172A', fontSize: 14, fontWeight: '600' },
  finesValue: { color: '#0F172A', fontSize: 16, fontWeight: '700' },

  // Section Headers
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { color: '#0A192F', fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  viewAllText: { color: '#0A192F', fontSize: 13, fontWeight: '700' },

  // Borrowed Book Cards
  borrowCard: { width: 220, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden' },
  coverWrapper: { width: '100%', height: 140, backgroundColor: '#F1F5F9', position: 'relative' },
  borrowCover: { width: '100%', height: '100%' },
  statusPillBadge: { position: 'absolute', top: 8, right: 8, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  statusPillText: { fontSize: 10, fontWeight: '700' },

  borrowInfoBox: { padding: 12 },
  borrowTitle: { color: '#0A192F', fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 2 },
  borrowAuthor: { color: '#64748B', fontSize: 12, marginBottom: 12 },
  borrowFooterRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dueLabelText: { color: '#475569', fontSize: 11, fontWeight: '600' },
  tapPillBtn: { backgroundColor: '#0A192F', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 6 },
  tapPillText: { color: '#FFFFFF', fontSize: 11, fontWeight: '600' },

  // Empty State Card
  emptyBorrowCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyBorrowTitle: { color: '#0A192F', fontSize: 16, fontWeight: '700', marginBottom: 4 },
  emptyBorrowSub: { color: '#64748B', fontSize: 13, textAlign: 'center', marginBottom: 16 },
  browseBtn: { backgroundColor: '#0A192F', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
  browseBtnText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeaderBar: { backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 44 : 16, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },

  backBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  backBarText: { color: '#0F172A', fontSize: 15, fontWeight: '700' },

  modalCoverCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 20, height: 320 },
  modalCoverImage: { width: '75%', height: '100%', borderRadius: 8 },

  modalBookTitle: { color: '#0A192F', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 28, marginBottom: 4 },
  modalBookAuthor: { color: '#64748B', fontSize: 14, fontWeight: '600' },

  realtimeTrackerCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 14, marginBottom: 20 },
  trackerHeader: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  trackerStatusBadge: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10, borderRadius: 8 },
  trackerStatusText: { fontSize: 13, fontWeight: '700', flex: 1 },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  metaCard: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 },
  metaLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { color: '#0A192F', fontSize: 13, fontWeight: '700' },

  ctaSection: { gap: 12, marginBottom: 32 },
  ctaSectionHeader: { color: '#0A192F', fontSize: 14, fontWeight: '700', marginBottom: 4 },
  actionBtnPrimary: { flexDirection: 'row', backgroundColor: '#0A192F', height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  actionBtnSecondary: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnSecondaryText: { color: '#0A192F', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
