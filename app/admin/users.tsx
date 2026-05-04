import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTheme } from '@/hooks/useTheme';
import { fetchAllUsers, UserProfile } from '@/services/userService';
import { BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { StatusBar } from 'expo-status-bar';

export default function AdminUsersScreen() {
  const { colors, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await fetchAllUsers();
      setUsers(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filtered = search
    ? users.filter(u =>
        (u.username || '').toLowerCase().includes(search.toLowerCase()) ||
        u.email.toLowerCase().includes(search.toLowerCase())
      )
    : users;

  const s = styles(colors);

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn}>
          <MaterialIcons name="arrow-back" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[s.title, { color: colors.text }]}>Users</Text>
          <Text style={{ color: colors.textMuted, fontSize: FontSize.xs }}>{filtered.length} registered</Text>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={u => u.id}
          contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          onRefresh={loadUsers}
          refreshing={loading}
          ListEmptyComponent={() => (
            <View style={{ alignItems: 'center', paddingTop: 80 }}>
              <MaterialIcons name="people" size={64} color={colors.textMuted} />
              <Text style={{ color: colors.textMuted, marginTop: 16, fontSize: FontSize.lg }}>No users found</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <View style={[s.card, { backgroundColor: colors.card }]}>
              <Image
                source={{ uri: item.avatar || `https://i.pravatar.cc/100?u=${item.id}` }}
                style={s.avatar}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={[s.name, { color: colors.text }]}>{item.name || item.username || 'User'}</Text>
                <Text style={[s.email, { color: colors.textMuted }]}>{item.email}</Text>
                {item.phone ? <Text style={[{ color: colors.textSecondary, fontSize: FontSize.xs }]}>{item.phone}</Text> : null}
              </View>
              {item.is_admin ? (
                <View style={[s.adminBadge, { backgroundColor: colors.primary + '20' }]}>
                  <MaterialIcons name="verified" size={12} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: 10, fontWeight: '700' }}>Admin</Text>
                </View>
              ) : null}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = (colors: any) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, backgroundColor: colors.surface, ...Shadow.sm },
  iconBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: FontSize.xl, fontWeight: FontWeight.bold },
  card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: BorderRadius.lg, ...Shadow.sm },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: colors.border },
  name: { fontSize: FontSize.base, fontWeight: FontWeight.semibold },
  email: { fontSize: FontSize.sm, marginTop: 2 },
  adminBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.circle },
});
