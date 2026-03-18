# frozen_string_literal: true

module Api
  class UsersController < ApplicationController
    before_action :set_user, only: %i[show update destroy]

    # GET /api/users
    def index
      @users = User.active.recent
      render_success @users
    end

    # GET /api/users/:id
    def show
      render_success @user
    end

    # POST /api/users
    def create
      @user = UserService.create_user(user_params)

      if @user.persisted?
        render_success @user, status: :created
      else
        render_error @user.errors.full_messages.join(", "), status: :unprocessable_entity
      end
    end

    # PATCH/PUT /api/users/:id
    def update
      if @user.update(user_params)
        render_success @user
      else
        render_error @user.errors.full_messages.join(", "), status: :unprocessable_entity
      end
    end

    # DELETE /api/users/:id
    def destroy
      @user.destroy
      head :no_content
    end

    private

    def set_user
      @user = User.find(params[:id])
    end

    def user_params
      params.require(:user).permit(:name, :email)
    end
  end
end