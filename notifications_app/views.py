from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from cart_app.views import get_user_or_session_filter
from .models import Notification

def list_notifications_view(request):
    f = get_user_or_session_filter(request)
    notifs = Notification.objects.filter(**f)

    if not notifs.exists():
        # Fallback to demo notifications so user has instant content
        notifs = Notification.objects.all()[:5]

    data = [
        {
            'id': n.id,
            'title': n.title,
            'message': n.message,
            'notif_type': n.notif_type,
            'icon_type': n.icon_type,
            'is_read': n.is_read,
            'time_ago': n.created_at.strftime('%d %b, %I:%M %p'),
        }
        for n in notifs
    ]

    unread_count = sum(1 for n in data if not n['is_read'])

    return JsonResponse({
        'success': True,
        'notifications': data,
        'unread_count': unread_count
    })

@csrf_exempt
def mark_read_view(request, notif_id):
    Notification.objects.filter(id=notif_id).update(is_read=True)
    return JsonResponse({'success': True})

@csrf_exempt
def mark_all_read_view(request):
    f = get_user_or_session_filter(request)
    Notification.objects.filter(**f).update(is_read=True)
    return JsonResponse({'success': True})

@csrf_exempt
def clear_notifications_view(request):
    f = get_user_or_session_filter(request)
    Notification.objects.filter(**f).delete()
    return JsonResponse({'success': True, 'message': 'All notifications cleared.'})
