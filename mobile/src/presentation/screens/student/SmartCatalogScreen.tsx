import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Alert, StyleSheet } from 'react-native';
import { Search, Mic, Bookmark, SlidersHorizontal, BookOpen, QrCode } from 'lucide-react-native';
import { Book, Transaction } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';

interface SmartCatalogScreenProps {
  onNavigateScan?: () => void;
}

export const SmartCatalogScreen: React.FC<SmartCatalogScreenProps> = ({ onNavigateScan }) => {
  const [books, setBooks] = useState<Book[]>([]);
  const [myLoans, setMyLoans] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => {
    fetchBooks();
    fetchLoans();
  }, [searchQuery]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINTS.CATALOG.BOOKS}?search=${encodeURIComponent(searchQuery)}`;
      const res = await apiClient.get(url);
      setBooks(res.data.results || res.data);
    } catch (err) {
      console.log('Error fetching books:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLoans = async () => {
    try {
      const res = await apiClient.get(API_ENDPOINTS.TRANSACTIONS.MY_LOANS);
      setMyLoans(res.data.results || res.data);
    } catch (err) {
      console.log('Error fetching loans:', err);
    }
  };

  const handleReserve = async (book: Book) => {
    setReserving(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.RESERVATIONS.RESERVE, { book_id: book.id });
      Alert.alert('Reservation Confirmed!', `Hold placed for "${book.title}". Queue Position: #${res.data.queue_position}`);
      setSelectedBook(null);
    } catch (err: any) {
      Alert.alert('Hold Failed', err.response?.data?.error || 'Failed.');
    } finally {
      setReserving(false);
    }
  };

  const activeLoan = myLoans.length > 0 ? myLoans[0] : null;

  return (
    <View style={s.bg}>
      <View style={s.headerArea}>
        <View style={s.searchRow}>
          <TextInput 
            style={s.searchInput} 
            placeholder="Search catalog..." 
            placeholderTextColor="#64748B" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          {onNavigateScan && (
            <TouchableOpacity onPress={onNavigateScan}>
              <QrCode size={20} color="#0F172A" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
        
        {/* Continue Reading Section */}
        {activeLoan && (
          <View style={s.continueBox}>
            <Text style={s.sectionTitle}>Continue Reading</Text>
            <View style={s.readingCard}>
              <View style={s.readingCoverBox}>
                {activeLoan.cover_image_url ? (
                  <Image source={{ uri: activeLoan.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <BookOpen size={24} color="#94A3B8" />
                )}
              </View>
              <View style={{ flex: 1, marginLeft: 16, justifyContent: 'center' }}>
                <Text style={s.readingTitle} numberOfLines={1}>{activeLoan.book_title}</Text>
                <Text style={s.readingAuthor}>{activeLoan.author}</Text>
                <View style={s.progressMeta}>
                  <View style={s.progressBarBg}>
                    <View style={[s.progressBarFill, { width: '45%' }]} />
                  </View>
                  <Text style={s.progressPct}>45%</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Smart Recommendations */}
        {!searchQuery && books.length > 0 && (
          <View style={{ marginBottom: 24 }}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Recommended for You</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 16 }}>
              {books.slice(0, 5).map(book => (
                <TouchableOpacity key={`rec_${book.id}`} style={s.recCard} onPress={() => setSelectedBook(book)}>
                  <View style={s.recCoverBox}>
                    {book.cover_image_url ? (
                      <Image source={{ uri: book.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <BookOpen size={32} color="#94A3B8" />
                    )}
                  </View>
                  <Text style={s.recTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={s.recAuthor} numberOfLines={1}>{book.author}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <View style={s.sectionHeader}>
          <Text style={s.sectionTitle}>{searchQuery ? 'Search Results' : 'Explore Catalog'}</Text>
        </View>

        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#14B8A6" /></View>
        ) : (
          <View style={s.bookList}>
            {books.map((book) => (
              <TouchableOpacity key={book.id} onPress={() => setSelectedBook(book)} style={s.bookCard}>
                <View style={s.cardCoverBox}>
                  {book.cover_image_url ? (
                    <Image source={{ uri: book.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                  ) : (
                    <BookOpen size={32} color="#CBD5E1" />
                  )}
                </View>
                
                <View style={{ flex: 1, paddingLeft: 16 }}>
                  <View style={s.cardHeader}>
                    <View style={[s.statusBadge, { backgroundColor: book.available_copies > 0 ? '#6EE7B7' : '#E2E8F0' }]}>
                      <Text style={[s.statusBadgeText, { color: book.available_copies > 0 ? '#064E3B' : '#475569' }]}>
                        {book.available_copies > 0 ? 'AVAILABLE' : 'WAITLIST'}
                      </Text>
                    </View>
                    <Bookmark size={20} color="#0F172A" />
                  </View>
                  
                  <Text style={s.cardTitle} numberOfLines={1}>{book.title}</Text>
                  <Text style={s.cardAuthor}>{book.author}</Text>
                  
                  <View style={{ flex: 1, justifyContent: 'flex-end' }}>
                    <Text style={s.cardCategory}>{book.department || 'General Collection'}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Book Details Modal */}
      {selectedBook && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalBg}>
            <View style={s.modalCard}>
              <View style={s.modalHeaderRow}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={s.modalTitle}>{selectedBook.title}</Text>
                  <Text style={s.modalAuthor}>{selectedBook.author}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBook(null)} style={s.closeIconWrap}><Text style={s.closeX}>✕</Text></TouchableOpacity>
              </View>
              
              <View style={s.detailBox}>
                <Text style={s.detailLine}><Text style={s.detailLabel}>Location: </Text>{selectedBook.location_shelf}</Text>
                <Text style={s.detailLine}><Text style={s.detailLabel}>ISBN: </Text>{selectedBook.isbn}</Text>
                <Text style={s.detailLine}><Text style={s.detailLabel}>Copies: </Text>{selectedBook.total_copies} ({selectedBook.available_copies} Available)</Text>
                {selectedBook.description ? <Text style={s.descText}>{selectedBook.description}</Text> : null}
              </View>
              
              <TouchableOpacity onPress={() => handleReserve(selectedBook)} disabled={reserving} style={s.reserveBtn}>
                {reserving ? <ActivityIndicator color="#FFF" /> : <Bookmark size={18} color="#FFF" />}
                <Text style={s.reserveBtnText}>{reserving ? 'Processing...' : 'Reserve / Place Hold'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  headerArea: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 16, paddingHorizontal: 16, paddingVertical: 14, gap: 12 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 15 },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  sectionTitle: { fontSize: 20, fontWeight: '800', color: '#0F172A' },
  viewAllLink: { color: '#312E81', fontSize: 13, fontWeight: '700' },
  
  readingCard: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, padding: 16, flexDirection: 'row', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  readingCoverBox: { width: 80, height: 110, backgroundColor: '#E2E8F0', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  readingTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', marginBottom: 4 },
  readingAuthor: { fontSize: 13, color: '#64748B', marginBottom: 16 },
  progressMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  dueText: { fontSize: 11, color: '#475569', fontWeight: '600' },
  progressPct: { fontSize: 11, color: '#0F172A', fontWeight: '800' },
  progressBarBg: { flex: 1, height: 6, backgroundColor: '#E2E8F0', borderRadius: 999, marginRight: 12 },
  progressBarFill: { height: 6, backgroundColor: '#1E1B4B', borderRadius: 999 },
  
  continueBox: { marginBottom: 24 },
  recCard: { width: 120 },
  recCoverBox: { width: 120, height: 160, backgroundColor: '#F1F5F9', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  recTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  recAuthor: { fontSize: 11, color: '#64748B' },
  
  bookList: { gap: 16 },
  bookCard: { backgroundColor: '#FFF', borderRadius: 20, padding: 16, flexDirection: 'row', borderWidth: 1, borderColor: '#E2E8F0', elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 8 },
  cardCoverBox: { width: 100, height: 140, backgroundColor: '#F1F5F9', borderRadius: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusBadgeText: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  cardTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A', lineHeight: 22, marginBottom: 4 },
  cardAuthor: { fontSize: 13, color: '#64748B' },
  cardCategory: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  
  // Modal Styles
  modalBg: { flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 },
  modalTitle: { color: '#0F172A', fontSize: 22, fontWeight: '800', marginBottom: 4 },
  modalAuthor: { color: '#64748B', fontSize: 15 },
  closeIconWrap: { backgroundColor: '#F1F5F9', width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  closeX: { color: '#64748B', fontWeight: '800', fontSize: 16 },
  detailBox: { backgroundColor: '#F8FAFC', padding: 16, borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 24, gap: 10 },
  detailLine: { color: '#475569', fontSize: 14 },
  detailLabel: { fontWeight: '800', color: '#0F172A' },
  descText: { color: '#64748B', fontSize: 13, marginTop: 8, fontStyle: 'italic', lineHeight: 20 },
  reserveBtn: { backgroundColor: '#020617', paddingVertical: 16, borderRadius: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 },
  reserveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 16 },
});
