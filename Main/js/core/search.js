/**
 * 検索UI処理
 * 検索機能と結果表示を管理
 */

// 名前空間の初期化
const KB = window.KB || {};
KB.search = {};

// 現在の検索モード
let isFullText = false;

/**
 * 検索UIの初期化
 */
function initSearchUI() {
  const input = document.getElementById('search-input');
  const mode = document.getElementById('search-mode');
  const results = document.getElementById('search-results');
  
  if (!input || !results) return;
  
  // 検索実行
  const search = () => {
    const query = input.value.trim();
    
    // 2文字未満はクリア
    if (query.length < 2) {
      results.innerHTML = '';
      return;
    }
    
    // 検索実行と結果表示
    const found = isFullText ? KB.indexer.searchFullText(query) : KB.indexer.searchByTitle(query);
    showResults(found, query);
  };
  
  // デバウンス処理
  const debouncedSearch = KB.debounce ? KB.debounce(search, 300) : search;
  
  // イベント設定
  input.addEventListener('input', debouncedSearch);
  
  if (mode) {
    mode.addEventListener('change', () => {
      isFullText = mode.value === 'fulltext';
      debouncedSearch();
    });
  }
  
  // URL検索パラメータ対応
  const q = new URLSearchParams(location.search).get('q');
  if (q) {
    input.value = q;
    search();
  }
  
  // 結果表示関数
  function showResults(articles, query) {
    // 結果がない場合
    if (!articles?.length) {
      results.innerHTML = `<div class="no-results">「${query}」に一致する記事はありません</div>`;
      return;
    }
    
    // 結果ヘッダー
    results.innerHTML = `
      <div class="results-header">${articles.length}件の検索結果</div>
      <div class="results-list"></div>
    `;
    
    const list = results.querySelector('.results-list');
    
    // 各記事の結果を生成
    articles.forEach(art => {
      // スニペット生成
      let snippet = '';
      if (art.content?.length) {
        const texts = art.content
          .filter(b => b.text)
          .map(b => b.text);
        
        if (texts.length) {
          snippet = texts.join(' ').substring(0, 150) + '...';
        }
      }
      
      // 結果アイテム生成
      const item = document.createElement('div');
      item.className = 'result-item';
      item.innerHTML = `
        <h3 class="result-title">${art.title || '無題'}</h3>
        <div class="result-meta">${art.category ? `カテゴリ: ${art.category}` : ''}</div>
        <div class="result-snippet">${snippet || 'コンテンツがありません'}</div>
      `;
      
      // クリックで記事表示
      item.addEventListener('click', () => {
        location.href = `view.html?id=${art.id}`;
      });
      
      list.appendChild(item);
    });
  }
}

// 名前空間に追加
KB.search = {
  init: initSearchUI
};

// グローバルに公開
window.KB = KB; 