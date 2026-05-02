from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from app import models, schemas
from app.database import get_db
from app.dependencies import get_current_active_user, get_current_superuser

router = APIRouter(prefix="/posts", tags=["posts"])


def generate_slug(title: str) -> str:
    """Generate URL slug from title."""
    import re

    slug = re.sub(r"[^\w\s-]", "", title.lower())
    slug = re.sub(r"[-\s]+", "-", slug)
    return slug.strip("-")


@router.get("/", response_model=List[schemas.PostList])
def list_posts(
    skip: int = 0,
    limit: int = 10,
    category_slug: Optional[str] = None,
    tag_slug: Optional[str] = None,
    search: Optional[str] = None,
    published_only: bool = True,
    db: Session = Depends(get_db),
):
    """List all posts with filters."""
    query = db.query(models.Post)

    # Filter by published status
    if published_only:
        query = query.filter(models.Post.is_published == True)

    # Filter by category
    if category_slug:
        query = query.join(models.Category).filter(
            models.Category.slug == category_slug
        )

    # Filter by tag
    if tag_slug:
        query = (
            query.join(models.post_tags)
            .join(models.Tag)
            .filter(models.Tag.slug == tag_slug)
        )

    # Search
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            models.Post.title.ilike(search_filter)
            | models.Post.content.ilike(search_filter)
        )

    posts = (
        query.order_by(models.Post.created_at.desc()).offset(skip).limit(limit).all()
    )

    # Convert to response format
    result = []
    for post in posts:
        post_dict = {
            "id": post.id,
            "title": post.title,
            "slug": post.slug,
            "summary": post.summary,
            "is_published": post.is_published,
            "published_at": post.published_at,
            "view_count": post.view_count,
            "created_at": post.created_at,
            "author_id": post.author_id,
            "author_username": post.author.username,
            "category_name": post.category.name if post.category else None,
            "tags": [tag.name for tag in post.tags],
        }
        result.append(post_dict)

    return result


@router.post("/", response_model=schemas.Post, status_code=status.HTTP_201_CREATED)
def create_post(
    post: schemas.PostCreate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Create a new post."""
    # Generate slug
    slug = generate_slug(post.title)

    # Check if slug exists
    existing = db.query(models.Post).filter(models.Post.slug == slug).first()
    if existing:
        import uuid

        slug = f"{slug}-{uuid.uuid4().hex[:8]}"

    # Create post
    db_post = models.Post(
        title=post.title,
        slug=slug,
        content=post.content,
        summary=post.summary,
        is_published=post.is_published,
        author_id=current_user.id,
        category_id=post.category_id,
    )

    # Add tags
    if post.tag_ids:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(post.tag_ids)).all()
        db_post.tags = tags

    db.add(db_post)
    db.commit()
    db.refresh(db_post)

    # Publish if requested
    if post.is_published:
        db_post.publish()
        db.commit()
        db.refresh(db_post)

    return db_post


@router.get("/{slug}", response_model=schemas.Post)
def get_post(slug: str, db: Session = Depends(get_db)):
    """Get a single post by slug."""
    post = db.query(models.Post).filter(models.Post.slug == slug).first()

    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    # Increment view count
    post.view_count += 1
    db.commit()

    return post


@router.put("/{post_id}", response_model=schemas.Post)
def update_post(
    post_id: int,
    post_update: schemas.PostUpdate,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Update a post."""
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    # Check ownership
    if db_post.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to update this post",
        )

    # Update fields
    update_data = post_update.model_dump(exclude_unset=True)

    # Handle tags separately
    tag_ids = update_data.pop("tag_ids", None)
    if tag_ids is not None:
        tags = db.query(models.Tag).filter(models.Tag.id.in_(tag_ids)).all()
        db_post.tags = tags

    # Update other fields
    for field, value in update_data.items():
        if field == "is_published":
            if value and not db_post.is_published:
                db_post.publish()
            elif not value and db_post.is_published:
                db_post.unpublish()
        else:
            setattr(db_post, field, value)

    # Regenerate slug if title changed
    if "title" in update_data:
        db_post.slug = generate_slug(db_post.title)

    db.commit()
    db.refresh(db_post)

    return db_post


@router.delete("/{post_id}")
def delete_post(
    post_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Delete a post."""
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    # Check ownership
    if db_post.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to delete this post",
        )

    db.delete(db_post)
    db.commit()

    return {"message": "Post deleted successfully"}


@router.post("/{post_id}/publish", response_model=schemas.Post)
def publish_post(
    post_id: int,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Publish a post."""
    db_post = db.query(models.Post).filter(models.Post.id == post_id).first()

    if not db_post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Post not found"
        )

    # Check ownership
    if db_post.author_id != current_user.id and not current_user.is_superuser:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to publish this post",
        )

    db_post.publish()
    db.commit()
    db.refresh(db_post)

    return db_post


@router.get("/my/posts", response_model=List[schemas.PostList])
def get_my_posts(
    skip: int = 0,
    limit: int = 10,
    current_user: models.User = Depends(get_current_active_user),
    db: Session = Depends(get_db),
):
    """Get current user's posts."""
    posts = (
        db.query(models.Post)
        .filter(models.Post.author_id == current_user.id)
        .order_by(models.Post.created_at.desc())
        .offset(skip)
        .limit(limit)
        .all()
    )

    return posts
