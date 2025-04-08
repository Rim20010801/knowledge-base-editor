/**
 * インデックス構築・検索処理
 * 記事データの検索インデックスを構築し、効率的な検索を提供
 */

// 名前空間の初期化
const KB = window.KB || {};
KB.indexer = {};

// シンプル検索インデックス
let idx = {title: {}, content: {}, category: {}, tags: {}};
let refs = {};

/**
 * テキストを検索用のトークンに分割
 * @param {string} text 対象テキスト
 * @returns {string[]} トークン配列
 */
function tokenize(text) {
  return text ? text.toLowerCase()
    .replace(/[,.、。！？!?（）「」…]+/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1) : [];
}

/**
 * インデックスにトークンを追加
 * @param {Object} index インデックスオブジェクト
 * @param {string} token 追加するトークン
 * @param {string} articleId 記事ID
 */
function addToIndex(index, token, articleId) {
  if (!token) return;
  
  // インデックスにトークンがなければ初期化
  if (!index[token]) {
    index[token] = new Set();
  }
  
  // トークンに記事IDを関連付け
  index[token].add(articleId);
}

/**
 * 記事データからインデックスを構築
 * @param {Array} articles 記事の配列
 */
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
  
  console.log(`インデックス構築: ${Object.keys(idx.title).length}タイトル, ${Object.keys(idx.content).length}コンテンツ`);
  return idx;
}

/**
 * タイトル検索
 * @param {string} query 検索クエリ
 * @returns {Array} 検索結果の記事配列
 */
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

/**
 * 全文検索
 * @param {string} query 検索クエリ
 * @returns {Array} 検索結果の記事配列
 */
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

/**
 * インデックスをローカルストレージに保存
 */
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

/**
 * インデックスをローカルストレージから読み込み
 */
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

// インデクサー名前空間に追加
KB.indexer = {
  buildIndex,
  searchByTitle,
  searchFullText,
  saveIndex,
  loadIndex
};

// グローバルに公開
window.KB = KB; 