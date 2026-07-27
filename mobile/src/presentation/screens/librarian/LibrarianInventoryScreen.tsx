import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Image, Platform, RefreshControl } from 'react-native';
import { Plus, Search, QrCode, X, BookOpen, ChevronLeft, ChevronRight, Scan, Edit2, Trash2, Camera, Layers, CheckCircle2, ImagePlus, Upload } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS, API_BASE_URL } from '../../../core/constants/api';
import { ScannerScreen } from '../shared/ScannerScreen';

// Build full image URL from possibly relative /media/ path
const getFullImageUrl = (url?: string | null): string | null => {
  if (!url) return null;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  const base = API_BASE_URL.replace('/api/v1', '');
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

export interface InventoryBookItem {
  id: string;
  title: string;
  author: string;
  isbn: string;
  total_copies: number;
  available_copies: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  cover_image_url: string;
  location_shelf: string;
  qr_code_id: string;
  description?: string;
}


const INITIAL_INVENTORY: InventoryBookItem[] = [];

const FILTER_PILLS = ['All Items', 'In Stock', 'Low Stock', 'Out of Stock'];

export const LibrarianInventoryScreen: React.FC = () => {
  const [books, setBooks] = useState<InventoryBookItem[]>(INITIAL_INVENTORY);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All Items');

  // Modals State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isFormScannerOpen, setIsFormScannerOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<InventoryBookItem | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    total_copies: '5',
    available_copies: '5',
    location_shelf: '',
    description: '',
    qr_code_id: '',
  });
  const [coverImageUri, setCoverImageUri] = useState<string | null>(null);
  const [existingCoverUrl, setExistingCoverUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery]);

  const fetchBooks = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get(`${API_ENDPOINTS.CATALOG.BOOKS}?search=${encodeURIComponent(searchQuery)}`);
      const data = Array.isArray(res.data) ? res.data : (res.data.results || []);
      if (data && data.length > 0) {
        const mapped = data.map((b: any) => {
          const tot = b.total_copies ?? 0;
          const avail = b.available_copies ?? tot;
          const st = avail > 2 ? 'In Stock' : avail > 0 ? 'Low Stock' : 'Out of Stock';
          return {
            id: String(b.id),
            title: b.title,
            author: b.author,
            isbn: b.isbn || `ISBN-${b.id}`,
            total_copies: tot,
            available_copies: avail,
            status: st as any,
            cover_image_url: b.cover_image_url || null,
            location_shelf: b.location_shelf || 'Main Stacks',
            description: b.description || '',
            qr_code_id: b.copies && b.copies.length > 0 ? b.copies[0].qr_code_id : `QR-${b.isbn || b.id}`,
          };
        });
        setBooks(mapped);
      }
    } catch (err) {
      console.log('Using default inventory dataset');
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingBook(null);
    setFormData({
      title: '',
      author: '',
      isbn: '',
      total_copies: '5',
      available_copies: '5',
      location_shelf: '',
      description: '',
      qr_code_id: `QR-${Math.floor(100000 + Math.random() * 900000)}`,
    });
    setCoverImageUri(null);
    setExistingCoverUrl(null);
    setIsModalOpen(true);
  };

  const openEditForm = (book: InventoryBookItem) => {
    setEditingBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      total_copies: String(book.total_copies),
      available_copies: String(book.available_copies),
      location_shelf: book.location_shelf,
      description: book.description || '',
      qr_code_id: book.qr_code_id,
    });
    setCoverImageUri(null);
    setExistingCoverUrl(getFullImageUrl(book.cover_image_url));
    setIsModalOpen(true);
  };

  const pickImage = async (useCamera: boolean) => {
    try {
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Camera access is needed to take photos.');
          return;
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Gallery access is needed to select images.');
          return;
        }
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.8 })
        : await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.8 });

      if (!result.canceled && result.assets[0]) {
        setCoverImageUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSaveBook = async () => {
    if (!formData.title || !formData.author || !formData.isbn) {
      Alert.alert('Validation Error', 'Please fill in Title, Author, and ISBN.');
      return;
    }

    const tot = parseInt(formData.total_copies, 10) || 1;
    const avail = Math.min(parseInt(formData.available_copies, 10) || tot, tot);
    const st: 'In Stock' | 'Low Stock' | 'Out of Stock' = avail > 2 ? 'In Stock' : avail > 0 ? 'Low Stock' : 'Out of Stock';

    setSaving(true);

    // Build FormData for multipart upload
    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('author', formData.author);
    fd.append('isbn', formData.isbn);
    fd.append('total_copies', String(tot));
    fd.append('available_copies', String(avail));
    fd.append('location_shelf', formData.location_shelf || 'Main Shelf');
    fd.append('description', formData.description || '');
    fd.append('qr_code_id', formData.qr_code_id || `QR-${formData.isbn}`);

    if (coverImageUri) {
      const filename = coverImageUri.split('/').pop() || 'cover.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
      fd.append('cover_image_url', {
        uri: coverImageUri,
        name: filename,
        type: mimeType,
      } as any);
    }

    try {
      if (editingBook) {
        const res = await apiClient.put(`${API_ENDPOINTS.CATALOG.BOOKS}${editingBook.id}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const updatedImageUrl = res.data?.cover_image_url || existingCoverUrl;
        setBooks(prev => prev.map(b => b.id === editingBook.id ? {
          ...b,
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          total_copies: tot,
          available_copies: avail,
          location_shelf: formData.location_shelf || 'Main Shelf',
          description: formData.description,
          cover_image_url: updatedImageUrl,
          status: st,
        } : b));
        Alert.alert('Success', `"${formData.title}" updated.`);
      } else {
        const res = await apiClient.post(API_ENDPOINTS.CATALOG.BOOKS, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        const created: InventoryBookItem = {
          id: res?.data?.id ? String(res.data.id) : `inv_${Date.now()}`,
          title: formData.title,
          author: formData.author,
          isbn: formData.isbn,
          total_copies: tot,
          available_copies: avail,
          location_shelf: formData.location_shelf || 'Main Shelf',
          description: formData.description,
          cover_image_url: res?.data?.cover_image_url || null,
          qr_code_id: formData.qr_code_id || `QR-${formData.isbn}`,
          status: st,
        };
        setBooks([created, ...books]);
        Alert.alert('Success', `"${created.title}" added to inventory (${tot} copies).`);
      }
      setIsModalOpen(false);
    } catch (e: any) {
      Alert.alert('Error', e.response?.data?.detail || e.response?.data?.isbn?.[0] || 'Failed to save book');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBook = (book: InventoryBookItem) => {
    Alert.alert('Delete Book', `Are you sure you want to delete "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { 
        text: 'Delete', 
        style: 'destructive', 
        onPress: async () => {
          try {
            await apiClient.delete(`${API_ENDPOINTS.CATALOG.BOOKS}${book.id}/`);
          } catch (e) {}
          setBooks(prev => prev.filter(b => b.id !== book.id));
          Alert.alert('Deleted', `"${book.title}" has been deleted.`);
        } 
      }
    ]);
  };

  const handleFormQRScanned = (scannedCode: string) => {
    setFormData(prev => ({ ...prev, qr_code_id: scannedCode }));
    setIsFormScannerOpen(false);
    Alert.alert('QR Captured!', `Scanned Code: ${scannedCode} assigned to book.`);
  };

  const filteredBooks = books.filter(b => {
    const matchesFilter = activeFilter === 'All Items' || b.status === activeFilter;
    const matchesSearch = b.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.isbn.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchBooks();
    setRefreshing(false);
  };

  return (
    <View style={s.bg}>
      {/* Search Input & Add Button Top Area */}
      <View style={s.topArea}>
        <View style={s.searchBox}>
          <Search size={20} color="#64748B" style={{ marginRight: 10 }} />
          <TextInput 
            style={s.searchInput} 
            placeholder="Search by ISBN, title, or author..." 
            placeholderTextColor="#94A3B8" 
            value={searchQuery} 
            onChangeText={setSearchQuery} 
          />
          <TouchableOpacity activeOpacity={0.7} onPress={() => setIsScannerOpen(true)}>
            <QrCode size={20} color="#0F172A" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={openAddForm} style={s.addBookBtn} activeOpacity={0.8}>
          <Plus size={20} color="#FFF" style={{ marginRight: 8 }} />
          <Text style={s.addBookBtnText}>Add New Book</Text>
        </TouchableOpacity>

        {/* Category Filter Pills */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 12 }}>
          {FILTER_PILLS.map(pill => (
            <TouchableOpacity 
              key={pill} 
              onPress={() => setActiveFilter(pill)} 
              style={[s.filterPill, activeFilter === pill && s.filterPillActive]}
              activeOpacity={0.8}
            >
              <Text style={[s.filterPillText, activeFilter === pill && s.filterPillTextActive]}>{pill}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Main Table View */}
      <ScrollView 
        style={{ flex: 1 }} 
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#0A192F']} tintColor="#0A192F" />}
      >
        <View style={s.tableContainer}>
          {/* Table Header */}
          <View style={s.tableHeaderRow}>
            <Text style={s.colHeaderLeft}>BOOK DETAILS & QUANTITY</Text>
            <Text style={s.colHeaderRight}>STATUS & ACTIONS</Text>
          </View>

          {/* Table Rows */}
          {loading ? (
            <ActivityIndicator size="large" color="#0A192F" style={{ padding: 40 }} />
          ) : (
            filteredBooks.map((item, idx) => (
              <View key={item.id} style={[s.tableRow, idx === filteredBooks.length - 1 && { borderBottomWidth: 0 }]}>
                {/* Book Details Column */}
                <View style={s.bookCol}>
                  <Image source={{ uri: getFullImageUrl(item.cover_image_url) || undefined }} style={s.bookCover} resizeMode="cover" defaultSource={require('../../../../assets/icon.png')} />
                  <View style={s.bookTextGroup}>
                    <Text style={s.bookTitle} numberOfLines={2}>{item.title}</Text>
                    <Text style={s.bookAuthor}>{item.author}</Text>
                    <Text style={s.quantityText}>
                      Stock Quantity: <Text style={{ fontWeight: '800', color: '#0A192F' }}>{item.available_copies}/{item.total_copies}</Text> copies
                    </Text>
                    {item.location_shelf ? <Text style={s.bookShelf}>{item.location_shelf}</Text> : null}
                  </View>
                </View>

                {/* Status & Actions Column */}
                <View style={s.statusCol}>
                  {item.status === 'In Stock' ? (
                    <View style={s.inStockPill}>
                      <Text style={s.inStockPillText}>In Stock</Text>
                    </View>
                  ) : item.status === 'Low Stock' ? (
                    <View style={s.lowStockPill}>
                      <Text style={s.lowStockPillText}>Low Stock</Text>
                    </View>
                  ) : (
                    <View style={s.outStockPill}>
                      <Text style={s.outStockPillText}>Out of Stock</Text>
                    </View>
                  )}

                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
                    <TouchableOpacity onPress={() => openEditForm(item)} style={s.actionIconBtn}>
                      <Edit2 size={16} color="#0A192F" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDeleteBook(item)} style={s.actionIconBtn}>
                      <Trash2 size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}

          {/* Table Pagination Footer */}
          <View style={s.paginationRow}>
            <Text style={s.paginationText}>Showing 1-{filteredBooks.length} of {books.length} books</Text>
            
            <View style={s.pageControls}>
              <TouchableOpacity style={s.pageBtnDisabled}>
                <ChevronLeft size={16} color="#94A3B8" />
              </TouchableOpacity>
              <TouchableOpacity style={s.pageBtnActive}>
                <Text style={s.pageBtnTextActive}>1</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.pageBtn}>
                <ChevronRight size={16} color="#0F172A" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button (FAB) Scanner */}
      <TouchableOpacity style={s.fabBtn} activeOpacity={0.8} onPress={() => setIsScannerOpen(true)}>
        <Scan size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Add / Edit Book Modal with Quantity, Image Preview & QR Code Scan */}
      <Modal visible={isModalOpen} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingBook ? 'Edit Book' : 'Add New Book'}</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 20 }}>
            {/* Book Title & Author */}
            <Text style={s.fieldLabel}>Book Title *</Text>
            <TextInput style={s.modalInput} placeholder="e.g. The Art of Archiving" value={formData.title} onChangeText={t => setFormData({...formData, title: t})} />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Author *</Text>
            <TextInput style={s.modalInput} placeholder="e.g. Eleanor Vance, PhD" value={formData.author} onChangeText={t => setFormData({...formData, author: t})} />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>ISBN *</Text>
            <TextInput style={s.modalInput} placeholder="e.g. 978-0262033848" value={formData.isbn} onChangeText={t => setFormData({...formData, isbn: t})} />

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Book Description</Text>
            <TextInput 
              style={[s.modalInput, { height: 85, paddingTop: 10, textAlignVertical: 'top' }]} 
              placeholder="Provide a summary or description of the book..." 
              placeholderTextColor="#94A3B8"
              multiline 
              numberOfLines={4}
              value={formData.description} 
              onChangeText={t => setFormData({...formData, description: t})} 
            />

            {/* QUANTITY / COPIES SECTION */}
            <View style={s.sectionDividerRow}>
              <Layers size={16} color="#0A192F" />
              <Text style={s.sectionDividerTitle}>Inventory Quantity & Stock</Text>
            </View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Total Copies *</Text>
                <TextInput 
                  style={s.modalInput} 
                  keyboardType="numeric"
                  placeholder="e.g. 10" 
                  value={formData.total_copies} 
                  onChangeText={t => setFormData({...formData, total_copies: t})} 
                />
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.fieldLabel}>Available Copies *</Text>
                <TextInput 
                  style={s.modalInput} 
                  keyboardType="numeric"
                  placeholder="e.g. 8" 
                  value={formData.available_copies} 
                  onChangeText={t => setFormData({...formData, available_copies: t})} 
                />
              </View>
            </View>

            <Text style={[s.fieldLabel, { marginTop: 14 }]}>Shelf Location</Text>
            <TextInput style={s.modalInput} placeholder="e.g. Shelf CS-102" value={formData.location_shelf} onChangeText={t => setFormData({...formData, location_shelf: t})} />

            {/* COVER IMAGE SECTION */}
            <View style={s.sectionDividerRow}>
              <BookOpen size={16} color="#0A192F" />
              <Text style={s.sectionDividerTitle}>Cover Image</Text>
            </View>

            {/* Image Picker Buttons */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
              <TouchableOpacity
                style={[s.imagePickerBtn, { flex: 1 }]}
                onPress={() => pickImage(false)}
                activeOpacity={0.8}
              >
                <ImagePlus size={20} color="#0A192F" />
                <Text style={s.imagePickerBtnText}>Choose from Gallery</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.imagePickerBtn, { flex: 1 }]}
                onPress={() => pickImage(true)}
                activeOpacity={0.8}
              >
                <Camera size={20} color="#0A192F" />
                <Text style={s.imagePickerBtnText}>Take Photo</Text>
              </TouchableOpacity>
            </View>

            {/* IMAGE PREVIEW */}
            {(coverImageUri || existingCoverUrl) ? (
              <View style={s.imagePreviewCard}>
                <Image
                  source={{ uri: coverImageUri || existingCoverUrl! }}
                  style={s.previewThumb}
                  resizeMode="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '700', color: '#0A192F', fontSize: 13 }}>
                    {coverImageUri ? 'New Image Selected' : 'Current Cover'}
                  </Text>
                  <Text style={{ color: '#64748B', fontSize: 11, marginTop: 2 }} numberOfLines={1}>
                    {coverImageUri ? coverImageUri.split('/').pop() : 'Tap a button above to replace'}
                  </Text>
                </View>
                {coverImageUri ? (
                  <TouchableOpacity onPress={() => setCoverImageUri(null)} style={{ padding: 6 }}>
                    <X size={18} color="#EF4444" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ) : (
              <View style={s.imagePlaceholder}>
                <Upload size={32} color="#94A3B8" />
                <Text style={{ color: '#94A3B8', fontSize: 13, marginTop: 8 }}>No cover image selected</Text>
                <Text style={{ color: '#CBD5E1', fontSize: 11, marginTop: 2 }}>Tap a button above to add one</Text>
              </View>
            )}

            {/* QR CODE SCAN & SAVE SECTION */}
            <View style={s.sectionDividerRow}>
              <QrCode size={16} color="#0A192F" />
              <Text style={s.sectionDividerTitle}>QR Code / Barcode Identifier</Text>
            </View>

            <Text style={s.fieldLabel}>QR Code Payload ID</Text>
            <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
              <TextInput 
                style={[s.modalInput, { flex: 1 }]} 
                placeholder="QR Code Identifier" 
                value={formData.qr_code_id} 
                onChangeText={t => setFormData({...formData, qr_code_id: t})} 
              />
              <TouchableOpacity 
                style={s.scanFormBtn} 
                onPress={() => setIsFormScannerOpen(true)}
                activeOpacity={0.8}
              >
                <Camera size={18} color="#FFF" />
                <Text style={s.scanFormBtnText}>Scan QR</Text>
              </TouchableOpacity>
            </View>

            {/* SAVE BUTTON */}
            <TouchableOpacity style={s.saveBtn} onPress={handleSaveBook} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>{editingBook ? 'Save Changes' : 'Save Book to Inventory'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* General Scanner Modal */}
      <Modal visible={isScannerOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}
            onPress={() => setIsScannerOpen(false)}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <ScannerScreen />
        </View>
      </Modal>

      {/* Inline Form Scanner Modal (Saves QR barcode into form) */}
      <Modal visible={isFormScannerOpen} animationType="slide">
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <TouchableOpacity 
            style={{ position: 'absolute', top: 50, right: 20, zIndex: 10, backgroundColor: 'rgba(0,0,0,0.6)', padding: 10, borderRadius: 20 }}
            onPress={() => setIsFormScannerOpen(false)}
          >
            <X size={24} color="#FFF" />
          </TouchableOpacity>
          <ScannerScreen onScanSuccess={handleFormQRScanned} />
        </View>
      </Modal>
    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },

  topArea: { paddingHorizontal: 16, paddingTop: 16 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 46, marginBottom: 12 },
  searchInput: { flex: 1, color: '#0F172A', fontSize: 14 },

  addBookBtn: { flexDirection: 'row', backgroundColor: '#0A192F', height: 46, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  addBookBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  filterPill: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF' },
  filterPillActive: { backgroundColor: '#0A192F', borderColor: '#0A192F' },
  filterPillText: { color: '#0F172A', fontSize: 13, fontWeight: '600' },
  filterPillTextActive: { color: '#FFFFFF', fontWeight: '700' },

  tableContainer: { backgroundColor: '#FFFFFF', borderRadius: 12, borderWidth: 1, borderColor: '#E2E8F0', overflow: 'hidden', shadowColor: '#0A192F', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 6, elevation: 2 },

  tableHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: '#F8FAFC', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  colHeaderLeft: { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },
  colHeaderRight: { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 0.5 },

  tableRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  bookCol: { flex: 1, flexDirection: 'row', gap: 14, alignItems: 'center', paddingRight: 12 },
  bookCover: { width: 56, height: 80, borderRadius: 4, backgroundColor: '#F1F5F9' },
  bookTextGroup: { flex: 1 },
  bookTitle: { color: '#0A192F', fontSize: 17, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif', lineHeight: 22, marginBottom: 4 },
  bookAuthor: { color: '#64748B', fontSize: 13 },
  quantityText: { color: '#64748B', fontSize: 12, marginTop: 3 },
  bookShelf: { color: '#94A3B8', fontSize: 11, marginTop: 2 },

  statusCol: { alignItems: 'flex-end', justifyContent: 'center' },

  inStockPill: { backgroundColor: '#DCFCE7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  inStockPillText: { color: '#15803D', fontSize: 12, fontWeight: '700' },

  lowStockPill: { backgroundColor: '#FEF3C7', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  lowStockPillText: { color: '#B45309', fontSize: 12, fontWeight: '700' },

  outStockPill: { backgroundColor: '#FEE2E2', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12 },
  outStockPillText: { color: '#B91C1C', fontSize: 12, fontWeight: '700' },

  actionIconBtn: { backgroundColor: '#F1F5F9', padding: 6, borderRadius: 6 },

  paginationRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#F8FAFC', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  paginationText: { color: '#64748B', fontSize: 12 },
  pageControls: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  pageBtn: { width: 32, height: 32, borderRadius: 4, borderWidth: 1, borderColor: '#CBD5E1', backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center' },
  pageBtnDisabled: { width: 32, height: 32, borderRadius: 4, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center' },
  pageBtnActive: { width: 32, height: 32, borderRadius: 4, backgroundColor: '#0A192F', alignItems: 'center', justifyContent: 'center' },
  pageBtnTextActive: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },

  // Floating Action Button
  fabBtn: { position: 'absolute', bottom: 20, right: 20, width: 56, height: 56, borderRadius: 16, backgroundColor: '#0A192F', alignItems: 'center', justifyContent: 'center', shadowColor: '#0A192F', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 6 },

  // Modal
  modalBg: { flex: 1, backgroundColor: '#F8FAFC' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { color: '#0A192F', fontSize: 20, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
  
  sectionDividerRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  sectionDividerTitle: { color: '#0A192F', fontSize: 14, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },

  fieldLabel: { color: '#0F172A', fontSize: 13, fontWeight: '700', marginBottom: 6 },
  modalInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 12, height: 46, fontSize: 14, color: '#0F172A' },
  
  imagePickerBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#F1F5F9', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 10, paddingVertical: 14, borderStyle: 'dashed' },
  imagePickerBtnText: { color: '#0A192F', fontSize: 12, fontWeight: '700' },

  imagePlaceholder: { alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC', borderWidth: 2, borderColor: '#E2E8F0', borderStyle: 'dashed', borderRadius: 12, paddingVertical: 24, marginBottom: 4 },

  imagePreviewCard: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#E2E8F0', marginTop: 10 },
  previewThumb: { width: 48, height: 68, borderRadius: 6 },

  scanFormBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#0A192F', height: 46, paddingHorizontal: 16, borderRadius: 8 },
  scanFormBtnText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },

  saveBtn: { backgroundColor: '#0A192F', height: 48, borderRadius: 6, alignItems: 'center', justifyContent: 'center', marginTop: 28 },
  saveBtnText: { color: '#FFF', fontWeight: '700', fontSize: 15, fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif' },
});
