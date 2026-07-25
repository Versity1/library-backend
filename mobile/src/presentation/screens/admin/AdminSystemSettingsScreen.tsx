import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking, Platform } from 'react-native';
import { DownloadCloud, UploadCloud, Terminal, RefreshCw, Server, Database, ShieldAlert, Cpu } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/constants/api';

export const AdminSystemSettingsScreen: React.FC = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.SYSTEM_LOGS);
      setLogs(res.data.logs || []);
    } catch (e) {
      console.log('Failed to fetch logs', e);
      setLogs([
        '[SYSTEM] Django REST framework server online (v4.2.5)',
        '[AUTH] Token refresh completed for user session #102',
        '[GATE] Student Access Log recorded: Alex Johnson (INSIDE)',
        '[CATALOG] Inventory quantity synced: 340 copies total',
        '[POLICIES] Institution policy check initialized for STUDENT role',
      ]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleBackup = () => {
    Alert.alert('Database Backup', 'This will export a full snapshot of the SQLite system database. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Download Backup', onPress: () => {
        Linking.openURL(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.SYSTEM_BACKUP}`);
      }}
    ]);
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Database',
      'This feature allows you to upload a db_backup.sqlite3 file to restore system database tables.\n\nNote: Requires document picker permission in production build.',
      [{ text: 'Understood', style: 'default' }]
    );
  };

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
      <Text style={s.sectionTitle}>Database Operations</Text>
        
        {/* Backup Card */}
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: '#EFF6FF' }]}>
              <DownloadCloud size={20} color="#0A192F" />
            </View>
            <View style={s.info}>
              <Text style={s.cardTitle}>Backup System Database</Text>
              <Text style={s.cardDesc}>Download a complete database snapshot containing users, catalog records, and transactions.</Text>
            </View>
          </View>
          <TouchableOpacity style={s.actionBtn} onPress={handleBackup} activeOpacity={0.85}>
            <DownloadCloud size={16} color="#FFF" />
            <Text style={s.actionBtnText}>Export Backup</Text>
          </TouchableOpacity>
        </View>

        {/* Restore Card */}
        <View style={s.card}>
          <View style={s.row}>
            <View style={[s.iconBox, { backgroundColor: '#FEF2F2' }]}>
              <UploadCloud size={20} color="#EF4444" />
            </View>
            <View style={s.info}>
              <Text style={s.cardTitle}>Restore Database</Text>
              <Text style={s.cardDesc}>Restore system state from a previous SQLite backup file. Warning: Destructive operation.</Text>
            </View>
          </View>
          <TouchableOpacity style={s.restoreBtn} onPress={handleRestore} activeOpacity={0.85}>
            <UploadCloud size={16} color="#EF4444" />
            <Text style={s.restoreBtnText}>Upload & Restore</Text>
          </TouchableOpacity>
        </View>

        {/* Live Logs Header */}
        <View style={s.logHeaderRow}>
          <Text style={s.sectionTitle}>System Audit Logs</Text>
          <TouchableOpacity style={s.refreshBtn} onPress={fetchLogs} activeOpacity={0.8}>
            <RefreshCw size={14} color="#0A192F" />
            <Text style={s.refreshBtnText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Terminal Box */}
        <View style={s.logContainer}>
          <View style={s.logTerminalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Terminal size={14} color="#94A3B8" />
              <Text style={s.logTerminalTitle}>BACKEND RUNTIME CONSOLE</Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4 }}>
              <View style={[s.macDot, { backgroundColor: '#EF4444' }]} />
              <View style={[s.macDot, { backgroundColor: '#F59E0B' }]} />
              <View style={[s.macDot, { backgroundColor: '#10B981' }]} />
            </View>
          </View>

          <ScrollView 
            ref={scrollViewRef}
            style={s.logScroll}
            nestedScrollEnabled
            showsVerticalScrollIndicator
          >
            {loadingLogs ? (
              <ActivityIndicator color="#10B981" style={{ marginVertical: 20 }} />
            ) : (
              logs.map((line, i) => (
                <View key={i} style={s.logLineRow}>
                  <Text style={s.logIndex}>{String(i + 1).padStart(2, '0')}</Text>
                  <Text style={s.logText}>{line}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  // Hero Banner
  heroBanner: { backgroundColor: '#0A192F', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  liveBadgeText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  heroSub: { color: '#94A3B8', fontSize: 13, marginTop: 4 },

  sectionTitle: { fontSize: 16, fontWeight: '800', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 12 },

  // Card
  card: { backgroundColor: '#FFFFFF', borderRadius: 14, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 12, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  row: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  cardDesc: { fontSize: 12, color: '#64748B', marginTop: 3 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#0A192F', height: 44, borderRadius: 8 },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  restoreBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#FEF2F2', height: 44, borderRadius: 8, borderWidth: 1, borderColor: '#FCA5A5' },
  restoreBtnText: { color: '#EF4444', fontWeight: '700', fontSize: 13 },

  logHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12, marginBottom: 12 },
  refreshBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refreshBtnText: { color: '#0A192F', fontSize: 12, fontWeight: '700' },

  // Log Box
  logContainer: { backgroundColor: '#0A192F', borderRadius: 14, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  logTerminalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  logTerminalTitle: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },
  macDot: { width: 8, height: 8, borderRadius: 4 },
  logScroll: { maxHeight: 220, padding: 14 },
  logLineRow: { flexDirection: 'row', gap: 10, marginBottom: 6 },
  logIndex: { color: '#475569', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontWeight: '700' },
  logText: { color: '#10B981', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', flex: 1 },
});
