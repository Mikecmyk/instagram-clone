from rest_framework import viewsets, status
from rest_framework.decorators import api_view, action, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.shortcuts import get_object_or_404
from django.contrib.auth import authenticate, login
from django.contrib.auth.models import User
from .models import Post, Comment
from .serializers import PostSerializer, CommentSerializer

# Authentication views
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    
    user = authenticate(request, username=username, password=password)
    
    if user is not None:
        login(request, user)
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'message': 'Login successful'
        })
    else:
        return Response({'error': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def register_view(request):
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    password2 = request.data.get('password2')
    
    if password != password2:
        return Response({'error': 'Passwords do not match'}, status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
        user = User.objects.create_user(username=username, email=email, password=password)
        user.save()
        return Response({'message': 'User created successfully'})
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)

# Feed view
@api_view(['GET'])
@permission_classes([AllowAny])
def news_feed(request):
    # If user is not authenticated, show all posts
    if not request.user.is_authenticated:
        posts = Post.objects.all().order_by('-created_at')
    else:
        # Get posts from users that the current user follows
        try:
            following_profiles = request.user.profile.following.all()
            following_users = [profile.user for profile in following_profiles]
            posts = Post.objects.filter(user__in=following_users).order_by('-created_at')
        except:
            # Fallback if profile doesn't exist
            posts = Post.objects.all().order_by('-created_at')
    
    serializer = PostSerializer(posts, many=True, context={'request': request})
    return Response(serializer.data)

# Post ViewSet
class PostViewSet(viewsets.ModelViewSet):
    permission_classes = [AllowAny]
    queryset = Post.objects.all().order_by('-created_at')
    serializer_class = PostSerializer

    def get_permissions(self):
        # Only require authentication for creating, updating, deleting posts
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post', 'delete'])
    def like(self, request, pk=None):
        post = self.get_object()
        
        # If user is not authenticated, return success but don't actually like
        if not request.user.is_authenticated:
            return Response({
                'message': 'Like recorded (anonymous user)',
                'anonymous_like': True
            })
        
        # Authenticated user - actually like the post
        if request.method == 'POST':
            post.likes.add(request.user)
            return Response({'message': 'Post liked'})
        elif request.method == 'DELETE':
            post.likes.remove(request.user)
            return Response({'message': 'Post unliked'})

# Comment ViewSet
class CommentViewSet(viewsets.ModelViewSet):
    serializer_class = CommentSerializer

    def get_queryset(self):
        # Handle both nested and flat routes
        post_id = self.kwargs.get('post_id')
        if post_id:
            return Comment.objects.filter(post_id=post_id).order_by('-created_at')
        return Comment.objects.all().order_by('-created_at')

    def get_permissions(self):
        # Allow anyone to view comments, but require auth for creating
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsAuthenticated()]
        return [AllowAny()]

    def perform_create(self, serializer):
        # Get post_id from URL parameters or request data
        post_id = self.kwargs.get('post_id')
        
        if not post_id:
            # Try to get from request data
            post_id = self.request.data.get('post')
            
        if not post_id:
            return Response(
                {'error': 'Post ID is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        post = get_object_or_404(Post, id=post_id)
        serializer.save(user=self.request.user, post=post)