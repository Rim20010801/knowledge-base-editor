# 記事編集ページ（editor.html）

## 概要

記事編集ページは、ナレッジベースシステムで新規記事の作成や既存記事の編集を行うためのインターフェースです。ブロックベースのエディタを採用しており、様々な種類のコンテンツブロックを追加・編集できます。

## ファイル構造

`editor.html`ファイルは、以下のような構成で作られています：

- HTML基本構造（DOCTYPE宣言、head、bodyなど）
- CSS（インラインスタイル）
- 必要なJavaScriptライブラリの読み込み
- ページ構造（ヘッダー、記事情報入力フォーム、ブロックリスト、アクションボタン）
- モーダルダイアログ（ブロック編集、プレビュー）
- メインスクリプト（初期化、イベントリスナー）

## 主要コンポーネント

### 1. ヘッダー部分

```html
<header>
    <div class="header-container">
        <h1 class="site-title" id="editor-title">記事作成</h1>
        <nav class="editor-nav">
            <a href="index.html">トップに戻る</a>
        </nav>
    </div>
</header>
```

サイトのタイトル（新規作成時は「記事作成」、編集時は「記事編集」）とナビゲーションリンクを表示します。

### 2. 記事情報セクション

```html
<section class="article-info">
    <div class="form-group">
        <label for="article-title">タイトル:</label>
        <input type="text" id="article-title" placeholder="記事のタイトルを入力">
    </div>
    <div class="form-group">
        <label for="article-category">カテゴリ:</label>
        <input type="text" id="article-category" placeholder="カテゴリを入力">
    </div>
    <div class="form-group">
        <label for="article-tags">タグ:</label>
        <input type="text" id="article-tags" placeholder="カンマ区切りでタグを入力">
    </div>
</section>
```

記事のメタデータ（タイトル、カテゴリ、タグ）を入力するフォームです。

### 3. コンテンツブロックセクション

```html
<section class="content-blocks">
    <h2>コンテンツブロック</h2>
    <div id="blocks-list" class="blocks-container article-list">
        <!-- ブロックリストがここに表示されます -->
    </div>
    <button id="add-block" class="btn btn-add">ブロックを追加</button>
</section>
```

記事の本文を構成するブロックの一覧と、新しいブロックを追加するボタンが表示されます。ブロックリストは動的に生成されます。

### 4. アクションボタン

```html
<section class="action-buttons">
    <button id="save-article" class="btn btn-save">保存</button>
    <button id="preview-article" class="btn btn-preview">プレビュー</button>
    <button id="export-article" class="btn btn-export">エクスポート</button>
    <button id="cancel-editing" class="btn btn-cancel">キャンセル</button>
</section>
```

記事全体に対する操作ボタンが配置されています：
- 保存：記事をデータベースに保存
- プレビュー：記事のHTMLプレビューを表示
- エクスポート：記事をJSONファイルとしてエクスポート
- キャンセル：編集をキャンセルして一覧に戻る

### 5. モーダルダイアログ

```html
<!-- エディタモーダル -->
<div id="editor-modal" class="modal">
    <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h2>ブロック編集</h2>
        <div id="modal-form" class="modal-form">
            <!-- フォームがここに動的に挿入されます -->
        </div>
        <button id="save-block" class="btn btn-save">保存</button>
    </div>
</div>

<!-- プレビューモーダル -->
<div id="preview-modal" class="modal">
    <div class="modal-content">
        <span class="modal-close">&times;</span>
        <h2>プレビュー</h2>
        <div id="preview-content" class="preview-content article-view">
            <!-- プレビュー内容がここに表示されます -->
        </div>
    </div>
</div>
```

2つのモーダルダイアログが定義されています：
- ブロック編集モーダル：個々のブロックを編集するためのフォームを表示
- プレビューモーダル：記事のHTMLプレビューを表示

## JavaScript機能

### 1. 初期化と記事読み込み

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // URLから記事IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    try {
        // KBシステム初期化
        const initialized = await KB.initialize();
        
        // 編集モード設定
        if (articleId) {
            // 既存記事の編集
            document.getElementById('editor-title').textContent = '記事編集';
            const article = await KB.articles.edit(articleId);
            if (article) {
                KB.editor.setupEditor(article);
            }
        } else {
            // 新規作成
            const article = KB.articles.create();
            KB.editor.setupEditor(article);
        }
        
        // イベントリスナー設定...
    } catch (error) {
        // エラーハンドリング...
    }
});
```

ページ読み込み時に、URLパラメータから記事IDを取得し、新規作成か既存記事の編集かを判断します。既存記事の場合は、データベースから記事を取得してエディタにセットアップします。

### 2. アクションボタンのイベントリスナー

```javascript
// 保存ボタン
document.getElementById('save-article')?.addEventListener('click', async () => {
    const saved = await KB.editor.api.saveArticle();
});

// プレビューボタン
document.getElementById('preview-article')?.addEventListener('click', () => {
    KB.editor.api.previewArticle ? KB.editor.api.previewArticle() : KB.editor.previewArticle();
});

// エクスポートボタン
document.getElementById('export-article')?.addEventListener('click', () => {
    KB.editor.updateArticleFromForm();
    KB.editor.api.exportArticleToJson ? KB.editor.api.exportArticleToJson() : KB.io.exportArticle(KB.editor.article);
});

// キャンセルボタン
document.getElementById('cancel-editing')?.addEventListener('click', () => {
    KB.editor.api.cancelEditor ? KB.editor.api.cancelEditor() : KB.editor.cancelEditor();
});
```

各アクションボタンにイベントリスナーを設定し、対応する処理を実行します。APIが提供されている場合はそれを使用し、ない場合は直接関数を呼び出します。

### 3. ページ離脱時の確認

```javascript
// 戻るボタンをオーバーライド
document.querySelector('a[href="index.html"]')?.addEventListener('click', (e) => {
    if (KB.editor.hasUnsavedChanges()) {
        if (!confirm('変更内容が保存されていません。このページを離れますか？')) {
            e.preventDefault();
        } else {
            // 編集中のロックを解除
            KB.editor.currentArticle && KB.articles.endEdit(KB.editor.currentArticle.id);
        }
    }
});
```

未保存の変更がある場合、ページを離れる前に確認ダイアログを表示します。キャンセルした場合はページ遷移を防止し、OKの場合は編集ロックを解除します。

### 4. モーダルダイアログの制御

```javascript
// モーダルクローズ処理
document.querySelectorAll('.modal-close').forEach(closeBtn => {
    closeBtn.addEventListener('click', function() {
        const modal = this.closest('.modal');
        if (modal) modal.style.display = 'none';
    });
});

// モーダル外クリックで閉じる
window.addEventListener('click', (e) => {
    document.querySelectorAll('.modal').forEach(modal => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });
});
```

モーダルダイアログの「×」ボタンやモーダル外のクリックで、モーダルを閉じる処理を実装しています。

## エラーハンドリング

ページは以下のエラー状況に対応しています：

1. **初期化エラー**：「エディタの初期化に失敗しました」というアラートを表示
2. **記事取得エラー**：「記事が見つかりませんでした」というアラートを表示し、一覧ページにリダイレクト
3. **編集エラー**：エラーメッセージをアラートで表示し、一覧ページにリダイレクト
4. **一般的なエラー**：エラーメッセージをコンソールに出力

## 依存関係

このページは以下のモジュールに依存しています：

1. **schema.js** - データ構造の定義
2. **database.js** - IndexedDBデータベース操作
3. **converter.js** - 記事データをHTML形式に変換
4. **jsonHelper.js** - JSON操作のヘルパー関数
5. **sharedStatus.js** - 共有状態管理
6. **storage.js** - JSONファイル同期
7. **editor.js** - エディタのUI操作
8. **api.js** - KB名前空間内のAPI関数

## 使用例と拡張ポイント

### 使用シナリオ

1. 新規記事作成：トップページから「新規作成」ボタンをクリックし、`editor.html`ページを開く
2. 既存記事編集：記事一覧または記事表示ページから「編集」ボタンをクリックし、`editor.html?id=123`のようなURLで遷移
3. 記事情報とコンテンツブロックを編集
4. プレビューでレイアウトを確認
5. 保存またはエクスポート

### 拡張の可能性

1. **追加ブロックタイプ** - 表、引用、埋め込みコンテンツなど、新しいブロックタイプの追加
2. **テンプレート機能** - よく使う記事構造をテンプレートとして保存・適用
3. **画像アップロード** - 画像をアップロードして記事に挿入する機能
4. **ドラッグ&ドロップ** - ブロックの順序をドラッグ&ドロップで変更
5. **バージョン管理** - 記事の編集履歴を保存し、以前のバージョンに戻せるようにする 