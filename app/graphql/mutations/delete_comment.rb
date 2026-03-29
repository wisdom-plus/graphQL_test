class Mutations::DeleteComment < GraphQL::Schema::Mutation
  type Types::CommentType

  argument :comment_id, ID, required: true

  def resolve(comment_id:)
    comment = Comment.find(comment_id)
    return comment if comment.destroy

    nil
  end
end
