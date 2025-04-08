# ストレージ管理モジュール

## 概要

`storage.js`はJSONファイルとIndexedDBデータベースの間のデータ同期を管理するユーティリティモジュールです。ファイルからのデータインポート、更新の検出、記事のバージョン管理などの機能を提供し、ナレッジベースのデータ連携とバックアップを実現します。

## 基本構造

このモジュールは以下の主要コンポーネントで構成されています：

1. **JSONファイル読み込み** - ファイルシステムからJSONデータを読み取る
2. **更新検出** - 新規・更新・変更なしの記事を特定
3. **インポート処理** - データベースへの一括インポート
4. **初期化と自動更新** - ファイル選択UIとの連携

## JSONファイル読み込み

```javascript
function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      try {
        resolve(JSON.parse(e.target.result));
      } catch (error) {
        console.error('JSONファイル解析エラー:', error);
        reject(error);
      }
    };
    reader.onerror = () => reject(new Error('ファイル読み込みエラー'));
    reader.readAsText(file);
  });
}
```

この関数はFileオブジェクトを受け取り、FileReaderを使用してその内容を読み込みます。読み込まれたテキストはJSONとして解析され、成功した場合はJavaScriptオブジェクトとして返されます。エラーが発生した場合は適切に処理されます。

## 更新検出機能

```javascript
async function identifyUpdatedArticles(jsonFiles) {
  // 結果オブジェクト初期化
  const result = { newArticles: [], updatedArticles: [], unchangedArticles: [] };
  
  // IndexDBから記事を取得してマップ化
  const dbArticles = await KB.database.getAll();
  const dbMap = {};
  dbArticles.forEach(article => dbMap[article.id] = { updatedAt: article.updatedAt, article });
  
  // 各ファイルを処理
  for (const file of jsonFiles) {
    try {
      const fileData = await readJsonFile(file);
      const articles = Array.isArray(fileData) ? fileData : [fileData];
      
      for (const article of articles) {
        // 無効な記事は無視
        if (!article || typeof article !== 'object') continue;
        
        // IDがない場合は新規作成
        if (!article.id) {
          article.id = 'article_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
          result.newArticles.push(article);
          continue;
        }
        
        // 存在チェックと更新判定
        if (!dbMap[article.id]) {
          // 存在しなければ新規
          result.newArticles.push(article);
        } else if (!article.updatedAt || !dbMap[article.id].updatedAt || 
                  new Date(article.updatedAt) > new Date(dbMap[article.id].updatedAt)) {
          // タイムスタンプが新しければ更新
          result.updatedArticles.push(article);
        } else {
          // 変更なし
          result.unchangedArticles.push(article);
        }
      }
    } catch (error) {
      console.error(`ファイル ${file.name} の処理エラー:`, error);
    }
  }
  
  return result;
}
```

この関数は複数のJSONファイルを処理し、各記事を以下のカテゴリに分類します：

1. **新規記事** - データベースに存在しない記事（IDが存在しない場合も含む）
2. **更新記事** - データベースに存在するが、JSONファイルのバージョンが新しい記事
3. **変更なし記事** - データベースのバージョンと同じか古い記事

主な処理の流れ：
1. 現在のデータベース内容をID別のマップに変換
2. 各JSONファイルを読み込み、単一記事か配列かを判定
3. 各記事に対して、ID存在チェックと更新日時の比較を実施
4. 結果を3つのカテゴリに分類して返却

## インポート処理

```javascript
async function processJsonFiles(files) {
  if (!files || files.length === 0) return { status: 'error', message: 'ファイルが選択されていません' };
  
  const result = { status: 'success', processed: 0, new: 0, updated: 0, unchanged: 0, failed: 0 };
  
  try {
    // JSONファイルのみを抽出
    const jsonFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.json'));
    if (jsonFiles.length === 0) return { status: 'error', message: 'JSONファイルが見つかりません' };
    
    // 更新記事を特定
    const updateInfo = await identifyUpdatedArticles(jsonFiles);
    result.processed = jsonFiles.length;
    result.new = updateInfo.newArticles.length;
    result.updated = updateInfo.updatedArticles.length;
    result.unchanged = updateInfo.unchangedArticles.length;
    
    // 記事をインポート（新規・更新のみ）
    if (updateInfo.newArticles.length > 0 || updateInfo.updatedArticles.length > 0) {
      const importResult = await KB.database.importArticles([
        ...updateInfo.newArticles, 
        ...updateInfo.updatedArticles
      ]);
      result.failed = importResult.error;
    }
    
    return result;
  } catch (error) {
    console.error('JSONファイル処理エラー:', error);
    return { 
      ...result, 
      status: 'error', 
      message: 'ファイル処理エラー: ' + error.message,
      failed: result.failed + 1
    };
  }
}
```

この関数はファイルリストを受け取り、JSON形式のファイルのみを処理してデータベースにインポートします。

処理の流れ：
1. JSONファイルのみを抽出（拡張子チェック）
2. `identifyUpdatedArticles`関数で更新が必要な記事を特定
3. 新規記事と更新記事のみをデータベースにインポート
4. 処理結果の統計情報（処理件数、新規、更新、変更なし、失敗）を返却

結果オブジェクトには以下の情報が含まれます：
- **status** - 処理状態（'success'/'error'）
- **processed** - 処理されたファイル数
- **new** - 新規インポートされた記事数
- **updated** - 更新された記事数
- **unchanged** - 変更がなかった記事数
- **failed** - 失敗した記事数
- **message** - エラーメッセージ（エラー時のみ）

## 初期化と自動更新

```javascript
async function initializeAndUpdate(fileInput) {
  return new Promise(resolve => {
    fileInput.onchange = async event => {
      const files = event.target.files;
      if (files && files.length > 0) {
        resolve(await processJsonFiles(files));
      } else {
        resolve({ status: 'cancelled', message: 'ファイル選択がキャンセルされました' });
      }
      fileInput.value = '';
    };
    fileInput.click();
  });
}
```

この関数はファイル選択UIとの連携を担当します。指定されたファイル入力要素をクリックしてファイル選択ダイアログを表示し、ユーザーがファイルを選択すると自動的に処理を開始します。

処理の流れ：
1. 指定されたinput[type=file]要素に対してclick()を実行
2. ユーザーがファイルを選択するとonchangeイベントが発火
3. 選択されたファイルを`processJsonFiles`関数で処理
4. 処理結果またはキャンセル情報をPromiseで返却
5. ファイル入力をクリアして次回の選択に備える

## APIエクスポート

```javascript
// エクスポート
KB.storage = { processJsonFiles, identifyUpdatedArticles, initializeAndUpdate };
window.KB = KB;
```

このモジュールは以下の関数を公開しています：
- **processJsonFiles** - JSONファイルの処理とインポート
- **identifyUpdatedArticles** - 更新が必要な記事の特定
- **initializeAndUpdate** - ファイル選択UIを使った更新処理

## 使用例

### ファイル選択ダイアログからのインポート

```javascript
// ファイル選択要素を作成
const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.multiple = true;
fileInput.accept = '.json';
fileInput.style.display = 'none';
document.body.appendChild(fileInput);

// インポート処理を実行
async function importFromFileDialog() {
  try {
    const result = await KB.storage.initializeAndUpdate(fileInput);
    
    if (result.status === 'success') {
      alert(`処理結果:\n新規: ${result.new}件\n更新: ${result.updated}件\n変更なし: ${result.unchanged}件\n失敗: ${result.failed}件`);
    } else if (result.status === 'cancelled') {
      console.log('インポートがキャンセルされました');
    } else {
      alert('エラー: ' + result.message);
    }
  } catch (error) {
    console.error('インポートエラー:', error);
    alert('インポート処理中にエラーが発生しました');
  }
}

// インポートボタンなどから呼び出し
document.getElementById('import-button').addEventListener('click', importFromFileDialog);
```

### ドラッグ&ドロップによるインポート

```javascript
// ドロップエリアの設定
const dropArea = document.getElementById('drop-area');

// ドラッグイベントの処理
['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
  }, false);
});

// ドラッグ中のビジュアル効果
['dragenter', 'dragover'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => {
    dropArea.classList.add('highlight');
  }, false);
});

['dragleave', 'drop'].forEach(eventName => {
  dropArea.addEventListener(eventName, () => {
    dropArea.classList.remove('highlight');
  }, false);
});

// ドロップ時の処理
dropArea.addEventListener('drop', async (e) => {
  const files = e.dataTransfer.files;
  
  // ステータス表示を更新
  const statusEl = document.getElementById('import-status');
  statusEl.textContent = 'インポート処理中...';
  
  try {
    // インポート処理を実行
    const result = await KB.storage.processJsonFiles(files);
    
    if (result.status === 'success') {
      statusEl.textContent = `インポート完了: 新規${result.new}件、更新${result.updated}件`;
    } else {
      statusEl.textContent = `エラー: ${result.message}`;
    }
  } catch (error) {
    statusEl.textContent = 'インポート処理中にエラーが発生しました';
    console.error('インポートエラー:', error);
  }
}, false);
```

### プログラム的なファイル処理

```javascript
// JSONデータを直接処理する例
async function importFromJsonData(jsonData) {
  // Blobオブジェクトを作成
  const jsonBlob = new Blob([JSON.stringify(jsonData)], { type: 'application/json' });
  
  // Fileオブジェクトを作成
  const file = new File([jsonBlob], 'import.json', { type: 'application/json' });
  
  // インポート処理を実行
  const result = await KB.storage.processJsonFiles([file]);
  
  return result;
}

// 使用例
const articleData = [
  {
    title: 'サンプル記事1',
    content: [{ type: 'text', text: 'これはサンプル記事です' }],
    tags: ['サンプル', 'テスト']
  },
  {
    title: 'サンプル記事2',
    content: [{ type: 'text', text: '2つ目のサンプル記事です' }],
    tags: ['サンプル', 'テスト']
  }
];

// インポート実行
importFromJsonData(articleData).then(result => {
  console.log('インポート結果:', result);
});
```

## 技術的考慮点

### 更新の検出ロジック

記事の更新を検出するためのロジック：
1. **IDによる存在チェック** - データベースに同じIDの記事が存在するかどうか
2. **タイムスタンプの比較** - `updatedAt`フィールドを使用して新しいバージョンかどうかを判断

この仕組みは以下の状況で適切に動作します：
- 異なるデバイス間でのデータ同期
- バックアップからの復元
- 外部ソースからのデータインポート

### エラーハンドリング

モジュール全体で堅牢なエラーハンドリングを実装しています：
- 個別のファイル読み込みエラーが全体の処理を中断しない
- JSON解析エラーが適切に処理される
- 結果オブジェクトにエラー情報が詳細に記録される

### パフォーマンスへの配慮

- データベースからの記事取得は一度だけ行い、メモリ内でマップ化して参照
- ファイル処理は非同期に行い、UIのブロックを防止
- 不要な更新を避けるため、変更がある記事のみをデータベースに保存

### 拡張のヒント

- **差分マージ** - 現在は記事全体の置き換えですが、フィールドレベルでのマージも検討できます
- **バージョン管理** - 更新履歴を保持して変更追跡や競合解決を強化できます
- **クラウド同期** - オンラインストレージと連携することで、デバイス間同期をさらに強化できます
- **進行状況表示** - 大量のファイルを処理する場合、進行状況のフィードバックを提供すると良いでしょう 