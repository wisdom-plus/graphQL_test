"use client";

import { useEffect, useEffectEvent, useState, useTransition } from "react";

import styles from "./graphql-console.module.css";

const PRESETS = [
  {
    label: "Hello",
    query: "query Hello {\n  hello\n}",
  },
  {
    label: "Schema",
    query:
      "query SchemaCheck {\n  __schema {\n    queryType {\n      name\n    }\n  }\n}",
  },
] as const;

type Phase = "idle" | "loading" | "success" | "error";

type RequestResult = {
  ok: boolean;
  payload: string;
  status: number;
  latencyMs: number;
};

async function requestGraphql(query: string): Promise<RequestResult> {
  const startedAt = performance.now();

  const response = await fetch("/api/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query }),
  });

  const rawBody = await response.text();

  let payload = rawBody;

  try {
    payload = JSON.stringify(JSON.parse(rawBody), null, 2);
  } catch {
    // Preserve plain-text errors as-is.
  }

  return {
    ok: response.ok,
    payload,
    status: response.status,
    latencyMs: Math.round(performance.now() - startedAt),
  };
}

function lineCount(value: string) {
  return value.split("\n").length;
}

export default function GraphqlConsole() {
  const [query, setQuery] = useState<string>(PRESETS[0].query);
  const [responseBody, setResponseBody] = useState<string>(
    '{\n  "hint": "Run a preset or edit the query and press Cmd/Ctrl + Enter."\n}',
  );
  const [phase, setPhase] = useState<Phase>("idle");
  const [meta, setMeta] = useState<string>("Ready to talk to Rails GraphQL");
  const [lastRun, setLastRun] = useState<string>("not yet");
  const [isPending, startTransition] = useTransition();

  async function executeQuery(nextQuery: string) {
    setPhase("loading");
    setMeta("Proxying request through Next.js");

    try {
      const result = await requestGraphql(nextQuery);

      startTransition(() => {
        setResponseBody(result.payload);
        setPhase(result.ok ? "success" : "error");
        setMeta(`HTTP ${result.status} in ${result.latencyMs} ms`);
        setLastRun(new Date().toLocaleTimeString());
      });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown request failure";

      startTransition(() => {
        setResponseBody(
          JSON.stringify({ errors: [{ message }] }, null, 2),
        );
        setPhase("error");
        setMeta("Request failed before Rails responded");
        setLastRun(new Date().toLocaleTimeString());
      });
    }
  }

  const bootConsole = useEffectEvent(async () => {
    await executeQuery(PRESETS[0].query);
  });

  useEffect(() => {
    void bootConsole();
  }, []);

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
