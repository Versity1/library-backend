import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity, Linking } from 'react-native';
import { TrendingUp, Users, BookOpen, AlertTriangle, ArrowUpRight, ArrowDownRight, DollarSign, Activity, PieChart } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/constants/api';

interface AnalyticsData {
  users: { total_students: number; total_staff: number; };
  catalog: { total_titles: number; total_copies: number; available_copies: number; utilization_rate_pct: number; };
  operations: { active_loans: number; overdue_loans: number; pending_reservations: number; };
  financials: { total_fines_collected: number; outstanding_unpaid_fines: number; };
}

export const StrategicOverviewScreen: React.FC = () => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(API_ENDPOINTS.ANALYTICS.OVERVIEW);
      setData(r.data);
    } catch (e) {
      console.log('Error fetching analytics:', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#14B8A6" />
        <Text style={s.loadText}>Loading Dashboard...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={s.center}>
        <Text style={s.loadText}>Failed to load analytics.</Text>
        <TouchableOpacity onPress={fetchAnalytics} style={s.retryBtn}>
          <Text style={s.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const kpis = [
    { label: 'Active Users', value: (data.users?.total_students || 0) + (data.users?.total_staff || 0), icon: <Users size={20} color="#3B82F6" />, bg: '#EFF6FF', trend: '+12%', up: true },
    { label: 'Total Catalog', value: data.catalog?.total_titles || 0, icon: <BookOpen size={20} color="#10B981" />, bg: '#ECFDF5', trend: '+5', up: true },
    { label: 'In Circulation', value: data.operations?.active_loans || 0, icon: <Activity size={20} color="#F59E0B" />, bg: '#FFFBEB', trend: '-3%', up: false },
    { label: 'Overdue Items', value: data.operations?.overdue_loans || 0, icon: <AlertTriangle size={20} color="#EF4444" />, bg: '#FEF2F2', trend: '-8%', up: false },
  ];

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      
      {/* KPI Grid */}
      <View style={s.headerRow}>
        <Text style={s.sectionTitle}>Overview</Text>
      </View>
      
      <View style={s.kpiGrid}>
        {kpis.map((kpi, i) => (
          <View key={i} style={s.kpiCard}>
            <View style={[s.iconBox, { backgroundColor: kpi.bg }]}>
              {kpi.icon}
            </View>
            <Text style={s.kpiValue}>{kpi.value.toLocaleString()}</Text>
            <Text style={s.kpiLabel}>{kpi.label}</Text>
            <View style={s.trendRow}>
              {kpi.up ? <ArrowUpRight size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#EF4444" />}
              <Text style={[s.kpiTrend, { color: kpi.up ? '#10B981' : '#EF4444' }]}>{kpi.trend} this month</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Financials & Utilization */}
      <View style={s.metricsRow}>
        {/* Revenue Card */}
        <View style={s.metricCard}>
          <View style={s.metricHeader}>
            <View style={[s.iconBox, { backgroundColor: '#F0FDFA', width: 32, height: 32, borderRadius: 8 }]}>
              <DollarSign size={16} color="#14B8A6" />
            </View>
            <Text style={s.metricTitle}>Fines Collected</Text>
          </View>
          <Text style={s.metricValue}>${Number(data.financials?.total_fines_collected || 0).toFixed(2)}</Text>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${Math.min(((data.financials?.total_fines_collected || 0) / 5000) * 100, 100)}%` as any, backgroundColor: '#14B8A6' }]} />
          </View>
          <Text style={s.metricSub}>Target: $5,000.00</Text>
        </View>

        {/* Utilization Card */}
        <View style={s.metricCard}>
          <View style={s.metricHeader}>
            <View style={[s.iconBox, { backgroundColor: '#EEF2FF', width: 32, height: 32, borderRadius: 8 }]}>
              <PieChart size={16} color="#6366F1" />
            </View>
            <Text style={s.metricTitle}>Utilization Rate</Text>
          </View>
          <Text style={s.metricValue}>{data.catalog?.utilization_rate_pct || 0}%</Text>
          <View style={s.barBg}>
            <View style={[s.barFill, { width: `${data.catalog?.utilization_rate_pct || 0}%` as any, backgroundColor: '#6366F1' }]} />
          </View>
          <Text style={s.metricSub}>Of total capacity</Text>
        </View>
      </View>

      {/* Outstanding Debts Panel */}
      <View style={s.debtPanel}>
        <View style={s.debtContent}>
          <Text style={s.debtLabel}>Outstanding Unpaid Fines</Text>
          <Text style={s.debtValue}>${Number(data.financials?.outstanding_unpaid_fines || 0).toFixed(2)}</Text>
        </View>
        <TouchableOpacity style={s.actionBtn} onPress={() => Linking.openURL(API_BASE_URL + '/analytics/report/pdf/')}>
          <Text style={s.actionBtnText}>View Report</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' },
  loadText: { color: '#64748B', fontSize: 14, marginTop: 12, fontWeight: '500' },
  retryBtn: { marginTop: 16, backgroundColor: '#14B8A6', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8 },
  retryBtnText: { color: '#FFF', fontWeight: '700' },
  
  headerRow: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  
  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  kpiCard: { width: (Dimensions.get('window').width - 44) / 2, backgroundColor: '#FFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  iconBox: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  kpiValue: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  kpiLabel: { fontSize: 12, fontWeight: '600', color: '#64748B', marginBottom: 12 },
  trendRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  kpiTrend: { fontSize: 10, fontWeight: '700' },

  // Metrics Row
  metricsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  metricCard: { flex: 1, backgroundColor: '#FFF', padding: 16, borderRadius: 20, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  metricTitle: { fontSize: 12, fontWeight: '700', color: '#64748B' },
  metricValue: { fontSize: 24, fontWeight: '800', color: '#0F172A', marginBottom: 12 },
  barBg: { height: 6, backgroundColor: '#F1F5F9', borderRadius: 999, marginBottom: 8 },
  barFill: { height: 6, borderRadius: 999 },
  metricSub: { fontSize: 10, color: '#94A3B8', fontWeight: '500' },

  // Debt Panel
  debtPanel: { backgroundColor: '#0F172A', borderRadius: 24, padding: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12, elevation: 5 },
  debtContent: { flex: 1 },
  debtLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '600', marginBottom: 4 },
  debtValue: { color: '#FFF', fontSize: 28, fontWeight: '800' },
  actionBtn: { backgroundColor: '#FFF', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  actionBtnText: { color: '#0F172A', fontSize: 12, fontWeight: '800' },
});
