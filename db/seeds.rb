BOOK_COUNT = 100

TITLE_PREFIXES = %w[
  Silent
  Hidden
  Electric
  Golden
  Broken
  Scarlet
  Velvet
  Lunar
  Coastal
  Midnight
].freeze

TITLE_SUBJECTS = %w[
  Atlas
  Harbor
  Library
  Circuit
  Archive
  Engine
  Garden
  Signal
  Lantern
  Current
].freeze

AUTHOR_FIRST_NAMES = %w[
  Mina
  Haru
  Ren
  Sora
  Emi
  Kaito
  Akira
  Yuna
  Leo
  Mei
].freeze

AUTHOR_LAST_NAMES = %w[
  Aoki
  Sato
  Nakamura
  Hayashi
  Takeda
  Okada
  Hoshino
  Fujita
  Kojima
  Kuroda
].freeze

DESCRIPTION_FRAGMENTS = [
  "A practical introduction to an imaginary topic with enough detail to browse a UI list.",
  "Written as sample content for GraphQL and frontend experiments.",
  "Useful when you want realistic-looking development data without external dependencies.",
  "Structured to be deterministic so the same seed can be executed repeatedly.",
  "Contains enough variation to make filtering and pagination tests feel more natural.",
].freeze

COMMENT_OPENERS = [
  "Great overview.",
  "I want a sequel to this one.",
  "Helpful notes for a weekend read.",
  "The examples were easier than expected.",
  "This would look good in a demo list.",
  "Strong sample record for testing.",
].freeze

Comment.transaction do
  BOOK_COUNT.times do |index|
    book_number = index + 1

    title = [
      TITLE_PREFIXES[index % TITLE_PREFIXES.length],
      TITLE_SUBJECTS[(index * 3) % TITLE_SUBJECTS.length],
    ].join(" ")

    author = [
      AUTHOR_FIRST_NAMES[(index * 2) % AUTHOR_FIRST_NAMES.length],
      AUTHOR_LAST_NAMES[(index * 5) % AUTHOR_LAST_NAMES.length],
    ].join(" ")

    book = Book.find_or_initialize_by(isbn: format("SEED-BOOK-%03d", book_number))
    book.assign_attributes(
      title: "#{title} #{book_number}",
      author: author,
      published_date: Date.new(2016, 1, 1) + (index * 11),
      description: [
        DESCRIPTION_FRAGMENTS[index % DESCRIPTION_FRAGMENTS.length],
        "Sample book ##{book_number} for the Rails + Next.js demo environment.",
      ].join(" "),
    )
    book.save!

    book.comments.delete_all

    (1 + (index % 4)).times do |comment_index|
      opener = COMMENT_OPENERS[(index + comment_index) % COMMENT_OPENERS.length]
      suffix = DESCRIPTION_FRAGMENTS[(index + comment_index + 1) % DESCRIPTION_FRAGMENTS.length]

      book.comments.create!(
        content: "#{opener} #{suffix} (sample #{book_number}-#{comment_index + 1})",
      )
    end
  end
end

puts "Seeded #{Book.count} books and #{Comment.count} comments."
