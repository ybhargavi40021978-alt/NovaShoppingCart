/**
 * NovaCart - Order Details Page JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Fetches real order from database by order_number with ownership verification
 * Displays products snapshot, pricing breakdown, address, tracking link, and print summary
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // DOM Elements
  const detailsLoading = document.getElementById('detailsLoading');
  const detailsError = document.getElementById('detailsError');
  const detailsContent = document.getElementById('detailsContent');
  const confirmationBanner = document.getElementById('confirmationBanner');

  // Breadcrumbs & Header
  const breadcrumbOrderId = document.getElementById('breadcrumbOrderId');
  const orderTitleNumber = document.getElementById('orderTitleNumber');
  const orderDateDisplay = document.getElementById('orderDateDisplay');
  const orderStatusBadge = document.getElementById('orderStatusBadge');
  const paymentStatusBadge = document.getElementById('paymentStatusBadge');

  // Items table & Totals
  const itemsTableBody = document.getElementById('itemsTableBody');
  const subtotalDisplay = document.getElementById('subtotalDisplay');
  const shippingDisplay = document.getElementById('shippingDisplay');
  const discountRow = document.getElementById('discountRow');
  const discountDisplay = document.getElementById('discountDisplay');
  const taxRow = document.getElementById('taxRow');
  const taxDisplay = document.getElementById('taxDisplay');
  const grandTotalDisplay = document.getElementById('grandTotalDisplay');

  // Delivery & Payment
  const recipientName = document.getElementById('recipientName');
  const recipientPhone = document.getElementById('recipientPhone');
  const recipientEmail = document.getElementById('recipientEmail');
  const deliveryAddress = document.getElementById('deliveryAddress');
  const estimatedDelivery = document.getElementById('estimatedDelivery');
  const paymentMethodDisplay = document.getElementById('paymentMethodDisplay');
  const paymentStatusDetail = document.getElementById('paymentStatusDetail');

  // Action Buttons
  const btnPrint = document.getElementById('btnPrintSummary');
  const btnTrackOrder = document.getElementById('btnTrackOrder');

  function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('orderId') || params.get('order') || params.get('id');
    if (queryId) {
      return queryId.replace(/^#/, '').trim();
    }
    // Check path like /account/orders/<order_id>/
    const match = window.location.pathname.match(/\/orders\/([^/]+)/);
    if (match && match[1] && match[1] !== 'track') {
      return match[1].trim();
    }
    return null;
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

  function renderOrderDetails(order) {
    if (detailsLoading) detailsLoading.style.display = 'none';
    if (detailsError) detailsError.style.display = 'none';
    if (detailsContent) detailsContent.style.display = 'block';

    const orderNumber = order.order_number || order.order_id || '';
    const orderDate = order.created_at || order.order_date || '';
    const orderStatus = order.order_status || 'Placed';
    const paymentStatus = order.payment_status || 'Completed';

    // Update Header
    if (breadcrumbOrderId) breadcrumbOrderId.textContent = `#${orderNumber}`;
    if (orderTitleNumber) orderTitleNumber.textContent = `Order #${orderNumber}`;
    if (orderDateDisplay) orderDateDisplay.textContent = `Placed on ${orderDate}`;

    if (orderStatusBadge) {
      orderStatusBadge.className = `badge ${getStatusBadgeClass(orderStatus)}`;
      orderStatusBadge.innerHTML = `<span style="font-size: 8px;">●</span> ${escapeHtml(orderStatus)}`;
    }

    if (paymentStatusBadge) {
      paymentStatusBadge.className = `badge ${getPaymentBadgeClass(paymentStatus)}`;
      paymentStatusBadge.textContent = escapeHtml(paymentStatus);
    }

    // Check if new payment confirmation banner should show
    const params = new URLSearchParams(window.location.search);
    const isNew = params.get('new') === 'true';
    let lastOrder = null;
    try {
      lastOrder = JSON.parse(localStorage.getItem('novacart_last_order'));
    } catch (e) {}

    if (confirmationBanner) {
      if (isNew || (lastOrder && lastOrder.orderId === orderNumber)) {
        confirmationBanner.style.display = 'flex';
        // Clear flag once viewed
        localStorage.removeItem('novacart_last_order');
      } else {
        confirmationBanner.style.display = 'none';
      }
    }

    // Render Items
    const items = order.items || [];
    if (itemsTableBody) {
      if (items.length === 0) {
        itemsTableBody.innerHTML = `
          <tr>
            <td colspan="4" style="text-align: center; padding: 24px; color: #64748b;">
              No item details found for this order.
            </td>
          </tr>
        `;
      } else {
        itemsTableBody.innerHTML = items.map(item => {
          const itemTitle = item.product_name || item.name || 'Product';
          const itemImg = item.image_url || item.product_image || 'assets/products/headphones.svg';
          const unitPrice = NovaAPI.formatPrice(item.price || item.unit_price || 0);
          const lineTotal = NovaAPI.formatPrice(item.line_total || item.total || ((item.price || 0) * (item.quantity || 1)));
          const qty = item.quantity || 1;

          return `
            <tr>
              <td>
                <div class="product-cell-group">
                  <img 
                    src="${escapeHtml(itemImg)}" 
                    alt="${escapeHtml(itemTitle)}" 
                    class="product-cell-thumb" 
                    onerror="this.src='assets/products/headphones.svg';"
                  >
                  <div>
                    <h4 class="product-cell-title">${escapeHtml(itemTitle)}</h4>
                    <p class="product-cell-sku">Quantity: ${qty}</p>
                  </div>
                </div>
              </td>
              <td style="text-align: right; font-weight: 500;">${unitPrice}</td>
              <td style="text-align: center; color: var(--nc-secondary);">${qty}</td>
              <td style="text-align: right; font-weight: 700; color: var(--nc-text);">${lineTotal}</td>
            </tr>
          `;
        }).join('');
      }
    }

    // Render Breakdown
    if (subtotalDisplay) subtotalDisplay.textContent = NovaAPI.formatPrice(order.subtotal || 0);
    
    if (shippingDisplay) {
      const shipCost = Number(order.shipping || order.shipping_cost || 0);
      shippingDisplay.textContent = shipCost > 0 ? NovaAPI.formatPrice(shipCost) : 'Free';
    }

    if (discountRow && discountDisplay) {
      const disc = Number(order.discount || 0);
      if (disc > 0) {
        discountRow.style.display = 'flex';
        discountDisplay.textContent = `- ${NovaAPI.formatPrice(disc)}`;
      } else {
        discountRow.style.display = 'none';
      }
    }

    if (taxRow && taxDisplay) {
      const tax = Number(order.tax || 0);
      if (tax > 0) {
        taxRow.style.display = 'flex';
        taxDisplay.textContent = NovaAPI.formatPrice(tax);
      } else {
        taxRow.style.display = 'none';
      }
    }

    if (grandTotalDisplay) grandTotalDisplay.textContent = NovaAPI.formatPrice(order.total_amount || 0);

    // Delivery & Recipient
    if (recipientName) recipientName.textContent = order.customer_name || order.full_name || 'Customer';
    if (recipientPhone) recipientPhone.textContent = order.phone ? `Phone: ${order.phone}` : '';
    if (recipientEmail) recipientEmail.textContent = order.email ? `Email: ${order.email}` : '';
    if (deliveryAddress) deliveryAddress.textContent = order.shipping_address || `${order.address}, ${order.city}`;
    if (estimatedDelivery) estimatedDelivery.textContent = order.estimated_delivery || '3-5 Business Days';

    // Payment Info
    if (paymentMethodDisplay) paymentMethodDisplay.textContent = order.payment_method || 'Cash on Delivery';
    if (paymentStatusDetail) paymentStatusDetail.textContent = order.payment_status || 'Completed';

    // Buttons
    if (btnTrackOrder) {
      btnTrackOrder.href = `order-tracking.html?orderId=${encodeURIComponent(orderNumber)}`;
    }
  }

  async function loadOrder() {
    const orderId = getOrderIdFromUrl();

    if (detailsLoading) detailsLoading.style.display = 'block';
    if (detailsError) detailsError.style.display = 'none';
    if (detailsContent) detailsContent.style.display = 'none';

    try {
      let res;
      if (orderId) {
        res = await NovaAPI.trackOrder(orderId);
      } else {
        // Fallback to latest order
        res = await NovaAPI.getLatestOrder();
      }

      if (res.ok && res.data.success && res.data.order) {
        renderOrderDetails(res.data.order);
      } else {
        showError(res.data.error || 'Order not found or access denied.');
      }
    } catch (err) {
      console.error('Failed to load order details:', err);
      showError('Unable to load order details. Please check your internet connection and try again.');
    }
  }

  function showError(msg) {
    if (detailsLoading) detailsLoading.style.display = 'none';
    if (detailsContent) detailsContent.style.display = 'none';
    if (detailsError) {
      detailsError.style.display = 'block';
      const p = detailsError.querySelector('p');
      if (p) p.textContent = `✕ ${msg}`;
    }
  }

  // Print button
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
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

  await loadOrder();
});
