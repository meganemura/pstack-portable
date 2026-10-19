# pstack-portable

> [!IMPORTANT]
> このリポジトリはアーカイブ済みで、メンテナンスを終了しました。
> 今後、更新、upstream の同期、修正はしません。
> 最後のリリースは `v0.4.5` で、upstream の pstack は対応するコミットに固定されています。
> 入れてある環境はそのリリースのまま動きますが、upstream の新しい変更は入りません。

upstream の [pstack](https://github.com/cursor/plugins/tree/main/pstack) を Claude Code と Codex で動かします。
ワークフローは upstream が持ちます。
このリポジトリが足すのは wrapper skill の `poteto-mode-portable` 1 つで、Cursor のツールを今のホストのツールに置き換えます。
upstream で `/poteto-mode` を使う場面で使います。

## 入れる

このリポジトリは、plugin を 2 つ持つ plugin marketplace です。
`pstack-portable` が wrapper です。
`pstack` は upstream の pstack を手を加えずに、wrapper が対応するコミットに固定したものです。
wrapper は `pstack` の plugin のファイルを読むので、`pstack` は入れたまま無効にしておきます。

Claude Code は `pstack` を無効の状態で入れます。

```sh
claude plugin marketplace add meganemura/pstack-portable
claude plugin install pstack-portable@pstack-portable
claude plugin install pstack@pstack-portable
```

Codex:

```sh
codex plugin marketplace add meganemura/pstack-portable
codex plugin add pstack-portable@pstack-portable
codex plugin add pstack@pstack-portable
```

そのあと `~/.codex/config.toml` の `[plugins."pstack@pstack-portable"]` に `enabled = false` を書きます。

以前に `poteto-mode-portable` をリンクやコピーで入れていたら、`~/.agents/skills` と `~/.claude/skills` から外します。

### 更新する

- Claude Code: `claude plugin marketplace update pstack-portable` のあと、plugin ごとに `claude plugin update` を実行します。
- Codex: `codex plugin marketplace upgrade pstack-portable` を実行します。

各リリースには `v<version>` のタグが付きます。
1 つのリリースに留めるときは、marketplace をタグで追加します。
Claude Code では `meganemura/pstack-portable#v<version>`、Codex では `--ref v<version>` です。

### その他の入れ方

Cursor は upstream の pstack をそのまま動かせるので、wrapper は要りません。
`.cursor-plugin/` にある wrapper の定義は試していません。
plugin ではなく clone から入れるときは、[Install from local checkouts](docs/install-local.md) に従います。

## 使う

pstack のワークフローは wrapper を通して頼みます。

```text
Use poteto-mode-portable to fix this bug.
Use poteto-mode-portable to interrogate this diff.
Use poteto-mode-portable to tdd this fix.
```

スラッシュコマンドで呼ぶときの名前は `/pstack-portable:poteto-mode-portable` です。

モデルの設定はホストごとに分かれています。
各ホストで `Use poteto-mode-portable to configure pstack.` と頼みます。
設定は、1 つのプロジェクトなら `.pstack/models/<host>.md` に、全プロジェクトなら `~/.agents/pstack/models/<host>.md` に書かれます。
`<host>` は `claude-code` か `codex` です。
プロジェクトのファイルが優先されます。

## できないこと

wrapper が仕事を渡す先は、今のホストの subagent だけです。
別のエージェントアプリケーションやプロバイダの CLI は起動しません。
hook、Cursor Automations、クラウドのワーカー、永続的なスケジュールは提供しません。
知らない upstream のスクリプトや変わったスクリプトは止め、実行の前にスクリプトの前提を確かめます。
ホストに無い機能をワークフローが必要とするときは、代わりの結果を出さずに、足りないことを報告します。

## ライセンス

wrapper は [MIT ライセンス](LICENSE)です。
upstream の pstack の帰属表示と MIT ライセンスは [NOTICE.md](NOTICE.md) と [LICENSE-pstack](LICENSE-pstack) にあります。
