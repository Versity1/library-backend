import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Alert, StyleSheet, Platform, RefreshControl } from 'react-native';
import { Search, QrCode, Bookmark, Heart, ArrowLeft, BookOpen, MapPin, Calendar, Hash, CheckCircle2, RotateCcw, Layers } from 'lucide-react-native';
import { Book } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { useAuth } from '../../context/AuthContext';

interface SmartCatalogScreenProps {
  onNavigateScan?: () => void;
}

const CATEGORY_FILTERS = ['All Resources', 'Computer Science', 'Literature', 'Mathematics', 'Economics'];

const INITIAL_BOOKS: Book[] = [];

export const SmartCatalogScreen: React.FC<SmartCatalogScreenProps> = ({ onNavigateScan }) => {
  const { user } = useAuth();
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Resources');
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [borrowedBookIds, setBorrowedBookIds] = useState<string[]>([]);
  const [wishlistedBookIds, setWishlistedBookIds] = useState<string[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINTS.CATALOG.BOOKS}?search=${encodeURIComponent(searchQuery)}`;
      const [res, loansRes] = await Promise.all([
        apiClient.get(url),
        apiClient.get(API_ENDPOINTS.TRANSACTIONS.MY_LOANS).catch(() => ({ data: [] }))
      ]);

      const apiBooks = res.data.results || res.data;
      if (Array.isArray(apiBooks)) {
        setBooks(apiBooks);
      }

      const rawLoans = loansRes.data?.results || loansRes.data || [];
      if (Array.isArray(rawLoans)) {
        const activeBorrowedBookIds = rawLoans
          .filter((l: any) => (l.status === 'BORROWED' || l.status === 'OVERDUE') && l.book_id)
          .map((l: any) => l.book_id);
        setBorrowedBookIds(activeBorrowedBookIds);
      }
    } catch (err) {
      console.log('Error fetching catalog dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBorrow = async (book: Book) => {
    if (book.available_copies <= 0) {
      Alert.alert('Unavailable', 'No copies currently available for immediate checkout. Please use "Reserve Book".');
      return;
    }
    setActionLoading('borrow');
    try {
      await apiClient.post(API_ENDPOINTS.TRANSACTIONS.CHECKOUT, {
        student_staff_id: user?.student_staff_id,
        book_id: book.id,
      });
      setBorrowedBookIds(prev => [...prev, book.id]);
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available_copies: Math.max(0, b.available_copies - 1) } : b));
      if (selectedBook && selectedBook.id === book.id) {
        setSelectedBook(prev => prev ? { ...prev, available_copies: Math.max(0, prev.available_copies - 1) } : null);
      }
      Alert.alert('Borrow Successful!', `You have checked out "${book.title}". Please collect it from ${book.location_shelf}.`);
    } catch (err: any) {
      Alert.alert('Borrow Error', err.response?.data?.error || err.response?.data?.detail || 'Failed to checkout book.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReturn = async (book: Book) => {
    setActionLoading('return');
    try {
      await apiClient.post(API_ENDPOINTS.TRANSACTIONS.RETURN, {
        book_id: book.id,
        user_id: user?.id,
      });
      setBorrowedBookIds(prev => prev.filter(id => id !== book.id));
      setBooks(prev => prev.map(b => b.id === book.id ? { ...b, available_copies: b.available_copies + 1 } : b));
      if (selectedBook && selectedBook.id === book.id) {
        setSelectedBook(prev => prev ? { ...prev, available_copies: prev.available_copies + 1 } : null);
      }
      Alert.alert('Return Successful!', `"${book.title}" has been returned to the library.`);
    } catch (err: any) {
      Alert.alert('Return Error', err.response?.data?.error || err.response?.data?.detail || 'Failed to process return.');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReserve = async (book: Book) => {
    setActionLoading('reserve');
    try {
      const res = await apiClient.post(API_ENDPOINTS.RESERVATIONS.RESERVE, { book_id: book.id });
      Alert.alert('Reservation Confirmed!', `Hold placed for "${book.title}". Queue Position: #${res.data?.queue_position || 1}`);
    } catch (err: any) {
      Alert.alert('Reservation Error', err.response?.data?.error || err.response?.data?.detail || 'Failed to place hold on title.');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleWishlist = (bookId: string) => {
    const isWish = wishlistedBookIds.includes(bookId);
    if (isWish) {
      setWishlistedBookIds(prev => prev.filter(id => id !== bookId));
      Alert.alert('Wishlist Updated', 'Book removed from your saved list.');
    } else {
      setWishlistedBookIds(prev => [...prev, bookId]);
      Alert.alert('Wishlist Updated', 'Book saved to your wishlist!');
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  return (
    <View style={s.bg}>
      {/* Top Search Bar & Scan Button */}
      <View style={s.topArea}>
        <View style={s.searchBox}>
          <Search size={20} color="#64748B" style={{ marginRight: 10 }} />
          <TextInput 
            style={s.searchInput} 
            placeholder="Search by ISBN, Title, or Author..." 
            placeholderTextColor="#94A3B8" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
        </View>

        <TouchableOpacity onPress={onNavigateScan} style={s.scanQrBtn} activeOpacity={0.8}>
          <QrCode size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={s.scanQrBtnText}>Scan QR</Text>
        </TouchableOpacity>

        {/* Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>
          {CATEGORY_FILTERS.map(cat => (
            <TouchableOpacity 
              key={cat} 
              onPress={() => setActiveCategory(cat)} 
              style={[s.filterPill, activeCategory === cat && s.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[s.filterPillText, activeCategory === cat && s.filterPillTextActive]}>{cat}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Book Catalog List */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A192F']} tintColor="#0A192F" />}
      >
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#0A192F" /></View>
        ) : (
          <View style={s.bookList}>
            {books.map((book) => {
              const isAvailable = book.available_copies > 0;
              const isReference = book.id === 'b3' || book.location_shelf.includes('Reference');
              const isBorrowed = borrowedBookIds.includes(book.id);
              
              return (
                <TouchableOpacity key={book.id} onPress={() => setSelectedBook(book)} style={s.bookCard} activeOpacity={0.85}>
                  <View style={s.cardCoverBox}>
                    {book.cover_image_url ? (
                      <Image source={{ uri: book.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                    ) : (
                      <BookOpen size={32} color="#CBD5E1" />
                    )}
                  </View>

                  <View style={s.cardContent}>
                    <Text style={s.cardTitle} numberOfLines={1}>{book.title}</Text>
                    <Text style={s.cardAuthor}>{book.author}</Text>
                    <Text style={s.cardIsbn}>ISBN: {book.isbn}</Text>

                    <View style={s.cardFooterRow}>
                      {isBorrowed ? (
                        <View style={[s.availablePill, { backgroundColor: '#EFF6FF' }]}>
                          <Text style={[s.availablePillText, { color: '#2563EB' }]}>• Borrowed by You</Text>
                        </View>
                      ) : isReference ? (
                        <View style={s.referencePill}>
                          <BookOpen size={12} color="#475569" style={{ marginRight: 4 }} />
                          <Text style={s.referencePillText}>Reference Only</Text>
                        </View>
                      ) : isAvailable ? (
                        <View style={s.availablePill}>
                          <Text style={s.availablePillText}>• Available</Text>
                        </View>
                      ) : (
                        <View style={s.checkedOutPill}>
                          <Text style={s.checkedOutPillText}>• Checked Out</Text>
                        </View>
                      )}

                      <Text style={s.copiesText}>
                        {isBorrowed ? 'Active Loan' : !isAvailable && !isReference ? 'In Hold Queue' : `${book.available_copies} ${book.available_copies === 1 ? 'copy' : 'copies'}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Book Details Modal */}
      {selectedBook && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            {/* Fixed Top Header Bar */}
            <View style={s.modalHeaderBar}>
              <TouchableOpacity onPress={() => setSelectedBook(null)} style={s.backBar} activeOpacity={0.7}>
                <ArrowLeft size={20} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={s.backBarText}>Back to Catalog</Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Modal Content */}
            <ScrollView style={{ flex: 1 }} contentContainerStyle={s.modalScrollContent} showsVerticalScrollIndicator={true}>
              {/* Large Centered Book Cover Card */}
              <View style={s.modalCoverCard}>
                <Image 
                  source={{ uri: selectedBook.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop' }} 
                  style={s.modalCoverImage} 
                  resizeMode="cover"
                />
              </View>

              {/* Title & Author */}
              <View style={{ marginBottom: 16 }}>
                <Text style={s.infoTitle}>{selectedBook.title}</Text>
                <Text style={s.infoAuthor}>by {selectedBook.author}</Text>
              </View>

              {/* Metadata Grid (Shelf, ISBN, Date Published, Stock) */}
              <View style={s.metaGrid}>
                <View style={s.metaCard}>
                  <MapPin size={16} color="#14B8A6" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>Shelf Location</Text>
                  <Text style={s.metaValue} numberOfLines={2}>{selectedBook.location_shelf || 'Main Stacks'}</Text>
                </View>

                <View style={s.metaCard}>
                  <Hash size={16} color="#3B82F6" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>ISBN</Text>
                  <Text style={s.metaValue} numberOfLines={1}>{selectedBook.isbn}</Text>
                </View>

                <View style={s.metaCard}>
                  <Calendar size={16} color="#8B5CF6" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>Date Published</Text>
                  <Text style={s.metaValue}>{selectedBook.publication_year || (selectedBook.created_at ? new Date(selectedBook.created_at).getFullYear() : '2023')}</Text>
                </View>

                <View style={s.metaCard}>
                  <Layers size={16} color="#F59E0B" style={{ marginBottom: 6 }} />
                  <Text style={s.metaLabel}>Availability</Text>
                  <Text style={[s.metaValue, { color: selectedBook.available_copies > 0 ? '#15803D' : '#DC2626' }]}>
                    {selectedBook.available_copies}/{selectedBook.total_copies} Copies
                  </Text>
                </View>
              </View>

              {/* Book Description */}
              <View style={s.descSection}>
                <Text style={s.descHeading}>About this Book</Text>
                <Text style={s.descText}>{selectedBook.description || 'No detailed description available for this catalog item.'}</Text>
              </View>

              {/* Call to Actions */}
              <View style={s.ctaSection}>
                {borrowedBookIds.includes(selectedBook.id) ? (
                  /* Return Book CTA if already borrowed */
                  <TouchableOpacity 
                    onPress={() => handleReturn(selectedBook)} 
                    disabled={actionLoading === 'return'} 
                    style={[s.actionBtnPrimary, { backgroundColor: '#3B82F6' }]} 
                    activeOpacity={0.85}
                  >
                    {actionLoading === 'return' ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <>
                        <RotateCcw size={18} color="#FFF" style={{ marginRight: 8 }} />
                        <Text style={s.actionBtnText}>Return Book</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <>
                    {/* Borrow Book CTA */}
                    <TouchableOpacity 
                      onPress={() => handleBorrow(selectedBook)} 
                      disabled={actionLoading === 'borrow' || selectedBook.available_copies <= 0} 
                      style={[s.actionBtnPrimary, selectedBook.available_copies <= 0 && { backgroundColor: '#94A3B8' }]} 
                      activeOpacity={0.85}
                    >
                      {actionLoading === 'borrow' ? (
                        <ActivityIndicator color="#FFF" />
                      ) : (
                        <>
                          <CheckCircle2 size={18} color="#FFF" style={{ marginRight: 8 }} />
                          <Text style={s.actionBtnText}>
                            {selectedBook.available_copies > 0 ? 'Borrow Book' : 'Out of Stock'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    {/* Reserve Book CTA */}
                    <TouchableOpacity 
                      onPress={() => handleReserve(selectedBook)} 
                      disabled={actionLoading === 'reserve'} 
                      style={s.actionBtnSecondary} 
                      activeOpacity={0.85}
                    >
                      {actionLoading === 'reserve' ? (
                        <ActivityIndicator color="#0A192F" />
                      ) : (
                        <>
                          <Bookmark size={18} color="#0A192F" style={{ marginRight: 8 }} />
                          <Text style={s.actionBtnSecondaryText}>Reserve Book</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </>
                )}

                {/* Wishlist CTA */}
                <TouchableOpacity 
                  onPress={() => toggleWishlist(selectedBook.id)} 
                  style={[s.wishlistBtn, wishlistedBookIds.includes(selectedBook.id) && { borderColor: '#EF4444', backgroundColor: '#FEF2F2' }]} 
                  activeOpacity={0.85}
                >
                  <Heart 
                    size={18} 
                    color={wishlistedBookIds.includes(selectedBook.id) ? "#EF4444" : "#0A192F"} 
                    fill={wishlistedBookIds.includes(selectedBook.id) ? "#EF4444" : "none"} 
                    style={{ marginRight: 8 }} 
                  />
                  <Text style={[s.wishlistBtnText, wishlistedBookIds.includes(selectedBook.id) && { color: '#EF4444' }]}>
                    {wishlistedBookIds.includes(selectedBook.id) ? 'Saved to Wishlist' : 'Add to Wishlist'}
                  </Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </View>
        </Modal>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  topArea: { paddingHorizontal: 16, paddingTop: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 46, marginBottom: 12 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 14 },

  scanQrBtn: { flexDirection: 'row', backgroundColor: '#0A192F', height: 46, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  scanQrBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  filterPillActive: { backgroundColor: '#0A192F', borderColor: '#0A192F' },
  filterPillText: { color: '#0F172A', fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },

  bookList: { gap: 14, paddingTop: 8 },
  bookCard: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 12, gap: 14 },
  cardCoverBox: { width: 90, height: 125, borderRadius: 6, overflow: 'hidden', backgroundColor: '#F1F5F9' },
  cardContent: { flex: 1, justifyContent: 'center' },
  cardTitle: { color: '#0A192F', fontSize: 17, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 4 },
  cardAuthor: { color: '#475569', fontSize: 13, marginBottom: 4 },
  cardIsbn: { color: '#94A3B8', fontSize: 11, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 12 },

  cardFooterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  availablePill: { backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  availablePillText: { color: '#15803D', fontSize: 12, fontWeight: '700' },

  checkedOutPill: { backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  checkedOutPillText: { color: '#475569', fontSize: 12, fontWeight: '700' },

  referencePill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E2E8F0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  referencePillText: { color: '#475569', fontSize: 12, fontWeight: '700' },

  copiesText: { color: '#64748B', fontSize: 12, fontWeight: '600' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeaderBar: { backgroundColor: '#F8FAFC', paddingHorizontal: 20, paddingTop: Platform.OS === 'ios' ? 44 : 16, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: '#E2E8F0', zIndex: 10 },
  modalScrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 60 },

  backBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  backBarText: { color: '#0F172A', fontSize: 15, fontWeight: '700' },

  modalCoverCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, height: 380 },
  modalCoverImage: { width: '80%', height: '100%', borderRadius: 8 },

  infoTitle: { color: '#0A192F', fontSize: 24, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 30, marginBottom: 4 },
  infoAuthor: { color: '#64748B', fontSize: 15, fontWeight: '600' },

  metaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  metaCard: { width: '48%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, padding: 12 },
  metaLabel: { color: '#64748B', fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 2 },
  metaValue: { color: '#0A192F', fontSize: 13, fontWeight: '700' },

  descSection: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', padding: 16, marginBottom: 24 },
  descHeading: { color: '#0A192F', fontSize: 16, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', marginBottom: 8 },
  descText: { color: '#475569', fontSize: 14, lineHeight: 22 },

  ctaSection: { gap: 12, marginBottom: 32 },
  actionBtnPrimary: { flexDirection: 'row', backgroundColor: '#0A192F', height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  actionBtnSecondary: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  actionBtnSecondaryText: { color: '#0A192F', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  wishlistBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0A192F', height: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  wishlistBtnText: { color: '#0A192F', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
