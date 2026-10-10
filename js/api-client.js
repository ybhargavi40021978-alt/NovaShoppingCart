/**
 * NovaCart - Universal API Client & Real-Time Sync Service
 * Connects frontend UI to Django SQLite Backend with Indian Rupee (₹) Currency
 */

(function (window) {
  'use strict';

  // Base API configuration
  const API_BASE = (window.location.port === '8000') 
    ? '' 
    : 'http://localhost:8000';

  /**
   * Currency Formatter for Indian Rupees (₹)
   * Example: 2499 -> "₹2,499"
   */
  function formatPrice(amount) {
    const num = Number(amount) || 0;
    return '₹' + num.toLocaleString('en-IN', {
      maximumFractionDigits: 2,
      minimumFractionDigits: (num % 1 === 0 ? 0 : 2)
    });
  }

  /**
   * Safe fetch with JSON body and credentials
   */
  async function request(endpoint, options = {}) {
    const url = `${API_BASE}${endpoint}`;
    const defaultHeaders = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };

    const config = {
      credentials: 'include',
      headers: { ...defaultHeaders, ...options.headers },
      ...options
    };

    if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
      config.body = JSON.stringify(config.body);
    }

    try {
      const res = await fetch(url, config);
      const data = await res.json().catch(() => ({ success: false, error: 'Invalid response from server' }));
      return { ok: res.ok, status: res.status, data };
    } catch (err) {
      console.warn(`[NovaAPI] Request failed for ${endpoint}:`, err);
      return { ok: false, status: 0, data: { success: false, error: 'Could not connect to NovaCart server.' } };
    }
  }

  // API Service Methods
  const NovaAPI = {
    formatPrice,
    API_BASE,

    // --- Authentication ---
    async register(userData) {
      return request('/api/auth/register/', { method: 'POST', body: userData });
    },

    async login(credentials) {
      return request('/api/auth/login/', { method: 'POST', body: credentials });
    },

    async logout() {
      return request('/api/auth/logout/', { method: 'POST' });
    },

    async getProfile(strict = false) {
      return request(`/api/auth/profile/${strict ? '?strict=true' : ''}`);
    },

    async updateProfile(profileData) {
      return request('/api/auth/profile/', { method: 'POST', body: profileData });
    },

    // --- Products & Catalog ---
    async getProducts(params = {}) {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.category) searchParams.set('category', params.category);
      if (params.deals) searchParams.set('deals', 'true');
      if (params.featured) searchParams.set('featured', 'true');
      if (params.sort) searchParams.set('sort', params.sort);
      
      const qs = searchParams.toString();
      return request(`/api/products/${qs ? '?' + qs : ''}`);
    },

    async getProduct(idOrSlug) {
      return request(`/api/products/${encodeURIComponent(idOrSlug)}/`);
    },

    async getCategories() {
      return request('/api/categories/');
    },

    // --- Cart Management ---
    async getCart() {
      const res = await request('/api/cart/');
      if (res.ok && res.data.cart) {
        NovaAPI.updateHeaderBadges(res.data.cart.item_count, null);
      }
      return res;
    },

    async addToCart(productId, quantity = 1) {
      const res = await request('/api/cart/add/', {
        method: 'POST',
        body: { product_id: productId, quantity }
      });
      if (res.ok && res.data.cart) {
        NovaAPI.updateHeaderBadges(res.data.cart.item_count, null);
        window.dispatchEvent(new CustomEvent('novacart:cart-updated', { detail: res.data.cart }));
      }
      return res;
    },

    async updateCart(productId, quantity) {
      const res = await request('/api/cart/update/', {
        method: 'POST',
        body: { product_id: productId, quantity }
      });
      if (res.ok && res.data.cart) {
        NovaAPI.updateHeaderBadges(res.data.cart.item_count, null);
        window.dispatchEvent(new CustomEvent('novacart:cart-updated', { detail: res.data.cart }));
      }
      return res;
    },

    async removeFromCart(productId) {
      const res = await request('/api/cart/remove/', {
        method: 'POST',
        body: { product_id: productId }
      });
      if (res.ok && res.data.cart) {
        NovaAPI.updateHeaderBadges(res.data.cart.item_count, null);
        window.dispatchEvent(new CustomEvent('novacart:cart-updated', { detail: res.data.cart }));
      }
      return res;
    },

    async clearCart() {
      const res = await request('/api/cart/clear/', { method: 'POST' });
      if (res.ok) {
        NovaAPI.updateHeaderBadges(0, null);
        window.dispatchEvent(new CustomEvent('novacart:cart-updated', { detail: { items: [], item_count: 0 } }));
      }
      return res;
    },

    // --- Wishlist Management ---
    async getWishlist() {
      const res = await request('/api/wishlist/');
      if (res.ok && res.data.products) {
        NovaAPI.updateHeaderBadges(null, res.data.count);
      }
      return res;
    },

    async toggleWishlist(productId) {
      const res = await request('/api/wishlist/toggle/', {
        method: 'POST',
        body: { product_id: productId }
      });
      if (res.ok && typeof res.data.wishlist_count !== 'undefined') {
        NovaAPI.updateHeaderBadges(null, res.data.wishlist_count);
        window.dispatchEvent(new CustomEvent('novacart:wishlist-updated', { detail: res.data }));
      }
      return res;
    },

    // --- Orders & Tracking ---
    async createOrder(orderPayload) {
      const res = await request('/api/orders/create/', {
        method: 'POST',
        body: orderPayload
      });
      if (res.ok) {
        NovaAPI.updateHeaderBadges(0, null);
      }
      return res;
    },

    async getOrders() {
      return request('/api/orders/');
    },

    async getLatestOrder() {
      return request('/api/orders/latest/');
    },

    async trackOrder(orderNumber) {
      return request(`/api/orders/${encodeURIComponent(orderNumber)}/`);
    },

    async getOrder(orderNumber) {
      return request(`/api/orders/${encodeURIComponent(orderNumber)}/`);
    },

    // --- Notifications ---
    async getNotifications() {
      return request('/api/notifications/');
    },

    async markNotificationRead(notifId) {
      return request(`/api/notifications/${notifId}/read/`, { method: 'POST' });
    },

    async clearNotifications() {
      return request('/api/notifications/clear/', { method: 'POST' });
    },

    // --- Header Badge Updater ---
    updateHeaderBadges(cartCount = null, wishlistCount = null) {
      if (cartCount !== null) {
        const cartBadges = document.querySelectorAll('#cartBadge, .cart-badge, .header-cart-badge');
        cartBadges.forEach(badge => {
          if (cartCount > 0) {
            badge.textContent = cartCount;
            badge.style.display = 'inline-flex';
          } else {
            badge.style.display = 'none';
          }
        });
      }

      if (wishlistCount !== null) {
        const wishlistBadges = document.querySelectorAll('#wishlistBadge, .wishlist-badge, .header-wishlist-badge');
        wishlistBadges.forEach(badge => {
          if (wishlistCount > 0) {
            badge.textContent = wishlistCount;
            badge.style.display = 'inline-flex';
          } else {
            badge.style.display = 'none';
          }
        });
      }
    },

    // Global Header Navigation Routing
    initHeaderNavigation() {
      // 1. Wishlist Button Navigation
      const wishlistBtns = document.querySelectorAll('#headerWishlistBtn, [aria-label="Wishlist"]');
      wishlistBtns.forEach(btn => {
        if (btn.tagName === 'BUTTON' || (btn.tagName === 'A' && (!btn.getAttribute('href') || btn.getAttribute('href') === '#'))) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'wishlist.html';
          });
        }
      });

      // 2. Account Button Navigation
      const accountBtns = document.querySelectorAll('#headerAccountBtn, [aria-label="Account"], [aria-label="Account Registration"]');
      accountBtns.forEach(btn => {
        if (btn.tagName === 'BUTTON' || (btn.tagName === 'A' && (!btn.getAttribute('href') || btn.getAttribute('href') === '#'))) {
          btn.addEventListener('click', async (e) => {
            e.preventDefault();
            try {
              const res = await NovaAPI.getProfile(true);
              if (res.ok && res.data.profile) {
                window.location.href = 'profile.html';
              } else {
                window.location.href = 'login.html';
              }
            } catch {
              window.location.href = 'profile.html';
            }
          });
        }
      });

      // 3. Cart Button Navigation (if not drawer)
      const cartBtns = document.querySelectorAll('#headerCartBtn, [aria-label="Shopping Cart"]');
      cartBtns.forEach(btn => {
        const hasDrawer = document.getElementById('cartDrawer');
        if (!hasDrawer && (btn.tagName === 'BUTTON' || (btn.tagName === 'A' && (!btn.getAttribute('href') || btn.getAttribute('href') === '#')))) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'cart.html';
          });
        }
      });

      // 4. Notifications Action Button Navigation
      const notifBtns = document.querySelectorAll('#headerNotificationsBtn, [aria-label="Notifications"]');
      notifBtns.forEach(btn => {
        if (btn.tagName === 'BUTTON' || (btn.tagName === 'A' && (!btn.getAttribute('href') || btn.getAttribute('href') === '#'))) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'notifications.html';
          });
        }
      });

      // 5. Mobile Menu Toggle Navigation (if no drawer exists on page)
      const mobileMenuBtns = document.querySelectorAll('#mobileMenuToggle, .mobile-menu-btn');
      mobileMenuBtns.forEach(btn => {
        const hasMobileDrawer = document.getElementById('mobileNavDrawer') || document.querySelector('.mobile-menu-panel');
        if (!hasMobileDrawer && (btn.tagName === 'BUTTON' || btn.tagName === 'A')) {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = 'mobile-menu.html';
          });
        }
      });
    },

    // Auto-sync badges on load
    async initHeaderBadges() {
      try {
        const [cartRes, wishRes] = await Promise.all([
          NovaAPI.getCart(),
          NovaAPI.getWishlist()
        ]);
        if (cartRes.ok && cartRes.data.cart) {
          NovaAPI.updateHeaderBadges(cartRes.data.cart.item_count, null);
        }
        if (wishRes.ok && typeof wishRes.data.count !== 'undefined') {
          NovaAPI.updateHeaderBadges(null, wishRes.data.count);
        }
      } catch (err) {
        // Quiet fallback
      }
    }
  };

  // Expose to window
  window.NovaAPI = NovaAPI;
  window.formatPrice = formatPrice;

  // Initialize header badges and navigation when DOM is ready
  function onReady() {
    NovaAPI.initHeaderBadges();
    NovaAPI.initHeaderNavigation();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

})(window);
