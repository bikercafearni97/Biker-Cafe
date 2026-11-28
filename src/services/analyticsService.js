import { getAllOrders } from './ordersService';
import { getAllProducts } from './productsService';
import { getAllCustomers } from './customersService';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

/**
 * Stage 6.11 Analytics and Reporting Service
 *
 * Requirements:
 * - Real data only (no invented metrics)
 * - Distinguish between Paid, Pending, and COD payments
 * - Total orders: pending, confirmed, processing, shipped, delivered, cancelled, rejected
 * - Realized revenue vs. pending revenue
 * - Popular products based on confirmed sales count
 * - Stock health: low stock and out-of-stock helmets
 * - Enquiry counts and resolution stats
 * - Export formats: CSV / Excel-compatible and Printable PDF / Summary Report
 */

export async function getDashboardAnalytics() {
  const [orders, products, customers] = await Promise.all([
    getAllOrders().catch(() => []),
    getAllProducts().catch(() => []),
    getAllCustomers().catch(() => []),
  ]);

  // Fetch enquiries count
  let enquiries = [];
  try {
    const enqCol = collection(db, 'enquiries');
    const snap = await getDocs(enqCol);
    enquiries = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.warn('Could not fetch enquiries for analytics:', err);
  }

  // 1. Order Status Counts
  const orderStats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === 'pending').length,
    confirmed: orders.filter((o) => o.status === 'confirmed').length,
    processing: orders.filter((o) => o.status === 'processing').length,
    readyForPickup: orders.filter((o) => o.status === 'ready_for_pickup').length,
    shipped: orders.filter((o) => o.status === 'shipped').length,
    delivered: orders.filter((o) => o.status === 'delivered').length,
    cancelled: orders.filter((o) => o.status === 'cancelled').length,
    rejected: orders.filter((o) => o.status === 'rejected').length,
  };

  // 2. Revenue Calculations
  // Only count confirmed, delivered, shipped, or processing orders where payment was received
  const receivedRevenue = orders
    .filter((o) => o.paymentStatus === 'received' && o.status !== 'cancelled' && o.status !== 'rejected')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || Number(o.itemsSubtotal) || 0), 0);

  // Pending payments (COD awaiting collection, or unconfirmed online payments)
  const pendingRevenue = orders
    .filter((o) => o.paymentStatus === 'pending' && o.status !== 'cancelled' && o.status !== 'rejected')
    .reduce((sum, o) => sum + (Number(o.totalAmount) || Number(o.itemsSubtotal) || 0), 0);

  const codOrdersCount = orders.filter((o) => o.paymentMethod === 'cod').length;
  const onlineOrdersCount = orders.filter((o) => o.paymentMethod === 'online').length;

  // 3. Product Popularity (Units ordered)
  const productSalesMap = {};
  orders.forEach((o) => {
    if (o.status === 'cancelled' || o.status === 'rejected') return;
    if (Array.isArray(o.items)) {
      o.items.forEach((item) => {
        if (!productSalesMap[item.id]) {
          productSalesMap[item.id] = {
            id: item.id,
            title: item.title,
            image: item.image,
            brand: item.brand,
            unitsSold: 0,
            revenue: 0,
          };
        }
        productSalesMap[item.id].unitsSold += Number(item.quantity) || 1;
        productSalesMap[item.id].revenue += (Number(item.unitPrice) || 0) * (Number(item.quantity) || 1);
      });
    }
  });

  const popularProducts = Object.values(productSalesMap).sort((a, b) => b.unitsSold - a.unitsSold);

  // 4. Inventory Health
  const outOfStockProducts = products.filter((p) => {
    if (!p.inventory || !p.inventory.trackingEnabled) return false;
    return p.inventory.quantity <= 0;
  });

  const lowStockProducts = products.filter((p) => {
    if (!p.inventory || !p.inventory.trackingEnabled) return false;
    const threshold = Number(p.inventory.lowStockThreshold) || 2;
    return p.inventory.quantity > 0 && p.inventory.quantity <= threshold;
  });

  // 5. Enquiry Statistics
  const enquiryStats = {
    total: enquiries.length,
    new: enquiries.filter((e) => e.status === 'new').length,
    inProgress: enquiries.filter((e) => e.status === 'in_progress').length,
    resolved: enquiries.filter((e) => e.status === 'resolved').length,
  };

  return {
    orders,
    products,
    customers,
    enquiries,
    orderStats,
    revenue: {
      received: receivedRevenue,
      pending: pendingRevenue,
      totalProjected: receivedRevenue + pendingRevenue,
      codCount: codOrdersCount,
      onlineCount: onlineOrdersCount,
    },
    popularProducts,
    inventoryHealth: {
      totalTracked: products.filter((p) => p.inventory?.trackingEnabled).length,
      outOfStock: outOfStockProducts,
      lowStock: lowStockProducts,
    },
    enquiryStats,
  };
}

/**
 * Generates CSV string and triggers a browser download for Excel compatibility
 */
export function exportOrdersToCsv(orders) {
  if (!orders || orders.length === 0) {
    alert('No orders available to export.');
    return;
  }

  const headers = [
    'Order Ref',
    'Date',
    'Customer Name',
    'Customer Phone',
    'Fulfillment Mode',
    'Payment Method',
    'Payment Status',
    'Order Status',
    'Items Count',
    'Items Subtotal (INR)',
    'Delivery Charge (INR)',
    'Total Amount (INR)',
    'Delivery City',
    'Delivery PIN',
  ];

  const rows = orders.map((o) => {
    const dateStr = o.createdAt?.toDate
      ? o.createdAt.toDate().toISOString().split('T')[0]
      : '';
    const city = o.deliveryAddress?.city || (o.deliveryMethod === 'shop_pickup' ? 'Arni Showroom' : '');
    const pin = o.deliveryAddress?.pinCode || '';

    return [
      `"${o.orderRef || ''}"`,
      `"${dateStr}"`,
      `"${o.customer?.name?.replace(/"/g, '""') || ''}"`,
      `"${o.customer?.phone || ''}"`,
      `"${o.deliveryMethod || ''}"`,
      `"${o.paymentMethod || ''}"`,
      `"${o.paymentStatus || ''}"`,
      `"${o.status || ''}"`,
      o.itemsCount || 0,
      o.itemsSubtotal || 0,
      o.deliveryCharge !== null ? o.deliveryCharge : 'Quote',
      o.totalAmount || o.itemsSubtotal || 0,
      `"${city.replace(/"/g, '""')}"`,
      `"${pin}"`,
    ].join(',');
  });

  const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `biker_cafe_orders_report_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
