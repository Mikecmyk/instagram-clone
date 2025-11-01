from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.shortcuts import get_object_or_404
from .models import Profile
from .serializers import ProfileSerializer
from django.contrib.auth.models import User

class ProfileViewSet(viewsets.ViewSet):
    permission_classes = [IsAuthenticated]
    
    def retrieve(self, request, pk=None):
        user = get_object_or_404(User, id=pk)
        profile = get_object_or_404(Profile, user=user)
        serializer = ProfileSerializer(profile, context={'request': request})
        return Response(serializer.data)

    def update(self, request, pk=None):
        if request.user.id != int(pk):
            return Response({'error': 'Cannot edit other users profile'}, 
                          status=status.HTTP_403_FORBIDDEN)
        
        profile = get_object_or_404(Profile, user=request.user)
        serializer = ProfileSerializer(profile, data=request.data, partial=True, context={'request': request})
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['post'])
    def follow(self, request, pk=None):
        user_to_follow = get_object_or_404(User, id=pk)
        if user_to_follow == request.user:
            return Response({'error': 'Cannot follow yourself'}, 
                          status=status.HTTP_400_BAD_REQUEST)
        
        request.user.profile.following.add(user_to_follow.profile)
        return Response({'message': f'Now following {user_to_follow.username}'})

    @action(detail=True, methods=['delete'])
    def unfollow(self, request, pk=None):
        user_to_unfollow = get_object_or_404(User, id=pk)
        request.user.profile.following.remove(user_to_unfollow.profile)
        return Response({'message': f'Unfollowed {user_to_unfollow.username}'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def search_users(request):
    query = request.GET.get('query', '')
    if query:
        users = User.objects.filter(username__icontains=query)
        profiles = Profile.objects.filter(user__in=users)
        serializer = ProfileSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)
    return Response([])