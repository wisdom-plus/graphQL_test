export const PRESETS = [
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

export const CREATE_BOOK_MUTATION = [
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

export const CREATE_COMMENT_MUTATION = [
  "mutation CreateComment($input: CommentInputType!) {",
  "  createComment(comment: $input) {",
  "    id",
  "    content",
  "    createdAt",
  "    updatedAt",
  "  }",
  "}",
].join("\n");

export const DELETE_COMMENT_MUTATION = [
  "mutation DeleteComment($commentId: ID!) {",
  "  deleteComment(commentId: $commentId) {",
  "    deletedCommentId",
  "    success",
  "    errors",
  "  }",
  "}",
].join("\n");

export type Phase = "idle" | "loading" | "success" | "error";

export type GraphqlRequest = {
  query: string;
  variables?: Record<string, unknown>;
};

export type RequestResult = {
  ok: boolean;
  payload: string;
  parsed: unknown | null;
  status: number;
  latencyMs: number;
};

export type BookCard = {
  id: string;
  title?: string | null;
  author?: string | null;
  isbn?: string | null;
  publishedDate?: string | null;
  description?: string | null;
};

export type CommentCard = {
  id: string;
  content: string;
  createdAt?: string | null;
};

export type BookWithCommentsCard = BookCard & {
  comments: CommentCard[];
};

export type BookDraft = {
  title: string;
  author: string;
  isbn: string;
  publishedDate: string;
  description: string;
};

export type CommentDraft = {
  bookId: string;
  content: string;
};

export type DeleteCommentDraft = {
  commentId: string;
};

export type CreatedCommentCard = {
  id: string;
  content: string;
  createdAt?: string | null;
  updatedAt?: string | null;
};

export type DeletedCommentCard = {
  deletedCommentId?: string | null;
  success: boolean;
  errors: string[];
};

export const EMPTY_BOOK_DRAFT: BookDraft = {
  title: "",
  author: "",
  isbn: "",
  publishedDate: "",
  description: "",
};

export const EMPTY_COMMENT_DRAFT: CommentDraft = {
  bookId: "1",
  content: "",
};

export const EMPTY_DELETE_COMMENT_DRAFT: DeleteCommentDraft = {
  commentId: "",
};

export async function requestGraphql({
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

export function extractBook(payload: unknown): BookCard | null {
  return extractBookFromField(payload, "book");
}

export function extractCreatedBook(payload: unknown): BookCard | null {
  return extractBookFromField(payload, "createBook");
}

export function extractCreatedComment(
  payload: unknown,
): CreatedCommentCard | null {
  const comment = readDataField(payload, "createComment");

  if (!comment) {
    return null;
  }

  const id = Reflect.get(comment, "id");
  const content = Reflect.get(comment, "content");

  if (typeof id !== "string" || typeof content !== "string") {
    return null;
  }

  return {
    id,
    content,
    createdAt: readOptionalString(comment, "createdAt"),
    updatedAt: readOptionalString(comment, "updatedAt"),
  };
}

export function extractDeletedComment(
  payload: unknown,
): DeletedCommentCard | null {
  const result = readDataField(payload, "deleteComment");

  if (!result) {
    return null;
  }

  const success = Reflect.get(result, "success");
  const errors = Reflect.get(result, "errors");

  if (typeof success !== "boolean" || !Array.isArray(errors)) {
    return null;
  }

  return {
    deletedCommentId: readOptionalString(result, "deletedCommentId"),
    success,
    errors: errors.filter((error): error is string => typeof error === "string"),
  };
}

export function extractBookWithComments(
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

export function hasGraphqlErrors(payload: unknown) {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  const errors = Reflect.get(payload, "errors");
  return Array.isArray(errors) && errors.length > 0;
}

export function buildClientErrorPayload(message: string) {
  return JSON.stringify({ errors: [{ message }] }, null, 2);
}

export function buildBookQuery(id: string) {
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

export function buildBookWithCommentsQuery(id: string) {
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

export function lineCount(value: string) {
  return value.split("\n").length;
}
