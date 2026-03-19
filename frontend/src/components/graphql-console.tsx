"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";

import styles from "./graphql-console.module.css";

const PRESETS = [
  {
    label: "Hello",
    query: "query Hello {\n  hello\n}",
  },
  {
    label: "Book 1",
    query:
      'query BookOne {\n  book(id: "1") {\n    id\n    title\n    author\n    isbn\n    publishedDate\n    description\n  }\n}',
  },
  {
    label: "Book 1 + Comments",
    query:
      'query BookOneWithComments {\n  book(id: "1") {\n    id\n    title\n    author\n    isbn\n    publishedDate\n    description\n    comments {\n      id\n      content\n      createdAt\n    }\n  }\n}',
  },
  {
    label: "Schema",
    query:
      "query SchemaCheck {\n  __schema {\n    queryType {\n      name\n    }\n  }\n}",
  },
] as const;

const CREATE_BOOK_MUTATION = [
  "mutation CreateBook($input: BookInputType!) {",
  "  createBook(book: $input) {",
  "    id",
  "    title",
  "    author",
  "    isbn",
  "    publishedDate",
  "    description",
  "  }",
  "}",
].join("\n");

type Phase = "idle" | "loading" | "success" | "error";

type GraphqlRequest = {
  query: string;
  variables?: Record<string, unknown>;
};

type RequestResult = {
  ok: boolean;
  payload: string;
  parsed: unknown | null;
  status: number;
  latencyMs: number;
};

async function requestGraphql({
  query,
  variables,
}: GraphqlRequest): Promise<RequestResult> {
  const startedAt = performance.now();

  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const rawBody = await response.text();

  let payload = rawBody;
  let parsed: unknown | null = null;

  try {
    parsed = JSON.parse(rawBody);
    payload = JSON.stringify(parsed, null, 2);
  } catch {
    // Preserve plain-text errors as-is.
  }

  return {
    ok: response.ok,
    payload,
    parsed,
    status: response.status,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

type BookCard = {
  id: string;
  title?: string | null;
  author?: string | null;
  isbn?: string | null;
  publishedDate?: string | null;
  description?: string | null;
};

type CommentCard = {
  id: string;
  content: string;
  createdAt?: string | null;
};

type BookWithCommentsCard = BookCard & {
  comments: CommentCard[];
};

type BookDraft = {
  title: string;
  author: string;
  isbn: string;
  publishedDate: string;
  description: string;
};

const EMPTY_BOOK_DRAFT: BookDraft = {
  title: "",
  author: "",
  isbn: "",
  publishedDate: "",
  description: "",
};

function readOptionalString(source: object, key: string): string | null {
  const value = Reflect.get(source, key);
  return typeof value === "string" ? value : null;
}

function readDataField(payload: unknown, key: string): object | null {
  if (typeof payload !== "object" || payload === null) {
    return null;
  }

  const data = Reflect.get(payload, "data");

  if (typeof data !== "object" || data === null) {
    return null;
  }

  const field = Reflect.get(data, key);

  if (typeof field !== "object" || field === null) {
    return null;
  }

  return field;
}

function extractBookFromField(payload: unknown, key: string): BookCard | null {
  const book = readDataField(payload, key);

  if (!book) {
    return null;
  }

  const id = Reflect.get(book, "id");

  if (typeof id !== "string") {
    return null;
  }

  return {
    id,
    title: readOptionalString(book, "title"),
    author: readOptionalString(book, "author"),
    isbn: readOptionalString(book, "isbn"),
    publishedDate: readOptionalString(book, "publishedDate"),
    description: readOptionalString(book, "description"),
  };
}

function extractBook(payload: unknown): BookCard | null {
  return extractBookFromField(payload, "book");
}

function extractCreatedBook(payload: unknown): BookCard | null {
  return extractBookFromField(payload, "createBook");
}

function extractBookWithComments(
  payload: unknown,
): BookWithCommentsCard | null {
  const book = extractBook(payload);

  if (!book) {
    return null;
  }

  const bookNode = readDataField(payload, "book");

  if (!bookNode) {
    return null;
  }

  const comments = Reflect.get(bookNode, "comments");

  if (!Array.isArray(comments)) {
    return null;
  }

  return {
    ...book,
    comments: comments
      .filter((comment): comment is object => {
        return typeof comment === "object" && comment !== null;
      })
      .flatMap((comment) => {
        const id = Reflect.get(comment, "id");
        const content = Reflect.get(comment, "content");

        if (typeof id !== "string" || typeof content !== "string") {
          return [];
        }

        return [
          {
            id,
            content,
            createdAt: readOptionalString(comment, "createdAt"),
          },
        ];
      }),
  };
}

function hasGraphqlErrors(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const errors = Reflect.get(payload, "errors");
  return Array.isArray(errors) && errors.length > 0;
}

function buildClientErrorPayload(message: string) {
  return JSON.stringify({ errors: [{ message }] }, null, 2);
}

function buildBookQuery(id: string) {
  return [
    "query BookLookup {",
    `  book(id: "${id}") {`,
    "    id",
    "    title",
    "    author",
    "    isbn",
    "    publishedDate",
    "    description",
    "  }",
    "}",
  ].join("\n");
}

function buildBookWithCommentsQuery(id: string) {
  return [
    "query BookWithCommentsLookup {",
    `  book(id: "${id}") {`,
    "    id",
    "    title",
    "    author",
    "    isbn",
    "    publishedDate",
    "    description",
    "    comments {",
    "      id",
    "      content",
    "      createdAt",
    "    }",
    "  }",
    "}",
  ].join("\n");
}

function lineCount(value: string) {
  return value.split("\n").length;
}

export default function GraphqlConsole() {
  const [query, setQuery] = useState<string>(PRESETS[0].query);
  const [responseBody, setResponseBody] = useState<string>(
    '{\n  "hint": "Run a preset, fetch a book, or submit the create form."\n}',
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [meta, setMeta] = useState<string>("Ready to talk to Rails GraphQL");
  const [lastRun, setLastRun] = useState<string>("not yet");
  const [bookId, setBookId] = useState<string>("1");
  const [bookWithCommentsId, setBookWithCommentsId] = useState<string>("1");
  const [bookDraft, setBookDraft] = useState<BookDraft>(EMPTY_BOOK_DRAFT);
  const [selectedBook, setSelectedBook] = useState<BookCard | null>(null);
  const [selectedBookWithComments, setSelectedBookWithComments] =
    useState<BookWithCommentsCard | null>(null);
  const [isPending, startTransition] = useTransition();

  function setDraftField<Key extends keyof BookDraft>(
    key: Key,
    value: BookDraft[Key],
  ) {
    setBookDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function showClientError(message: string) {
    setPhase("error");
    setMeta(message);
    setSelectedBook(null);
    setSelectedBookWithComments(null);
    setResponseBody(buildClientErrorPayload(message));
    setLastRun(new Date().toLocaleTimeString());
  }

  async function executeQuery(
    nextQuery: string,
    variables?: GraphqlRequest["variables"],
  ) {
    setPhase("loading");
    setMeta("Proxying request through Next.js");

    try {
      const result = await requestGraphql({ query: nextQuery, variables });
      const nextPhase =
        result.ok && !hasGraphqlErrors(result.parsed) ? "success" : "error";
      const nextBook =
        extractBook(result.parsed) ?? extractCreatedBook(result.parsed);

      startTransition(() => {
        setResponseBody(result.payload);
        setSelectedBook(nextBook);
        setSelectedBookWithComments(extractBookWithComments(result.parsed));
        setPhase(nextPhase);
        setMeta(
          hasGraphqlErrors(result.parsed)
            ? `GraphQL error via HTTP ${result.status} in ${result.latencyMs} ms`
            : `HTTP ${result.status} in ${result.latencyMs} ms`,
        );
        setLastRun(new Date().toLocaleTimeString());
      });

      return result;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown request failure";

      startTransition(() => {
        setResponseBody(buildClientErrorPayload(message));
        setSelectedBook(null);
        setSelectedBookWithComments(null);
        setPhase("error");
        setMeta("Request failed before Rails responded");
        setLastRun(new Date().toLocaleTimeString());
      });

      return null;
    }
  }

  const bootConsole = useEffectEvent(async () => {
    await executeQuery(PRESETS[0].query);
  });

  useEffect(() => {
    void bootConsole();
  }, []);

  async function createBookFromDraft() {
    const title = bookDraft.title.trim();
    const author = bookDraft.author.trim();
    const isbn = bookDraft.isbn.trim();
    const publishedDate = bookDraft.publishedDate.trim();
    const description = bookDraft.description.trim();

    if (title.length === 0 || author.length === 0) {
      showClientError("Title and author are required");
      return;
    }

    const variables = {
      input: {
        title,
        author,
        ...(isbn ? { isbn } : {}),
        ...(publishedDate ? { publishedDate } : {}),
        ...(description ? { description } : {}),
      },
    };

    setQuery(CREATE_BOOK_MUTATION);
    const result = await executeQuery(CREATE_BOOK_MUTATION, variables);
    const createdBook = result ? extractCreatedBook(result.parsed) : null;

    if (createdBook) {
      setBookId(createdBook.id);
      setBookWithCommentsId(createdBook.id);
    }
  }

  const statusLabel =
    phase === "idle"
      ? "Idle"
      : phase === "loading"
        ? "Loading"
        : phase === "success"
          ? "Healthy"
          : "Check response";

  return (
    <main className={styles.shell}>
      <section className={styles.hero}>
        <div className={styles.heroCopy}>
          <p className={styles.eyebrow}>NEXT.JS FRONTEND FOR RAILS GRAPHQL</p>
          <h1 className={styles.title}>GraphQL Flight Deck</h1>
          <p className={styles.lead}>
            Query the Rails endpoint from a deliberate frontend instead of a raw
            terminal. The browser talks to Next.js, and Next.js proxies every
            GraphQL request to Rails.
          </p>
        </div>
        <div className={styles.statusCard}>
          <span className={styles.statusLabel}>Status</span>
          <strong data-phase={phase} className={styles.statusValue}>
            {statusLabel}
          </strong>
          <span className={styles.statusMeta}>{meta}</span>
        </div>
      </section>

      <section className={styles.grid}>
        <article className={styles.console}>
          <header className={styles.panelHeader}>
            <div>
              <p className={styles.panelEyebrow}>Query Console</p>
              <h2>Craft a request</h2>
            </div>
            <div className={styles.metaChips}>
              <span>POST /api/graphql</span>
              <span>Rails target: /graphql</span>
            </div>
          </header>

          <div className={styles.presetRow}>
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                className={styles.presetButton}
                onClick={() => {
                  setQuery(preset.query);
                  void executeQuery(preset.query);
                }}
                type="button"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className={styles.lookupBox}>
            <div className={styles.lookupCopy}>
              <p className={styles.panelEyebrow}>Book Quick Fetch</p>
              <h3>Load a seeded book by id</h3>
              <p>Try ids between 1 and 100, which were generated by `db:seed`.</p>
            </div>
            <div className={styles.lookupControls}>
              <input
                className={styles.lookupInput}
                inputMode="numeric"
                min="1"
                onChange={(event) => setBookId(event.target.value)}
                value={bookId}
              />
              <button
                className={styles.lookupButton}
                onClick={() => {
                  const trimmedId = bookId.trim();

                  if (trimmedId.length === 0) {
                    showClientError("Book id is required");
                    return;
                  }

                  const nextQuery = buildBookQuery(trimmedId);
                  setQuery(nextQuery);
                  void executeQuery(nextQuery);
                }}
                type="button"
              >
                Fetch Book
              </button>
            </div>
          </div>

          <div className={styles.lookupBox}>
            <div className={styles.lookupCopy}>
              <p className={styles.panelEyebrow}>Book + Comments Fetch</p>
              <h3>Load a book together with its comments</h3>
              <p>
                This leaves the existing book-only fetch intact and issues a
                separate query that includes nested comments.
              </p>
            </div>
            <div className={styles.lookupControls}>
              <input
                className={styles.lookupInput}
                inputMode="numeric"
                min="1"
                onChange={(event) => setBookWithCommentsId(event.target.value)}
                value={bookWithCommentsId}
              />
              <button
                className={styles.lookupButton}
                onClick={() => {
                  const trimmedId = bookWithCommentsId.trim();

                  if (trimmedId.length === 0) {
                    showClientError("Book id is required");
                    return;
                  }

                  const nextQuery = buildBookWithCommentsQuery(trimmedId);
                  setQuery(nextQuery);
                  void executeQuery(nextQuery);
                }}
                type="button"
              >
                Fetch Book + Comments
              </button>
            </div>
          </div>

          <form
            className={`${styles.lookupBox} ${styles.createBox}`}
            onSubmit={(event) => {
              event.preventDefault();
              void createBookFromDraft();
            }}
          >
            <div className={styles.lookupCopy}>
              <p className={styles.panelEyebrow}>Create Book</p>
              <h3>Submit a mutation from the browser</h3>
              <p>
                Fill in the form and this screen will send{" "}
                <code>createBook(user: $input)</code> through the same Next.js
                proxy used by the query console.
              </p>
            </div>

            <div className={styles.createForm}>
              <div className={styles.createGrid}>
                <label className={styles.fieldGroup}>
                  <span>Title</span>
                  <input
                    className={styles.fieldInput}
                    onChange={(event) =>
                      setDraftField("title", event.target.value)
                    }
                    placeholder="The Shape of GraphQL"
                    value={bookDraft.title}
                  />
                </label>

                <label className={styles.fieldGroup}>
                  <span>Author</span>
                  <input
                    className={styles.fieldInput}
                    onChange={(event) =>
                      setDraftField("author", event.target.value)
                    }
                    placeholder="Codex"
                    value={bookDraft.author}
                  />
                </label>

                <label className={styles.fieldGroup}>
                  <span>ISBN</span>
                  <input
                    className={styles.fieldInput}
                    onChange={(event) =>
                      setDraftField("isbn", event.target.value)
                    }
                    placeholder="9781234567890"
                    value={bookDraft.isbn}
                  />
                </label>

                <label className={styles.fieldGroup}>
                  <span>Published Date</span>
                  <input
                    className={styles.fieldInput}
                    onChange={(event) =>
                      setDraftField("publishedDate", event.target.value)
                    }
                    type="date"
                    value={bookDraft.publishedDate}
                  />
                </label>

                <label className={`${styles.fieldGroup} ${styles.fieldWide}`}>
                  <span>Description</span>
                  <textarea
                    className={styles.fieldTextarea}
                    onChange={(event) =>
                      setDraftField("description", event.target.value)
                    }
                    placeholder="Short summary for the newly created book."
                    value={bookDraft.description}
                  />
                </label>
              </div>

              <div className={styles.createActionRow}>
                <p className={styles.createHint}>
                  Required fields: title, author
                </p>
                <button
                  className={styles.lookupButton}
                  disabled={phase === "loading"}
                  type="submit"
                >
                  {phase === "loading" || isPending
                    ? "Submitting..."
                    : "Create Book"}
                </button>
              </div>
            </div>
          </form>

          <label className={styles.editorLabel} htmlFor="graphql-query">
            GraphQL Query
          </label>
          <textarea
            className={styles.editor}
            id="graphql-query"
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                event.preventDefault();
                void executeQuery(query);
              }
            }}
            spellCheck={false}
            value={query}
          />

          <div className={styles.consoleFooter}>
            <div className={styles.metrics}>
              <span>{lineCount(query)} lines</span>
              <span>{query.length} chars</span>
              <span>Last run: {lastRun}</span>
            </div>
            <button
              className={styles.runButton}
              disabled={phase === "loading"}
              onClick={() => void executeQuery(query)}
              type="button"
            >
              {phase === "loading" || isPending ? "Running..." : "Run Query"}
            </button>
          </div>
        </article>

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
                Run the <strong>Book 1</strong> preset or use the quick fetch
                form. The create form also lands here after a successful
                mutation.
              </p>
            </section>
          )}

          {selectedBookWithComments ? (
            <section className={styles.commentCard}>
              <div className={styles.bookCardHeader}>
                <span className={styles.noteLabel}>Comments Preview</span>
                <strong>
                  {selectedBookWithComments.comments.length} comments
                </strong>
              </div>
              <h3>
                {selectedBookWithComments.title ?? "Book"} comments
              </h3>
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
                <p className={styles.commentEmpty}>
                  This book currently has no comments.
                </p>
              )}
            </section>
          ) : (
            <section className={styles.bookEmpty}>
              <span className={styles.noteLabel}>Comments Preview</span>
              <p>
                Run <strong>Book 1 + Comments</strong> or use the dedicated
                fetch form to load nested comments from Rails.
              </p>
            </section>
          )}

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
      </section>
    </main>
  );
}
