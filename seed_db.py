import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'novacart_project.settings')
django.setup()

from django.contrib.auth.models import User
from products.models import Category, Product
from notifications_app.models import Notification
from accounts.models import Profile

def seed():
    print("Clearing old seed data...")
    Product.objects.all().delete()
    Category.objects.all().delete()

    # 1. Categories
    categories_data = [
        {"name": "Electronics", "slug": "electronics", "icon_url": "assets/categories/electronics.svg"},
        {"name": "Fashion", "slug": "fashion", "icon_url": "assets/categories/fashion.svg"},
        {"name": "Footwear", "slug": "footwear", "icon_url": "assets/categories/footwear.svg"},
        {"name": "Accessories", "slug": "accessories", "icon_url": "assets/categories/accessories.svg"},
        {"name": "Home & Kitchen", "slug": "home", "icon_url": "assets/categories/home.svg"},
        {"name": "Beauty", "slug": "beauty", "icon_url": "assets/categories/beauty.svg"},
    ]

    cat_map = {}
    for c_data in categories_data:
        cat, _ = Category.objects.get_or_create(
            slug=c_data["slug"],
            defaults={"name": c_data["name"], "icon_url": c_data["icon_url"]}
        )
        cat_map[c_data["slug"]] = cat

    # 2. Products (All Prices in INR ₹)
    products_data = [
        {
            "name": "Wireless Noise-Cancelling Headphones",
            "slug": "wireless-noise-cancelling-headphones",
            "category": cat_map["electronics"],
            "description": "Premium wireless headphones with active noise cancellation, deep bass, 30-hour battery life, and crystal-clear voice clarity.",
            "price": 3499.00,
            "original_price": 4999.00,
            "rating": 4.8,
            "reviews_count": 128,
            "stock": 45,
            "image_url": "assets/products/headphones.svg",
            "badge": "Hot",
            "is_featured": True,
            "is_deal": True
        },
        {
            "name": "Mechanical RGB Gaming Keyboard",
            "slug": "mechanical-rgb-gaming-keyboard",
            "category": cat_map["electronics"],
            "description": "Tactile mechanical switches, per-key RGB backlighting, braided USB-C cable, and durable aluminum top frame.",
            "price": 2799.00,
            "original_price": 3499.00,
            "rating": 4.7,
            "reviews_count": 86,
            "stock": 30,
            "image_url": "assets/products/keyboard.svg",
            "badge": "Sale",
            "is_featured": True,
            "is_deal": True
        },
        {
            "name": "Pro Precision Optical Gaming Mouse",
            "slug": "pro-precision-gaming-mouse",
            "category": cat_map["electronics"],
            "description": "Ultra-lightweight gaming mouse with 16,000 DPI optical sensor, PTFE glide feet, and programmable thumb buttons.",
            "price": 1299.00,
            "original_price": 1899.00,
            "rating": 4.6,
            "reviews_count": 64,
            "stock": 50,
            "image_url": "assets/products/mouse.svg",
            "badge": "",
            "is_featured": False,
            "is_deal": False
        },
        {
            "name": "Ultra-Slim 15-inch Everyday Laptop",
            "slug": "ultra-slim-everyday-laptop",
            "category": cat_map["electronics"],
            "description": "FHD IPS anti-glare display, Intel Core processor, 16GB RAM, 512GB NVMe SSD, lightweight aluminum unibody.",
            "price": 54999.00,
            "original_price": 64999.00,
            "rating": 4.9,
            "reviews_count": 42,
            "stock": 15,
            "image_url": "assets/products/laptop.svg",
            "badge": "Top Rated",
            "is_featured": True,
            "is_deal": False
        },
        {
            "name": "High-Performance Running Shoes",
            "slug": "high-performance-running-shoes",
            "category": cat_map["footwear"],
            "description": "Engineered mesh upper, responsive cloud foam cushioning, and high-abrasion rubber outsole for runners.",
            "price": 2499.00,
            "original_price": 3999.00,
            "rating": 4.8,
            "reviews_count": 210,
            "stock": 60,
            "image_url": "assets/products/running_shoes.svg",
            "badge": "Best Seller",
            "is_featured": True,
            "is_deal": True
        },
        {
            "name": "Urban Casual Streetwear Sneakers",
            "slug": "urban-streetwear-sneakers",
            "category": cat_map["footwear"],
            "description": "Timeless low-top design with supple leather exterior, padded collar, and vulcanized rubber sole.",
            "price": 1899.00,
            "original_price": 2599.00,
            "rating": 4.5,
            "reviews_count": 94,
            "stock": 40,
            "image_url": "assets/products/sneakers.svg",
            "badge": "New",
            "is_featured": False,
            "is_deal": False
        },
        {
            "name": "Weatherproof Laptop Travel Backpack",
            "slug": "weatherproof-travel-backpack",
            "category": cat_map["fashion"],
            "description": "Durable Oxford fabric, dedicated padded 15.6-inch laptop compartment, hidden anti-theft back pocket, and USB charging port.",
            "price": 1499.00,
            "original_price": 2199.00,
            "rating": 4.7,
            "reviews_count": 140,
            "stock": 70,
            "image_url": "assets/products/backpack.svg",
            "badge": "Sale",
            "is_featured": True,
            "is_deal": True
        },
        {
            "name": "Weekend Duffle Gym & Travel Bag",
            "slug": "weekend-duffle-travel-bag",
            "category": cat_map["fashion"],
            "description": "Spacious main compartment, separate ventilated shoe pouch, detachable shoulder strap, water-resistant base.",
            "price": 1699.00,
            "original_price": 2499.00,
            "rating": 4.6,
            "reviews_count": 55,
            "stock": 35,
            "image_url": "assets/products/travel_bag.svg",
            "badge": "",
            "is_featured": False,
            "is_deal": False
        },
        {
            "name": "True Wireless Earbuds with Touch Control",
            "slug": "true-wireless-earbuds-pro",
            "category": cat_map["electronics"],
            "description": "Bluetooth 5.3 instant pairing, IPX5 sweatproof, punchy bass, smart touch controls, and compact wireless charging case.",
            "price": 1999.00,
            "original_price": 2999.00,
            "rating": 4.6,
            "reviews_count": 180,
            "stock": 85,
            "image_url": "assets/products/earbuds.svg",
            "badge": "Hot",
            "is_featured": True,
            "is_deal": True
        },
        {
            "name": "AMOLED Display Smart Fitness Watch",
            "slug": "amoled-smart-fitness-watch",
            "category": cat_map["accessories"],
            "description": "1.43-inch Always-On AMOLED screen, 24/7 heart rate and SpO2 tracking, 100+ sport modes, and 12-day battery life.",
            "price": 2999.00,
            "original_price": 4299.00,
            "rating": 4.7,
            "reviews_count": 165,
            "stock": 55,
            "image_url": "assets/products/smartwatch.svg",
            "badge": "Best Seller",
            "is_featured": True,
            "is_deal": True
        },
        {
            "name": "Portable Waterproof Bluetooth Speaker",
            "slug": "portable-waterproof-bluetooth-speaker",
            "category": cat_map["electronics"],
            "description": "360-degree room-filling sound, dual passive radiators, IP67 dust and waterproof rating, up to 16 hours playtime.",
            "price": 1799.00,
            "original_price": 2499.00,
            "rating": 4.5,
            "reviews_count": 72,
            "stock": 45,
            "image_url": "assets/products/speaker.svg",
            "badge": "Sale",
            "is_featured": False,
            "is_deal": True
        },
        {
            "name": "5G Flagship Smartphone 128GB",
            "slug": "5g-flagship-smartphone-128gb",
            "category": cat_map["electronics"],
            "description": "6.7-inch 120Hz AMOLED display, 64MP OIS triple camera, 5000mAh battery with 67W Turbo Charge.",
            "price": 28999.00,
            "original_price": 34999.00,
            "rating": 4.8,
            "reviews_count": 89,
            "stock": 20,
            "image_url": "assets/products/smartphone.svg",
            "badge": "New",
            "is_featured": True,
            "is_deal": False
        }
    ]

    for p in products_data:
        Product.objects.create(**p)

    # Update category counts
    for cat in Category.objects.all():
        cat.product_count = cat.products.count()
        cat.save()

    print(f"Created {Category.objects.count()} categories and {Product.objects.count()} products in INR!")

    # 3. Default demo user if not existing
    user, created = User.objects.get_or_create(
        username="priya_sharma",
        defaults={"email": "priya.sharma@example.com"}
    )
    if created:
        user.set_password("NovaCart@2026")
        user.first_name = "Priya"
        user.last_name = "Sharma"
        user.save()
        print("Created default user: priya_sharma / NovaCart@2026")

    # Update profile
    profile = user.profile
    profile.full_name = "Priya Sharma"
    profile.phone = "+91 98765 43210"
    profile.address = "Flat 402, Green Glen Layout, Bellandur"
    profile.city = "Bengaluru"
    profile.state = "Karnataka"
    profile.pincode = "560103"
    profile.save()

    # 4. Default Notifications
    Notification.objects.filter(user=user).delete()
    notifications = [
        {
            "title": "Welcome to NovaCart!",
            "message": "Explore thousands of products with free express delivery across India.",
            "notif_type": "info",
            "icon_type": "account"
        },
        {
            "title": "Flash Sale is Live!",
            "message": "Get up to 50% discount on top Electronics and Footwear today only.",
            "notif_type": "success",
            "icon_type": "deal"
        },
        {
            "title": "Order Placed Successfully",
            "message": "Your Order #NC10456 has been confirmed and is being processed for dispatch.",
            "notif_type": "success",
            "icon_type": "order"
        }
    ]
    for n in notifications:
        Notification.objects.create(user=user, **n)

    print("Seed completed successfully!")

if __name__ == '__main__':
    seed()
