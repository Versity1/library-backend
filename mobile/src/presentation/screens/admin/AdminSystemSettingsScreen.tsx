import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { DownloadCloud, UploadCloud, Terminal, RefreshCw } from 'lucide-react-native';
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
    } finally {
      setLoadingLogs(false);
    }
  };

  const handleBackup = () => {
    Alert.alert('Database Backup', 'This will download the entire SQLite database file. Continue?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Download Backup', onPress: () => {
        // Since we are in an expo environment without robust file saving natively out-of-the-box,
        // using Linking to open the API endpoint in the browser is the easiest way to download the file!
        Linking.openURL(`${API_BASE_URL}${API_ENDPOINTS.ADMIN.SYSTEM_BACKUP}`);
      }}
    ]);
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Database',
      'This feature allows you to upload a db_backup.sqlite3 file to restore the system. \n\nNote: In a real mobile build, this requires expo-document-picker which is currently not installed in this environment.',
      [{ text: 'Understood', style: 'default' }]
    );
  };

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16 }}>
      
      <Text style={s.sectionTitle}>Database Management</Text>
      <View style={s.card}>
        <View style={s.row}>
          <View style={s.iconBox}>
            <DownloadCloud size={24} color="#14B8A6" />
          </View>
          <View style={s.info}>
            <Text style={s.cardTitle}>Backup Database</Text>
            <Text style={s.cardDesc}>Download a complete snapshot of the system database including all users, catalogs, and transactions.</Text>
          </View>
        </View>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#14B8A6' }]} onPress={handleBackup}>
          <Text style={s.actionBtnText}>Export Backup</Text>
        </TouchableOpacity>
      </View>

      <View style={s.card}>
        <View style={s.row}>
          <View style={[s.iconBox, { backgroundColor: '#FEF2F2' }]}>
            <UploadCloud size={24} color="#EF4444" />
          </View>
          <View style={s.info}>
            <Text style={s.cardTitle}>Restore Database</Text>
            <Text style={s.cardDesc}>Overwrite the current system database with a previous backup file. Warning: This is destructive.</Text>
          </View>
        </View>
        <TouchableOpacity style={[s.actionBtn, { backgroundColor: '#FEF2F2' }]} onPress={handleRestore}>
          <Text style={[s.actionBtnText, { color: '#EF4444' }]}>Upload & Restore</Text>
        </TouchableOpacity>
      </View>

      <Text style={[s.sectionTitle, { marginTop: 24, marginBottom: 12, textAlign: 'center' }]}>System Logs (Last 100 Lines)</Text>
      
      <TouchableOpacity style={s.refreshBlockBtn} onPress={fetchLogs}>
        <RefreshCw size={18} color="#0F172A" />
        <Text style={s.refreshBlockBtnText}>Refresh Logs</Text>
      </TouchableOpacity>

      <View style={s.logContainer}>
        <View style={s.logHeader}>
          <Terminal size={16} color="#94A3B8" />
          <Text style={s.logHeaderText}>system.log output</Text>
        </View>
        {loadingLogs ? (
          <View style={s.center}><ActivityIndicator color="#14B8A6" /></View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={s.logScroll} 
            nestedScrollEnabled={true}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {logs.length === 0 ? (
              <Text style={s.logText}>No logs found in system.log.</Text>
            ) : (
              logs.map((line, i) => (
                <Text key={i} style={s.logText}>{line}</Text>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { padding: 24, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginBottom: 16 },
  
  card: { backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  iconBox: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F0FDFA', alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  cardDesc: { fontSize: 12, color: '#64748B', lineHeight: 18 },
  actionBtn: { marginTop: 16, paddingVertical: 12, borderRadius: 10, alignItems: 'center' },
  actionBtnText: { color: '#FFF', fontWeight: '800', fontSize: 14 },

  refreshBlockBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F1F5F9', paddingVertical: 14, borderRadius: 12, marginBottom: 16, borderWidth: 1, borderColor: '#E2E8F0', gap: 8 },
  refreshBlockBtnText: { color: '#0F172A', fontWeight: '800', fontSize: 15 },

  logContainer: { backgroundColor: '#020617', borderRadius: 16, overflow: 'hidden', height: 400, marginBottom: 40 },
  logHeader: { backgroundColor: '#0F172A', padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8, borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  logHeaderText: { color: '#94A3B8', fontSize: 12, fontWeight: '700', fontFamily: 'monospace' },
  logScroll: { padding: 16 },
  logText: { color: '#34D399', fontSize: 11, fontFamily: 'monospace', marginBottom: 4, lineHeight: 16 },
});
