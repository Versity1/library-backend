import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { QrCode, ArrowLeftRight, ScanLine, CheckCircle2, ShieldAlert, BookOpen, User } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Transaction } from '../../../domain/types';

export const QRCheckoutScannerScreen: React.FC = () => {
  const [mode, setMode] = useState<'CHECKOUT'|'RETURN'>('CHECKOUT');
  const [studentStaffId, setStudentStaffId] = useState('STU-4829');
  const [qrCodeId, setQrCodeId] = useState('QR-CS-001');
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction|null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const handleProcess = async () => {
    if (!qrCodeId) { setErrorMsg('Enter a QR Code ID'); return; }
    if (mode==='CHECKOUT' && !studentStaffId) { setErrorMsg('Enter Student/Staff ID'); return; }
    setLoading(true); setErrorMsg(''); setLastTx(null);
    try {
      if (mode==='CHECKOUT') { const r = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.CHECKOUT,{student_staff_id:studentStaffId,qr_code_id:qrCodeId}); setLastTx(r.data); }
      else { const r = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.RETURN,{qr_code_id:qrCodeId}); setLastTx(r.data); }
    } catch(e:any){ setErrorMsg(e.response?.data?.error||'Failed.'); } finally { setLoading(false); }
  };

  const samples = ['QR-CS-001','QR-CS-002','QR-ALGO-001','QR-CLEAN-001'];

  return (
    <ScrollView style={s.bg} contentContainerStyle={{ padding: 16 }}>
      <View style={s.modeSwitch}>
        <TouchableOpacity onPress={()=>{setMode('CHECKOUT');setErrorMsg('');setLastTx(null);}} style={[s.modeBtn, mode==='CHECKOUT'&&{backgroundColor:'#0D9488'}]}>
          <QrCode size={18} color="#FFF" /><Text style={[s.modeBtnText,mode==='CHECKOUT'?{color:'#FFF'}:{color:'#94A3B8'}]}>Issue / Check-out</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={()=>{setMode('RETURN');setErrorMsg('');setLastTx(null);}} style={[s.modeBtn, mode==='RETURN'&&{backgroundColor:'#3B82F6'}]}>
          <ArrowLeftRight size={18} color="#FFF" /><Text style={[s.modeBtnText,mode==='RETURN'?{color:'#FFF'}:{color:'#94A3B8'}]}>Process Return</Text>
        </TouchableOpacity>
      </View>

      <View style={s.scanFrame}>
        <View style={s.scanIcon}><ScanLine size={32} color="#14B8A6" /></View>
        <Text style={s.scanTitle}>QR Barcode Scanner Frame</Text>
        <Text style={s.scanSub}>Select test payload below</Text>
        <View style={s.sampleRow}>
          {samples.map(c=>(
            <TouchableOpacity key={c} onPress={()=>setQrCodeId(c)} style={[s.sampleBtn, qrCodeId===c&&{backgroundColor:'rgba(20,184,166,0.3)',borderColor:'#2DD4BF'}]}>
              <Text style={s.sampleText}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={s.formCard}>
        {mode==='CHECKOUT' && (<View style={{ marginBottom: 16 }}>
          <Text style={s.formLabel}>STUDENT / STAFF ID</Text>
          <View style={s.inputRow}><User size={18} color="#64748B" /><TextInput style={s.input} placeholder="e.g. STU-4829" placeholderTextColor="#475569" value={studentStaffId} onChangeText={setStudentStaffId} /></View>
        </View>)}
        <Text style={s.formLabel}>SCANNED BOOK COPY QR ID</Text>
        <View style={s.inputRow}><BookOpen size={18} color="#64748B" /><TextInput style={s.input} placeholder="e.g. QR-CS-001" placeholderTextColor="#475569" value={qrCodeId} onChangeText={setQrCodeId} /></View>
        <TouchableOpacity onPress={handleProcess} disabled={loading} style={[s.processBtn,{backgroundColor:mode==='CHECKOUT'?'#0D9488':'#3B82F6'}]}>
          {loading ? <ActivityIndicator color="#FFF" /> : <Text style={s.processBtnText}>{mode==='CHECKOUT'?'Execute Book Issue':'Confirm Book Return'}</Text>}
        </TouchableOpacity>
      </View>

      {errorMsg ? <View style={s.errorBox}><ShieldAlert size={20} color="#FB7185" /><Text style={s.errorText}>{errorMsg}</Text></View> : null}

      {lastTx && (
        <View style={s.successBox}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <CheckCircle2 size={22} color="#34D399" /><Text style={s.successTitle}>Transaction {mode==='CHECKOUT'?'Issued':'Returned'} Successfully!</Text>
          </View>
          <View style={s.receiptBox}>
            <Text style={s.receiptLine}>Title: <Text style={{fontWeight:'800',color:'#FFF'}}>{lastTx.book_title}</Text></Text>
            <Text style={s.receiptLine}>Borrower: <Text style={{fontWeight:'800',color:'#14B8A6'}}>{lastTx.user_name} ({lastTx.student_staff_id})</Text></Text>
            <Text style={s.receiptLine}>Due Date: <Text style={{fontWeight:'800',color:'#FBBF24'}}>{new Date(lastTx.due_date).toLocaleDateString()}</Text></Text>
            {lastTx.fine_assessed && <View style={s.fineAlert}><Text style={s.fineAlertText}>⚠️ Penalty: ${lastTx.fine_assessed.amount} ({lastTx.fine_assessed.overdue_days} days late)</Text></View>}
          </View>
        </View>
      )}
    </ScrollView>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#020617' },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 6, borderRadius: 16, marginBottom: 24, gap: 6 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modeBtnText: { fontWeight: '800', fontSize: 13 },
  scanFrame: { backgroundColor: '#0F172A', borderWidth: 2, borderStyle: 'dashed', borderColor: 'rgba(20,184,166,0.5)', borderRadius: 24, padding: 24, alignItems: 'center', marginBottom: 24 },
  scanIcon: { width: 64, height: 64, backgroundColor: 'rgba(20,184,166,0.2)', borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(20,184,166,0.4)', marginBottom: 12 },
  scanTitle: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  scanSub: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  sampleRow: { marginTop: 16, flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center' },
  sampleBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#1E293B', backgroundColor: '#020617' },
  sampleText: { color: '#5EEAD4', fontSize: 11, fontFamily: 'monospace' },
  formCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 20, borderRadius: 24, marginBottom: 24 },
  formLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8, marginBottom: 16 },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontFamily: 'monospace' },
  processBtn: { paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  processBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  errorBox: { backgroundColor: 'rgba(159,18,57,0.5)', borderWidth: 1, borderColor: 'rgba(251,113,133,0.5)', padding: 16, borderRadius: 16, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  errorText: { color: '#FECDD3', fontSize: 13, flex: 1 },
  successBox: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', padding: 20, borderRadius: 24, marginBottom: 24 },
  successTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  receiptBox: { backgroundColor: '#020617', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', gap: 8 },
  receiptLine: { color: '#CBD5E1', fontSize: 12 },
  fineAlert: { backgroundColor: 'rgba(159,18,57,0.4)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', marginTop: 8 },
  fineAlertText: { color: '#FDA4AF', fontSize: 12, fontWeight: '800' },
});
