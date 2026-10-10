/**
 * NovaCart - Interface #9: Checkout Page JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * Dynamic real-time cart loading from backend API
 * Inline field validation: Email, Phone, Full Name, Address, City, State, Postal Code, Country
 * Seamless sequence navigation to payment.html
 */

document.addEventListener('DOMContentLoaded', async () => {
  'use strict';

  // ---------------------------------------------------------------------------
  // 1. DOM REFERENCES
  // ---------------------------------------------------------------------------
  const checkoutForm = document.getElementById('checkoutForm');
  const productListEl = document.getElementById('productList');
  const subtotalValEl = document.getElementById('subtotalVal');
  const shippingValEl = document.getElementById('shippingVal');
  const discountValEl = document.getElementById('discountVal');
  const totalValEl = document.getElementById('totalVal');

  const btnPlaceOrder = document.getElementById('btnPlaceOrder');
  const btnSpinner = document.getElementById('btnSpinner');
  const btnLabel = document.getElementById('btnLabel');
  const submissionFeedback = document.getElementById('submissionFeedback');

  // Input Fields & Error Elements
  const fields = {
    email: {
      input: document.getElementById('email'),
      error: document.getElementById('emailError'),
      validate: (val) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()),
      msg: 'Please enter a valid email address.'
    },
    phone: {
      input: document.getElementById('phone'),
      error: document.getElementById('phoneError'),
      validate: (val) => /^[\d\s+\-()]{7,}$/.test(val.trim()),
      msg: 'Please enter a valid phone number.'
    },
    fullName: {
      input: document.getElementById('fullName'),
      error: document.getElementById('fullNameError'),
      validate: (val) => val.trim().length >= 2,
      msg: 'Please enter your full name.'
    },
    address: {
      input: document.getElementById('address'),
      error: document.getElementById('addressError'),
      validate: (val) => val.trim().length >= 3,
      msg: 'Please enter your address.'
    },
    city: {
      input: document.getElementById('city'),
      error: document.getElementById('cityError'),
      validate: (val) => val.trim().length >= 2,
      msg: 'Please enter your city.'
    },
    state: {
      input: document.getElementById('state'),
      error: document.getElementById('stateError'),
      validate: (val) => val.trim().length >= 2,
      msg: 'Please enter your state.'
    },
    postalCode: {
      input: document.getElementById('postalCode'),
      error: document.getElementById('postalCodeError'),
      validate: (val) => val.trim().length >= 3,
      msg: 'Please enter your postal code.'
    },
    country: {
      input: document.getElementById('country'),
      error: document.getElementById('countryError'),
      validate: (val) => val && val.trim().length > 0,
      msg: 'Please select your country.'
    }
  };

  const apartmentInput = document.getElementById('apartment');

  // ---------------------------------------------------------------------------
  // 2. LOAD USER PROFILE PREFILL
  // ---------------------------------------------------------------------------
  async function prefillUserProfile() {
    try {
      const res = await NovaAPI.getProfile();
      if (res.ok && res.data.profile) {
        const p = res.data.profile;
        if (fields.fullName.input && !fields.fullName.input.value) {
          const name = `${p.first_name || ''} ${p.last_name || ''}`.trim() || p.username;
          fields.fullName.input.value = name;
        }
        if (fields.email.input && !fields.email.input.value && p.email) {
          fields.email.input.value = p.email;
        }
        if (fields.phone.input && !fields.phone.input.value && p.phone) {
          fields.phone.input.value = p.phone;
        }
      }
    } catch (e) {
      // quiet fallback
    }
  }

  // ---------------------------------------------------------------------------
  // 3. CART LOADING & TOTALS CALCULATION IN INR (₹)
  // ---------------------------------------------------------------------------
  let currentItems = [];
  let calculatedTotals = {
    subtotal: 0,
    shipping: 0,
    discount: 0,
    total: 0
  };

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadCartData() {
    try {
      const res = await NovaAPI.getCart();
      if (res.ok && res.data.cart && res.data.cart.items && res.data.cart.items.length > 0) {
        currentItems = res.data.cart.items.map((item, idx) => ({
          id: item.product_id,
          name: item.product_name || 'Product',
          price: Number(item.price) || 0,
          quantity: Number(item.quantity) || 1,
          image: item.product_image || 'assets/products/headphones.svg'
        }));
      } else {
        currentItems = [];
      }
    } catch (e) {
      console.warn('Checkout cart loading error:', e);
      currentItems = [];
    }

    renderSummary();
  }

  function renderSummary() {
    if (!productListEl) return;

    if (currentItems.length === 0) {
      productListEl.innerHTML = `
        <div style="text-align:center; padding: 2rem; color: #64748b;">
          Your cart is empty. <br><br>
          <a href="shop.html" class="btn-primary" style="display:inline-block; padding: 0.5rem 1rem; border-radius: 6px; text-decoration:none;">Browse Products</a>
        </div>
      `;
      if (subtotalValEl) subtotalValEl.textContent = formatPrice(0);
      if (shippingValEl) shippingValEl.textContent = formatPrice(0);
      if (discountValEl) discountValEl.textContent = formatPrice(0);
      if (totalValEl) totalValEl.textContent = formatPrice(0);
      if (btnPlaceOrder) btnPlaceOrder.disabled = true;
      return;
    }

    if (btnPlaceOrder) btnPlaceOrder.disabled = false;

    let subtotal = 0;
    let html = '';

    currentItems.forEach(item => {
      const lineTotal = item.price * item.quantity;
      subtotal += lineTotal;

      html += `
        <div class="product-item">
          <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.name)}" class="product-thumb" onerror="this.onerror=null; this.src='assets/products/headphones.svg';">
          <div class="product-info">
            <div class="product-name" title="${escapeHtml(item.name)}">${escapeHtml(item.name)}</div>
            <div class="product-qty">${formatPrice(item.price)} &times; ${item.quantity}</div>
          </div>
          <div class="product-price">${formatPrice(lineTotal)}</div>
        </div>
      `;
    });

    productListEl.innerHTML = html;

    let shipping = subtotal >= 499 ? 0 : 50;
    let discount = subtotal >= 2000 ? 100 : 0;
    let total = Math.max(0, subtotal - discount + shipping);

    calculatedTotals = { subtotal, shipping, discount, total };

    if (subtotalValEl) subtotalValEl.textContent = formatPrice(subtotal);
    if (shippingValEl) shippingValEl.textContent = shipping === 0 ? 'Free' : formatPrice(shipping);
    if (discountValEl) discountValEl.textContent = discount > 0 ? `-${formatPrice(discount)}` : formatPrice(0);
    if (totalValEl) totalValEl.textContent = formatPrice(total);
  }

  // ---------------------------------------------------------------------------
  // 4. REAL-TIME INLINE FIELD VALIDATION
  // ---------------------------------------------------------------------------
  Object.keys(fields).forEach(key => {
    const field = fields[key];
    if (!field.input) return;

    const validateField = () => {
      const val = field.input.value;
      const isValid = field.validate(val);

      if (!isValid && val.length > 0) {
        field.input.classList.add('invalid');
        if (field.error) {
          field.error.textContent = `✕ ${field.msg}`;
          field.error.classList.add('active');
        }
      } else if (isValid) {
        field.input.classList.remove('invalid');
        if (field.error) {
          field.error.textContent = '';
          field.error.classList.remove('active');
        }
      }
    };

    field.input.addEventListener('input', validateField);
    field.input.addEventListener('blur', validateField);
  });

  function validateAll() {
    let isValid = true;
    let firstInvalidInput = null;

    Object.keys(fields).forEach(key => {
      const field = fields[key];
      if (!field.input) return;

      const val = field.input.value;
      const valid = field.validate(val);

      if (!valid) {
        field.input.classList.add('invalid');
        if (field.error) {
          field.error.textContent = `✕ ${field.msg}`;
          field.error.classList.add('active');
        }
        isValid = false;
        if (!firstInvalidInput) {
          firstInvalidInput = field.input;
        }
      } else {
        field.input.classList.remove('invalid');
        if (field.error) {
          field.error.textContent = '';
          field.error.classList.remove('active');
        }
      }
    });

    if (firstInvalidInput) {
      firstInvalidInput.focus();
    }

    return isValid;
  }

  // ---------------------------------------------------------------------------
  // 5. ORDER SUBMISSION / PROCEED TO PAYMENT
  // ---------------------------------------------------------------------------
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (submissionFeedback) {
        submissionFeedback.style.display = 'none';
        submissionFeedback.textContent = '';
      }

      if (!validateAll()) {
        return;
      }

      if (currentItems.length === 0) {
        if (submissionFeedback) {
          submissionFeedback.textContent = '✕ Your cart is empty. Please add products before checking out.';
          submissionFeedback.style.display = 'block';
        }
        return;
      }

      if (btnPlaceOrder) btnPlaceOrder.disabled = true;
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      if (btnLabel) btnLabel.textContent = 'Continuing to Payment...';

      const shippingData = {
        email: fields.email.input.value.trim(),
        phone: fields.phone.input.value.trim(),
        fullName: fields.fullName.input.value.trim(),
        address: fields.address.input.value.trim(),
        apartment: apartmentInput ? apartmentInput.value.trim() : '',
        city: fields.city.input.value.trim(),
        state: fields.state.input.value.trim(),
        postalCode: fields.postalCode.input.value.trim(),
        country: fields.country.input.value,
        totals: calculatedTotals,
        items: currentItems
      };

      try {
        sessionStorage.setItem('novacart_checkout_shipping', JSON.stringify(shippingData));

        setTimeout(() => {
          window.location.href = 'payment.html';
        }, 400);

      } catch (err) {
        console.error('Checkout processing error:', err);
        if (submissionFeedback) {
          submissionFeedback.textContent = '✕ An error occurred. Please try again.';
          submissionFeedback.style.display = 'block';
        }
        if (btnPlaceOrder) btnPlaceOrder.disabled = false;
        if (btnSpinner) btnSpinner.style.display = 'none';
        if (btnLabel) btnLabel.textContent = 'Continue to Payment';
      }
    });
  }

  await prefillUserProfile();
  await loadCartData();
});
