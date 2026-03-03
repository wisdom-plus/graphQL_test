# syntax = docker/dockerfile:1

ARG RUBY_VERSION=3.2.2
FROM registry.docker.com/library/ruby:${RUBY_VERSION}-slim

WORKDIR /rails

ENV BUNDLE_PATH=/usr/local/bundle \
    BUNDLE_JOBS=4 \
    BUNDLE_RETRY=3

RUN apt-get update -qq && \
    apt-get install --no-install-recommends -y build-essential git libpq-dev postgresql-client && \
    rm -rf /var/lib/apt/lists /var/cache/apt/archives

COPY . .

RUN bundle install

ENTRYPOINT ["/rails/bin/docker-entrypoint"]

EXPOSE 3000
CMD ["./bin/rails", "server", "-b", "0.0.0.0", "-p", "3000"]
