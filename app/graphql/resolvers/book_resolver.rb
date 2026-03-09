module Resolvers
  class BookResolver < BaseResolver
    type Types::BookType, null: true
    argument :id, ID

    def resolve(id:)
      Book.find_by(id: id)
    end
  end
end
