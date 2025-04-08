# 記事一覧ページ（index.html）

## 概要

記事一覧ページは、ナレッジベースシステムのメイン画面として、記事の一覧表示、検索、新規作成、インポート/エクスポート機能を提供します。このページからすべての主要機能にアクセスできるハブとして機能しています。

## ファイル構造

`index.html`ファイルは、現在、以下のような構成で作られています：

- HTML基本構造（DOCTYPE宣言、head）
- 必要なJavaScriptモジュールの読み込み
- メインスクリプト（アプリケーション初期化、イベント処理、ユーティリティ関数）
- HTML本体要素のコメントによる構造説明

注意：現在のファイルには `<body>` 要素が実装されておらず、コメント内に必要な要素が説明されています。これは開発途中のためと思われます。

## 読み込まれるJavaScriptモジュール

```html
<!-- コアモジュール（基本機能） -->
<script src="js/core/schema.js"></script>
<script src="js/core/database.js"></script>
<script src="js/core/search.js"></script>
<script src="js/core/indexer.js"></script>
<script src="js/core/converter.js"></script>

<!-- ユーティリティモジュール -->
<script src="js/util/debounce.js"></script>
<script src="js/util/jsonHelper.js"></script>
<script src="js/util/storage.js"></script>
<script src="js/util/sharedStatus.js"></script>

<!-- UIモジュール -->
<script src="js/ui/editor.js"></script>

<!-- APIモジュール（統合） -->
<script src="js/core/api.js"></script>
```

ページは各種機能モジュールを読み込み、アプリケーションの初期化とユーザーインターフェース処理を行います。

## メイン機能

### 1. アプリケーション初期化

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // KBシステム初期化
    const initialized = await KB.initialize();
    
    if (!initialized) {
        console.warn('初期化が完了していません。一部機能が制限される可能性があります。');
    }
    
    // 各種イベントリスナー設定と機能初期化
    // ...
    
    // 記事一覧のロード
    loadAllArticles();
});
```

ページ読み込み時に`KB.initialize()`を呼び出してシステムを初期化し、各種イベントリスナーを設定します。最後に`loadAllArticles()`で記事一覧を表示します。

### 2. 記事一覧表示

```javascript
// すべての記事を読み込んで表示
async function loadAllArticles() {
    const articles = await KB.articles.getAll();
    displayArticleList(articles);
}

// 記事一覧を表示
function displayArticleList(articles) {
    // 記事リストをDOMに追加
    // ...
    
    articles.forEach(article => {
        // 各記事項目のHTML生成
        // ...
        
        // 表示、編集、削除ボタンの追加
        // ...
    });
}
```

データベースから全記事を取得し、降順（最新順）に並べ替えて表示します。各記事には表示、編集、削除ボタンが付加されています。

### 3. 記事表示機能

```javascript
// 記事表示
async function viewArticle(id) {
    try {
        const article = await KB.articles.get(id);
        
        // HTML変換
        let html = `<h1>${article.title || '(無題)'}</h1>`;
        // メタデータ、タグ、コンテンツの表示処理
        // ...
        
        // 表示切替
        document.getElementById('editor-container').style.display = 'none';
        view.style.display = 'block';
        
    } catch (error) {
        console.error('記事表示エラー:', error);
        alert('記事の表示に失敗しました');
    }
}
```

選択された記事IDを元にデータベースから記事を取得し、HTMLに変換して表示します。記事の内容に応じてさまざまなHTML要素（見出し、段落、リスト、画像など）を生成します。

### 4. 記事編集機能

```javascript
// 記事編集
async function editArticle(id) {
    try {
        const article = await KB.articles.edit(id);
        setupEditor(article, false);
    } catch (error) {
        console.error('記事編集エラー:', error);
        alert(error.message || '記事の編集に失敗しました');
    }
}

// エディタセットアップ
function setupEditor(article, isNew) {
    currentArticle = article;
    isNewArticle = isNew;
    
    // フォームに記事データを設定
    // ...
    
    // 表示切替
    document.getElementById('article-view').style.display = 'none';
    document.getElementById('editor-container').style.display = 'block';
}
```

選択された記事を編集モードで開きます。`KB.articles.edit()`は記事データの取得とともに編集ロックも設定します。取得した記事データをエディタフォームに設定し、表示を切り替えます。

### 5. 記事保存機能

```javascript
// 現在の記事を保存
async function saveCurrentArticle() {
    if (!currentArticle) return;
    
    // 値を取得
    const title = document.getElementById('article-title').value.trim();
    const content = document.getElementById('article-content').value;
    
    // バリデーション
    if (!title) {
        alert('タイトルを入力してください');
        return;
    }
    
    // 記事を更新
    currentArticle.title = title;
    currentArticle.content = content;
    
    try {
        // 保存
        await KB.articles.save(currentArticle, isNewArticle);
        
        // エディタをリセット
        resetEditor();
        
        // 記事一覧を更新
        loadAllArticles();
        
    } catch (error) {
        console.error('保存エラー:', error);
        alert('記事の保存に失敗しました');
    }
}
```

編集中の記事をフォームから取得した値で更新し、データベースに保存します。保存後はエディタをリセットし、記事一覧を更新します。

### 6. 記事削除機能

```javascript
// 記事削除
async function deleteArticle(id) {
    if (!confirm('記事を削除してもよろしいですか？')) return;
    
    try {
        await KB.articles.delete(id);
        
        // 記事一覧を更新
        loadAllArticles();
        
        // 表示をリセット
        // ...
        
    } catch (error) {
        console.error('記事削除エラー:', error);
        alert(error.message || '記事の削除に失敗しました');
    }
}
```

確認ダイアログ表示後、選択された記事をデータベースから削除します。削除後は記事一覧を更新し、表示をリセットします。

### 7. 検索機能

```javascript
// 検索
const searchInput = document.getElementById('search-input');
searchInput.addEventListener('input', debounce(async () => {
    const query = searchInput.value.trim();
    if (query.length > 0) {
        const results = await KB.articles.searchFullText(query);
        displayArticleList(results);
    } else {
        loadAllArticles();
    }
}, 300));
```

検索ボックスに入力された値を使って全文検索を行い、結果を表示します。デバウンス処理により、入力から300ミリ秒後に実際の検索が実行されます。入力が空の場合は全記事を表示します。

### 8. インポート/エクスポート機能

```javascript
// インポートボタン
document.getElementById('import-button').addEventListener('click', async () => {
    const fileInput = document.getElementById('import-file');
    if (fileInput.files.length === 0) {
        alert('ファイルを選択してください');
        return;
    }
    
    try {
        const result = await KB.io.processJsonFiles(fileInput.files);
        
        // 結果表示と記事一覧更新
        // ...
    } catch (error) {
        console.error('インポートエラー:', error);
        document.getElementById('import-status').textContent = 'インポートに失敗しました';
    }
});

// 全記事エクスポート
document.getElementById('export-all').addEventListener('click', async () => {
    const articles = await KB.articles.getAll();
    if (articles.length === 0) {
        alert('エクスポートする記事がありません');
        return;
    }
    
    KB.io.exportArticles(articles);
});
```

選択されたJSONファイルから記事をインポート、またはすべての記事をJSONファイルとしてエクスポートする機能を提供します。インポート時は新規/更新/変更なしの記事数が表示されます。

## 想定されるHTML構造

コメントから想定される`<body>`要素の構造は以下の通りです：

```html
<body>
    <!-- ヘッダー部分 -->
    <header>...</header>
    
    <!-- 記事一覧 -->
    <ul id="article-list">...</ul>
    
    <!-- 記事表示部分 -->
    <div id="article-view">...</div>
    
    <!-- 編集フォーム -->
    <div id="editor-container">
        <input id="article-title" type="text">
        <textarea id="article-content"></textarea>
        <button id="save-article">保存</button>
        <button id="cancel-editing">キャンセル</button>
    </div>
    
    <!-- ユーザー名入力モーダル -->
    <div id="username-modal">
        <input id="username-input" type="text">
        <button id="save-username">保存</button>
    </div>
    
    <!-- インポート/エクスポートモーダル -->
    <div id="import-export-modal">
        <input id="import-file" type="file">
        <button id="import-button">インポート</button>
        <button id="export-all">全記事エクスポート</button>
        <button id="close-modal">閉じる</button>
        <div id="import-status"></div>
    </div>
    
    <!-- 操作ボタン -->
    <button id="new-article">新規作成</button>
    <input id="search-input" type="text">
    <button id="import-export">インポート/エクスポート</button>
</body>
```

## エラーハンドリング

ページは以下のエラー状況に対応しています：

1. **初期化エラー**：コンソールに警告を表示し、一部機能が制限される可能性があることを通知
2. **記事表示エラー**：エラーメッセージをアラートで表示
3. **記事編集エラー**：エラーメッセージをアラートで表示
4. **記事削除エラー**：エラーメッセージをアラートで表示
5. **保存エラー**：エラーメッセージをアラートで表示
6. **インポートエラー**：エラーメッセージを画面に表示

## 依存関係

このページは以下のモジュールに依存しています：

1. **schema.js** - データ構造の定義
2. **database.js** - IndexedDBデータベース操作
3. **search.js** - 検索機能
4. **indexer.js** - 検索インデックス構築
5. **converter.js** - 記事データをHTML形式に変換
6. **debounce.js** - イベント最適化
7. **jsonHelper.js** - JSON操作のヘルパー関数
8. **storage.js** - JSONファイル同期
9. **sharedStatus.js** - 共有状態管理
10. **editor.js** - エディタのUI操作
11. **api.js** - KB名前空間内のAPI関数

## 使用例と拡張ポイント

### 使用シナリオ

1. ユーザーがページを開くと、保存されている記事の一覧が表示される
2. ユーザー名が設定されていない場合は、ユーザー名入力モーダルが表示される
3. 「新規作成」ボタンをクリックして新しい記事を作成できる
4. 検索ボックスに入力して記事を検索できる
5. 記事の「表示」「編集」「削除」ボタンで各操作を実行できる
6. 「インポート/エクスポート」ボタンで記事のバックアップやリストアを行える

### 拡張の可能性

1. **記事リストの絞り込み** - タグやカテゴリによるフィルタリング機能
2. **複数選択操作** - 複数記事の一括削除や一括エクスポート
3. **ドラッグ&ドロップインポート** - ファイル選択ダイアログなしでの簡易インポート
4. **リスト表示オプション** - リスト/グリッド表示の切り替えやソート順の変更
5. **タグクラウド** - よく使われるタグの視覚的表示
6. **進行中編集の復元** - ブラウザクラッシュからの編集内容の復元機能 