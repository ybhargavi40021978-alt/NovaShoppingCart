from django.contrib import admin
from django.urls import path, re_path
from django.conf import settings
from django.views.static import serve
import os

from novacart_project.views import home_view, serve_page
import accounts.views as account_views
import products.views as product_views
import cart_app.views as cart_views
import orders.views as order_views
import notifications_app.views as notif_views

urlpatterns = [
    path('admin/', admin.site.urls),

    # --- Authentication & Profile APIs ---
    path('api/auth/register/', account_views.register_view, name='api_register'),
    path('api/register/', account_views.register_view, name='api_register_alias'),
    path('api/auth/login/', account_views.login_view, name='api_login'),
    path('api/login/', account_views.login_view, name='api_login_alias'),
    path('api/auth/logout/', account_views.logout_view, name='api_logout'),
    path('api/logout/', account_views.logout_view, name='api_logout_alias'),
    path('api/auth/profile/', account_views.profile_view, name='api_profile'),
    path('api/profile/', account_views.profile_view, name='api_profile_alias'),

    # --- Products & Categories APIs ---
    path('api/products/', product_views.product_list_view, name='api_products'),
    path('api/products/<str:identifier>/', product_views.product_detail_view, name='api_product_detail'),
    path('api/categories/', product_views.category_list_view, name='api_categories'),

    # --- Cart APIs ---
    path('api/cart/', cart_views.get_cart_view, name='api_get_cart'),
    path('api/cart/add/', cart_views.add_to_cart_view, name='api_add_to_cart'),
    path('api/cart/update/', cart_views.update_cart_view, name='api_update_cart'),
    path('api/cart/remove/', cart_views.remove_from_cart_view, name='api_remove_from_cart'),
    path('api/cart/clear/', cart_views.clear_cart_view, name='api_clear_cart'),

    # --- Wishlist APIs ---
    path('api/wishlist/', cart_views.get_wishlist_view, name='api_get_wishlist'),
    path('api/wishlist/toggle/', cart_views.toggle_wishlist_view, name='api_toggle_wishlist'),

    # --- Orders & Tracking APIs ---
    path('api/orders/', order_views.list_orders_view, name='api_list_orders'),
    path('api/orders/create/', order_views.create_order_view, name='api_create_order'),
    path('api/payment/create/', order_views.create_order_view, name='api_payment_create'),
    path('api/orders/latest/', order_views.latest_order_view, name='api_latest_order'),
    path('api/orders/<str:order_number>/', order_views.order_detail_view, name='api_order_detail'),

    # --- Section 5: Backend Routes for Orders & Payment Flow ---
    path('account/orders/', order_views.account_orders_page_or_api, name='account_orders'),
    path('account/orders/<str:order_id>/', order_views.account_order_detail_page_or_api, name='account_order_detail'),
    path('checkout/', order_views.checkout_page_or_validate, name='checkout_flow'),
    path('payment/success/', order_views.payment_success_endpoint, name='payment_success'),
    path('orders/<str:order_id>/track/', order_views.order_track_page, name='order_track_page'),

    # --- Notifications APIs ---
    path('api/notifications/', notif_views.list_notifications_view, name='api_notifications'),
    path('api/notifications/<int:notif_id>/read/', notif_views.mark_read_view, name='api_mark_read'),
    path('api/notifications/read-all/', notif_views.mark_all_read_view, name='api_mark_all_read'),
    path('api/notifications/clear/', notif_views.clear_notifications_view, name='api_clear_notifications'),

    # --- Frontend HTML Page Routes ---
    path('', home_view, name='home'),
    path('index.html', serve_page('index.html')),
    path('shop.html', serve_page('shop.html')),
    path('product.html', serve_page('product.html')),
    path('cart.html', serve_page('cart.html')),
    path('empty-cart.html', serve_page('empty-cart.html')),
    path('checkout.html', serve_page('checkout.html')),
    path('payment.html', serve_page('payment.html')),
    path('order-success.html', serve_page('order-success.html')),
    path('orders.html', serve_page('orders.html')),
    path('order-details.html', serve_page('order-details.html')),
    path('order-tracking.html', serve_page('order-tracking.html')),
    path('wishlist.html', serve_page('wishlist.html')),
    path('profile.html', serve_page('profile.html')),
    path('notifications.html', serve_page('notifications.html')),
    path('login.html', serve_page('login.html')),
    path('register.html', serve_page('register.html')),
    path('mobile-menu.html', serve_page('mobile-menu.html')),
    path('mobile-view.html', serve_page('mobile-view.html')),
    path('toast-notifications.html', serve_page('toast-notifications.html')),
    path('404.html', serve_page('404.html')),

    # --- Static Asset Serving ---
    re_path(r'^(?P<path>(css|js|assets)/.*)$', serve, {'document_root': settings.BASE_DIR}),
    re_path(r'^novacart/(?P<path>(css|js|assets)/.*)$', serve, {'document_root': os.path.join(settings.BASE_DIR, 'novacart')}),
]
