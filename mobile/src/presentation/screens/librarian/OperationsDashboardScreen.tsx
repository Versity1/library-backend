import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { QrCode, Clock, AlertCircle } from 'lucide-react-native';
import { Transaction } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Badge } from '../../components/Badge';

interface DashboardProps { onNavigateScanner: () => void; onNavigateReservations: () => void; }

export const OperationsDashboardScreen: React.FC<DashboardProps> = ({ onNavigateScanner, onNavigateReservations }) => {
  const [overdueList, setOverdueList] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchOverdue(); }, []);
  const fetchOverdue = async () => { setLoading(true); try { const r = await apiClient.get(API_ENDPOINTS.TRANSACTIONS.OVERDUE); setOverdueList(r.data.results||r.data); } catch(e){} finally { setLoading(false); }};

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16 }}>
      <Text style={s.sectionLabel}>Quick Operational Actions</Text>
      <View style={s.actionRow}>
        <TouchableOpacity onPress={onNavigateScanner} style={[s.actionCard, { backgroundColor: 'rgba(20,184,166,0.15)', borderColor: 'rgba(20,184,166,0.4)' }]}>
          <View style={[s.actionIcon, { backgroundColor: '#0D9488' }]}><QrCode size={24} color="#FFF" /></View>
          <Text style={s.actionTitle}>Scan QR Code</Text>
          <Text style={[s.actionSub, { color: '#5EEAD4' }]}>Issue / Return Book</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onNavigateReservations} style={[s.actionCard, { backgroundColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.4)' }]}>
          <View style={[s.actionIcon, { backgroundColor: '#3B82F6' }]}><Clock size={24} color="#FFF" /></View>
          <Text style={s.actionTitle}>Hold Queue</Text>
          <Text style={[s.actionSub, { color: '#93C5FD' }]}>Manage Reservations</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.sectionLabel}>Today's Operation Counters</Text>
      <View style={s.metricRow}>
        <View style={s.metricCard}><Text style={s.metricLabel}>Overdue</Text><Text style={[s.metricVal, { color: '#FB7185' }]}>{overdueList.length}</Text></View>
        <View style={s.metricCard}><Text style={s.metricLabel}>Queue</Text><Text style={[s.metricVal, { color: '#FBBF24' }]}>2</Text></View>
        <View style={s.metricCard}><Text style={s.metricLabel}>Returned</Text><Text style={[s.metricVal, { color: '#34D399' }]}>14</Text></View>
      </View>

      <View style={s.overdueHeader}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><AlertCircle size={16} color="#FB7185" /><Text style={s.sectionLabel}>Urgent Overdue Items</Text></View>
        <TouchableOpacity onPress={fetchOverdue}><Text style={s.refreshText}>Refresh</Text></TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#14B8A6" style={{ paddingVertical: 24 }} /> :
        overdueList.map(tx => (
          <View key={tx.id} style={s.overdueCard}>
            <View style={{ flex: 1, paddingRight: 12 }}>
              <Text style={s.overdueTitle}>{tx.book_title}</Text>
              <Text style={s.overdueSub}>Borrower: {tx.user_name} ({tx.student_staff_id})</Text>
              <Text style={s.overdueMeta}>Due: {new Date(tx.due_date).toLocaleDateString()}</Text>
            </View>
            <Badge label="OVERDUE" variant="danger" />
          </View>
        ))
      }
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#020617' },
  sectionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  actionRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionCard: { flex: 1, borderWidth: 1, padding: 16, borderRadius: 16, alignItems: 'center' },
  actionIcon: { padding: 12, borderRadius: 12, marginBottom: 8 },
  actionTitle: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  actionSub: { fontSize: 10, marginTop: 2 },
  metricRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 16, borderRadius: 16 },
  metricLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '600' },
  metricVal: { fontWeight: '900', fontSize: 24, marginTop: 4 },
  overdueHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  refreshText: { color: '#14B8A6', fontSize: 12, fontWeight: '800' },
  overdueCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  overdueTitle: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  overdueSub: { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  overdueMeta: { color: '#64748B', fontSize: 10, marginTop: 4 },
});
