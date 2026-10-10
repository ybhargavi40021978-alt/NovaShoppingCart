import json
from decimal import Decimal
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from products.models import Product
from products.views import product_to_dict
from .models import CartItem, WishlistItem

def ensure_session(request):
    if not request.session.session_key:
        request.session.create()
    return request.session.session_key

def get_user_or_session_filter(request):
    if request.user.is_authenticated:
        return {'user': request.user}
    else:
        sk = ensure_session(request)
        return {'session_key': sk, 'user__isnull': True}

def calculate_cart_summary(items_qs):
    items = []
    subtotal = Decimal('0.00')

    for ci in items_qs.select_related('product', 'product__category'):
        p = ci.product
        item_total = Decimal(str(p.price)) * ci.quantity
        subtotal += item_total
        items.append({
            'cart_item_id': ci.id,
            'product_id': p.id,
            'name': p.name,
            'slug': p.slug,
            'price': float(p.price),
            'original_price': float(p.original_price) if p.original_price else None,
            'quantity': ci.quantity,
            'image_url': p.image_url,
            'category_name': p.category.name,
            'item_total': float(item_total),
        })

    # Shipping: Free if subtotal > 999, else 99
    shipping = Decimal('0.00') if subtotal >= Decimal('999.00') or subtotal == Decimal('0.00') else Decimal('99.00')
    tax = round(subtotal * Decimal('0.05'), 2)
    total = subtotal + shipping + tax
    total_count = sum(item['quantity'] for item in items)

    return {
        'items': items,
        'item_count': total_count,
        'currency': '₹',
        'subtotal': float(subtotal),
        'shipping': float(shipping),
        'tax': float(tax),
        'total': float(total),
    }

# --- Cart APIs ---
def get_cart_view(request):
    f = get_user_or_session_filter(request)
    items_qs = CartItem.objects.filter(**f)
    summary = calculate_cart_summary(items_qs)
    return JsonResponse({'success': True, 'cart': summary})

@csrf_exempt
def add_to_cart_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    product_id = data.get('product_id') or data.get('id')
    quantity = int(data.get('quantity', 1))

    if not product_id:
        return JsonResponse({'success': False, 'error': 'Product ID is required'}, status=400)

    try:
        product = Product.objects.get(id=int(product_id))
    except (Product.DoesNotExist, ValueError):
        return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)

    f = get_user_or_session_filter(request)
    cart_item, created = CartItem.objects.get_or_create(product=product, **f)

    if not created:
        cart_item.quantity += quantity
    else:
        cart_item.quantity = max(1, quantity)
    cart_item.save()

    items_qs = CartItem.objects.filter(**f)
    summary = calculate_cart_summary(items_qs)

    return JsonResponse({
        'success': True,
        'message': f'"{product.name}" added to your cart!',
        'cart': summary
    })

@csrf_exempt
def update_cart_view(request):
    if request.method not in ['POST', 'PUT']:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    product_id = data.get('product_id') or data.get('id')
    quantity = int(data.get('quantity', 1))

    f = get_user_or_session_filter(request)

    try:
        cart_item = CartItem.objects.get(product_id=int(product_id), **f)
        if quantity <= 0:
            cart_item.delete()
            msg = 'Item removed from cart'
        else:
            cart_item.quantity = quantity
            cart_item.save()
            msg = 'Cart quantity updated'
    except CartItem.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Item not in cart'}, status=404)

    items_qs = CartItem.objects.filter(**f)
    summary = calculate_cart_summary(items_qs)

    return JsonResponse({
        'success': True,
        'message': msg,
        'cart': summary
    })

@csrf_exempt
def remove_from_cart_view(request):
    if request.method not in ['POST', 'DELETE']:
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    product_id = data.get('product_id') or data.get('id')
    f = get_user_or_session_filter(request)

    CartItem.objects.filter(product_id=int(product_id), **f).delete()
    items_qs = CartItem.objects.filter(**f)
    summary = calculate_cart_summary(items_qs)

    return JsonResponse({
        'success': True,
        'message': 'Product removed from your cart.',
        'cart': summary
    })

@csrf_exempt
def clear_cart_view(request):
    f = get_user_or_session_filter(request)
    CartItem.objects.filter(**f).delete()
    return JsonResponse({
        'success': True,
        'message': 'Cart cleared',
        'cart': calculate_cart_summary(CartItem.objects.none())
    })

# --- Wishlist APIs ---
def get_wishlist_view(request):
    f = get_user_or_session_filter(request)
    items_qs = WishlistItem.objects.filter(**f).select_related('product', 'product__category')
    products = [product_to_dict(wi.product) for wi in items_qs]
    return JsonResponse({
        'success': True,
        'count': len(products),
        'currency': '₹',
        'products': products
    })

@csrf_exempt
def toggle_wishlist_view(request):
    if request.method != 'POST':
        return JsonResponse({'success': False, 'error': 'Method not allowed'}, status=405)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    product_id = data.get('product_id') or data.get('id')
    if not product_id:
        return JsonResponse({'success': False, 'error': 'Product ID is required'}, status=400)

    try:
        product = Product.objects.get(id=int(product_id))
    except Product.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)

    f = get_user_or_session_filter(request)
    existing = WishlistItem.objects.filter(product=product, **f).first()

    if existing:
        existing.delete()
        is_in_wishlist = False
        message = f'Removed "{product.name}" from your wishlist.'
    else:
        WishlistItem.objects.create(product=product, **f)
        is_in_wishlist = True
        message = f'Added "{product.name}" to your wishlist.'

    total_count = WishlistItem.objects.filter(**f).count()

    return JsonResponse({
        'success': True,
        'is_in_wishlist': is_in_wishlist,
        'message': message,
        'wishlist_count': total_count
    })
