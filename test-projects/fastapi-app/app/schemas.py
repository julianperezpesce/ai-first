from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field, ConfigDict


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    full_name: Optional[str] = None
    bio: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8)


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    email: Optional[EmailStr] = None


class User(UserBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_active: bool
    is_superuser: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    posts_count: Optional[int] = 0


class UserInDB(User):
    hashed_password: str


# Category schemas
class CategoryBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None


class Category(CategoryBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    created_at: datetime


# Tag schemas
class TagBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=50)


class TagCreate(TagBase):
    pass


class Tag(TagBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    created_at: datetime


# Comment schemas
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1)


class CommentCreate(CommentBase):
    parent_id: Optional[int] = None


class CommentUpdate(BaseModel):
    content: Optional[str] = None


class Comment(CommentBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    is_approved: bool
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_id: int
    author_username: str
    post_id: int
    parent_id: Optional[int] = None
    replies_count: Optional[int] = 0


# Post schemas
class PostBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    summary: Optional[str] = Field(None, max_length=500)


class PostCreate(PostBase):
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = []
    is_published: bool = False


class PostUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    summary: Optional[str] = None
    category_id: Optional[int] = None
    tag_ids: Optional[List[int]] = None
    is_published: Optional[bool] = None


class Post(PostBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    slug: str
    is_published: bool
    published_at: Optional[datetime] = None
    view_count: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    author_id: int
    author_username: str
    category: Optional[Category] = None
    tags: List[Tag] = []
    comments_count: Optional[int] = 0


class PostList(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    summary: Optional[str]
    is_published: bool
    published_at: Optional[datetime]
    view_count: int
    created_at: datetime
    author_id: int
    author_username: str
    category_name: Optional[str] = None
    tags: List[str] = []


# Auth schemas
class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    username: Optional[str] = None


class LoginRequest(BaseModel):
    username: str
    password: str


# Pagination schema
class PaginatedResponse(BaseModel):
    items: List
    total: int
    page: int
    page_size: int
    pages: int


class PostFilter(BaseModel):
    category_slug: Optional[str] = None
    tag_slug: Optional[str] = None
    author_username: Optional[str] = None
    is_published: Optional[bool] = True
    search: Optional[str] = None
