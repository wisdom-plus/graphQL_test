# Rails + GraphQL Docker Setup

GraphQLを試せる最小構成のRails APIアプリです。`docker compose` でRailsとPostgreSQLを起動できます。

## 起動

```bash
docker compose build
docker compose up
```

Railsは初回起動時に `db:prepare` を実行します。

## GraphQLの確認

別ターミナルで以下を実行してください。

```bash
curl http://localhost:3000/graphql \
  -H "Content-Type: application/json" \
  -d '{"query":"{ hello }"}'
```

期待されるレスポンス:

```json
{"data":{"hello":"Hello from Rails GraphQL"}}
```

## テスト

```bash
docker compose run --rm web bundle exec rails test
```

## 主なエンドポイント

- `POST /graphql`
- `GET /up`
