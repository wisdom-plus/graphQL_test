require "test_helper"

class GraphqlTest < ActionDispatch::IntegrationTest
  test "returns hello from graphql endpoint" do
    post graphql_path, params: { query: "{ hello }" }, as: :json

    assert_response :success
    assert_equal "Hello from Rails GraphQL", response.parsed_body.dig("data", "hello")
  end

  test "creates a book from graphql mutation" do
    assert_difference("Book.count", 1) do
      post graphql_path,
           params: {
             query: <<~GRAPHQL,
               mutation CreateBook($input: BookInputType!) {
                 createBook(user: $input) {
                   id
                   title
                   author
                   isbn
                   publishedDate
                   description
                 }
               }
             GRAPHQL
             variables: {
               input: {
                 title: "Frontend Mutation Book",
                 author: "Codex",
                 isbn: "9781234567890",
                 publishedDate: "2026-03-29",
                 description: "Created through GraphQL mutation."
               }
             }
           },
           as: :json
    end

    assert_response :success
    created_book = response.parsed_body.dig("data", "createBook")

    assert_equal "Frontend Mutation Book", created_book["title"]
    assert_equal "Codex", created_book["author"]
    assert_equal "9781234567890", created_book["isbn"]
    assert_equal "2026-03-29", created_book["publishedDate"]
    assert_equal "Created through GraphQL mutation.", created_book["description"]
  end
end
