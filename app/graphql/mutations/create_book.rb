class Mutations::CreateBook < GraphQL::Schema::Mutation
  type Types::BookType

  argument :book, Types::BookInputType, required: true

  def resolve(book:)
    Book.create(book.to_h)
  end
end
