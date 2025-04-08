# 共有ステータス管理モジュール

## 概要

`sharedStatus.js`は複数ユーザー間での記事編集の衝突を防ぎ、リアルタイムな状態共有を実現するモジュールです。記事の編集ロック機能、更新通知、UI更新などの機能を提供し、複数ユーザーが同時に同じナレッジベースを使用する際の整合性を確保します。

## 基本構造

このモジュールは以下の主要コンポーネントで構成されています：

1. **基本設定** - 定数と共通関数
2. **ストレージ操作** - 共有状態の保存と取得
3. **ロック機能** - 記事編集のロック管理
4. **更新管理** - 記事更新の記録と確認
5. **通知機能** - ユーザーへの通知表示
6. **UI更新** - 画面表示の状態反映

## 基本設定

```javascript
// 基本設定
const KB = window.KB || {};
const POLL_INTERVAL = 15000, LOCK_DURATION = 300000, SHARED_FILE_KEY = 'kb_shared_status';
const getUser = () => localStorage.getItem('user_name') || 'user_' + Math.random().toString(36).slice(2, 8);
```

主要な定数：
- **POLL_INTERVAL** - 更新確認の間隔（15秒）
- **LOCK_DURATION** - ロックの有効期間（5分）
- **SHARED_FILE_KEY** - ローカルストレージに保存するキー
- **getUser()** - 現在のユーザー名を取得する関数（ないなら自動生成）

## ストレージ操作

共有状態をローカルストレージに保存・取得する機能です。

```javascript
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
```

共有ステータスのデータ構造：
- **locks** - 記事IDをキーとしたロック情報のオブジェクト
- **updates** - 記事の更新履歴の配列
- **lastChecked** - ユーザーごとの最終確認時刻

## ロック機能

記事の編集ロックを管理する機能です。同時編集による衝突を防ぎます。

### ロックの取得

```javascript
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
```

この関数は：
1. 既存のロックを確認
2. 他のユーザーによる有効なロックがある場合は失敗
3. 自分のロックまたは期限切れのロックは上書き

### ロックの解除

```javascript
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
```

自分がロックしている記事のロックのみを解除できます。

### ロック状態の確認

```javascript
const checkLock = async (id) => {
  const status = await getStatus();
  const lock = status.locks[id];
  return (!lock || Date.now() - lock.timestamp >= LOCK_DURATION) ? null : lock;
};
```

記事のロック状態を確認し、有効なロックがあればその情報を返します。期限切れのロックはnullとして扱われます。

## 更新管理

記事の更新履歴を記録し、他のユーザーによる更新を確認する機能です。

### 更新の記録

```javascript
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
```

記事が更新されるたびに履歴に記録します。最新の更新が先頭に追加され、履歴は最大100件に制限されます。

### 更新の確認

```javascript
const checkUpdates = async () => {
  const status = await getStatus();
  const user = getUser();
  const lastChecked = status.lastChecked[user] || Date.now();
  
  const newUpdates = status.updates.filter(u => u.timestamp > lastChecked && u.user !== user);
  
  status.lastChecked[user] = Date.now();
  await saveStatus(status);
  
  return newUpdates;
};
```

最後の確認以降に他のユーザーによって行われた更新を取得します。また、現在の時刻を最終確認時刻として記録します。

## 通知機能

ユーザーに情報を通知する機能です。

```javascript
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
```

この関数は2つの通知方法を提供します：
1. ブラウザのネイティブ通知（許可されている場合）
2. カスタムDOM要素による画面内通知（5秒後にフェードアウト）

## UI更新

記事リストのUI表示を更新して、ロック状態を反映する機能です。

```javascript
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
```

この関数は記事リスト内の各記事要素を処理し：
1. ロック状態に基づいて「編集中」表示を更新
2. 他のユーザーによってロックされている記事の編集ボタンを無効化

## 編集用ヘルパー関数

記事編集を開始する際の便利な機能を提供します。

### 編集開始時のロック取得

```javascript
const checkAndLock = async (id) => {
  const lock = await checkLock(id);
  
  if (lock) {
    if (lock.user === getUser()) return true;
    if (!confirm(`この記事は ${lock.user} によって編集中です。強制的に開きますか？`)) return false;
  }
  
  const success = await KB.shared.lock(id);
  
  if (success) {
    const intervalId = setInterval(() => KB.shared.lock(id), 180000);
    KB.lockInterval = KB.lockInterval || {};
    KB.lockInterval[id] = intervalId;
  }
  
  return success;
};
```

この関数は：
1. 記事の現在のロック状態を確認
2. 他のユーザーによるロックがある場合、上書きの確認を求める
3. ロックを取得し、成功した場合は自動更新タイマーを設定（3分ごと）

### ロック自動更新の停止

```javascript
const stopInterval = (id) => {
  if (KB.lockInterval?.[id]) {
    clearInterval(KB.lockInterval[id]);
    delete KB.lockInterval[id];
  }
};
```

編集終了時にロックの自動更新タイマーを停止します。

## 更新確認とモニタリング

定期的な更新確認を実行し、必要に応じて通知を表示する機能です。

```javascript
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
```

この関数は：
1. 新しい更新を確認
2. 新規作成と編集の件数を集計
3. 更新があれば通知を表示
4. UI表示を更新

## 公開API

モジュールが外部に公開する機能です。

```javascript
KB.shared = {
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
```

主要な公開API：
- **lock(id, mode)** - 記事のロックを取得
- **unlock(id)** - 記事のロックを解除
- **checkLock(id)** - 記事のロック状態を確認
- **recordUpdate(article, action)** - 記事の更新を記録
- **checkUpdates()** - 新しい更新を確認
- **notify(msg)** - 通知を表示
- **checkAndLock(id)** - ロックを確認して取得（編集開始用）
- **stopInterval(id)** - ロック自動更新を停止（編集終了用）
- **startMonitoring()** - 定期的な更新確認を開始

## 初期化

ページロード時に自動的に監視を開始します。

```javascript
document.addEventListener('DOMContentLoaded', () => setTimeout(() => KB.shared.startMonitoring(), 1000));
```

DOM読み込み完了後、1秒後に監視を開始します（他のコンポーネントの初期化を待つため）。

## 使用例

### 記事編集の開始

```javascript
async function editArticle(id) {
  try {
    // ロックを確認して取得
    const canEdit = await KB.shared.checkAndLock(id);
    if (!canEdit) {
      alert('この記事は現在編集できません');
      return;
    }
    
    // 記事データを取得
    const article = await KB.database.get(id);
    if (!article) {
      alert('記事が見つかりません');
      return;
    }
    
    // エディタを設定
    setupEditor(article);
    
  } catch (error) {
    console.error('編集開始エラー:', error);
  }
}
```

### 記事編集の終了

```javascript
function finishEditing(id, save = true) {
  try {
    // 保存処理
    if (save) {
      saveArticle();
    }
    
    // ロックを解除
    KB.shared.unlock(id);
    KB.shared.stopInterval(id);
    
    // エディタをクリア
    clearEditor();
    
  } catch (error) {
    console.error('編集終了エラー:', error);
  }
}
```

### 更新の記録

```javascript
async function updateArticle(article) {
  try {
    // データベースに保存
    await KB.database.save(article);
    
    // 更新を記録
    await KB.shared.recordUpdate(article, 'edit');
    
    // 成功メッセージ
    KB.shared.notify('記事を更新しました');
    
  } catch (error) {
    console.error('更新エラー:', error);
  }
}
```

### 記事リストUIの実装例

```html
<div id="article-list-container">
  <div class="article-item" data-article-id="article_123">
    <h3>記事タイトル</h3>
    <div class="article-meta">
      <span class="lock-info" style="display: none;"></span>
      <button class="edit-button">編集</button>
    </div>
  </div>
  <!-- 他の記事アイテム -->
</div>
```

## 技術的考慮点

### 制限事項

- **同期方法** - ローカルストレージを使用するため、同じブラウザ内（異なるタブ）でのみ同期が機能します。異なるデバイス間では機能しません。
- **競合解決** - 単純なタイムスタンプベースのロックを使用しており、より複雑な競合解決は実装されていません。
- **有効期限** - ロックには5分の有効期限があり、それ以降は自動的に解放されます。編集中はロックが3分ごとに更新されます。

### パフォーマンス

- 更新履歴は最大100件に制限されています。
- ポーリング間隔は15秒に設定されており、負荷とリアルタイム性のバランスを取っています。

### 拡張のヒント

- サーバーベースのロック機構に移行することで、複数デバイス間でも同期が可能になります。
- WebSocketを使用することで、ポーリングの代わりにリアルタイム通知を実装できます。
- 差分同期を導入することで、より効率的な更新処理が可能になります。 