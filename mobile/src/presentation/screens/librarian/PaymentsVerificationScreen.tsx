import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, Image, StyleSheet } from 'react-native';
import { CreditCard, CheckCircle2, XCircle, Search, ShieldCheck } from 'lucide-react-native';
import { PaymentRecord } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/constants/api';

const getFullImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const PaymentsVerificationScreen: React.FC = () => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => { fetchPendingPayments(); }, []);

  const fetchPendingPayments = async () => {
    setLoading(true);
    try {
      const r = await apiClient.get(API_ENDPOINTS.FINES.PENDING_PAYMENTS);
      setPayments(r.data.results || r.data);
    } catch (e: any) {
      Alert.alert('Error', 'Failed to fetch pending payments.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (action: 'APPROVE' | 'REJECT') => {
    if (!selectedPayment) return;
    setProcessing(true);
    try {
      await apiClient.post(API_ENDPOINTS.FINES.VERIFY_PAYMENT(selectedPayment.id), { action });
      Alert.alert('Success', `Payment ${action.toLowerCase()}d successfully.`);
      setSelectedPayment(null);
      fetchPendingPayments();
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.error || 'Verification failed.');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <View style={s.headerLeft}>
          <ShieldCheck size={28} color="#14B8A6" />
          <Text style={s.headerTitle}>Verify Payments</Text>
        </View>
        <View style={s.badge}><Text style={s.badgeText}>{payments.length} Pending</Text></View>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#14B8A6" /></View>
      ) : payments.length === 0 ? (
        <View style={s.emptyState}>
          <CreditCard size={48} color="#1E293B" />
          <Text style={s.emptyTitle}>All Caught Up!</Text>
          <Text style={s.emptySub}>There are no pending bank transfers to verify.</Text>
        </View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          {payments.map(p => (
            <TouchableOpacity key={p.id} style={s.card} onPress={() => setSelectedPayment(p)}>
              <View style={s.cardHeader}>
                <Text style={s.refText}>{p.transaction_reference}</Text>
                <Text style={s.amountText}>₦{Number(p.amount_paid).toFixed(2)}</Text>
              </View>
              <Text style={s.dateText}>{new Date(p.paid_at).toLocaleString()}</Text>
              <View style={s.cardFooter}>
                <Text style={s.methodText}>Bank Transfer • Needs Verification</Text>
                <Search size={16} color="#14B8A6" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedPayment && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalBg}>
            <View style={s.modalCard}>
              <Text style={s.modalTitle}>Verify Bank Transfer</Text>
              <Text style={s.modalSub}>Ref: {selectedPayment.transaction_reference}</Text>
              
              <View style={s.imageContainer}>
                {selectedPayment.payment_slip ? (
                  <Image source={{ uri: getFullImageUrl(selectedPayment.payment_slip)! }} style={s.slipImage} />
                ) : (
                  <Text style={s.noImageText}>No Slip Provided</Text>
                )}
              </View>

              <View style={s.actionRow}>
                <TouchableOpacity onPress={() => setSelectedPayment(null)} style={s.cancelBtn}>
                  <Text style={s.cancelText}>Close</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleVerification('REJECT')} disabled={processing} style={s.rejectBtn}>
                  <XCircle size={18} color="#FFF" />
                  <Text style={s.btnText}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleVerification('APPROVE')} disabled={processing} style={s.approveBtn}>
                  <CheckCircle2 size={18} color="#FFF" />
                  <Text style={s.btnText}>Approve</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#020617' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#0A192F', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  badge: { backgroundColor: 'rgba(20,184,166,0.2)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  badgeText: { color: '#14B8A6', fontSize: 12, fontWeight: '700' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
  emptyTitle: { color: '#FFF', fontSize: 18, fontWeight: '700', marginTop: 16 },
  emptySub: { color: '#64748B', textAlign: 'center', marginTop: 8 },
  card: { backgroundColor: '#0F172A', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#1E293B' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  refText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  amountText: { color: '#34D399', fontWeight: '800', fontSize: 16 },
  dateText: { color: '#64748B', fontSize: 12, marginBottom: 12 },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTopWidth: 1, borderTopColor: '#1E293B' },
  methodText: { color: '#94A3B8', fontSize: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', padding: 20 },
  modalCard: { backgroundColor: '#0F172A', borderRadius: 24, padding: 24, borderWidth: 1, borderColor: '#1E293B' },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  modalSub: { color: '#94A3B8', marginBottom: 20 },
  imageContainer: { height: 300, backgroundColor: '#020617', borderRadius: 12, justifyContent: 'center', alignItems: 'center', overflow: 'hidden', marginBottom: 20 },
  slipImage: { width: '100%', height: '100%', resizeMode: 'contain' },
  noImageText: { color: '#64748B' },
  actionRow: { flexDirection: 'row', gap: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#1E293B' },
  cancelText: { color: '#CBD5E1', fontWeight: '700' },
  rejectBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#E11D48' },
  approveBtn: { flex: 1, flexDirection: 'row', gap: 6, paddingVertical: 12, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#14B8A6' },
  btnText: { color: '#FFF', fontWeight: '700' }
});
