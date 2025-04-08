/**
 * ストレージ管理モジュール - JSONファイルとIndexDBの同期
 */
// 名前空間の初期化
window.KB = window.KB || {};
window.KB.storage = window.KB.storage || {};

/**
 * JSONファイル読み込み
 */
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

/**
 * 更新が必要な記事を特定
 */
async function identifyUpdatedArticles(jsonFiles) {
  // 結果オブジェクト初期化
  const result = { newArticles: [], updatedArticles: [], unchangedArticles: [] };
  
  // IndexDBから記事を取得してマップ化
  const dbArticles = await window.KB.database.getAll();
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

/**
 * JSONファイル処理メイン関数
 */
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
      const importResult = await window.KB.database.importArticles([
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

/**
 * アプリ起動時の初期化と自動更新
 */
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

// エクスポート
window.KB.storage = { 
  processJsonFiles, 
  identifyUpdatedArticles, 
  initializeAndUpdate 
}; 