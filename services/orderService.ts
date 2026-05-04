import { supabase } from './supabase';

export interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

export interface Order {
  id: string;
  user_id: string;
  total: number;
  status: 'Pending' | 'Confirmed' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  address: any;
  payment_method: string;
  tracking_id?: string;
  created_at?: string;
  items?: OrderItem[];
}

export async function createOrder(order: {
  user_id: string;
  total: number;
  address: any;
  payment_method: string;
  items: OrderItem[];
}) {
  const { data: orderData, error: orderError } = await supabase
    .from('orders')
    .insert({
      user_id: order.user_id,
      total: order.total,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      address: order.address,
      payment_method: order.payment_method,
    })
    .select()
    .single();

  if (orderError) throw orderError;

  const itemsToInsert = order.items.map(item => ({
    order_id: orderData.id,
    product_id: item.product_id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    image: item.image,
  }));

  const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert);
  if (itemsError) throw itemsError;

  return orderData as Order;
}

export async function fetchUserOrders(userId: string) {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o: any) => o.id);
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('*')
    .in('order_id', orderIds);

  if (itemsError) throw itemsError;

  return orders.map((order: any) => ({
    ...order,
    items: (items || []).filter((i: any) => i.order_id === order.id),
  })) as Order[];
}

export async function fetchAllOrders() {
  const { data: orders, error } = await supabase
    .from('orders')
    .select('*, user_profiles(username, email)')
    .order('created_at', { ascending: false });

  if (error) throw error;
  if (!orders || orders.length === 0) return [];

  const orderIds = orders.map((o: any) => o.id);
  const { data: items } = await supabase.from('order_items').select('*').in('order_id', orderIds);

  return orders.map((order: any) => ({
    ...order,
    items: (items || []).filter((i: any) => i.order_id === order.id),
  })) as Order[];
}

export async function updateOrderStatus(orderId: string, status: Order['status']) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();
  if (error) throw error;
  return data as Order;
}

export async function fetchOrderStats() {
  const { data: orders, error } = await supabase.from('orders').select('total, status');
  if (error) throw error;

  const totalRevenue = (orders || []).reduce((s: number, o: any) => s + Number(o.total), 0);
  const statusCounts: Record<string, number> = {};
  (orders || []).forEach((o: any) => {
    statusCounts[o.status] = (statusCounts[o.status] || 0) + 1;
  });

  return { totalRevenue, totalOrders: (orders || []).length, statusCounts };
}
