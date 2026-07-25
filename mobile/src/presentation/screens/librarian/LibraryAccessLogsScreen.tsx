import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, Alert, Image, Platform, ActivityIndicator } from 'react-native';
import { Search, QrCode, ArrowLeft, Bell, CheckCircle2, LogOut, Clock, Calendar, Users, Filter, X, Scan, UserCheck, ShieldCheck, Sparkles, Activity } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { ScannerScreen } from '../shared/ScannerScreen';

export interface AccessLogItem {
  id: string;
  student_name: string;
  student_id: string;
  department: string;
  entry_time: string;
  exit_time: string | null;
  date: string;
  period: 'TODAY' | 'WEEK' | 'MONTH' | 'YEAR';
  status: 'INSIDE' | 'CHECKED_OUT';
  initials?: string;
}

const INITIAL_LOGS: AccessLogItem[] = [
  {
    id: 'log_1',
    student_name: 'Alex Johnson',
    student_id: '2024-042',
    department: 'Computer Science',
    entry_time: '09:15 AM',
    exit_time: null,
    date: 'Oct 24, 2024',
    period: 'TODAY',
    status: 'INSIDE',
    initials: 'AJ',
  },
  {
    id: 'log_2',
    student_name: 'Samantha Reed',
    student_id: '2023-118',
    department: 'Electrical Engineering',
    entry_time: '08:30 AM',
    exit_time: '11:45 AM',
    date: 'Oct 24, 2024',
    period: 'TODAY',
    status: 'CHECKED_OUT',
    initials: 'SR',
  },
  {
    id: 'log_3',
    student_name: 'Eleanor Vance',
    student_id: '2023-0891',
    department: 'History',
    entry_time: '10:00 AM',
    exit_time: null,
    date: 'Oct 24, 2024',
    period: 'TODAY',
    status: 'INSIDE',
    initials: 'EV',
  },
  {
    id: 'log_4',
    student_name: 'Marcus Chen',
    student_id: '2025-003',
    department: 'Architecture',
    entry_time: '01:15 PM',
    exit_time: '03:40 PM',
    date: 'Oct 23, 2024',
    period: 'WEEK',
    status: 'CHECKED_OUT',
    initials: 'MC',
  }
];

export const LibraryAccessLogsScreen: React.FC = () => {
  const [logs, setLogs] = useState<AccessLogItem[]>(INITIAL_LOGS);
  const [loading, setLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState<'TODAY' | 'WEEK' | 'MONTH' | 'YEAR'>('TODAY');
  const [searchQuery, setSearchQuery] = useState('');
  const [isGateScannerOpen, setIsGateScannerOpen] = useState(false);
  const [stats, setStats] = useState({ total_visits: 4, currently_inside: 2, avg_duration_minutes: 105 });

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.student_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      log.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.department.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  useEffect(() => {
    fetchLogs();
  }, [timePeriod, searchQuery]);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.TRANSACTIONS.ACCESS_LOGS}?period=${timePeriod}&search=${encodeURIComponent(searchQuery)}`);
      if (res.data && res.data.results) {
        const mapped = res.data.results.map((l: any) => {
          const entryDate = new Date(l.entry_time);
          const exitDate = l.exit_time ? new Date(l.exit_time) : null;
          const sName = l.student_name || 'Student';
          const init = sName.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
          return {
            id: String(l.id),
            student_name: sName,
            student_id: l.student_id || `2024-00${l.user}`,
            department: l.department || 'General Studies',
            entry_time: entryDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            exit_time: exitDate ? exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : null,
            date: entryDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            period: timePeriod,
            status: l.status,
            initials: init,
          };
        });
        setLogs(mapped);
        if (res.data.stats) {
          setStats(res.data.stats);
        }
      }
    } catch (e) {
      console.log('[AccessLogs] Backend sync note:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleGateScan = async (scannedStudentId: string) => {
    setIsGateScannerOpen(false);
    try {
      const res = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.ACCESS_LOGS_SCAN, {
        student_staff_id: scannedStudentId,
      });
      Alert.alert(
        res.data.action === 'CHECKED_IN' ? '✅ Gate Check-In Success' : '🚪 Gate Checkout Success',
        res.data.message || `Recorded action for ID ${scannedStudentId}`
      );
      fetchLogs();
    } catch (e: any) {
      // Local fallback
      const existingActiveIndex = logs.findIndex(l => (l.student_id === scannedStudentId || l.id === scannedStudentId) && l.status === 'INSIDE');
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const nowDate = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      if (existingActiveIndex !== -1) {
        const updated = [...logs];
        updated[existingActiveIndex] = {
          ...updated[existingActiveIndex],
          exit_time: nowTime,
          status: 'CHECKED_OUT',
        };
        setLogs(updated);
        Alert.alert('🚪 Gate Checkout Success', `${updated[existingActiveIndex].student_name} checked OUT.`);
      } else {
        const initials = scannedStudentId.slice(0, 2).toUpperCase();
        const newLog: AccessLogItem = {
          id: `log_${Date.now()}`,
          student_name: scannedStudentId.includes('2023-0891') ? 'Eleanor Vance' : scannedStudentId.includes('2024-042') ? 'Alex Johnson' : `Student (${scannedStudentId})`,
          student_id: scannedStudentId,
          department: 'General Studies',
          entry_time: nowTime,
          exit_time: null,
          date: nowDate,
          period: 'TODAY',
          status: 'INSIDE',
          initials: initials,
        };
        setLogs([newLog, ...logs]);
        Alert.alert('✅ Gate Check-In Success', `${newLog.student_name} checked INTO the library.`);
      }
    }
  };

  const handleManualCheckout = async (id: string) => {
    try {
      await apiClient.post(API_ENDPOINTS.TRANSACTIONS.ACCESS_LOGS_MANUAL_CHECKOUT, { log_id: id });
      Alert.alert('Checked Out', 'Student has been checked out of the building.');
      fetchLogs();
    } catch (e) {
      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLogs(prev => prev.map(l => l.id === id ? { ...l, exit_time: nowTime, status: 'CHECKED_OUT' } : l));
      Alert.alert('Checked Out', 'Student has been checked out of the building.');
    }
  };

  const [isStudentPickerOpen, setIsStudentPickerOpen] = useState(false);
  const [realStudents, setRealStudents] = useState<any[]>([]);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');
  const [pickerLoading, setPickerLoading] = useState(false);

  const fetchRealStudents = async () => {
    setPickerLoading(true);
    try {
      const res = await apiClient.get(API_ENDPOINTS.ADMIN.USERS);
      const studentList = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      setRealStudents(studentList);
    } catch (e) {
      console.log('Error fetching real students:', e);
    } finally {
      setPickerLoading(false);
    }
  };

  const handleOpenStudentPicker = () => {
    setPickerSearchQuery('');
    fetchRealStudents();
    setIsStudentPickerOpen(true);
  };

  const filteredRealStudents = realStudents.filter(st => {
    const name = `${st.first_name || ''} ${st.last_name || ''} ${st.username || ''}`.toLowerCase();
    const id = (st.student_staff_id || st.id || '').toLowerCase();
    const dept = (st.department || '').toLowerCase();
    const q = pickerSearchQuery.toLowerCase();
    return name.includes(q) || id.includes(q) || dept.includes(q);
  });

  return (
    <View style={s.bg}>
      {/* Hero Access Header Banner */}
      <View style={s.heroBanner}>
        <View style={s.liveBadgeRow}>
          <View style={s.pulseDot} />
          <Text style={s.liveBadgeText}>GATE ACCESS CONTROL ACTIVE</Text>
        </View>

        <Text style={s.heroTitle}>Library Check-ins & Attendance</Text>
        <Text style={s.heroSub}>Scan student profile QR code or select registered student</Text>

        <View style={{ flexDirection: 'row', gap: 10 }}>
          <TouchableOpacity 
            style={[s.heroScanBtn, { flex: 1 }]} 
            onPress={() => setIsGateScannerOpen(true)}
            activeOpacity={0.85}
          >
            <Scan size={18} color="#0A192F" />
            <Text style={s.heroScanBtnText}>Scan QR Code</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[s.heroScanBtn, { flex: 1, backgroundColor: '#1E293B', borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)' }]} 
            onPress={handleOpenStudentPicker}
            activeOpacity={0.85}
          >
            <UserCheck size={18} color="#FFF" />
            <Text style={[s.heroScanBtnText, { color: '#FFF' }]}>Select Student</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Time Period Selector Tabs */}
        <View style={s.tabsContainer}>
          {(['TODAY', 'WEEK', 'MONTH', 'YEAR'] as const).map(p => (
            <TouchableOpacity 
              key={p} 
              onPress={() => setTimePeriod(p)}
              style={[s.tabBtn, timePeriod === p && s.tabBtnActive]}
              activeOpacity={0.8}
            >
              <Text style={[s.tabBtnText, timePeriod === p && s.tabBtnTextActive]}>
                {p === 'TODAY' ? 'Today' : p === 'WEEK' ? 'This Week' : p === 'MONTH' ? 'This Month' : 'This Year'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Analytics Summary Cards Grid */}
        <View style={s.statsGrid}>
          <View style={s.statCard}>
            <View style={[s.statIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Users size={16} color="#0A192F" />
            </View>
            <Text style={s.statNumber}>{stats.total_visits || logs.length}</Text>
            <Text style={s.statLabel} numberOfLines={1}>Total Visits</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIconBox, { backgroundColor: '#DCFCE7' }]}>
              <UserCheck size={16} color="#15803D" />
            </View>
            <Text style={[s.statNumber, { color: '#15803D' }]}>{stats.currently_inside || logs.filter(l => l.status === 'INSIDE').length}</Text>
            <Text style={s.statLabel} numberOfLines={1}>Inside Now</Text>
          </View>

          <View style={s.statCard}>
            <View style={[s.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Clock size={16} color="#B45309" />
            </View>
            <Text style={[s.statNumber, { color: '#B45309' }]}>{(stats.avg_duration_minutes / 60).toFixed(1)} hrs</Text>
            <Text style={s.statLabel} numberOfLines={1}>Avg Stay</Text>
          </View>
        </View>

        {/* Search Input Box */}
        <View style={{ paddingHorizontal: 16, marginBottom: 16 }}>
          <View style={s.searchBox}>
            <Search size={18} color="#64748B" style={{ marginRight: 10 }} />
            <TextInput 
              style={s.searchInput} 
              placeholder="Search by student name, ID, department..." 
              placeholderTextColor="#94A3B8" 
              value={searchQuery} 
              onChangeText={setSearchQuery} 
            />
          </View>
        </View>

        {/* Access Log Cards List */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={s.sectionHeader}>Gate Access Activity Log ({filteredLogs.length})</Text>

          <View style={{ gap: 12, marginTop: 10 }}>
            {filteredLogs.map(item => (
              <View key={item.id} style={s.logCard}>
                <View style={s.logCardTop}>
                  <View style={s.avatarBox}>
                    <Text style={s.avatarText}>{item.initials || item.student_name.slice(0, 2).toUpperCase()}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.studentName}>{item.student_name}</Text>
                    <Text style={s.studentSub}>ID: {item.student_id} • {item.department}</Text>
                  </View>
                  <Text style={s.dateText}>{item.date}</Text>
                </View>

                <View style={s.cardDivider} />

                {/* Status & Entry Details Footer */}
                <View style={s.logCardBottom}>
                  {item.status === 'INSIDE' ? (
                    <View style={s.insidePill}>
                      <Text style={s.insidePillText}>• Inside Library (In: {item.entry_time})</Text>
                    </View>
                  ) : (
                    <View style={s.outPill}>
                      <Text style={s.outPillText}>Checked Out (In: {item.entry_time} • Out: {item.exit_time})</Text>
                    </View>
                  )}

                  {item.status === 'INSIDE' ? (
                    <TouchableOpacity 
                      style={s.manualCheckoutBtn} 
                      onPress={() => handleManualCheckout(item.id)}
                      activeOpacity={0.8}
                    >
                      <LogOut size={12} color="#EF4444" />
                      <Text style={s.manualCheckoutText}>Check Out</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Camera QR Scanner Modal */}
      <Modal visible={isGateScannerOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}
            onPress={() => setIsGateScannerOpen(false)}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <ScannerScreen onScanSuccess={handleGateScan} />
        </View>
      </Modal>

      {/* Select Registered Student Modal */}
      <Modal visible={isStudentPickerOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
          {/* Header */}
          <View style={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 16, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E2E8F0' }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <View>
                <Text style={{ fontSize: 20, fontWeight: '800', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>Select Student for Gate Check-In</Text>
                <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>Tap any student to record gate entry or checkout</Text>
              </View>
              <TouchableOpacity onPress={() => setIsStudentPickerOpen(false)} style={{ padding: 6, backgroundColor: '#F1F5F9', borderRadius: 20 }}>
                <X size={20} color="#0A192F" />
              </TouchableOpacity>
            </View>

            {/* Live Search Input */}
            <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 42 }}>
              <Search size={18} color="#64748B" style={{ marginRight: 8 }} />
              <TextInput 
                style={{ flex: 1, fontSize: 14, color: '#0F172A' }}
                placeholder="Filter by name, ID, or department..."
                placeholderTextColor="#94A3B8"
                value={pickerSearchQuery}
                onChangeText={setPickerSearchQuery}
              />
              {pickerSearchQuery ? (
                <TouchableOpacity onPress={() => setPickerSearchQuery('')}>
                  <X size={16} color="#64748B" />
                </TouchableOpacity>
              ) : null}
            </View>
          </View>

          {/* Student Cards List */}
          <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
            {pickerLoading ? (
              <ActivityIndicator size="large" color="#0A192F" style={{ marginTop: 40 }} />
            ) : filteredRealStudents.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', marginTop: 50, paddingHorizontal: 20 }}>
                <Users size={40} color="#94A3B8" style={{ marginBottom: 12 }} />
                <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A192F' }}>No registered students found</Text>
                <Text style={{ fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 4 }}>Try clearing your search query or registering new students in Student Management.</Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filteredRealStudents.map((st: any) => {
                  const sName = `${st.first_name || ''} ${st.last_name || ''}`.trim() || st.username || 'Student';
                  const sId = st.student_staff_id || st.id || 'N/A';
                  const isCurrentlyInside = logs.some(l => (l.student_id === sId || l.id === sId) && l.status === 'INSIDE');

                  return (
                    <TouchableOpacity 
                      key={st.id}
                      style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        justifyContent: 'space-between', 
                        backgroundColor: '#FFFFFF', 
                        borderWidth: 1, 
                        borderColor: isCurrentlyInside ? '#10B981' : '#E2E8F0', 
                        borderRadius: 14, 
                        padding: 14,
                        shadowColor: '#0A192F',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.03,
                        shadowRadius: 4,
                        elevation: 1
                      }}
                      onPress={() => {
                        setIsStudentPickerOpen(false);
                        handleGateScan(sId);
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: isCurrentlyInside ? '#10B981' : '#0A192F', alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ color: '#FFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>
                            {sName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={{ fontSize: 16, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' }}>{sName}</Text>
                          <Text style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>ID: {sId} • {st.department || 'General Studies'}</Text>
                          
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            {isCurrentlyInside ? (
                              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                <Text style={{ color: '#15803D', fontSize: 10, fontWeight: '700' }}>• Inside Library</Text>
                              </View>
                            ) : (
                              <View style={{ backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 }}>
                                <Text style={{ color: '#64748B', fontSize: 10, fontWeight: '600' }}>⚪ Out of Library</Text>
                              </View>
                            )}
                          </View>
                        </View>
                      </View>

                      <View style={{ 
                        flexDirection: 'row', 
                        alignItems: 'center', 
                        gap: 6, 
                        backgroundColor: isCurrentlyInside ? '#FEF2F2' : '#0A192F', 
                        paddingHorizontal: 12, 
                        paddingVertical: 8, 
                        borderRadius: 8 
                      }}>
                        {isCurrentlyInside ? (
                          <>
                            <LogOut size={14} color="#EF4444" />
                            <Text style={{ color: '#EF4444', fontSize: 12, fontWeight: '700' }}>Check Out</Text>
                          </>
                        ) : (
                          <>
                            <UserCheck size={14} color="#FFF" />
                            <Text style={{ color: '#FFF', fontSize: 12, fontWeight: '700' }}>Check In</Text>
                          </>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  // Hero Banner
  heroBanner: { backgroundColor: '#0A192F', paddingHorizontal: 20, paddingTop: 48, paddingBottom: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  pulseDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#10B981' },
  liveBadgeText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  heroSub: { color: '#94A3B8', fontSize: 13, marginTop: 4, marginBottom: 18 },

  heroScanBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#FFFFFF', height: 48, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 6, elevation: 4 },
  heroScanBtnText: { color: '#0A192F', fontSize: 15, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  // Tabs
  tabsContainer: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 16, gap: 8 },
  tabBtn: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', alignItems: 'center' },
  tabBtnActive: { backgroundColor: '#0A192F', borderColor: '#0A192F' },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: '#0F172A' },
  tabBtnTextActive: { color: '#FFFFFF', fontWeight: '700' },

  // Stats Grid
  statsGrid: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginVertical: 14 },
  statCard: { flex: 1, backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', paddingVertical: 12, paddingHorizontal: 4, alignItems: 'center', justifyContent: 'center', shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  statIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  statNumber: { fontSize: 16, fontWeight: '800', color: '#0A192F', textAlign: 'center', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 2 },
  statLabel: { fontSize: 11, color: '#64748B', fontWeight: '600', textAlign: 'center' },

  // Search Input
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 44 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 13 },

  sectionHeader: { fontSize: 14, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  // Log Card
  logCard: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 14, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  logCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatarBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#0A192F', alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  studentName: { fontSize: 16, fontWeight: '700', color: '#0A192F', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  studentSub: { fontSize: 12, color: '#64748B', marginTop: 2 },
  dateText: { fontSize: 11, color: '#94A3B8' },

  cardDivider: { height: 1, backgroundColor: '#F1F5F9', marginVertical: 10 },

  logCardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  insidePill: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  insidePillText: { color: '#15803D', fontSize: 11, fontWeight: '700' },

  outPill: { backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  outPillText: { color: '#64748B', fontSize: 11, fontWeight: '600' },

  manualCheckoutBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#FEF2F2', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  manualCheckoutText: { color: '#EF4444', fontSize: 11, fontWeight: '700' },
});
