import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ScrollView,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import {
  fetchProducts, fetchCategories, createProduct, updateProduct, deleteProduct,
  Product, Category,
} from '@/services/productService';
import { BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';
import { useAlert } from '@/template';
import { Dimensions } from 'react-native';

const { width: W } = Dimensions.get('window');
const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);
type ViewMode = 'list' | 'grid';

const EMPTY_FORM = {
  name: '',
  price: '',
  originalPrice: '',
  category: '',
  categoryId: '',
  brand: '',
  description: '',
  imageUrl: '',
  badge: '',
  inStock: true,
};

export default function AdminProductsScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('all');
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showModal, setShowModal] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(prods);
      setCategories(cats);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.brand.toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCat === 'all' || p.category_id === selectedCat;
    return matchSearch && matchCat;
  });

  const openAdd = () => {
    setEditProduct(null);
    setForm(EMPTY_FORM);
    setPreviewUrl('');
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({
      name: p.name,
      price: String(p.price),
      originalPrice: String(p.original_price),
      category: p.category,
      categoryId: p.category_id,
      brand: p.brand,
      description: p.description,
      imageUrl: p.image,
      badge: p.badge || '',
      inStock: p.in_stock,
    });
    setPreviewUrl(p.image);
    setShowModal(true);
  };

  const handleDelete = (id: string) => {
    showAlert('Delete Product', 'Are you sure you want to delete this product?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await deleteProduct(id);
            setProducts(prev => prev.filter(p => p.id !== id));
          } catch (e: any) {
            showAlert('Error', e.message || 'Failed to delete product');
          }
        }
      }
    ]);
  };

  const handleToggleStock = async (id: string, currentVal: boolean) => {
    try {
      await updateProduct(id, { in_stock: !currentVal });
      setProducts(prev => prev.map(p => p.id === id ? { ...p, in_stock: !p.in_stock } : p));
    } catch (e: any) {
      showAlert('Error', e.message);
    }
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.price) {
      showAlert('Validation Error', 'Product name and price are required.');
      return;
    }
    const priceNum = Number(form.price);
    const origNum = Number(form.originalPrice) || priceNum;
    const discountCalc = origNum > priceNum ? Math.round((1 - priceNum / origNum) * 100) : 0;
    const imgUrl = form.imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400';

    setSaving(true);
    try {
      if (editProduct) {
        const updated = await updateProduct(editProduct.id, {
          name: form.name.trim(),
          price: priceNum,
          original_price: origNum,
          discount: discountCalc,
          category: form.category,
          category_id: form.categoryId || form.category.toLowerCase(),
          brand: form.brand,
          description: form.description,
          image: imgUrl,
          images: [imgUrl],
          badge: form.badge || undefined,
          in_stock: form.inStock,
        });
        setProducts(prev => prev.map(p => p.id === editProduct.id ? updated : p));
        showAlert('Success', 'Product updated successfully.');
      } else {
        const created = await createProduct({
          name: form.name.trim(),
          price: priceNum,
          original_price: origNum,
          discount: discountCalc,
          rating: 4.0,
          reviews: 0,
          category: form.category,
          category_id: form.categoryId || form.category.toLowerCase(),
          image: imgUrl,
          images: [imgUrl],
          description: form.description,
          brand: form.brand,
          in_stock: form.inStock,
          badge: form.badge || undefined,
          tags: [],
          sold: 0,
        });
        setProducts(prev => [created, ...prev]);
        showAlert('Success', 'Product added successfully!');
      }
      setShowModal(false);
    } catch (e: any) {
      showAlert('Error', e.message || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  const setField = (key: string, val: any) => setForm(prev => ({ ...prev, [key]: val }));
  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Products</Text>
          <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{filtered.length} items</Text>
        </View>
        <TouchableOpacity style={s.iconBtn} onPress={() => setViewMode(v => v === 'list' ? 'grid' : 'list')}>
          <MaterialIcons name={viewMode === 'list' ? 'grid-view' : 'list'} size={22} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={openAdd}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      <View style={[s.searchRow, { backgroundColor: colors.surface }]}>
        <View style={[s.searchBar, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <MaterialIcons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={[{ flex: 1, color: colors.text, fontSize: FontSize.base }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textMuted}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <FlatList
          data={[{ id: 'all', name: 'All' }, ...categories.map(c => ({ id: c.id, name: c.name }))]}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={i => i.id}
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8, gap: 8 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.catChip, selectedCat === item.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
              onPress={() => setSelectedCat(item.id)}
            >
              <Text style={[s.catChipText, { color: selectedCat === item.id ? '#fff' : colors.text }]}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : viewMode === 'list' ? (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          contentContainerStyle={{ padding: 12, gap: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onRefresh={loadData}
          refreshing={loading}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <MaterialIcons name="inventory-2" size={64} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: FontSize.lg }}>No products found</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[s.listCard, { backgroundColor: colors.card }]}>
              <View style={s.listImgWrap}>
                <Image source={{ uri: item.image }} style={s.listImg} contentFit="cover" />
                {!item.in_stock && (
                  <View style={s.outOfStockOverlay}>
                    <Text style={s.outOfStockText}>Out of Stock</Text>
                  </View>
                )}
              </View>
              <View style={{ flex: 1, paddingLeft: 12 }}>
                <Text style={[s.productName, { color: colors.text }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{item.brand} • {item.category}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <Text style={[{ color: colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.base }]}>{formatPrice(item.price)}</Text>
                  {item.discount > 0 && (
                    <Text style={[{ color: '#2E7D32', fontSize: FontSize.xs, fontWeight: '700' }]}>{item.discount}% off</Text>
                  )}
                </View>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{item.sold.toLocaleString()} sold</Text>
              </View>
              <View style={s.listActions}>
                <TouchableOpacity
                  style={[s.actionBtn, { backgroundColor: item.in_stock ? '#2E7D32' + '20' : '#C62828' + '20' }]}
                  onPress={() => handleToggleStock(item.id, item.in_stock)}
                >
                  <MaterialIcons name={item.in_stock ? 'check-circle' : 'cancel'} size={15} color={item.in_stock ? '#2E7D32' : '#C62828'} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary + '20' }]} onPress={() => openEdit(item)}>
                  <MaterialIcons name="edit" size={15} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.error + '20' }]} onPress={() => handleDelete(item.id)}>
                  <MaterialIcons name="delete" size={15} color={colors.error} />
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={p => p.id}
          numColumns={2}
          contentContainerStyle={{ padding: 12, gap: 12, paddingBottom: 40 }}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity style={[s.gridCard, { backgroundColor: colors.card }]} onPress={() => openEdit(item)} activeOpacity={0.85}>
              <Image source={{ uri: item.image }} style={s.gridImg} contentFit="cover" />
              {item.badge ? (
                <View style={[s.badge, { backgroundColor: colors.primary }]}>
                  <Text style={s.badgeText}>{item.badge}</Text>
                </View>
              ) : null}
              <View style={s.gridBody}>
                <Text style={[{ color: colors.text, fontWeight: FontWeight.semibold, fontSize: FontSize.sm }]} numberOfLines={2}>{item.name}</Text>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{item.brand}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 6 }}>
                  <Text style={[{ color: colors.text, fontWeight: FontWeight.bold }]}>{formatPrice(item.price)}</Text>
                  <View style={{ flexDirection: 'row', gap: 4 }}>
                    <TouchableOpacity onPress={() => openEdit(item)}>
                      <MaterialIcons name="edit" size={16} color={colors.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(item.id)}>
                      <MaterialIcons name="delete" size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowModal(false)} />
          <View style={[s.modal, { backgroundColor: colors.surface }]}>
            <View style={s.modalHandle} />
            <View style={s.modalHeader}>
              <Text style={[s.modalTitle, { color: colors.text }]}>{editProduct ? 'Edit Product' : 'Add New Product'}</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 20 }}>
              {previewUrl ? (
                <View style={s.imgPreview}>
                  <Image source={{ uri: previewUrl }} style={s.previewImg} contentFit="cover" />
                  <TouchableOpacity style={s.removeImg} onPress={() => { setPreviewUrl(''); setField('imageUrl', ''); }}>
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={[s.imgPlaceholder, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  <MaterialIcons name="add-photo-alternate" size={40} color={colors.textMuted} />
                  <Text style={{ color: colors.textMuted, fontSize: FontSize.sm, marginTop: 8 }}>Enter image URL below to preview</Text>
                </View>
              )}

              <FieldInput label="Product Image URL" value={form.imageUrl} onChangeText={(v: string) => { setField('imageUrl', v); setPreviewUrl(v); }} placeholder="https://example.com/image.jpg" icon="image" colors={colors} />
              <FieldInput label="Product Name *" value={form.name} onChangeText={(v: string) => setField('name', v)} placeholder="Enter product name" icon="label" colors={colors} />
              <FieldInput label="Brand" value={form.brand} onChangeText={(v: string) => setField('brand', v)} placeholder="e.g. Samsung, Nike" icon="business" colors={colors} />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <View style={{ flex: 1 }}>
                  <FieldInput label="Price (INR) *" value={form.price} onChangeText={(v: string) => setField('price', v)} placeholder="9999" icon="currency-rupee" colors={colors} keyboardType="numeric" />
                </View>
                <View style={{ flex: 1 }}>
                  <FieldInput label="MRP (INR)" value={form.originalPrice} onChangeText={(v: string) => setField('originalPrice', v)} placeholder="14999" icon="sell" colors={colors} keyboardType="numeric" />
                </View>
              </View>

              {form.price && form.originalPrice && Number(form.originalPrice) > Number(form.price) && (
                <View style={[s.discountPreview, { backgroundColor: '#2E7D32' + '15' }]}>
                  <MaterialIcons name="local-offer" size={16} color="#2E7D32" />
                  <Text style={{ color: '#2E7D32', fontSize: FontSize.sm, fontWeight: FontWeight.semibold }}>
                    {Math.round((1 - Number(form.price) / Number(form.originalPrice)) * 100)}% discount will be shown
                  </Text>
                </View>
              )}

              <View>
                <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 6 }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {categories.map(cat => (
                      <TouchableOpacity
                        key={cat.id}
                        style={[s.catPickerChip, form.categoryId === cat.id && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => { setField('categoryId', cat.id); setField('category', cat.name); }}
                      >
                        <Text style={[s.catPickerText, { color: form.categoryId === cat.id ? '#fff' : colors.text }]}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View>
                <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 6 }]}>Badge (Optional)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={{ flexDirection: 'row', gap: 8 }}>
                    {['', 'Bestseller', 'Top Rated', 'Deal', 'Hot Deal', 'New', 'Limited Deal'].map(b => (
                      <TouchableOpacity
                        key={b}
                        style={[s.catPickerChip, form.badge === b && { backgroundColor: colors.primary, borderColor: colors.primary }]}
                        onPress={() => setField('badge', b)}
                      >
                        <Text style={[s.catPickerText, { color: form.badge === b ? '#fff' : colors.text }]}>{b || 'None'}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <View>
                <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 6 }]}>Description</Text>
                <TextInput
                  style={[s.textArea, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                  placeholder="Enter product description..."
                  placeholderTextColor={colors.textMuted}
                  value={form.description}
                  onChangeText={v => setField('description', v)}
                  multiline
                  numberOfLines={4}
                />
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View>
                  <Text style={[{ color: colors.text, fontWeight: FontWeight.semibold }]}>In Stock</Text>
                  <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>Toggle product availability</Text>
                </View>
                <TouchableOpacity
                  style={[s.toggleBtn, { backgroundColor: form.inStock ? '#2E7D32' : colors.border }]}
                  onPress={() => setField('inStock', !form.inStock)}
                >
                  <View style={[s.toggleThumb, { transform: [{ translateX: form.inStock ? 22 : 2 }] }]} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
                {saving ? <ActivityIndicator color="#fff" /> : (
                  <>
                    <MaterialIcons name={editProduct ? 'save' : 'add-circle'} size={20} color="#fff" />
                    <Text style={s.saveBtnText}>{editProduct ? 'Update Product' : 'Add Product'}</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

function FieldInput({ label, value, onChangeText, placeholder, icon, colors, keyboardType = 'default' }: any) {
  return (
    <View>
      <Text style={{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1, backgroundColor: colors.background, borderColor: colors.border }}>
        <MaterialIcons name={icon} size={18} color={colors.textMuted} />
        <TextInput
          style={{ flex: 1, color: colors.text, fontSize: FontSize.base }}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
          autoCapitalize="none"
        />
      </View>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: colors.surface, ...Shadow.sm },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.circle },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  searchRow: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: colors.border },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: BorderRadius.circle, borderWidth: 1 },
  catChip: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: BorderRadius.circle, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  catChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  listCard: { flexDirection: 'row', borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm, padding: 12, alignItems: 'center' },
  listImgWrap: { position: 'relative' },
  listImg: { width: 76, height: 76, borderRadius: BorderRadius.md },
  outOfStockOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(198,40,40,0.8)', paddingVertical: 3, alignItems: 'center' },
  outOfStockText: { color: '#fff', fontSize: 8, fontWeight: '700' },
  productName: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 2 },
  listActions: { gap: 6, alignItems: 'center' },
  actionBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  gridCard: { flex: 1, borderRadius: BorderRadius.lg, overflow: 'hidden', ...Shadow.sm },
  gridImg: { width: '100%', height: 130 },
  badge: { position: 'absolute', top: 8, left: 8, paddingHorizontal: 7, paddingVertical: 3, borderRadius: BorderRadius.xs },
  badgeText: { color: '#fff', fontSize: 9, fontWeight: '700' },
  gridBody: { padding: 10 },
  modal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, maxHeight: '90%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  imgPreview: { position: 'relative', borderRadius: BorderRadius.xl, overflow: 'hidden', height: 160 },
  previewImg: { width: '100%', height: 160 },
  removeImg: { position: 'absolute', top: 8, right: 8, width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  imgPlaceholder: { height: 120, borderRadius: BorderRadius.xl, borderWidth: 1.5, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  discountPreview: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: BorderRadius.lg },
  catPickerChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.circle, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  catPickerText: { fontSize: FontSize.sm, fontWeight: FontWeight.medium },
  textArea: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1, fontSize: FontSize.base, minHeight: 100, textAlignVertical: 'top' },
  toggleBtn: { width: 50, height: 28, borderRadius: 14, justifyContent: 'center', paddingHorizontal: 2 },
  toggleThumb: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: BorderRadius.circle },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
