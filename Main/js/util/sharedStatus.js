/**
 * 共有ステータス管理モジュール - 複数端末間のロック状態と通知を管理
 */

// 基本設定
window.KB = window.KB || {};
window.KB.shared = window.KB.shared || {};
window.KB.lockInterval = window.KB.lockInterval || {};

// 変数のローカル参照は削除
// const KB = window.KB;

const POLL_INTERVAL = 15000, LOCK_DURATION = 300000, SHARED_FILE_KEY = 'kb_shared_status';
const getUser = () => localStorage.getItem('user_name') || 'user_' + Math.random().toString(36).slice(2, 8);

// ストレージ操作
const getStatus = async () => {
  try {
    const data = localStorage.getItem(SHARED_FILE_KEY);
    return data ? JSON.parse(data) : { locks: {}, updates: [], lastChecked: {} };
  } catch (e) {
    console.error('ステータス取得エラー:', e);
    return { locks: {}, updates: [], lastChecked: {} };
  }
};

const saveStatus = async (status) => {
  try {
    localStorage.setItem(SHARED_FILE_KEY, JSON.stringify(status));
    return true;
  } catch (e) {
    console.error('ステータス保存エラー:', e);
    return false;
  }
};

// ロック機能
const lock = async (id, mode = 'edit') => {
  try {
    const status = await getStatus();
    const user = getUser();
    const existing = status.locks[id];
    const now = Date.now();
    
    if (existing && existing.user !== user && now - existing.timestamp < LOCK_DURATION) return false;
    
    status.locks[id] = { user, timestamp: now, mode };
    return await saveStatus(status);
  } catch (e) {
    console.error('ロックエラー:', e);
    return false;
  }
};

const unlock = async (id) => {
  try {
    const status = await getStatus();
    if (status.locks[id]?.user === getUser()) {
      delete status.locks[id];
      await saveStatus(status);
    }
    return true;
  } catch (e) {
    console.error('ロック解除エラー:', e);
    return false;
  }
};

const checkLock = async (id) => {
  const status = await getStatus();
  const lock = status.locks[id];
  return (!lock || Date.now() - lock.timestamp >= LOCK_DURATION) ? null : lock;
};

// 更新管理
const recordUpdate = async (article, action = 'edit') => {
  if (!article?.id) return false;
  
  try {
    const status = await getStatus();
    status.updates.unshift({
      type: action,
      articleId: article.id,
      title: article.title || '(無題)',
      user: getUser(),
      timestamp: Date.now()
    });
    
    if (status.updates.length > 100) status.updates.length = 100;
    return await saveStatus(status);
  } catch (e) {
    console.error('更新記録エラー:', e);
    return false;
  }
};

const checkUpdates = async () => {
  const status = await getStatus();
  const user = getUser();
  const lastChecked = status.lastChecked[user] || Date.now();
  
  const newUpdates = status.updates.filter(u => u.timestamp > lastChecked && u.user !== user);
  
  status.lastChecked[user] = Date.now();
  await saveStatus(status);
  
  return newUpdates;
};

// UI関連
const notify = (msg) => {
  // ブラウザ通知
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('KB通知', { body: msg });
    return;
  }
  
  // 画面通知
  const div = document.createElement('div');
  div.className = 'kb-notification';
  div.textContent = msg;
  
  Object.assign(div.style, {
    position: 'fixed', top: '20px', right: '20px', 
    backgroundColor: '#4CAF50', color: 'white',
    padding: '10px 20px', borderRadius: '5px', 
    boxShadow: '0 2px 5px rgba(0,0,0,0.2)', zIndex: '9999'
  });
  
  document.body.appendChild(div);
  
  setTimeout(() => {
    div.style.opacity = '0';
    div.style.transition = 'opacity 0.5s';
    setTimeout(() => document.body.removeChild(div), 500);
  }, 5000);
};

// UI更新
const updateListUI = async () => {
  const container = document.getElementById('article-list-container');
  if (!container) return;
  
  const status = await getStatus();
  const user = getUser();
  const now = Date.now();
  
  container.querySelectorAll('[data-article-id]').forEach(el => {
    const id = el.dataset.articleId;
    const lock = status.locks[id];
    const lockEl = el.querySelector('.lock-info');
    const editBtn = el.querySelector('.edit-button');
    
    if (!lockEl) return;
    
    if (lock && now - lock.timestamp < LOCK_DURATION) {
      lockEl.textContent = `編集中: ${lock.user}`;
      lockEl.style.display = 'inline-block';
      if (editBtn && lock.user !== user) editBtn.disabled = true;
    } else {
      lockEl.style.display = 'none';
      if (editBtn) editBtn.disabled = false;
    }
  });
};

// 編集用
const checkAndLock = async (id) => {
  const lock = await checkLock(id);
  
  if (lock) {
    if (lock.user === getUser()) return true;
    if (!confirm(`この記事は ${lock.user} によって編集中です。強制的に開きますか？`)) return false;
  }
  
  const success = await window.KB.shared.lock(id);
  
  if (success) {
    const intervalId = setInterval(() => window.KB.shared.lock(id), 180000);
    window.KB.lockInterval = window.KB.lockInterval || {};
    window.KB.lockInterval[id] = intervalId;
  }
  
  return success;
};

const stopInterval = (id) => {
  if (window.KB.lockInterval?.[id]) {
    clearInterval(window.KB.lockInterval[id]);
    delete window.KB.lockInterval[id];
  }
};

// 更新確認
const checkAll = async () => {
  const updates = await checkUpdates();
  
  if (updates.length > 0) {
    const newCount = updates.filter(u => u.type === 'create').length;
    const editCount = updates.filter(u => u.type === 'edit').length;
    
    if (newCount > 0) notify(`${newCount}件の新しい記事が作成されました`);
    if (editCount > 0) notify(`${editCount}件の記事が更新されました`);
  }
  
  updateListUI();
};

// API公開
window.KB.shared = {
  lock,
  unlock,
  checkLock,
  recordUpdate,
  checkUpdates,
  notify,
  checkAndLock,
  stopInterval,
  startMonitoring: () => {
    checkAll();
    return setInterval(checkAll, POLL_INTERVAL);
  }
};

window.KB = window.KB;

// 初期化
document.addEventListener('DOMContentLoaded', () => setTimeout(() => window.KB.shared.startMonitoring(), 1000)); 