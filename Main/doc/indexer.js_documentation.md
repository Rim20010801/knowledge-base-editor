# 検索インデックス管理モジュール

## 概要

`indexer.js`は記事データの検索インデックスを構築し、効率的な検索機能を提供するモジュールです。タイトル、コンテンツ、カテゴリ、タグなどの各フィールドに対してインデックスを作成し、高速な全文検索を実現します。

## 基本構造

このモジュールは以下の主要コンポーネントで構成されています：

1. **インデックス構造** - 検索のためのインメモリインデックス
2. **インデックス構築** - 記事からトークンを抽出しインデックスを作成
3. **検索機能** - インデックスを使用して効率的な検索を実行
4. **永続化** - インデックスのローカルストレージへの保存と読み込み

## インデックス構造

```javascript
// シンプル検索インデックス
let idx = {title: {}, content: {}, category: {}, tags: {}};
let refs = {};
```

- **idx** - 各フィールド（タイトル、コンテンツ、カテゴリ、タグ）ごとのトークンインデックス
- **refs** - 記事IDから記事オブジェクトへの参照マップ

## 主要機能

### テキストのトークン化

```javascript
function tokenize(text) {
  return text ? text.toLowerCase()
    .replace(/[,.、。！？!?（）「」…]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1) : [];
}
```

このメソッドは:
- テキストを小文字に変換
- 句読点や記号を削除
- スペースで分割して単語（トークン）を抽出
- 1文字の単語を除外

### インデックス構築

```javascript
function buildIndex(articles) {
  // リセット
  idx = {title: {}, content: {}, category: {}, tags: {}};
  refs = {};
  
  articles.forEach(art => {
    // 記事参照を保存
    refs[art.id] = art;
    
    // インデックス追加関数
    const addTokens = (type, text) => {
      tokenize(text).forEach(token => {
        if (!idx[type][token]) idx[type][token] = new Set();
        idx[type][token].add(art.id);
      });
    };
    
    // 各フィールドをインデックス化
    addTokens('title', art.title);
    addTokens('category', art.category);
    
    // タグのインデックス化
    if (art.tags?.length) {
      art.tags.forEach(tag => addTokens('tags', tag));
    }
    
    // コンテンツのインデックス化
    if (art.content?.length) {
      art.content.forEach(block => {
        if (block.text) addTokens('content', block.text);
      });
    }
  });
}
```

このメソッドでは:
1. 既存のインデックスをリセット
2. 各記事を処理:
   - 記事オブジェクトへの参照を保存
   - タイトル、カテゴリをインデックス化
   - タグがあればインデックス化
   - 各コンテンツブロックのテキストをインデックス化

### 検索機能

#### タイトル検索

```javascript
function searchByTitle(query) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  
  // 各トークンにマッチするIDを取得
  const matches = tokens.map(token => {
    const ids = new Set();
    Object.keys(idx.title).forEach(idxToken => {
      if (idxToken.includes(token)) {
        idx.title[idxToken].forEach(id => ids.add(id));
      }
    });
    return ids;
  });
  
  // AND検索
  return [...matches[0]]
    .filter(id => matches.every(set => set.has(id)))
    .map(id => refs[id]);
}
```

このメソッドは:
1. 検索クエリをトークン化
2. 各トークンに対して部分一致するタイトルインデックスを検索
3. すべてのトークンにマッチする記事のみを返す（AND検索）

#### 全文検索

```javascript
function searchFullText(query) {
  const tokens = tokenize(query);
  if (!tokens.length) return [];
  
  const scores = new Map();
  
  tokens.forEach(token => {
    ['title', 'content', 'category', 'tags'].forEach(type => {
      Object.keys(idx[type]).forEach(idxToken => {
        if (idxToken.includes(token)) {
          idx[type][idxToken].forEach(id => {
            // スコア計算（タイプに応じた重み付け）
            const weight = type === 'title' ? 3 : (type === 'category' || type === 'tags') ? 2 : 1;
            scores.set(id, (scores.get(id) || 0) + weight);
          });
        }
      });
    });
  });
  
  // スコア順にソート
  return [...scores.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(entry => refs[entry[0]]);
}
```

このメソッドでは:
1. 検索クエリをトークン化
2. すべてのインデックス（タイトル、コンテンツ、カテゴリ、タグ）を検索
3. 各記事にスコアを付与:
   - タイトル一致: 3点
   - カテゴリ・タグ一致: 2点
   - コンテンツ一致: 1点
4. スコアが高い順に結果をソート

### インデックスの永続化

#### インデックスの保存

```javascript
function saveIndex() {
  try {
    // Setを配列に変換して保存
    const serialIdx = {};
    Object.keys(idx).forEach(type => {
      serialIdx[type] = {};
      Object.keys(idx[type]).forEach(token => {
        serialIdx[type][token] = [...idx[type][token]];
      });
    });
    
    localStorage.setItem('searchIndex', JSON.stringify(serialIdx));
    localStorage.setItem('articleRefs', JSON.stringify(refs));
    return true;
  } catch (e) {
    console.error('インデックス保存エラー:', e);
    return false;
  }
}
```

このメソッドは:
- インメモリのインデックスをシリアライズ（Setを配列に変換）
- ローカルストレージに保存

#### インデックスの読み込み

```javascript
function loadIndex() {
  try {
    const stored = localStorage.getItem('searchIndex');
    const storedRefs = localStorage.getItem('articleRefs');
    
    if (!stored || !storedRefs) return false;
    
    const parsed = JSON.parse(stored);
    refs = JSON.parse(storedRefs);
    
    // 配列をSetに変換
    idx = {};
    Object.keys(parsed).forEach(type => {
      idx[type] = {};
      Object.keys(parsed[type]).forEach(token => {
        idx[type][token] = new Set(parsed[type][token]);
      });
    });
    
    return true;
  } catch (e) {
    console.error('インデックス読込エラー:', e);
    return false;
  }
}
```

このメソッドは:
- ローカルストレージからインデックスを読み込み
- 配列をSetに変換してインメモリインデックスを復元

## 公開API

```javascript
KB.indexer = {
  buildIndex,
  searchByTitle,
  searchFullText,
  saveIndex,
  loadIndex
};
```

- **buildIndex(articles)** - 記事の配列からインデックスを構築
- **searchByTitle(query)** - タイトルに対する検索を実行
- **searchFullText(query)** - 全文検索を実行
- **saveIndex()** - インデックスをローカルストレージに保存
- **loadIndex()** - ローカルストレージからインデックスを読み込み

## 使用例

```javascript
// データベースから記事を取得してインデックスを構築
const articles = KB.database.getAll();
KB.indexer.buildIndex(articles);

// 全文検索の実行
const results = KB.indexer.searchFullText('プログラミング JavaScript');
console.log(`検索結果: ${results.length}件`);

// 検索結果の表示
results.forEach(article => {
  console.log(`${article.title} (${article.category})`);
});

// インデックスの保存
KB.indexer.saveIndex();

// 次回起動時
if (KB.indexer.loadIndex()) {
  console.log('インデックスを読み込みました');
} else {
  // 読み込めなかった場合は再構築
  KB.indexer.buildIndex(KB.database.getAll());
}
```

## パフォーマンスと拡張性

このインデックスは:
- インメモリで高速に動作
- 部分一致検索をサポート
- タイトル、内容、カテゴリ、タグに対する重み付け検索を実現

拡張のヒント:
- 大量の記事には、より効率的なデータ構造（トライ木など）の導入検討
- Webワーカーでのインデックス構築で非同期処理化
- ストップワード（of, the, andなど無意味な単語）除外機能の追加 