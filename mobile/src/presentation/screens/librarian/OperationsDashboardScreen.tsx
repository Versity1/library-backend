import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { QrCode, Clock, AlertTriangle, ArrowRightLeft, ShieldCheck, ClipboardList, Zap, ArrowDownCircle, BookPlus, Package, AlertCircle, Bell, ArrowRight } from 'lucide-react-native';
import { Transaction, Reservation } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';

interface DashboardProps { 
  onNavigateScanner: () => void; 
  onNavigateReservations: () => void; 
}

export const OperationsDashboardScreen: React.FC<DashboardProps> = ({ onNavigateScanner, onNavigateReservations }) => {
  const [overdueList, setOverdueList] = useState<Transaction[]>([]);
  const [pendingReservations, setPendingReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { 
    fetchData(); 
  }, []);

  const fetchData = async () => { 
    setLoading(true); 
    try { 
      const [rOverdue, rQueue] = await Promise.all([
        apiClient.get(API_ENDPOINTS.TRANSACTIONS.OVERDUE).catch(() => ({ data: [] })),
        apiClient.get(`${API_ENDPOINTS.RESERVATIONS.QUEUE}?status=PENDING`).catch(() => ({ data: [] }))
      ]);
      setOverdueList(rOverdue.data.results || rOverdue.data); 
      setPendingReservations(rQueue.data.results || rQueue.data);
    } catch(e) {} 
    finally { setLoading(false); }
  };

  const handleApprove = async (id: string | number) => {
    try {
      await apiClient.post(API_ENDPOINTS.RESERVATIONS.FULFILL, { reservation_id: id });
      Alert.alert('Success', 'Reservation fulfilled.');
      fetchData();
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to fulfill');
    }
  };

  return (
    <View style={s.bg}>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
        
        {/* Top Stats Grid */}
        <View style={s.gridRow}>
          <View style={s.statCard}>
            <View style={s.statHeader}>
              <Text style={s.statLabel}>DAILY{'\n'}TRANSACTIONS</Text>
              <ArrowRightLeft size={16} color="#059669" />
            </View>
            <View style={s.statValueRow}>
              <Text style={s.statValue}>142</Text>
              <View style={s.greenPill}><Text style={s.greenPillText}>+12%</Text></View>
            </View>
          </View>
          
          <View style={s.statCard}>
            <View style={s.statHeader}>
              <Text style={s.statLabel}>INVENTORY{'\n'}HEALTH</Text>
              <ShieldCheck size={16} color="#1E3A8A" />
            </View>
            <View style={s.statValueRow}>
              <Text style={s.statValue}>98.5%</Text>
              <Text style={s.statSub}>Available</Text>
            </View>
          </View>
        </View>

        <View style={s.gridRow}>
          <View style={s.statCard}>
            <View style={s.statHeader}>
              <Text style={s.statLabel}>PENDING RSRV.</Text>
              <ClipboardList size={16} color="#D97706" />
            </View>
            <View style={s.statValueRow}>
              <Text style={s.statValue}>24</Text>
              <View style={s.brownPill}><Text style={s.brownPillText}>Action Req</Text></View>
            </View>
          </View>
          
          <View style={s.statCard}>
            <View style={s.statHeader}>
              <Text style={s.statLabel}>OVERDUE ITEMS</Text>
              <AlertTriangle size={16} color="#DC2626" />
            </View>
            <View style={s.statValueRow}>
              <Text style={[s.statValue, { color: '#DC2626' }]}>8</Text>
              <Text style={s.statSub}>Books</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={s.sectionTitleRow}>
          <Zap size={18} color="#0F172A" />
          <Text style={s.sectionTitle}>Quick Actions</Text>
        </View>

        <TouchableOpacity style={s.qaCardDark} onPress={onNavigateScanner}>
          <View style={s.qaIconDark}><QrCode size={20} color="#FFF" /></View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={s.qaTitleDark}>Scan QR to Check-out</Text>
            <Text style={s.qaSubDark}>FAST PROCESS</Text>
          </View>
          <ArrowRight size={20} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity style={s.qaCardLight}>
          <View style={s.qaIconLight}><ArrowDownCircle size={20} color="#059669" /></View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={s.qaTitleLight}>Process Return</Text>
            <Text style={s.qaSubLight}>MANUAL ENTRY</Text>
          </View>
          <ArrowRight size={20} color="#059669" />
        </TouchableOpacity>

        <TouchableOpacity style={s.qaCardLight}>
          <View style={s.qaIconLight}><BookPlus size={20} color="#0F172A" /></View>
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Text style={s.qaTitleLight}>Add New Book</Text>
            <Text style={s.qaSubLight}>CATALOGING</Text>
          </View>
          <ArrowRight size={20} color="#0F172A" />
        </TouchableOpacity>

        {/* Pending Reservations */}
        <View style={s.sectionBox}>
          <View style={s.sectionHeader}>
            <View style={s.titleGroup}>
              <Package size={18} color="#0F172A" />
              <Text style={s.sectionTitle}>Pending Reservations</Text>
            </View>
            <TouchableOpacity onPress={onNavigateReservations}>
              <Text style={s.viewAllLink}>View All</Text>
            </TouchableOpacity>
          </View>

          {loading ? <ActivityIndicator color="#0F172A" /> : (
            pendingReservations.slice(0, 2).map((res) => (
              <View key={res.id} style={s.prCard}>
                <View style={s.prImagePlace}>
                  <Text style={s.prImageText}>BOOK</Text>
                </View>
                <View style={s.prDetails}>
                  <Text style={s.prTitle} numberOfLines={1}>{res.book_title}</Text>
                  <Text style={s.prAuthor}>Author Unknown</Text>
                  <View style={s.prMetaRow}>
                    <View style={s.availBadge}><Text style={s.availText}>AVAILABLE</Text></View>
                    <Text style={s.prStudentId}>Student ID: {res.student_staff_id || res.user}</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.approveBtn} onPress={() => handleApprove(res.id)}>
                  <Text style={s.approveText}>Approve</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
          {/* Mock Fallback Data matching Figma */}
          {pendingReservations.length === 0 && !loading && (
            <>
              <View style={s.prCard}>
                <View style={s.prImagePlace}><Text style={s.prImageText}>Book</Text></View>
                <View style={s.prDetails}>
                  <Text style={s.prTitle} numberOfLines={1}>The Structure of Scientific Rev...</Text>
                  <Text style={s.prAuthor}>Thomas S. Kuhn</Text>
                  <View style={s.prMetaRow}>
                    <View style={s.availBadge}><Text style={s.availText}>AVAILABLE</Text></View>
                    <Text style={s.prStudentId}>Student ID: 94821</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.approveBtn}><Text style={s.approveText}>Approve</Text></TouchableOpacity>
              </View>
              <View style={s.prCard}>
                <View style={s.prImagePlace}><Text style={s.prImageText}>Book</Text></View>
                <View style={s.prDetails}>
                  <Text style={s.prTitle} numberOfLines={1}>Data Structures and Algorithms</Text>
                  <Text style={s.prAuthor}>Alfred V. Aho</Text>
                  <View style={s.prMetaRow}>
                    <View style={s.availBadge}><Text style={s.availText}>AVAILABLE</Text></View>
                    <Text style={s.prStudentId}>Student ID: 11024</Text>
                  </View>
                </View>
                <TouchableOpacity style={s.approveBtn}><Text style={s.approveText}>Approve</Text></TouchableOpacity>
              </View>
            </>
          )}
        </View>

        {/* Overdue Tracker */}
        <View style={s.overdueContainer}>
          <View style={s.overdueHeaderRow}>
            <Clock size={18} color="#DC2626" />
            <Text style={s.overdueHeaderTitle}>Overdue Tracker</Text>
          </View>

          <View style={s.overdueInner}>
            {loading ? <ActivityIndicator color="#DC2626" /> : (
              overdueList.slice(0, 1).map((tx) => (
                <View key={tx.id} style={s.odCard}>
                  <View style={s.odAvatar}><Text style={s.odAvatarText}>{tx.user_name?.substring(0, 2).toUpperCase() || 'UN'}</Text></View>
                  <View style={s.odDetails}>
                    <Text style={s.odTitle} numberOfLines={1}>{tx.book_title}</Text>
                    <Text style={s.odBorrower}>{tx.user_name}</Text>
                  </View>
                  <View style={s.odRight}>
                    <View style={s.lateWarning}>
                      <AlertCircle size={12} color="#DC2626" />
                      <Text style={s.lateText}>Late!</Text>
                    </View>
                    <TouchableOpacity style={s.remindBtn}>
                      <Bell size={14} color="#0F172A" />
                      <Text style={s.remindText}>Remind</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
            
            {/* Mock Fallback Data matching Figma */}
            {overdueList.length === 0 && !loading && (
              <View style={s.odCard}>
                <View style={s.odAvatar}><Text style={s.odAvatarText}>JS</Text></View>
                <View style={s.odDetails}>
                  <Text style={s.odTitle} numberOfLines={2}>Introduction to Algorithms</Text>
                  <Text style={s.odBorrower}>John Smith</Text>
                </View>
                <View style={s.odRight}>
                  <View style={s.lateWarning}>
                    <AlertCircle size={14} color="#DC2626" />
                    <Text style={s.lateText}>3 Days Late</Text>
                  </View>
                  <TouchableOpacity style={s.remindBtn}>
                    <Bell size={14} color="#0F172A" />
                    <Text style={s.remindText}>Remind</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>

      </ScrollView>

      <TouchableOpacity style={s.fab} onPress={onNavigateScanner}>
        <QrCode size={24} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  
  gridRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  statCard: { flex: 1, backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  statHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  statLabel: { fontSize: 10, fontWeight: '800', color: '#475569', letterSpacing: 0.5 },
  statValueRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  statValue: { fontSize: 32, fontWeight: '900', color: '#0F172A', lineHeight: 36 },
  statSub: { fontSize: 12, color: '#64748B', marginBottom: 4 },
  greenPill: { backgroundColor: '#A7F3D0', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginBottom: 4 },
  greenPillText: { fontSize: 10, fontWeight: '800', color: '#065F46' },
  brownPill: { backgroundColor: '#78350F', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, marginBottom: 4 },
  brownPillText: { fontSize: 10, fontWeight: '800', color: '#FEF3C7' },

  sectionTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 12, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  viewAllLink: { fontSize: 12, fontWeight: '800', color: '#1E3A8A' },

  qaCardDark: { backgroundColor: '#0A1128', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qaIconDark: { backgroundColor: '#232B45', padding: 12, borderRadius: 999 },
  qaTitleDark: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  qaSubDark: { color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },
  
  qaCardLight: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 16, flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  qaIconLight: { backgroundColor: '#F1F5F9', padding: 12, borderRadius: 999 },
  qaTitleLight: { color: '#0F172A', fontSize: 15, fontWeight: '800' },
  qaSubLight: { color: '#64748B', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 2 },

  sectionBox: { backgroundColor: '#FFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginTop: 12, marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', paddingBottom: 12 },
  titleGroup: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  
  prCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderLeftWidth: 4, borderLeftColor: '#10B981', padding: 12, marginBottom: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', elevation: 1 },
  prImagePlace: { width: 44, height: 60, backgroundColor: '#E2E8F0', borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  prImageText: { fontSize: 8, color: '#94A3B8' },
  prDetails: { flex: 1, paddingLeft: 12 },
  prTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A' },
  prAuthor: { fontSize: 11, color: '#64748B', marginTop: 2, marginBottom: 6 },
  prMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  availBadge: { backgroundColor: '#D1FAE5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  availText: { fontSize: 9, fontWeight: '800', color: '#065F46' },
  prStudentId: { fontSize: 10, color: '#64748B' },
  approveBtn: { backgroundColor: '#0A1128', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  approveText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  overdueContainer: { backgroundColor: '#FEF2F2', borderRadius: 16, borderWidth: 1, borderColor: '#FECACA', overflow: 'hidden' },
  overdueHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 16, borderBottomWidth: 1, borderBottomColor: '#FECACA' },
  overdueHeaderTitle: { fontSize: 16, fontWeight: '800', color: '#DC2626' },
  overdueInner: { padding: 16 },
  
  odCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderLeftWidth: 4, borderLeftColor: '#F59E0B', padding: 16, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  odAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  odAvatarText: { fontSize: 14, fontWeight: '800', color: '#475569' },
  odDetails: { flex: 1, paddingLeft: 12 },
  odTitle: { fontSize: 14, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  odBorrower: { fontSize: 12, color: '#64748B' },
  odRight: { alignItems: 'flex-end', justifyContent: 'center', gap: 8 },
  lateWarning: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  lateText: { fontSize: 12, fontWeight: '800', color: '#DC2626' },
  remindBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFF' },
  remindText: { fontSize: 11, fontWeight: '800', color: '#0F172A' },

  fab: { position: 'absolute', bottom: 24, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#0A1128', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 6 },
});
