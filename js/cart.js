/**
 * NovaCart - Cart Page JavaScript (Interface #4)
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Handles real-time cart data, live quantity updates, dynamic subtotal/total calculations,
 * custom removal modal, empty cart state, toast notifications, and checkout navigation.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const CURRENCY_SYMBOL = '₹';

  // Containers
  const cartLayout = document.getElementById('cartLayout');
  const cartItemsList = document.getElementById('cartItemsList');
  const cartItemsCount = document.getElementById('cartItemsCount');
  const emptyCartState = document.getElementById('emptyCartState');
  const cartErrorState = document.getElementById('cartErrorState');
  const continueShoppingWrap = document.getElementById('continueShoppingWrap');
  const headerCartBadge = document.getElementById('cartBadge');
  const btnRefreshCart = document.getElementById('btnRefreshCart');

  // Summary Elements
  const summarySubtotal = document.getElementById('summarySubtotal');
  const summaryShipping = document.getElementById('summaryShipping');
  const summaryDiscountRow = document.getElementById('summaryDiscountRow');
  const summaryDiscount = document.getElementById('summaryDiscount');
  const summaryTotal = document.getElementById('summaryTotal');
  const btnProceedCheckout = document.getElementById('btnProceedCheckout');

  // Modal Elements
  const removeModalOverlay = document.getElementById('removeModalOverlay');
  const removeModalItemName = document.getElementById('removeModalItemName');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalConfirm = document.getElementById('btnModalConfirm');

  // Toast Container
  const toastContainer = document.getElementById('toastContainer');

  // Header Elements
  const header = document.getElementById('mainHeader');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const mobileMenuToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');

  // State
  let cart = [];
  let itemIndexToRemove = null;

  // ---------------------------------------------------------------------------
  // Currency Formatter (₹)
  // ---------------------------------------------------------------------------
  function formatCurrency(amount) {
    const val = Number(amount) || 0;
    return CURRENCY_SYMBOL + val.toLocaleString('en-IN', {
      minimumFractionDigits: (val % 1 === 0 ? 0 : 2),
      maximumFractionDigits: 2
    });
  }

  // ---------------------------------------------------------------------------
  // Load Cart from Django Backend
  // ---------------------------------------------------------------------------
  async function loadCart() {
    try {
      const res = await NovaAPI.getCart();
      if (res.ok && res.data.cart) {
        cart = res.data.cart.items.map(item => ({
          id: item.product_id,
          name: item.product_name,
          price: Number(item.price),
          quantity: Number(item.quantity),
          color: item.color || 'Standard',
          image: item.product_image || 'assets/products/headphones.svg',
          onlineImage: item.product_image || 'assets/products/headphones.svg'
        }));
        renderCart();
        return true;
      } else {
        cart = [];
        renderCart();
        return true;
      }
    } catch (err) {
      console.warn('Backend cart fetch error:', err);
      cart = [];
      renderCart();
      return true;
    }
  }

  // ---------------------------------------------------------------------------
  // Calculations
  // ---------------------------------------------------------------------------
  function calculateSubtotal() {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }

  function calculateShipping(subtotal) {
    if (subtotal === 0) return 0;
    return subtotal >= 499 ? 0 : 50;
  }

  function calculateDiscount(subtotal) {
    return subtotal >= 2000 ? 100 : 0;
  }

  function calculateTotal(subtotal, shipping, discount) {
    return Math.max(0, subtotal + shipping - discount);
  }

  // ---------------------------------------------------------------------------
  // Render Cart View
  // ---------------------------------------------------------------------------
  function renderCart() {
    if (cart.length === 0) {
      if (cartLayout) cartLayout.style.display = 'none';
      if (continueShoppingWrap) continueShoppingWrap.style.display = 'none';
      if (cartErrorState) cartErrorState.style.display = 'none';
      if (emptyCartState) emptyCartState.style.display = 'block';
      updateCartBadge(0);
      return;
    }

    if (emptyCartState) emptyCartState.style.display = 'none';
    if (cartErrorState) cartErrorState.style.display = 'none';
    if (cartLayout) cartLayout.style.display = 'grid';
    if (continueShoppingWrap) continueShoppingWrap.style.display = 'block';

    const totalCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    if (cartItemsCount) {
      cartItemsCount.textContent = `(${totalCount} ${totalCount === 1 ? 'item' : 'items'})`;
    }

    updateCartBadge(totalCount);
    renderCartItems();
    updateOrderSummary();
  }

  function renderCartItems() {
    if (!cartItemsList) return;

    cartItemsList.innerHTML = cart.map((item, index) => {
      const lineTotal = item.price * item.quantity;
      return `
        <article class="cart-item-card" data-index="${index}" id="cart-item-${item.id}">
          <div class="cart-item-image-wrap">
            <img 
              src="${item.onlineImage || item.image}" 
              alt="${escapeHtml(item.name)}" 
              class="cart-item-img"
              onerror="this.src='${item.image}';"
            >
          </div>

          <div class="cart-item-details">
            <div class="cart-item-header">
              <div>
                <a href="product.html?id=${item.id}" class="cart-item-name">${escapeHtml(item.name)}</a>
                <div class="cart-item-variant">Color: ${escapeHtml(item.color)}</div>
              </div>
              <button 
                type="button" 
                class="cart-remove-btn" 
                data-index="${index}" 
                aria-label="Remove ${escapeHtml(item.name)} from cart"
                title="Remove item"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  <line x1="10" y1="11" x2="10" y2="17"></line>
                  <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
              </button>
            </div>

            <div class="cart-item-footer">
              <div class="cart-qty-control" role="group" aria-label="Quantity for ${escapeHtml(item.name)}">
                <button 
                  type="button" 
                  class="btn-qty-minus" 
                  data-index="${index}" 
                  aria-label="Decrease quantity"
                  ${item.quantity <= 1 ? 'title="Remove item"' : ''}
                >&minus;</button>
                <span class="qty-display" aria-live="polite">${item.quantity}</span>
                <button 
                  type="button" 
                  class="btn-qty-plus" 
                  data-index="${index}" 
                  aria-label="Increase quantity"
                >&plus;</button>
              </div>

              <div class="cart-item-price-wrap">
                <span class="cart-item-unit-price">${formatCurrency(item.price)} each</span>
                <span class="cart-item-line-total">${formatCurrency(lineTotal)}</span>
              </div>
            </div>
          </div>
        </article>
      `;
    }).join('');

    attachRowEventListeners();
  }

  function updateOrderSummary() {
    const subtotal = calculateSubtotal();
    const shipping = calculateShipping(subtotal);
    const discount = calculateDiscount(subtotal);
    const total = calculateTotal(subtotal, shipping, discount);

    if (summarySubtotal) summarySubtotal.textContent = formatCurrency(subtotal);
    if (summaryShipping) summaryShipping.textContent = shipping === 0 ? 'Free' : formatCurrency(shipping);

    if (summaryDiscountRow && summaryDiscount) {
      if (discount > 0) {
        summaryDiscountRow.style.display = 'flex';
        summaryDiscount.textContent = `-${formatCurrency(discount)}`;
      } else {
        summaryDiscountRow.style.display = 'none';
      }
    }

    if (summaryTotal) summaryTotal.textContent = formatCurrency(total);
  }

  function updateCartBadge(count) {
    if (headerCartBadge) {
      headerCartBadge.textContent = count;
      headerCartBadge.classList.add('bounce');
      setTimeout(() => headerCartBadge.classList.remove('bounce'), 250);
    }
  }

  // ---------------------------------------------------------------------------
  // Event Listeners (Quantity & Removal)
  // ---------------------------------------------------------------------------
  function attachRowEventListeners() {
    document.querySelectorAll('.btn-qty-minus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        handleDecreaseQuantity(idx);
      });
    });

    document.querySelectorAll('.btn-qty-plus').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        handleIncreaseQuantity(idx);
      });
    });

    document.querySelectorAll('.cart-remove-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.getAttribute('data-index'), 10);
        promptRemoveItem(idx);
      });
    });
  }

  async function handleIncreaseQuantity(index) {
    if (index < 0 || index >= cart.length) return;
    const item = cart[index];
    const newQty = item.quantity + 1;
    item.quantity = newQty;
    await NovaAPI.updateCart(item.id, newQty);
    renderCart();
    showToast('✓ Quantity updated');
  }

  async function handleDecreaseQuantity(index) {
    if (index < 0 || index >= cart.length) return;
    const item = cart[index];
    if (item.quantity <= 1) {
      promptRemoveItem(index);
      return;
    }
    const newQty = item.quantity - 1;
    item.quantity = newQty;
    await NovaAPI.updateCart(item.id, newQty);
    renderCart();
    showToast('✓ Quantity updated');
  }

  // ---------------------------------------------------------------------------
  // Custom Removal Modal UX
  // ---------------------------------------------------------------------------
  function promptRemoveItem(index) {
    if (index < 0 || index >= cart.length) return;

    itemIndexToRemove = index;
    const item = cart[index];

    if (removeModalItemName) {
      removeModalItemName.textContent = item.name || 'this item';
    }

    if (removeModalOverlay) {
      removeModalOverlay.classList.add('active');
      removeModalOverlay.setAttribute('aria-hidden', 'false');
      if (btnModalConfirm) btnModalConfirm.focus();
    }
  }

  function closeModal() {
    itemIndexToRemove = null;
    if (removeModalOverlay) {
      removeModalOverlay.classList.remove('active');
      removeModalOverlay.setAttribute('aria-hidden', 'true');
    }
  }

  if (btnModalCancel) {
    btnModalCancel.addEventListener('click', closeModal);
  }

  if (removeModalOverlay) {
    removeModalOverlay.addEventListener('click', (e) => {
      if (e.target === removeModalOverlay) {
        closeModal();
      }
    });
  }

  if (btnModalConfirm) {
    btnModalConfirm.addEventListener('click', async () => {
      if (itemIndexToRemove !== null && itemIndexToRemove >= 0 && itemIndexToRemove < cart.length) {
        const removedItem = cart[itemIndexToRemove];
        await NovaAPI.removeFromCart(removedItem.id);
        cart.splice(itemIndexToRemove, 1);
        closeModal();
        renderCart();
        showToast(`✓ ${removedItem.name || 'Item'} removed from cart`);
      }
    });
  }

  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && removeModalOverlay && removeModalOverlay.classList.contains('active')) {
      closeModal();
    }
  });

  // ---------------------------------------------------------------------------
  // Proceed to Checkout
  // ---------------------------------------------------------------------------
  if (btnProceedCheckout) {
    btnProceedCheckout.addEventListener('click', (e) => {
      if (cart.length === 0) {
        e.preventDefault();
        showToast('Your cart is empty');
      } else {
        window.location.href = 'checkout.html';
      }
    });
  }

  if (btnRefreshCart) {
    btnRefreshCart.addEventListener('click', async () => {
      await loadCart();
      showToast('✓ Cart refreshed');
    });
  }

  // ---------------------------------------------------------------------------
  // Toast Notifications
  // ---------------------------------------------------------------------------
  function showToast(message) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="#20A464" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      <span>${escapeHtml(message.replace(/^✓\s*/, ''))}</span>
    `;

    toastContainer.appendChild(toast);

    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        if (toastContainer.contains(toast)) {
          toastContainer.removeChild(toast);
        }
      }, 250);
    }, 2400);
  }

  // ---------------------------------------------------------------------------
  // Header Search & Mobile Nav
  // ---------------------------------------------------------------------------
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

  if (mobileMenuToggle && mobileNavDrawer) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
    });
    mobileNavDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        mobileNavDrawer.classList.remove('open');
      });
    });
  }

  if (header) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 15) {
        header.classList.add('scrolled');
      } else {
        header.classList.remove('scrolled');
      }
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

  // Initial load
  await loadCart();
});
