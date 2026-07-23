import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Alert, StyleSheet } from 'react-native';
import { Search, Bookmark, MapPin, BookOpen } from 'lucide-react-native';
import { Book } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Badge } from '../../components/Badge';

export const SmartCatalogScreen: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [reserving, setReserving] = useState(false);

  useEffect(() => { fetchBooks(); }, [searchQuery, availableOnly]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINTS.CATALOG.BOOKS}?search=${encodeURIComponent(searchQuery)}`;
      if (availableOnly) url += '&available_only=true';
      const res = await apiClient.get(url);
      setBooks(res.data.results || res.data);
    } catch (err) { console.log('Error:', err); }
    finally { setLoading(false); }
  };

  const handleReserve = async (book: Book) => {
    setReserving(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.RESERVATIONS.RESERVE, { book_id: book.id });
      Alert.alert('Reservation Confirmed!', `Hold placed for "${book.title}". Queue Position: #${res.data.queue_position}`);
      setSelectedBook(null);
    } catch (err: any) { Alert.alert('Hold Failed', err.response?.data?.error || 'Failed.'); }
    finally { setReserving(false); }
  };

  return (
    <View style={s.bg}>
      <View style={s.searchBar}>
        <View style={s.searchRow}>
          <Search size={18} color="#64748B" />
          <TextInput style={s.searchInput} placeholder="Search by Title, Author, ISBN..." placeholderTextColor="#475569" value={searchQuery} onChangeText={setSearchQuery} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
          <TouchableOpacity onPress={() => setAvailableOnly(!availableOnly)} style={[s.pill, availableOnly && s.pillActive]}>
            <Text style={[s.pillText, availableOnly && s.pillTextActive]}>Available Now</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>

      {loading ? (
        <View style={s.center}><ActivityIndicator size="large" color="#14B8A6" /><Text style={s.loadText}>Loading Catalog...</Text></View>
      ) : (
        <ScrollView style={{ flex: 1, padding: 16 }}>
          <Text style={s.countLabel}>Found {books.length} Titles</Text>
          {books.map((book) => (
            <TouchableOpacity key={book.id} onPress={() => setSelectedBook(book)} style={s.bookCard}>
              <View style={s.coverBox}>
                {book.cover_image_url ? <Image source={{ uri: book.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" /> : <BookOpen size={32} color="#475569" />}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.bookTitle} numberOfLines={1}>{book.title}</Text>
                <Text style={s.bookAuthor}>{book.author}</Text>
                <Text style={s.bookIsbn}>ISBN: {book.isbn}</Text>
                <View style={s.shelfRow}><MapPin size={13} color="#94A3B8" /><Text style={s.shelfText}>{book.location_shelf}</Text></View>
                <View style={s.bookFooter}>
                  <Badge label={book.available_copies > 0 ? `${book.available_copies} Available` : 'Out of Stock'} variant={book.available_copies > 0 ? 'success' : 'danger'} />
                  <Text style={s.detailLink}>View Details →</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {selectedBook && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalBg}>
            <View style={s.modalCard}>
              <View style={s.modalHeader}>
                <View style={{ flex: 1, paddingRight: 16 }}>
                  <Text style={s.modalTitle}>{selectedBook.title}</Text>
                  <Text style={s.modalAuthor}>{selectedBook.author}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedBook(null)}><Text style={s.closeX}>✕</Text></TouchableOpacity>
              </View>
              <View style={s.detailBox}>
                <Text style={s.detailLine}><Text style={s.detailLabel}>Department: </Text>{selectedBook.department || 'General'}</Text>
                <Text style={s.detailLine}><Text style={s.detailLabel}>Location: </Text>{selectedBook.location_shelf}</Text>
                <Text style={s.detailLine}><Text style={s.detailLabel}>Copies: </Text>{selectedBook.total_copies} ({selectedBook.available_copies} Available)</Text>
                {selectedBook.description ? <Text style={s.descText}>{selectedBook.description}</Text> : null}
              </View>
              <TouchableOpacity onPress={() => handleReserve(selectedBook)} disabled={reserving} style={s.reserveBtn}>
                <Bookmark size={18} color="#FFF" />
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
  bg: { flex: 1, backgroundColor: '#020617' },
  searchBar: { padding: 16, backgroundColor: '#0F172A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#020617', borderWidth: 1, borderColor: '#1E293B', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, gap: 8 },
  searchInput: { flex: 1, color: '#FFF', fontSize: 15 },
  pill: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999, borderWidth: 1, borderColor: '#1E293B', backgroundColor: '#020617', marginRight: 8 },
  pillActive: { backgroundColor: 'rgba(16,185,129,0.2)', borderColor: 'rgba(16,185,129,0.6)' },
  pillText: { fontSize: 11, fontWeight: '700', color: '#94A3B8' },
  pillTextActive: { color: '#34D399' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadText: { color: '#94A3B8', fontSize: 13, marginTop: 12 },
  countLabel: { color: '#94A3B8', fontSize: 11, fontWeight: '700', marginBottom: 12, textTransform: 'uppercase' },
  bookCard: { backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B', borderRadius: 16, padding: 16, marginBottom: 14, flexDirection: 'row', gap: 16 },
  coverBox: { width: 80, height: 112, backgroundColor: '#020617', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B', alignItems: 'center', justifyContent: 'center' },
  bookTitle: { color: '#FFF', fontWeight: '800', fontSize: 15 },
  bookAuthor: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  bookIsbn: { color: '#64748B', fontSize: 10, marginTop: 4 },
  shelfRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
  shelfText: { color: '#CBD5E1', fontSize: 11 },
  bookFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: 'rgba(30,41,59,0.8)' },
  detailLink: { color: '#14B8A6', fontSize: 11, fontWeight: '800' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0F172A', borderTopWidth: 1, borderTopColor: '#1E293B', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  modalTitle: { color: '#FFF', fontSize: 20, fontWeight: '800' },
  modalAuthor: { color: '#94A3B8', fontSize: 13, marginTop: 4 },
  closeX: { color: '#94A3B8', fontWeight: '800', fontSize: 18 },
  detailBox: { backgroundColor: '#020617', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', marginBottom: 16, gap: 8 },
  detailLine: { color: '#CBD5E1', fontSize: 12 },
  detailLabel: { fontWeight: '800', color: '#94A3B8' },
  descText: { color: '#94A3B8', fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  reserveBtn: { backgroundColor: '#0D9488', paddingVertical: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },
  reserveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
