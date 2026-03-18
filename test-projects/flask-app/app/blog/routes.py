"""Blog blueprint routes."""

from flask import Blueprint, render_template, redirect, url_for, flash, request, abort
from flask_login import login_required, current_user
from app import db
from app.models import Post, Category, Tag, Comment
from app.blog.forms import PostForm, CommentForm

bp = Blueprint("blog", __name__)


def generate_slug(title):
    """Generate URL slug from title."""
    import re

    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug.strip("-")


@bp.route("/create", methods=["GET", "POST"])
@login_required
def create_post():
    """Create new blog post."""
    form = PostForm()
    if form.validate_on_submit():
        post = Post(
            title=form.title.data,
            slug=generate_slug(form.title.data),
            content=form.content.data,
            summary=form.summary.data,
            is_published=form.is_published.data,
            user_id=current_user.id,
        )

        # Set category
        if form.category_id.data:
            post.category_id = form.category_id.data

        # Add tags
        if form.tags.data:
            tag_names = [t.strip() for t in form.tags.data.split(",")]
            for tag_name in tag_names:
                tag = Tag.query.filter_by(name=tag_name).first()
                if not tag:
                    tag = Tag(name=tag_name, slug=generate_slug(tag_name))
                    db.session.add(tag)
                post.tags.append(tag)

        db.session.add(post)
        db.session.commit()

        # Publish if requested
        if form.is_published.data:
            post.publish()

        flash("Your post has been created!")
        return redirect(url_for("blog.post", slug=post.slug))

    return render_template("blog/create.html", title="Create Post", form=form)


@bp.route("/<string:slug>/edit", methods=["GET", "POST"])
@login_required
def edit_post(slug):
    """Edit blog post."""
    post = Post.query.filter_by(slug=slug).first_or_404()

    # Check ownership
    if post.user_id != current_user.id and not current_user.is_admin:
        abort(403)

    form = PostForm(obj=post)
    if form.validate_on_submit():
        post.title = form.title.data
        post.slug = generate_slug(form.title.data)
        post.content = form.content.data
        post.summary = form.summary.data

        # Update publish status
        if form.is_published.data and not post.is_published:
            post.publish()
        elif not form.is_published.data and post.is_published:
            post.unpublish()

        db.session.commit()
        flash("Your post has been updated!")
        return redirect(url_for("blog.post", slug=post.slug))

    return render_template("blog/edit.html", title="Edit Post", form=form, post=post)


@bp.route("/<string:slug>/delete", methods=["POST"])
@login_required
def delete_post(slug):
    """Delete blog post."""
    post = Post.query.filter_by(slug=slug).first_or_404()

    # Check ownership
    if post.user_id != current_user.id and not current_user.is_admin:
        abort(403)

    db.session.delete(post)
    db.session.commit()
    flash("Your post has been deleted.")
    return redirect(url_for("main.index"))


@bp.route("/<string:slug>")
def post(slug):
    """View blog post."""
    post = Post.query.filter_by(slug=slug).first_or_404()

    # Only show published posts to non-authors
    if not post.is_published and (
        not current_user.is_authenticated
        or (current_user.id != post.user_id and not current_user.is_admin)
    ):
        abort(404)

    form = CommentForm()
    return render_template("blog/post.html", post=post, form=form)


@bp.route("/<string:slug>/comment", methods=["POST"])
@login_required
def add_comment(slug):
    """Add comment to post."""
    post = Post.query.filter_by(slug=slug).first_or_404()
    form = CommentForm()

    if form.validate_on_submit():
        comment = Comment(
            content=form.content.data, post_id=post.id, user_id=current_user.id
        )
        db.session.add(comment)
        db.session.commit()
        flash("Your comment has been added.")

    return redirect(url_for("blog.post", slug=post.slug))
