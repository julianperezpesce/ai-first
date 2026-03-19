# frozen_string_literal: true

require_relative "environment"

module RailsApp
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version
    config.load_defaults 7.1

    # Configuration for the application, engines, and railties goes here.
    #
    # These settings can be overridden in specific environments using the files
    # in config/environments, which are processed later.
    #
    # config.time_zone = "Central Time (US & Canada)"
    # config.eager_load_paths << Rails.root.join("extras")

    # Only loads a smaller set of middleware suitable for API only apps
    config.api_only = true

    # Enable service objects directory
    config.autoload_paths << Rails.root.join("app/services")

    # Enable Zeitwerk autoloading
    config.autoloader = :zeitwerk
  end
end