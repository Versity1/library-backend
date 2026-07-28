import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, StyleSheet, Image } from 'react-native';
import { CreditCard, DollarSign, ShieldCheck, UploadCloud, FileImage } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { Fine, PaymentRecord } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Badge } from '../../components/Badge';

export const FinesAndPaymentsScreen: React.FC = () => {
  const [fines, setFines] = useState<Fine[]>([]);
  const [loading, setLoading] = useState(true);
  const [payingFine, setPayingFine] = useState<Fine | null>(null);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState<PaymentRecord | null>(null);
  const [paymentSlip, setPaymentSlip] = useState<string | null>(null);

  useEffect(() => { fetchFines(); }, []);
  const fetchFines = async () => { setLoading(true); try { const r = await apiClient.get(API_ENDPOINTS.FINES.MY_FINES); setFines(r.data.results||r.data); } catch(e){} finally { setLoading(false); }};
  const totalUnpaid = fines.filter(f=>f.status==='UNPAID').reduce((s,f)=>s+Number(f.amount),0);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPaymentSlip(result.assets[0].uri);
    }
  };

  const handlePayFine = async () => {
    if (!payingFine) return;
    if (!paymentSlip) {
      Alert.alert('Required', 'Please upload your bank transfer payment slip.');
      return;
    }
    setProcessing(true);
    
    try {
      const formData = new FormData();
      formData.append('fine_id', payingFine.id);
      formData.append('payment_method', 'MANUAL_BANK_TRANSFER');
      
      const filename = paymentSlip.split('/').pop() || 'slip.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;
      
      formData.append('payment_slip', {
        uri: paymentSlip,
        name: filename,
        type,
      } as any);

      const r = await apiClient.post(API_ENDPOINTS.FINES.PAY, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setReceipt(r.data);
      setPayingFine(null);
      setPaymentSlip(null);
      fetchFines();
    } catch(e:any){ 
      Alert.alert('Error', e.response?.data?.error || 'Payment failed.'); 
    } finally { 
      setProcessing(false); 
    }
  };

  return (
    <View style={s.bg}>
      <View style={s.balanceCard}>
        <View style={s.balanceHeader}><Text style={s.balanceLabel}>TOTAL OUTSTANDING BALANCE</Text><View style={s.dollarIcon}><DollarSign size={20} color="#FB7185" /></View></View>
        <Text style={s.balanceAmount}>₦{totalUnpaid.toFixed(2)}</Text>
        <Text style={s.balanceNote}>{totalUnpaid > 0 ? '⚠️ Please settle to resume checkouts.' : '✓ No outstanding penalties.'}</Text>
      </View>

      {loading ? <View style={s.center}><ActivityIndicator size="large" color="#14B8A6" /></View> : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={s.sectionLabel}>Fine & Penalty History ({fines.length})</Text>
          {fines.map(fine => (
            <View key={fine.id} style={s.fineCard}>
              <View style={{ flex: 1, paddingRight: 12 }}>
                <Text style={s.fineTitle}>{fine.book_title}</Text>
                <Text style={s.fineAuthor}>{fine.author}</Text>
                <Text style={s.fineMeta}>Overdue by {fine.overdue_days} days • ₦0.50/day</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={s.fineAmount}>₦{Number(fine.amount).toFixed(2)}</Text>
                <Badge label={fine.status.replace('_', ' ')} variant={fine.status === 'PAID' ? 'success' : fine.status === 'PENDING_VERIFICATION' ? 'warning' : 'danger'} />
                {fine.status === 'UNPAID' && (
                  <TouchableOpacity onPress={() => { setPayingFine(fine); setPaymentSlip(null); }} style={s.payBtn}>
                    <CreditCard size={12} color="#FFF" /><Text style={s.payBtnText}>Pay Now</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      {payingFine && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalBg}><View style={s.modalCard}>
            <Text style={s.modalTitle}>Manual Bank Transfer</Text>
            <Text style={s.modalSub}>Upload payment slip for "{payingFine.book_title}"</Text>
            <View style={s.detailBox}>
              <View style={s.detailRow}><Text style={s.detailLabel}>Fine Amount:</Text><Text style={s.detailVal}>₦{Number(payingFine.amount).toFixed(2)}</Text></View>
              <View style={s.detailRow}><Text style={s.detailLabel}>Method:</Text><Text style={[s.detailVal,{color:'#14B8A6'}]}>Bank Transfer</Text></View>
            </View>
            
            <TouchableOpacity onPress={pickImage} style={s.uploadBtn}>
              {paymentSlip ? (
                <>
                  <Image source={{ uri: paymentSlip }} style={s.previewImage} />
                  <View style={s.uploadOverlay}>
                    <FileImage size={24} color="#FFF" />
                    <Text style={s.uploadText}>Change Slip</Text>
                  </View>
                </>
              ) : (
                <>
                  <UploadCloud size={32} color="#14B8A6" />
                  <Text style={s.uploadText}>Tap to Upload Slip</Text>
                </>
              )}
            </TouchableOpacity>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setPayingFine(null)} style={s.cancelBtn}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
              <TouchableOpacity onPress={handlePayFine} disabled={processing} style={s.confirmBtn}><Text style={s.confirmText}>{processing ? 'Processing...' : 'Confirm & Pay'}</Text></TouchableOpacity>
            </View>
          </View></View>
        </Modal>
      )}

      {receipt && (
        <Modal visible transparent animationType="fade">
          <View style={s.receiptBg}><View style={s.receiptCard}>
            <View style={s.successIcon}><ShieldCheck size={28} color="#34D399" /></View>
            <Text style={s.successTitle}>Payment Successful!</Text>
            <Text style={s.successRef}>Ref: {receipt.transaction_reference}</Text>
            <View style={[s.detailBox, { marginVertical: 16 }]}>
              <Text style={s.receiptLine}>Amount: <Text style={{ fontWeight: '800', color: '#FFF' }}>₦{Number(receipt.amount_paid).toFixed(2)}</Text></Text>
              <Text style={s.receiptLine}>Method: <Text style={{ fontWeight: '800', color: '#14B8A6' }}>{receipt.payment_method}</Text></Text>
            </View>
            <TouchableOpacity onPress={() => setReceipt(null)} style={s.confirmBtn}><Text style={s.confirmText}>Close Receipt</Text></TouchableOpacity>
          </View></View>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC', padding: 16 },
  balanceCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 24, padding: 24, marginBottom: 20 },
  balanceHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  balanceLabel: { color: '#64748B', fontSize: 10, fontWeight: '700', letterSpacing: 1 },
  dollarIcon: { backgroundColor: 'rgba(251,113,133,0.1)', padding: 8, borderRadius: 12 },
  balanceAmount: { color: '#0A192F', fontSize: 36, fontWeight: '900' },
  balanceNote: { color: '#64748B', fontSize: 11, marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  sectionLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  fineCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  fineTitle: { color: '#0A192F', fontWeight: '800', fontSize: 15 },
  fineAuthor: { color: '#64748B', fontSize: 12, marginTop: 2 },
  fineMeta: { color: '#94A3B8', fontSize: 10, marginTop: 4 },
  fineAmount: { color: '#0A192F', fontWeight: '900', fontSize: 18, marginBottom: 4 },
  payBtn: { backgroundColor: '#0D9488', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  payBtnText: { color: '#FFF', fontSize: 11, fontWeight: '800' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFFFFF', borderTopWidth: 1, borderTopColor: '#E2E8F0', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#0A192F', fontSize: 20, fontWeight: '800', marginBottom: 8 },
  modalSub: { color: '#64748B', fontSize: 13, marginBottom: 16 },
  detailBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24, gap: 8 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: '#64748B', fontSize: 12 },
  detailVal: { color: '#0A192F', fontWeight: '800', fontSize: 13 },
  cancelBtn: { flex: 1, backgroundColor: '#E2E8F0', paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  cancelText: { color: '#64748B', fontWeight: '800' },
  confirmBtn: { flex: 1, backgroundColor: '#14B8A6', borderRadius: 12, padding: 14, alignItems: 'center' },
  confirmText: { color: '#FFF', fontWeight: '700', fontSize: 14 },
  uploadBtn: { height: 120, backgroundColor: '#F8FAFC', borderRadius: 12, borderWidth: 1, borderColor: '#CBD5E1', borderStyle: 'dashed', justifyContent: 'center', alignItems: 'center', marginBottom: 20, overflow: 'hidden' },
  uploadText: { color: '#64748B', fontSize: 13, marginTop: 8, fontWeight: '500' },
  previewImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  uploadOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  receiptBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 24 },
  receiptCard: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 24, padding: 24, alignItems: 'center' },
  successIcon: { width: 48, height: 48, backgroundColor: 'rgba(52,211,153,0.2)', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', marginBottom: 12 },
  successTitle: { color: '#0A192F', fontSize: 20, fontWeight: '800' },
  successRef: { color: '#64748B', fontSize: 11, marginTop: 4 },
  receiptLine: { color: '#0A192F', fontSize: 12 },
});
