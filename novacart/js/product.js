/**
 * NovaCart - Product Details Page JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Image gallery, Thumbnail switching, Color selection, Quantity counter,
 * Tabs switching, Add to Cart, Wishlist, Real-Time Sync & Related products
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  let currentProduct = null;
  let allProducts = [];
  let wishlist = [];
  let selectedColor = "Standard";
  let quantity = 1;

  // -------------------------------------------------------------------------
  // DOM Elements
  // -------------------------------------------------------------------------
  const breadcrumbProductName = document.getElementById('breadcrumbProductName');
  const productTitle = document.getElementById('productTitle');
  const productPriceCurrent = document.getElementById('productPriceCurrent');
  const productPriceOld = document.getElementById('productPriceOld');
  const productDiscountBadge = document.getElementById('productDiscountBadge');
  const productDescriptionText = document.getElementById('productDescriptionText');
  const productStockBadge = document.getElementById('productStockBadge');
  const mainProductImg = document.getElementById('mainProductImg');
  const thumbsContainer = document.getElementById('thumbsContainer');
  const colorOptionsContainer = document.getElementById('colorOptionsContainer');
  const selectedColorText = document.getElementById('selectedColorText');
  const qtyNumberEl = document.getElementById('qtyNumber');
  const qtyDecreaseBtn = document.getElementById('qtyDecrease');
  const qtyIncreaseBtn = document.getElementById('qtyIncrease');
  const btnDetailAddCart = document.getElementById('btnDetailAddCart');
  const btnDetailWishlist = document.getElementById('btnDetailWishlist');
  const cartBadge = document.getElementById('cartBadge');
  const relatedGrid = document.getElementById('relatedProductsGrid');
  const reviewsLink = document.getElementById('reviewsLink');

  // Sticky header
  const header = document.querySelector('.header');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      header.classList.add('scrolled');
    } else {
      header.classList.remove('scrolled');
    }
  });

  // Mobile nav drawer
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

  // Header Search Input
  const headerSearchInput = document.getElementById('headerSearchInput');
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

  // -------------------------------------------------------------------------
  // Load Product Data from Django Backend
  // -------------------------------------------------------------------------
  async function initProductPage() {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedId = urlParams.get('id') || '1';

    try {
      const [prodRes, listRes, wishRes] = await Promise.all([
        NovaAPI.getProduct(requestedId),
        NovaAPI.getProducts(),
        NovaAPI.getWishlist()
      ]);

      if (prodRes.ok && prodRes.data.product) {
        currentProduct = prodRes.data.product;
      } else if (listRes.ok && listRes.data.products && listRes.data.products.length > 0) {
        currentProduct = listRes.data.products[0];
      }

      if (listRes.ok && listRes.data.products) {
        allProducts = listRes.data.products;
      }

      if (wishRes.ok && wishRes.data.products) {
        wishlist = wishRes.data.products.map(p => String(p.id));
      }

      if (currentProduct) {
        renderProductDetails();
      }
    } catch (err) {
      console.warn('Error loading product details:', err);
    }
  }

  // -------------------------------------------------------------------------
  // Render Main Product Details
  // -------------------------------------------------------------------------
  function renderProductDetails() {
    if (!currentProduct) return;

    if (breadcrumbProductName) breadcrumbProductName.textContent = currentProduct.name;
    if (productTitle) productTitle.textContent = currentProduct.name;
    document.title = `${currentProduct.name} — NovaCart`;

    if (productPriceCurrent) productPriceCurrent.textContent = formatPrice(currentProduct.price);
    if (productPriceOld) {
      if (currentProduct.old_price) {
        productPriceOld.textContent = formatPrice(currentProduct.old_price);
        productPriceOld.style.display = 'inline';
      } else {
        productPriceOld.style.display = 'none';
      }
    }

    if (productDiscountBadge) {
      if (currentProduct.old_price && currentProduct.old_price > currentProduct.price) {
        const pct = Math.round(((currentProduct.old_price - currentProduct.price) / currentProduct.old_price) * 100);
        productDiscountBadge.textContent = `${pct}% OFF`;
        productDiscountBadge.style.display = 'inline-block';
      } else if (currentProduct.badge) {
        productDiscountBadge.textContent = currentProduct.badge;
        productDiscountBadge.style.display = 'inline-block';
      } else {
        productDiscountBadge.style.display = 'none';
      }
    }

    if (productDescriptionText) productDescriptionText.textContent = currentProduct.description || '';

    if (productStockBadge) {
      const inStock = currentProduct.in_stock !== false;
      if (inStock) {
        productStockBadge.textContent = "In Stock";
        productStockBadge.className = "product-stock-tag";
        if (btnDetailAddCart) btnDetailAddCart.disabled = false;
      } else {
        productStockBadge.textContent = "Out of Stock";
        productStockBadge.className = "product-stock-tag out-of-stock";
        if (btnDetailAddCart) btnDetailAddCart.disabled = true;
      }
    }

    renderGallery();
    renderColorOptions();
    renderTabsContent();
    syncWishlistBtnState();
    renderRelatedProducts();
  }

  // -------------------------------------------------------------------------
  // Image Gallery & Thumbnails Switching
  // -------------------------------------------------------------------------
  function renderGallery() {
    if (!mainProductImg) return;

    const mainSrc = currentProduct.image || 'assets/products/headphones.svg';
    mainProductImg.src = mainSrc;
    mainProductImg.onerror = () => { mainProductImg.src = 'assets/products/headphones.svg'; };
    mainProductImg.alt = currentProduct.name;

    if (!thumbsContainer) return;

    const images = (currentProduct.images && currentProduct.images.length > 0)
      ? currentProduct.images
      : [{ src: mainSrc, online: mainSrc, alt: currentProduct.name }];

    thumbsContainer.innerHTML = images.map((img, idx) => `
      <div class="product-thumb-item ${idx === 0 ? 'active' : ''}" data-index="${idx}" aria-label="Thumbnail ${idx + 1}" style="cursor: pointer;">
        <img src="${img.online || img.src}" onerror="this.src='${img.src || mainSrc}'" alt="${img.alt || currentProduct.name}">
      </div>
    `).join('');

    thumbsContainer.querySelectorAll('.product-thumb-item').forEach(thumb => {
      thumb.addEventListener('click', () => {
        thumbsContainer.querySelectorAll('.product-thumb-item').forEach(t => t.classList.remove('active'));
        thumb.classList.add('active');

        const idx = parseInt(thumb.getAttribute('data-index'), 10);
        const selectedImg = images[idx];
        if (selectedImg) {
          mainProductImg.style.opacity = '0';
          setTimeout(() => {
            mainProductImg.src = selectedImg.online || selectedImg.src;
            mainProductImg.alt = selectedImg.alt || currentProduct.name;
            mainProductImg.style.opacity = '1';
          }, 150);
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Color Selection
  // -------------------------------------------------------------------------
  function renderColorOptions() {
    if (!colorOptionsContainer || !selectedColorText) return;

    const colors = currentProduct.colors || [
      { name: "Standard", hex: "#111827" },
      { name: "Silver", hex: "#cbd5e1" },
      { name: "Nova Purple", hex: "#5b4bdb" }
    ];

    selectedColor = colors[0].name;
    selectedColorText.textContent = selectedColor;

    colorOptionsContainer.innerHTML = colors.map((col, idx) => `
      <button 
        type="button" 
        class="color-option-btn ${idx === 0 ? 'active' : ''}" 
        data-color="${col.name}" 
        style="background-color: ${col.hex};" 
        title="${col.name}"
        aria-label="Select color ${col.name}">
      </button>
    `).join('');

    colorOptionsContainer.querySelectorAll('.color-option-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        colorOptionsContainer.querySelectorAll('.color-option-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedColor = btn.getAttribute('data-color');
        selectedColorText.textContent = selectedColor;
      });
    });
  }

  // -------------------------------------------------------------------------
  // Quantity Selector
  // -------------------------------------------------------------------------
  if (qtyDecreaseBtn && qtyIncreaseBtn && qtyNumberEl) {
    qtyDecreaseBtn.addEventListener('click', () => {
      if (quantity > 1) {
        quantity--;
        qtyNumberEl.textContent = quantity;
      }
    });

    qtyIncreaseBtn.addEventListener('click', () => {
      quantity++;
      qtyNumberEl.textContent = quantity;
    });
  }

  // -------------------------------------------------------------------------
  // Add to Cart with Real API
  // -------------------------------------------------------------------------
  if (btnDetailAddCart) {
    btnDetailAddCart.addEventListener('click', async () => {
      if (!currentProduct) return;

      btnDetailAddCart.disabled = true;
      const res = await NovaAPI.addToCart(currentProduct.id, quantity);
      btnDetailAddCart.disabled = false;

      if (res.ok) {
        showToast(`✓ ${currentProduct.name} (${quantity}) added to cart`);
        openCart();
      } else {
        showToast('Could not add to cart.');
      }
    });
  }

  // -------------------------------------------------------------------------
  // Wishlist Handling with Real API
  // -------------------------------------------------------------------------
  if (btnDetailWishlist) {
    btnDetailWishlist.addEventListener('click', async () => {
      if (!currentProduct) return;

      const res = await NovaAPI.toggleWishlist(currentProduct.id);
      if (res.ok) {
        if (res.data.is_in_wishlist) {
          if (!wishlist.includes(String(currentProduct.id))) wishlist.push(String(currentProduct.id));
          showToast('✓ Added to wishlist');
        } else {
          wishlist = wishlist.filter(id => id !== String(currentProduct.id));
          showToast('Removed from wishlist');
        }
        syncWishlistBtnState();
      } else {
        showToast('Please login to manage your wishlist');
      }
    });
  }

  function syncWishlistBtnState() {
    if (!btnDetailWishlist || !currentProduct) return;
    const isWishlisted = wishlist.includes(String(currentProduct.id)) || wishlist.includes(`prod-${currentProduct.id}`);

    if (isWishlisted) {
      btnDetailWishlist.classList.add('active');
      btnDetailWishlist.innerHTML = `
        <svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        Wishlist
      `;
    } else {
      btnDetailWishlist.classList.remove('active');
      btnDetailWishlist.innerHTML = `
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
        </svg>
        Wishlist
      `;
    }
  }

  // -------------------------------------------------------------------------
  // Product Information Tabs
  // -------------------------------------------------------------------------
  function renderTabsContent() {
    const descText = document.getElementById('descTabText');
    if (descText && currentProduct.description) {
      descText.textContent = currentProduct.description;
    }

    const highlightsUl = document.getElementById('descHighlightsList');
    if (highlightsUl) {
      const highlights = currentProduct.highlights || [
        "Official Brand Warranty included",
        "Fast express dispatch across India",
        "Premium verified build quality",
        "7-day easy replacement policy"
      ];
      highlightsUl.innerHTML = highlights.map(h => `
        <li>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          ${h}
        </li>
      `).join('');
    }

    const specTable = document.getElementById('specTableBody');
    if (specTable) {
      const specs = currentProduct.specifications || [
        { label: "Category", value: currentProduct.category_name || "General" },
        { label: "Brand", value: "NovaCart Official" },
        { label: "Price", value: formatPrice(currentProduct.price) },
        { label: "Stock Status", value: currentProduct.in_stock ? "Available" : "Limited" },
        { label: "Warranty", value: "1 Year Official" }
      ];
      specTable.innerHTML = specs.map(s => `
        <tr>
          <td class="spec-label">${s.label}</td>
          <td class="spec-value">${s.value}</td>
        </tr>
      `).join('');
    }
  }

  const tabButtons = document.querySelectorAll('.tab-nav-item');
  const tabPanels = document.querySelectorAll('.tab-panel-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const tabTarget = btn.getAttribute('data-tab');

      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanels.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPanel = document.getElementById(`tab-${tabTarget}`);
      if (targetPanel) targetPanel.classList.add('active');
    });
  });

  if (reviewsLink) {
    reviewsLink.addEventListener('click', () => {
      const tabsCard = document.querySelector('.product-tabs-card');
      if (tabsCard) {
        tabsCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        const reviewTabBtn = document.querySelector('.tab-nav-item[data-tab="reviews"]');
        if (reviewTabBtn) reviewTabBtn.click();
      }
    });
  }

  // -------------------------------------------------------------------------
  // You May Also Like (Related Products in ₹)
  // -------------------------------------------------------------------------
  function renderRelatedProducts() {
    if (!relatedGrid || !allProducts) return;

    const relatedList = allProducts.filter(p => String(p.id) !== String(currentProduct.id)).slice(0, 4);

    relatedGrid.innerHTML = relatedList.map(item => {
      const isFav = wishlist.includes(String(item.id));
      return `
        <article class="shop-product-card" data-id="${item.id}">
          <div class="shop-product-card-top">
            <button class="shop-wishlist-btn ${isFav ? 'active' : ''}" data-id="${item.id}" aria-label="Add ${item.name} to wishlist">
              <svg viewBox="0 0 24 24" fill="${isFav ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" width="16" height="16">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
            </button>
            <a href="product.html?id=${item.id}" class="shop-product-img-box">
              <img src="${item.image || 'assets/products/headphones.svg'}" onerror="this.src='assets/products/headphones.svg'" alt="${item.name}">
            </a>
          </div>
          <div class="shop-product-body">
            <span class="shop-product-cat">${item.category_name || 'Electronics'}</span>
            <a href="product.html?id=${item.id}" class="shop-product-name">${item.name}</a>
            <div class="shop-product-rating-row">
              <span class="shop-product-stars">
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <svg viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
              </span>
              <span class="shop-product-rate-num">${Number(item.rating || 4.8).toFixed(1)}</span>
            </div>
            <div class="shop-product-footer">
              <span class="shop-price-current">${formatPrice(item.price)}</span>
              <button class="btn-shop-add-cart" data-id="${item.id}">Add to Cart</button>
            </div>
          </div>
        </article>
      `;
    }).join('');

    relatedGrid.querySelectorAll('.shop-wishlist-btn').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const res = await NovaAPI.toggleWishlist(id);
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

    relatedGrid.querySelectorAll('.btn-shop-add-cart').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        btn.disabled = true;
        const res = await NovaAPI.addToCart(id, 1);
        btn.disabled = false;
        if (res.ok) {
          showToast(`✓ Added to cart`);
          openCart();
        }
      });
    });
  }

  // -------------------------------------------------------------------------
  // Cart Drawer Logic
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

  await initProductPage();
});
