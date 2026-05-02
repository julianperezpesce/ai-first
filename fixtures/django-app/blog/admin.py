"""Blog application admin configuration."""

from django.contrib import admin
from .models import Post, Comment, Category


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    """Admin configuration for Post model."""

    list_display = ["title", "author", "published", "created_at"]
    list_filter = ["published", "created_at", "categories"]
    search_fields = ["title", "content"]
    date_hierarchy = "created_at"


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    """Admin configuration for Comment model."""

    list_display = ["post", "author", "created_at"]
    list_filter = ["created_at"]
    search_fields = ["content"]


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    """Admin configuration for Category model."""

    list_display = ["name", "description"]
    search_fields = ["name"]
