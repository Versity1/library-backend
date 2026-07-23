import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Modal, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, ArrowLeftRight, ArrowLeft, HelpCircle, CheckCircle2, ShieldAlert, BookOpen, User, X } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Transaction } from '../../../domain/types';
import { Badge } from '../../components/Badge';

export const QRCheckoutScannerScreen: React.FC = () => {
  const [mode, setMode] = useState<'CHECKOUT' | 'RETURN'>('CHECKOUT');
  const [studentStaffId, setStudentStaffId] = useState('STU-4829');
  
  // Camera & Scanning State
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  
  // Processing State
  const [loading, setLoading] = useState(false);
  const [lastTx, setLastTx] = useState<Transaction | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  const openScanner = async () => {
    if (!permission?.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert('Permission Denied', 'Camera access is required to scan QR codes.');
        return;
      }
    }
    setScannedPayload(null);
    setIsScannerOpen(true);
  };

  const handleBarCodeScanned = ({ type, data }: { type: string, data: string }) => {
    if (scannedPayload) return;
    
    // Smart Parsing
    if (data.startsWith('STU-') || data.startsWith('STAFF-')) {
      setStudentStaffId(data);
      Alert.alert('Student ID Scanned', `ID updated to ${data}`);
      setScannedPayload(null); // Keep scanning
    } else {
      setScannedPayload(data);
    }
  };

  const handleConfirmTransaction = async () => {
    if (!scannedPayload) return;
    if (mode === 'CHECKOUT' && !studentStaffId) {
      Alert.alert('Missing ID', 'Please enter or scan a Student/Staff ID first.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'CHECKOUT') {
        const r = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.CHECKOUT, {
          student_staff_id: studentStaffId,
          qr_code_id: scannedPayload,
        });
        setLastTx(r.data);
      } else {
        const r = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.RETURN, {
          qr_code_id: scannedPayload,
        });
        setLastTx(r.data);
      }
      setIsScannerOpen(false);
      Alert.alert('Success', `Book successfully ${mode === 'CHECKOUT' ? 'issued' : 'returned'}!`);
    } catch (e: any) {
      Alert.alert('Transaction Failed', e.response?.data?.error || 'Unknown error occurred.');
      setScannedPayload(null); // Reset scan to try again
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.bg}>
      {/* Standard Setup Form (Behind the Modal) */}
      <View style={{ padding: 16 }}>
        <View style={s.modeSwitch}>
          <TouchableOpacity onPress={() => setMode('CHECKOUT')} style={[s.modeBtn, mode === 'CHECKOUT' && { backgroundColor: '#0D9488' }]}>
            <QrCode size={18} color={mode === 'CHECKOUT' ? '#FFF' : '#94A3B8'} />
            <Text style={[s.modeBtnText, mode === 'CHECKOUT' ? { color: '#FFF' } : { color: '#94A3B8' }]}>Issue / Check-out</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMode('RETURN')} style={[s.modeBtn, mode === 'RETURN' && { backgroundColor: '#3B82F6' }]}>
            <ArrowLeftRight size={18} color={mode === 'RETURN' ? '#FFF' : '#94A3B8'} />
            <Text style={[s.modeBtnText, mode === 'RETURN' ? { color: '#FFF' } : { color: '#94A3B8' }]}>Process Return</Text>
          </TouchableOpacity>
        </View>

        {mode === 'CHECKOUT' && (
          <View style={{ marginBottom: 24 }}>
            <Text style={s.formLabel}>STUDENT / STAFF ID</Text>
            <View style={s.inputRow}>
              <User size={18} color="#64748B" />
              <TextInput style={s.input} placeholder="e.g. STU-4829" placeholderTextColor="#475569" value={studentStaffId} onChangeText={setStudentStaffId} />
            </View>
          </View>
        )}

        <TouchableOpacity onPress={openScanner} style={s.activateScannerBtn}>
          <QrCode size={24} color="#FFF" />
          <Text style={s.activateScannerText}>Activate Camera Scanner</Text>
        </TouchableOpacity>

        {lastTx && (
          <View style={s.successBox}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <CheckCircle2 size={22} color="#34D399" />
              <Text style={s.successTitle}>Transaction {mode === 'CHECKOUT' ? 'Issued' : 'Returned'} Successfully!</Text>
            </View>
            <View style={s.receiptBox}>
              <Text style={s.receiptLine}>Title: <Text style={{ fontWeight: '800', color: '#FFF' }}>{lastTx.book_title}</Text></Text>
              <Text style={s.receiptLine}>Borrower: <Text style={{ fontWeight: '800', color: '#14B8A6' }}>{lastTx.user_name} ({lastTx.student_staff_id})</Text></Text>
              <Text style={s.receiptLine}>Due Date: <Text style={{ fontWeight: '800', color: '#FBBF24' }}>{new Date(lastTx.due_date).toLocaleDateString()}</Text></Text>
              {lastTx.fine_assessed && (
                <View style={s.fineAlert}>
                  <Text style={s.fineAlertText}>⚠️ Penalty: ${lastTx.fine_assessed.amount} ({lastTx.fine_assessed.overdue_days} days late)</Text>
                </View>
              )}
            </View>
          </View>
        )}
      </View>

      {/* FULL SCREEN CAMERA MODAL */}
      <Modal visible={isScannerOpen} animationType="slide" transparent={false}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView 
            style={StyleSheet.absoluteFillObject} 
            facing="back"
            onBarcodeScanned={scannedPayload ? undefined : handleBarCodeScanned}
            barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
          />
          
          {/* Dark Overlay Layer */}
          <View style={s.overlayTop}>
            <View style={s.camHeader}>
              <TouchableOpacity onPress={() => setIsScannerOpen(false)} style={s.iconBtn}>
                <ArrowLeft size={24} color="#FFF" />
              </TouchableOpacity>
              <Text style={s.camTitle}>Scan Item</Text>
              <TouchableOpacity style={s.iconBtn}>
                <HelpCircle size={24} color="#FFF" />
              </TouchableOpacity>
            </View>
            
            <View style={s.pillInstruction}>
              <Text style={s.pillText}>Center the book's QR code within the frame</Text>
            </View>
          </View>

          <View style={s.overlayMiddleRow}>
            <View style={s.overlaySide} />
            <View style={s.scannerFrame}>
              <View style={s.cornerTL} />
              <View style={s.cornerTR} />
              <View style={s.cornerBL} />
              <View style={s.cornerBR} />
            </View>
            <View style={s.overlaySide} />
          </View>

          <View style={s.overlayBottom} />

          {/* Bottom Sheet Pending Checkout */}
          {scannedPayload && (
            <View style={s.bottomSheet}>
              <View style={s.sheetHandle} />
              
              <View style={s.sheetHeader}>
                <Text style={s.sheetTitle}>{mode === 'CHECKOUT' ? 'Pending Check-out' : 'Pending Return'}</Text>
                <View style={s.itemBadge}><Text style={s.itemBadgeText}>1 Item</Text></View>
              </View>

              <View style={s.scannedCard}>
                <View style={s.bookPlaceholder}>
                  <BookOpen size={24} color="#94A3B8" />
                </View>
                <View style={{ flex: 1 }}>
                  {/* We hardcode the title from mockup to simulate book fetch, or use payload */}
                  <Text style={s.bookTitle} numberOfLines={1}>Introduction to Algorithms</Text>
                  <Text style={s.bookAuthor}>Thomas H. Cormen</Text>
                  <Text style={s.bookIsbn}>ID: {scannedPayload}</Text>
                </View>
                <TouchableOpacity onPress={() => setScannedPayload(null)} style={{ padding: 8 }}>
                  <X size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              <TouchableOpacity onPress={handleConfirmTransaction} disabled={loading} style={s.confirmBtn}>
                {loading ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <CheckCircle2 size={18} color="#FFF" />
                    <Text style={s.confirmBtnText}>{mode === 'CHECKOUT' ? 'Confirm Check-out' : 'Confirm Return'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

const overlayColor = 'rgba(0, 0, 0, 0.7)';
const frameSize = 250;

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#020617' },
  modeSwitch: { flexDirection: 'row', backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', padding: 6, borderRadius: 16, marginBottom: 24, gap: 6 },
  modeBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  modeBtnText: { fontWeight: '800', fontSize: 13 },
  formLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 8, letterSpacing: 1 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, gap: 8 },
  input: { flex: 1, color: '#FFF', fontSize: 15, fontFamily: 'monospace' },
  activateScannerBtn: { backgroundColor: '#14B8A6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 18, borderRadius: 16, gap: 12, marginTop: 16 },
  activateScannerText: { color: '#FFF', fontSize: 16, fontWeight: '800' },
  
  // Camera UI
  camHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 60, paddingBottom: 20 },
  iconBtn: { padding: 8 },
  camTitle: { color: '#FFF', fontSize: 18, fontWeight: '800' },
  pillInstruction: { backgroundColor: 'rgba(0,0,0,0.8)', alignSelf: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999, marginTop: 20 },
  pillText: { color: '#94A3B8', fontSize: 13 },
  
  // Overlay Layout
  overlayTop: { flex: 1, backgroundColor: overlayColor },
  overlayBottom: { flex: 1, backgroundColor: overlayColor },
  overlayMiddleRow: { flexDirection: 'row', height: frameSize },
  overlaySide: { flex: 1, backgroundColor: overlayColor },
  scannerFrame: { width: frameSize, height: frameSize, backgroundColor: 'transparent' },
  
  // Teal Brackets
  cornerTL: { position: 'absolute', top: 0, left: 0, width: 40, height: 40, borderTopWidth: 4, borderLeftWidth: 4, borderColor: '#14B8A6', borderTopLeftRadius: 16 },
  cornerTR: { position: 'absolute', top: 0, right: 0, width: 40, height: 40, borderTopWidth: 4, borderRightWidth: 4, borderColor: '#14B8A6', borderTopRightRadius: 16 },
  cornerBL: { position: 'absolute', bottom: 0, left: 0, width: 40, height: 40, borderBottomWidth: 4, borderLeftWidth: 4, borderColor: '#14B8A6', borderBottomLeftRadius: 16 },
  cornerBR: { position: 'absolute', bottom: 0, right: 0, width: 40, height: 40, borderBottomWidth: 4, borderRightWidth: 4, borderColor: '#14B8A6', borderBottomRightRadius: 16 },

  // Bottom Sheet
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 999, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  itemBadge: { backgroundColor: '#EFF6FF', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  itemBadgeText: { color: '#3B82F6', fontSize: 12, fontWeight: '800' },
  scannedCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', padding: 12, borderRadius: 16, marginBottom: 24, gap: 12 },
  bookPlaceholder: { width: 50, height: 75, backgroundColor: '#E2E8F0', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  bookTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  bookAuthor: { color: '#64748B', fontSize: 12, marginTop: 2 },
  bookIsbn: { color: '#94A3B8', fontSize: 10, marginTop: 6, fontFamily: 'monospace' },
  confirmBtn: { backgroundColor: '#14B8A6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, borderRadius: 12, gap: 8 },
  confirmBtnText: { color: '#FFF', fontSize: 16, fontWeight: '800' },

  // Receipt Box (behind modal)
  successBox: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: 'rgba(52,211,153,0.4)', padding: 20, borderRadius: 24, marginTop: 24 },
  successTitle: { color: '#FFF', fontWeight: '800', fontSize: 16 },
  receiptBox: { backgroundColor: '#020617', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#1E293B', gap: 8 },
  receiptLine: { color: '#CBD5E1', fontSize: 12 },
  fineAlert: { backgroundColor: 'rgba(159,18,57,0.4)', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251,113,133,0.3)', marginTop: 8 },
  fineAlertText: { color: '#FDA4AF', fontSize: 12, fontWeight: '800' },
});
