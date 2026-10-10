/**
 * NovaCart - Home Page JavaScript
 * Frontend logic connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Cart, Wishlist, Search, Tabs, Countdown, Newsletter, Animations
 */

function initNovaCartHome() {
  'use strict';

  let products = [];
  let cart = [];
  let wishlist = [];

  // -------------------------------------------------------------------------
  // Fetch real data from Django Backend
  // -------------------------------------------------------------------------
  async function loadInitialData() {
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
      }

      if (wishRes.ok && wishRes.data.products) {
        wishlist = wishRes.data.products.map(p => String(p.id));
        syncWishlistUI();
      }
    } catch (err) {
      console.warn('Backend connection notice:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Sync Real Database Products into Existing Product Cards
  // -------------------------------------------------------------------------
  function syncProductsToCards() {
    if (!products || products.length === 0) return;

    // Map each card by data-id or index
    const cards = document.querySelectorAll('.product-card');
    cards.forEach((card, index) => {
      const cardId = card.getAttribute('data-id');
      // Match by ID or fallback to product at this index
      let product = products.find(p => String(p.id) === cardId || p.slug === cardId || `prod-${p.id}` === cardId);
      if (!product && products[index]) {
        product = products[index];
        card.setAttribute('data-id', product.id);
      }

      if (product) {
        // Update price
        const priceEl = card.querySelector('.product-price');
        if (priceEl) priceEl.textContent = formatPrice(product.price);

        const oldPriceEl = card.querySelector('.product-old-price');
        if (oldPriceEl) {
          if (product.old_price) {
            oldPriceEl.textContent = formatPrice(product.old_price);
            oldPriceEl.style.display = 'inline';
          } else {
            oldPriceEl.style.display = 'none';
          }
        }

        // Update title
        const titleEl = card.querySelector('.product-title');
        if (titleEl) titleEl.textContent = product.name;

        // Make title/image clickable to product page
        if (titleEl && !titleEl.closest('a')) {
          titleEl.style.cursor = 'pointer';
          titleEl.addEventListener('click', () => {
            window.location.href = `product.html?id=${product.id}`;
          });
        }

        const imgContainer = card.querySelector('.product-image-container');
        if (imgContainer) {
          imgContainer.style.cursor = 'pointer';
          imgContainer.addEventListener('click', (e) => {
            if (!e.target.closest('.product-wishlist-btn')) {
              window.location.href = `product.html?id=${product.id}`;
            }
          });
        }

        // Update rating count & stars if available
        const ratingVal = card.querySelector('.rating-val');
        if (ratingVal && product.rating) {
          ratingVal.textContent = Number(product.rating).toFixed(1);
        }
      }
    });

    // Update Flash Sale deal item price in ₹
    const flashPrice = document.querySelector('.flash-current-price, .flash-product-price');
    if (flashPrice && products[0]) {
      flashPrice.textContent = formatPrice(products[0].price);
    }
    const flashOldPrice = document.querySelector('.flash-original-price, .flash-product-old-price');
    if (flashOldPrice && products[0]) {
      const oldVal = products[0].old_price || (Number(products[0].price) * 1.3);
      flashOldPrice.textContent = formatPrice(oldVal);
    }
  }

  // -------------------------------------------------------------------------
  // Live Header Search with Real Backend Products
  // -------------------------------------------------------------------------
  const searchInput = document.getElementById('headerSearchInput');
  const searchResultsDropdown = document.getElementById('searchResultsDropdown');

  if (searchInput && searchResultsDropdown) {
    searchInput.addEventListener('input', async (e) => {
      const query = e.target.value.trim().toLowerCase();
      if (!query) {
        searchResultsDropdown.classList.remove('active');
        searchResultsDropdown.innerHTML = '';
        return;
      }

      // Query products
      let matches = products.filter(p => 
        (p.name && p.name.toLowerCase().includes(query)) ||
        (p.category_name && p.category_name.toLowerCase().includes(query)) ||
        (p.category && p.category.toLowerCase().includes(query))
      );

      if (matches.length > 0) {
        searchResultsDropdown.innerHTML = matches.slice(0, 6).map(item => `
          <div class="search-result-item" data-product-id="${item.id}" style="cursor: pointer;">
            <img class="search-result-thumb" src="${item.image || 'assets/products/headphones.svg'}" onerror="this.src='assets/products/headphones.svg'" alt="${item.name}">
            <div class="search-result-info">
              <div class="search-result-name">${item.name}</div>
              <div class="search-result-price">${formatPrice(item.price)}</div>
            </div>
          </div>
        `).join('');

        searchResultsDropdown.querySelectorAll('.search-result-item').forEach(el => {
          el.addEventListener('click', () => {
            const pid = el.getAttribute('data-product-id');
            window.location.href = `product.html?id=${pid}`;
          });
        });
      } else {
        searchResultsDropdown.innerHTML = `<div class="search-no-results">No products found.</div>`;
      }
      searchResultsDropdown.classList.add('active');
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const val = searchInput.value.trim();
        if (val) {
          window.location.href = `shop.html?search=${encodeURIComponent(val)}`;
        }
      }
    });

    // Close search dropdown on click outside
    document.addEventListener('click', (e) => {
      if (!searchInput.contains(e.target) && !searchResultsDropdown.contains(e.target)) {
        searchResultsDropdown.classList.remove('active');
      }
    });

    // Search icon click triggers search
    const searchIcon = document.querySelector('.search-icon');
    if (searchIcon) {
      searchIcon.style.cursor = 'pointer';
      searchIcon.addEventListener('click', () => {
        const val = searchInput.value.trim();
        if (val) {
          window.location.href = `shop.html?search=${encodeURIComponent(val)}`;
        } else {
          searchInput.focus();
        }
      });
    }
  }

  // -------------------------------------------------------------------------
  // Wishlist Handling with Real API
  // -------------------------------------------------------------------------
  document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const productId = card ? card.getAttribute('data-id') : null;
      if (!productId) return;

      const res = await NovaAPI.toggleWishlist(productId);
      if (res.ok) {
        if (res.data.is_in_wishlist) {
          btn.classList.add('active');
          if (!wishlist.includes(String(productId))) wishlist.push(String(productId));
          showToast('✓ Added to wishlist');
        } else {
          btn.classList.remove('active');
          wishlist = wishlist.filter(id => id !== String(productId));
          showToast('Removed from wishlist');
        }
      } else {
        showToast('Please login to manage your wishlist');
      }
    });
  });

  function syncWishlistUI() {
    document.querySelectorAll('.product-wishlist-btn').forEach(btn => {
      const card = btn.closest('.product-card');
      if (card) {
        const pid = card.getAttribute('data-id');
        if (wishlist.includes(String(pid)) || wishlist.includes(`prod-${pid}`)) {
          btn.classList.add('active');
        } else {
          btn.classList.remove('active');
        }
      }
    });
  }

  // -------------------------------------------------------------------------
  // Add to Cart Interaction & Side Drawer
  // -------------------------------------------------------------------------
  document.querySelectorAll('.btn-add-cart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const card = btn.closest('.product-card');
      const productId = card ? card.getAttribute('data-id') : null;

      if (productId) {
        btn.disabled = true;
        const res = await NovaAPI.addToCart(productId, 1);
        btn.disabled = false;
        if (res.ok) {
          showToast('✓ Added to cart');
          openCart();
        } else {
          showToast('Could not add to cart.');
        }
      }
    });
  });

  // Shop Deal button in Flash Sale
  const btnDeal = document.querySelector('.btn-deal');
  if (btnDeal) {
    btnDeal.addEventListener('click', async () => {
      if (products.length > 0) {
        btnDeal.disabled = true;
        const res = await NovaAPI.addToCart(products[0].id, 1);
        btnDeal.disabled = false;
        if (res.ok) {
          showToast('✓ Added to cart');
          openCart();
        }
      } else {
        window.location.href = 'shop.html';
      }
    });
  }

  // Cart Drawer open/close
  const cartBtn = document.getElementById('headerCartBtn');
  const cartDrawer = document.getElementById('cartDrawer');
  const cartOverlay = document.getElementById('cartOverlay');
  const cartCloseBtn = document.getElementById('cartDrawerClose');

  const openCart = async () => {
    await renderCartDrawer();
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.add('active');
      cartOverlay.classList.add('active');
    }
  };

  const closeCart = () => {
    if (cartDrawer && cartOverlay) {
      cartDrawer.classList.remove('active');
      cartOverlay.classList.remove('active');
    }
  };

  if (cartBtn) cartBtn.addEventListener('click', openCart);
  if (cartCloseBtn) cartCloseBtn.addEventListener('click', closeCart);
  if (cartOverlay) cartOverlay.addEventListener('click', closeCart);

  // Wire Proceed to Checkout in side drawer
  const checkoutBtnInDrawer = document.getElementById('drawerCheckoutBtn') || (cartDrawer ? cartDrawer.querySelector('.btn-primary') : null);
  if (checkoutBtnInDrawer) {
    checkoutBtnInDrawer.addEventListener('click', () => {
      window.location.href = 'checkout.html';
    });
  }

  async function renderCartDrawer() {
    const body = document.getElementById('cartDrawerBody');
    const totalEl = document.getElementById('cartTotalValue');
    if (!body || !totalEl) return;

    body.innerHTML = `<div style="text-align:center; padding: 2rem; color: #64748b;">Loading cart...</div>`;

    const res = await NovaAPI.getCart();
    if (!res.ok || !res.data.cart || !res.data.cart.items || res.data.cart.items.length === 0) {
      body.innerHTML = `<div class="cart-empty-text">Your cart is empty.</div>`;
      totalEl.textContent = formatPrice(0);
      return;
    }

    const items = res.data.cart.items;
    let total = res.data.cart.total_price || 0;

    body.innerHTML = items.map(item => `
      <div class="cart-item" data-product-id="${item.product_id}">
        <img class="cart-item-thumb" src="${item.product_image || 'assets/products/headphones.svg'}" onerror="this.src='assets/products/headphones.svg'" alt="${item.product_name}">
        <div class="cart-item-info">
          <div class="cart-item-name">${item.product_name}</div>
          <div class="cart-item-price">${formatPrice(item.price)} &times; ${item.quantity}</div>
        </div>
        <span class="cart-item-remove" data-product-id="${item.product_id}" title="Remove item" style="cursor: pointer;">&times;</span>
      </div>
    `).join('');

    totalEl.textContent = formatPrice(total);

    // Make cart item thumbnail and name clickable to product details
    body.querySelectorAll('.cart-item-thumb, .cart-item-name').forEach(el => {
      el.style.cursor = 'pointer';
      el.addEventListener('click', (e) => {
        const itemEl = e.target.closest('.cart-item');
        const pid = itemEl ? itemEl.getAttribute('data-product-id') : null;
        if (pid) {
          window.location.href = `product.html?id=${pid}`;
        }
      });
    });

    // Remove buttons
    body.querySelectorAll('.cart-item-remove').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const pid = e.target.getAttribute('data-product-id');
        const remRes = await NovaAPI.removeFromCart(pid);
        if (remRes.ok) {
          showToast('Item removed from cart');
          renderCartDrawer();
        }
      });
    });
  }

  // Listen for global cart updates
  window.addEventListener('novacart:cart-updated', () => {
    if (cartDrawer && cartDrawer.classList.contains('active')) {
      renderCartDrawer();
    }
  });

  // -------------------------------------------------------------------------
  // Flash Sale Live Functional Countdown
  // -------------------------------------------------------------------------
  const daysEl = document.getElementById('countDays');
  const hoursEl = document.getElementById('countHours');
  const minsEl = document.getElementById('countMinutes');
  const secsEl = document.getElementById('countSeconds');

  let targetDate = localStorage.getItem('novacart_countdown_target');
  if (!targetDate) {
    const now = new Date();
    const durationMs = (2 * 24 * 3600 + 14 * 3600 + 38 * 60 + 21) * 1000;
    targetDate = new Date(now.getTime() + durationMs).getTime();
    localStorage.setItem('novacart_countdown_target', targetDate);
  } else {
    targetDate = parseInt(targetDate, 10);
  }

  function updateCountdown() {
    const now = new Date().getTime();
    let difference = targetDate - now;

    if (difference <= 0) {
      const durationMs = (2 * 24 * 3600 + 14 * 3600 + 38 * 60 + 21) * 1000;
      targetDate = new Date(now + durationMs).getTime();
      localStorage.setItem('novacart_countdown_target', targetDate);
      difference = durationMs;
    }

    const days = Math.floor(difference / (1000 * 60 * 60 * 24));
    const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((difference % (1000 * 60)) / 1000);

    if (daysEl) daysEl.textContent = String(days).padStart(2, '0');
    if (hoursEl) hoursEl.textContent = String(hours).padStart(2, '0');
    if (minsEl) minsEl.textContent = String(minutes).padStart(2, '0');
    if (secsEl) secsEl.textContent = String(seconds).padStart(2, '0');
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // -------------------------------------------------------------------------
  // New Arrivals Tabs Filtering
  // -------------------------------------------------------------------------
  const tabs = document.querySelectorAll('.new-arrivals-section .tab-btn');
  const arrivalCards = document.querySelectorAll('.new-arrivals-section .product-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const filter = tab.getAttribute('data-filter');

      arrivalCards.forEach(card => {
        const cat = card.getAttribute('data-category');
        if (filter === 'all' || cat === filter) {
          card.classList.remove('hidden');
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => {
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
          }, 30);
        } else {
          card.classList.add('hidden');
        }
      });
    });
  });

  // -------------------------------------------------------------------------
  // Newsletter Subscription (Inline Real-Time Validation)
  // -------------------------------------------------------------------------
  const newsletterForm = document.getElementById('newsletterForm');
  const newsletterEmail = document.getElementById('newsletterEmail');

  if (newsletterForm && newsletterEmail) {
    newsletterForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = newsletterEmail.value.trim();
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (emailPattern.test(email)) {
        showToast('✓ Successfully subscribed to NovaCart updates!');
        newsletterEmail.value = '';
      } else {
        showToast('✕ Please enter a valid email address');
      }
    });
  }

  // -------------------------------------------------------------------------
  // Toast Notification System
  // -------------------------------------------------------------------------
  const toastContainer = document.getElementById('toastContainer');

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

  // -------------------------------------------------------------------------
  // Scroll Reveal Animations
  // -------------------------------------------------------------------------
  const revealElements = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, {
      root: null,
      threshold: 0.12,
      rootMargin: '0px 0px -40px 0px'
    });

    revealElements.forEach(el => revealObserver.observe(el));
  } else {
    revealElements.forEach(el => el.classList.add('revealed'));
  }

  // -------------------------------------------------------------------------
  // Category Cards Click Navigation to Shop Page
  // -------------------------------------------------------------------------
  document.querySelectorAll('.category-card').forEach(card => {
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      const nameEl = card.querySelector('.category-name');
      const catName = nameEl ? nameEl.textContent.trim() : '';
      if (catName) {
        window.location.href = `shop.html?category=${encodeURIComponent(catName)}`;
      }
    });
  });

  // -------------------------------------------------------------------------
  // Mobile Navigation Drawer Toggle & Links
  // -------------------------------------------------------------------------
  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileDrawer = document.getElementById('mobileNavDrawer');

  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      mobileDrawer.classList.toggle('open');
    });

    document.addEventListener('click', (e) => {
      if (!mobileDrawer.contains(e.target) && !mobileToggle.contains(e.target)) {
        mobileDrawer.classList.remove('open');
      }
    });

    mobileDrawer.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', async (e) => {
        const href = link.getAttribute('href');
        if (link.id === 'mobileCartLink') {
          e.preventDefault();
          mobileDrawer.classList.remove('open');
          openCart();
        } else if (link.id === 'mobileAccountLink') {
          e.preventDefault();
          mobileDrawer.classList.remove('open');
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
        } else if (href && href.startsWith('#')) {
          e.preventDefault();
          mobileDrawer.classList.remove('open');
          const targetEl = document.querySelector(href);
          if (targetEl) {
            const headerOffset = 80;
            const elementPosition = targetEl.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
            window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
          }
        } else {
          mobileDrawer.classList.remove('open');
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Smooth Scrolling for All Internal Anchor Links with Header Offset
  // -------------------------------------------------------------------------
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (!targetId || targetId === '#' || this.closest('#mobileNavDrawer')) return;
      const targetEl = document.querySelector(targetId);
      if (targetEl) {
        e.preventDefault();
        const headerOffset = 80;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
      }
    });
  });

  // -------------------------------------------------------------------------
  // Hero & Visual Showcase Product Clicks
  // -------------------------------------------------------------------------
  const heroMainImg = document.querySelector('.hero-prod-main');
  const heroLaptopImg = document.querySelector('.hero-prod-laptop');
  const heroWatchImg = document.querySelector('.hero-prod-watch');
  const flashSaleImg = document.querySelector('.flash-headphones-img');
  const promoLaptopImg = document.querySelector('.promo-laptop-img');

  if (heroMainImg) {
    heroMainImg.style.cursor = 'pointer';
    heroMainImg.setAttribute('title', 'View Wireless Headphones');
    heroMainImg.addEventListener('click', () => {
      const p = products.find(prod => (prod.name && prod.name.toLowerCase().includes('headphone'))) || products[0];
      window.location.href = p ? `product.html?id=${p.id}` : 'product.html?id=13';
    });
  }

  if (heroLaptopImg) {
    heroLaptopImg.style.cursor = 'pointer';
    heroLaptopImg.setAttribute('title', 'View Everyday Laptop');
    heroLaptopImg.addEventListener('click', () => {
      const p = products.find(prod => (prod.name && prod.name.toLowerCase().includes('laptop'))) || products[2];
      window.location.href = p ? `product.html?id=${p.id}` : 'product.html?id=16';
    });
  }

  if (heroWatchImg) {
    heroWatchImg.style.cursor = 'pointer';
    heroWatchImg.setAttribute('title', 'View Smart Watch');
    heroWatchImg.addEventListener('click', () => {
      const p = products.find(prod => (prod.name && prod.name.toLowerCase().includes('watch'))) || products[1];
      window.location.href = p ? `product.html?id=${p.id}` : 'product.html?id=22';
    });
  }

  if (flashSaleImg) {
    flashSaleImg.style.cursor = 'pointer';
    flashSaleImg.setAttribute('title', 'View Flash Sale Deal');
    flashSaleImg.addEventListener('click', () => {
      const p = products[0];
      window.location.href = p ? `product.html?id=${p.id}` : 'product.html?id=13';
    });
  }

  if (promoLaptopImg) {
    promoLaptopImg.style.cursor = 'pointer';
    promoLaptopImg.setAttribute('title', 'Explore Laptops');
    promoLaptopImg.addEventListener('click', () => {
      const p = products.find(prod => (prod.name && prod.name.toLowerCase().includes('laptop')));
      window.location.href = p ? `product.html?id=${p.id}` : 'shop.html';
    });
  }

  // -------------------------------------------------------------------------
  // Social Links Feedback
  // -------------------------------------------------------------------------
  document.querySelectorAll('.social-link').forEach(link => {
    link.addEventListener('click', (e) => {
      if (link.getAttribute('href') === '#') {
        e.preventDefault();
        const label = link.getAttribute('aria-label') || 'social';
        showToast(`Connecting to NovaCart on ${label}...`);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Home Page: Your Recent Orders Section
  // -------------------------------------------------------------------------
  async function initHomeRecentOrders() {
    const section = document.getElementById('homeRecentOrdersSection');
    if (!section) return;

    const loadingEl = document.getElementById('homeOrdersLoading');
    const errorEl = document.getElementById('homeOrdersError');
    const guestEl = document.getElementById('homeOrdersGuestState');
    const emptyEl = document.getElementById('homeOrdersEmptyState');
    const gridEl = document.getElementById('homeOrdersGrid');
    const retryBtn = document.getElementById('homeOrdersRetryBtn');

    function setState(state) {
      if (loadingEl) loadingEl.style.display = state === 'loading' ? 'flex' : 'none';
      if (errorEl) errorEl.style.display = state === 'error' ? 'flex' : 'none';
      if (guestEl) guestEl.style.display = state === 'guest' ? 'flex' : 'none';
      if (emptyEl) emptyEl.style.display = state === 'empty' ? 'flex' : 'none';
      if (gridEl) gridEl.style.display = state === 'grid' ? 'grid' : 'none';
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

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderCards(orders) {
      if (!gridEl) return;
      gridEl.innerHTML = orders.map(order => {
        const orderNumber = order.order_number || order.order_id || 'NC00000';
        const orderDate = order.created_at || order.order_date || 'Recent';
        const orderStatus = order.order_status || 'Placed';
        const paymentStatus = order.payment_status || 'Completed';
        const items = order.items || [];
        const itemsCount = order.items_count || (items.reduce((acc, i) => acc + (i.quantity || 1), 0)) || items.length || 1;
        const totalAmount = NovaAPI.formatPrice(order.total_amount);

        const primaryItem = items[0] || {};
        const primaryTitle = primaryItem.product_name || primaryItem.name || 'Order Item';
        const primaryThumb = primaryItem.image_url || primaryItem.product_image || 'assets/products/headphones.svg';
        const extraCount = items.length > 1 ? items.length - 1 : 0;
        const extraText = extraCount > 0 ? ` + ${extraCount} more` : '';

        return `
          <article class="home-order-card" id="home-order-${escapeHtml(orderNumber)}">
            <div class="home-order-card-top">
              <div class="home-order-meta">
                <span class="home-order-id">#${escapeHtml(orderNumber)}</span>
                <span class="home-order-date">${escapeHtml(orderDate)}</span>
              </div>
              <div class="home-order-badges">
                <span class="badge ${getStatusBadgeClass(orderStatus)}">
                  <span style="font-size: 8px;">●</span> ${escapeHtml(orderStatus)}
                </span>
                <span class="badge ${getPaymentBadgeClass(paymentStatus)}">
                  ${escapeHtml(paymentStatus)}
                </span>
              </div>
            </div>

            <div class="home-order-card-body">
              <img 
                src="${escapeHtml(primaryThumb)}" 
                alt="${escapeHtml(primaryTitle)}" 
                class="home-order-thumb" 
                onerror="this.src='assets/products/headphones.svg';"
              >
              <div class="home-order-info">
                <h4 class="home-order-product-name" title="${escapeHtml(primaryTitle)}">${escapeHtml(primaryTitle)}</h4>
                <p class="home-order-items-count">${itemsCount} item${itemsCount > 1 ? 's' : ''}${extraText}</p>
              </div>
              <div class="home-order-price-col">
                <span class="home-order-price-label">Total</span>
                <span class="home-order-price-val">${totalAmount}</span>
              </div>
            </div>

            <div class="home-order-card-footer">
              <a href="order-tracking.html?orderId=${encodeURIComponent(orderNumber)}" class="home-order-btn-track">
                Track Order
              </a>
              <a href="order-details.html?orderId=${encodeURIComponent(orderNumber)}" class="home-order-btn-details">
                View Details &rarr;
              </a>
            </div>
          </article>
        `;
      }).join('');
    }

    async function fetchAndDisplay() {
      setState('loading');
      try {
        const ordersRes = await NovaAPI.getOrders();
        if (!ordersRes.ok || !ordersRes.data || !ordersRes.data.success) {
          setState('error');
          return;
        }

        const isAuthenticated = ordersRes.data.authenticated !== false;
        const orders = ordersRes.data.orders || [];

        if (orders.length > 0) {
          const latestThree = orders.slice(0, 3);
          renderCards(latestThree);
          setState('grid');
        } else if (isAuthenticated) {
          setState('empty');
        } else {
          setState('guest');
        }
      } catch (err) {
        console.error('Home Recent Orders error:', err);
        setState('error');
      }
    }

    if (retryBtn) {
      retryBtn.addEventListener('click', (e) => {
        e.preventDefault();
        fetchAndDisplay();
      });
    }

    fetchAndDisplay();
  }

  // Initialize Home Recent Orders immediately
  initHomeRecentOrders();

  // Load initial backend catalog and cart data in parallel
  loadInitialData();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initNovaCartHome);
} else {
  initNovaCartHome();
}
