/**
 * NovaCart - Interface #16: Mobile Menu Page
 * Pure Vanilla JavaScript (No Frameworks)
 */

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.getElementById('menuCloseBtn');
  const wishlistCountBadge = document.getElementById('wishlistCount');
  const bottomWishlistBadge = document.getElementById('bottomWishlistBadge');
  const bottomCartBadge = document.getElementById('bottomCartBadge');
  const menuItems = document.querySelectorAll('.mobile-menu-item');
  const bottomNavItems = document.querySelectorAll('.bottom-nav-item');

  // ==========================================
  // Update Counts from Backend / NovaAPI
  // ==========================================
  async function updateBadges() {
    try {
      if (window.NovaAPI) {
        const [cartRes, wishRes] = await Promise.all([
          NovaAPI.getCart(),
          NovaAPI.getWishlist()
        ]);

        const cartCount = (cartRes.ok && cartRes.data.cart) ? cartRes.data.cart.item_count : 0;
        const wishCount = (wishRes.ok && typeof wishRes.data.count !== 'undefined') ? wishRes.data.count : 0;

        if (wishlistCountBadge) {
          wishlistCountBadge.textContent = wishCount;
          wishlistCountBadge.style.display = wishCount > 0 ? 'inline-flex' : 'none';
        }
        if (bottomWishlistBadge) {
          bottomWishlistBadge.textContent = wishCount;
          bottomWishlistBadge.style.display = wishCount > 0 ? 'inline-flex' : 'none';
        }
        if (bottomCartBadge) {
          bottomCartBadge.textContent = cartCount;
          bottomCartBadge.style.display = cartCount > 0 ? 'inline-flex' : 'none';
        }
      }
    } catch {
      // quiet fallback
    }
  }

  // ==========================================
  // Authentication & Dynamic Routing
  // ==========================================
  function setupAccountRoute() {
    const accountMenuItem = document.getElementById('accountMenuItem');
    const bottomAccountItem = document.getElementById('bottomAccountItem');

    // Check if user is logged in
    const user = localStorage.getItem('novacart_user') || localStorage.getItem('novacart_auth_token');
    const targetUrl = user ? 'profile.html' : 'login.html';

    if (accountMenuItem) {
      accountMenuItem.setAttribute('href', targetUrl);
    }
    if (bottomAccountItem) {
      bottomAccountItem.setAttribute('href', targetUrl);
    }
  }

  // ==========================================
  // Close Button & Escape Key Handling
  // ==========================================
  function closeMenu() {
    // If standalone page, navigate back or to home
    if (window.history.length > 1 && document.referrer && document.referrer.includes(window.location.host)) {
      window.history.back();
    } else {
      window.location.href = 'index.html';
    }
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', (e) => {
      e.preventDefault();
      closeMenu();
    });
  }

  // Keyboard accessibility: Escape closes the menu
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeMenu();
    }
  });

  // ==========================================
  // Highlight Active Item
  // ==========================================
  function setActiveNavigation() {
    // Current path or referrer check
    const currentRef = document.referrer.toLowerCase();

    // Default: Home is active in the reference image
    let activeKey = 'home';

    if (currentRef.includes('shop.html')) {
      activeKey = 'shop';
    } else if (currentRef.includes('wishlist.html')) {
      activeKey = 'wishlist';
    } else if (currentRef.includes('cart.html')) {
      activeKey = 'cart';
    } else if (currentRef.includes('account') || currentRef.includes('profile')) {
      activeKey = 'account';
    }

    menuItems.forEach(item => {
      const key = item.dataset.nav;
      if (key === activeKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    bottomNavItems.forEach(item => {
      const key = item.dataset.nav;
      if (key === activeKey) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });
  }

  // Initialize
  updateBadges();
  setupAccountRoute();
  setActiveNavigation();

  // Listen for storage changes across tabs
  window.addEventListener('storage', updateBadges);
});
