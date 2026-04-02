module Types
  class DeleteCommentPayload < BaseObject
    field :deleted_comment_id, ID, null: true
    field :success, Boolean, null: false
    field :errors, [String], null: false
  end
end
