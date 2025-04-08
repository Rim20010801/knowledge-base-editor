/**
 * シンプルなIndexDBデータベース操作
 */

// 名前空間の初期化
window.KB = window.KB || {};
window.KB.database = window.KB.database || {};

// 変数のローカル参照は削除
// const KB = window.KB;

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

// 記事を保存
async function saveArticle(article) {
  // 引数のバリデーション
  if (!article) {
    console.error('saveArticle: 記事オブジェクトが未定義です');
    throw new Error('記事オブジェクトが未定義です');
  }
  
  if (!article.id) {
    console.log('記事IDが指定されていないため、新しいIDを生成します');
    article.id = 'article_' + Date.now();
  }
  
  // タイムスタンプ設定
  const now = new Date().toISOString();
  if (!article.createdAt) article.createdAt = now;
  article.updatedAt = now;
  
  console.log(`記事を保存します: id=${article.id}, title=${article.title || 'タイトルなし'}`);
  
  return dbOperation(DB.STORE, 'readwrite', (store, resolve, reject) => {
    try {
      const request = store.put(article);
      
      request.onsuccess = () => {
        console.log('記事保存成功:', article.id);
        resolve(article);
      };
      
      request.onerror = (event) => {
        console.error('記事保存エラー:', event.target.error);
        reject(new Error('記事の保存に失敗しました: ' + (event.target.error ? event.target.error.message : '不明なエラー')));
      };
    } catch (error) {
      console.error('記事保存例外:', error);
      reject(error);
    }
  }).catch(error => {
    console.error('記事保存中に例外が発生しました:', error);
    // 再スロー
    throw error;
  });
}

// IDで記事を取得
async function getArticle(id) {
  return dbOperation(DB.STORE, 'readonly', (store, resolve) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result || null);
  });
}

// すべての記事を取得
async function getAllArticles() {
  return dbOperation(DB.STORE, 'readonly', (store, resolve) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
  });
}

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

// 記事を削除
async function deleteArticle(id) {
  return dbOperation(DB.STORE, 'readwrite', (store, resolve) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve(true);
  });
}

/**
 * 複数記事をインポート
 * @param {Array} articles - インポートする記事の配列
 * @returns {Promise<Object>} - インポート結果
 */
async function importArticles(articles) {
  if (!Array.isArray(articles) || articles.length === 0) {
    return { success: 0, error: 0, message: '記事がありません' };
  }
  
  let success = 0;
  let error = 0;
  
  for (const article of articles) {
    try {
      if (!article || !article.id) {
        error++;
        continue;
      }
      
      await saveArticle(article);
      success++;
    } catch (e) {
      console.error('記事インポートエラー:', e, article);
      error++;
    }
  }
  
  return { success, error };
}

// 名前空間に追加
window.KB.database = {
  DB,
  save: saveArticle,
  saveArticle: saveArticle,  // 明示的にsaveArticleもエイリアス
  get: getArticle,
  getArticle: getArticle,    // 明示的にgetArticleもエイリアス
  getAll: getAllArticles,
  getAllArticles: getAllArticles, // 明示的にgetAllArticlesもエイリアス
  searchByTitle,
  searchFullText,
  delete: deleteArticle,
  deleteArticle: deleteArticle,  // 明示的にdeleteArticleもエイリアス
  importArticles
};

// グローバルに公開（互換性のため）
window.DB = {
  save: saveArticle,
  saveArticle: saveArticle,
  get: getArticle,
  getArticle: getArticle,
  getAll: getAllArticles,
  getAllArticles: getAllArticles,
  searchByTitle,
  searchFullText,
  delete: deleteArticle,
  deleteArticle: deleteArticle,
  importArticles
};

// 名前空間をグローバルに公開 - 不要なので削除
// window.KB = KB; 