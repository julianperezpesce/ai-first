"""Users application views."""

from rest_framework import viewsets, status, generics
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from .models import UserProfile, Follow
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserProfileSerializer,
    FollowSerializer,
    ChangePasswordSerializer,
)


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for users."""

    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        """Allow anyone to register, but only authenticated users for other actions."""
        if self.action == "create":
            return [AllowAny()]
        return [IsAuthenticated()]

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action == "create":
            return UserCreateSerializer
        return UserSerializer

    @action(detail=False, methods=["get"])
    def me(self, request):
        """Get current user profile."""
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    @action(detail=False, methods=["put", "patch"])
    def update_profile(self, request):
        """Update current user profile."""
        user = request.user
        profile = user.profile

        # Update user data
        user_serializer = UserSerializer(user, data=request.data, partial=True)
        if user_serializer.is_valid():
            user_serializer.save()

        # Update profile data
        if "profile" in request.data:
            profile_serializer = UserProfileSerializer(
                profile, data=request.data["profile"], partial=True
            )
            if profile_serializer.is_valid():
                profile_serializer.save()

        return Response(UserSerializer(user).data)

    @action(detail=False, methods=["post"])
    def change_password(self, request):
        """Change user password."""
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if user.check_password(serializer.validated_data["old_password"]):
                user.set_password(serializer.validated_data["new_password"])
                user.save()
                return Response({"status": "password changed"})
            return Response(
                {"error": "Wrong old password"}, status=status.HTTP_400_BAD_REQUEST
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"])
    def follow(self, request, pk=None):
        """Follow a user."""
        user_to_follow = self.get_object()
        if user_to_follow == request.user:
            return Response(
                {"error": "Cannot follow yourself"}, status=status.HTTP_400_BAD_REQUEST
            )

        follow, created = Follow.objects.get_or_create(
            follower=request.user, following=user_to_follow
        )

        if created:
            return Response({"status": "following"})
        return Response({"status": "already following"})

    @action(detail=True, methods=["post"])
    def unfollow(self, request, pk=None):
        """Unfollow a user."""
        user_to_unfollow = self.get_object()
        Follow.objects.filter(
            follower=request.user, following=user_to_unfollow
        ).delete()
        return Response({"status": "unfollowed"})

    @action(detail=True, methods=["get"])
    def followers(self, request, pk=None):
        """Get user followers."""
        user = self.get_object()
        followers = Follow.objects.filter(following=user)
        serializer = FollowSerializer(followers, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=["get"])
    def following(self, request, pk=None):
        """Get who user is following."""
        user = self.get_object()
        following = Follow.objects.filter(follower=user)
        serializer = FollowSerializer(following, many=True)
        return Response(serializer.data)


class UserProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for user profiles."""

    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filter by user if provided."""
        queryset = UserProfile.objects.all()
        user_id = self.request.query_params.get("user", None)
        if user_id:
            queryset = queryset.filter(user_id=user_id)
        return queryset
