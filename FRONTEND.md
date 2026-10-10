# NovaCart — Frontend Architecture Documentation

## Overview

The **NovaCart** frontend is built as a modern, high-performance, responsive e-commerce web application utilizing **Semantic HTML5**, **Vanilla JavaScript (ES6+)**, and **Vanilla CSS3 with Design Tokens**. It contains zero heavy external client frameworks (like React or Angular), resulting in sub-second initial paint times, seamless offline resilience, and fluid mobile interactions.

All monetary values are natively standardized to **Indian Rupees (`₹`)**.

---

## Directory Structure (`frontend/`)

```text
frontend/
│
├── index.html                  # Home Page (hero, categories, flash sales, recent orders, testimonials)
├── shop.html                   # Catalog with multi-facet filters, sorting, and live search
├── product.html                # Product detail view, gallery zoom, tabs, reviews, and stock
├── cart.html                   # Full-page shopping cart with line totals and coupon codes
├── empty-cart.html             # Friendly empty cart state with recommendation cards
├── checkout.html               # Multi-step checkout with address validation
├── payment.html                # Simulated payment processing (Cards, UPI, Net Banking, COD)
├── order-success.html          # Order confirmation screen with unique order ID & summary
├── orders.html                 # My Orders dashboard with full purchase history
├── order-details.html          # Itemized order details & printable receipt invoice
├── order-tracking.html         # Visual 4-step live order milestone tracker
├── wishlist.html               # Wishlist management with "Move to Cart" action
├── profile.html                # User profile dashboard and default address manager
├── login.html                  # Login form with instant inline validation
├── register.html               # Registration form with live password strength checker
├── notifications.html          # In-app notification center with read/unread tracking
├── mobile-menu.html            # Mobile-optimized slide-out navigation menu
├── mobile-view.html            # Mobile responsive viewport layout
├── toast-notifications.html    # Standalone toast alert showcase and testing
├── 404.html                    # Branded error page with navigation recovery
│
├── css/                        # Stylesheets & Design System
│   ├── style.css               # Global CSS variables, reset, layout, and home page styling
│   ├── orders.css              # Styling for orders, order details, tracking & recent orders
│   ├── shop.css                # Catalog filters, product cards, and grid styles
│   ├── product.css             # Product details, image gallery, and review tabs
│   ├── cart.css                # Cart drawer, cart table, and checkout form styling
│   ├── payment.css             # Payment method selection and security badges
│   ├── profile.css             # Profile account cards and address management styles
│   ├── notifications.css       # Notification list and badge styles
│   ├── mobile-menu.css         # Responsive mobile navigation drawer styling
│   ├── mobile-view.css         # Mobile viewport adjustments
│   ├── toast-notifications.css # Global floating toast alerts styling
│   └── 404.css                 # 404 error page styling
│
├── js/                         # JavaScript Modules
│   ├── api-client.js           # Centralized NovaAPI service & badge synchronization
│   ├── script.js               # Home page dynamic interactions & recent orders loader
│   ├── orders.js               # My Orders dashboard controller
│   ├── order-details.js        # Order breakdown & printable invoice generator
│   ├── order-tracking.js       # Live 4-stage shipment tracker controller
│   ├── shop.js                 # Catalog filtering, search, sorting & pagination
│   ├── product.js              # Product gallery, quantity selector & wishlist toggle
│   ├── cart.js                 # Persistent cart calculations & slide-in drawer
│   ├── checkout.js             # Address validation & checkout controller
│   ├── payment.js              # Payment simulation & order submission controller
│   ├── login.js                # Login authentication and session initiation
│   ├── register.js             # Sign-up validation & password criteria checks
│   ├── profile.js              # Profile data manager
│   ├── notifications.js        # Notification actions & mark-as-read controller
│   ├── mobile-menu.js          # Mobile drawer toggle and gesture handler
│   └── toast-notifications.js  # Global dynamic toast notification service
│
└── assets/                     # Media & Vector Graphics
    ├── icons/                  # Inline SVG vector icons
    ├── products/               # Product SVG vector illustrations (headphones, shoes, etc.)
    ├── categories/             # Category icons (electronics, fashion, footwear, beauty)
    └── avatars/                # Customer avatar illustrations
```

---

## Design System & Styling Tokens

All styling rules are centralized in `frontend/css/style.css` using CSS custom properties (`:root`):

```css
:root {
  /* Color Palette */
  --nc-primary: #5145E5;         /* Indigo Primary */
  --nc-primary-hover: #4338CA;
  --nc-primary-light: #EEF2FF;
  --nc-secondary: #0EA5E9;       /* Sky Blue Accent */
  --nc-success: #10B981;         /* Emerald Green */
  --nc-warning: #F59E0B;         /* Amber Warning */
  --nc-danger: #EF4444;          /* Crimson Alert */
  
  /* Neutral Palette */
  --nc-text: #1E293B;            /* Slate Dark */
  --nc-text-muted: #64748B;      /* Slate Medium */
  --nc-text-light: #94A3B8;      /* Slate Light */
  --nc-bg: #F7F8FC;              /* Clean App Background */
  --nc-card: #FFFFFF;            /* Pure White Card */
  --nc-border: #E2E8F0;          /* Border Outline */
  
  /* Typography */
  --nc-font: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
  
  /* Shadows & Radius */
  --nc-radius-sm: 8px;
  --nc-radius-md: 12px;
  --nc-radius-lg: 16px;
  --nc-shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.05);
  --nc-shadow-md: 0 4px 12px rgba(0, 0, 0, 0.08);
  --nc-shadow-lg: 0 10px 25px rgba(0, 0, 0, 0.12);
}
```

---

## Core Frontend Modules

### 1. Centralized API Client (`js/api-client.js`)
* Provides the singleton `window.NovaAPI` wrapper around standard `fetch()`:
  * Automatically sets `credentials: 'include'` to pass session cookies.
  * Handles CSRF tokens via `getCookie('csrftoken')`.
  * Normalizes JSON responses and catches network errors.
  * Synchronizes global header badge counts (`cartCount`, `wishlistCount`, `notifCount`).

### 2. Home Page Controller (`js/script.js`)
* **Hero Slider & Visuals:** Dynamic product preview switching on color/thumb hover.
* **Flash Sale Countdown:** Real-time ticking countdown timer (Hours, Minutes, Seconds).
* **Live Search Dropdown:** Debounced search query fetching matching products with thumbnails and prices in `₹`.
* **Category Cards:** Clickable links routing to `shop.html?category=<name>`.
* **Recent Orders Loader (`initHomeRecentOrders`):**
  * Queries `/api/orders/` asynchronously.
  * Renders order ID, date, thumbnail, total in `₹`, and status badge.
  * Handles all states: Unauthenticated guest, zero orders, populated orders, and error state.

### 3. Shopping Cart Drawer & Calculations (`js/cart.js`)
* Slide-out cart drawer accessible from every page without navigating away.
* Real-time increment/decrement of quantities with debounce.
* Indian Rupee pricing totals, shipping charge logic, and coupon discount application.

### 4. Checkout & Payment Simulation (`js/checkout.js` & `js/payment.js`)
* Validates full shipping address, mobile number (10 digits), and pincode (6 digits).
* Simulates payment gateway with Cards, UPI, Net Banking, and COD.
* Generates a unique `payment_id` idempotency key to prevent double charging.
* Automatically creates the order in the backend and redirects to `order-success.html`.

---

## Storefront Pages Reference

| Page | File | Key Functional Capabilities |
|---|---|---|
| **Home** | `index.html` | Hero banner, categories, deals, new arrivals tabs, recent orders, testimonials, newsletter |
| **Shop** | `shop.html` | Category filter, price range slider, rating filters, sort dropdown, instant search |
| **Product** | `product.html` | Interactive image gallery, specs table, quantity picker, add to cart, reviews |
| **Cart** | `cart.html` | Full item list, line totals in `₹`, promo code field, checkout button |
| **Checkout** | `checkout.html` | Shipping and billing form, delivery method selector, order summary |
| **Payment** | `payment.html` | Multi-method payment tabs (Card/UPI/Net Banking/COD), secure CVV/PIN inputs |
| **Success** | `order-success.html` | Order number confirmation, delivery ETA, printable links |
| **My Orders** | `orders.html` | Order list with filter tabs (All, Processing, Shipped, Delivered), tracking links |
| **Order Details** | `order-details.html` | Full snapshot breakdown, delivery address, price breakdown, invoice print button |
| **Tracking** | `order-tracking.html` | Visual 4-stage milestone tracker, courier name, tracking ID, tracking timeline |
| **Wishlist** | `wishlist.html` | Saved items grid, one-click add to cart, item removal |
| **Login** | `login.html` | Account authentication, session remember me, inline validation |
| **Register** | `register.html` | Live password requirement indicators (8+ chars, upper, lower, number) |
| **Profile** | `profile.html` | User details, shipping addresses, phone number update |
| **Notifications**| `notifications.html`| Alert list, unread indicators, mark-as-read, clear all |
| **404 Page** | `404.html` | Branded missing page notification with direct navigation rescue |
