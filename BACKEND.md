# NovaCart — Backend Architecture Documentation

## Overview

The **NovaCart** backend is engineered with **Python 3.12+** and **Django 6.1.1** following the Model-View-Template (MVT) pattern combined with a modular **RESTful JSON API** layer. It provides session-based authentication, database transactions, order processing with historical price snapshotting, payment idempotency, and strict per-user ownership isolation.

---

## Directory Structure (`backend/`)

```text
backend/
│
├── manage.py                     # Django CLI management script
├── requirements.txt              # Python package dependencies
│
├── novacart_project/             # Project Configuration & Master Router
│   ├── __init__.py
│   ├── settings.py               # Settings, apps, database paths, and session configuration
│   ├── urls.py                   # Master routing table (APIs, static delivery, views)
│   ├── views.py                  # HTML template & static page delivery controller
│   ├── cors_middleware.py        # Custom CORS headers middleware
│   ├── asgi.py                   # ASGI entry point
│   └── wsgi.py                   # WSGI entry point
│
├── accounts/                     # User Authentication & Profile App
│   ├── models.py                 # Profile model extending django.contrib.auth.models.User
│   ├── views.py                  # Register, Login, Logout, and Profile endpoints
│   ├── admin.py                  # Django Admin registrations
│   └── migrations/               # Database migrations
│
├── products/                     # Product Catalog App
│   ├── models.py                 # Category and Product models (pricing in ₹, ratings, stock)
│   ├── views.py                  # Product list, details, categories, deals, and search APIs
│   ├── admin.py                  # Admin catalog manager
│   └── migrations/               # Product migrations
│
├── cart_app/                     # Shopping Cart & Wishlist App
│   ├── models.py                 # CartItem and WishlistItem models
│   ├── views.py                  # Cart CRUD and Wishlist toggle APIs
│   ├── admin.py                  # Admin cart manager
│   └── migrations/               # Cart migrations
│
├── orders/                       # Order Processing & Tracking App
│   ├── models.py                 # Order and OrderItem models (snapshots, idempotency tokens)
│   ├── views.py                  # Order creation, order listing, tracking, and details APIs
│   ├── admin.py                  # Admin order management
│   └── migrations/               # Orders migrations
│
└── notifications_app/            # In-App Notifications App
    ├── models.py                 # Notification model with read/unread tracking
    ├── views.py                  # Notification list and mark-as-read APIs
    ├── admin.py                  # Admin notification management
    └── migrations/               # Notifications migrations
```

---

## Django Apps Architecture

### 1. `accounts` App
* **User Model:** Uses Django's built-in `User` (`username`, `email`, `password`, `first_name`, `last_name`).
* **Profile Model:** One-to-one relationship with `User` containing `phone`, `address`, `city`, `state`, `pincode`, and `avatar`.
* **Security:** Password hashing via PBKDF2/SHA-256; session cookie management (`sessionid`).

### 2. `products` App
* **Category Model:** `name`, `slug`, `icon`, `image`, `is_active`.
* **Product Model:** `name`, `slug`, `category`, `price` (decimal in `₹`), `original_price`, `discount_percent`, `rating`, `review_count`, `stock`, `is_featured`, `is_deal`, `is_new`, `image_url`, `description`.
* **Query Optimization:** Filtering via `Q` objects for multi-criteria search and price ranges.

### 3. `cart_app` App
* **CartItem Model:** Links `User`, `Product`, and `quantity`. Automatically computes line total based on current catalog price.
* **WishlistItem Model:** Unique constraint per `(user, product)`. Supports instant toggle.

### 4. `orders` App
* **Order Model:** Stores customer contact details, delivery address, financial totals (`subtotal`, `shipping`, `discount`, `total_amount`), payment info (`payment_method`, `payment_status`, `payment_id`), and tracking state (`order_status`, `tracking_step`).
* **OrderItem Model (Historical Snapshot):** When an order is placed, purchased products are cloned into `OrderItem` storing the exact `product_name`, `price`, `quantity`, and `image_url` at purchase time. Catalog price changes never alter past order records.
* **Payment Idempotency:** The `payment_id` parameter ensures that repeated checkout submissions reuse the existing order, completely preventing duplicate orders and double charging.
* **Ownership Isolation:** All order endpoints verify `order.user == request.user`. Unauthorized users receive HTTP 404 or HTTP 403.

### 5. `notifications_app` App
* **Notification Model:** `user`, `title`, `message`, `notification_type`, `is_read`, `created_at`.
* Triggers notifications upon account creation, order placement, and delivery status updates.

---

## Complete REST API Specification

### 1. Authentication & Profile
| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/auth/register/` | `POST` | No | Register new user account (`username`, `email`, `password`, `first_name`, `last_name`) |
| `/api/auth/login/` | `POST` | No | Authenticate user and initiate session cookie (`username`/`email`, `password`) |
| `/api/auth/logout/` | `POST` | Yes | Destroy current user session |
| `/api/auth/profile/` | `GET` | Optional* | Fetch user details and saved address. `?strict=true` returns 401 if guest. |
| `/api/auth/profile/` | `POST` | Yes | Update user details, phone, and shipping address |

### 2. Product Catalog
| Endpoint | Method | Auth Required | Parameters / Query Params | Description |
|---|---|---|---|---|
| `/api/products/` | `GET` | No | `search`, `category`, `deals`, `sort`, `min_price`, `max_price` | List catalog products with filtering |
| `/api/products/<id>/` | `GET` | No | ID or slug | Retrieve individual product specifications |
| `/api/categories/` | `GET` | No | None | List all active product categories |

### 3. Cart & Wishlist
| Endpoint | Method | Auth Required | Body | Description |
|---|---|---|---|---|
| `/api/cart/` | `GET` | Optional | None | Fetch current shopping cart and total amount |
| `/api/cart/add/` | `POST` | Optional | `{ "product_id": int, "quantity": int }` | Add product to cart |
| `/api/cart/update/` | `POST` | Optional | `{ "item_id": int, "quantity": int }` | Update cart item quantity |
| `/api/cart/remove/` | `POST` | Optional | `{ "item_id": int }` | Remove an item from cart |
| `/api/cart/clear/` | `POST` | Optional | None | Empty the shopping cart |
| `/api/wishlist/` | `GET` | Yes | None | List saved wishlist items |
| `/api/wishlist/toggle/`| `POST` | Yes | `{ "product_id": int }` | Add/remove product from wishlist |

### 4. Orders & Tracking
| Endpoint | Method | Auth Required | Body / Params | Description |
|---|---|---|---|---|
| `/api/orders/` | `GET` | Yes | Returns `{ "authenticated": bool, "orders": [...] }` | List logged-in user's orders |
| `/api/orders/create/` | `POST` | Yes | `{ "full_name", "email", "phone", "address", "city", "state", "pincode", "payment_method", "payment_id", ... }` | Create order, save snapshots, clear cart |
| `/api/orders/<order_num>/` | `GET` | Yes | Order Number (e.g., `ORD-20261010-8271`) | Retrieve single order details with ownership verification |
| `/api/orders/latest/` | `GET` | Yes | None | Retrieve user's most recent order |
| `/account/orders/` | `GET` | Yes | Browser or JSON | Shortcut endpoint for user order history |
| `/orders/<id>/track/` | `GET` | Yes | Browser or JSON | Live shipment tracking with milestones |

### 5. Notifications
| Endpoint | Method | Auth Required | Description |
|---|---|---|---|
| `/api/notifications/` | `GET` | Yes | List notifications with unread count |
| `/api/notifications/<id>/read/` | `POST` | Yes | Mark specific notification as read |
| `/api/notifications/read-all/` | `POST` | Yes | Mark all notifications as read |
| `/api/notifications/clear/` | `POST` | Yes | Delete all user notifications |

---

## Running the Backend

You can run the backend server in either of two ways:

### Mode A: From the Repository Root (Default)
```bash
python manage.py runserver 127.0.0.1:8000
```

### Mode B: From the `backend/` Folder
```bash
cd backend
python manage.py runserver 127.0.0.1:8000
```
Both modes automatically resolve the `frontend/` folder for HTML/CSS/JS delivery and the `database/` folder for `db.sqlite3`.
