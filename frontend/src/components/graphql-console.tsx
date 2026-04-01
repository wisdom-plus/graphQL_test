"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";

import {
  CreateBookForm,
  CreateCommentForm,
  DeleteCommentForm,
  LookupBox,
  PresetRow,
} from "./graphql-console-controls";
import {
  buildBookQuery,
  buildBookWithCommentsQuery,
  buildClientErrorPayload,
  CREATE_BOOK_MUTATION,
  CREATE_COMMENT_MUTATION,
  DELETE_COMMENT_MUTATION,
  EMPTY_BOOK_DRAFT,
  EMPTY_COMMENT_DRAFT,
  EMPTY_DELETE_COMMENT_DRAFT,
  extractBook,
  extractBookWithComments,
  extractCreatedBook,
  extractCreatedComment,
  extractDeletedComment,
  hasGraphqlErrors,
  lineCount,
  PRESETS,
  requestGraphql,
  type BookCard,
  type BookDraft,
  type BookWithCommentsCard,
  type CommentDraft,
  type CreatedCommentCard,
  type DeleteCommentDraft,
  type GraphqlRequest,
  type Phase,
} from "./graphql-console-data";
import { GraphqlConsoleOutput } from "./graphql-console-output";
import styles from "./graphql-console.module.css";

export default function GraphqlConsole() {
  const [query, setQuery] = useState<string>(PRESETS[0].query);
  const [responseBody, setResponseBody] = useState<string>(
    '{\n  "hint": "Run a preset, fetch a book, or submit one of the create forms."\n}',
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [meta, setMeta] = useState<string>("Ready to talk to Rails GraphQL");
  const [lastRun, setLastRun] = useState<string>("not yet");
  const [bookId, setBookId] = useState<string>("1");
  const [bookWithCommentsId, setBookWithCommentsId] = useState<string>("1");
  const [bookDraft, setBookDraft] = useState<BookDraft>(EMPTY_BOOK_DRAFT);
  const [commentDraft, setCommentDraft] =
    useState<CommentDraft>(EMPTY_COMMENT_DRAFT);
  const [deleteCommentDraft, setDeleteCommentDraft] =
    useState<DeleteCommentDraft>(EMPTY_DELETE_COMMENT_DRAFT);
  const [selectedBook, setSelectedBook] = useState<BookCard | null>(null);
  const [selectedBookWithComments, setSelectedBookWithComments] =
    useState<BookWithCommentsCard | null>(null);
  const [createdComment, setCreatedComment] =
    useState<CreatedCommentCard | null>(null);
  const [deletedComment, setDeletedComment] =
    useState<CreatedCommentCard | null>(null);
  const [isPending, startTransition] = useTransition();

  function setBookDraftField<Key extends keyof BookDraft>(
    key: Key,
    value: BookDraft[Key],
  ) {
    setBookDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setCommentField<Key extends keyof CommentDraft>(
    key: Key,
    value: CommentDraft[Key],
  ) {
    setCommentDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function setDeleteCommentField<Key extends keyof DeleteCommentDraft>(
    key: Key,
    value: DeleteCommentDraft[Key],
  ) {
    setDeleteCommentDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  function showClientError(message: string) {
    setPhase("error");
    setMeta(message);
    setSelectedBook(null);
    setSelectedBookWithComments(null);
    setCreatedComment(null);
    setDeletedComment(null);
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
      const nextComment = extractCreatedComment(result.parsed);
      const nextDeletedComment = extractDeletedComment(result.parsed);

      startTransition(() => {
        setResponseBody(result.payload);
        setSelectedBook(nextBook);
        setSelectedBookWithComments(extractBookWithComments(result.parsed));
        setCreatedComment(nextComment);
        setDeletedComment(nextDeletedComment);
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
        setCreatedComment(null);
        setDeletedComment(null);
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

  function runBookLookup(nextBookId: string) {
    const trimmedId = nextBookId.trim();

    if (trimmedId.length === 0) {
      showClientError("Book id is required");
      return;
    }

    const nextQuery = buildBookQuery(trimmedId);
    setQuery(nextQuery);
    void executeQuery(nextQuery);
  }

  function runBookWithCommentsLookup(nextBookId: string) {
    const trimmedId = nextBookId.trim();

    if (trimmedId.length === 0) {
      showClientError("Book id is required");
      return;
    }

    const nextQuery = buildBookWithCommentsQuery(trimmedId);
    setQuery(nextQuery);
    void executeQuery(nextQuery);
  }

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
      setCommentField("bookId", createdBook.id);
    }
  }

  async function createCommentFromDraft() {
    const bookIdValue = commentDraft.bookId.trim();
    const content = commentDraft.content.trim();

    if (bookIdValue.length === 0 || content.length === 0) {
      showClientError("Book id and comment content are required");
      return;
    }

    const variables = {
      input: {
        bookId: bookIdValue,
        content,
      },
    };

    setQuery(CREATE_COMMENT_MUTATION);
    const result = await executeQuery(CREATE_COMMENT_MUTATION, variables);
    const comment = result ? extractCreatedComment(result.parsed) : null;

    if (comment) {
      setBookId(bookIdValue);
      setBookWithCommentsId(bookIdValue);
      setDeleteCommentField("commentId", comment.id);
      setCommentDraft((current) => ({
        ...current,
        bookId: bookIdValue,
        content: "",
      }));
    }
  }

  async function deleteCommentFromDraft() {
    const commentIdValue = deleteCommentDraft.commentId.trim();

    if (commentIdValue.length === 0) {
      showClientError("Comment id is required");
      return;
    }

    const variables = {
      commentId: commentIdValue,
    };

    setQuery(DELETE_COMMENT_MUTATION);
    const result = await executeQuery(DELETE_COMMENT_MUTATION, variables);
    const deleted = result ? extractDeletedComment(result.parsed) : null;

    if (deleted) {
      setDeleteCommentDraft({ commentId: "" });
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

          <PresetRow
            presets={PRESETS}
            onSelectPreset={(presetQuery) => {
              setQuery(presetQuery);
              void executeQuery(presetQuery);
            }}
          />

          <LookupBox
            title="Book Quick Fetch"
            heading="Load a seeded book by id"
            description="Try ids between 1 and 100, which were generated by `db:seed`."
            value={bookId}
            buttonLabel="Fetch Book"
            onChange={setBookId}
            onSubmit={() => runBookLookup(bookId)}
          />

          <LookupBox
            title="Book + Comments Fetch"
            heading="Load a book together with its comments"
            description="This leaves the existing book-only fetch intact and issues a separate query that includes nested comments."
            value={bookWithCommentsId}
            buttonLabel="Fetch Book + Comments"
            onChange={setBookWithCommentsId}
            onSubmit={() => runBookWithCommentsLookup(bookWithCommentsId)}
          />

          <CreateBookForm
            bookDraft={bookDraft}
            isLoading={phase === "loading" || isPending}
            onSubmit={() => void createBookFromDraft()}
            onChange={setBookDraftField}
          />

          <CreateCommentForm
            commentDraft={commentDraft}
            isLoading={phase === "loading" || isPending}
            onSubmit={() => void createCommentFromDraft()}
            onChange={setCommentField}
          />

          <DeleteCommentForm
            deleteCommentDraft={deleteCommentDraft}
            isLoading={phase === "loading" || isPending}
            onSubmit={() => void deleteCommentFromDraft()}
            onChange={setDeleteCommentField}
          />

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

        <GraphqlConsoleOutput
          createdComment={createdComment}
          deletedComment={deletedComment}
          phase={phase}
          responseBody={responseBody}
          selectedBook={selectedBook}
          selectedBookWithComments={selectedBookWithComments}
        />
      </section>
    </main>
  );
}
