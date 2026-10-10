from django.db import models
from django.contrib.auth.models import User
from products.models import Product

class CartItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='cart_items')
    session_key = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='in_carts')
    quantity = models.PositiveIntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        user_str = self.user.username if self.user else f"Session:{self.session_key}"
        return f"{self.quantity}x {self.product.name} ({user_str})"

    @property
    def item_total(self):
        return self.product.price * self.quantity

class WishlistItem(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='wishlist_items')
    session_key = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='in_wishlists')
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        user_str = self.user.username if self.user else f"Session:{self.session_key}"
        return f"{self.product.name} in wishlist of {user_str}"
