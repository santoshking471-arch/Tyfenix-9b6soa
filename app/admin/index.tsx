import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { fetchProducts } from '@/services/productService';
import { fetchOrderStats } from '@/services/orderService';
import { fetchAllUsers } from '@/services/userService';
import { BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

const { width: W } = Dimensions.get('window');
const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

const STATUS_COLORS: Record<string, string> = {
  Pending: '#F57F17', Confirmed: '#1565C0', Shipped: '#6A1B9A', Delivered: '#2E7D32', Cancelled: '#C62828',
};

export default function AdminDashboard() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ totalRevenue: 0, totalOrders: 0, statusCounts: {} as Record<string, number> });
  const [productCount, setProductCount] = useState(0);
  const [userCount, setUserCount] = useState(0);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const [orderStats, products, users] = await Promise.all([
        fetchOrderStats(),
        fetchProducts(),
        fetchAllUsers(),
      ]);
      setStats(orderStats);
      setProductCount(products.length);
      setUserCount(users.length);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isAdmin) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <MaterialIcons name="block" size={64} color={colors.error} />
        <Text style={{ color: colors.text, fontSize: FontSize.xl, fontWeight: FontWeight.bold, marginTop: 16 }}>Access Denied</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={{ color: colors.primary, marginTop: 12 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const pendingOrders = stats.statusCounts['Pending'] || 0;
  const shippedOrders = stats.statusCounts['Shipped'] || 0;
  const deliveredOrders = stats.statusCounts['Delivered'] || 0;

  const STATS = [
    { label: 'Total Revenue', value: formatPrice(stats.totalRevenue), icon: 'attach-money', color: '#2E7D32', bg: '#E8F5E9' },
    { label: 'Total Orders', value: String(stats.totalOrders), icon: 'receipt-long', color: '#1565C0', bg: '#E3F2FD' },
    { label: 'Total Users', value: String(userCount), icon: 'people', color: '#6A1B9A', bg: '#F3E5F5' },
    { label: 'Products', value: String(productCount), icon: 'inventory-2', color: '#E65100', bg: '#FFF3E0' },
  ];

  const ORDER_STATUS_DATA = [
    { label: 'Pending', count: pendingOrders, color: STATUS_COLORS.Pending },
    { label: 'Shipped', count: shippedOrders, color: STATUS_COLORS.Shipped },
    { label: 'Delivered', count: deliveredOrders, color: STATUS_COLORS.Delivered },
    { label: 'Cancelled', count: stats.statusCounts['Cancelled'] || 0, color: STATUS_COLORS.Cancelled },
  ];

  const QUICK_ACTIONS = [
    { label: 'Products', icon: 'inventory-2', route: '/admin/products', color: '#1565C0', badge: productCount },
    { label: 'Orders', icon: 'receipt-long', route: '/admin/orders', color: '#6A1B9A', badge: pendingOrders },
    { label: 'Users', icon: 'people', route: '/admin/users', color: '#2E7D32', badge: userCount },
    { label: 'Categories', icon: 'category', route: '/admin/categories', color: '#E65100', badge: null },
    { label: 'Banners', icon: 'image', route: '/admin/banners', color: '#AD1457', badge: null },
  ];

  const maxBarValue = Math.max(...ORDER_STATUS_DATA.map(d => d.count), 1);
  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <MaterialIcons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={s.headerSub}>Admin Panel</Text>
          <Text style={s.headerTitle}>Dashboard</Text>
        </View>
        <View style={s.adminChip}>
          <MaterialIcons name="verified" size={14} color="#FFD700" />
          <Text style={s.adminChipText}>ADMIN</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          <View style={s.welcomeCard}>
            <View style={s.welcomeContent}>
              <Text style={s.welcomeGreet}>Welcome back 👑</Text>
              <Text style={s.welcomeName}>{user.name}</Text>
              <View style={s.welcomeStats}>
                {[
                  { val: pendingOrders, label: 'Pending' },
                  { val: shippedOrders, label: 'Shipped' },
                  { val: deliveredOrders, label: 'Delivered' },
                ].map((st, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <View style={s.welcomeDivider} />}
                    <View style={s.welcomeStat}>
                      <Text style={s.welcomeStatVal}>{st.val}</Text>
                      <Text style={s.welcomeStatLabel}>{st.label}</Text>
                    </View>
                  </React.Fragment>
                ))}
              </View>
            </View>
            <MaterialIcons name="admin-panel-settings" size={72} color="rgba(255,255,255,0.15)" />
          </View>

          <View style={s.statsGrid}>
            {STATS.map((stat, i) => (
              <View key={i} style={[s.statCard, { backgroundColor: colors.card }]}>
                <View style={[s.statIcon, { backgroundColor: isDark ? stat.color + '30' : stat.bg }]}>
                  <MaterialIcons name={stat.icon as any} size={22} color={stat.color} />
                </View>
                <Text style={[s.statValue, { color: colors.text }]}>{stat.value}</Text>
                <Text style={[s.statLabel, { color: colors.textMuted }]}>{stat.label}</Text>
              </View>
            ))}
          </View>

          {/* Order Status Chart */}
          <View style={[{ backgroundColor: colors.card, marginHorizontal: 16, borderRadius: BorderRadius.xl, padding: 16, ...Shadow.sm }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <Text style={[s.sectionTitle, { color: colors.text }]}>Order Status</Text>
              <TouchableOpacity onPress={() => router.push('/admin/orders' as any)}>
                <Text style={{ color: colors.primary, fontSize: FontSize.sm, fontWeight: FontWeight.semibold }}>View All</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12, height: 100 }}>
              {ORDER_STATUS_DATA.map((item, i) => {
                const barH = Math.max(8, (item.count / maxBarValue) * 80);
                return (
                  <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                    <Text style={{ color: colors.text, fontSize: 11, fontWeight: FontWeight.bold }}>{item.count}</Text>
                    <View style={{ width: '100%', height: barH, backgroundColor: item.color, borderRadius: 6, opacity: 0.85 }} />
                    <Text style={{ color: colors.textMuted, fontSize: 9, textAlign: 'center' }}>{item.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Quick Actions */}
          <View style={{ paddingHorizontal: 16, marginTop: 20 }}>
            <Text style={[s.sectionTitle, { color: colors.text, marginBottom: 12 }]}>Quick Actions</Text>
            <View style={s.actionsGrid}>
              {QUICK_ACTIONS.map((action, i) => (
                <TouchableOpacity
                  key={i}
                  style={[s.actionCard, { backgroundColor: colors.card }]}
                  onPress={() => router.push(action.route as any)}
                  activeOpacity={0.8}
                >
                  <View style={{ position: 'relative' }}>
                    <View style={[s.actionIcon, { backgroundColor: action.color + '20' }]}>
                      <MaterialIcons name={action.icon as any} size={26} color={action.color} />
                    </View>
                    {action.badge !== null && action.badge > 0 && (
                      <View style={[s.badgeDot, { backgroundColor: action.color }]}>
                        <Text style={s.badgeDotText}>{action.badge}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[s.actionLabel, { color: colors.text }]}>{action.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#1A237E' },
  backBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: FontSize.xs },
  headerTitle: { color: '#fff', fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  adminChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.circle },
  adminChipText: { color: '#FFD700', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  welcomeCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 20, backgroundColor: '#1A237E', paddingBottom: 32 },
  welcomeContent: { flex: 1 },
  welcomeGreet: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.sm },
  welcomeName: { color: '#fff', fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, marginTop: 2, marginBottom: 16 },
  welcomeStats: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: BorderRadius.lg, paddingVertical: 10, paddingHorizontal: 16, gap: 12 },
  welcomeStat: { alignItems: 'center' },
  welcomeStatVal: { color: '#fff', fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  welcomeStatLabel: { color: 'rgba(255,255,255,0.6)', fontSize: 10 },
  welcomeDivider: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.2)' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', padding: 16, gap: 12, marginTop: -16 },
  statCard: { width: (W - 48) / 2, padding: 16, borderRadius: BorderRadius.xl, ...Shadow.md },
  statIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  statValue: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, marginBottom: 2 },
  statLabel: { fontSize: FontSize.xs },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: { width: (W - 56) / 3, alignItems: 'center', padding: 14, borderRadius: BorderRadius.xl, gap: 8, ...Shadow.sm },
  actionIcon: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  actionLabel: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, textAlign: 'center' },
  badgeDot: { position: 'absolute', top: -4, right: -4, width: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeDotText: { color: '#fff', fontSize: 9, fontWeight: '800' },
});
