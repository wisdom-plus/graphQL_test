module Types
  class QueryType < BaseObject
    field :hello, String, null: false,
                          description: 'Simple field to verify that GraphQL is working'

    field :book, resolver: Resolvers::BookResolver
    def hello
      'Hello from Rails GraphQL'
    end
  end
end
