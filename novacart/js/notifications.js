/**
 * NovaCart - Interface #15: Notification Page
 * Connected to Django SQLite Backend
 * Pure Vanilla JavaScript (No Frameworks)
 * Loads real notifications from database, marks as read, clears notifications, empty state.
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  const notificationsList = document.getElementById('notificationsList');
  const markAllReadBtn = document.getElementById('markAllRead');
  const closeBtn = document.getElementById('closeNotificationsBtn');
  const headerUnreadBadge = document.getElementById('headerUnreadCount');

  let notificationsData = [];

  function getNotificationIcon(type) {
    switch (type) {
      case 'order_shipped':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <rect x="1" y="3" width="15" height="13" rx="1"/>
            <polygon points="16 8 20 8 23 11 23 16 16 16 8"/>
            <circle cx="5.5" cy="18.5" r="2.5"/>
            <circle cx="18.5" cy="18.5" r="2.5"/>
          </svg>
        `;
      case 'wishlist_sale':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        `;
      case 'order_delivered':
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="9 12 11.5 14.5 15.5 9.5"/>
          </svg>
        `;
      case 'new_products':
      default:
        return `
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
            <line x1="3" y1="6" x2="21" y2="6"/>
            <path d="M16 10a4 4 0 0 1-8 0"/>
          </svg>
        `;
    }
  }

  function formatRelativeTime(item) {
    if (item.time_display) return item.time_display;
    if (!item.created_at && !item.timestamp) return 'Just now';

    try {
      const then = new Date(item.created_at || item.timestamp).getTime();
      const now = Date.now();
      const diffSec = Math.max(0, Math.floor((now - then) / 1000));

      if (diffSec < 60) return `${diffSec}s ago`;
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHours = Math.floor(diffMin / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d ago`;
    } catch {
      return 'Recently';
    }
  }

  function updateUnreadCount() {
    const unreadCount = notificationsData.filter(item => !item.is_read).length;

    if (headerUnreadBadge) {
      if (unreadCount > 0) {
        headerUnreadBadge.textContent = unreadCount;
        headerUnreadBadge.style.display = 'inline-flex';
      } else {
        headerUnreadBadge.style.display = 'none';
      }
    }

    if (markAllReadBtn) {
      markAllReadBtn.disabled = unreadCount === 0;
      markAllReadBtn.style.opacity = unreadCount === 0 ? '0.6' : '1';
    }
  }

  function renderNotifications() {
    if (!notificationsList) return;

    if (!notificationsData || notificationsData.length === 0) {
      renderEmptyState();
      updateUnreadCount();
      return;
    }

    notificationsList.innerHTML = '';

    notificationsData.forEach(item => {
      const row = document.createElement('div');
      row.className = `notification-item ${item.is_read ? '' : 'unread'}`;
      row.dataset.id = item.id;
      row.setAttribute('role', 'button');
      row.setAttribute('tabindex', '0');
      row.setAttribute('aria-label', `${item.title}: ${item.message}. ${item.is_read ? 'Read' : 'Unread'}`);

      const timeText = formatRelativeTime(item);

      row.innerHTML = `
        <div class="notification-icon-col">
          ${getNotificationIcon(item.type || item.notification_type)}
        </div>
        <div class="notification-content-col">
          <h3 class="notification-title">${escapeHtml(item.title)}</h3>
          <p class="notification-message">${escapeHtml(item.message)}</p>
        </div>
        <div class="notification-time-col">
          <span>${escapeHtml(timeText)}</span>
          ${!item.is_read ? '<span class="unread-dot" aria-hidden="true"></span>' : ''}
        </div>
      `;

      const handleTrigger = () => {
        handleNotificationClick(item);
      };

      row.addEventListener('click', handleTrigger);
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleTrigger();
        }
      });

      notificationsList.appendChild(row);
    });

    updateUnreadCount();
  }

  function renderEmptyState() {
    notificationsList.innerHTML = `
      <div class="empty-notifications">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
        <h3>No notifications yet</h3>
        <p>You're all caught up.</p>
      </div>
    `;
  }

  function renderSkeletonLoading() {
    notificationsList.innerHTML = Array(3).fill(0).map(() => `
      <div class="skeleton-row">
        <div class="skeleton-circle"></div>
        <div class="skeleton-content">
          <div class="skeleton-line" style="width: 75%;"></div>
          <div class="skeleton-line short"></div>
        </div>
      </div>
    `).join('');
  }

  async function handleNotificationClick(item) {
    if (!item.is_read) {
      item.is_read = true;
      renderNotifications();
      try {
        await NovaAPI.markNotificationRead(item.id);
      } catch (e) {
        // quiet fallback
      }
    }

    if (item.target_url) {
      window.location.href = item.target_url;
    }
  }

  async function markAllAsRead() {
    const unreadExist = notificationsData.some(n => !n.is_read);
    if (!unreadExist) return;

    notificationsData.forEach(n => { n.is_read = true; });
    renderNotifications();

    try {
      await fetch('/api/notifications/read-all/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (e) {
      // quiet fallback
    }
  }

  async function loadNotifications() {
    renderSkeletonLoading();

    try {
      const res = await NovaAPI.getNotifications();
      if (res.ok && res.data.notifications) {
        notificationsData = res.data.notifications;
      } else {
        notificationsData = [];
      }
    } catch {
      notificationsData = [];
    }

    renderNotifications();
  }

  if (markAllReadBtn) {
    markAllReadBtn.addEventListener('click', markAllAsRead);
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      window.history.length > 1 ? window.history.back() : window.location.href = 'index.html';
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

  loadNotifications();
});
