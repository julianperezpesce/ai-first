"""Blog application models."""

from django.db import models
from django.contrib.auth.models import User


class Post(models.Model):
    """Blog post model."""

    title = models.CharField(max_length=200)
    content = models.TextField()
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="posts")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    published = models.BooleanField(default=False)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return self.title

    def publish(self):
        """Publish the post."""
        self.published = True
        self.save()


class Comment(models.Model):
    """Comment model for blog posts."""

    post = models.ForeignKey(Post, on_delete=models.CASCADE, related_name="comments")
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name="comments")
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Comment by {self.author.username} on {self.post.title}"


class Category(models.Model):
    """Category model for organizing posts."""

    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    posts = models.ManyToManyField(Post, related_name="categories", blank=True)

    class Meta:
        verbose_name_plural = "categories"

    def __str__(self):
        return self.name
