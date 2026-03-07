# Rails + GraphQL + Next.js Docker Setup

Rails API, PostgreSQL, Next.js frontendを `docker compose` でまとめて起動できます。

## 起動

```bash
docker compose up -d --build
```

## URL

- Rails GraphQL API: `http://localhost:3000/graphql`
- Rails health check: `http://localhost:3000/up`
- Next.js frontend: `http://localhost:3001`

## GraphQLの確認

APIを直接叩く場合:

```bash
curl http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

フロントを使う場合は `http://localhost:3001` を開くと、ブラウザ上でクエリ実行とレスポンス確認ができます。

## テスト

```bash
docker compose run --rm web bundle exec rails test
cd frontend && npm run lint
```

## 停止

```bash
docker compose down
```
