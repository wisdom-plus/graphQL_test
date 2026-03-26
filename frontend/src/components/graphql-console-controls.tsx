import styles from "./graphql-console.module.css";
import type { BookDraft, CommentDraft } from "./graphql-console-data";

type Preset = {
  label: string;
  query: string;
};

type PresetRowProps = {
  presets: readonly Preset[];
  onSelectPreset: (query: string) => void;
};

export function PresetRow({ presets, onSelectPreset }: PresetRowProps) {
  return (
    <div className={styles.presetRow}>
      {presets.map((preset) => (
        <button
          key={preset.label}
          className={styles.presetButton}
          onClick={() => onSelectPreset(preset.query)}
          type="button"
        >
          {preset.label}
        </button>
      ))}
    </div>
  );
}

type LookupBoxProps = {
  title: string;
  heading: string;
  description: string;
  value: string;
  buttonLabel: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export function LookupBox({
  title,
  heading,
  description,
  value,
  buttonLabel,
  onChange,
  onSubmit,
}: LookupBoxProps) {
  return (
    <div className={styles.lookupBox}>
      <div className={styles.lookupCopy}>
        <p className={styles.panelEyebrow}>{title}</p>
        <h3>{heading}</h3>
        <p>{description}</p>
      </div>
      <div className={styles.lookupControls}>
        <input
          className={styles.lookupInput}
          inputMode="numeric"
          min="1"
          onChange={(event) => onChange(event.target.value)}
          value={value}
        />
        <button className={styles.lookupButton} onClick={onSubmit} type="button">
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

type CreateBookFormProps = {
  bookDraft: BookDraft;
  isLoading: boolean;
  onSubmit: () => void;
  onChange: <Key extends keyof BookDraft>(key: Key, value: BookDraft[Key]) => void;
};

export function CreateBookForm({
  bookDraft,
  isLoading,
  onSubmit,
  onChange,
}: CreateBookFormProps) {
  return (
    <form
      className={`${styles.lookupBox} ${styles.createBox}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.lookupCopy}>
        <p className={styles.panelEyebrow}>Create Book</p>
        <h3>Submit a mutation from the browser</h3>
        <p>
          Fill in the form and this screen will send{" "}
          <code>createBook(book: $input)</code> through the same Next.js proxy used
          by the query console.
        </p>
      </div>

      <div className={styles.createForm}>
        <div className={styles.createGrid}>
          <label className={styles.fieldGroup}>
            <span>Title</span>
            <input
              className={styles.fieldInput}
              onChange={(event) => onChange("title", event.target.value)}
              placeholder="The Shape of GraphQL"
              value={bookDraft.title}
            />
          </label>

          <label className={styles.fieldGroup}>
            <span>Author</span>
            <input
              className={styles.fieldInput}
              onChange={(event) => onChange("author", event.target.value)}
              placeholder="Codex"
              value={bookDraft.author}
            />
          </label>

          <label className={styles.fieldGroup}>
            <span>ISBN</span>
            <input
              className={styles.fieldInput}
              onChange={(event) => onChange("isbn", event.target.value)}
              placeholder="9781234567890"
              value={bookDraft.isbn}
            />
          </label>

          <label className={styles.fieldGroup}>
            <span>Published Date</span>
            <input
              className={styles.fieldInput}
              onChange={(event) => onChange("publishedDate", event.target.value)}
              type="date"
              value={bookDraft.publishedDate}
            />
          </label>

          <label className={`${styles.fieldGroup} ${styles.fieldWide}`}>
            <span>Description</span>
            <textarea
              className={styles.fieldTextarea}
              onChange={(event) => onChange("description", event.target.value)}
              placeholder="Short summary for the newly created book."
              value={bookDraft.description}
            />
          </label>
        </div>

        <div className={styles.createActionRow}>
          <p className={styles.createHint}>Required fields: title, author</p>
          <button className={styles.lookupButton} disabled={isLoading} type="submit">
            {isLoading ? "Submitting..." : "Create Book"}
          </button>
        </div>
      </div>
    </form>
  );
}

type CreateCommentFormProps = {
  commentDraft: CommentDraft;
  isLoading: boolean;
  onSubmit: () => void;
  onChange: <Key extends keyof CommentDraft>(
    key: Key,
    value: CommentDraft[Key],
  ) => void;
};

export function CreateCommentForm({
  commentDraft,
  isLoading,
  onSubmit,
  onChange,
}: CreateCommentFormProps) {
  return (
    <form
      className={`${styles.lookupBox} ${styles.createBox}`}
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className={styles.lookupCopy}>
        <p className={styles.panelEyebrow}>Create Comment</p>
        <h3>Attach a comment to a book from the browser</h3>
        <p>
          Submit <code>createComment(comment: $input)</code> with a target book id
          and comment body. Use the comments fetch card above to reload the nested
          list afterward.
        </p>
      </div>

      <div className={styles.createForm}>
        <div className={styles.createGrid}>
          <label className={styles.fieldGroup}>
            <span>Book ID</span>
            <input
              className={styles.fieldInput}
              inputMode="numeric"
              min="1"
              onChange={(event) => onChange("bookId", event.target.value)}
              placeholder="1"
              value={commentDraft.bookId}
            />
          </label>

          <label className={`${styles.fieldGroup} ${styles.fieldWide}`}>
            <span>Comment Content</span>
            <textarea
              className={styles.fieldTextarea}
              onChange={(event) => onChange("content", event.target.value)}
              placeholder="Write a comment for the selected book."
              value={commentDraft.content}
            />
          </label>
        </div>

        <div className={styles.createActionRow}>
          <p className={styles.createHint}>Required fields: book id, content</p>
          <button className={styles.lookupButton} disabled={isLoading} type="submit">
            {isLoading ? "Submitting..." : "Create Comment"}
          </button>
        </div>
      </div>
    </form>
  );
}
