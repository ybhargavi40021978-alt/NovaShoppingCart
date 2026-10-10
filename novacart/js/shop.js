/**
 * NovaCart - Shop Page JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Filtering, Sorting, Pagination, Search, Wishlist, Cart & Real-Time Sync
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  let products = [];
  let categories = [];
  let wishlist = [];

  const filters = {
    categories: [],
    maxPrice: 100000,
    minRating: 0,
    inStockOnly: false,
    searchQuery: '',
    sort: 'featured'
  };

  const ITEMS_PER_PAGE = 6;
  let currentPage = 1;

  // -------------------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------------------
  const shopGrid = document.getElementById('shopGrid');
  const shopCount = document.getElementById('shopProductCount');
  const sortSelect = document.getElementById('sortSelect');
  const paginationContainer = document.getElementById('paginationContainer');
  const priceSlider = document.getElementById('priceRangeSlider');
  const priceDisplay = document.getElementById('priceRangeDisplay');
  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  const headerSearchInput = document.getElementById('headerSearchInput');
  const inStockCheckbox = document.getElementById('inStockCheckbox');
  const cartBadge = document.getElementById('cartBadge');

  // Mobile Filter Drawer Elements
  const btnMobileFilter = document.getElementById('btnMobileFilter');
  const mobileFilterDrawer = document.getElementById('mobileFilterDrawer');
  const mobileFilterClose = document.getElementById('mobileFilterClose');
  const mobileFilterOverlay = document.getElementById('mobileFilterOverlay');
  const btnApplyMobileFilter = document.getElementById('btnApplyMobileFilter');
  const btnClearMobileFilter = document.getElementById('btnClearMobileFilter');

  // Parse URL Parameters
  const urlParams = new URLSearchParams(window.location.search);
  const searchParam = urlParams.get('search');
  const categoryParam = urlParams.get('category');
  const dealsParam = urlParams.get('deals');

  if (searchParam) {
    filters.searchQuery = searchParam;
    if (headerSearchInput) headerSearchInput.value = searchParam;
  }
  if (categoryParam) {
    filters.categories.push(categoryParam);
  }

  // -------------------------------------------------------------------------
  // Load Backend Data
  // -------------------------------------------------------------------------
  async function loadData() {
    try {
      const [prodRes, catRes, wishRes] = await Promise.all([
        NovaAPI.getProducts({ deals: !!dealsParam }),
        NovaAPI.getCategories(),
        NovaAPI.getWishlist()
      ]);

      if (prodRes.ok && prodRes.data.products) {
        products = prodRes.data.products;
      }
      if (catRes.ok && catRes.data.categories) {
        categories = catRes.data.categories;
        populateCategoryFilters();
      }
      if (wishRes.ok && wishRes.data.products) {
        wishlist = wishRes.data.products.map(p => String(p.id));
      }

      if (products.length > 0) {
        const highestPrice = Math.max(...products.map(p => p.price));
        if (priceSlider) {
          priceSlider.max = Math.ceil(highestPrice * 1.2 / 1000) * 1000;
          priceSlider.value = priceSlider.max;
          filters.maxPrice = Number(priceSlider.value);
          if (priceDisplay) priceDisplay.textContent = `₹0 — ${formatPrice(filters.maxPrice)}`;
        }
      }

      applyFiltersAndRender();
    } catch (err) {
      console.warn('Error loading shop catalog:', err);
      applyFiltersAndRender();
    }
  }

  function populateCategoryFilters() {
    document.querySelectorAll('.filter-checkbox-input[data-category]').forEach(cb => {
      const cat = cb.getAttribute('data-category');
      if (categoryParam && cat.toLowerCase() === categoryParam.toLowerCase()) {
        cb.checked = true;
        if (!filters.categories.includes(cat)) filters.categories.push(cat);
      }
    });
  }

  // -------------------------------------------------------------------------
  // Sticky Header Effect & Mobile Nav
  // -------------------------------------------------------------------------
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  const mobileToggle = document.getElementById('mobileMenuToggle');
  const mobileNavDrawer = document.getElementById('mobileNavDrawer');
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
  // Filtering & Sorting Core Logic
  // -------------------------------------------------------------------------
  function applyFiltersAndRender() {
    let result = products.filter(p => {
      if (filters.categories.length > 0) {
        const pCat = (p.category_name || p.category || '').toLowerCase();
        const matchesCat = filters.categories.some(c => c.toLowerCase() === pCat);
        if (!matchesCat) return false;
      }
      if (p.price > filters.maxPrice) {
        return false;
      }
      if (filters.minRating > 0 && p.rating < filters.minRating) {
        return false;
      }
      if (filters.inStockOnly && !p.in_stock && !p.stock) {
        return false;
      }
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const matchName = (p.name || '').toLowerCase().includes(q);
        const matchCat = (p.category_name || p.category || '').toLowerCase().includes(q);
        if (!matchName && !matchCat) return false;
      }
      return true;
    });

    switch (filters.sort) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'rating':
        result.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
        result.sort((a, b) => (b.badge === 'NEW' ? 1 : 0) - (a.badge === 'NEW' ? 1 : 0));
        break;
      case 'featured':
      default:
        result.sort((a, b) => a.id - b.id);
        break;
    }

    if (shopCount) {
      shopCount.textContent = `${result.length} Products`;
    }

    const totalPages = Math.ceil(result.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      currentPage = 1;
    }

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedItems = result.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    renderProductGrid(paginatedItems, result.length);
    renderPagination(totalPages);
  }

  // -------------------------------------------------------------------------
  // Render Product Grid in INR (₹)
  // -------------------------------------------------------------------------
  function renderProductGrid(items, totalCount) {
    if (!shopGrid) return;

    if (totalCount === 0) {
      shopGrid.innerHTML = `
        <div class="no-results-card">
          <div class="no-results-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              <line x1="8" y1="11" x2="14" y2="11"/>
            </svg>
          </div>
          <h3 class="no-results-title">${products.length === 0 ? 'No products yet in database' : 'No products found'}</h3>
          <p class="no-results-desc">${products.length === 0 ? 'Please check back soon.' : 'Try changing your filters or search.'}</p>
          <button class="btn-primary" id="noResultsClearBtn">Clear Filters</button>
        </div>
      `;

      const btn = document.getElementById('noResultsClearBtn');
      if (btn) btn.addEventListener('click', resetAllFilters);
      return;
    }

    shopGrid.innerHTML = items.map(p => {
      const isWishlisted = wishlist.includes(String(p.id)) || wishlist.includes(`prod-${p.id}`);
      let badgeHtml = '';
      if (p.badge) {
        let badgeClass = 'new';
        if (p.badge.includes('SALE')) badgeClass = 'sale';
        else if (p.badge.includes('%')) badgeClass = 'discount';
        badgeHtml = `<span class="shop-product-badge ${badgeClass}">${p.badge}</span>`;
      }

      const oldPriceHtml = p.old_price 
        ? `<span class="shop-price-old">${formatPrice(p.old_price)}</span>` 
        : '';

      const ratingVal = Number(p.rating || 4.8).toFixed(1);
      const reviewsCount = p.review_count || p.reviews || 0;

      return `
        <article class="shop-product-card" data-id="${p.id}">
          <div class="shop-product-card-top">
            ${badgeHtml}
            <button class="shop-wishlist-btn ${isWishlisted ? 'active' : ''}" data-id="${p.id}" aria-label="Add ${p.name} to wishlist">
              <svg viewBox="0 0 24 24" fill="${isWishlisted ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <a href="product.html?id=${p.id}" class="shop-product-img-box">
              <img src="${p.image || 'assets/products/headphones.svg'}" onerror="this.src='assets/products/headphones.svg'" alt="${p.name}">
            </a>
          </div>
          <div class="shop-product-body">
            <span class="shop-product-cat">${p.category_name || p.category || 'Product'}</span>
            <a href="product.html?id=${p.id}" class="shop-product-name">${p.name}</a>
            <div class="shop-product-rating-row">
              <span class="shop-product-stars">
                ${generateStarSVGs(p.rating || 4.8)}
              </span>
              <span class="shop-product-rate-num">${ratingVal}</span>
              <span class="shop-product-reviews-count">(${reviewsCount})</span>
            </div>
            <div class="shop-product-footer">
              <div class="shop-price-box">
                <span class="shop-price-current">${formatPrice(p.price)}</span>
                ${oldPriceHtml}
              </div>
              <button class="btn-shop-add-cart" data-id="${p.id}">
                Add to Cart
              </button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    shopGrid.querySelectorAll('.btn-shop-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pid = btn.getAttribute('data-id');
        btn.disabled = true;
        const res = await NovaAPI.addToCart(pid, 1);
        btn.disabled = false;
        if (res.ok) {
          showToast(`✓ Added to cart`);
          openCart();
        }
      });
    });

    shopGrid.querySelectorAll('.shop-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const pid = btn.getAttribute('data-id');
        const res = await NovaAPI.toggleWishlist(pid);
        if (res.ok) {
          if (res.data.is_in_wishlist) {
            btn.classList.add('active');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'currentColor');
            if (!wishlist.includes(String(pid))) wishlist.push(String(pid));
            showToast('✓ Added to wishlist');
          } else {
            btn.classList.remove('active');
            const svg = btn.querySelector('svg');
            if (svg) svg.setAttribute('fill', 'none');
            wishlist = wishlist.filter(id => id !== String(pid));
            showToast('Removed from wishlist');
          }
        }
      });
    });
  }

  function generateStarSVGs(rating) {
    const fullStars = Math.floor(rating || 5);
    let svgs = '';
    for (let i = 0; i < 5; i++) {
      svgs += `
        <svg viewBox="0 0 24 24" ${i < fullStars ? 'fill="currentColor"' : 'fill="none" stroke="currentColor"'}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      `;
    }
    return svgs;
  }

  // -------------------------------------------------------------------------
  // Pagination
  // -------------------------------------------------------------------------
  function renderPagination(totalPages) {
    if (!paginationContainer) return;
    if (totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    let html = `
      <button class="page-btn" id="prevPageBtn" ${currentPage === 1 ? 'disabled' : ''} aria-label="Previous Page">
        &larr;
      </button>
    `;

    for (let i = 1; i <= totalPages; i++) {
      html += `
        <button class="page-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">
          ${i}
        </button>
      `;
    }

    html += `
      <button class="page-btn" id="nextPageBtn" ${currentPage === totalPages ? 'disabled' : ''} aria-label="Next Page">
        &rarr;
      </button>
    `;

    paginationContainer.innerHTML = html;

    paginationContainer.querySelectorAll('.page-btn[data-page]').forEach(btn => {
      btn.addEventListener('click', () => {
        currentPage = parseInt(btn.getAttribute('data-page'), 10);
        applyFiltersAndRender();
        scrollToProductsTop();
      });
    });

    const prevBtn = document.getElementById('prevPageBtn');
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
          currentPage--;
          applyFiltersAndRender();
          scrollToProductsTop();
        }
      });
    }

    const nextBtn = document.getElementById('nextPageBtn');
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
          currentPage++;
          applyFiltersAndRender();
          scrollToProductsTop();
        }
      });
    }
  }

  function scrollToProductsTop() {
    const target = document.querySelector('.shop-products-header');
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  // -------------------------------------------------------------------------
  // Filters Event Listeners
  // -------------------------------------------------------------------------
  document.querySelectorAll('.filter-checkbox-input[data-category]').forEach(cb => {
    cb.addEventListener('change', () => {
      const cat = cb.getAttribute('data-category');
      if (cb.checked) {
        if (!filters.categories.includes(cat)) filters.categories.push(cat);
      } else {
        filters.categories = filters.categories.filter(c => c !== cat);
      }
      currentPage = 1;
      applyFiltersAndRender();
    });
  });

  if (priceSlider && priceDisplay) {
    priceSlider.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      filters.maxPrice = val;
      priceDisplay.textContent = `₹0 — ${formatPrice(val)}`;
      currentPage = 1;
      applyFiltersAndRender();
    });
  }

  document.querySelectorAll('input[name="ratingFilter"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      filters.minRating = parseFloat(e.target.value);
      currentPage = 1;
      applyFiltersAndRender();
    });
  });

  if (inStockCheckbox) {
    inStockCheckbox.addEventListener('change', (e) => {
      filters.inStockOnly = e.target.checked;
      currentPage = 1;
      applyFiltersAndRender();
    });
  }

  if (sortSelect) {
    sortSelect.addEventListener('change', (e) => {
      filters.sort = e.target.value;
      currentPage = 1;
      applyFiltersAndRender();
    });
  }

  if (headerSearchInput) {
    headerSearchInput.addEventListener('input', (e) => {
      filters.searchQuery = e.target.value.trim();
      currentPage = 1;
      applyFiltersAndRender();
    });
  }

  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', resetAllFilters);
  }

  function resetAllFilters() {
    filters.categories = [];
    filters.maxPrice = 100000;
    filters.minRating = 0;
    filters.inStockOnly = false;
    filters.searchQuery = '';
    filters.sort = 'featured';
    currentPage = 1;

    document.querySelectorAll('.filter-checkbox-input').forEach(cb => cb.checked = false);
    if (priceSlider) {
      priceSlider.value = priceSlider.max;
      filters.maxPrice = Number(priceSlider.value);
      if (priceDisplay) priceDisplay.textContent = `₹0 — ${formatPrice(filters.maxPrice)}`;
    }
    document.querySelectorAll('input[name="ratingFilter"]').forEach(r => r.checked = false);
    if (inStockCheckbox) inStockCheckbox.checked = false;
    if (sortSelect) sortSelect.value = 'featured';
    if (headerSearchInput) headerSearchInput.value = '';

    applyFiltersAndRender();
    showToast('Filters cleared');
  }

  // -------------------------------------------------------------------------
  // Mobile Filter Drawer Logic
  // -------------------------------------------------------------------------
  if (btnMobileFilter && mobileFilterDrawer && mobileFilterOverlay) {
    const openMobileFilter = () => {
      mobileFilterDrawer.classList.add('open');
      mobileFilterOverlay.classList.add('active');
    };

    const closeMobileFilter = () => {
      mobileFilterDrawer.classList.remove('open');
      mobileFilterOverlay.classList.remove('active');
    };

    btnMobileFilter.addEventListener('click', openMobileFilter);
    if (mobileFilterClose) mobileFilterClose.addEventListener('click', closeMobileFilter);
    mobileFilterOverlay.addEventListener('click', closeMobileFilter);
    if (btnApplyMobileFilter) {
      btnApplyMobileFilter.addEventListener('click', () => {
        closeMobileFilter();
        applyFiltersAndRender();
      });
    }
    if (btnClearMobileFilter) {
      btnClearMobileFilter.addEventListener('click', () => {
        resetAllFilters();
        closeMobileFilter();
      });
    }
  }

  // -------------------------------------------------------------------------
  // Side Cart Drawer Logic
  // -------------------------------------------------------------------------
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

  const checkoutBtnInDrawer = cartDrawer ? cartDrawer.querySelector('.btn-primary') : null;
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

  // -------------------------------------------------------------------------
  // Toast System
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

  await loadData();
});
