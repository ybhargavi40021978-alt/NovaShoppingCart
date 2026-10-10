/**
 * NovaCart - Interface #18: Mobile View Page
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Pure Vanilla JavaScript (No Frameworks)
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  let products = [];
  let cart = [];
  let wishlist = [];

  const headerCartBadge = document.getElementById('headerCartBadge');
  const bottomCartBadge = document.getElementById('bottomCartBadge');
  const headerWishlistBadge = document.getElementById('headerWishlistBadge');
  const bottomWishlistBadge = document.getElementById('bottomWishlistBadge');
  const toast = document.getElementById('mobileToast');
  const toastMessage = document.getElementById('toastMessage');
  const dealsTimerEl = document.getElementById('dealsTimer');
  const searchInput = document.getElementById('mobileSearchInput');
  const hamburgerBtn = document.getElementById('mobileHamburgerBtn');
  const navDrawer = document.getElementById('mobileNavDrawer');
  const navOverlay = document.getElementById('mobileNavOverlay');
  const drawerCloseBtn = document.getElementById('drawerCloseBtn');

  async function loadData() {
    try {
      const [prodRes, cartRes, wishRes] = await Promise.all([
        NovaAPI.getProducts(),
        NovaAPI.getCart(),
        NovaAPI.getWishlist()
      ]);

      if (prodRes.ok && prodRes.data.products) {
        products = prodRes.data.products;
        syncProductsToCards();
      }

      if (cartRes.ok && cartRes.data.cart) {
        cart = cartRes.data.cart.items || [];
        updateBadges(cartRes.data.cart.item_count, null);
      }

      if (wishRes.ok && typeof wishRes.data.count !== 'undefined') {
        wishlist = wishRes.data.products ? wishRes.data.products.map(p => String(p.id)) : [];
        updateBadges(null, wishRes.data.count);
      }
    } catch (err) {
      console.warn('Mobile view backend error:', err);
    }
  }

  function syncProductsToCards() {
    if (!products || products.length === 0) return;

    document.querySelectorAll('.product-card').forEach((card, idx) => {
      const cardId = card.getAttribute('data-id');
      let p = products.find(item => String(item.id) === cardId || item.slug === cardId || `prod-${item.id}` === cardId);
      if (!p && products[idx]) {
        p = products[idx];
        card.setAttribute('data-id', p.id);
        const addBtn = card.querySelector('.btn-add-cart');
        if (addBtn) addBtn.setAttribute('data-id', p.id);
        const wishBtn = card.querySelector('.product-wishlist-btn');
        if (wishBtn) wishBtn.setAttribute('data-id', p.id);
      }

      if (p) {
        const priceEl = card.querySelector('.product-price');
        if (priceEl) priceEl.textContent = formatPrice(p.price);

        const oldPriceEl = card.querySelector('.product-old-price');
        if (oldPriceEl) {
          if (p.old_price) {
            oldPriceEl.textContent = formatPrice(p.old_price);
            oldPriceEl.style.display = 'inline';
          } else {
            oldPriceEl.style.display = 'none';
          }
        }

        const titleEl = card.querySelector('.product-title');
        if (titleEl) {
          titleEl.textContent = p.name;
          titleEl.style.cursor = 'pointer';
          titleEl.addEventListener('click', () => {
            window.location.href = `product.html?id=${p.id}`;
          });
        }
      }
    });

    document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
      const pId = String(btn.dataset.id);
      if (wishlist.includes(pId)) {
        btn.classList.add('active');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'currentColor');
      } else {
        btn.classList.remove('active');
        const svg = btn.querySelector('svg');
        if (svg) svg.setAttribute('fill', 'none');
      }
    });
  }

  function updateBadges(cartCount = null, wishCount = null) {
    if (cartCount !== null) {
      if (headerCartBadge) {
        headerCartBadge.textContent = cartCount;
        headerCartBadge.style.display = cartCount > 0 ? 'inline-flex' : 'none';
      }
      if (bottomCartBadge) {
        bottomCartBadge.textContent = cartCount;
        bottomCartBadge.style.display = cartCount > 0 ? 'inline-flex' : 'none';
      }
    }

    if (wishCount !== null) {
      if (headerWishlistBadge) {
        headerWishlistBadge.textContent = wishCount;
        headerWishlistBadge.style.display = wishCount > 0 ? 'inline-flex' : 'none';
      }
      if (bottomWishlistBadge) {
        bottomWishlistBadge.textContent = wishCount;
        bottomWishlistBadge.style.display = wishCount > 0 ? 'inline-flex' : 'none';
      }
    }
  }

  let toastTimeout = null;
  function showToast(msg) {
    if (!toast) return;
    if (toastMessage) toastMessage.textContent = msg;
    toast.classList.add('show');

    if (toastTimeout) clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      toast.classList.remove('show');
    }, 2400);
  }

  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const pid = btn.dataset.id;
      btn.disabled = true;
      const res = await NovaAPI.addToCart(pid, 1);
      btn.disabled = false;
      if (res.ok) {
        showToast('✓ Added to cart');
      }
    });
  });

  document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      const pid = btn.dataset.id;
      const res = await NovaAPI.toggleWishlist(pid);
      if (res.ok) {
        if (res.data.is_in_wishlist) {
          btn.classList.add('active');
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'currentColor');
          showToast('✓ Added to wishlist');
        } else {
          btn.classList.remove('active');
          const svg = btn.querySelector('svg');
          if (svg) svg.setAttribute('fill', 'none');
          showToast('Removed from wishlist');
        }
      }
    });
  });

  function startDealTimer() {
    if (!dealsTimerEl) return;

    let totalSeconds = 2 * 3600 + 14 * 60 + 36;

    setInterval(() => {
      if (totalSeconds > 0) {
        totalSeconds--;
      } else {
        totalSeconds = 24 * 3600;
      }

      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      const s = totalSeconds % 60;

      dealsTimerEl.textContent = `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    }, 1000);
  }

  if (searchInput) {
    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
          window.location.href = `shop.html?search=${encodeURIComponent(query)}`;
        }
      }
    });
  }

  function openDrawer() {
    if (navDrawer) navDrawer.classList.add('open');
    if (navOverlay) navOverlay.classList.add('open');
  }

  function closeDrawer() {
    if (navDrawer) navDrawer.classList.remove('open');
    if (navOverlay) navOverlay.classList.remove('open');
  }

  if (hamburgerBtn) hamburgerBtn.addEventListener('click', openDrawer);
  if (drawerCloseBtn) drawerCloseBtn.addEventListener('click', closeDrawer);
  if (navOverlay) navOverlay.addEventListener('click', closeDrawer);

  startDealTimer();
  await loadData();
});
