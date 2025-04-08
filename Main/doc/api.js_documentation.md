# アプリケーションAPI統合モジュール

## 概要

`api.js`はナレッジベースアプリケーションの中核となる統合APIモジュールです。すべてのコンポーネントモジュールを一つのインターフェースにまとめ、アプリケーション全体でのデータ操作や機能呼び出しを統一的に行うための仕組みを提供します。

## 基本構造

このモジュールは以下の主要コンポーネントで構成されています：

1. **初期化機能** - アプリケーション全体の初期化処理
2. **記事管理API** - 記事の作成、取得、更新、削除などの操作
3. **インポート/エクスポートAPI** - JSONファイルとのデータ交換
4. **タグ管理API** - 記事のタグ付け機能

## 初期化機能

```javascript
KB.initialize = async function() {
  // モジュールの読み込みを確認
  const modules = [
    { name: 'database', loaded: !!KB.database },
    { name: 'schema', loaded: !!KB.schema },
    { name: 'converter', loaded: !!window.Converter },
    { name: 'editor', loaded: !!KB.editor },
    { name: 'shared', loaded: !!KB.shared },
    { name: 'storage', loaded: !!KB.storage }
  ];
  
  const missingModules = modules.filter(m => !m.loaded).map(m => m.name);
  
  if (missingModules.length > 0) {
    console.error('Missing modules:', missingModules.join(', '));
    return false;
  }
  
  // ユーザー名の確認
  if (!localStorage.getItem('user_name')) {
    // ユーザー名モーダルを表示
    const usernameModal = document.getElementById('username-modal');
    if (usernameModal) {
      usernameModal.style.display = 'block';
      return false;
    }
  }
  
  // 共有ステータスの監視を開始
  KB.shared.startMonitoring();
  
  console.log('KB Application initialized');
  return true;
};
```

この関数は以下の処理を行います：
1. 必要なモジュールが読み込まれているかチェック
2. ユーザー名が設定されているか確認（未設定の場合はモーダル表示）
3. 共有ステータスの監視開始
4. 初期化結果を返却

## 記事管理API

記事の作成、取得、更新、削除などの基本的なデータ操作を提供します。

### 記事の作成

```javascript
KB.articles.create = function() {
  return {
    id: 'article_' + Date.now(),
    title: '',
    category: '',
    author: localStorage.getItem('user_name') || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: [],
    content: []
  };
}
```

新しい記事オブジェクトを作成します。タイムスタンプを使用したIDの自動生成、現在の日時設定、ローカルストレージからのユーザー名取得などが行われます。

### 記事の保存

```javascript
KB.articles.save = async function(article, isNew = false) {
  try {
    article.updatedAt = new Date().toISOString();
    
    // データベースに保存
    const savedArticle = await KB.database.save(article);
    
    // 更新を記録
    await KB.shared.recordUpdate(savedArticle, isNew ? 'create' : 'edit');
    
    // 通知
    KB.shared.notify(`記事「${article.title}」を${isNew ? '作成' : '更新'}しました`);
    
    return savedArticle;
  } catch (error) {
    console.error('記事保存エラー:', error);
    throw error;
  }
}
```

記事をデータベースに保存し、共有ステータスを更新します。操作が新規作成か更新かを区別し、適切な通知を表示します。

### 記事の取得

```javascript
KB.articles.get = async function(id) {
  return await KB.database.get(id);
}

KB.articles.getAll = async function() {
  return await KB.database.getAll();
}
```

指定されたIDの記事、またはすべての記事を取得します。

### 記事の削除

```javascript
KB.articles.delete = async function(id) {
  try {
    // ロックを確認
    const lock = await KB.shared.checkLock(id);
    if (lock) {
      throw new Error(`この記事は ${lock.user} によって編集中です`);
    }
    
    // 削除実行
    await KB.database.delete(id);
    
    // 通知
    KB.shared.notify('記事を削除しました');
    
    return true;
  } catch (error) {
    console.error('記事削除エラー:', error);
    throw error;
  }
}
```

記事を削除する前に、他のユーザーによる編集ロックがかかっていないかを確認します。ロックがない場合のみ削除を実行します。

### 記事の編集

```javascript
KB.articles.edit = async function(id) {
  // ロック確認と取得
  const canEdit = await KB.shared.checkAndLock(id);
  if (!canEdit) {
    throw new Error('この記事は現在編集できません');
  }
  
  // 記事を取得
  const article = await KB.database.get(id);
  if (!article) {
    throw new Error('記事が見つかりませんでした');
  }
  
  return article;
}

KB.articles.endEdit = function(id) {
  if (id) {
    KB.shared.unlock(id);
    KB.shared.stopInterval(id);
  }
}
```

共同編集の衝突を避けるため、記事の編集開始時にロックを取得し、編集終了時にロックを解除します。

### 記事の検索

```javascript
KB.articles.searchByTitle = async function(query) {
  return await KB.database.searchByTitle(query);
}

KB.articles.searchFullText = async function(query) {
  return await KB.database.searchFullText(query);
}
```

タイトル検索と全文検索の両方をサポートします。

## インポート/エクスポートAPI

ファイルとのデータ交換機能を提供します。

### 記事のエクスポート

```javascript
KB.io.exportArticle = function(article) {
  try {
    const blob = new Blob([JSON.stringify(article, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.id}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('エクスポートエラー:', error);
    return false;
  }
}
```

単一記事をJSONファイルとしてエクスポートします。Blobオブジェクトを生成し、一時的なリンク要素を使用してダウンロードを実行します。

### 複数記事のエクスポート

```javascript
KB.io.exportArticles = function(articles) {
  try {
    const blob = new Blob([JSON.stringify(articles, null, 2)], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `articles_${new Date().toISOString().slice(0, 10)}.json`;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    return true;
  } catch (error) {
    console.error('エクスポートエラー:', error);
    return false;
  }
}
```

複数の記事を一つのJSONファイルにまとめてエクスポートします。ファイル名には現在の日付が含まれます。

### ファイルからのインポート

```javascript
KB.io.importFromFile = function(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // 単一記事か配列かを判定
        const articles = Array.isArray(data) ? data : [data];
        
        // インポート処理（DBに保存）
        const results = [];
        for (const article of articles) {
          if (article.id && article.title) {
            await KB.database.save(article);
            results.push(article);
          }
        }
        
        resolve(results);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
    reader.readAsText(file);
  });
}
```

JSONファイルから記事データを読み込み、データベースに保存します。単一記事と複数記事の両方の形式に対応しています。

## タグ管理API

記事のタグ付け機能を提供します。

### タグの追加

```javascript
KB.tags.add = function(article, tag) {
  if (!tag || typeof tag !== 'string') return false;
  tag = tag.trim();
  if (tag === '') return false;
  
  if (!article.tags) article.tags = [];
  if (article.tags.includes(tag)) return false;
  
  article.tags.push(tag);
  return true;
}
```

記事に新しいタグを追加します。空文字列や既存のタグは無視されます。

### タグの削除

```javascript
KB.tags.remove = function(article, tag) {
  if (!article.tags || !tag) return false;
  const index = article.tags.indexOf(tag);
  if (index === -1) return false;
  
  article.tags.splice(index, 1);
  return true;
}
```

記事から指定されたタグを削除します。

### 複数タグの設定

```javascript
KB.tags.setFromString = function(article, tagsString) {
  const tags = tagsString
    .split(/[,\s]+/)
    .map(tag => tag.trim())
    .filter(tag => tag !== '');
  
  article.tags = [...new Set(tags)]; // 重複除去
}
```

カンマまたは空白で区切られたタグ文字列から、記事のタグを一括設定します。重複タグは自動的に除去されます。

### すべてのタグの取得

```javascript
KB.tags.getAll = async function() {
  const articles = await KB.database.getAll();
  const tags = new Set();
  
  articles.forEach(article => {
    if (article.tags && Array.isArray(article.tags)) {
      article.tags.forEach(tag => tags.add(tag));
    }
  });
  
  return [...tags].sort();
}
```

すべての記事から使用されているタグを収集し、重複を除去して並べ替えます。

## 使用例

### アプリケーションの初期化

```javascript
// ページロード時にアプリケーションを初期化
document.addEventListener('DOMContentLoaded', async () => {
  const initialized = await KB.initialize();
  if (initialized) {
    // アプリケーションの機能を有効化
    setupUI();
    loadContent();
  } else {
    // 初期化エラー処理
    showErrorMessage('アプリケーションの初期化に失敗しました');
  }
});
```

### 記事の作成と保存

```javascript
// 新しい記事の作成
async function createNewArticle() {
  // 新しい記事オブジェクトを取得
  const article = KB.articles.create();
  
  // フォームからデータを取得
  article.title = document.getElementById('title').value;
  article.category = document.getElementById('category').value;
  
  // タグを設定
  KB.tags.setFromString(article, document.getElementById('tags').value);
  
  // 記事を保存
  try {
    const savedArticle = await KB.articles.save(article, true); // true = 新規作成
    return savedArticle;
  } catch (error) {
    console.error('記事作成エラー:', error);
    return null;
  }
}
```

### 記事のエクスポートとインポート

```javascript
// 記事のエクスポート
function exportCurrentArticle(article) {
  if (KB.io.exportArticle(article)) {
    alert('記事をエクスポートしました');
  } else {
    alert('エクスポートに失敗しました');
  }
}

// 記事のインポート
async function importArticleFile(file) {
  try {
    const imported = await KB.io.importFromFile(file);
    alert(`${imported.length}件の記事をインポートしました`);
    return imported;
  } catch (error) {
    alert('インポートに失敗しました: ' + error.message);
    return [];
  }
}
```

### 記事の検索

```javascript
// 検索の実行
async function performSearch(query, isFullText = false) {
  try {
    const results = isFullText 
      ? await KB.articles.searchFullText(query)
      : await KB.articles.searchByTitle(query);
      
    return results;
  } catch (error) {
    console.error('検索エラー:', error);
    return [];
  }
}
```

## モジュール間の連携

このAPIモジュールは以下のモジュールと連携します：

- **KB.database** - データの保存と取得
- **KB.schema** - 記事データ構造の定義
- **KB.shared** - 共有ステータスと通知
- **KB.storage** - ファイル処理
- **KB.editor** - 記事編集インターフェース
- **window.Converter** - 記事のHTML変換

各モジュールの機能を統合し、一貫したインターフェースを提供することで、アプリケーション全体の堅牢性と保守性を高めています。 