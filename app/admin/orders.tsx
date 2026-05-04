import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Modal, TextInput, ScrollView, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { fetchAllOrders, updateOrderStatus, Order } from '@/services/orderService';
import { BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F57F17', Confirmed: '#1565C0', Shipped: '#6A1B9A', Delivered: '#2E7D32', Cancelled: '#C62828',
};
const STATUS_ICONS: Record<string, string> = {
  Pending: 'schedule', Confirmed: 'check-circle', Shipped: 'local-shipping', Delivered: 'done-all', Cancelled: 'cancel',
};
const ALL_STATUSES = ['Pending', 'Confirmed', 'Shipped', 'Delivered', 'Cancelled'];

export default function AdminOrdersScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const data = await fetchAllOrders();
      setOrders(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    let list = filter === 'All' ? orders : orders.filter(o => o.status === filter);
    if (search) list = list.filter(o =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      (o.address?.name || '').toLowerCase().includes(search.toLowerCase())
    );
    return list;
  }, [orders, filter, search]);

  const updateStatus = async (orderId: string, status: Order['status']) => {
    setUpdatingStatus(true);
    try {
      await updateOrderStatus(orderId, status);
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (selectedOrder?.id === orderId) setSelectedOrder(prev => prev ? { ...prev, status } : null);
    } catch (e: any) {
      console.error(e);
    } finally {
      setUpdatingStatus(false);
      setShowStatusModal(false);
    }
  };

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total), 0);
  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Orders Management</Text>
          <Text style={{ color: colors.textMuted, fontSize: FontSize.xs }}>Total Revenue: {formatPrice(totalRevenue)}</Text>
        </View>
      </View>

      <View style={[s.searchRow, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <MaterialIcons name="search" size={18} color={colors.textMuted} />
        <TextInput
          style={[{ flex: 1, color: colors.text, fontSize: FontSize.base }]}
          placeholder="Search by Order ID or customer..."
          placeholderTextColor={colors.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search ? <TouchableOpacity onPress={() => setSearch('')}><MaterialIcons name="close" size={16} color={colors.textMuted} /></TouchableOpacity> : null}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 10, gap: 12 }}>
          {['All', ...ALL_STATUSES].map(st => {
            const count = st === 'All' ? orders.length : orders.filter(o => o.status === st).length;
            return (
              <TouchableOpacity
                key={st}
                style={[s.filterChip, filter === st && { backgroundColor: st === 'All' ? colors.primary : STATUS_COLORS[st] }]}
                onPress={() => setFilter(st)}
              >
                {st !== 'All' && <MaterialIcons name={STATUS_ICONS[st] as any} size={12} color={filter === st ? '#fff' : STATUS_COLORS[st]} />}
                <Text style={[s.filterChipText, filter === st && { color: '#fff' }]}>{st}</Text>
                <View style={[s.countBadge, { backgroundColor: filter === st ? 'rgba(255,255,255,0.25)' : colors.background }]}>
                  <Text style={[{ fontSize: 10, fontWeight: '700', color: filter === st ? '#fff' : colors.textMuted }]}>{count}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={o => o.id}
          contentContainerStyle={{ padding: 14, gap: 12, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onRefresh={loadOrders}
          refreshing={loading}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <MaterialIcons name="receipt-long" size={64} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: FontSize.lg }}>No orders found</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[s.card, { backgroundColor: colors.card }]}
              onPress={() => { setSelectedOrder(item); setShowDetail(true); }}
              activeOpacity={0.85}
            >
              <View style={s.cardTop}>
                <View style={[s.statusIcon, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                  <MaterialIcons name={STATUS_ICONS[item.status] as any} size={20} color={STATUS_COLORS[item.status]} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[s.orderId, { color: colors.text }]}>#{item.id.slice(-8).toUpperCase()}</Text>
                  <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{item.date} • {item.payment_method}</Text>
                </View>
                <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[item.status] + '20' }]}>
                  <Text style={[{ color: STATUS_COLORS[item.status], fontSize: FontSize.xs, fontWeight: FontWeight.bold }]}>{item.status}</Text>
                </View>
              </View>

              <View style={s.customerRow}>
                <MaterialIcons name="person" size={14} color={colors.textMuted} />
                <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm }]}>
                  {item.address?.name || 'Unknown'} • {item.address?.city || ''}
                </Text>
              </View>

              {(item.items || []).length > 0 && (
                <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: 14, paddingBottom: 8 }}>
                  {(item.items || []).slice(0, 3).map((it, i) => (
                    <Image key={i} source={{ uri: it.image }} style={s.itemThumb} contentFit="cover" />
                  ))}
                  {(item.items || []).length > 3 && (
                    <View style={[s.moreThumb, { backgroundColor: colors.background }]}>
                      <Text style={{ color: colors.textMuted, fontSize: 11, fontWeight: '600' }}>+{item.items!.length - 3}</Text>
                    </View>
                  )}
                </View>
              )}

              <View style={[s.cardFooter, { borderTopColor: colors.border }]}>
                <View>
                  <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>{(item.items || []).length} item(s)</Text>
                  <Text style={[{ color: colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.lg }]}>{formatPrice(item.total)}</Text>
                </View>
                <TouchableOpacity
                  style={[s.updateBtn, { backgroundColor: colors.primary }]}
                  onPress={(e) => { e.stopPropagation(); setSelectedOrder(item); setShowStatusModal(true); }}
                >
                  <MaterialIcons name="update" size={14} color="#fff" />
                  <Text style={s.updateBtnText}>Update Status</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Order Detail Modal */}
      <Modal visible={showDetail} transparent animationType="slide" onRequestClose={() => setShowDetail(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => setShowDetail(false)} />
          <View style={[s.detailModal, { backgroundColor: colors.surface }]}>
            <View style={s.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {selectedOrder && (
                <>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                    <View>
                      <Text style={[{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold }]}>#{selectedOrder.id.slice(-8).toUpperCase()}</Text>
                      <Text style={[{ color: colors.textMuted, fontSize: FontSize.sm }]}>{selectedOrder.date}</Text>
                    </View>
                    <View style={[s.statusBadge, { backgroundColor: STATUS_COLORS[selectedOrder.status] + '20' }]}>
                      <MaterialIcons name={STATUS_ICONS[selectedOrder.status] as any} size={14} color={STATUS_COLORS[selectedOrder.status]} />
                      <Text style={[{ color: STATUS_COLORS[selectedOrder.status], fontSize: FontSize.sm, fontWeight: FontWeight.bold }]}>{selectedOrder.status}</Text>
                    </View>
                  </View>

                  <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.8, marginBottom: 8 }]}>ORDER ITEMS</Text>
                  {(selectedOrder.items || []).map((item, i) => (
                    <View key={i} style={[s.detailItem, { backgroundColor: colors.background }]}>
                      <Image source={{ uri: item.image }} style={{ width: 52, height: 52, borderRadius: 8 }} contentFit="cover" />
                      <View style={{ flex: 1 }}>
                        <Text style={[{ color: colors.text, fontWeight: FontWeight.semibold, fontSize: FontSize.sm }]} numberOfLines={2}>{item.name}</Text>
                        <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs }]}>Qty: {item.quantity} x {formatPrice(item.price)}</Text>
                      </View>
                      <Text style={[{ color: colors.text, fontWeight: FontWeight.bold }]}>{formatPrice(item.price * item.quantity)}</Text>
                    </View>
                  ))}

                  {selectedOrder.address && (
                    <>
                      <Text style={[{ color: colors.textMuted, fontSize: FontSize.xs, fontWeight: FontWeight.bold, letterSpacing: 0.8, marginVertical: 12 }]}>DELIVERY ADDRESS</Text>
                      <View style={[s.addressBox, { backgroundColor: colors.background }]}>
                        <MaterialIcons name="location-on" size={18} color={colors.primary} />
                        <View style={{ flex: 1 }}>
                          <Text style={[{ color: colors.text, fontWeight: FontWeight.semibold }]}>{selectedOrder.address.name}</Text>
                          <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm }]}>{selectedOrder.address.line1}</Text>
                          <Text style={[{ color: colors.textSecondary, fontSize: FontSize.sm }]}>{selectedOrder.address.city}, {selectedOrder.address.state} - {selectedOrder.address.pincode}</Text>
                        </View>
                      </View>
                    </>
                  )}

                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border, marginTop: 12 }}>
                    <Text style={[{ color: colors.textSecondary }]}>Payment Method</Text>
                    <Text style={[{ color: colors.text, fontWeight: FontWeight.semibold }]}>{selectedOrder.payment_method}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingBottom: 12 }}>
                    <Text style={[{ color: colors.text, fontWeight: FontWeight.bold, fontSize: FontSize.lg }]}>Total Amount</Text>
                    <Text style={[{ color: colors.primary, fontWeight: FontWeight.bold, fontSize: FontSize.lg }]}>{formatPrice(selectedOrder.total)}</Text>
                  </View>

                  <TouchableOpacity
                    style={[s.saveBtn, { backgroundColor: colors.primary, marginTop: 16 }]}
                    onPress={() => { setShowDetail(false); setShowStatusModal(true); }}
                  >
                    <MaterialIcons name="update" size={18} color="#fff" />
                    <Text style={s.saveBtnText}>Update Order Status</Text>
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Status Update Modal */}
      <Modal visible={showStatusModal} transparent animationType="slide" onRequestClose={() => setShowStatusModal(false)}>
        <TouchableOpacity style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }} onPress={() => setShowStatusModal(false)}>
          <View style={[s.statusModal, { backgroundColor: colors.surface }]}>
            <View style={s.modalHandle} />
            <Text style={[s.modalTitle, { color: colors.text }]}>Update Order Status</Text>
            <Text style={[{ color: colors.textMuted, marginBottom: 16, fontSize: FontSize.sm }]}>Order #{selectedOrder?.id.slice(-8).toUpperCase()}</Text>
            {ALL_STATUSES.map(status => (
              <TouchableOpacity
                key={status}
                style={[s.statusOption, { borderColor: STATUS_COLORS[status] + '40' }, selectedOrder?.status === status && { backgroundColor: STATUS_COLORS[status] + '15' }]}
                onPress={() => selectedOrder && updateStatus(selectedOrder.id, status as Order['status'])}
                disabled={updatingStatus}
              >
                <View style={[{ width: 12, height: 12, borderRadius: 6, backgroundColor: STATUS_COLORS[status] }]} />
                <MaterialIcons name={STATUS_ICONS[status] as any} size={18} color={STATUS_COLORS[status]} />
                <Text style={[{ flex: 1, color: colors.text, fontSize: FontSize.base, fontWeight: FontWeight.medium }]}>{status}</Text>
                {selectedOrder?.status === status ? <MaterialIcons name="check-circle" size={20} color={STATUS_COLORS[status]} /> : null}
              </TouchableOpacity>
            ))}
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
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  filterChip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.circle, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  filterChipText: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: colors.text },
  countBadge: { paddingHorizontal: 6, paddingVertical: 1, borderRadius: 10 },
  card: { borderRadius: BorderRadius.xl, overflow: 'hidden', ...Shadow.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, paddingBottom: 10 },
  statusIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  orderId: { fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.circle },
  customerRow: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingBottom: 8 },
  itemThumb: { width: 44, height: 44, borderRadius: BorderRadius.sm },
  moreThumb: { width: 44, height: 44, borderRadius: BorderRadius.sm, alignItems: 'center', justifyContent: 'center' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  updateBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 9, borderRadius: BorderRadius.circle },
  updateBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  detailModal: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40, maxHeight: '85%' },
  modalHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 16 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: BorderRadius.lg, marginBottom: 8 },
  addressBox: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14, borderRadius: BorderRadius.lg },
  saveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: BorderRadius.circle },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold },
  statusModal: { position: 'absolute', bottom: 0, left: 0, right: 0, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, paddingBottom: 40 },
  modalTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginBottom: 4 },
  statusOption: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: BorderRadius.lg, borderWidth: 1, marginBottom: 8 },
});
