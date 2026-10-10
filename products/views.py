from django.http import JsonResponse
from django.db.models import Q
from .models import Category, Product, Review

def product_to_dict(p):
    return {
        'id': p.id,
        'name': p.name,
        'slug': p.slug,
        'category': {
            'id': p.category.id,
            'name': p.category.name,
            'slug': p.category.slug,
        },
        'description': p.description,
        'price': float(p.price),
        'original_price': float(p.original_price) if p.original_price else None,
        'currency': '₹',
        'discount_percent': p.discount_percent,
        'rating': float(p.rating),
        'reviews_count': p.reviews_count,
        'stock': p.stock,
        'image_url': p.image_url,
        'badge': p.badge,
        'is_featured': p.is_featured,
        'is_deal': p.is_deal,
    }

def product_list_view(request):
    qs = Product.objects.select_related('category').all()

    # Search filter
    search_q = request.GET.get('search', '').strip()
    if search_q:
        qs = qs.filter(
            Q(name__icontains=search_q) |
            Q(description__icontains=search_q) |
            Q(category__name__icontains=search_q)
        )

    # Category filter
    category_slug = request.GET.get('category', '').strip()
    if category_slug and category_slug != 'all':
        qs = qs.filter(category__slug=category_slug)

    # Deals filter
    if request.GET.get('deals') == 'true':
        qs = qs.filter(is_deal=True)

    # Featured filter
    if request.GET.get('featured') == 'true':
        qs = qs.filter(is_featured=True)

    # Sorting
    sort = request.GET.get('sort', '')
    if sort == 'price_low' or sort == 'price_asc':
        qs = qs.order_by('price')
    elif sort == 'price_high' or sort == 'price_desc':
        qs = qs.order_by('-price')
    elif sort == 'rating':
        qs = qs.order_by('-rating')
    elif sort == 'newest':
        qs = qs.order_by('-created_at')

    products = [product_to_dict(p) for p in qs]

    return JsonResponse({
        'success': True,
        'count': len(products),
        'products': products
    })

def product_detail_view(request, identifier):
    try:
        if identifier.isdigit():
            product = Product.objects.select_related('category').get(id=int(identifier))
        else:
            product = Product.objects.select_related('category').get(slug=identifier)
    except Product.DoesNotExist:
        return JsonResponse({'success': False, 'error': 'Product not found'}, status=404)

    # Related products in same category
    related = Product.objects.filter(category=product.category).exclude(id=product.id)[:4]

    reviews = [
        {
            'id': r.id,
            'author_name': r.author_name,
            'rating': r.rating,
            'comment': r.comment,
            'created_at': r.created_at.strftime('%d %b %Y'),
        }
        for r in product.reviews.all()
    ]

    data = product_to_dict(product)
    data['related_products'] = [product_to_dict(r) for r in related]
    data['reviews'] = reviews

    return JsonResponse({'success': True, 'product': data})

def category_list_view(request):
    cats = Category.objects.all()
    categories_data = [
        {
            'id': c.id,
            'name': c.name,
            'slug': c.slug,
            'icon_url': c.icon_url,
            'product_count': c.products.count()
        }
        for c in cats
    ]
    return JsonResponse({'success': True, 'categories': categories_data})
