# frozen_string_literal: true

class UserService
  # Create a new user with the given attributes
  #
  # @param attributes [Hash] User attributes (name, email)
  # @return [User] The created user
  def self.create_user(attributes)
    User.create!(attributes)
  end

  # Find a user by email
  #
  # @param email [String] The email to search for
  # @return [User, nil] The found user or nil
  def self.find_by_email(email)
    User.find_by(email: email)
  end

  # Find a user by ID
  #
  # @param id [Integer] The user ID
  # @return [User] The found user
  # @raise [ActiveRecord::RecordNotFound] If user not found
  def self.find_user(id)
    User.find(id)
  end

  # Update a user with the given attributes
  #
  # @param id [Integer] The user ID
  # @param attributes [Hash] Attributes to update
  # @return [User] The updated user
  def self.update_user(id, attributes)
    user = User.find(id)
    user.update!(attributes)
    user
  end

  # Delete a user by ID
  #
  # @param id [Integer] The user ID
  # @return [Boolean] True if deleted
  def self.delete_user(id)
    user = User.find(id)
    user.destroy!
    true
  end

  # Get all active users
  #
  # @return [Array<User>] List of active users
  def self.active_users
    User.active.recent
  end

  # Deactivate a user
  #
  # @param id [Integer] The user ID
  # @return [User] The deactivated user
  def self.deactivate_user(id)
    user = User.find(id)
    user.deactivate!
    user
  end

  # Activate a user
  #
  # @param id [Integer] The user ID
  # @return [User] The activated user
  def self.activate_user(id)
    user = User.find(id)
    user.activate!
    user
  end
end