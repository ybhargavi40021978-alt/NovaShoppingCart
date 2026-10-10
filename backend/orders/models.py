from django.db import models
from django.contrib.auth.models import User
from products.models import Product

class Order(models.Model):
    order_number = models.CharField(max_length=50, unique=True, db_index=True)
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='orders')
    session_key = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    
    # Customer Details
    full_name = models.CharField(max_length=150)
    email = models.EmailField()
    phone = models.CharField(max_length=20)
    
    # Shipping Address
    address = models.TextField()
    city = models.CharField(max_length=100)
    state = models.CharField(max_length=100)
    pincode = models.CharField(max_length=20)
    
    # Pricing in Indian Rupees
    subtotal = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    discount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    
    # Payment & Status
    payment_method = models.CharField(max_length=50, default='Cash on Delivery')
    payment_status = models.CharField(max_length=50, default='Completed')
    payment_id = models.CharField(max_length=100, blank=True, null=True, unique=True, db_index=True)
    order_status = models.CharField(max_length=50, default='Placed')  # 'Placed', 'Processing', 'Shipped', 'Delivered'
    tracking_step = models.IntegerField(default=1)  # 1: Order Placed, 2: Confirmed, 3: Shipped, 4: Delivered
    estimated_delivery = models.CharField(max_length=100, default='3-5 Business Days')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    @property
    def shipping_cost(self):
        return self.shipping

    @property
    def shipping_address(self):
        parts = [self.address, self.city, self.state]
        addr = ", ".join(p for p in parts if p)
        if self.pincode:
            addr += f" - {self.pincode}"
        return addr

    def __str__(self):
        return f"Order #{self.order_number} ({self.full_name}) - ₹{self.total_amount}"

class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, blank=True)
    product_name = models.CharField(max_length=200)
    price = models.DecimalField(max_digits=10, decimal_places=2)  # Unit price at purchase
    quantity = models.PositiveIntegerField(default=1)
    image_url = models.CharField(max_length=255, blank=True)

    @property
    def unit_price(self):
        return self.price

    @property
    def product_image(self):
        return self.image_url

    @property
    def line_total(self):
        return self.price * self.quantity

    @property
    def total_price(self):
        return self.price * self.quantity

    def __str__(self):
        return f"{self.quantity}x {self.product_name} in #{self.order.order_number}"
