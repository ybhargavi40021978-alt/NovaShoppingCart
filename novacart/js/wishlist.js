/**
 * NovaCart - Wishlist Page JavaScript (Interface #6)
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Handles real-time wishlist items, dynamic badge updates, item removal,
 * Add to Cart integration with Django backend, clear wishlist modal, and empty state.
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  const wishlistGrid = document.getElementById('wishlistGrid');
  const emptyWishlistState = document.getElementById('emptyWishlistState');
  const wishlistHeadingCount = document.getElementById('wishlistHeadingCount');
  const headerWishlistBadge = document.getElementById('wishlistBadge');
  const btnClearWishlist = document.getElementById('btnClearWishlist');
  const toastContainer = document.getElementById('toastContainer');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');

  const clearModalOverlay = document.getElementById('clearWishlistModal');
  const btnModalCancel = document.getElementById('btnModalCancel');
  const btnModalConfirmClear = document.getElementById('btnModalConfirmClear');

  let wishlistItems = [];

  async function loadWishlistData() {
    try {
      const res = await NovaAPI.getWishlist();
      if (res.ok && res.data.products) {
        wishlistItems = res.data.products;
      } else {
        wishlistItems = [];
      }
      renderWishlist();
    } catch (err) {
      console.warn('Failed to fetch wishlist from backend:', err);
      wishlistItems = [];
      renderWishlist();
    }
  }

  function renderWishlist() {
    const count = wishlistItems.length;

    updateWishlistCount(count);

    if (count === 0) {
      if (wishlistGrid) wishlistGrid.style.display = 'none';
      if (emptyWishlistState) emptyWishlistState.style.display = 'block';
      if (btnClearWishlist) btnClearWishlist.style.display = 'none';
      if (wishlistHeadingCount) wishlistHeadingCount.textContent = '0 Items';
      return;
    }

    if (wishlistGrid) wishlistGrid.style.display = 'grid';
    if (emptyWishlistState) emptyWishlistState.style.display = 'none';
    if (btnClearWishlist) btnClearWishlist.style.display = 'inline-flex';
    if (wishlistHeadingCount) {
      wishlistHeadingCount.textContent = `${count} ${count === 1 ? 'Item' : 'Items'}`;
    }

    if (wishlistGrid) {
      wishlistGrid.innerHTML = wishlistItems.map(product => {
        const imgSrc = product.image || 'assets/products/headphones.svg';
        const formattedPrice = formatPrice(product.price);
        const formattedOldPrice = product.old_price ? formatPrice(product.old_price) : '';

        return `
          <article class="wishlist-card" id="wishlist-item-${product.id}" data-id="${product.id}">
            <div class="wishlist-product-image">
              ${product.badge ? `
                <span class="wishlist-badge discount">
                  ${escapeHtml(product.badge)}
                </span>
              ` : ''}

              <button 
                type="button" 
                class="wishlist-heart-btn" 
                data-id="${product.id}" 
                title="Remove from wishlist" 
                aria-label="Remove ${escapeHtml(product.name)} from wishlist">
                <svg viewBox="0 0 24 24" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="currentColor">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>

              <a href="product.html?id=${product.id}" style="display:flex; width:100%; height:100%; align-items:center; justify-content:center;">
                <img 
                  src="${escapeHtml(imgSrc)}" 
                  onerror="this.onerror=null; this.src='assets/products/headphones.svg';" 
                  alt="${escapeHtml(product.name)}"
                >
              </a>
            </div>

            <div class="wishlist-card-body">
              <span class="wishlist-card-cat">${escapeHtml(product.category_name || product.category || 'General')}</span>
              <a href="product.html?id=${product.id}" class="wishlist-card-title">${escapeHtml(product.name)}</a>

              <div class="wishlist-card-rating">
                <span class="wishlist-stars" aria-hidden="true">
                  <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </span>
                <span style="font-weight:600; color:var(--text);">${Number(product.rating || 4.8).toFixed(1)}</span>
                <span class="wishlist-reviews-count">(${product.review_count || 120})</span>
              </div>

              <div class="wishlist-card-price-row">
                <span class="wishlist-price-current">${formattedPrice}</span>
                ${formattedOldPrice ? `<span class="wishlist-price-old">${formattedOldPrice}</span>` : ''}
              </div>

              <button 
                type="button" 
                class="btn-wishlist-add-cart" 
                data-id="${product.id}"
                aria-label="Add ${escapeHtml(product.name)} to cart">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                  <circle cx="9" cy="21" r="1"/>
                  <circle cx="20" cy="21" r="1"/>
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
                </svg>
                Add to Cart
              </button>
            </div>
          </article>
        `;
      }).join('');

      attachCardEventListeners();
    }
  }

  function attachCardEventListeners() {
    document.querySelectorAll('.wishlist-heart-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        await removeFromWishlist(id);
      });
    });

    document.querySelectorAll('.btn-wishlist-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        const res = await NovaAPI.addToCart(id, 1);
        btn.disabled = false;
        if (res.ok) {
          showToast(`✓ Product added to cart`);
        }
      });
    });
  }

  async function removeFromWishlist(id) {
    const cardEl = document.getElementById(`wishlist-item-${id}`);

    if (cardEl) {
      cardEl.style.opacity = '0';
      cardEl.style.transform = 'scale(0.96)';
    }

    const res = await NovaAPI.toggleWishlist(id);
    if (res.ok) {
      wishlistItems = wishlistItems.filter(p => String(p.id) !== String(id));
      renderWishlist();
      showToast(`✓ Removed from wishlist`);
    }
  }

  function updateWishlistCount(count) {
    if (headerWishlistBadge) {
      headerWishlistBadge.textContent = count;
      headerWishlistBadge.style.display = count > 0 ? 'inline-flex' : 'none';
    }
  }

  if (btnClearWishlist && clearModalOverlay) {
    btnClearWishlist.addEventListener('click', () => {
      clearModalOverlay.classList.add('active');
    });

    if (btnModalCancel) {
      btnModalCancel.addEventListener('click', () => {
        clearModalOverlay.classList.remove('active');
      });
    }

    if (btnModalConfirmClear) {
      btnModalConfirmClear.addEventListener('click', async () => {
        for (const item of wishlistItems) {
          await NovaAPI.toggleWishlist(item.id);
        }
        wishlistItems = [];
        clearModalOverlay.classList.remove('active');
        renderWishlist();
        showToast('✓ Wishlist cleared');
      });
    }
  }

  function showToast(message) {
    if (!toastContainer) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;

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
      }, 300);
    }, 2800);
  }

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

  if (mobileToggle && mobileNavDrawer) {
    mobileToggle.addEventListener('click', () => {
      mobileNavDrawer.classList.toggle('open');
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

  await loadWishlistData();
});
