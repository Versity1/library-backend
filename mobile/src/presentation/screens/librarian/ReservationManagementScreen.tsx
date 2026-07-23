import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, StyleSheet } from 'react-native';
import { Bookmark, Users, CheckCircle2, XCircle } from 'lucide-react-native';
import { Reservation } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Badge } from '../../components/Badge';

export const ReservationManagementScreen: React.FC = () => {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const [processing, setProcessing] = useState<number|null>(null);

  useEffect(() => { fetchReservations(); }, [filter]);
  const fetchReservations = async () => {
    setLoading(true); try {
      let url = API_ENDPOINTS.RESERVATIONS.QUEUE;
      if (filter !== 'all') url += `?status=${filter}`;
      const r = await apiClient.get(url); setReservations(r.data.results||r.data);
    } catch(e){} finally { setLoading(false); }
  };

  const handleAction = async (id: number, action: 'FULFILL'|'CANCEL') => {
    setProcessing(id); try {
      if (action==='FULFILL') await apiClient.post(API_ENDPOINTS.RESERVATIONS.FULFILL,{reservation_id:id});
      else await apiClient.post(API_ENDPOINTS.RESERVATIONS.CANCEL,{reservation_id:id});
      Alert.alert('Success',`Reservation ${action.toLowerCase()}ed.`); fetchReservations();
    } catch(e:any){ Alert.alert('Error',e.response?.data?.error||'Failed'); } finally { setProcessing(null); }
  };

  const filters = [{key:'all',label:'All'},{key:'PENDING',label:'Active Holds'},{key:'FULFILLED',label:'Fulfilled'},{key:'CANCELLED',label:'Cancelled'}];
  const statusVariant = (s: string) => s==='PENDING'?'warning':s==='FULFILLED'?'success':'neutral';

  return (
    <View style={s.bg}>
      <View style={s.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <View style={s.iconBox}><Bookmark size={18} color="#60A5FA" /></View>
          <Text style={s.pageTitle}>Reservation & Hold Queue</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {filters.map(f=>(
            <TouchableOpacity key={f.key} onPress={()=>setFilter(f.key)} style={[s.filterBtn, filter===f.key&&s.filterBtnActive]}>
              <Text style={[s.filterText, filter===f.key&&s.filterTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color="#14B8A6" /></View> : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={s.countLabel}>Showing {reservations.length} Reservations</Text>
          {reservations.map(res => (
            <View key={res.id} style={s.resCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.resTitle}>{res.book_title}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <Users size={12} color="#94A3B8" /><Text style={s.resMeta}>{res.user_name} ({res.student_staff_id})</Text>
                </View>
                <Text style={s.resDate}>Placed: {new Date(res.reserved_at).toLocaleDateString()} • Queue: #{res.queue_position}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 8 }}>
                <Badge label={res.status} variant={statusVariant(res.status)} />
                {res.status==='PENDING' && (
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    {processing===res.id ? <ActivityIndicator color="#14B8A6" /> : (<>
                      <TouchableOpacity onPress={()=>handleAction(res.id,'FULFILL')} style={s.okBtn}><CheckCircle2 size={16} color="#34D399" /></TouchableOpacity>
                      <TouchableOpacity onPress={()=>handleAction(res.id,'CANCEL')} style={s.noBtn}><XCircle size={16} color="#FB7185" /></TouchableOpacity>
                    </>)}
                  </View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#020617' },
  topBar: { padding: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  iconBox: { backgroundColor: 'rgba(96,165,250,0.2)', padding: 6, borderRadius: 8 },
  pageTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#1E293B', marginRight: 8 },
  filterBtnActive: { backgroundColor: 'rgba(20,184,166,0.2)', borderColor: 'rgba(20,184,166,0.5)' },
  filterText: { color: '#94A3B8', fontSize: 11, fontWeight: '700' },
  filterTextActive: { color: '#34D399' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  resCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  resTitle: { color: '#FFF', fontWeight: '800', fontSize: 14 },
  resMeta: { color: '#94A3B8', fontSize: 12 },
  resDate: { color: '#64748B', fontSize: 10, marginTop: 4 },
  okBtn: { backgroundColor: 'rgba(52,211,153,0.2)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)' },
  noBtn: { backgroundColor: 'rgba(251,113,133,0.2)', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(251,113,133,0.4)' },
});
