# frozen_string_literal: true

class ApplicationController < ActionController::API
  # Common error handling
  rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
  rescue_from ActiveRecord::RecordInvalid, with: :record_invalid
  rescue_from StandardError, with: :internal_error

  private

  def record_not_found(exception)
    render json: { error: "Record not found", message: exception.message }, status: :not_found
  end

  def record_invalid(exception)
    render json: { error: "Validation failed", errors: exception.record.errors.full_messages }, status: :unprocessable_entity
  end

  def internal_error(exception)
    Rails.logger.error "Internal error: #{exception.message}"
    render json: { error: "Internal server error" }, status: :internal_server_error
  end

  def render_success(data, status: :ok)
    render json: { data: data }, status: status
  end

  def render_error(message, status: :bad_request)
    render json: { error: message }, status: status
  end
end