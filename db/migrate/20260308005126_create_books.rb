class CreateBooks < ActiveRecord::Migration[7.1]
  def change
    create_table :books do |t|
      t.string :title
      t.string :author
      t.string :isbn
      t.date :published_date
      t.text :description

      t.timestamps
    end
  end
end
