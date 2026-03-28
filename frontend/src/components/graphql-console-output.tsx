import styles from "./graphql-console.module.css";
import type {
  BookCard,
  BookWithCommentsCard,
  CreatedCommentCard,
  Phase,
} from "./graphql-console-data";

type GraphqlConsoleOutputProps = {
  createdComment: CreatedCommentCard | null;
  phase: Phase;
  responseBody: string;
  selectedBook: BookCard | null;
  selectedBookWithComments: BookWithCommentsCard | null;
};

export function GraphqlConsoleOutput({
  createdComment,
  phase,
  responseBody,
  selectedBook,
  selectedBookWithComments,
}: GraphqlConsoleOutputProps) {
  return (
    <aside className={styles.output}>
      <header className={styles.panelHeader}>
        <div>
          <p className={styles.panelEyebrow}>Response View</p>
          <h2>Inspect the payload</h2>
        </div>
        <div className={styles.metaChips}>
          <span>{phase}</span>
          <span>JSON</span>
        </div>
      </header>

      {selectedBook ? (
        <section className={styles.bookCard}>
          <div className={styles.bookCardHeader}>
            <span className={styles.noteLabel}>Selected Book</span>
            <strong>#{selectedBook.id}</strong>
          </div>
          <h3>{selectedBook.title ?? "Untitled book"}</h3>
          <dl className={styles.bookFacts}>
            <div>
              <dt>Author</dt>
              <dd>{selectedBook.author ?? "-"}</dd>
            </div>
            <div>
              <dt>ISBN</dt>
              <dd>{selectedBook.isbn ?? "-"}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{selectedBook.publishedDate ?? "-"}</dd>
            </div>
          </dl>
          <p>{selectedBook.description ?? "No description provided."}</p>
        </section>
      ) : (
        <section className={styles.bookEmpty}>
          <span className={styles.noteLabel}>Book Preview</span>
          <p>
            Run the <strong>Book 1</strong> preset or use the quick fetch form. The
            create form also lands here after a successful mutation.
          </p>
        </section>
      )}

      {selectedBookWithComments ? (
        <section className={styles.commentCard}>
          <div className={styles.bookCardHeader}>
            <span className={styles.noteLabel}>Comments Preview</span>
            <strong>{selectedBookWithComments.comments.length} comments</strong>
          </div>
          <h3>{selectedBookWithComments.title ?? "Book"} comments</h3>
          {selectedBookWithComments.comments.length > 0 ? (
            <ul className={styles.commentList}>
              {selectedBookWithComments.comments.map((comment) => (
                <li key={comment.id} className={styles.commentItem}>
                  <div className={styles.commentMeta}>
                    <span>Comment #{comment.id}</span>
                    <span>{comment.createdAt ?? "timestamp unavailable"}</span>
                  </div>
                  <p>{comment.content}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.commentEmpty}>This book currently has no comments.</p>
          )}
        </section>
      ) : (
        <section className={styles.bookEmpty}>
          <span className={styles.noteLabel}>Comments Preview</span>
          <p>
            Run <strong>Book 1 + Comments</strong> or use the dedicated fetch form
            to load nested comments from Rails.
          </p>
        </section>
      )}

      {createdComment ? (
        <section className={styles.commentCard}>
          <div className={styles.bookCardHeader}>
            <span className={styles.noteLabel}>Created Comment</span>
            <strong>#{createdComment.id}</strong>
          </div>
          <h3>Mutation result</h3>
          <p>{createdComment.content}</p>
          <div className={styles.commentMeta}>
            <span>{createdComment.createdAt ?? "timestamp unavailable"}</span>
            <span>{createdComment.updatedAt ?? "updatedAt unavailable"}</span>
          </div>
        </section>
      ) : null}

      <pre className={styles.response}>{responseBody}</pre>

      <div className={styles.notes}>
        <div>
          <span className={styles.noteLabel}>Flow</span>
          <p>{"Browser -> Next.js route handler -> Rails GraphQL"}</p>
        </div>
        <div>
          <span className={styles.noteLabel}>Shortcut</span>
          <p>Press Cmd/Ctrl + Enter to execute the current query.</p>
        </div>
      </div>
    </aside>
  );
}
