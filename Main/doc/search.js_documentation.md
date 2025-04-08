# 検索UI管理モジュール

## 概要

`search.js`は検索インターフェースを管理し、ユーザーが記事を検索するためのUIコンポーネントを提供するモジュールです。検索フォーム、検索モード切り替え、検索結果の表示など、検索に関連するUI要素の動作を制御します。

## 基本構造

このモジュールは以下の主要コンポーネントで構成されています：

1. **検索UI初期化** - 検索フォームと関連イベントの設定
2. **検索実行** - ユーザー入力に基づく検索処理
3. **結果表示** - 検索結果のHTMLレンダリング

## 状態管理

```javascript
// 現在の検索モード
let isFullText = false;
```

- **isFullText** - 検索モードを管理するフラグ（タイトルのみの検索か全文検索か）

## 主要機能

### 検索UI初期化

```javascript
function initSearchUI() {
  const input = document.getElementById('search-input');
  const mode = document.getElementById('search-mode');
  const results = document.getElementById('search-results');
  
  if (!input || !results) return;
  
  // イベント設定
  input.addEventListener('input', debouncedSearch);
  
  if (mode) {
    mode.addEventListener('change', () => {
      isFullText = mode.value === 'fulltext';
      debouncedSearch();
    });
  }
  
  // URL検索パラメータ対応
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    input.value = q;
    search();
  }
  
  // ...
}
```

このメソッドでは:
1. 必要なDOM要素（検索入力、モード切替、結果表示領域）を取得
2. イベントリスナーの設定:
   - 入力フィールドの変更を監視（デバウンス処理付き）
   - 検索モード切替の監視
3. URL検索パラメータ（`?q=検索語`）からの検索実行

### 検索実行

```javascript
const search = () => {
  const query = input.value.trim();
  
  // 2文字未満はクリア
  if (query.length < 2) {
    results.innerHTML = '';
    return;
  }
  
  // 検索実行と結果表示
  const found = isFullText ? KB.indexer.searchFullText(query) : KB.indexer.searchByTitle(query);
  showResults(found, query);
};

// デバウンス処理
const debouncedSearch = KB.debounce ? KB.debounce(search, 300) : search;
```

この関数では:
1. 入力値の取得と前後の空白削除
2. 2文字未満の検索は無視（パフォーマンス対策）
3. 選択された検索モードに基づいて適切な検索関数を呼び出し
4. デバウンス処理（300ms）でタイピング中の頻繁な検索実行を防止

### 検索結果表示

```javascript
function showResults(articles, query) {
  // 結果がない場合
  if (!articles?.length) {
    results.innerHTML = `<div class="no-results">「${query}」に一致する記事はありません</div>`;
    return;
  }
  
  // 結果ヘッダー
  results.innerHTML = `
    <div class="results-header">${articles.length}件の検索結果</div>
    <div class="results-list"></div>
  `;
  
  const list = results.querySelector('.results-list');
  
  // 各記事の結果を生成
  articles.forEach(art => {
    // スニペット生成
    let snippet = '';
    if (art.content?.length) {
      const texts = art.content
        .filter(b => b.text)
        .map(b => b.text);
      
      if (texts.length) {
        snippet = texts.join(' ').substring(0, 150) + '...';
      }
    }
    
    // 結果アイテム生成
    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
      <h3 class="result-title">${art.title || '無題'}</h3>
      <div class="result-meta">${art.category ? `カテゴリ: ${art.category}` : ''}</div>
      <div class="result-snippet">${snippet || 'コンテンツがありません'}</div>
    `;
    
    // クリックで記事表示
    item.addEventListener('click', () => {
      location.href = `view.html?id=${art.id}`;
    });
    
    list.appendChild(item);
  });
}
```

この関数では:
1. 検索結果の有無に応じて表示を切替
2. 結果一覧のコンテナを作成
3. 各記事に対して:
   - コンテンツからスニペット（最初の150文字）を抽出
   - 結果アイテムをHTML要素として生成
   - タイトル、カテゴリ、スニペットを表示
   - クリックイベントで記事閲覧ページへリンク

## 公開API

```javascript
KB.search = {
  init: initSearchUI
};
```

- **init()** - 検索UI機能を初期化する関数

## HTML構造との関連

このモジュールは次のHTML要素と連携します:

```html
<!-- 検索入力フォーム -->
<input id="search-input" type="text" placeholder="検索...">

<!-- 検索モード切替（オプション） -->
<select id="search-mode">
  <option value="title">タイトル検索</option>
  <option value="fulltext">全文検索</option>
</select>

<!-- 検索結果表示領域 -->
<div id="search-results"></div>
```

## 使用例

```javascript
// ページロード時に検索UIを初期化
document.addEventListener('DOMContentLoaded', () => {
  // インデックスのロード（または構築）
  if (!KB.indexer.loadIndex()) {
    const articles = KB.database.getAll();
    KB.indexer.buildIndex(articles);
  }
  
  // 検索UI初期化
  KB.search.init();
});
```

## スタイリング

以下はモジュールが生成する検索結果のHTMLクラス構造です:

```
.no-results      -- 結果がない場合のメッセージ
.results-header  -- 結果件数の表示
.results-list    -- 結果アイテムのコンテナ
  .result-item   -- 個別の検索結果アイテム
    .result-title  -- 記事タイトル
    .result-meta   -- メタ情報（カテゴリなど）
    .result-snippet -- 記事の冒頭部分
```

これらのクラスに対してCSSスタイルを適用することで、検索結果の見た目をカスタマイズできます。

## パフォーマンスの考慮点

- 2文字未満の検索は実行されないため、短い文字列での不要な検索が防止されます
- 検索はデバウンス処理により、タイピング中の連続実行が最適化されています
- 検索結果の生成はDOMの再利用ではなく、innerHTML置き換えを使用しています（結果が多い場合は最適化の余地あり） 