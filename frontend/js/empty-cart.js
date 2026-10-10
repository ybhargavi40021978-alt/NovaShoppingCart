/**
 * NovaCart - Empty Cart Page JavaScript (Interface #5)
 * Handles empty cart state verification, header cart count update,
 * continue shopping navigation, and standard header interactions.
 */

document.addEventListener('DOMContentLoaded', () => {
  // -------------------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------------------
  const headerCartBadge = document.getElementById('cartBadge');
  const continueShoppingBtn = document.getElementById('continueShoppingBtn');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
  const header = document.querySelector('.header');

  // Sticky Header scroll
  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 20) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
    });
  }

  // Header Search Input
  if (headerSearchInput) {
    headerSearchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = headerSearchInput.value.trim();
        if (val) {
          window.location.href = `shop.html?search=${encodeURIComponent(val)}`;
        }
      }
    });
  }

  // Mobile Menu Toggle
  if (mobileToggle && mobileNavDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
    });
    mobileNavDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
      });
    });
  }

  // -------------------------------------------------------------------------
  // Cart State Verification & Count
  // -------------------------------------------------------------------------
  let cart = [];

  function loadCart() {
    try {
      cart = JSON.parse(localStorage.getItem('novacart_cart') || '[]');
    } catch (err) {
      console.warn('Error reading novacart_cart:', err);
      cart = [];
    }
  }

  function checkEmptyCart() {
    const urlParams = new URLSearchParams(window.location.search);
    const allowPreview = urlParams.get('preview') === 'true' || urlParams.get('view') === 'empty';

    // If the cart actually contains products and user is not previewing the empty state,
    // redirect to the active cart page.
    if (cart.length > 0 && !allowPreview) {
      window.location.href = 'cart.html';
      return;
    }

    // Otherwise, ensure cart badge correctly reflects 0
    updateCartCount(0);
  }

  function updateCartCount(count) {
    if (headerCartBadge) {
      headerCartBadge.textContent = count;
    }
  }

  // -------------------------------------------------------------------------
  // Continue Shopping Action
  // -------------------------------------------------------------------------
  function handleContinueShopping(e) {
    if (e) e.preventDefault();
    window.location.href = 'shop.html';
  }

  if (continueShoppingBtn) {
    continueShoppingBtn.addEventListener('click', handleContinueShopping);
  }

  // -------------------------------------------------------------------------
  // Initialization
  // -------------------------------------------------------------------------
  loadCart();
  checkEmptyCart();
});
