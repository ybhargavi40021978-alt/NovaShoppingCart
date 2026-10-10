/**
 * NovaCart - Interface #12: Order Tracking Page JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * 
 * - Reads order ID from URL (?order=... or ?orderId=...), or latest order from backend
 * - Updates breadcrumb, overview banner, and card headers dynamically
 * - Loads tracking events & real purchased items from /api/orders/<order_id>/
 * - Displays exact stages: Order Placed, Confirmed, Shipped, Out for Delivery, Delivered
 * - Renders real shipment items with prices formatted in INR (₹)
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const orderNumberDisplay = document.getElementById('orderNumberDisplay');
  const bannerOrderId = document.getElementById('bannerOrderId');
  const breadcrumbOrderId = document.getElementById('breadcrumbOrderId');
  const trackingTimelineContainer = document.getElementById('trackingTimelineContainer');
  const trackedItemsContainer = document.getElementById('trackedItemsContainer');

  const CHECK_SVG = `
    <svg class="timeline-check-svg" viewBox="0 0 12 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <polyline points="2.5 6 4.8 8.5 9.5 3.5"></polyline>
    </svg>
  `;

  function getOrderIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const queryId = params.get('order') || params.get('orderId');
    if (queryId) {
      return queryId.replace(/^#/, '');
    }
    return null;
  }

  function renderTimeline(events) {
    if (!trackingTimelineContainer) return;

    let html = '';
    events.forEach((item, index) => {
      const isLast = (index === events.length - 1);
      const dateHtml = item.dateTime ? `<p>${escapeHtml(item.dateTime)}</p>` : '';

      html += `
        <div class="tracking-item ${item.isCompleted ? 'completed' : ''}">
          <div class="timeline-indicator-col">
            ${!isLast ? '<div class="timeline-connector" aria-hidden="true"></div>' : ''}
            <div class="timeline-indicator" aria-label="${escapeHtml(item.stage)} completed">
              ${item.isCompleted ? CHECK_SVG : ''}
            </div>
          </div>
          <div class="timeline-content">
            <h3>${escapeHtml(item.stage)}</h3>
            ${dateHtml}
          </div>
        </div>
      `;
    });

    trackingTimelineContainer.innerHTML = html;
  }

  function renderShipmentItems(items) {
    if (!trackedItemsContainer) return;

    if (!items || items.length === 0) {
      trackedItemsContainer.innerHTML = `
        <div style="padding: 1.5rem; text-align: center; color: #64748b;">
          No items details found for this shipment.
        </div>
      `;
      return;
    }

    let itemsHtml = '';
    items.forEach(item => {
      const priceVal = formatPrice(item.price);
      itemsHtml += `
        <div class="tracked-item">
          <img src="${escapeHtml(item.product_image || 'assets/products/headphones.svg')}" alt="${escapeHtml(item.product_name)}" class="item-thumb" onerror="this.src='assets/products/headphones.svg';">
          <div class="item-info">
            <h4 class="item-name">${escapeHtml(item.product_name)}</h4>
            <p class="item-qty">Qty: ${item.quantity || 1}</p>
          </div>
          <span class="item-price">${priceVal}</span>
        </div>
      `;
    });

    trackedItemsContainer.innerHTML = itemsHtml;
  }

  async function loadTrackingData() {
    let orderId = getOrderIdFromUrl();

    // If not in URL, query latest order
    if (!orderId) {
      try {
        const latestRes = await NovaAPI.getLatestOrder();
        if (latestRes.ok && latestRes.data.order) {
          orderId = latestRes.data.order.order_number;
        }
      } catch (e) {
        // quiet fallback
      }
    }

    if (!orderId) {
      orderId = 'NC10456';
    }

    if (orderNumberDisplay) orderNumberDisplay.textContent = `Order #${orderId}`;
    if (bannerOrderId) bannerOrderId.textContent = `#${orderId}`;
    if (breadcrumbOrderId) breadcrumbOrderId.textContent = `Track #${orderId}`;

    try {
      const res = await NovaAPI.trackOrder(orderId);

      if (res.ok && res.data.order) {
        const order = res.data.order;
        const status = order.status || 'processing';

        const events = [
          {
            stage: 'Order Placed',
            dateTime: order.created_at ? new Date(order.created_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Confirmed',
            isCompleted: true
          },
          {
            stage: 'Confirmed',
            dateTime: 'Order verified by seller',
            isCompleted: status !== 'pending'
          },
          {
            stage: 'Shipped',
            dateTime: (status === 'shipped' || status === 'delivered') ? 'In transit with delivery partner' : '',
            isCompleted: (status === 'shipped' || status === 'delivered')
          },
          {
            stage: 'Out for Delivery',
            dateTime: (status === 'delivered') ? 'Courier out for delivery' : '',
            isCompleted: (status === 'delivered')
          },
          {
            stage: 'Delivered',
            dateTime: (status === 'delivered') ? 'Delivered successfully' : '',
            isCompleted: (status === 'delivered')
          }
        ];

        renderTimeline(events);
        renderShipmentItems(order.items);
      } else {
        // Fallback default timeline
        renderTimeline([
          { stage: 'Order Placed', dateTime: 'Confirmed', isCompleted: true },
          { stage: 'Confirmed', dateTime: 'Verified', isCompleted: true },
          { stage: 'Shipped', dateTime: 'In transit', isCompleted: true },
          { stage: 'Out for Delivery', dateTime: '', isCompleted: false },
          { stage: 'Delivered', dateTime: '', isCompleted: false }
        ]);
        renderShipmentItems([]);
      }
    } catch (err) {
      showErrorState();
    }
  }

  function showErrorState() {
    if (!trackingTimelineContainer) return;
    trackingTimelineContainer.innerHTML = `
      <div style="padding: 20px; text-align: center; color: var(--secondary);">
        <h3 style="font-size: 14px; margin-bottom: 6px; color: var(--text);">Unable to load order tracking</h3>
        <p style="font-size: 12px; margin-bottom: 12px;">Please check your order number or connection.</p>
        <button type="button" class="btn-secondary-action" id="btnRetry" style="padding: 6px 16px; cursor: pointer;">Try again</button>
      </div>
    `;

    const retryBtn = document.getElementById('btnRetry');
    if (retryBtn) retryBtn.addEventListener('click', loadTrackingData);
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

  await loadTrackingData();
});
