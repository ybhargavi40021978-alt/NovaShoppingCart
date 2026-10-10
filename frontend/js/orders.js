/**
 * NovaCart - My Orders Page JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Fetches real orders from database via NovaAPI.getOrders()
 * Supports loading, error, and empty-order states
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const ordersContainer = document.getElementById('ordersContainer');
  const loadingState = document.getElementById('loadingState');
  const errorState = document.getElementById('errorState');
  const emptyState = document.getElementById('emptyState');
  const retryBtn = document.getElementById('retryBtn');
  const welcomeUserName = document.getElementById('welcomeUserName');
  const logoutBtn = document.getElementById('btnLogout');

  async function loadProfile() {
    try {
      const res = await NovaAPI.getProfile();
      if (res.ok && res.data.profile) {
        const p = res.data.profile;
        const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username;
        if (welcomeUserName) welcomeUserName.textContent = name;
      }
    } catch (e) {
      // quiet fallback
    }
  }

  function getStatusBadgeClass(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('deliver')) return 'badge-delivered';
    if (s.includes('ship')) return 'badge-shipped';
    if (s.includes('process')) return 'badge-processing';
    return 'badge-placed';
  }

  function getPaymentBadgeClass(status) {
    const s = (status || '').toLowerCase();
    if (s.includes('complete') || s.includes('paid')) return 'badge-paid';
    return 'badge-pending';
  }

  function renderOrders(orders) {
    if (loadingState) loadingState.style.display = 'none';
    if (errorState) errorState.style.display = 'none';

    if (!orders || orders.length === 0) {
      if (emptyState) emptyState.style.display = 'flex';
      if (ordersContainer) ordersContainer.style.display = 'none';
      return;
    }

    if (emptyState) emptyState.style.display = 'none';
    if (ordersContainer) ordersContainer.style.display = 'flex';

    ordersContainer.innerHTML = orders.map(order => {
      const orderNumber = order.order_number || order.order_id || 'NC00000';
      const orderDate = order.created_at || order.order_date || 'Recent';
      const orderStatus = order.order_status || 'Placed';
      const paymentStatus = order.payment_status || 'Completed';
      const items = order.items || [];
      const itemsCount = order.items_count || (items.reduce((acc, i) => acc + (i.quantity || 1), 0)) || items.length || 1;
      const totalAmount = NovaAPI.formatPrice(order.total_amount);

      // Preview first 2 items
      const primaryItem = items[0] || {};
      const primaryTitle = primaryItem.product_name || primaryItem.name || 'Order Item';
      const primaryThumb = primaryItem.image_url || primaryItem.product_image || 'assets/products/headphones.svg';
      const extraCount = items.length > 1 ? items.length - 1 : 0;
      const extraText = extraCount > 0 ? ` + ${extraCount} more product${extraCount > 1 ? 's' : ''}` : '';

      return `
        <article class="order-card" id="order-${escapeHtml(orderNumber)}">
          <!-- Card Header -->
          <div class="order-card-header">
            <div class="order-meta-group">
              <div class="meta-item">
                <span class="meta-label">Order Placed</span>
                <span class="meta-value">${escapeHtml(orderDate)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Order Number</span>
                <span class="meta-value order-id">#${escapeHtml(orderNumber)}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Total Amount</span>
                <span class="meta-value">${totalAmount}</span>
              </div>
            </div>

            <div class="badges-group">
              <span class="badge ${getStatusBadgeClass(orderStatus)}">
                <span style="font-size: 8px;">●</span> ${escapeHtml(orderStatus)}
              </span>
              <span class="badge ${getPaymentBadgeClass(paymentStatus)}">
                ${escapeHtml(paymentStatus)}
              </span>
            </div>
          </div>

          <!-- Card Body -->
          <div class="order-card-body">
            <div class="order-items-preview">
              <img 
                src="${escapeHtml(primaryThumb)}" 
                alt="${escapeHtml(primaryTitle)}" 
                class="item-thumbnail" 
                onerror="this.src='assets/products/headphones.svg';"
              >
              <div class="item-details-preview">
                <h4 class="item-title-preview">${escapeHtml(primaryTitle)}</h4>
                <p class="item-subtext-preview">${itemsCount} item${itemsCount > 1 ? 's' : ''}${extraText}</p>
              </div>
            </div>

            <div class="order-card-totals">
              <span class="totals-label">Order Total</span>
              <span class="totals-amount">${totalAmount}</span>
            </div>
          </div>

          <!-- Card Footer Actions -->
          <div class="order-card-footer">
            <a href="order-tracking.html?orderId=${encodeURIComponent(orderNumber)}" class="btn-action btn-secondary-action">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
              Track Order
            </a>
            <a href="order-details.html?orderId=${encodeURIComponent(orderNumber)}" class="btn-action btn-primary-action">
              View Details &rarr;
            </a>
          </div>
        </article>
      `;
    }).join('');
  }

  async function fetchOrders() {
    if (loadingState) loadingState.style.display = 'block';
    if (errorState) errorState.style.display = 'none';
    if (emptyState) emptyState.style.display = 'none';
    if (ordersContainer) ordersContainer.style.display = 'none';

    try {
      const res = await NovaAPI.getOrders();
      if (res.ok && res.data.success) {
        renderOrders(res.data.orders);
      } else {
        if (loadingState) loadingState.style.display = 'none';
        if (errorState) errorState.style.display = 'block';
      }
    } catch (err) {
      console.error('Failed to load orders:', err);
      if (loadingState) loadingState.style.display = 'none';
      if (errorState) errorState.style.display = 'block';
    }
  }

  if (retryBtn) {
    retryBtn.addEventListener('click', () => {
      fetchOrders();
    });
  }

  if (logoutBtn) {
    logoutBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      try {
        await NovaAPI.logout();
        localStorage.removeItem('novacart_user');
      } catch (err) {}
      window.location.href = 'login.html';
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

  await loadProfile();
  await fetchOrders();
});
