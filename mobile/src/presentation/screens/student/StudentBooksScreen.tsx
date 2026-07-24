import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Image, TouchableOpacity } from 'react-native';
import { BookOpen, Bookmark, Clock, AlertCircle, CheckCircle2, RotateCw } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Transaction, Reservation, Fine } from '../../../domain/types';

type ActivityItem = {
  id: string;
  type: 'LOAN' | 'RESERVATION' | 'FINE';
  date: Date;
  title: string;
  description: string;
  status: string;
};

export const StudentBooksScreen: React.FC = () => {
  const [loans, setLoans] = useState<Transaction[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [loansRes, resRes, finesRes] = await Promise.all([
        apiClient.get(API_ENDPOINTS.TRANSACTIONS.MY_LOANS),
        apiClient.get(API_ENDPOINTS.RESERVATIONS.MY_RESERVATIONS),
        apiClient.get(API_ENDPOINTS.FINES.MY_FINES)
      ]);
      setLoans(loansRes.data.results || loansRes.data);
      setReservations(resRes.data.results || resRes.data);
      setFines(finesRes.data.results || finesRes.data);
    } catch (error) {
      console.log('Error fetching books data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (transactionId: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.TRANSACTIONS.RENEW, { transaction_id: transactionId });
      alert('Book renewed successfully!');
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.error || 'Failed to renew book');
    }
  };

  const activeLoans = loans.filter(l => l.status === 'BORROWED' || l.status === 'OVERDUE');
  const activeReservations = reservations.filter(r => r.status === 'PENDING' || r.status === 'READY_FOR_PICKUP');
  
  // Find the last returned book to ask if they want to continue reading
  const returnedLoans = loans.filter(l => l.status === 'RETURNED').sort((a, b) => {
    const timeA = new Date(a.return_date || a.issue_date).getTime();
    const timeB = new Date(b.return_date || b.issue_date).getTime();
    return timeB - timeA;
  });
  const recentlyRead = returnedLoans.length > 0 ? returnedLoans[0] : null;

  // Combine all activities and sort by date descending
  const activities: ActivityItem[] = [
    ...loans.map(l => ({
      id: `loan_${l.id}`,
      type: 'LOAN' as const,
      date: new Date(l.issue_date),
      title: l.book_title,
      description: l.status === 'RETURNED' ? 'Book returned' : l.status === 'OVERDUE' ? 'Book overdue' : 'Book borrowed',
      status: l.status,
    })),
    ...reservations.map(r => ({
      id: `res_${r.id}`,
      type: 'RESERVATION' as const,
      date: new Date(r.created_at),
      title: r.book_title,
      description: `Reservation ${r.status.toLowerCase().replace(/_/g, ' ')}`,
      status: r.status,
    })),
    ...fines.map(f => ({
      id: `fine_${f.id}`,
      type: 'FINE' as const,
      date: new Date(f.created_at),
      title: f.book_title,
      description: `Fine assessed: $${f.amount}`,
      status: f.status,
    }))
  ].sort((a, b) => b.date.getTime() - a.date.getTime());

  if (loading) {
    return (
      <View style={[s.bg, s.center]}>
        <ActivityIndicator size="large" color="#14B8A6" />
      </View>
    );
  }

  const renderProgressBar = (issueDate: string, dueDate: string) => {
    const start = new Date(issueDate).getTime();
    const end = new Date(dueDate).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    let pct = Math.max(0, Math.min(100, (elapsed / total) * 100));
    return (
      <View style={s.progressBarBg}>
        <View style={[s.progressBarFill, { width: `${pct}%`, backgroundColor: pct > 90 ? '#EF4444' : '#1E1B4B' }]} />
      </View>
    );
  };

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      
      {/* Recently Read / Continue Reading */}
      {recentlyRead && (
        <View style={s.recentBox}>
          <Text style={s.recentTitle}>Continue Reading?</Text>
          <Text style={s.recentSub}>You read this on your last visit.</Text>
          <View style={[s.card, { marginTop: 12, borderColor: '#14B8A6', backgroundColor: '#F0FDFA' }]}>
            <View style={s.cardCoverBox}>
              {recentlyRead.cover_image_url ? (
                <Image source={{ uri: recentlyRead.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <BookOpen size={24} color="#94A3B8" />
              )}
            </View>
            <View style={{ flex: 1, paddingLeft: 16, justifyContent: 'center' }}>
              <Text style={s.cardTitle} numberOfLines={1}>{recentlyRead.book_title}</Text>
              <Text style={s.cardAuthor}>{recentlyRead.author}</Text>
              
              <TouchableOpacity style={s.findBtn}>
                <Text style={s.findBtnText}>Find Book Location</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Active Borrowings */}
      <View style={s.sectionHeader}>
        <Text style={s.sectionTitle}>Active Borrowings ({activeLoans.length})</Text>
      </View>
      {activeLoans.length === 0 ? (
        <View style={s.emptyBox}><Text style={s.emptyText}>No active borrowings.</Text></View>
      ) : (
        <View style={s.listGap}>
          {activeLoans.map(loan => (
            <View key={loan.id} style={s.card}>
              <View style={s.cardCoverBox}>
                {loan.cover_image_url ? (
                  <Image source={{ uri: loan.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <BookOpen size={24} color="#94A3B8" />
                )}
              </View>
              <View style={{ flex: 1, paddingLeft: 16 }}>
                <Text style={s.cardTitle} numberOfLines={1}>{loan.book_title}</Text>
                <Text style={s.cardAuthor}>{loan.author}</Text>
                
                {loan.renewed_count > 0 && (
                  <View style={s.renewBadge}>
                    <RotateCw size={10} color="#0369A1" />
                    <Text style={s.renewText}>Renewed x{loan.renewed_count}</Text>
                  </View>
                )}

                <View style={{ marginTop: 12 }}>
                  <View style={s.progressMeta}>
                    <Text style={[s.dueText, loan.status === 'OVERDUE' && { color: '#EF4444' }]}>
                      {loan.status === 'OVERDUE' ? 'OVERDUE' : `Due ${new Date(loan.due_date).toLocaleDateString()}`}
                    </Text>
                  </View>
                  {renderProgressBar(loan.issue_date, loan.due_date)}
                </View>

                {loan.status === 'BORROWED' && loan.renewed_count < 2 && (
                  <TouchableOpacity onPress={() => handleRenew(loan.id)} style={s.renewActionBtn}>
                    <RotateCw size={14} color="#FFF" />
                    <Text style={s.renewActionText}>Renew</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Borrow Requests */}
      <View style={[s.sectionHeader, { marginTop: 24 }]}>
        <Text style={s.sectionTitle}>Borrow Requests ({activeReservations.length})</Text>
      </View>
      {activeReservations.length === 0 ? (
        <View style={s.emptyBox}><Text style={s.emptyText}>No active requests.</Text></View>
      ) : (
        <View style={s.listGap}>
          {activeReservations.map(res => (
            <View key={res.id} style={s.reqCard}>
              <View style={s.reqHeader}>
                <Bookmark size={18} color="#0F172A" />
                <View style={[s.statusBadge, { backgroundColor: res.status === 'READY_FOR_PICKUP' ? '#D1FAE5' : '#F1F5F9' }]}>
                  <Text style={[s.statusBadgeText, { color: res.status === 'READY_FOR_PICKUP' ? '#065F46' : '#475569' }]}>
                    {res.status.replace(/_/g, ' ')}
                  </Text>
                </View>
              </View>
              <Text style={s.cardTitle} numberOfLines={1}>{res.book_title}</Text>
              <Text style={s.cardAuthor}>Queue Position: #{res.queue_position}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Activity Log */}
      <View style={[s.sectionHeader, { marginTop: 24 }]}>
        <Text style={s.sectionTitle}>Activity Log</Text>
      </View>
      {activities.length === 0 ? (
        <View style={s.emptyBox}><Text style={s.emptyText}>No recent activity.</Text></View>
      ) : (
        <View style={s.timeline}>
          {activities.slice(0, 10).map((act, idx) => (
            <View key={act.id} style={s.timelineItem}>
              <View style={s.timelineIconWrap}>
                {act.type === 'LOAN' ? <BookOpen size={14} color="#64748B" /> :
                 act.type === 'RESERVATION' ? <Bookmark size={14} color="#64748B" /> :
                 <AlertCircle size={14} color="#EF4444" />}
              </View>
              <View style={s.timelineContent}>
                <Text style={s.timelineTitle} numberOfLines={1}>{act.title}</Text>
                <View style={s.timelineMetaRow}>
                  <Text style={s.timelineDesc}>{act.description}</Text>
                  <Text style={s.timelineDate}>{act.date.toLocaleDateString()}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { alignItems: 'center', justifyContent: 'center' },
  sectionHeader: { marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  emptyBox: { backgroundColor: '#F1F5F9', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0', borderStyle: 'dashed' },
  emptyText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  listGap: { gap: 12 },
  
  card: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, flexDirection: 'row', borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardCoverBox: { width: 70, height: 100, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardAuthor: { fontSize: 13, color: '#64748B' },
  renewBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E0F2FE', alignSelf: 'flex-start', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginTop: 8 },
  renewText: { fontSize: 10, color: '#0369A1', fontWeight: '700' },
  
  progressMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dueText: { fontSize: 11, color: '#475569', fontWeight: '700' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 999 },
  progressBarFill: { height: 6, borderRadius: 999 },

  reqCard: { backgroundColor: '#FFF', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#E2E8F0' },
  reqHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },

  timeline: { paddingLeft: 8 },
  timelineItem: { flexDirection: 'row', gap: 16, marginBottom: 20 },
  timelineIconWrap: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E2E8F0', zIndex: 1 },
  timelineContent: { flex: 1, paddingTop: 4 },
  timelineTitle: { fontSize: 14, fontWeight: '700', color: '#0F172A', marginBottom: 2 },
  timelineMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timelineDesc: { fontSize: 12, color: '#64748B' },
  timelineDate: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  
  recentBox: { marginBottom: 32, padding: 16, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', elevation: 2, shadowColor: '#0F172A', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 12 },
  recentTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  recentSub: { fontSize: 13, color: '#64748B', marginTop: 4 },
  findBtn: { backgroundColor: '#14B8A6', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, marginTop: 12 },
  findBtnText: { color: '#FFF', fontSize: 12, fontWeight: '800' },

  renewActionBtn: { backgroundColor: '#14B8A6', flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6, marginTop: 12 },
  renewActionText: { color: '#FFF', fontSize: 12, fontWeight: '700' },
});
