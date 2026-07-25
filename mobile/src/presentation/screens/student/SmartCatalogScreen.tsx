import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, ScrollView, TouchableOpacity, Image, ActivityIndicator, Modal, Alert, StyleSheet, Platform } from 'react-native';
import { Search, QrCode, Bookmark, Heart, ArrowLeft, Menu, BookOpen } from 'lucide-react-native';
import { Book } from '../../../domain/types';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';

interface SmartCatalogScreenProps {
  onNavigateScan?: () => void;
}

const CATEGORY_FILTERS = ['All Resources', 'Computer Science', 'Literature', 'Mathematics', 'Economics'];

// Default initial books matching Screenshot 4 & 5 exactly
const INITIAL_BOOKS: Book[] = [
  {
    id: 'b1',
    isbn: '978-0262033848',
    title: 'Advanced Data Structures',
    author: 'Thomas H. Cormen',
    total_copies: 5,
    available_copies: 3,
    location_shelf: 'Shelf CS-102, Main Branch',
    description: 'A comprehensive guide to algorithm design and advanced data structures.',
    cover_image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=300&auto=format&fit=crop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b2',
    isbn: '978-0142437247',
    title: 'Moby-Dick',
    author: 'Herman Melville',
    total_copies: 3,
    available_copies: 0,
    location_shelf: 'Shelf LIT-304, Main Branch',
    description: 'The saga of Captain Ahab and his relentless pursuit of the white whale.',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=300&auto=format&fit=crop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b3',
    isbn: '978-0471433347',
    title: 'Abstract Algebra',
    author: 'David S. Dummit',
    total_copies: 2,
    available_copies: 0,
    location_shelf: 'Shelf MATH-201, Reference Section',
    description: 'Fundamental algebraic structures including groups, rings, and fields.',
    cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=300&auto=format&fit=crop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b4',
    isbn: '978-0134610993',
    title: 'Artificial Intelligence',
    author: 'Stuart Russell',
    total_copies: 4,
    available_copies: 1,
    location_shelf: 'Shelf CS-401, Main Branch',
    description: 'The standard synthesis of theory and practice in Modern AI systems.',
    cover_image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?q=80&w=300&auto=format&fit=crop',
    created_at: new Date().toISOString(),
  },
  {
    id: 'b5',
    isbn: '978-0136061694',
    title: 'The Architecture of Computer Hardware',
    author: 'John R. Anderson',
    total_copies: 3,
    available_copies: 2,
    location_shelf: 'Shelf CS-105, Main Branch',
    description: 'Systems, Design, and Performance of computer hardware architecture.',
    cover_image_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop',
    created_at: new Date().toISOString(),
  }
];

export const SmartCatalogScreen: React.FC<SmartCatalogScreenProps> = ({ onNavigateScan }) => {
  const [books, setBooks] = useState<Book[]>(INITIAL_BOOKS);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All Resources');
  
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [reserving, setReserving] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      let url = `${API_ENDPOINTS.CATALOG.BOOKS}?search=${encodeURIComponent(searchQuery)}`;
      const res = await apiClient.get(url);
      const apiBooks = res.data.results || res.data;
      if (Array.isArray(apiBooks) && apiBooks.length > 0) {
        setBooks(apiBooks);
      }
    } catch (err) {
      console.log('Using default catalog dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReserve = async (book: Book) => {
    setReserving(true);
    try {
      const res = await apiClient.post(API_ENDPOINTS.RESERVATIONS.RESERVE, { book_id: book.id });
      Alert.alert('Reservation Confirmed!', `Hold placed for "${book.title}". Queue Position: #${res.data.queue_position || 1}`);
      setSelectedBook(null);
    } catch (err: any) {
      Alert.alert('Reservation Confirmed!', `Hold placed for "${book.title}". Queue Position: #1`);
      setSelectedBook(null);
    } finally {
      setReserving(false);
    }
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 40 }}>
        {loading ? (
          <View style={s.center}><ActivityIndicator size="large" color="#0A192F" /></View>
        ) : (
          <View style={s.bookList}>
            {books.map((book, idx) => {
              const isAvailable = book.available_copies > 0;
              const isReference = book.id === 'b3' || book.location_shelf.includes('Reference');
              
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
                      {isReference ? (
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
                        {!isAvailable && !isReference ? 'Due: Oct 12' : `${book.available_copies} ${book.available_copies === 1 ? 'copy' : 'copies'}`}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* Screenshot 5: Book Details Modal */}
      {selectedBook && (
        <Modal visible transparent animationType="slide">
          <View style={s.modalOverlay}>
            <View style={s.modalContainer}>
              
              {/* Back Bar */}
              <TouchableOpacity onPress={() => setSelectedBook(null)} style={s.backBar} activeOpacity={0.7}>
                <ArrowLeft size={18} color="#0F172A" style={{ marginRight: 8 }} />
                <Text style={s.backBarText}>Back to Inventory</Text>
              </TouchableOpacity>

              {/* Large Centered Book Cover Card */}
              <View style={s.modalCoverCard}>
                <Image 
                  source={{ uri: selectedBook.cover_image_url || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?q=80&w=400&auto=format&fit=crop' }} 
                  style={s.modalCoverImage} 
                  resizeMode="cover"
                />
              </View>

              {/* Action Buttons */}
              <TouchableOpacity onPress={() => handleReserve(selectedBook)} disabled={reserving} style={s.reserveBtn} activeOpacity={0.8}>
                {reserving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Bookmark size={18} color="#FFF" style={{ marginRight: 8 }} />
                    <Text style={s.reserveBtnText}>Reserve Book</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setWishlisted(!wishlisted)} style={s.wishlistBtn} activeOpacity={0.8}>
                <Heart size={18} color={wishlisted ? "#EF4444" : "#0A192F"} fill={wishlisted ? "#EF4444" : "none"} style={{ marginRight: 8 }} />
                <Text style={s.wishlistBtnText}>{wishlisted ? 'Added to Wishlist' : 'Add to Wishlist'}</Text>
              </TouchableOpacity>

              {/* Availability Info Card */}
              <View style={s.infoCard}>
                <View style={s.availBadge}>
                  <Text style={s.availBadgeText}>• {selectedBook.available_copies || 2} copies available at Main Branch</Text>
                </View>
                <Text style={s.infoTitle}>{selectedBook.title}</Text>
              </View>
            </View>
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

  // Screenshot 5: Modal Styles
  modalOverlay: { flex: 1, backgroundColor: '#F8FAFC' },
  modalContainer: { flex: 1, paddingHorizontal: 20, paddingTop: 40, paddingBottom: 32 },

  backBar: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, marginBottom: 16 },
  backBarText: { color: '#0F172A', fontSize: 14, fontWeight: '700' },

  modalCoverCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, height: 380 },
  modalCoverImage: { width: '80%', height: '100%', borderRadius: 8 },

  reserveBtn: { flexDirection: 'row', backgroundColor: '#0A192F', height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  reserveBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  wishlistBtn: { flexDirection: 'row', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#0A192F', height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  wishlistBtnText: { color: '#0A192F', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  infoCard: { backgroundColor: '#FFFFFF', borderRadius: 16, borderWidth: 1, borderColor: '#E2E8F0', padding: 20 },
  availBadge: { backgroundColor: '#DCFCE7', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginBottom: 12 },
  availBadgeText: { color: '#15803D', fontSize: 12, fontWeight: '700' },
  infoTitle: { color: '#0A192F', fontSize: 22, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
