module Types
  class CommentInputType < Types::BaseInputObject
    graphql_name 'CommentInputType'
    description 'Attributes from creating or updating a comment'

    argument :content, String, required: true
    argument :book_id, ID, required: true
  end
end
