# frozen_string_literal: true

module Api
  class PostsController < ApplicationController
    before_action :set_post, only: %i[show update destroy]

    # GET /api/posts
    def index
      @posts = Post.includes(:user, :comments).recent
      @posts = @posts.published if params[:published] == "true"
      @posts = @posts.draft if params[:published] == "false"
      render_success @posts
    end

    # GET /api/posts/:id
    def show
      render_success @post.as_json(include: %i[user comments])
    end

    # POST /api/posts
    def create
      @post = PostService.create_post(post_params)

      if @post.persisted?
        render_success @post, status: :created
      else
        render_error @post.errors.full_messages.join(", "), status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/posts/:id
    def update
      if @post.update(post_params)
        render_success @post
      else
        render_error @post.errors.full_messages.join(", "), status: :unprocessable_entity
      end
    end

    # DELETE /api/posts/:id
    def destroy
      @post.destroy
      head :no_content
    end

    # POST /api/posts/:id/publish
    def publish
      @post = PostService.publish(params[:id])
      render_success @post
    end

    # POST /api/posts/:id/unpublish
    def unpublish
      @post = PostService.unpublish(params[:id])
      render_success @post
    end

    private

    def set_post
      @post = Post.find(params[:id])
    end

    def post_params
      params.require(:post).permit(:title, :content, :body, :user_id, :published)
    end
  end
end