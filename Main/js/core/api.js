/**
 * KBアプリケーションAPI
 * 全モジュールを統合し、一貫したインターフェースを提供します
 */

// KB名前空間の初期化
window.KB = window.KB || {};

// 変数のローカル参照 - 削除
// const KB = window.KB;

/**　
 * 初期化
 */
window.KB.initialize = async function() {
  // モジュールの読み込みを確認
  const modules = [
    { name: 'database', loaded: !!window.KB.database },
    { name: 'schema', loaded: !!window.KB.schema },
    { name: 'converter', loaded: !!window.Converter },
    { name: 'editor', loaded: !!window.KB.editor },
    { name: 'shared', loaded: !!window.KB.shared },
    { name: 'storage', loaded: !!window.KB.storage }
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
  window.KB.shared.startMonitoring();
  
  console.log('KB Application initialized');
  return true;
};

/**
 * 記事操作API
 */
window.KB.articles = {
  /**
   * 記事を作成する
   * @returns {Object} 新しい記事オブジェクト
   */
  create: function() {
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
  },
  
  /**
   * 記事を保存する
   * @param {Object} article 記事オブジェクト
   * @param {boolean} isNew 新規作成かどうか
   * @returns {Promise<Object>} 保存された記事
   */
  save: async function(article, isNew = false) {
    try {
      article.updatedAt = new Date().toISOString();
      
      // データベースに保存
      const savedArticle = await window.KB.database.save(article);
      
      // 更新を記録
      await window.KB.shared.recordUpdate(savedArticle, isNew ? 'create' : 'edit');
      
      // 通知
      window.KB.shared.notify(`記事「${article.title}」を${isNew ? '作成' : '更新'}しました`);
      
      return savedArticle;
    } catch (error) {
      console.error('記事保存エラー:', error);
      throw error;
    }
  },
  
  /**
   * 記事を取得する
   * @param {string} id 記事ID
   * @returns {Promise<Object>} 記事オブジェクト
   */
  get: async function(id) {
    return await window.KB.database.get(id);
  },
  
  /**
   * すべての記事を取得する
   * @returns {Promise<Array>} 記事の配列
   */
  getAll: async function() {
    return await window.KB.database.getAll();
  },
  
  /**
   * 記事を削除する
   * @param {string} id 記事ID
   * @returns {Promise<boolean>} 成功したかどうか
   */
  delete: async function(id) {
    try {
      // ロックを確認
      const lock = await window.KB.shared.checkLock(id);
      if (lock) {
        throw new Error(`この記事は ${lock.user} によって編集中です`);
      }
      
      // 削除実行
      await window.KB.database.delete(id);
      
      // 通知
      window.KB.shared.notify('記事を削除しました');
      
      return true;
    } catch (error) {
      console.error('記事削除エラー:', error);
      throw error;
    }
  },
  
  /**
   * 記事の編集を開始する
   * @param {string} id 記事ID
   * @returns {Promise<Object>} 記事オブジェクト
   */
  edit: async function(id) {
    // ロック確認と取得
    const canEdit = await window.KB.shared.checkAndLock(id);
    if (!canEdit) {
      throw new Error('この記事は現在編集できません');
    }
    
    // 記事を取得
    const article = await window.KB.database.get(id);
    if (!article) {
      throw new Error('記事が見つかりませんでした');
    }
    
    return article;
  },
  
  /**
   * 編集終了（ロック解除）
   * @param {string} id 記事ID
   */
  endEdit: function(id) {
    if (id) {
      window.KB.shared.unlock(id);
      window.KB.shared.stopInterval(id);
    }
  },
  
  /**
   * タイトルで検索
   * @param {string} query 検索クエリ
   * @returns {Promise<Array>} 記事の配列
   */
  searchByTitle: async function(query) {
    return await window.KB.database.searchByTitle(query);
  },
  
  /**
   * 全文検索
   * @param {string} query 検索クエリ
   * @returns {Promise<Array>} 記事の配列
   */
  searchFullText: async function(query) {
    return await window.KB.database.searchFullText(query);
  }
};

/**
 * インポート/エクスポートAPI
 */
window.KB.io = {
  /**
   * 記事をJSONファイルとしてエクスポート
   * @param {Object} article 記事オブジェクト
   * @returns {boolean} 成功したかどうか
   */
  exportArticle: function(article) {
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
  },
  
  /**
   * 複数記事をJSONファイルとしてエクスポート
   * @param {Array} articles 記事の配列
   * @returns {boolean} 成功したかどうか
   */
  exportArticles: function(articles) {
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
  },
  
  /**
   * JSONファイルから記事をインポート
   * @param {File} file ファイルオブジェクト
   * @returns {Promise<Object>} インポートされた記事
   */
  importFromFile: function(file) {
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
              await window.KB.database.save(article);
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
  },
  
  /**
   * 複数のJSONファイルを処理
   * @param {FileList} files ファイルリスト
   * @returns {Promise<Object>} 処理結果
   */
  processJsonFiles: async function(files) {
    return await window.KB.storage.processJsonFiles(files);
  }
};

/**
 * タグ管理API
 */
window.KB.tags = {
  /**
   * タグを追加
   * @param {Object} article 記事オブジェクト
   * @param {string} tag タグ
   * @returns {boolean} 成功したかどうか
   */
  add: function(article, tag) {
    if (!tag || typeof tag !== 'string') return false;
    tag = tag.trim();
    if (tag === '') return false;
    
    if (!article.tags) article.tags = [];
    if (article.tags.includes(tag)) return false;
    
    article.tags.push(tag);
    return true;
  },
  
  /**
   * タグを削除
   * @param {Object} article 記事オブジェクト
   * @param {string} tag タグ
   * @returns {boolean} 成功したかどうか
   */
  remove: function(article, tag) {
    if (!article.tags || !tag) return false;
    const index = article.tags.indexOf(tag);
    if (index === -1) return false;
    
    article.tags.splice(index, 1);
    return true;
  },
  
  /**
   * 複数タグを設定
   * @param {Object} article 記事オブジェクト
   * @param {string} tagsString カンマ区切りのタグ文字列
   */
  setFromString: function(article, tagsString) {
    const tags = tagsString
      .split(/[,\s]+/)
      .map(tag => tag.trim())
      .filter(tag => tag !== '');
    
    article.tags = [...new Set(tags)]; // 重複除去
  },
  
  /**
   * すべてのタグを取得
   * @returns {Promise<Array>} タグの配列
   */
  getAll: async function() {
    const articles = await window.KB.database.getAll();
    const tags = new Set();
    
    articles.forEach(article => {
      if (article.tags && Array.isArray(article.tags)) {
        article.tags.forEach(tag => tags.add(tag));
      }
    });
    
    return [...tags].sort();
  }
};

// グローバルに公開
window.KB = window.KB; 