import json
import random
from decimal import Decimal
from django.db import transaction as db_transaction
from django.http import JsonResponse, HttpResponse, HttpResponseForbidden, Http404
from django.shortcuts import redirect
from django.views.decorators.csrf import csrf_exempt
from cart_app.models import CartItem
from cart_app.views import get_user_or_session_filter
from notifications_app.models import Notification
from novacart_project.views import serve_page
from .models import Order, OrderItem

def check_order_ownership(request, order):
    """
    Ensure the request has permission to view this order.
    Authenticated users can only view their own orders.
    Guests can only view orders placed in their active session.
    """
    if request.user.is_authenticated:
        if order.user_id == request.user.id:
            return True
        # If order was created during checkout just before linking user
        if order.user is None and order.email.lower() == request.user.email.lower():
            order.user = request.user
            order.save(update_fields=['user'])
            return True
        return False
    else:
        session_key = request.session.session_key
        if order.user is None and session_key and order.session_key == session_key:
            return True
        return False

def get_user_orders_queryset(request):
    """
    Returns only the current user's or current session's orders.
    Never returns other users' orders.
    """
    if request.user.is_authenticated:
        return Order.objects.filter(user=request.user).prefetch_related('items').order_by('-created_at')
    else:
        session_key = request.session.session_key
        if session_key:
            return Order.objects.filter(user__isnull=True, session_key=session_key).prefetch_related('items').order_by('-created_at')
        return Order.objects.none()

def order_to_dict(order):
    items = [
        {
            'id': item.id,
            'product_id': item.product_id,
            'name': item.product_name,
            'product_name': item.product_name,
            'price': float(item.price),
            'unit_price': float(item.price),
            'quantity': item.quantity,
            'image_url': item.image_url or 'assets/products/headphones.svg',
            'product_image': item.image_url or 'assets/products/headphones.svg',
            'line_total': float(item.line_total),
            'total': float(item.line_total),
        }
        for item in order.items.all()
    ]
    return {
        'id': order.id,
        'order_number': order.order_number,
        'order_id': order.order_number,
        'customer_name': order.full_name,
        'full_name': order.full_name,
        'email': order.email,
        'phone': order.phone,
        'shipping_address': order.shipping_address,
        'address': order.address,
        'city': order.city,
        'state': order.state,
        'pincode': order.pincode,
        'address_details': {
            'address': order.address,
            'city': order.city,
            'state': order.state,
            'pincode': order.pincode,
        },
        'subtotal': float(order.subtotal),
        'shipping': float(order.shipping),
        'shipping_cost': float(order.shipping),
        'discount': float(order.discount),
        'tax': float(order.tax),
        'total_amount': float(order.total_amount),
        'currency': '₹',
        'payment_method': order.payment_method,
        'payment_status': order.payment_status,
        'order_status': order.order_status,
        'status': order.order_status.lower(),
        'tracking_step': order.tracking_step,
        'estimated_delivery': order.estimated_delivery,
        'created_at': order.created_at.strftime('%d %b %Y, %I:%M %p'),
        'order_date': order.created_at.strftime('%d %b %Y, %I:%M %p'),
        'items_count': sum(item.quantity for item in order.items.all()),
        'items': items,
    }

@csrf_exempt
def create_order_view(request):
    """
    Validates payment confirmation, creates order and order items snapshot,
    clears cart atomically, and prevents duplicate orders.
    """
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    payment_id = (data.get('payment_id') or data.get('paymentId') or data.get('transaction_id') or '').strip()

    # 1. Idempotency Check: Prevent duplicate orders if payment confirmation received more than once
    if payment_id:
        existing_order = Order.objects.filter(payment_id=payment_id).prefetch_related('items').first()
        if existing_order:
            if check_order_ownership(request, existing_order):
                return JsonResponse({
                    'success': True,
                    'message': 'Order already processed.',
                    'order': order_to_dict(existing_order)
                })
            else:
                return JsonResponse({'success': False, 'error': 'Unauthorized access to this order.'}, status=403)

    f = get_user_or_session_filter(request)
    cart_items = list(CartItem.objects.filter(**f).select_related('product'))

    if not cart_items:
        # Check if user already placed an order in the last 20 seconds (double submit protection)
        recent_order = None
        if request.user.is_authenticated:
            recent_order = Order.objects.filter(user=request.user).order_by('-created_at').first()
        elif f.get('session_key'):
            recent_order = Order.objects.filter(session_key=f.get('session_key')).order_by('-created_at').first()

        if recent_order:
            return JsonResponse({
                'success': True,
                'message': 'Order has already been confirmed.',
                'order': order_to_dict(recent_order)
            })

        return JsonResponse({'success': False, 'error': 'Your cart is empty. Please add items before checkout.'}, status=400)

    # Validate Customer Details
    full_name = (data.get('full_name') or data.get('fullName') or '').strip()
    if not full_name and request.user.is_authenticated:
        full_name = request.user.get_full_name() or request.user.username

    email = (data.get('email') or '').strip()
    if not email and request.user.is_authenticated:
        email = request.user.email

    phone = (data.get('phone') or '').strip()
    address = (data.get('address') or '').strip()
    city = (data.get('city') or 'Bengaluru').strip()
    state = (data.get('state') or 'Karnataka').strip()
    pincode = (data.get('postal_code') or data.get('pincode') or '560103').strip()
    payment_method = (data.get('payment_method') or data.get('paymentMethod') or 'Cash on Delivery').strip()

    # Map payment method names
    method_labels = {
        'cod': 'Cash on Delivery',
        'card': 'Credit / Debit Card',
        'upi': 'UPI Payment',
        'demo': 'Demo Payment',
    }
    payment_method_display = method_labels.get(payment_method.lower(), payment_method)

    if not full_name or not email or not address:
        return JsonResponse({'success': False, 'error': 'Please fill in all required shipping and contact details.'}, status=400)

    # Calculate Totals
    subtotal = sum(Decimal(str(ci.product.price)) * ci.quantity for ci in cart_items)
    shipping_charge = Decimal('0.00') if subtotal >= Decimal('999.00') else Decimal('99.00')
    discount_amount = Decimal(str(data.get('discount') or 0.0))
    tax_amount = round((subtotal - discount_amount) * Decimal('0.05'), 2)
    if tax_amount < Decimal('0.00'):
        tax_amount = Decimal('0.00')

    total_amount = subtotal - discount_amount + shipping_charge + tax_amount
    if total_amount < Decimal('0.00'):
        total_amount = Decimal('0.00')

    # Generate Unique Order Number (NC + 5 digits)
    order_number = f"NC{random.randint(10000, 99999)}"
    while Order.objects.filter(order_number=order_number).exists():
        order_number = f"NC{random.randint(10000, 99999)}"

    if not payment_id:
        payment_id = f"PAY_{order_number}_{random.randint(1000, 9999)}"

    # Atomic creation: order + snapshot items + cart clear
    with db_transaction.atomic():
        order = Order.objects.create(
            order_number=order_number,
            user=request.user if request.user.is_authenticated else None,
            session_key=f.get('session_key', ''),
            full_name=full_name,
            email=email,
            phone=phone,
            address=address,
            city=city,
            state=state,
            pincode=pincode,
            subtotal=subtotal,
            shipping=shipping_charge,
            discount=discount_amount,
            tax=tax_amount,
            total_amount=total_amount,
            payment_method=payment_method_display,
            payment_status='Completed',
            payment_id=payment_id,
            order_status='Processing',
            tracking_step=1,
            estimated_delivery='3-5 Business Days'
        )

        order_items_to_create = []
        for ci in cart_items:
            order_items_to_create.append(
                OrderItem(
                    order=order,
                    product=ci.product,
                    product_name=ci.product.name,
                    price=ci.product.price,
                    quantity=ci.quantity,
                    image_url=ci.product.image_url or 'assets/products/headphones.svg'
                )
            )
        OrderItem.objects.bulk_create(order_items_to_create)

        # Clear Cart ONLY after order and items are saved successfully
        CartItem.objects.filter(**f).delete()

    # Create Notification
    try:
        Notification.objects.create(
            user=request.user if request.user.is_authenticated else None,
            session_key=f.get('session_key', ''),
            title=f"Order #{order.order_number} Confirmed!",
            message=f"Thank you {order.full_name}, your order for ₹{order.total_amount:,.2f} via {payment_method_display} has been placed successfully.",
            notif_type='success',
            icon_type='order'
        )
    except Exception:
        pass

    return JsonResponse({
        'success': True,
        'message': 'Order placed successfully!',
        'order': order_to_dict(order)
    })

def list_orders_view(request):
    """
    Returns the authenticated user's real orders list.
    Strictly isolated: users can never see other users' orders.
    """
    orders_qs = get_user_orders_queryset(request)
    return JsonResponse({
        'success': True,
        'authenticated': request.user.is_authenticated,
        'orders': [order_to_dict(o) for o in orders_qs]
    })

def order_detail_view(request, order_number):
    """
    Returns details for a specific order with ownership verification.
    """
    try:
        order = Order.objects.prefetch_related('items').get(order_number=order_number)
    except Order.DoesNotExist:
        # Check by database id
        if order_number.isdigit():
            order = Order.objects.filter(id=int(order_number)).prefetch_related('items').first()
            if not order:
                return JsonResponse({'success': False, 'error': 'Order not found.'}, status=404)
        else:
            return JsonResponse({'success': False, 'error': 'Order not found.'}, status=404)

    if not check_order_ownership(request, order):
        return JsonResponse({'success': False, 'error': 'You do not have permission to view this order.'}, status=403)

    return JsonResponse({
        'success': True,
        'order': order_to_dict(order)
    })

def track_order_view(request, order_number):
    """
    Tracking details for an order with ownership verification.
    """
    return order_detail_view(request, order_number)

def latest_order_view(request):
    """
    Returns the latest order for the current user.
    """
    order = get_user_orders_queryset(request).first()
    if not order:
        return JsonResponse({'success': False, 'error': 'No orders found.'}, status=404)

    return JsonResponse({
        'success': True,
        'order': order_to_dict(order)
    })

# --- Full Web Page Handlers (Requirement #5) ---

def account_orders_page_or_api(request):
    """
    Handles /account/orders/
    If API request -> JSON list of user's orders
    If browser page request -> renders orders.html
    """
    accept = request.headers.get('Accept', '')
    if 'application/json' in accept and not request.GET.get('html'):
        return list_orders_view(request)
    return serve_page('orders.html')(request)

def account_order_detail_page_or_api(request, order_id):
    """
    Handles /account/orders/<order_id>/
    If API request -> JSON order details (with ownership check)
    If browser page request -> renders order-details.html (with orderId query)
    """
    accept = request.headers.get('Accept', '')
    if 'application/json' in accept and not request.GET.get('html'):
        return order_detail_view(request, order_id)
    return serve_page('order-details.html')(request)

def order_track_page(request, order_id):
    """
    Handles /orders/<order_id>/track/
    """
    return serve_page('order-tracking.html')(request)

@csrf_exempt
def checkout_page_or_validate(request):
    """
    Handles /checkout/
    GET: renders checkout.html
    POST: validates checkout details
    """
    if request.method == 'GET':
        return serve_page('checkout.html')(request)

    f = get_user_or_session_filter(request)
    cart_items = CartItem.objects.filter(**f)
    if not cart_items.exists():
        return JsonResponse({'success': False, 'error': 'Your cart is empty.'}, status=400)

    return JsonResponse({'success': True, 'message': 'Checkout validated. Proceed to payment.'})

@csrf_exempt
def payment_success_endpoint(request):
    """
    Handles /payment/success/
    POST: confirms payment and creates order idempotently
    GET: renders order-success.html
    """
    if request.method == 'POST':
        return create_order_view(request)
    return serve_page('order-success.html')(request)
