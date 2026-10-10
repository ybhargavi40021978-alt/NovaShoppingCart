/**
 * NovaCart - 404 Error Page JavaScript
 * Frontend logic: Badges from localStorage, Search recovery, Mobile menu, Navigation
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // 1. Synchronize Cart & Wishlist Badges from localStorage
  // -------------------------------------------------------------------------
  const cartBadge = document.getElementById('cartBadge');
  const wishlistBadge = document.getElementById('wishlistBadge');

  function updateBadges() {
    try {
      const cart = JSON.parse(localStorage.getItem('novacart_cart')) || [];
      const totalCart = Array.isArray(cart) 
        ? cart.reduce((sum, item) => sum + (item.quantity || 1), 0) 
        : 0;

      if (cartBadge) {
        if (totalCart > 0) {
          cartBadge.textContent = totalCart;
          cartBadge.style.display = 'inline-flex';
        } else {
          cartBadge.style.display = 'none';
        }
      }
    } catch {
      if (cartBadge) cartBadge.style.display = 'none';
    }

    try {
      const wishlist = JSON.parse(localStorage.getItem('novacart_wishlist')) || [];
      const totalWishlist = Array.isArray(wishlist) ? wishlist.length : 0;

      if (wishlistBadge) {
        if (totalWishlist > 0) {
          wishlistBadge.textContent = totalWishlist;
          wishlistBadge.style.display = 'inline-flex';
        } else {
          wishlistBadge.style.display = 'none';
        }
      }
    } catch {
      if (wishlistBadge) wishlistBadge.style.display = 'none';
    }
  }

  updateBadges();

  // Listen for storage events across tabs
  window.addEventListener('storage', updateBadges);

  // -------------------------------------------------------------------------
  // 2. Search Recovery Form
  // -------------------------------------------------------------------------
  const recoveryForm = document.getElementById('searchRecoveryForm');
  const recoveryInput = document.getElementById('searchRecoveryInput');
  const recoveryError = document.getElementById('searchRecoveryError');

  if (recoveryForm && recoveryInput) {
    recoveryForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = recoveryInput.value.trim();

      if (!query) {
        if (recoveryError) {
          recoveryError.textContent = 'Please enter a keyword to search for products.';
          recoveryError.style.display = 'block';
        }
        recoveryInput.focus();
        return;
      }

      if (recoveryError) {
        recoveryError.style.display = 'none';
      }

      // Redirect to Shop page with search query
      window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
    });

    // Clear error on input
    recoveryInput.addEventListener('input', () => {
      if (recoveryError) {
        recoveryError.style.display = 'none';
      }
    });
  }

  // -------------------------------------------------------------------------
  // 3. Header Live Search
  // -------------------------------------------------------------------------
  const headerSearchInput = document.getElementById('headerSearchInput');
  if (headerSearchInput) {
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = headerSearchInput.value.trim();
        if (query) {
          window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // 4. Header Actions Navigation (Wishlist, Cart, Account)
  // -------------------------------------------------------------------------
  const headerWishlistBtn = document.getElementById('headerWishlistBtn');
  if (headerWishlistBtn) {
    headerWishlistBtn.addEventListener('click', () => {
      window.location.href = 'wishlist.html';
    });
  }

  const headerCartBtn = document.getElementById('headerCartBtn');
  if (headerCartBtn) {
    headerCartBtn.addEventListener('click', () => {
      window.location.href = 'cart.html';
    });
  }

  const headerAccountBtn = document.getElementById('headerAccountBtn');
  if (headerAccountBtn) {
    headerAccountBtn.addEventListener('click', () => {
      const user = localStorage.getItem('novacart_user') || localStorage.getItem('novacart_auth_token');
      window.location.href = user ? 'profile.html' : 'login.html';
    });
  }

  // -------------------------------------------------------------------------
  // 5. Mobile Navigation Drawer
  // -------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileDrawer.classList.toggle('open');
      const isOpen = mobileDrawer.classList.contains('open');
      mobileToggle.setAttribute('aria-expanded', isOpen);
    });

    // Close drawer when clicking any link inside
    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileDrawer.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
      });
    });

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && mobileDrawer.classList.contains('open')) {
        mobileDrawer.classList.remove('open');
        mobileToggle.setAttribute('aria-expanded', 'false');
        mobileToggle.focus();
      }
    });
  }
});
