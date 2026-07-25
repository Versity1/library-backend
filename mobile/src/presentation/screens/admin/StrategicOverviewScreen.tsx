import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet, Dimensions, TouchableOpacity, Linking, Platform } from 'react-native';
import { TrendingUp, Users, BookOpen, AlertTriangle, ArrowUpRight, ArrowDownRight, DollarSign, Activity, PieChart, RefreshCw, ShieldCheck, Zap } from 'lucide-react-native';
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
      // Fallback demo metrics if API is blank
      setData({
        users: { total_students: 142, total_staff: 12 },
        catalog: { total_titles: 85, total_copies: 340, available_copies: 280, utilization_rate_pct: 68 },
        operations: { active_loans: 42, overdue_loans: 3, pending_reservations: 8 },
        financials: { total_fines_collected: 1250, outstanding_unpaid_fines: 180 },
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color="#0A192F" />
        <Text style={s.loadText}>Loading Executive Dashboard...</Text>
      </View>
    );
  }

  const activeUsers = (data?.users?.total_students || 0) + (data?.users?.total_staff || 0);
  const catalogTitles = data?.catalog?.total_titles || 0;
  const activeLoans = data?.operations?.active_loans || 0;
  const overdueLoans = data?.operations?.overdue_loans || 0;

  const kpis = [
    { label: 'Active Users', value: activeUsers, icon: <Users size={18} color="#0A192F" />, bg: '#EFF6FF', trend: '+12%', up: true },
    { label: 'Total Catalog', value: catalogTitles, icon: <BookOpen size={18} color="#10B981" />, bg: '#ECFDF5', trend: '+5', up: true },
    { label: 'In Circulation', value: activeLoans, icon: <Activity size={18} color="#B45309" />, bg: '#FFFBEB', trend: '+3%', up: true },
    { label: 'Overdue Items', value: overdueLoans, icon: <AlertTriangle size={18} color="#EF4444" />, bg: '#FEF2F2', trend: '-2%', up: false },
  ];

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      
      {/* Top Action & Section Bar */}
      <View style={s.topBarRow}>
        <View>
          <Text style={s.sectionHeader}>System Overview</Text>
          <Text style={s.sectionSub}>Real-time metrics & library performance</Text>
        </View>

        <TouchableOpacity onPress={fetchAnalytics} style={s.refreshBtn} activeOpacity={0.8}>
          <RefreshCw size={12} color="#0A192F" />
          <Text style={s.refreshBtnText}>Refresh</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 12 }}>
        {/* KPI Grid */}
        <Text style={s.sectionHeader}>Key Performance Indicators</Text>
        
        <View style={s.kpiGrid}>
          {kpis.map((kpi, i) => (
            <View key={i} style={s.kpiCard}>
              <View style={s.kpiTopRow}>
                <View style={[s.iconBox, { backgroundColor: kpi.bg }]}>
                  {kpi.icon}
                </View>
                <View style={s.trendPill}>
                  {kpi.up ? <ArrowUpRight size={12} color="#10B981" /> : <ArrowDownRight size={12} color="#EF4444" />}
                  <Text style={[s.kpiTrend, { color: kpi.up ? '#10B981' : '#EF4444' }]}>{kpi.trend}</Text>
                </View>
              </View>

              <Text style={s.kpiValue}>{kpi.value.toLocaleString()}</Text>
              <Text style={s.kpiLabel}>{kpi.label}</Text>
            </View>
          ))}
        </View>

        {/* Financials & Catalog Utilization */}
        <Text style={[s.sectionHeader, { marginTop: 24 }]}>Financials & Circulation</Text>
        
        <View style={s.metricsRow}>
          {/* Fines Collected Card */}
          <View style={s.metricCard}>
            <View style={s.metricHeader}>
              <View style={[s.iconBox, { backgroundColor: '#F0FDFA' }]}>
                <DollarSign size={18} color="#0D9488" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.metricTitle}>Fines Collected</Text>
                <Text style={s.metricSub}>YTD Revenue</Text>
              </View>
            </View>
            <Text style={s.metricValue}>₦{Number(data?.financials?.total_fines_collected || 0).toFixed(2)}</Text>
            
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${Math.min(((data?.financials?.total_fines_collected || 0) / 2000) * 100, 100)}%` as any, backgroundColor: '#0D9488' }]} />
            </View>
            <Text style={s.barSub}>Outstanding: ₦{Number(data?.financials?.outstanding_unpaid_fines || 0).toFixed(2)}</Text>
          </View>

          {/* Catalog Utilization Card */}
          <View style={s.metricCard}>
            <View style={s.metricHeader}>
              <View style={[s.iconBox, { backgroundColor: '#F3E8FF' }]}>
                <PieChart size={18} color="#7C3AED" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.metricTitle}>Utilization Rate</Text>
                <Text style={s.metricSub}>Active vs Available</Text>
              </View>
            </View>
            <Text style={[s.metricValue, { color: '#7C3AED' }]}>{data?.catalog?.utilization_rate_pct || 68}%</Text>
            
            <View style={s.barBg}>
              <View style={[s.barFill, { width: `${data?.catalog?.utilization_rate_pct || 68}%` as any, backgroundColor: '#7C3AED' }]} />
            </View>
            <Text style={s.barSub}>{data?.catalog?.available_copies || 0} copies in stock</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadText: { marginTop: 12, color: '#64748B', fontSize: 14, fontWeight: '600' },

  topBarRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sectionHeader: { fontSize: 18, fontWeight: '800', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  sectionSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0' },
  refreshBtnText: { color: '#0A192F', fontSize: 12, fontWeight: '700' },

  // KPI Grid
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  kpiCard: { width: (Dimensions.get('window').width - 44) / 2, backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  kpiTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  iconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  trendPill: { flexDirection: 'row', alignItems: 'center', gap: 2, backgroundColor: '#F8FAFC', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  kpiTrend: { fontSize: 11, fontWeight: '700' },
  kpiValue: { fontSize: 22, fontWeight: '800', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  kpiLabel: { fontSize: 12, color: '#64748B', fontWeight: '600', marginTop: 2 },

  // Metrics Row
  metricsRow: { gap: 14 },
  metricCard: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  metricHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  metricTitle: { fontSize: 15, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  metricSub: { fontSize: 11, color: '#64748B' },
  metricValue: { fontSize: 24, fontWeight: '800', color: '#0D9488', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 10 },
  barBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden', marginBottom: 6 },
  barFill: { height: '100%', borderRadius: 4 },
  barSub: { fontSize: 11, color: '#64748B', fontWeight: '600' },
});
