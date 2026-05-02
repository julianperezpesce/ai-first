"""Blog application serializers."""

from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Post, Comment, Category


class CategorySerializer(serializers.ModelSerializer):
    """Serializer for Category model."""

    class Meta:
        model = Category
        fields = ["id", "name", "description"]


class CommentSerializer(serializers.ModelSerializer):
    """Serializer for Comment model."""

    author_username = serializers.CharField(source="author.username", read_only=True)

    class Meta:
        model = Comment
        fields = ["id", "post", "author", "author_username", "content", "created_at"]
        read_only_fields = ["author"]


class PostSerializer(serializers.ModelSerializer):
    """Serializer for Post model."""

    author_username = serializers.CharField(source="author.username", read_only=True)
    comments_count = serializers.IntegerField(source="comments.count", read_only=True)
    categories = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = Post
        fields = [
            "id",
            "title",
            "content",
            "author",
            "author_username",
            "created_at",
            "updated_at",
            "published",
            "comments_count",
            "categories",
        ]
        read_only_fields = ["author"]


class PostCreateUpdateSerializer(serializers.ModelSerializer):
    """Serializer for creating and updating posts."""

    category_ids = serializers.ListField(
        child=serializers.IntegerField(), write_only=True, required=False
    )

    class Meta:
        model = Post
        fields = ["id", "title", "content", "published", "category_ids"]

    def create(self, validated_data):
        """Create a new post with categories."""
        category_ids = validated_data.pop("category_ids", [])
        post = Post.objects.create(**validated_data)
        if category_ids:
            categories = Category.objects.filter(id__in=category_ids)
            post.categories.set(categories)
        return post
