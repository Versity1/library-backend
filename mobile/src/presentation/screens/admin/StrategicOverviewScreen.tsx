import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { TrendingUp, Users, BookOpen, AlertTriangle, ArrowUpRight, ArrowDownRight } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Badge } from '../../components/Badge';

interface AnalyticsData { active_users: number; total_books: number; books_in_circulation: number; active_reservations: number; total_fines_collected: number; overdue_items: number; recent_transactions: any[]; }

export const StrategicOverviewScreen: React.FC = () => {
  const [data, setData] = useState<AnalyticsData|null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);
  const fetchAnalytics = async () => { setLoading(true); try { const r = await apiClient.get(API_ENDPOINTS.ANALYTICS.OVERVIEW); setData(r.data); } catch(e){} finally { setLoading(false); }};

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color="#14B8A6" /><Text style={s.loadText}>Loading Analytics...</Text></View>;
  if (!data) return <View style={s.center}><Text style={s.loadText}>Failed to load analytics.</Text></View>;

  const kpis = [
    { label: 'ACTIVE USERS', value: (data.users?.total_students || 0) + (data.users?.total_staff || 0), icon: <Users size={18} color="#60A5FA" />, color: '#60A5FA', bgColor: 'rgba(96,165,250,0.15)', borderColor: 'rgba(96,165,250,0.4)', trend: '+12%', up: true },
    { label: 'TOTAL CATALOG', value: data.catalog?.total_titles || 0, icon: <BookOpen size={18} color="#34D399" />, color: '#34D399', bgColor: 'rgba(52,211,153,0.15)', borderColor: 'rgba(52,211,153,0.4)', trend: '+5', up: true },
    { label: 'IN CIRCULATION', value: data.operations?.active_loans || 0, icon: <TrendingUp size={18} color="#FBBF24" />, color: '#FBBF24', bgColor: 'rgba(251,191,36,0.15)', borderColor: 'rgba(251,191,36,0.4)', trend: '-3%', up: false },
    { label: 'OVERDUE ITEMS', value: data.operations?.overdue_loans || 0, icon: <AlertTriangle size={18} color="#FB7185" />, color: '#FB7185', bgColor: 'rgba(251,113,133,0.15)', borderColor: 'rgba(251,113,133,0.4)', trend: '-8%', up: false },
  ];

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <Text style={s.sectionLabel}>Key Performance Indicators</Text>
      <View style={s.kpiGrid}>
        {kpis.map((kpi, i) => (
          <View key={i} style={[s.kpiCard, { backgroundColor: kpi.bgColor, borderColor: kpi.borderColor }]}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
              {kpi.icon}
            </View>
            <Text style={[s.kpiVal, { color: kpi.color }]}>{kpi.value.toLocaleString()}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
              {kpi.up ? <ArrowUpRight size={12} color="#34D399" /> : <ArrowDownRight size={12} color="#FB7185" />}
              <Text style={[s.kpiTrend, { color: kpi.up ? '#34D399' : '#FB7185' }]}>{kpi.trend} vs last month</Text>
            </View>
          </View>
        ))}
      </View>

      <Text style={s.sectionLabel}>Revenue & Collection Summary</Text>
      <View style={s.revenueCard}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <Text style={s.revLabel}>TOTAL FINES COLLECTED</Text>
          <Badge label="This Semester" variant="info" />
        </View>
        <Text style={s.revVal}>${Number(data.financials?.total_fines_collected || 0).toFixed(2)}</Text>
        <View style={s.revBarBg}><View style={[s.revBar, { width: `${Math.min(((data.financials?.total_fines_collected || 0) / 5000)*100, 100)}%` as any }]} /></View>
        <Text style={s.revNote}>Target: $5,000.00</Text>
      </View>

      <Text style={s.sectionLabel}>Recent Activity Feed</Text>
      {(data.recent_transactions || []).slice(0, 8).map((tx: any, i: number) => (
        <View key={i} style={s.txRow}>
          <View style={s.txDot} />
          <View style={{ flex: 1, paddingLeft: 12 }}>
            <Text style={s.txTitle} numberOfLines={1}>{tx.book_title || 'Transaction'}</Text>
            <Text style={s.txMeta}>{tx.user_name} • {tx.transaction_type}</Text>
          </View>
          <Badge label={tx.transaction_type || 'TX'} variant={tx.transaction_type === 'CHECKOUT' ? 'info' : 'success'} />
        </View>
      ))}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#020617' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#020617' },
  loadText: { color: '#94A3B8', fontSize: 13, marginTop: 12 },
  sectionLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: (Dimensions.get('window').width - 44) / 2, borderWidth: 1, padding: 16, borderRadius: 16 },
  kpiLabel: { color: '#94A3B8', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  kpiVal: { fontWeight: '900', fontSize: 28, marginTop: 4 },
  kpiTrend: { fontSize: 10 },
  revenueCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', borderRadius: 24, padding: 24, marginBottom: 24 },
  revLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  revVal: { color: '#FFF', fontSize: 36, fontWeight: '900' },
  revBarBg: { height: 6, backgroundColor: '#1E293B', borderRadius: 999, marginTop: 12 },
  revBar: { height: 6, backgroundColor: '#14B8A6', borderRadius: 999 },
  revNote: { color: '#64748B', fontSize: 10, marginTop: 4 },
  txRow: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 14, borderRadius: 12, marginBottom: 10, flexDirection: 'row', alignItems: 'center' },
  txDot: { width: 8, height: 8, borderRadius: 999, backgroundColor: '#14B8A6' },
  txTitle: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  txMeta: { color: '#64748B', fontSize: 10, marginTop: 2 },
});
