import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, StyleSheet, Platform } from 'react-native';
import { Settings, ShieldCheck, Pencil, Save, X, Shield, Lock, Sliders } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Policy } from '../../../domain/types';

// Editable numeric fields on the InstitutionPolicy model, with human labels.
const FIELDS: { key: keyof Policy; label: string; description: string; numeric: boolean }[] = [
  { key: 'max_borrow_limit', label: 'Max Borrow Limit', description: 'Maximum simultaneous checkouts', numeric: true },
  { key: 'default_loan_days', label: 'Loan Duration (Days)', description: 'Standard loan period', numeric: true },
  { key: 'fine_rate_per_day', label: 'Fine Per Overdue Day (₦)', description: 'Amount charged per day late', numeric: true },
  { key: 'grace_period_days', label: 'Grace Period (Days)', description: 'Days before fines accrue', numeric: true },
  { key: 'reservation_hold_hours', label: 'Reservation Hold (Hours)', description: 'Time before an uncollected hold expires', numeric: true },
];

export const InstitutionPoliciesScreen: React.FC = () => {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRole, setEditingRole] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<Policy>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => { fetchPolicies(); }, []);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(API_ENDPOINTS.POLICIES.LIST);
      const fetched = r.data.results || r.data;
      if (fetched && fetched.length > 0) {
        setPolicies(fetched);
      } else {
        // Fallback policy templates
        setPolicies([
          { id: 1, role: 'STUDENT', max_borrow_limit: 3, default_loan_days: 14, fine_rate_per_day: 0.50, grace_period_days: 2, reservation_hold_hours: 48 },
          { id: 2, role: 'FACULTY', max_borrow_limit: 10, default_loan_days: 30, fine_rate_per_day: 0.25, grace_period_days: 5, reservation_hold_hours: 72 },
        ] as any);
      }
    } catch (e) {
      setPolicies([
        { id: 1, role: 'STUDENT', max_borrow_limit: 3, default_loan_days: 14, fine_rate_per_day: 0.50, grace_period_days: 2, reservation_hold_hours: 48 },
        { id: 2, role: 'FACULTY', max_borrow_limit: 10, default_loan_days: 30, fine_rate_per_day: 0.25, grace_period_days: 5, reservation_hold_hours: 72 },
      ] as any);
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (policy: Policy) => {
    setEditingRole(policy.role);
    setDraft({ ...policy });
  };

  const cancelEdit = () => {
    setEditingRole(null);
    setDraft({});
  };

  const handleSave = async (policy: Policy) => {
    setSaving(true);
    try {
      const payload = {
        max_borrow_limit: Number(draft.max_borrow_limit),
        default_loan_days: Number(draft.default_loan_days),
        fine_rate_per_day: Number(draft.fine_rate_per_day),
        grace_period_days: Number(draft.grace_period_days),
        reservation_hold_hours: Number(draft.reservation_hold_hours),
      };
      await apiClient.patch(API_ENDPOINTS.POLICIES.DETAIL(policy.id), payload);
      Alert.alert('Saved', `Policy for ${policy.role} updated successfully.`);
      cancelEdit();
      fetchPolicies();
    } catch (e: any) {
      const data = e.response?.data;
      const msg = typeof data === 'object' && data ? Object.values(data)[0] : 'Failed to save policy.';
      Alert.alert('Error', Array.isArray(msg) ? msg[0] : String(msg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={s.bg}>
      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#0A192F" /></View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }} contentContainerStyle={{ paddingBottom: 40 }}>
          {policies.map(policy => {
            const isEditing = editingRole === policy.role;
            return (
              <View key={policy.id} style={s.roleCard}>
                <View style={s.roleHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <View style={s.roleIconBox}><ShieldCheck size={18} color="#0A192F" /></View>
                    <Text style={s.roleLabel}>{policy.role} POLICY</Text>
                  </View>
                  {isEditing ? (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <TouchableOpacity onPress={cancelEdit} style={s.cancelBtn}><X size={16} color="#64748B" /></TouchableOpacity>
                      <TouchableOpacity onPress={() => handleSave(policy)} disabled={saving} style={s.saveBtn}>
                        {saving ? <ActivityIndicator size="small" color="#FFF" /> : <Save size={16} color="#FFF" />}
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <TouchableOpacity onPress={() => startEdit(policy)} style={s.editBtn}>
                      <Pencil size={14} color="#0A192F" />
                      <Text style={s.editBtnText}>Edit</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {FIELDS.map(f => (
                  <View key={String(f.key)} style={s.fieldRow}>
                    <View style={{ flex: 1, paddingRight: 12 }}>
                      <Text style={s.fieldName}>{f.label}</Text>
                      <Text style={s.fieldDesc}>{f.description}</Text>
                    </View>
                    {isEditing ? (
                      <TextInput
                        style={s.editInput}
                        value={String(draft[f.key] ?? '')}
                        onChangeText={t => setDraft(d => ({ ...d, [f.key]: t }))}
                        keyboardType="numeric"
                      />
                    ) : (
                      <View style={s.valueBox}>
                        <Text style={s.valueText}>{String(policy[f.key])}</Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Hero Banner
  heroBanner: { backgroundColor: '#0A192F', paddingHorizontal: 20, paddingTop: 32, paddingBottom: 24, borderBottomLeftRadius: 20, borderBottomRightRadius: 20 },
  liveBadgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, alignSelf: 'flex-start', marginBottom: 12 },
  liveBadgeText: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 1 },

  heroTitle: { color: '#FFFFFF', fontSize: 24, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  heroSub: { color: '#94A3B8', fontSize: 13, marginTop: 4 },

  // Role Card
  roleCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, marginBottom: 16, padding: 16, shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 4, elevation: 1 },
  roleHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  roleIconBox: { padding: 8, borderRadius: 10, backgroundColor: '#EFF6FF' },
  roleLabel: { color: '#0A192F', fontSize: 16, fontWeight: '800', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  editBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#F1F5F9', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: '#0A192F', fontSize: 12, fontWeight: '700' },
  cancelBtn: { backgroundColor: '#F1F5F9', padding: 8, borderRadius: 8 },
  saveBtn: { backgroundColor: '#0A192F', padding: 8, borderRadius: 8, minWidth: 36, alignItems: 'center' },

  fieldRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  fieldName: { color: '#0F172A', fontWeight: '700', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  fieldDesc: { color: '#64748B', fontSize: 11, marginTop: 2 },
  
  valueBox: { backgroundColor: '#F1F5F9', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', minWidth: 56, alignItems: 'center' },
  valueText: { color: '#0A192F', fontWeight: '800', fontSize: 14, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  editInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0A192F', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, color: '#0F172A', fontWeight: '800', width: 72, textAlign: 'center' },
});
