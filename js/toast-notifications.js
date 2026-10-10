/**
 * NovaCart - Reusable Toast Notifications System & Showcase Controller
 * Pure Vanilla JavaScript (ES6+) - Accessible, Responsive, Framework-Free
 */

(function () {
  'use strict';

  // -------------------------------------------------------------------------
  // CONSTANTS & SVG ICON DEFINITIONS
  // -------------------------------------------------------------------------
  const MAX_TOASTS = 4;
  const DEFAULT_DURATION = 5000;
  const DEFAULT_POSITION = 'top-right';

  const ICONS = {
    success: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>`,
    error: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="15" y1="9" x2="9" y2="15"/>
      <line x1="9" y1="9" x2="15" y2="15"/>
    </svg>`,
    warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/>
      <line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>`,
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="16" x2="12" y2="12"/>
      <line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>`,
    close: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>`
  };

  const TYPE_DEFAULT_MESSAGES = {
    success: 'Product added to your cart successfully.',
    error: 'Something went wrong. Please try again.',
    warning: 'Only a few items are left in stock.',
    info: 'Your wishlist has been updated.'
  };

  // -------------------------------------------------------------------------
  // TOAST STACK CONTAINER MANAGEMENT
  // -------------------------------------------------------------------------
  let toastContainer = null;
  let currentPositionClass = 'pos-top-right';

  function getOrCreateContainer(position) {
    if (!toastContainer) {
      toastContainer = document.getElementById('toastStackContainer');
    }

    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastStackContainer';
      toastContainer.className = 'toast-stack-container';
      toastContainer.setAttribute('aria-label', 'Notifications stack');
      document.body.appendChild(toastContainer);
    }

    const pos = position || getSelectedPosition();
    updateContainerPosition(pos);
    return toastContainer;
  }

  function updateContainerPosition(positionName) {
    if (!toastContainer) return;

    const validPositions = [
      'top-right', 'top-center', 'top-left',
      'bottom-right', 'bottom-center', 'bottom-left'
    ];

    const cleanPos = validPositions.includes(positionName) ? positionName : 'top-right';
    const newClass = `pos-${cleanPos}`;

    if (currentPositionClass !== newClass) {
      toastContainer.classList.remove(currentPositionClass);
      toastContainer.classList.add(newClass);
      currentPositionClass = newClass;
    }
  }

  function getSelectedPosition() {
    const select = document.getElementById('toastPositionSelect');
    return select ? select.value : DEFAULT_POSITION;
  }

  function getSelectedDuration() {
    const select = document.getElementById('toastDurationSelect');
    return select ? parseInt(select.value, 10) : DEFAULT_DURATION;
  }

  // -------------------------------------------------------------------------
  // CORE REUSABLE TOAST CREATION
  // -------------------------------------------------------------------------
  /**
   * Display a NovaCart Toast Notification
   * @param {Object|string} options - Configuration object or message string
   * @param {string} [options.type='success'] - 'success' | 'error' | 'warning' | 'info'
   * @param {string} options.message - The text message to display
   * @param {number} [options.duration] - Time before auto-dismiss in milliseconds
   * @param {string} [options.position] - Override position ('top-right', etc.)
   * @returns {HTMLElement} The created toast DOM element
   */
  function showToast(options) {
    // Normalize options
    let config = {
      type: 'success',
      message: '',
      duration: getSelectedDuration(),
      position: getSelectedPosition()
    };

    if (typeof options === 'string') {
      config.message = options;
    } else if (options && typeof options === 'object') {
      config = Object.assign(config, options);
    }

    if (!config.message) {
      config.message = TYPE_DEFAULT_MESSAGES[config.type] || 'Notification message';
    }

    const container = getOrCreateContainer(config.position);

    // Limit maximum visible notifications to 4
    const activeToasts = container.querySelectorAll('.toast-item:not(.hide)');
    if (activeToasts.length >= MAX_TOASTS) {
      const oldestToast = activeToasts[0];
      if (oldestToast && oldestToast._dismiss) {
        oldestToast._dismiss(true); // immediate clean dismiss
      }
    }

    // Build Toast Element
    const toast = document.createElement('div');
    toast.className = `toast-item ${config.type}`;
    toast.setAttribute('role', config.type === 'error' ? 'alert' : 'status');
    toast.setAttribute('aria-live', config.type === 'error' ? 'assertive' : 'polite');
    toast.setAttribute('aria-atomic', 'true');

    const iconSvg = ICONS[config.type] || ICONS.info;

    toast.innerHTML = `
      <div class="toast-content-wrapper">
        <div class="toast-icon" aria-hidden="true">${iconSvg}</div>
        <p class="toast-message-text">${escapeHtml(config.message)}</p>
        <button type="button" class="toast-close-btn" aria-label="Close notification">
          ${ICONS.close}
        </button>
      </div>
      <div class="toast-progress-track" aria-hidden="true">
        <div class="toast-progress-indicator"></div>
      </div>
    `;

    // Append to container
    container.appendChild(toast);

    // Force reflow and show entrance transition
    void toast.offsetWidth;
    toast.classList.add('show');

    // Timer & Progress Management
    const progressBar = toast.querySelector('.toast-progress-indicator');
    const closeBtn = toast.querySelector('.toast-close-btn');

    const duration = config.duration > 0 ? config.duration : DEFAULT_DURATION;
    let remainingTime = duration;
    let startTime = Date.now();
    let isPaused = false;
    let timerId = null;
    let animFrameId = null;

    function stepProgress() {
      if (isPaused) return;

      const elapsed = Date.now() - startTime;
      const progressPercent = Math.max(0, 100 - (elapsed / remainingTime) * 100);

      if (progressBar) {
        progressBar.style.width = `${progressPercent}%`;
      }

      if (elapsed < remainingTime) {
        animFrameId = requestAnimationFrame(stepProgress);
      }
    }

    function startTimer() {
      startTime = Date.now();
      timerId = setTimeout(() => {
        dismissToast();
      }, remainingTime);

      animFrameId = requestAnimationFrame(stepProgress);
    }

    function pauseTimer() {
      if (isPaused) return;
      isPaused = true;
      clearTimeout(timerId);
      cancelAnimationFrame(animFrameId);
      const elapsed = Date.now() - startTime;
      remainingTime = Math.max(0, remainingTime - elapsed);
    }

    function resumeTimer() {
      if (!isPaused || remainingTime <= 0) return;
      isPaused = false;
      startTimer();
    }

    function dismissToast(immediate) {
      clearTimeout(timerId);
      cancelAnimationFrame(animFrameId);

      if (immediate) {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
        return;
      }

      toast.classList.remove('show');
      toast.classList.add('hide');

      setTimeout(() => {
        if (toast.parentNode) {
          toast.parentNode.removeChild(toast);
        }
      }, 250);
    }

    // Attach dismissal reference
    toast._dismiss = dismissToast;

    // Hover Pause & Resume
    toast.addEventListener('mouseenter', pauseTimer);
    toast.addEventListener('mouseleave', resumeTimer);

    // Close button click
    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      dismissToast();
    });

    // Start auto-dismiss countdown
    startTimer();

    return toast;
  }

  // Clear all currently visible toasts
  function clearAllToasts() {
    if (!toastContainer) return;
    const toasts = toastContainer.querySelectorAll('.toast-item');
    toasts.forEach((t) => {
      if (t._dismiss) {
        t._dismiss();
      } else if (t.parentNode) {
        t.parentNode.removeChild(t);
      }
    });
  }

  // HTML sanitization helper
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Export to global scope for use in all NovaCart pages
  window.showToast = showToast;
  window.clearAllToasts = clearAllToasts;

  // -------------------------------------------------------------------------
  // PAGE INTERACTIVE CONTROLLER (SHOWCASE PAGE)
  // -------------------------------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    let activeType = 'success';

    // Elements
    const typeButtons = document.querySelectorAll('.type-btn');
    const positionSelect = document.getElementById('toastPositionSelect');
    const durationSelect = document.getElementById('toastDurationSelect');

    const previewToastBox = document.getElementById('livePreviewToast');
    const previewIcon = document.getElementById('previewToastIcon');
    const previewMsg = document.getElementById('previewToastMsg');
    const previewProgress = document.getElementById('previewProgressFill');
    const previewCloseBtn = document.getElementById('previewCloseBtn');

    const btnShow = document.getElementById('btnShowNotification');
    const btnShowAll = document.getElementById('btnShowAllNotifications');
    const btnClearAll = document.getElementById('btnClearAll');
    const examplePreviewButtons = document.querySelectorAll('.example-btn');

    // 1. Live Preview Demo In-Card Updater
    let livePreviewTimer = null;
    function updateLivePreviewBox(type) {
      if (!previewToastBox) return;

      // Update styling
      previewToastBox.className = `preview-toast-demo ${type}`;

      if (previewIcon) {
        previewIcon.innerHTML = ICONS[type] || ICONS.info;
      }

      if (previewMsg) {
        previewMsg.textContent = TYPE_DEFAULT_MESSAGES[type] || 'Product added to your cart successfully.';
      }

      // Progress bar animation reset & loop
      if (previewProgress) {
        previewProgress.style.transition = 'none';
        previewProgress.style.width = '100%';

        // Set matching accent color
        const accentColors = {
          success: 'var(--success)',
          error: 'var(--danger)',
          warning: 'var(--warning)',
          info: 'var(--primary)'
        };
        previewProgress.style.backgroundColor = accentColors[type] || 'var(--primary)';

        clearTimeout(livePreviewTimer);
        setTimeout(() => {
          previewProgress.style.transition = 'width 4.8s linear';
          previewProgress.style.width = '0%';
        }, 50);

        livePreviewTimer = setTimeout(() => {
          if (previewProgress) {
            previewProgress.style.transition = 'none';
            previewProgress.style.width = '100%';
          }
        }, 5000);
      }
    }

    // 2. Type Selector Click Handlers
    typeButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type');
        if (!type) return;

        activeType = type;

        // Toggle active button
        typeButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');

        // Update live preview in card
        updateLivePreviewBox(activeType);

        // Immediately preview the toast in floating stack
        showToast({
          type: activeType,
          message: TYPE_DEFAULT_MESSAGES[activeType],
          duration: getSelectedDuration(),
          position: getSelectedPosition()
        });
      });
    });

    // 3. Position Dropdown Change Handler
    if (positionSelect) {
      positionSelect.addEventListener('change', () => {
        const newPos = positionSelect.value;
        updateContainerPosition(newPos);
      });
    }

    // 4. Duration Dropdown Change Handler
    if (durationSelect) {
      durationSelect.addEventListener('change', () => {
        // Updated for subsequent toasts
      });
    }

    // 5. Live Preview Demo Close Button
    if (previewCloseBtn) {
      previewCloseBtn.addEventListener('click', () => {
        if (previewToastBox) {
          previewToastBox.style.opacity = '0.3';
          previewToastBox.style.transform = 'scale(0.98)';
          setTimeout(() => {
            previewToastBox.style.opacity = '1';
            previewToastBox.style.transform = 'scale(1)';
            updateLivePreviewBox(activeType);
          }, 400);
        }
      });
    }

    // 6. Action Button: Show Current Notification
    if (btnShow) {
      btnShow.addEventListener('click', () => {
        showToast({
          type: activeType,
          message: TYPE_DEFAULT_MESSAGES[activeType],
          duration: getSelectedDuration(),
          position: getSelectedPosition()
        });
      });
    }

    // 7. Action Button: Show All Notifications (Sequentially)
    if (btnShowAll) {
      btnShowAll.addEventListener('click', () => {
        const sequence = [
          { type: 'success', message: 'Product added to your cart successfully.' },
          { type: 'info', message: 'Your wishlist has been updated.' },
          { type: 'warning', message: 'Only a few items are left in stock.' },
          { type: 'error', message: 'Something went wrong. Please try again.' }
        ];

        sequence.forEach((item, index) => {
          setTimeout(() => {
            showToast({
              type: item.type,
              message: item.message,
              duration: getSelectedDuration(),
              position: getSelectedPosition()
            });
          }, index * 320);
        });
      });
    }

    // 8. Action Button: Clear All
    if (btnClearAll) {
      btnClearAll.addEventListener('click', () => {
        clearAllToasts();
      });
    }

    // 9. Example Cards "Preview" Buttons
    examplePreviewButtons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-type') || 'success';
        const msg = btn.getAttribute('data-message') || TYPE_DEFAULT_MESSAGES[type];

        showToast({
          type: type,
          message: msg,
          duration: getSelectedDuration(),
          position: getSelectedPosition()
        });
      });
    });

    // Initial Live Preview Setup
    updateLivePreviewBox(activeType);

    // -------------------------------------------------------------------------
    // 10. REAL HEADER CART & WISHLIST COUNT BADGES
    // -------------------------------------------------------------------------
    const cartBadge = document.getElementById('cartBadge');
    const wishlistBadge = document.getElementById('wishlistBadge');

    function syncBadgesFromStorage() {
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
      } catch (e) {
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
      } catch (e) {
        if (wishlistBadge) wishlistBadge.style.display = 'none';
      }
    }

    syncBadgesFromStorage();
    window.addEventListener('storage', syncBadgesFromStorage);

    // Header buttons redirection
    const headerCartBtn = document.getElementById('headerCartBtn');
    if (headerCartBtn) {
      headerCartBtn.addEventListener('click', () => {
        window.location.href = 'cart.html';
      });
    }

    const headerWishlistBtn = document.getElementById('headerWishlistBtn');
    if (headerWishlistBtn) {
      headerWishlistBtn.addEventListener('click', () => {
        window.location.href = 'wishlist.html';
      });
    }

    const headerAccountBtn = document.getElementById('headerAccountBtn');
    if (headerAccountBtn) {
      headerAccountBtn.addEventListener('click', () => {
        window.location.href = 'profile.html';
      });
    }

    // -------------------------------------------------------------------------
    // 11. MOBILE DRAWER NAVIGATION TOGGLE
    // -------------------------------------------------------------------------
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const mobileNavDrawer = document.getElementById('mobileNavDrawer');

    if (mobileMenuToggle && mobileNavDrawer) {
      mobileMenuToggle.addEventListener('click', () => {
        const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
        mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
        mobileNavDrawer.classList.toggle('active');
      });

      // Close drawer on clicking outside
      document.addEventListener('click', (e) => {
        if (
          !mobileMenuToggle.contains(e.target) &&
          !mobileNavDrawer.contains(e.target) &&
          mobileNavDrawer.classList.contains('active')
        ) {
          mobileMenuToggle.setAttribute('aria-expanded', 'false');
          mobileNavDrawer.classList.remove('active');
        }
      });
    }

    // Header search interaction
    const headerSearchInput = document.getElementById('headerSearchInput');
    if (headerSearchInput) {
      headerSearchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && headerSearchInput.value.trim()) {
          window.location.href = `shop.html?search=${encodeURIComponent(headerSearchInput.value.trim())}`;
        }
      });
    }
  });
})();
