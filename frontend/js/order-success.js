/**
 * NovaCart - Interface #11: Order Success Page (My Account Dashboard) JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * 
 * - Authentication & User profile loading from Django backend
 * - Real dashboard statistics rendering: Total Orders, Pending Orders, Wishlist, Total Spent (₹)
 * - Recent orders table rendering with real database orders in INR (₹)
 * - Clean status badges (Delivered, Processing, Shipped)
 * - Row click to order-tracking.html?orderId=...
 * - Sidebar navigation & Logout workflow
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // 1. DOM REFERENCES
  const welcomeUserName = document.getElementById('welcomeUserName');
  const statTotalOrders = document.getElementById('statTotalOrders');
  const statPendingOrders = document.getElementById('statPendingOrders');
  const statWishlistItems = document.getElementById('statWishlistItems');
  const statTotalSpent = document.getElementById('statTotalSpent');
  const recentOrdersTbody = document.getElementById('recentOrdersTbody');
  const navItems = document.querySelectorAll('.sidebar-nav-item');
  const logoutBtn = document.getElementById('btnLogout');

  let orders = [];
  let userProfile = null;
  let wishlistCount = 0;

  // ---------------------------------------------------------------------------
  // 2. LOAD BACKEND DATA
  // ---------------------------------------------------------------------------
  async function loadDashboardData() {
    try {
      const [orderRes, profRes, wishRes] = await Promise.all([
        NovaAPI.getOrders(),
        NovaAPI.getProfile(),
        NovaAPI.getWishlist()
      ]);

      if (profRes.ok && profRes.data.profile) {
        userProfile = profRes.data.profile;
        const displayName = `${userProfile.first_name || ''} ${userProfile.last_name || ''}`.trim() || userProfile.username || 'Priya';
        if (welcomeUserName) welcomeUserName.textContent = displayName;
      }

      if (wishRes.ok && typeof wishRes.data.count !== 'undefined') {
        wishlistCount = wishRes.data.count;
      }

      if (orderRes.ok && orderRes.data.orders) {
        orders = orderRes.data.orders;
      }

      renderStats();
      renderRecentOrders();

    } catch (err) {
      console.warn('Dashboard data fetch notice:', err);
      renderStats();
      renderRecentOrders();
    }
  }

  // ---------------------------------------------------------------------------
  // 3. RENDER REAL STATS IN INR (₹)
  // ---------------------------------------------------------------------------
  function renderStats() {
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(o => o.status === 'processing' || o.status === 'pending').length;
    const totalSpent = orders.reduce((sum, o) => sum + (Number(o.total_amount) || 0), 0);

    if (statTotalOrders) statTotalOrders.textContent = totalOrders;
    if (statPendingOrders) statPendingOrders.textContent = pendingOrders;
    if (statWishlistItems) statWishlistItems.textContent = wishlistCount;
    if (statTotalSpent) statTotalSpent.textContent = formatPrice(totalSpent);
  }

  // ---------------------------------------------------------------------------
  // 4. RENDER RECENT ORDERS TABLE
  // ---------------------------------------------------------------------------
  function renderRecentOrders() {
    if (!recentOrdersTbody) return;

    if (orders.length === 0) {
      recentOrdersTbody.innerHTML = `
        <tr>
          <td colspan="4" style="text-align: center; padding: 2.5rem; color: #64748b;">
            No orders found yet. <br><br>
            <a href="shop.html" class="btn-primary" style="display:inline-block; padding: 0.5rem 1rem; border-radius: 6px; text-decoration:none;">Start Shopping</a>
          </td>
        </tr>
      `;
      return;
    }

    recentOrdersTbody.innerHTML = orders.map(order => {
      let statusClass = 'status-delivered';
      let statusLabel = 'Delivered';

      if (order.status === 'processing' || order.status === 'pending') {
        statusClass = 'status-processing';
        statusLabel = 'Processing';
      } else if (order.status === 'shipped') {
        statusClass = 'status-shipped';
        statusLabel = 'Shipped';
      } else if (order.status === 'delivered') {
        statusClass = 'status-delivered';
        statusLabel = 'Delivered';
      }

      const orderDate = order.created_at 
        ? new Date(order.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'Recent';

      return `
        <tr style="cursor: pointer;" onclick="window.location.href='order-details.html?orderId=${encodeURIComponent(order.order_number)}'">
          <td class="order-id-cell">
            <a href="order-details.html?orderId=${encodeURIComponent(order.order_number)}" style="color:var(--primary); font-weight:600; text-decoration:none;">
              #${escapeHtml(order.order_number)}
            </a>
          </td>
          <td class="order-date-cell">${escapeHtml(orderDate)}</td>
          <td class="order-amount-cell">${formatPrice(order.total_amount)}</td>
          <td class="order-status-cell">
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </td>
        </tr>
      `;
    }).join('');
  }

  // ---------------------------------------------------------------------------
  // 5. SIDEBAR NAVIGATION & LOGOUT
  // ---------------------------------------------------------------------------
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const navTarget = item.getAttribute('data-nav');
      if (navTarget === 'dashboard') {
        e.preventDefault();
        navItems.forEach(i => i.classList.remove('active'));
        item.classList.add('active');
      } else if (navTarget === 'logout') {
        e.preventDefault();
        handleLogout();
      }
    });
  });

  async function handleLogout() {
    try {
      await NovaAPI.logout();
      localStorage.removeItem('novacart_user');
      localStorage.removeItem('novacart_auth_token');
    } catch (e) {
      // quiet fallback
    }
    window.location.href = 'login.html';
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogout();
    });
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  await loadDashboardData();
});
