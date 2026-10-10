from django.db import models
from django.contrib.auth.models import User

class Notification(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, null=True, blank=True, related_name='notifications')
    session_key = models.CharField(max_length=100, blank=True, null=True, db_index=True)
    title = models.CharField(max_length=200)
    message = models.TextField()
    notif_type = models.CharField(max_length=50, default='success')  # 'success', 'info', 'warning', 'error'
    icon_type = models.CharField(max_length=50, default='order')  # 'order', 'wishlist', 'cart', 'account', 'deal'
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"[{self.notif_type.upper()}] {self.title}"

    class Meta:
        ordering = ['-created_at']
