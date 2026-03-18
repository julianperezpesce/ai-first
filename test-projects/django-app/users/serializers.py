"""Users application serializers."""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Follow


class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for UserProfile model."""

    class Meta:
        model = UserProfile
        fields = [
            "bio",
            "location",
            "birth_date",
            "avatar",
            "website",
            "twitter",
            "github",
        ]


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""

    profile = UserProfileSerializer()
    posts_count = serializers.IntegerField(source="posts.count", read_only=True)
    followers_count = serializers.IntegerField(source="followers.count", read_only=True)
    following_count = serializers.IntegerField(source="following.count", read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "username",
            "email",
            "first_name",
            "last_name",
            "profile",
            "posts_count",
            "followers_count",
            "following_count",
            "date_joined",
        ]
        read_only_fields = ["date_joined"]


class UserCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating new users."""

    password = serializers.CharField(write_only=True)
    password_confirm = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = [
            "username",
            "email",
            "password",
            "password_confirm",
            "first_name",
            "last_name",
        ]

    def validate(self, data):
        """Validate that passwords match."""
        if data["password"] != data["password_confirm"]:
            raise serializers.ValidationError("Passwords don't match")
        return data

    def create(self, validated_data):
        """Create a new user."""
        validated_data.pop("password_confirm")
        user = User.objects.create_user(**validated_data)
        return user


class FollowSerializer(serializers.ModelSerializer):
    """Serializer for Follow model."""

    follower_username = serializers.CharField(
        source="follower.username", read_only=True
    )
    following_username = serializers.CharField(
        source="following.username", read_only=True
    )

    class Meta:
        model = Follow
        fields = [
            "id",
            "follower",
            "follower_username",
            "following",
            "following_username",
            "created_at",
        ]
        read_only_fields = ["follower"]


class ChangePasswordSerializer(serializers.Serializer):
    """Serializer for password change."""

    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    new_password_confirm = serializers.CharField(required=True)

    def validate(self, data):
        """Validate new passwords match."""
        if data["new_password"] != data["new_password_confirm"]:
            raise serializers.ValidationError("New passwords don't match")
        return data
