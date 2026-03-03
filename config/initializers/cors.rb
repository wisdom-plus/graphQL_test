if Rails.env.development?
  allowed_origins = ENV.fetch("CORS_ALLOWED_ORIGINS", "*").split(",")

  Rails.application.config.middleware.insert_before 0, Rack::Cors do
    allow do
      origins(*allowed_origins)

      resource "/graphql",
        headers: :any,
        methods: %i[post options]
    end
  end
end
