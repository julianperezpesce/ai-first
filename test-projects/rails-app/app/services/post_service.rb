# frozen_string_literal: true

class PostService
  # Create a new post with the given attributes
  #
  # @param attributes [Hash] Post attributes (title, content, body, user_id)
  # @return [Post] The created post
  def self.create_post(attributes)
    Post.create!(attributes)
  end

  # Find a post by ID
  #
  # @param id [Integer] The post ID
  # @return [Post] The found post
  # @raise [ActiveRecord::RecordNotFound] If post not found
  def self.find_post(id)
    Post.includes(:user, :comments).find(id)
  end

  # Update a post with the given attributes
  #
  # @param id [Integer] The post ID
  # @param attributes [Hash] Attributes to update
  # @return [Post] The updated post
  def self.update_post(id, attributes)
    post = Post.find(id)
    post.update!(attributes)
    post
  end

  # Delete a post by ID
  #
  # @param id [Integer] The post ID
  # @return [Boolean] True if deleted
  def self.delete_post(id)
    post = Post.find(id)
    post.destroy!
    true
  end

  # Publish a post
  #
  # @param id [Integer] The post ID
  # @return [Post] The published post
  def self.publish(id)
    post = Post.find(id)
    post.publish!
    post
  end

  # Unpublish a post
  #
  # @param id [Integer] The post ID
  # @return [Post] The unpublished post
  def self.unpublish(id)
    post = Post.find(id)
    post.unpublish!
    post
  end

  # Get all published posts
  #
  # @return [Array<Post>] List of published posts
  def self.published_posts
    Post.published.recent.includes(:user)
  end

  # Get all draft posts
  #
  # @return [Array<Post>] List of draft posts
  def self.draft_posts
    Post.draft.recent.includes(:user)
  end

  # Get posts by user
  #
  # @param user_id [Integer] The user ID
  # @return [Array<Post>] List of posts by the user
  def self.posts_by_user(user_id)
    Post.by_user(user_id).recent.includes(:comments)
  end

  # Search posts by title or content
  #
  # @param query [String] The search query
  # @return [Array<Post>] Matching posts
  def self.search(query)
    Post.where("title LIKE ? OR content LIKE ? OR body LIKE ?", "%#{query}%", "%#{query}%", "%#{query}%")
        .recent
  end
end