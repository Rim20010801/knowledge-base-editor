# ナレッジベースアプリケーション技術ドキュメント

このディレクトリには、ナレッジベースアプリケーションの各モジュールに関する技術ドキュメントが含まれています。

## ドキュメント一覧

### システム概要

- [プロジェクト概要](project_overview.md) - システム全体の構造と機能

### HTMLページ

- [記事一覧ページ](index_page_documentation.md) - メインページ（index.html）
- [記事表示ページ](article_page_documentation.md) - 個別記事表示（article.html）
- [記事編集ページ](editor_page_documentation.md) - 記事作成・編集（editor.html）

### コアモジュール

- [database.js](database.js_documentation.md) - IndexedDBデータベース操作
- [api.js](api.js_documentation.md) - アプリケーション統合API
- [schema.js](schema.js_documentation.md) - データスキーマ定義

### 検索関連

- [indexer.js](indexer.js_documentation.md) - 検索インデックス構築
- [search.js](search.js_documentation.md) - 検索機能

### コンテンツ処理

- [converter.js](converter.js_documentation.md) - マークダウン/HTML変換
- [editor.js](editor.js_documentation.md) - エディタ機能

### ユーティリティ

- [storage.js](storage.js_documentation.md) - JSONファイル同期
- [sharedStatus.js](sharedStatus.js_documentation.md) - 共有ステータス管理
- [jsonHelper.js](jsonHelper.js_documentation.md) - JSONデータ処理
- [debounce.js](debounce.js_documentation.md) - イベント最適化

## 技術スタック

- **フロントエンド**: 純粋なJavaScript (バニラJS)
- **データ保存**: IndexedDB (ブラウザ内ストレージ)
- **UI**: HTML5, CSS3
- **エディタ**: カスタムブロックエディタ

## アーキテクチャ概要

このアプリケーションは、以下の主要コンポーネントで構成されています：

1. **データ層**: データの永続化と取得（database.js）
2. **ビジネスロジック層**: データ処理とアプリケーションロジック（api.js, converter.js など）
3. **プレゼンテーション層**: ユーザーインターフェースとインタラクション（editor.js など）

各モジュールは疎結合に設計されており、`KB`名前空間を通じて相互に通信します。これにより、個々のコンポーネントの独立した開発とテストが可能になっています。

## 名前空間パターン

このアプリケーションでは、グローバル名前空間の競合を防ぎ、コードを整理するために`window.KB`名前空間パターンを使用しています。

```javascript
// 名前空間の初期化
window.KB = window.KB || {};
window.KB.モジュール名 = window.KB.モジュール名 || {};

// 機能の追加
window.KB.モジュール名 = {
  機能1: function() { /* ... */ },
  機能2: function() { /* ... */ }
};
```

各モジュールは次のパターンに従っています：

1. グローバルの`window.KB`オブジェクトを初期化（存在しない場合）
2. モジュール固有の名前空間（例：`window.KB.database`）を初期化
3. 機能を該当の名前空間に追加

これにより、モジュール間の機能を明確に区別しつつ、グローバルの名前空間汚染を防止しています。最近の更新により、コードベース全体で名前空間の使用が統一され、`const KB = window.KB`のようなローカル変数参照ではなく、`window.KB`への直接参照を使用するようになりました。

## 使用方法

各ドキュメントには、対応するモジュールの詳細な説明と使用例が含まれています。新機能の開発や既存機能の拡張を行う際は、まずこれらのドキュメントを参照してください。

## 拡張計画

- サーバー側との同期機能
- 複数デバイス間のリアルタイム編集
- タグベースのナビゲーション強化
- 高度な全文検索機能 