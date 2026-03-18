"""Main blueprint routes."""

from flask import Blueprint, render_template, request, current_app
from app.models import Post, Category, Tag
from app import db

bp = Blueprint("main", __name__)


@bp.route("/")
def index():
    """Home page."""
    page = request.args.get("page", 1, type=int)
    posts = (
        Post.query.filter_by(is_published=True)
        .order_by(Post.published_at.desc())
        .paginate(
            page=page, per_page=current_app.config["POSTS_PER_PAGE"], error_out=False
        )
    )
    return render_template("index.html", posts=posts)


@bp.route("/about")
def about():
    """About page."""
    return render_template("about.html")


@bp.route("/post/<string:slug>")
def post(slug):
    """Single post page."""
    post = Post.query.filter_by(slug=slug, is_published=True).first_or_404()
    post.increment_view()
    return render_template("post.html", post=post)


@bp.route("/category/<string:slug>")
def category(slug):
    """Category page."""
    category = Category.query.filter_by(slug=slug).first_or_404()
    page = request.args.get("page", 1, type=int)
    posts = (
        Post.query.filter_by(category_id=category.id, is_published=True)
        .order_by(Post.published_at.desc())
        .paginate(
            page=page, per_page=current_app.config["POSTS_PER_PAGE"], error_out=False
        )
    )
    return render_template("category.html", category=category, posts=posts)


@bp.route("/tag/<string:slug>")
def tag(slug):
    """Tag page."""
    tag = Tag.query.filter_by(slug=slug).first_or_404()
    page = request.args.get("page", 1, type=int)
    posts = (
        tag.posts.filter_by(is_published=True)
        .order_by(Post.published_at.desc())
        .paginate(
            page=page, per_page=current_app.config["POSTS_PER_PAGE"], error_out=False
        )
    )
    return render_template("tag.html", tag=tag, posts=posts)


@bp.route("/search")
def search():
    """Search page."""
    q = request.args.get("q", "")
    page = request.args.get("page", 1, type=int)

    if not q:
        return render_template("search.html", posts=None, q=q)

    posts = (
        Post.query.filter(
            Post.is_published == True,
            db.or_(Post.title.ilike(f"%{q}%"), Post.content.ilike(f"%{q}%")),
        )
        .order_by(Post.published_at.desc())
        .paginate(
            page=page, per_page=current_app.config["POSTS_PER_PAGE"], error_out=False
        )
    )

    return render_template("search.html", posts=posts, q=q)
