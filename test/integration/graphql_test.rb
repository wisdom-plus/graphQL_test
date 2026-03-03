require "test_helper"

class GraphqlTest < ActionDispatch::IntegrationTest
  test "returns hello from graphql endpoint" do
    post graphql_path, params: { query: "{ hello }" }, as: :json

    assert_response :success
    assert_equal "Hello from Rails GraphQL", response.parsed_body.dig("data", "hello")
  end
end
