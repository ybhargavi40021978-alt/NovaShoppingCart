import os
from django.conf import settings
from django.http import HttpResponse, Http404

def serve_page(page_name):
    def view(request):
        file_path = os.path.join(settings.BASE_DIR, page_name)
        if not os.path.exists(file_path):
            file_path = os.path.join(settings.BASE_DIR, 'novacart', page_name)
        
        if os.path.exists(file_path):
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            response = HttpResponse(content, content_type='text/html')
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            return response
        raise Http404(f"Page {page_name} not found")
    return view

def home_view(request):
    return serve_page('index.html')(request)
