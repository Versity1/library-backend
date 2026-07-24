import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, StyleSheet, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { QrCode, ArrowLeft, HelpCircle, CheckCircle2, BookOpen, X, MapPin } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { useAuth } from '../../context/AuthContext';

export const ScannerScreen: React.FC = () => {
  const { user } = useAuth();
  
  // Camera State
  const [permission, requestPermission] = useCameraPermissions();
  const [scannedPayload, setScannedPayload] = useState<string | null>(null);
  
  // Book Copy State
  const [loadingCopy, setLoadingCopy] = useState(false);
  const [copyDetails, setCopyDetails] = useState<any>(null);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Transaction State
  const [studentStaffId, setStudentStaffId] = useState(user?.role === 'STUDENT' ? user.student_staff_id : '');
  const [loadingTx, setLoadingTx] = useState(false);
  const [lastTx, setLastTx] = useState<any>(null);

  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, [permission]);

  const handleBarCodeScanned = async ({ type, data }: { type: string, data: string }) => {
    if (scannedPayload || loadingCopy || lastTx) return;
    
    setScannedPayload(data);
    setLoadingCopy(true);
    setCopyDetails(null);
    setLastTx(null);
    
    try {
      const response = await apiClient.get(`${API_ENDPOINTS.CATALOG.SCAN}?qr_code_id=${data}`);
      setCopyDetails(response.data);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to fetch book details.');
    } finally {
      setLoadingCopy(false);
    }
  };

  const handleTransaction = async (action: 'CHECKOUT' | 'RETURN') => {
    if (!copyDetails) return;
    
    if (action === 'CHECKOUT' && user?.role !== 'STUDENT' && !studentStaffId) {
      Alert.alert('Missing ID', 'Please enter a Student/Staff ID first.');
      return;
    }

    setLoadingTx(true);
    try {
      if (action === 'CHECKOUT') {
        const r = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.CHECKOUT, {
          student_staff_id: studentStaffId,
          qr_code_id: copyDetails.qr_code_id,
        });
        setLastTx({ ...r.data, mode: 'CHECKOUT' });
      } else {
        const r = await apiClient.post(API_ENDPOINTS.TRANSACTIONS.RETURN, {
          qr_code_id: copyDetails.qr_code_id,
        });
        setLastTx({ ...r.data, mode: 'RETURN' });
      }
      setCopyDetails(null);
      setScannedPayload(null);
    } catch (e: any) {
      Alert.alert('Transaction Failed', e.response?.data?.error || 'Unknown error occurred.');
    } finally {
      setLoadingTx(false);
    }
  };

  const resetScanner = () => {
    setScannedPayload(null);
    setCopyDetails(null);
    setLastTx(null);
    setErrorMsg(null);
  };

  if (!permission) {
    return <View style={s.bg}><ActivityIndicator color="#14B8A6" /></View>;
  }
  
  if (!permission.granted) {
    return (
      <View style={[s.bg, { alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: '#FFF' }}>Camera access is required.</Text>
        <TouchableOpacity onPress={requestPermission} style={s.confirmBtn}>
          <Text style={s.confirmBtnText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.bg}>
      <CameraView 
        style={StyleSheet.absoluteFillObject} 
        facing="back"
        onBarcodeScanned={scannedPayload || lastTx ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      
      {/* Dark Overlay Layer */}
      <View style={s.overlayTop}>
        <View style={s.camHeader}>
          <TouchableOpacity style={s.iconBtn}>
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

      {/* Loading indicator when fetching book details */}
      {loadingCopy && (
        <View style={s.bottomSheet}>
          <ActivityIndicator size="large" color="#14B8A6" />
          <Text style={{ textAlign: 'center', marginTop: 12, color: '#64748B' }}>Fetching book details...</Text>
        </View>
      )}

      {/* Error State */}
      {errorMsg && !loadingCopy && (
        <View style={s.bottomSheet}>
          <View style={s.sheetHandle} />
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <X size={48} color="#EF4444" />
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 12 }}>
              Scan Error
            </Text>
            <Text style={{ fontSize: 15, color: '#64748B', marginTop: 8, textAlign: 'center' }}>
              {errorMsg}
            </Text>
          </View>
          <TouchableOpacity onPress={resetScanner} style={[s.confirmBtn, { backgroundColor: '#EF4444' }]}>
            <Text style={s.confirmBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Scanned Book Details & Actions */}
      {copyDetails && !loadingCopy && (
        <View style={s.bottomSheet}>
          <View style={s.sheetHandle} />
          
          <View style={s.sheetHeader}>
            <Text style={s.sheetTitle}>Book Info</Text>
            <View style={[s.itemBadge, copyDetails.status === 'BORROWED' && { backgroundColor: '#FEF2F2' }]}>
              <Text style={[s.itemBadgeText, copyDetails.status === 'BORROWED' && { color: '#EF4444' }]}>
                {copyDetails.status}
              </Text>
            </View>
          </View>

          <View style={s.scannedCard}>
            <View style={s.bookPlaceholder}>
              {copyDetails.cover_image_url ? (
                <Image source={{ uri: copyDetails.cover_image_url }} style={{ width: '100%', height: '100%', borderRadius: 8 }} />
              ) : (
                <BookOpen size={24} color="#94A3B8" />
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.bookTitle} numberOfLines={1}>{copyDetails.book_title}</Text>
              <Text style={s.bookAuthor}>{copyDetails.book_author}</Text>
              <View style={s.locationRow}>
                <MapPin size={12} color="#14B8A6" />
                <Text style={s.bookLocation}>{copyDetails.location_shelf || 'Location Unknown'}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={resetScanner} style={{ padding: 8 }}>
              <X size={20} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          {/* Librarian only: Student ID Input for Checkout */}
          {user?.role !== 'STUDENT' && copyDetails.status === 'AVAILABLE' && (
            <View style={s.idInputContainer}>
              <Text style={s.idInputLabel}>Borrowing Student/Staff ID</Text>
              <TextInput 
                style={s.idInput} 
                placeholder="e.g. STU-1234" 
                value={studentStaffId} 
                onChangeText={setStudentStaffId} 
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          {/* Contextual Action Buttons */}
          <View style={{ flexDirection: 'row', gap: 12 }}>
            {copyDetails.status === 'AVAILABLE' && (
              <TouchableOpacity onPress={() => handleTransaction('CHECKOUT')} disabled={loadingTx} style={[s.confirmBtn, { flex: 1 }]}>
                {loadingTx ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <BookOpen size={18} color="#FFF" />
                    <Text style={s.confirmBtnText}>Borrow Book</Text>
                  </>
                )}
              </TouchableOpacity>
            )}
            
            {copyDetails.status === 'BORROWED' && (
              <TouchableOpacity onPress={() => handleTransaction('RETURN')} disabled={loadingTx} style={[s.confirmBtn, { flex: 1, backgroundColor: '#3B82F6' }]}>
                {loadingTx ? <ActivityIndicator color="#FFF" /> : (
                  <>
                    <ArrowLeft size={18} color="#FFF" />
                    <Text style={s.confirmBtnText}>Return Book</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* If user just wanted location, or it's not available/borrowed */}
            <TouchableOpacity onPress={resetScanner} style={s.secondaryBtn}>
              <Text style={s.secondaryBtnText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Transaction Success Overlay */}
      {lastTx && (
        <View style={s.bottomSheet}>
          <View style={s.sheetHandle} />
          <View style={{ alignItems: 'center', marginBottom: 16 }}>
            <CheckCircle2 size={48} color="#10B981" />
            <Text style={{ fontSize: 20, fontWeight: '800', color: '#0F172A', marginTop: 12 }}>
              {lastTx.mode === 'CHECKOUT' ? 'Borrow Successful' : 'Return Successful'}
            </Text>
          </View>
          <View style={s.scannedCard}>
             <View style={{ flex: 1 }}>
                <Text style={s.bookTitle}>{lastTx.book_title}</Text>
                <Text style={s.bookAuthor}>Borrower: {lastTx.user_name}</Text>
                {lastTx.mode === 'CHECKOUT' && (
                  <Text style={s.bookLocation}>Due: {new Date(lastTx.due_date).toLocaleDateString()}</Text>
                )}
             </View>
          </View>
          <TouchableOpacity onPress={resetScanner} style={s.confirmBtn}>
            <Text style={s.confirmBtnText}>Scan Next Item</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const overlayColor = 'rgba(0, 0, 0, 0.7)';
const frameSize = 250;

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#000' },
  
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
  bookPlaceholder: { width: 50, height: 75, backgroundColor: '#E2E8F0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bookTitle: { color: '#0F172A', fontSize: 14, fontWeight: '800' },
  bookAuthor: { color: '#64748B', fontSize: 12, marginTop: 2 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  bookLocation: { color: '#14B8A6', fontSize: 11, fontWeight: '700' },
  
  idInputContainer: { marginBottom: 16 },
  idInputLabel: { fontSize: 11, fontWeight: '700', color: '#64748B', marginBottom: 8, letterSpacing: 0.5 },
  idInput: { backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, color: '#0F172A', fontFamily: 'monospace' },

  confirmBtn: { backgroundColor: '#14B8A6', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12, gap: 8 },
  confirmBtnText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  secondaryBtn: { backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', paddingVertical: 16, paddingHorizontal: 20, borderRadius: 12 },
  secondaryBtnText: { color: '#475569', fontSize: 15, fontWeight: '800' },
});
