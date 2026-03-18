# frozen_string_literal: true

class Comment < ApplicationRecord
  # Validations
  validates :content, presence: true, length: { minimum: 1, maximum: 2000 }
  validates :post_id, presence: true
  validates :user_id, presence: true

  # Associations
  belongs_to :post
  belongs_to :user

  # Scopes
  scope :approved, -> { where(approved: true) }
  scope :pending, -> { where(approved: false) }
  scope :recent, -> { order(created_at: :desc) }

  # Instance methods
  def approve!
    update!(approved: true, approved_at: Time.current)
  end

  def reject!
    update!(approved: false, approved_at: nil)
  end

  def approved?
    approved == true
  end

  def pending?
    !approved?
  end
end