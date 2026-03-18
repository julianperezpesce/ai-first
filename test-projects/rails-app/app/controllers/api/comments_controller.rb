# frozen_string_literal: true

module Api
  class CommentsController < ApplicationController
    before_action :set_post
    before_action :set_comment, only: %i[show update destroy]

    # GET /api/posts/:post_id/comments
    def index
      @comments = @post.comments.includes(:user).recent
      @comments = @comments.approved if params[:approved] == "true"
      @comments = @comments.pending if params[:approved] == "false"
      render_success @comments
    end

    # GET /api/posts/:post_id/comments/:id
    def show
      render_success @comment.as_json(include: :user)
    end

    # POST /api/posts/:post_id/comments
    def create
      @comment = @post.comments.build(comment_params)

      if @comment.save
        render_success @comment, status: :created
      else
        render_error @comment.errors.full_messages.join(", "), status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/posts/:post_id/comments/:id
    def update
      if @comment.update(comment_params)
        render_success @comment
      else
        render_error @comment.errors.full_messages.join(", "), status: :unprocessable_entity
      end
    end

    # DELETE /api/posts/:post_id/comments/:id
    def destroy
      @comment.destroy
      head :no_content
    end

    # POST /api/posts/:post_id/comments/:id/approve
    def approve
      @comment = @post.comments.find(params[:id])
      @comment.approve!
      render_success @comment
    end

    # POST /api/posts/:post_id/comments/:id/reject
    def reject
      @comment = @post.comments.find(params[:id])
      @comment.reject!
      render_success @comment
    end

    private

    def set_post
      @post = Post.find(params[:post_id])
    end

    def set_comment
      @comment = @post.comments.find(params[:id])
    end

    def comment_params
      params.require(:comment).permit(:content, :user_id, :approved)
    end
  end
end