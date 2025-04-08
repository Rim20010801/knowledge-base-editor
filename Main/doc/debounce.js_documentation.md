# デバウンス処理モジュール

## 概要

`debounce.js`は連続して発生するイベントを間引き、処理の頻度を制御するユーティリティ関数を提供します。特に、検索入力やウィンドウのリサイズなど、短時間に何度も実行される可能性のあるイベントハンドラの最適化に役立ちます。

## 基本機能

デバウンス処理とは、連続した関数呼び出しを一定時間経過後の1回だけに制限する技術です。例えば、ユーザーがキーボードで文字を連続入力するたびにAPIリクエストを送信するのではなく、入力が一時停止してから一定時間（例：300ミリ秒）経過後に1度だけリクエストを送信するように制御できます。

## 実装

```javascript
/**
 * デバウンス関数
 * 連続して呼び出される処理を間引き、最後の呼び出しから一定時間後に実行する
 * 
 * @param {Function} func 実行する関数
 * @param {number} wait 待機時間（ミリ秒）
 * @returns {Function} デバウンスされた関数
 */
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
```

### パラメータ

- **func** (Function): デバウンス処理を適用したい関数
- **wait** (number): 待機時間（ミリ秒）、デフォルトは300ms

### 戻り値

- **Function**: デバウンス処理が適用された関数

### 動作原理

1. デバウンス関数は、内部でタイムアウトIDを保持するクロージャを作成
2. デバウンスされた関数が呼び出されるたびに:
   - 前回セットされたタイマーをキャンセル（`clearTimeout`）
   - 新しいタイマーをセット（`setTimeout`）
3. 連続呼び出しでは常に前回のタイマーがリセットされるため、最後の呼び出しから`wait`ミリ秒経過後にのみ実際の関数が実行される

## 使用例

### 検索処理への適用

```javascript
// 検索入力フィールドの処理をデバウンス
const searchInput = document.getElementById('search-input');

// 通常の関数
function handleSearch(event) {
  const query = event.target.value;
  // 検索処理
  console.log('検索:', query);
}

// デバウンスを適用（500ミリ秒）
const debouncedSearch = KB.debounce(handleSearch, 500);

// イベントリスナーに登録
searchInput.addEventListener('input', debouncedSearch);
```

### スクロールイベントの最適化

```javascript
// スクロール処理をデバウンス
function handleScroll() {
  // スクロール位置に基づく処理
  const scrollTop = window.scrollY;
  // ...処理内容...
}

// 100ミリ秒のデバウンスを適用
const debouncedScroll = KB.debounce(handleScroll, 100);

// イベントリスナーに登録
window.addEventListener('scroll', debouncedScroll);
```

### ウィンドウリサイズへの対応

```javascript
// リサイズ処理をデバウンス
function handleResize() {
  // ウィンドウサイズに応じたレイアウト調整
  const width = window.innerWidth;
  const height = window.innerHeight;
  // ...レイアウト調整処理...
}

// 200ミリ秒のデバウンスを適用
const debouncedResize = KB.debounce(handleResize, 200);

// イベントリスナーに登録
window.addEventListener('resize', debouncedResize);
```

## 名前空間への追加

```javascript
// 名前空間に追加
KB.debounce = debounce;

// グローバルに公開
window.KB = KB;
```

このモジュールは`KB.debounce`として他のモジュールからアクセスできます。

## デバウンスとスロットリングの違い

デバウンスと混同されがちな概念に「スロットリング」があります。両者の違いは：

- **デバウンス**: 連続したイベントの最後のもの（または最初のもの）だけを実行。例えば、ユーザーがタイピングを止めた後に検索を実行。
- **スロットリング**: 一定間隔でイベントを実行。例えば、100ミリ秒ごとに最大1回だけ処理を実行。

アプリケーションの要件に応じて適切な方法を選択します。

## パフォーマンスへの影響

デバウンス処理は以下の場面で特に効果的です：

- APIリクエストの削減
- DOM操作の最小化
- 計算コストの高い処理の頻度制限
- イベントハンドラの連続呼び出しによるUIのもたつき防止

適切な待機時間（`wait`パラメータ）の設定は、ユーザー体験とパフォーマンスのバランスに影響します：

- 短すぎる値: デバウンスの効果が薄れる
- 長すぎる値: ユーザーに遅延感を与える

一般的に、ユーザー入力には200〜500ミリ秒、視覚的なフィードバックには100〜200ミリ秒が推奨されます。 