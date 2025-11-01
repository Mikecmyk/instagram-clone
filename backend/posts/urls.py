from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'posts', views.PostViewSet, basename='post')

urlpatterns = [
    path('', include(router.urls)),
    path('feed/', views.news_feed, name='news_feed'),
    
    # Authentication endpoints
    path('auth/login/', views.login_view, name='login'),
    path('auth/register/', views.register_view, name='register'),
    
    # Comments endpoints
    path('posts/<int:post_id>/comments/', views.CommentViewSet.as_view({
        'get': 'list',
        'post': 'create'
    }), name='post-comments'),
]