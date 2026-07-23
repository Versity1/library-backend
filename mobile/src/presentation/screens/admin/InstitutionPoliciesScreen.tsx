import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Switch, StyleSheet } from 'react-native';
import { Settings, Clock, Library, ShieldCheck, Pencil, Save } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';

interface Policy { id: number; name: string; value: string; description: string; category: string; }

export const InstitutionPoliciesScreen: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number|null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => { fetchPolicies(); }, []);
  const fetchPolicies = async () => { setLoading(true); try { const r = await apiClient.get(API_ENDPOINTS.ANALYTICS.POLICIES); setPolicies(r.data.results||r.data); } catch(e){ setPolicies(samplePolicies); } finally { setLoading(false); }};

  const handleSave = async (id: number) => {
    try { await apiClient.patch(`${API_ENDPOINTS.ANALYTICS.POLICIES}${id}/`,{value:editValue}); Alert.alert('Saved','Policy updated.'); setEditingId(null); fetchPolicies(); }
    catch(e:any){ Alert.alert('Error',e.response?.data?.error||'Failed.'); }
  };

  const samplePolicies: Policy[] = [
    {id:1,name:'Max Checkout Per User',value:'5',description:'Maximum simultaneous checkouts',category:'circulation'},
    {id:2,name:'Loan Duration (Days)',value:'14',description:'Standard loan period',category:'circulation'},
    {id:3,name:'Fine Per Overdue Day',value:'0.50',description:'Dollar amount per day late',category:'fines'},
    {id:4,name:'Max Renewals Allowed',value:'2',description:'Max renewal count',category:'circulation'},
    {id:5,name:'Reservation Expiry (Hours)',value:'48',description:'Time before an uncollected reservation expires',category:'reservations'},
    {id:6,name:'Auto-Suspend On Fine',value:'true',description:'Automatically suspend checkouts when fines exceed threshold',category:'fines'},
  ];

  const displayPolicies = policies.length > 0 ? policies : samplePolicies;
  const categories = [...new Set(displayPolicies.map(p => p.category))];
  const catIcon = (c: string) => c === 'circulation' ? <Library size={16} color="#60A5FA" /> : c === 'fines' ? <ShieldCheck size={16} color="#FB7185" /> : <Clock size={16} color="#FBBF24" />;
  const catColor = (c: string) => c === 'circulation' ? 'rgba(96,165,250,0.2)' : c === 'fines' ? 'rgba(251,113,133,0.2)' : 'rgba(251,191,36,0.2)';

  return (
    <View style={s.bg}>
      <View style={s.topBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <View style={s.topIcon}><Settings size={18} color="#A78BFA" /></View>
          <View><Text style={s.topTitle}>Institution Policies</Text><Text style={s.topSub}>Configure system-wide rules</Text></View>
        </View>
      </View>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color="#14B8A6" /></View> : (
        <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 32 }}>
          {categories.map(cat => (
            <View key={cat} style={{ marginBottom: 24 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <View style={[s.catIconBox, { backgroundColor: catColor(cat) }]}>{catIcon(cat)}</View>
                <Text style={s.catLabel}>{cat.toUpperCase()}</Text>
              </View>

              {displayPolicies.filter(p => p.category === cat).map(policy => (
                <View key={policy.id} style={s.policyCard}>
                  <View style={{ flex: 1, paddingRight: 12 }}>
                    <Text style={s.policyName}>{policy.name}</Text>
                    <Text style={s.policyDesc}>{policy.description}</Text>
                  </View>

                  {editingId === policy.id ? (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      {policy.value === 'true' || policy.value === 'false' ? (
                        <Switch value={editValue==='true'} onValueChange={v=>setEditValue(v?'true':'false')} trackColor={{false:'#334155',true:'#0D9488'}} thumbColor="#FFF" />
                      ) : (
                        <TextInput style={s.editInput} value={editValue} onChangeText={setEditValue} keyboardType="numeric" />
                      )}
                      <TouchableOpacity onPress={() => handleSave(policy.id)} style={s.saveBtn}><Save size={14} color="#FFF" /></TouchableOpacity>
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={s.valueBox}><Text style={s.valueText}>{policy.value === 'true' ? '✓ ON' : policy.value === 'false' ? '✗ OFF' : policy.value}</Text></View>
                      <TouchableOpacity onPress={() => { setEditingId(policy.id); setEditValue(policy.value); }} style={s.editBtn}><Pencil size={14} color="#94A3B8" /></TouchableOpacity>
                    </View>
                  )}
                </View>
              ))}
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
  topIcon: { backgroundColor: 'rgba(167,139,250,0.2)', padding: 8, borderRadius: 10 },
  topTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  topSub: { color: '#94A3B8', fontSize: 11 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  catIconBox: { padding: 6, borderRadius: 8 },
  catLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  policyCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 16, borderRadius: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  policyName: { color: '#FFF', fontWeight: '800', fontSize: 13 },
  policyDesc: { color: '#64748B', fontSize: 10, marginTop: 2 },
  valueBox: { backgroundColor: '#020617', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B' },
  valueText: { color: '#14B8A6', fontWeight: '800', fontSize: 13, fontFamily: 'monospace' },
  editBtn: { backgroundColor: '#1E293B', padding: 8, borderRadius: 8 },
  editInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#14B8A6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, color: '#FFF', fontWeight: '800', width: 80, textAlign: 'center', fontFamily: 'monospace' },
  saveBtn: { backgroundColor: '#0D9488', padding: 8, borderRadius: 8 },
});
