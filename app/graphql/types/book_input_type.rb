module Types
  class BookInputType < Types::BaseInputObject
    graphql_name 'BookInputType'
    description 'Attributes for creating or updating a book'

    argument :title, String, required: true
    argument :author, String, required: true
    argument :isbn, String, required: false
    argument :published_date, GraphQL::Types::ISO8601Date, required: false
    argument :description, String, required: false
  end
end
