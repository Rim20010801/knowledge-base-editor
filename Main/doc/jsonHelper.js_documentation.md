# JSONヘルパーモジュール

## 概要

`jsonHelper.js`は記事データのJSON形式でのインポート/エクスポート機能を提供するユーティリティモジュールです。このモジュールを使用することで、記事データをファイルとして保存したり、外部ソースから記事データを読み込んだりすることが可能になります。

## 基本機能

このモジュールは以下の主要機能を提供します：

1. **記事データの文字列化** - 記事オブジェクトをJSON文字列に変換
2. **JSON文字列の解析** - JSON文字列から記事オブジェクトへの変換
3. **記事のエクスポート** - 記事データをJSONファイルとして保存
4. **記事のインポート** - JSONファイルから記事データを読み込み
5. **一括エクスポート** - 複数記事を一つのJSONファイルとして保存

## API関数

### 記事をJSON形式に変換

```javascript
/**
 * 記事をJSONとして文字列化
 * @param {Object} article 記事オブジェクト
 * @returns {string} JSON文字列
 */
function articleToJson(article) {
  return JSON.stringify(article, null, 2);
}
```

この関数は記事オブジェクトを整形されたJSON文字列に変換します。第2引数の`null`はリプレーサー関数（置換関数）で、第3引数の`2`はインデントのスペース数を指定しています。

### JSON文字列から記事オブジェクトを生成

```javascript
/**
 * JSON文字列から記事オブジェクトを生成
 * @param {string} json JSON文字列
 * @returns {Object} 記事オブジェクト
 */
function jsonToArticle(json) {
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error('JSONパースエラー:', error);
    return null;
  }
}
```

この関数はJSON文字列を解析して記事オブジェクトに変換します。解析エラーが発生した場合は、エラーをコンソールに出力し、`null`を返します。

### 記事をファイルとしてエクスポート

```javascript
/**
 * 記事をファイルとしてエクスポート
 * @param {Object} article 記事オブジェクト
 * @returns {boolean} 成功したかどうか
 */
function exportArticleToFile(article) {
  try {
    const blob = new Blob([articleToJson(article)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${article.id || 'article'}.json`;
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

この関数は以下の処理を行います：
1. 記事オブジェクトをJSONに変換し、Blobオブジェクトを作成
2. BlobからURLを生成
3. 一時的なリンク要素を作成してダウンロードを実行
4. クリーンアップ処理（リンク要素の削除とURL解放）

### ファイルから記事をインポート

```javascript
/**
 * ファイルからJSONを読み込む
 * @param {File} file ファイルオブジェクト
 * @returns {Promise<Object>} 記事オブジェクトのPromise
 */
function importArticleFromFile(file) {
  return new Promise((resolve, reject) => {
    if (!file || !file.name.endsWith('.json')) {
      reject(new Error('有効なJSONファイルを選択してください'));
      return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const article = jsonToArticle(e.target.result);
        article ? resolve(article) : reject(new Error('無効なJSON形式'));
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
    reader.readAsText(file);
  });
}
```

この関数は非同期処理（Promise）を使用してファイルからデータを読み込みます：
1. ファイルの拡張子チェック（.jsonのみ許可）
2. FileReaderを使用してファイルの内容をテキストとして読み込み
3. 読み込んだテキストをJSON解析し、記事オブジェクトとして返す
4. エラー発生時は適切なエラーメッセージを提供

### 複数記事を一括エクスポート

```javascript
/**
 * 複数記事をまとめてJSONにエクスポート
 * @param {Array} articles 記事の配列
 * @returns {boolean} 成功したかどうか
 */
function exportArticlesToFile(articles) {
  try {
    const blob = new Blob([JSON.stringify(articles, null, 2)], { type: 'application/json' });
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

この関数は複数の記事を一つのJSONファイルとしてエクスポートします。ファイル名には現在の日付が含まれます。

## 使用例

### 記事のエクスポート

```javascript
// 現在の記事をエクスポート
const article = KB.editor.article;
if (article) {
  if (exportArticleToFile(article)) {
    console.log('記事が正常にエクスポートされました');
  } else {
    console.error('エクスポートに失敗しました');
  }
}
```

### 記事のインポート

```javascript
// ファイル選択イベントハンドラ
document.getElementById('import-file').addEventListener('change', async (e) => {
  try {
    const file = e.target.files[0];
    if (!file) return;
    
    const article = await importArticleFromFile(file);
    if (article) {
      // インポートした記事を処理
      KB.editor.article = article;
      KB.editor.renderBlocks();
      console.log('記事が正常にインポートされました');
    }
  } catch (error) {
    console.error('インポートエラー:', error.message);
    alert('インポートに失敗しました: ' + error.message);
  }
});
```

### データバックアップの作成

```javascript
// すべての記事をバックアップ
async function backupAllArticles() {
  const articles = await KB.database.getAll();
  if (articles.length > 0) {
    if (exportArticlesToFile(articles)) {
      console.log(`${articles.length}件の記事をバックアップしました`);
      return true;
    }
  }
  return false;
}
```

## モジュールのエクスポート

```javascript
export {
  articleToJson,
  jsonToArticle,
  exportArticleToFile,
  importArticleFromFile,
  exportArticlesToFile
};
```

このモジュールは、ES6のモジュール形式でエクスポートされています。他のコードからインポートして使用するには以下のようにします：

```javascript
// 全ての関数をインポート
import * as JsonHelper from './jsonHelper.js';

// または特定の関数だけをインポート
import { exportArticleToFile, importArticleFromFile } from './jsonHelper.js';
```

## エラーハンドリング

このモジュールのすべての関数は、適切なエラーハンドリングを実装しています：

- `jsonToArticle`: JSON解析エラーを捕捉し、nullを返します
- `exportArticleToFile`/`exportArticlesToFile`: 例外を捕捉し、falseを返します
- `importArticleFromFile`: Promiseベースのエラーハンドリングを実装し、詳細なエラーメッセージを提供します

これにより、呼び出し元のコードは適切にエラー状況に対処できます。

## 名前空間へのエクスポート

```javascript
// 名前空間に関数を追加
window.KB.jsonHelper = {
  articleToJson,
  jsonToArticle,
  exportArticleToFile,
  importArticleFromFile,
  exportArticlesToFile
};
```

このモジュールは、グローバルの`window.KB`名前空間の`jsonHelper`プロパティとして関数をエクスポートしています。これにより、アプリケーション全体からアクセスできるようになっています。このパターンはアプリケーション全体で一貫して使用されており、名前空間の競合を防止します。

以下のように使用できます：

```javascript
// 単一の関数を使用
const jsonString = window.KB.jsonHelper.articleToJson(article);

// または短い参照を作成
const jsonHelper = window.KB.jsonHelper;
const article = jsonHelper.jsonToArticle(jsonString);
```

## エラーハンドリング

このモジュールのすべての関数は、適切なエラーハンドリングを実装しています：

- `jsonToArticle`: JSON解析エラーを捕捉し、nullを返します
- `exportArticleToFile`/`exportArticlesToFile`: 例外を捕捉し、falseを返します
- `importArticleFromFile`: Promiseベースのエラーハンドリングを実装し、詳細なエラーメッセージを提供します

これにより、呼び出し元のコードは適切にエラー状況に対処できます。 