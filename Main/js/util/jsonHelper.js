/**
 * JSONデータ処理ユーティリティ
 * 記事データのインポート/エクスポート機能を提供
 */

// 名前空間の初期化
window.KB = window.KB || {};
window.KB.jsonHelper = window.KB.jsonHelper || {};

/**
 * 記事をJSONとして文字列化
 * @param {Object} article 記事オブジェクト
 * @returns {string} JSON文字列
 */
function articleToJson(article) {
  return JSON.stringify(article, null, 2);
}

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

// 名前空間に関数を追加
window.KB.jsonHelper = {
  articleToJson,
  jsonToArticle,
  exportArticleToFile,
  importArticleFromFile,
  exportArticlesToFile
}; 