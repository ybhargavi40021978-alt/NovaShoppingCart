from django.utils.deprecation import MiddlewareMixin
from django.http import HttpResponse

class SimpleCorsMiddleware(MiddlewareMixin):
    def process_request(self, request):
        if request.method == 'OPTIONS':
            response = HttpResponse()
            origin = request.headers.get('Origin', '*')
            response['Access-Control-Allow-Origin'] = origin
            response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken, Authorization, X-Requested-With'
            response['Access-Control-Allow-Credentials'] = 'true'
            return response
        return None

    def process_response(self, request, response):
        origin = request.headers.get('Origin', '*')
        response['Access-Control-Allow-Origin'] = origin
        response['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
        response['Access-Control-Allow-Headers'] = 'Content-Type, X-CSRFToken, Authorization, X-Requested-With'
        response['Access-Control-Allow-Credentials'] = 'true'
        return response
