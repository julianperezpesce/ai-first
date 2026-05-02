# frozen_string_literal: true

class User < ApplicationRecord
  # Validations
  validates :name, presence: true, length: { minimum: 2, maximum: 100 }
  validates :email, presence: true, uniqueness: true, format: { with: URI::MailTo::EMAIL_REGEXP }

  # Associations
  has_many :posts, dependent: :destroy
  has_many :comments, dependent: :destroy

  # Scopes
  scope :active, -> { where(active: true) }
  scope :recent, -> { order(created_at: :desc) }

  # Instance methods
  def full_name
    name
  end

  def deactivate!
    update!(active: false)
  end

  def activate!
    update!(active: true)
  end
end