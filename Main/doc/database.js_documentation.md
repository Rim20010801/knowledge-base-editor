# データベース操作モジュール

## 概要

`database.js`はナレッジベースアプリケーションのデータ永続化を担当するモジュールです。IndexedDBを使用して記事データをブラウザ内に保存し、検索や取得などの操作を提供します。アプリケーションの中核となるデータ層として機能します。

## 基本構造

このモジュールは以下の主要コンポーネントで構成されています：

1. **データベース設定** - IndexedDBの初期化と構成
2. **基本CRUD操作** - 記事の作成・読取・更新・削除機能
3. **検索機能** - タイトル検索と全文検索
4. **APIエクスポート** - 機能をアプリケーション全体に公開

## データベース設定

```javascript
// 名前空間の初期化
const KB = window.KB || {};
KB.database = {};

// データベース設定
const DB = {
  NAME: 'knowledgeBase',
  VERSION: 1,
  STORE: 'articles',
  INDEXES: {
    TITLE: 'by_title',
    CATEGORY: 'by_category',
    UPDATED: 'by_updated',
    TAGS: 'by_tags'
  }
};
```

主要な設定：
- **NAME** - データベース名（'knowledgeBase'）
- **VERSION** - データベースのバージョン（スキーマ変更時に増加）
- **STORE** - メインのオブジェクトストア名（'articles'）
- **INDEXES** - 検索用のインデックス定義

## データベース操作の共通関数

IndexedDBの操作を簡略化するためのヘルパー関数です。

```javascript
// データベース接続用の共通関数
async function dbOperation(storeName, mode, callback) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB.NAME, DB.VERSION);
    
    // DB初期化（バージョンアップ時のみ実行）
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(DB.STORE)) {
        const store = db.createObjectStore(DB.STORE, { keyPath: 'id' });
        store.createIndex(DB.INDEXES.TITLE, 'title', { unique: false });
        store.createIndex(DB.INDEXES.CATEGORY, 'category', { unique: false });
        store.createIndex(DB.INDEXES.UPDATED, 'updatedAt', { unique: false });
        store.createIndex(DB.INDEXES.TAGS, 'tags', { unique: false, multiEntry: true });
      }
    };
    
    request.onerror = () => reject(request.error);
    
    request.onsuccess = (event) => {
      const db = event.target.result;
      const tx = db.transaction([storeName], mode);
      const store = tx.objectStore(storeName);
      
      tx.oncomplete = () => db.close();
      tx.onerror = () => reject(tx.error);
      
      callback(store, resolve, reject);
    };
  });
}
```

この関数は以下の処理を行います：
1. データベースへの接続を確立
2. 必要なスキーマの初期化（最初の実行時またはバージョン変更時）
3. トランザクションの作成と操作実行
4. 適切なエラーハンドリングとプロミス解決

データベース初期化時には、記事データに対して次のインデックスが作成されます：
- タイトルによるインデックス
- カテゴリによるインデックス
- 更新日時によるインデックス
- タグによるインデックス（複数値対応）

## 基本CRUD操作

### 記事の保存（作成・更新）

```javascript
// 記事を保存
async function saveArticle(article) {
  if (!article.id) article.id = 'article_' + Date.now();
  
  const now = new Date().toISOString();
  if (!article.createdAt) article.createdAt = now;
  article.updatedAt = now;
  
  return dbOperation(DB.STORE, 'readwrite', (store, resolve, reject) => {
    const request = store.put(article);
    request.onsuccess = () => resolve(article);
    request.onerror = () => reject(request.error);
  });
}
```

この関数は新規作成と更新の両方に対応しています：
1. IDがない場合は新しいIDを生成（タイムスタンプベース）
2. 作成日時・更新日時を自動設定
3. IndexedDBに記事データを保存
4. 保存された記事オブジェクトを返却

### IDによる記事の取得

```javascript
// IDで記事を取得
async function getArticle(id) {
  return dbOperation(DB.STORE, 'readonly', (store, resolve) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
  });
}
```

指定されたIDの記事を取得します。見つからない場合はnullを返します。

### すべての記事の取得

```javascript
// すべての記事を取得
async function getAllArticles() {
  return dbOperation(DB.STORE, 'readonly', (store, resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}
```

データベース内のすべての記事を配列として取得します。

### 記事の削除

```javascript
// 記事を削除
async function deleteArticle(id) {
  return dbOperation(DB.STORE, 'readwrite', (store, resolve) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
  });
}
```

指定されたIDの記事をデータベースから削除します。

## 検索機能

### タイトルによる検索

```javascript
// タイトルで検索
async function searchByTitle(query) {
  const queryLower = query.toLowerCase();
  return dbOperation(DB.STORE, 'readonly', (store, resolve) => {
    const request = store.index(DB.INDEXES.TITLE).getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(article => 
        article.title.toLowerCase().includes(queryLower)
      ));
    };
  });
}
```

記事のタイトルに検索クエリが含まれるものを取得します。大文字・小文字を区別しないように検索を実行します。

### 全文検索

```javascript
// フルテキスト検索
async function searchFullText(query) {
  const queryLower = query.toLowerCase();
  return dbOperation(DB.STORE, 'readonly', (store, resolve) => {
    const request = store.getAll();
    request.onsuccess = () => {
      resolve(request.result.filter(article => {
        // タイトル・カテゴリ・タグ検索
        if (article.title.toLowerCase().includes(queryLower) ||
            article.category.toLowerCase().includes(queryLower) ||
            article.tags.some(tag => tag.toLowerCase().includes(queryLower))) {
          return true;
        }
        
        // コンテンツ検索
        return article.content && article.content.some(block => 
          block.text && block.text.toLowerCase().includes(queryLower)
        );
      }));
    };
  });
}
```

この関数は記事の複数フィールドにわたる検索を実行します：
1. タイトル検索
2. カテゴリ検索
3. タグ検索
4. 記事本文（コンテンツブロック内のテキスト）検索

すべての検索は大文字・小文字を区別せず、部分一致で検索します。いずれかの条件にマッチする記事がすべて結果に含まれます。

## APIエクスポート

モジュールの機能をアプリケーション全体に公開します。

```javascript
// 名前空間に追加
KB.database = {
  DB,
  save: saveArticle,
  get: getArticle,
  getAll: getAllArticles,
  searchByTitle,
  searchFullText,
  delete: deleteArticle
};

// グローバルに公開（互換性のため）
window.DB = {
  save: saveArticle,
  get: getArticle,
  getAll: getAllArticles,
  searchByTitle,
  searchFullText,
  delete: deleteArticle
};

// 名前空間をグローバルに公開
window.KB = KB;
```

データベース操作を2つの方法で公開しています：
1. **KB.database** - 名前空間を使用した現代的なアプローチ
2. **window.DB** - レガシーコードとの互換性のためのグローバルオブジェクト

## 使用例

### 記事の作成と保存

```javascript
async function createArticle() {
  // 新しい記事オブジェクトを作成
  const article = {
    title: '新しい記事',
    category: '一般',
    tags: ['メモ', 'サンプル'],
    content: [
      { type: 'text', text: 'これは新しい記事のコンテンツです。' }
    ]
  };
  
  try {
    // データベースに保存
    const savedArticle = await KB.database.save(article);
    console.log('記事が保存されました:', savedArticle.id);
    return savedArticle;
  } catch (error) {
    console.error('保存エラー:', error);
    return null;
  }
}
```

### 記事の取得と表示

```javascript
async function displayArticle(id) {
  try {
    // 記事データを取得
    const article = await KB.database.get(id);
    
    if (!article) {
      console.error('記事が見つかりません');
      return;
    }
    
    // 画面に表示
    document.getElementById('title').textContent = article.title;
    document.getElementById('category').textContent = article.category;
    document.getElementById('tags').textContent = article.tags.join(', ');
    
    // コンテンツを表示
    const contentContainer = document.getElementById('content');
    contentContainer.innerHTML = '';
    
    article.content.forEach(block => {
      const div = document.createElement('div');
      div.className = `block block-${block.type}`;
      div.textContent = block.text;
      contentContainer.appendChild(div);
    });
    
  } catch (error) {
    console.error('表示エラー:', error);
  }
}
```

### 記事の検索と結果表示

```javascript
async function searchArticles(query, isFullText = false) {
  try {
    // 検索を実行
    const results = isFullText
      ? await KB.database.searchFullText(query)
      : await KB.database.searchByTitle(query);
    
    // 結果を表示
    const resultsList = document.getElementById('results');
    resultsList.innerHTML = '';
    
    if (results.length === 0) {
      resultsList.innerHTML = '<li>検索結果はありません</li>';
      return;
    }
    
    results.forEach(article => {
      const li = document.createElement('li');
      const link = document.createElement('a');
      link.href = `#article/${article.id}`;
      link.textContent = article.title;
      li.appendChild(link);
      resultsList.appendChild(li);
    });
    
  } catch (error) {
    console.error('検索エラー:', error);
  }
}
```

### データベースの初期化と全記事の表示

```javascript
async function initializeAndDisplayAllArticles() {
  try {
    // すべての記事を取得
    const articles = await KB.database.getAll();
    
    // 記事リストを表示
    const articleList = document.getElementById('article-list');
    articleList.innerHTML = '';
    
    articles.forEach(article => {
      const item = document.createElement('div');
      item.className = 'article-item';
      item.dataset.articleId = article.id;
      
      const title = document.createElement('h3');
      title.textContent = article.title;
      
      const meta = document.createElement('div');
      meta.className = 'article-meta';
      meta.textContent = `カテゴリ: ${article.category} | 最終更新: ${new Date(article.updatedAt).toLocaleString()}`;
      
      const controls = document.createElement('div');
      
      const editBtn = document.createElement('button');
      editBtn.className = 'edit-button';
      editBtn.textContent = '編集';
      editBtn.onclick = () => location.hash = `#edit/${article.id}`;
      
      const deleteBtn = document.createElement('button');
      deleteBtn.className = 'delete-button';
      deleteBtn.textContent = '削除';
      deleteBtn.onclick = async () => {
        if (confirm('この記事を削除してもよろしいですか？')) {
          await KB.database.delete(article.id);
          item.remove();
        }
      };
      
      controls.appendChild(editBtn);
      controls.appendChild(deleteBtn);
      
      item.appendChild(title);
      item.appendChild(meta);
      item.appendChild(controls);
      
      articleList.appendChild(item);
    });
    
  } catch (error) {
    console.error('初期化エラー:', error);
  }
}
```

## 技術的考慮点

### パフォーマンス

- IndexedDBはブラウザの非同期APIを使用しており、大量のデータでもメインスレッドをブロックしません。
- インデックスを使用することで、タイトルやタグなどでの検索が高速化されています。
- 全文検索はJavaScriptのフィルタリングで実装されており、データ量が増えると遅くなる可能性があります。

### 制限事項

- ブラウザのIndexedDBには容量制限があります（ブラウザによって異なりますが、通常は数MB～数百MB）。
- 検索機能は単純な部分一致のみで、高度な全文検索機能（ファジー検索、関連性スコアなど）はありません。
- データはユーザーのブラウザ内にのみ保存され、異なるデバイス間で同期されません。

### 拡張のヒント

- サーバー側との同期機能を追加することで、複数デバイス間でのデータ共有が可能になります。
- 専用の検索ライブラリ（例：Lunr.js）を統合することで、より高度な検索機能を提供できます。
- バージョン管理機能を追加することで、記事の変更履歴を追跡できるようになります。
- データのバックアップ/リストア機能を追加することで、データ損失のリスクを軽減できます。 