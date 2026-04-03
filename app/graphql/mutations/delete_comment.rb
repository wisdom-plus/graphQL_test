class Mutations::DeleteComment < GraphQL::Schema::Mutation
  type Types::DeleteCommentPayload

  argument :comment_id, ID, required: true

  def resolve(comment_id:)
    comment = Comment.find_by(id: comment_id)
    { deleted_comment_id: nil, success: false, errors: ['comment not found'] } if comment.blank?

    if comment.destroy
      { deleted_comment_id: comment_id, success: true, errors: [] }
    else
      { deleted_comment_id: nil, success: false, errors: comment.errors.full_messages }
    end
  end
end
