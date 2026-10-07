# pstack-portable

upstream の [pstack](https://github.com/cursor/plugins/tree/main/pstack) を Claude Code、Codex、Cursor で動かすための小さな実行アダプタです。
ワークフローは upstream が持ちます。このパッケージは 1 つの wrapper skill と、環境ごとの変換だけを持ちます。
wrapper skill の名前は `poteto-mode-portable` です。upstream で `/poteto-mode` を呼ぶ場面で、`/poteto-mode-portable` を呼びます。

## plugin として入れる

このリポジトリは、Claude Code と Codex の plugin marketplace です。plugin を 2 つ提供します。
`pstack-portable` は wrapper の skill を登録します。`pstack` は upstream の pstack を手を加えずに、wrapper が fingerprint を持つコミットに固定したものです。
wrapper は `pstack` の plugin をパスで読むので、`pstack` は入れたまま無効にしておきます。

```sh
# Claude Code: pstack starts disabled.
claude plugin marketplace add meganemura/pstack-portable
claude plugin install pstack-portable@pstack-portable
claude plugin install pstack@pstack-portable

# Codex
codex plugin marketplace add meganemura/pstack-portable
codex plugin add pstack-portable@pstack-portable
codex plugin add pstack@pstack-portable
# After adding, set enabled = false under [plugins."pstack@pstack-portable"] in ~/.codex/config.toml.
```

plugin の skill は、`/pstack-portable:poteto-mode-portable` のように plugin の名前が付きます。
`tdd` や `unslop` などの upstream の practice は、wrapper を通して使います。例: 「Use poteto-mode-portable to tdd this fix.」
`pstack` を有効にすると、Cursor を前提とする workflow を含む upstream の 50 件の skill が、直接登録されます。
Claude Code で更新するときは、`claude plugin marketplace update pstack-portable` のあと、plugin ごとに `claude plugin update` を実行します。Codex では `codex plugin marketplace upgrade pstack-portable` で 2 つの plugin が更新され、`pstack` は無効のまま残ります。
以前に入れた `poteto-mode-portable` のリンクやコピーは、`~/.agents/skills` と `~/.claude/skills` から外します。各ホストが wrapper を 1 つだけ読むようにするためです。
直接入れた upstream の skill は任意です。直接呼びたいなら残し、wrapper だけにするなら外します。これらは plugin の更新に追従しません。
Cursor は `.cursor-plugin/` にある wrapper の定義を読みますが、試していません。Cursor の marketplace は upstream のコミットを固定できず、wrapper は別に入れた pstack を見つけられません。
Cursor では、`~/.agents/pstack-upstream.json` を固定コミットの upstream のツリー(clone の `upstream/plugins/pstack` など)に向けます。Cursor では wrapper なしで upstream の pstack をそのまま使えます。

## plugin を使わずに入れる

ローカルのチェックアウトから入れる場合は、[Install from local checkouts](docs/install-local.md) に従います。
`git clone --recurse-submodules https://github.com/meganemura/pstack-portable` で clone します。`git pull` のあとは毎回 `git submodule update --init` を実行します。pull だけでは `upstream/plugins` が取得されないためです。
同じ手順書に、clone から wrapper をリンクする方法と、pull 後に更新する方法があります。
このプロファイルは、互換性のある upstream の skill 31 個とこの wrapper を、Claude Code、Cursor、Codex に登録します。
残りのワークフローは、upstream のチェックアウト全体から wrapper を通して読みます。
次のリモートからの導入は、upstream の skill をすべて登録する別の方法です。
skills CLI は、導入方法を `npx skills add <source>` として [CLI reference](https://www.skills.sh/docs/cli) に載せています。
wrapper は `meganemura/pstack-portable` から入れます。

```sh
npx skills add https://github.com/cursor/plugins/tree/main/pstack
npx skills add meganemura/pstack-portable
```

1 つ目の取得元からは upstream の pstack の skill をすべて選び、2 つ目からは `poteto-mode-portable` を選びます。
導入先として、Claude Code、Codex、Cursor を installer が対応する方法で選びます。
導入した各 skill のリソースは、その `SKILL.md` と同じ場所に置いたままにします。
導入先のコピーやリンクは installer が管理します。取得元を編集したら、導入し直して反映します。
upstream の skill 名が既存の skill とぶつかる場合は、この wrapper だけを登録し、upstream のチェックアウトを読み取り用の依存として残します。
そのチェックアウトのルートの絶対パスを、手元のファイル `~/.agents/pstack-upstream.json` に書きます。

```json
{"root": "/absolute/path/to/plugins/pstack"}
```

このファイルは利用者のマシンに置きます。このリポジトリには入れません。
導入せずに試すこともできます。エージェントに wrapper を絶対パスで読ませます。

```text
Read pstack-portable/skills/poteto-mode-portable/SKILL.md and use it to investigate this bug.
The upstream pstack root is pstack-portable/upstream/plugins/pstack.
```

skill が認識されたら、どちらの環境でも次のように頼めます。

```text
Use poteto-mode-portable to review this diff with upstream interrogate.
Use poteto-mode-portable to configure pstack for this project.
```

wrapper は、導入された upstream の skill を 1 つずつ解決します。共通のリポジトリのルートは要りません。
submodule を初期化したクローンは、wrapper が fingerprint を持つコミットの upstream を `upstream/plugins` に持ちます。そのクローンにリンクした wrapper は、手元のファイルなしでそれを使います。
installer が省いたリポジトリ単位のエージェントのプロンプトは、必要になったときに、記録した upstream のコミットから取り戻します。
取得元のリビジョンやネットワークが使えないと、その部分の作業は未解決のまま残ることがあります。
元の `poteto-mode` を直接呼ぶと、この wrapper を通りません。

## 範囲

upstream の実行可能なリソースには、[スクリプトの事前点検と明示的なアダプタ](skills/poteto-mode-portable/references/executables.md)を使います。
wrapper は、Git だけを見る worktree の監査を持ち、未知のスクリプトや変わったスクリプトを止め、実行前に bootstrap の前提を確かめます。
計画のチェッカーは Cursor と Claude Code で動きます。Codex では、確かめる計画が `/loop 1h` の tick を仕掛けるのに、Codex にはそれを確かめたコマンドがないので、このゲートは未解決のまま残ります。
hook と Cursor Automations の登録は skill の導入とは別です。この wrapper はそれらを入れません。

モデルの設定は実行環境ごとに分かれています。

| 環境 | プロジェクトのファイル | グローバルのファイル |
| --- | --- | --- |
| Codex | `.pstack/models/codex.md` | `~/.agents/pstack/models/codex.md` |
| Claude Code | `.pstack/models/claude-code.md` | `~/.agents/pstack/models/claude-code.md` |
| Cursor | `.pstack/models/cursor.md` | `~/.agents/pstack/models/cursor.md` |

動いている環境のプロジェクトのファイルが、そのグローバルのファイルより優先されます。
各環境の中で、この wrapper を通して `setup-pstack` を実行し、その環境のエージェントを設定します。
たとえば、Claude Code に pstack をグローバルに設定させ、次に Codex で setup を実行して Codex を別に設定します。
既存のモデルの選択は、別の範囲を頼まない限り、今の範囲のまま残ります。
モデル ID と reasoning effort は別の値です。effort の上書きと移行は [the settings contract](skills/poteto-mode-portable/references/settings.md) を見てください。
wrapper は、動いているアプリケーションの中のエージェントに委譲します。別のエージェントアプリケーションやプロバイダの CLI は起動しません。

アダプタは、委譲、設定、モデルの可用性、作業場所の隔離、履歴、外部の skill の参照を扱います。
プロバイダをまたぐ実行役、クラウドのワーカー、永続的なスケジュール、hook は提供しません。
足りない機能は、同等に実行したと言わずに、足りないと報告します。
境界と検証の事例は [the design decision](docs/adapter-design.md) にあります。

## ライセンス

wrapper の独自の部分は [MIT ライセンス](LICENSE)です。
upstream の pstack の帰属表示と、保存したその MIT ライセンスは [NOTICE.md](NOTICE.md) と [LICENSE-pstack](LICENSE-pstack) にあります。
導入可能な skill は両方のライセンス文と帰属表示を持ち運ぶので、skill だけを導入した後も参照できます。
