/**
 * NovaCart - Interface #10: Payment Page JavaScript
 * Connected to Django SQLite Backend with Indian Rupee (₹) Currency
 * 
 * - Cash on Delivery (default selected)
 * - Card Payment
 * - UPI
 * - Demo Payment
 * - Clickable option rows
 * - Submits real order to Django backend (/api/orders/create/)
 * - Clears cart and navigates seamlessly to order-success.html
 */

document.addEventListener('DOMContentLoaded', () => {
  'use strict';

  // 1. DOM References
  const form = document.getElementById('paymentMethodForm');
  const methodWrappers = document.querySelectorAll('.method-card-wrapper, .demo-payment-section');
  const radioInputs = document.querySelectorAll('input[name="paymentMethod"]');
  const btnContinueOrder = document.getElementById('btnContinueOrder');
  const btnText = document.getElementById('btnText');
  const btnSpinner = document.getElementById('btnSpinner');
  const paymentErrorBox = document.getElementById('paymentErrorBox');

  let selectedMethod = 'cod';
  let isSubmitting = false;

  // 2. Select Method Handler
  function setMethod(methodValue) {
    selectedMethod = methodValue;

    radioInputs.forEach(radio => {
      radio.checked = (radio.value === methodValue);
    });

    methodWrappers.forEach(wrapper => {
      const isThis = wrapper.getAttribute('data-method') === methodValue;
      wrapper.classList.toggle('selected', isThis);
    });

    if (paymentErrorBox) {
      paymentErrorBox.style.display = 'none';
      paymentErrorBox.textContent = '';
    }
  }

  // 3. Make whole containers clickable
  methodWrappers.forEach(wrapper => {
    wrapper.addEventListener('click', (e) => {
      if (e.target.closest('#btnContinueOrder')) {
        return;
      }
      const method = wrapper.getAttribute('data-method');
      if (method) {
        setMethod(method);
      }
    });
  });

  radioInputs.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.checked) {
        setMethod(radio.value);
      }
    });
  });

  // 4. Form Submission: "Continue to Order →"
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (isSubmitting) return;

      isSubmitting = true;

      // Processing state
      btnContinueOrder.disabled = true;
      if (btnSpinner) btnSpinner.style.display = 'inline-block';
      if (btnText) btnText.textContent = 'Processing Order...';

      if (paymentErrorBox) {
        paymentErrorBox.style.display = 'none';
        paymentErrorBox.textContent = '';
      }

      // Load shipping from session
      let shipping = {};
      try {
        shipping = JSON.parse(sessionStorage.getItem('novacart_checkout_shipping')) || {};
      } catch (e) {
        shipping = {};
      }

      // Generate or retrieve idempotency transaction key
      let paymentTxnId = sessionStorage.getItem('novacart_payment_txn_id');
      if (!paymentTxnId) {
        paymentTxnId = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
        sessionStorage.setItem('novacart_payment_txn_id', paymentTxnId);
      }

      const payload = {
        payment_method: selectedMethod,
        payment_id: paymentTxnId,
        full_name: shipping.fullName || '',
        email: shipping.email || '',
        phone: shipping.phone || '',
        address: shipping.address || '',
        city: shipping.city || '',
        state: shipping.state || '',
        postal_code: shipping.postalCode || '',
        subtotal: shipping.totals ? shipping.totals.subtotal : 0,
        shipping_fee: shipping.totals ? shipping.totals.shipping : 0,
        discount: shipping.totals ? shipping.totals.discount : 0,
        total_amount: shipping.totals ? shipping.totals.total : 0,
        items: shipping.items || []
      };

      try {
        // Send request to Django backend
        const res = await NovaAPI.createOrder(payload);
        let orderNumber = `NC-${Date.now().toString(36).toUpperCase()}`;

        if (res.ok && res.data.order) {
          orderNumber = res.data.order.order_number;
        }

        // Clear local storage cart and session transaction key
        sessionStorage.removeItem('novacart_payment_txn_id');
        sessionStorage.removeItem('novacart_checkout_shipping');
        localStorage.removeItem('novacart_cart');
        await NovaAPI.clearCart();

        // Save order identifier for celebratory banner
        const orderSummary = {
          orderId: orderNumber,
          method: selectedMethod,
          date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
        };
        localStorage.setItem('novacart_last_order', JSON.stringify(orderSummary));

        setTimeout(() => {
          window.location.href = `order-details.html?orderId=${encodeURIComponent(orderNumber)}&new=true`;
        }, 400);

      } catch (err) {
        console.error('Payment processing failed:', err);
        isSubmitting = false;
        btnContinueOrder.disabled = false;
        if (btnSpinner) btnSpinner.style.display = 'none';
        if (btnText) btnText.innerHTML = 'Continue to Order &rarr;';

        if (paymentErrorBox) {
          paymentErrorBox.textContent = '✕ An error occurred while processing your order. Please try again.';
          paymentErrorBox.style.display = 'block';
        }
      }
    });
  }

  // Initialize with Cash on Delivery selected
  setMethod('cod');
});
