# frozen_string_literal: true

Rails.application.routes.draw do
  # API namespace for versioned endpoints
  namespace :api do
    resources :users, only: %i[index show create update destroy]

    resources :posts, only: %i[index show create update destroy] do
      resources :comments, only: %i[index show create update destroy]
    end
  end

  # Health check endpoint
  get "/health", to: "health#show"
end