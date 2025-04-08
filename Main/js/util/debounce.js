/**
 * デバウンス関数
 * 連続して呼び出される処理を間引き、最後の呼び出しから一定時間後に実行する
 * 
 * @param {Function} func 実行する関数
 * @param {number} wait 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */

// 名前空間の初期化
const KB = window.KB || {};

function debounce(func, wait = 300) {
  let timeout;
  
  return function(...args) {
    const context = this;
    
    // 前回のタイマーをクリア
    clearTimeout(timeout);
    
    // 新しいタイマーをセット
    timeout = setTimeout(() => {
      func.apply(context, args);
    }, wait);
  };
}

/**
 * 使用例:
 * 
 * // 検索入力フィールドの処理をデバウンス
 * const searchInput = document.getElementById('search-input');
 * 
 * // 通常の関数
 * function handleSearch(event) {
 *   const query = event.target.value;
 *   // 検索処理
 *   console.log('検索:', query);
 * }
 * 
 * // デバウンスを適用
 * const debouncedSearch = debounce(handleSearch, 500);
 * 
 * // イベントリスナーに登録
 * searchInput.addEventListener('input', debouncedSearch);
 */

// 名前空間に追加
KB.debounce = debounce;

// グローバルに公開
window.KB = KB; 