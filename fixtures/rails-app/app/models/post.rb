# frozen_string_literal: true

class Post < ApplicationRecord
  # Validations
  validates :title, presence: true, length: { minimum: 5, maximum: 200 }
  validates :content, presence: true
  validates :body, presence: true
  validates :user_id, presence: true

  # Associations
  belongs_to :user
  has_many :comments, dependent: :destroy

  # Scopes
  scope :published, -> { where(published: true) }
  scope :draft, -> { where(published: false) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }

  # Instance methods
  def publish!
    update!(published: true, published_at: Time.current)
  end

  def unpublish!
    update!(published: false, published_at: nil)
  end

  def published?
    published == true
  end

  def draft?
    !published?
  end
end