import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { fetchCategories, createCategory, updateCategory, deleteCategory, Category } from '@/services/productService';
import { BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

const ICONS = ['devices', 'checkroom', 'home', 'sports-soccer', 'spa', 'menu-book', 'local-grocery-store', 'toys', 'category'];
const COLORS = ['#1565C0', '#6A1B9A', '#2E7D32', '#E65100', '#AD1457', '#4527A0', '#1B5E20', '#F57F17'];

export default function AdminCategoriesScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('category');
  const [selectedColor, setSelectedColor] = useState('#1565C0');

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchCategories();
      setCategories(data);
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      if (editCat) {
        const updated = await updateCategory(editCat.id, { name: name.trim(), icon: selectedIcon, color: selectedColor });
        setCategories(prev => prev.map(c => c.id === editCat.id ? updated : c));
      } else {
        const newId = name.trim().toLowerCase().replace(/\s+/g, '-');
        const created = await createCategory({ id: newId, name: name.trim(), icon: selectedIcon, color: selectedColor });
        setCategories(prev => [...prev, created]);
      }
      setShowModal(false); setEditCat(null); setName('');
    } catch (e: any) {
      console.error(e);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      setCategories(prev => prev.filter(c => c.id !== id));
    } catch (e) { console.error(e); }
  };

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[s.title, { color: colors.text }]}>Categories</Text>
        <TouchableOpacity style={[s.addBtn, { backgroundColor: colors.primary }]} onPress={() => {
          setEditCat(null); setName(''); setSelectedIcon('category'); setSelectedColor('#1565C0'); setShowModal(true);
        }}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={s.addBtnText}>Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={categories}
          keyExtractor={c => c.id}
          contentContainerStyle={{ padding: 14, gap: 10 }}
          onRefresh={loadCategories}
          refreshing={loading}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <View style={[s.icon, { backgroundColor: item.color + '20' }]}>
                <MaterialIcons name={item.icon as any} size={24} color={item.color} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[s.catName, { color: colors.text }]}>{item.name}</Text>
                <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{item.product_count} products</Text>
              </View>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.primary + '20', marginRight: 8 }]} onPress={() => {
                setEditCat(item); setName(item.name); setSelectedIcon(item.icon); setSelectedColor(item.color); setShowModal(true);
              }}>
                <MaterialIcons name="edit" size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity style={[s.actionBtn, { backgroundColor: colors.error + '20' }]} onPress={() => handleDelete(item.id)}>
                <MaterialIcons name="delete" size={18} color={colors.error} />
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} transparent animationType="slide">
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowModal(false)}>
          <View style={[s.modal, { backgroundColor: colors.surface }]}>
            <Text style={[s.modalTitle, { color: colors.text }]}>{editCat ? 'Edit Category' : 'Add Category'}</Text>
            <TextInput
              style={[s.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
              placeholder="Category name"
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 8 }]}>Icon</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 }}>
              {ICONS.map(ic => (
                <TouchableOpacity key={ic} style={[s.iconChip, selectedIcon === ic && { borderColor: colors.primary, backgroundColor: colors.primary + '20' }]} onPress={() => setSelectedIcon(ic)}>
                  <MaterialIcons name={ic as any} size={22} color={selectedIcon === ic ? colors.primary : colors.textMuted} />
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold, marginBottom: 8 }]}>Color</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
              {COLORS.map(c => (
                <TouchableOpacity key={c} style={[s.colorChip, { backgroundColor: c }, selectedColor === c && s.colorChipSelected]} onPress={() => setSelectedColor(c)}>
                  {selectedColor === c ? <MaterialIcons name="check" size={16} color="#fff" /> : null}
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity style={[s.saveBtn, { backgroundColor: colors.primary }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={s.saveBtnText}>Save</Text>}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface, ...Shadow.sm },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { flex: 1, fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 14, paddingVertical: 8, borderRadius: BorderRadius.circle },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  card: { flexDirection: 'row', alignItems: 'center', padding: 14, borderRadius: BorderRadius.lg, ...Shadow.sm },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  catName: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  actionBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  modal: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 48 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: 16 },
  input: { paddingHorizontal: 14, paddingVertical: 12, borderRadius: BorderRadius.lg, borderWidth: 1, fontSize: FontSize.base, marginBottom: 16 },
  iconChip: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
  colorChip: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  colorChipSelected: { borderWidth: 3, borderColor: '#fff' },
  saveBtn: { paddingVertical: 14, borderRadius: BorderRadius.circle, alignItems: 'center' },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
});
