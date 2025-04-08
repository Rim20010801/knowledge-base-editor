# 記事表示ページ（article.html）

## 概要

記事表示ページは、ナレッジベースシステムの個別記事を閲覧するためのインターフェースです。このページでは記事の内容を読みやすく表示し、編集や削除などの基本操作が可能です。

## ファイル構造

`article.html`ファイルは、以下のような構成で作られています：

- HTML基本構造（DOCTYPE宣言、head、bodyなど）
- CSS（インラインスタイル）
- 必要なJavaScriptライブラリの読み込み
- ページ構造（ヘッダー、コンテンツエリア、アクションボタン）
- メインスクリプト（記事の取得と表示、イベント処理）

## 主要コンポーネント

### 1. ヘッダー部分

```html
<header>
    <div class="header-container">
        <h1 class="site-title">ナレッジベース</h1>
        <nav class="main-nav">
            <ul>
                <li><a href="index.html">記事一覧</a></li>
            </ul>
        </nav>
    </div>
</header>
```

サイトのタイトルとナビゲーションメニューを表示します。現在は記事一覧へのリンクのみが実装されています。

### 2. アクションボタン

```html
<!-- 上部アクション領域 -->
<div class="article-actions top-actions">
    <button id="back-to-list-btn" class="btn" onclick="window.location.href='index.html'">一覧に戻る</button>
    <button id="edit-article-btn" class="btn">編集</button>
</div>

<!-- 下部アクション領域 -->
<div class="article-actions bottom-actions">
    <button id="delete-article-btn" class="btn btn-secondary">記事を削除</button>
</div>
```

記事に対する操作ボタンが配置されています：
- 上部：記事一覧に戻るボタンと編集ボタン
- 下部：記事削除ボタン

### 3. 記事表示領域

```html
<main>
    <div id="article-view" class="article-view">
        <div class="loading-indicator">記事を読み込み中...</div>
    </div>
</main>
```

記事の内容が表示される領域です。初期状態では「記事を読み込み中...」というメッセージが表示されます。

## JavaScript機能

### 1. 初期化と記事読み込み

```javascript
document.addEventListener('DOMContentLoaded', async () => {
    // URLパラメータから記事IDを取得
    const urlParams = new URLSearchParams(window.location.search);
    const articleId = urlParams.get('id');
    
    // 記事IDがない場合のエラーハンドリング
    if (!articleId) {
        document.getElementById('article-view').innerHTML = 
            '<div class="error-message">記事IDが指定されていません。<a href="index.html">一覧に戻る</a></div>';
        return;
    }
    
    // KBシステムの初期化と記事の取得
    try {
        const initialized = await KB.initialize();
        const article = await KB.articles.get(articleId);
        
        // 記事表示処理...
    } catch (error) {
        // エラーハンドリング...
    }
});
```

ページロード時にURLから記事IDを取得し、データベースから該当記事を読み込みます。

### 2. 記事表示処理

```javascript
function displayArticle(articleData) {
    // 記事を表示する要素を取得
    const articleView = document.getElementById('article-view');
    
    // ローディング表示を削除
    articleView.innerHTML = '';
    
    // 記事データをHTMLに変換
    const articleHtml = Converter.articleToHtml(articleData);
    
    // 変換されたHTMLを表示領域に挿入
    articleView.innerHTML = articleHtml;
}
```

`Converter.articleToHtml`関数を使用して記事データをHTML形式に変換し、表示します。

### 3. イベントリスナー設定

```javascript
// 編集ボタンのクリックイベント
document.getElementById('edit-article-btn').addEventListener('click', () => {
    window.location.href = `editor.html?id=${articleId}`;
});

// 削除ボタンのクリックイベント
document.getElementById('delete-article-btn').addEventListener('click', async () => {
    if (confirm('記事を削除してもよろしいですか？')) {
        try {
            await KB.articles.delete(articleId);
            alert('記事を削除しました');
            window.location.href = 'index.html';
        } catch (error) {
            alert(`削除エラー: ${error.message || '不明なエラー'}`);
        }
    }
});
```

- 編集ボタン：エディタページに遷移
- 削除ボタン：確認ダイアログ表示後、記事を削除

## エラーハンドリング

ページは以下のエラー状況に対応しています：

1. **記事IDがない場合**：「記事IDが指定されていません」というメッセージを表示
2. **記事が見つからない場合**：「記事が見つかりませんでした」というメッセージを表示
3. **削除エラー**：エラーメッセージをアラートで表示
4. **一般的なエラー**：エラーメッセージを画面に表示し、コンソールにも詳細情報を出力

## 依存関係

このページは以下のモジュールに依存しています：

1. **schema.js** - データ構造の定義
2. **database.js** - IndexedDBデータベース操作
3. **converter.js** - 記事データをHTML形式に変換
4. **jsonHelper.js** - JSON操作のヘルパー関数
5. **sharedStatus.js** - 共有状態管理
6. **api.js** - KB名前空間内のAPI関数

## 使用例と拡張ポイント

### 使用シナリオ

1. ユーザーが記事一覧ページから記事をクリック（`article.html?id=123`のようなURLで遷移）
2. 記事表示ページが開き、指定された記事が表示される
3. ユーザーは記事を閲覧、編集、または削除が可能

### 拡張の可能性

1. **印刷機能** - 記事を印刷用にフォーマットするボタンの追加
2. **共有機能** - 記事の共有リンクを生成するボタンの追加
3. **関連記事表示** - 同じタグやカテゴリの記事へのリンクを表示
4. **履歴表示** - 記事の編集履歴を閲覧する機能の追加
5. **コメント機能** - 記事へのコメント追加と表示機能 