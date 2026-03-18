"""API blueprint routes."""

from flask import Blueprint, request, jsonify
from app import db
from app.models import Post, Category, Tag, User, Comment

bp = Blueprint("api", __name__)


@bp.route("/posts", methods=["GET"])
def api_get_posts():
    """API: Get all posts."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)

    query = Post.query.filter_by(is_published=True)

    # Filter by category
    category_slug = request.args.get("category")
    if category_slug:
        category = Category.query.filter_by(slug=category_slug).first()
        if category:
            query = query.filter_by(category_id=category.id)

    # Search
    search = request.args.get("q")
    if search:
        query = query.filter(
            db.or_(Post.title.ilike(f"%{search}%"), Post.content.ilike(f"%{search}%"))
        )

    posts = query.order_by(Post.published_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify(
        {
            "posts": [
                {
                    "id": p.id,
                    "title": p.title,
                    "slug": p.slug,
                    "summary": p.summary,
                    "author": p.author.username,
                    "published_at": p.published_at.isoformat()
                    if p.published_at
                    else None,
                    "view_count": p.view_count,
                    "category": p.category.name if p.category else None,
                    "tags": [t.name for t in p.tags],
                }
                for p in posts.items
            ],
            "total": posts.total,
            "pages": posts.pages,
            "current_page": page,
        }
    )


@bp.route("/posts/<string:slug>", methods=["GET"])
def api_get_post(slug):
    """API: Get single post."""
    post = Post.query.filter_by(slug=slug, is_published=True).first_or_404()
    post.increment_view()

    return jsonify(
        {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "content": post.content,
            "summary": post.summary,
            "author": post.author.username,
            "published_at": post.published_at.isoformat()
            if post.published_at
            else None,
            "view_count": post.view_count,
            "category": post.category.name if post.category else None,
            "tags": [t.name for t in post.tags],
            "comments_count": post.comments.count(),
        }
    )


@bp.route("/categories", methods=["GET"])
def api_get_categories():
    """API: Get all categories."""
    categories = Category.query.all()
    return jsonify(
        {
            "categories": [
                {
                    "id": c.id,
                    "name": c.name,
                    "slug": c.slug,
                    "description": c.description,
                    "posts_count": c.posts.count(),
                }
                for c in categories
            ]
        }
    )


@bp.route("/tags", methods=["GET"])
def api_get_tags():
    """API: Get all tags."""
    tags = Tag.query.all()
    return jsonify(
        {
            "tags": [
                {
                    "id": t.id,
                    "name": t.name,
                    "slug": t.slug,
                    "posts_count": t.posts.count(),
                }
                for t in tags
            ]
        }
    )
