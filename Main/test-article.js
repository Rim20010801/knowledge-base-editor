/**
 * テスト用の記事オブジェクトを作成するスクリプト
 */

// ページ読み込み完了時に実行
document.addEventListener('DOMContentLoaded', function() {
  console.log('テスト用記事オブジェクト初期化スクリプトを実行します');
  
  // KB名前空間を初期化
  window.KB = window.KB || {};
  window.KB.editor = window.KB.editor || {};
  
  // テスト用記事オブジェクトを作成
  window.KB.editor.article = {
    id: 'test_article_' + Date.now(),
    title: 'テスト記事',
    category: 'テスト',
    author: 'テストシステム',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    tags: ['テスト', 'サンプル'],
    content: '# テスト記事\n\nこれはテスト用の記事です。\n\nデバッグのために自動的に作成されました。'
  };
  
  console.log('テスト用記事オブジェクトを作成しました:', window.KB.editor.article);
  
  // テストログに記録
  const testLogger = document.getElementById('test-log');
  if (testLogger) {
    testLogger.textContent += '\n\n記事オブジェクト初期化:\n' + 
      JSON.stringify(window.KB.editor.article, null, 2);
  }
  
  // オリジナルのtestSaveArticle関数を上書き
  window.testSaveArticle = function() {
    const testLogger = document.getElementById('test-log');
    let logMessage = '保存テスト実行中...\n';
    
    try {
      if (testLogger) {
        testLogger.textContent = logMessage;
      }
      
      // 記事オブジェクトの存在確認と作成
      if (!window.KB.editor.article) {
        logMessage += '記事オブジェクトが見つかりません。新しく作成します...\n';
        window.KB.editor.article = {
          id: 'test_article_' + Date.now(),
          title: '保存テスト記事',
          category: 'テスト',
          author: 'テストシステム',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: ['テスト'],
          content: '# 保存テスト\n\nこれは保存テスト用の記事です。'
        };
        logMessage += '新しい記事オブジェクトを作成しました: ' + window.KB.editor.article.id + '\n';
      } else {
        logMessage += '既存の記事オブジェクトを使用します: ' + window.KB.editor.article.id + '\n';
      }
      
      // saveArticle関数のチェック
      logMessage += '保存関数をチェックします...\n';
      
      if (typeof saveArticle === 'function') {
        logMessage += 'グローバルsaveArticle関数が見つかりました。実行します...\n';
        saveArticle()
          .then(result => {
            logMessage += '保存結果: ' + JSON.stringify(result) + '\n';
            logMessage += '保存テスト完了!';
            if (testLogger) {
              testLogger.textContent = logMessage;
            }
          })
          .catch(error => {
            logMessage += '保存エラー: ' + error.message + '\n';
            // エラーが発生した場合、IndexedDBに直接保存を試行
            logMessage += 'IndexedDBに直接保存を試みます...\n';
            saveDirectToIndexedDBAsync(window.KB.editor.article)
              .then(result => {
                logMessage += 'IndexedDB直接保存結果: ' + JSON.stringify(result) + '\n';
                logMessage += '保存テスト完了!';
                if (testLogger) {
                  testLogger.textContent = logMessage;
                }
              })
              .catch(dbError => {
                logMessage += 'IndexedDB直接保存エラー: ' + dbError.message + '\n';
                logMessage += '保存テスト失敗';
                if (testLogger) {
                  testLogger.textContent = logMessage;
                }
              });
          });
      } else {
        logMessage += 'グローバルsaveArticle関数が見つかりません。\n';
        logMessage += 'IndexedDBに直接保存を試みます...\n';
        
        // IndexedDBに直接保存
        if (typeof saveDirectToIndexedDBAsync === 'function') {
          saveDirectToIndexedDBAsync(window.KB.editor.article)
            .then(result => {
              logMessage += 'IndexedDB直接保存結果: ' + JSON.stringify(result) + '\n';
              logMessage += '保存テスト完了!';
              if (testLogger) {
                testLogger.textContent = logMessage;
              }
            })
            .catch(error => {
              logMessage += 'IndexedDB直接保存エラー: ' + error.message + '\n';
              logMessage += '保存テスト失敗';
              if (testLogger) {
                testLogger.textContent = logMessage;
              }
            });
        } else {
          logMessage += 'saveDirectToIndexedDBAsync関数も見つかりません。\n';
          logMessage += 'LocalStorageを使用して保存を試みます...\n';
          
          try {
            localStorage.setItem('kb_article_' + window.KB.editor.article.id, JSON.stringify(window.KB.editor.article));
            logMessage += 'LocalStorageへの保存成功!\n';
            logMessage += '保存テスト完了!';
          } catch (lsError) {
            logMessage += 'LocalStorage保存エラー: ' + lsError.message + '\n';
            logMessage += '保存テスト失敗';
          }
          
          if (testLogger) {
            testLogger.textContent = logMessage;
          }
        }
      }
    } catch (error) {
      logMessage += 'テスト実行中の予期しないエラー: ' + error.message + '\n';
      logMessage += '保存テスト失敗';
      
      if (testLogger) {
        testLogger.textContent = logMessage;
      }
      console.error('保存テストエラー:', error);
    }
  };
  
  // 保存テストボタンのイベントリスナーを再設定
  const saveTestBtn = document.getElementById('test-save-btn');
  if (saveTestBtn) {
    console.log('保存テストボタンを検出。イベントリスナーを設定します。');
    
    // 既存のイベントリスナーをすべて削除
    const clonedBtn = saveTestBtn.cloneNode(true);
    if (saveTestBtn.parentNode) {
      saveTestBtn.parentNode.replaceChild(clonedBtn, saveTestBtn);
    }
    
    // 新しいイベントリスナーを追加
    clonedBtn.addEventListener('click', function(event) {
      console.log('保存テストボタンがクリックされました');
      window.testSaveArticle();
    });
  }
}); 