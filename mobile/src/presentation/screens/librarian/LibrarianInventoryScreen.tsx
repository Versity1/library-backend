import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Image } from 'react-native';
import { Plus, Search, Edit2, Trash2, X, BookOpen } from 'lucide-react-native';
import { apiClient } from '../../../core/utils/http';
import { API_ENDPOINTS } from '../../../core/constants/api';
import { Book } from '../../../domain/types';

export const LibrarianInventoryScreen: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBook, setEditingBook] = useState<Book | null>(null);
  const [formData, setFormData] = useState({ title: '', author: '', isbn: '', location_shelf: '', category: '1' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchBooks();
  }, [searchQuery]);

  const fetchBooks = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get(`${API_ENDPOINTS.CATALOG.BOOKS}?search=${encodeURIComponent(searchQuery)}`);
      setBooks(res.data.results || res.data);
    } catch (err) {
      console.log('Error fetching books', err);
    } finally {
      setLoading(false);
    }
  };

  const openForm = (book?: Book) => {
    if (book) {
      setEditingBook(book);
      setFormData({
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        location_shelf: book.location_shelf,
        category: book.category ? String(book.category) : '1'
      });
    } else {
      setEditingBook(null);
      setFormData({ title: '', author: '', isbn: '', location_shelf: '', category: '1' });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.author || !formData.isbn || !formData.location_shelf) {
      Alert.alert('Validation Error', 'Please fill in all required fields.');
      return;
    }

    setSaving(true);
    try {
      if (editingBook) {
        await apiClient.put(`${API_ENDPOINTS.CATALOG.BOOKS}${editingBook.id}/`, formData);
      } else {
        await apiClient.post(API_ENDPOINTS.CATALOG.BOOKS, formData);
      }
      setIsModalOpen(false);
      fetchBooks();
    } catch (err: any) {
      Alert.alert('Save Error', err.response?.data?.error || 'Failed to save book.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (book: Book) => {
    Alert.alert('Delete Book', `Are you sure you want to delete "${book.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await apiClient.delete(`${API_ENDPOINTS.CATALOG.BOOKS}${book.id}/`);
          fetchBooks();
        } catch (err) {
          Alert.alert('Error', 'Failed to delete book');
        }
      }}
    ]);
  };

  return (
    <View style={s.bg}>
      <View style={s.header}>
        <View style={s.headerTopRow}>
          <Text style={s.headerTitle}>Inventory</Text>
          <TouchableOpacity onPress={() => openForm()} style={s.addBtn}>
            <Plus size={16} color="#FFF" />
            <Text style={s.addBtnText}>Add Book</Text>
          </TouchableOpacity>
        </View>

        <View style={s.searchRow}>
          <Search size={20} color="#64748B" />
          <TextInput 
            style={s.searchInput}
            placeholder="Search books..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <ScrollView style={s.listContainer} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
        {loading ? (
          <ActivityIndicator color="#14B8A6" size="large" style={{ marginTop: 40 }} />
        ) : books.length === 0 ? (
          <View style={s.emptyBox}><Text style={s.emptyText}>No books found.</Text></View>
        ) : (
          books.map(book => (
            <View key={book.id} style={s.bookCard}>
              <View style={s.bookCoverBox}>
                {book.cover_image_url ? (
                  <Image source={{ uri: book.cover_image_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
                ) : (
                  <BookOpen size={24} color="#94A3B8" />
                )}
              </View>
              <View style={s.bookInfo}>
                <Text style={s.bookTitle} numberOfLines={1}>{book.title}</Text>
                <Text style={s.bookAuthor} numberOfLines={1}>{book.author}</Text>
                <View style={s.metaRow}>
                  <Text style={s.metaText} numberOfLines={1}>ISBN: {book.isbn}</Text>
                  <View style={s.dot} />
                  <Text style={[s.metaText, { flexShrink: 1 }]} numberOfLines={1}>Shelf: {book.location_shelf}</Text>
                </View>
                <View style={s.metaRow}>
                  <Text style={s.metaText}>Available: {book.available_copies}/{book.total_copies}</Text>
                </View>
              </View>
              
              <View style={s.actionCol}>
                <TouchableOpacity onPress={() => openForm(book)} style={s.actionBtn}>
                  <Edit2 size={16} color="#3B82F6" />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(book)} style={s.actionBtn}>
                  <Trash2 size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal visible={isModalOpen} animationType="slide" presentationStyle="formSheet">
        <View style={s.modalBg}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editingBook ? 'Edit Book' : 'Add New Book'}</Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <X size={24} color="#64748B" />
            </TouchableOpacity>
          </View>

          <ScrollView style={s.formScroll} contentContainerStyle={{ padding: 20 }}>
            <View style={s.inputGroup}>
              <Text style={s.label}>Title *</Text>
              <TextInput style={s.input} placeholder="Book Title" value={formData.title} onChangeText={t => setFormData({...formData, title: t})} />
            </View>
            
            <View style={s.inputGroup}>
              <Text style={s.label}>Author *</Text>
              <TextInput style={s.input} placeholder="Author Name" value={formData.author} onChangeText={t => setFormData({...formData, author: t})} />
            </View>
            
            <View style={s.inputGroup}>
              <Text style={s.label}>ISBN *</Text>
              <TextInput style={s.input} placeholder="ISBN (e.g. 978-3-16-148410-0)" value={formData.isbn} onChangeText={t => setFormData({...formData, isbn: t})} />
            </View>
            
            <View style={s.inputGroup}>
              <Text style={s.label}>Location / Shelf *</Text>
              <TextInput style={s.input} placeholder="e.g. Shelf 4B, Row 2" value={formData.location_shelf} onChangeText={t => setFormData({...formData, location_shelf: t})} />
            </View>
            
            <View style={s.inputGroup}>
              <Text style={s.label}>Category ID (Default 1 for now)</Text>
              <TextInput style={s.input} value={formData.category} onChangeText={t => setFormData({...formData, category: t})} keyboardType="numeric" />
            </View>

            <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#FFF" /> : <Text style={s.saveBtnText}>{editingBook ? 'Save Changes' : 'Create Book'}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

    </View>
  );
};

const s = StyleSheet.create({
  bg: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#FFF', paddingHorizontal: 20, paddingTop: 16, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  headerTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#0F172A' },
  addBtn: { backgroundColor: '#14B8A6', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  addBtnText: { color: '#FFF', fontWeight: '700', fontSize: 13 },
  
  searchRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, gap: 10 },
  searchInput: { flex: 1, fontSize: 15, color: '#0F172A' },
  
  listContainer: { flex: 1 },
  emptyBox: { padding: 40, alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 15 },
  
  bookCard: { flexDirection: 'row', backgroundColor: '#FFF', padding: 12, borderRadius: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  bookCoverBox: { width: 60, height: 90, backgroundColor: '#F1F5F9', borderRadius: 8, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  bookInfo: { flex: 1, paddingLeft: 12, justifyContent: 'center' },
  bookTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A', marginBottom: 2 },
  bookAuthor: { fontSize: 13, color: '#64748B', marginBottom: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  metaText: { fontSize: 11, color: '#94A3B8', fontWeight: '600' },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: '#CBD5E1' },
  
  actionCol: { justifyContent: 'space-between', paddingVertical: 4, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: '#F1F5F9' },
  actionBtn: { padding: 8, backgroundColor: '#F8FAFC', borderRadius: 8 },

  modalBg: { flex: 1, backgroundColor: '#FFF' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  formScroll: { flex: 1 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 13, fontWeight: '700', color: '#64748B', marginBottom: 8 },
  input: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 15, color: '#0F172A' },
  
  saveBtn: { backgroundColor: '#0F172A', paddingVertical: 16, borderRadius: 12, alignItems: 'center', marginTop: 12 },
  saveBtnText: { color: '#FFF', fontWeight: '800', fontSize: 15 },
});
