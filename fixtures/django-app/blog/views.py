"""Blog application views."""

from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.contrib.auth.models import User
from .models import Post, Comment, Category
from .serializers import (
    PostSerializer,
    PostCreateUpdateSerializer,
    CommentSerializer,
    CategorySerializer,
)


class PostViewSet(viewsets.ModelViewSet):
    """ViewSet for blog posts."""

    queryset = Post.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        """Return appropriate serializer class."""
        if self.action in ["create", "update", "partial_update"]:
            return PostCreateUpdateSerializer
        return PostSerializer

    def get_permissions(self):
        """Allow anyone to view published posts."""
        if self.action in ["list", "retrieve"]:
            return [AllowAny()]
        return [IsAuthenticated()]

    def perform_create(self, serializer):
        """Set the author to the current user."""
        serializer.save(author=self.request.user)

    @action(detail=True, methods=["post"])
    def publish(self, request, pk=None):
        """Publish a blog post."""
        post = self.get_object()
        post.publish()
        return Response({"status": "post published"})

    @action(detail=False, methods=["get"])
    def my_posts(self, request):
        """Get posts by current user."""
        posts = Post.objects.filter(author=request.user)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=["get"])
    def published(self, request):
        """Get all published posts."""
        posts = Post.objects.filter(published=True)
        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)


class CommentViewSet(viewsets.ModelViewSet):
    """ViewSet for comments."""

    queryset = Comment.objects.all()
    serializer_class = CommentSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        """Set the author to the current user."""
        serializer.save(author=self.request.user)

    def get_queryset(self):
        """Filter comments by post if provided."""
        queryset = Comment.objects.all()
        post_id = self.request.query_params.get("post", None)
        if post_id:
            queryset = queryset.filter(post_id=post_id)
        return queryset


class CategoryViewSet(viewsets.ModelViewSet):
    """ViewSet for categories."""

    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [AllowAny]

    @action(detail=True, methods=["get"])
    def posts(self, request, pk=None):
        """Get posts in this category."""
        category = self.get_object()
        posts = category.posts.filter(published=True)
        from .serializers import PostSerializer

        serializer = PostSerializer(posts, many=True)
        return Response(serializer.data)
