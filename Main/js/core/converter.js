/**
 * マークダウンからHTML変換モジュール
 * 記事データをHTML表示用に変換する機能を提供
 */

// 名前空間の初期化
window.KB = window.KB || {};
window.KB.converter = window.KB.converter || {};

// コンバータモジュール
const Converter = (function() {
  'use strict';
  
  // 頻繁に使用するスタイル定義
  const STYLES = {
    heading1: 'font-size: 26px; color: #2d3748; font-weight: 700; margin: 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;',
    heading2: 'font-size: 22px; color: #2d3748; font-weight: 700; margin: 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;',
    heading3: 'font-size: 18px; color: #2d3748; font-weight: 600; border-left: 3px solid #4a5568; padding-left: 10px; margin: 0;',
    paragraph: 'margin: 0; font-size: 16px; line-height: 1.8; color: #4a5568; text-align: justify; letter-spacing: 0.01em;',
    listContainer: 'margin-bottom: 20px; background-color: #f8fafc; border-radius: 8px; padding: 15px 15px 15px 20px;',
    orderedList: 'margin: 0; padding-left: 30px; color: #2d3748; font-size: 16px; line-height: 1.8; counter-reset: item;',
    unorderedList: 'margin: 0; padding-left: 25px; color: #2d3748; font-size: 16px; line-height: 1.8; list-style-type: none;',
    nestedList: 'margin: 12px 0 0 20px; padding-left: 20px;',
    imageContainer: 'text-align: center; background-color: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; margin: 30px auto;',
    image: 'max-width: 100%; height: auto; border-radius: 6px; box-shadow: 0 3px 8px rgba(0,0,0,0.1);',
    imageCaption: 'margin-top: 12px; font-size: 14px; color: #718096; font-style: italic; line-height: 1.5; text-align: center;',
    article: 'border: 1px solid #e8e8e8; border-radius: 8px; padding: 25px; box-shadow: 0 2px 8px rgba(0,0,0,0.05); background-color: #fff;',
    headerContainer: 'margin-bottom: 35px; border-bottom: none; padding-bottom: 0;',
    articleTitle: 'margin: 0 0 15px 0; font-size: 30px; color: #2d3748; font-weight: 600; letter-spacing: -0.3px; line-height: 1.3;',
    metaContainer: 'font-size: 14px; color: #666; margin-bottom: 20px; display: flex; align-items: center; flex-wrap: wrap; justify-content: space-between;',
    categoryTag: 'display: inline-block; background-color: #edf2f7; color: #4a5568; padding: 3px 8px; border-radius: 3px; font-weight: 400; border: 1px solid #e2e8f0; font-size: 14px; margin-right: 6px;',
    tag: 'display: inline-block; background-color: #e6f6ff; color: #2b6cb0; padding: 3px 8px; border-radius: 3px; font-size: 14px; margin-right: 6px; font-weight: 400; border: 1px solid #bfdfff;',
    separator: 'height: 4px; background: linear-gradient(to right, #e2e8f0, #f8fafc, #e2e8f0); border-radius: 2px; margin-bottom: 20px;',
    codeBlock: 'background-color: #1a202c; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 20px 0;'
  };
  
  // インラインフォーマットのパターンと変換関数
  const INLINE_FORMATS = [
    { pattern: /__([^_]+?)__/g, replacement: '<u style="text-decoration: underline;">$1</u>' },
    { pattern: /\*\*([^*]+?)\*\*/g, replacement: '<strong style="font-weight: 700;">$1</strong>' },
    { pattern: /`([^`]+?)`/g, replacement: '<code style="font-family: monospace; background-color: #f1f5f9; padding: 2px 4px; border-radius: 3px; font-size: 0.9em; color: #1e40af; border: 1px solid #cbd5e0;">$1</code>' },
    { pattern: /_([^_]+?)_/g, replacement: '<em style="font-style: italic; color: #4a5568;">$1</em>' },
    { pattern: /==([^=]+?)==/g, replacement: '<span style="color: #3182ce;">$1</span>' },
    { pattern: /!!([^!]+?)!!/g, replacement: '<span style="color: #e53e3e;">$1</span>' },
    { pattern: /@@([^@]+?)@@/g, replacement: '<span style="color: #38a169;">$1</span>' },
    { pattern: /\+\+([^+]+?)\+\+/g, replacement: '<mark style="background-color: #fefcbf; padding: 0 3px;">$1</mark>' }
  ];
  
  /**
   * インラインフォーマットを処理する
   */
  function processInlineFormatting(text) {
    if (!text) return '';
    let result = text;
    for (let format of INLINE_FORMATS) {
      result = result.replace(format.pattern, format.replacement);
    }
    return result;
  }
  
  // TODO: インライン記法の組み合わせ対応
  // - 「**太字の中の_イタリック_文字**」のような組み合わせに対応する
  // - 内部から外部への処理順序の改善または再帰的処理の実装が必要
  // - パターンの順序にも注意して実装する
  
  /**
   * 日付フォーマット
   */
  function formatDate(dateString) {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
      return dateString || '';
    }
  }
  
  /**
   * リストをHTMLに変換
   */
  function renderList(items, style, nestLevel = 0) {
    if (items.length === 0) return '';
    
    const isOrdered = style === 'ordered';
    const listItems = items.map((item, index) => {
      const isLast = index === items.length - 1;
      
      // ネストされたリストがあるか確認
      const hasNestedList = item.nestedItems && item.nestedItems.length > 0;
      const itemText = processInlineFormatting(item.text || item);
      const nestedListHtml = hasNestedList 
        ? renderList(item.nestedItems, item.nestedStyle || style, nestLevel + 1) 
        : '';
      
      // ネストレベルに応じた色を選択（薄めの色）
      const markerColor = nestLevel > 0 ? '#94a3b8' : '#4a5568';
      
      if (isOrdered) {
        return `
          <li style="margin-bottom: ${isLast ? '0' : '12px'}; position: relative; padding-left: 8px; list-style-type: none; counter-increment: item;">
            <span style="position: absolute; left: -30px; color: #ffffff; font-weight: 600;">
              <span style="display: inline-block; width: 24px; height: 24px; line-height: 24px; text-align: center; background-color: ${markerColor}; border-radius: 4px;">
                ${index + 1}
              </span>
            </span>
            ${itemText}
            ${nestedListHtml}
          </li>
        `;
      } else {
        return `
          <li style="margin-bottom: ${isLast ? '0' : '12px'}; position: relative; padding-left: 12px;">
            <span style="display: inline-block; width: 8px; height: 8px; background-color: ${markerColor}; border-radius: 2px; position: absolute; left: -12px; top: 12px;"></span>
            ${itemText}
            ${nestedListHtml}
          </li>
        `;
      }
    }).join('');
    
    const listStyle = isOrdered ? STYLES.orderedList : STYLES.unorderedList;
    const nestingStyle = nestLevel > 0 ? 'margin: 12px 0 0 20px; padding-left: 20px;' : '';
    
    if (nestLevel > 0) {
      return `<${isOrdered ? 'ol' : 'ul'} style="${listStyle}; ${nestingStyle}">${listItems}</${isOrdered ? 'ol' : 'ul'}>`;
    } else {
      return `<div style="${STYLES.listContainer}"><${isOrdered ? 'ol' : 'ul'} style="${listStyle}">${listItems}</${isOrdered ? 'ol' : 'ul'}></div>`;
    }
  }
  
  /**
   * 記事データをHTMLに変換
   */
  function articleToHtml(article) {
    if (!article || !article.content) return '';
    
    // メタデータ部分
    const title = article.title || '';
    const category = article.category ? 
      `<span style="${STYLES.categoryTag}">カテゴリ: ${article.category}</span>` : '';
    
    const tags = article.tags && article.tags.length ? 
      article.tags.map(tag => `<span style="${STYLES.tag}">${tag}</span>`).join('') : '';
    
    const dateInfo = article.updatedAt ? 
      `<span style="color: #718096;">最終更新: ${formatDate(article.updatedAt)}</span>` : '';
    
    const metaHtml = `
      <header style="${STYLES.headerContainer}">
        <h1 style="${STYLES.articleTitle}">${title}</h1>
        <div style="${STYLES.metaContainer}">
          <div style="display: flex; align-items: center; flex-wrap: wrap;">${category}${tags}</div>
          ${dateInfo}
        </div>
        <div style="${STYLES.separator}"></div>
      </header>
    `;
    
    // コンテンツ部分 - 常にマークダウン文字列を処理
    const content = typeof article.content === 'string' ? article.content : '';
    const contentHtml = markdownToHtml(content);
    
    return `<article style="${STYLES.article}">${metaHtml}<div class="article-content">${contentHtml}</div></article>`;
  }
  
  /**
   * マークダウン文字列をHTMLに変換
   */
  function markdownToHtml(markdown) {
    if (!markdown) return '';
    
    let html = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    
    // 見出し
    html = html
      .replace(/^# (.+)$/gm, `<div style="margin: 30px 0 16px 0;"><h1 style="${STYLES.heading1}">$1</h1></div>`)
      .replace(/^## (.+)$/gm, `<div style="margin: 30px 0 16px 0;"><h2 style="${STYLES.heading2}">$1</h2></div>`)
      .replace(/^### (.+)$/gm, `<div style="margin: 25px 0 14px 0;"><h3 style="${STYLES.heading3}">$1</h3></div>`)
      .replace(/^#### (.+)$/gm, `<div style="margin: 25px 0 14px 0;"><h4 style="font-size: 16px; color: #2d3748; font-weight: 500; margin: 0;">$1</h4></div>`)
      .replace(/^##### (.+)$/gm, `<div style="margin: 25px 0 14px 0;"><h5 style="font-size: 14px; color: #2d3748; font-weight: 500; margin: 0;">$1</h5></div>`);
    
    // コードブロック - 改良版
    html = html.replace(/```([^`]+)```/g, '<pre style="background-color: #1a202c; padding: 15px; border-radius: 6px; overflow-x: auto; margin: 20px 0;"><code style="font-family: monospace; color: #e2e8f0; display: block; line-height: 1.6;">$1</code></pre>');
    
    // インラインフォーマット
    html = processInlineFormatting(html);
    
    // リスト処理
    const lines = html.split('\n');
    const processedLines = [];
    let inOrderedList = false;
    let inUnordedList = false;
    let listItems = [];
    let currentListLevel = 0;
    let listStack = [];
    
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      const isLastLine = i === lines.length - 1;
      
      // リストレベルの計算
      const getIndentLevel = (line) => {
        const indent = line.match(/^(\s*)/)[0].length;
        return Math.floor(indent / 2);
      };
      
      // 番号付きリスト
      if (line.match(/^\s*\d+\.\s+(.+)$/)) {
        const content = line.replace(/^\s*\d+\.\s+(.+)$/, '$1');
        const indentLevel = getIndentLevel(line);
        
        if (!inOrderedList) {
          inOrderedList = true;
          listItems = [];
          currentListLevel = indentLevel;
          listStack = [{ items: listItems, style: 'ordered', level: indentLevel }];
        } else if (indentLevel > currentListLevel) {
          // ネストされたリスト開始
          const parentItem = listItems[listItems.length - 1];
          if (!parentItem.nestedItems) {
            parentItem.nestedItems = [];
            parentItem.nestedStyle = 'ordered';
          }
          listStack.push({ items: parentItem.nestedItems, style: 'ordered', level: indentLevel });
        } else if (indentLevel < currentListLevel) {
          // 上位レベルに戻る
          while (listStack.length > 1 && listStack[listStack.length - 1].level > indentLevel) {
            listStack.pop();
          }
        }
        
        currentListLevel = indentLevel;
        const currentList = listStack[listStack.length - 1].items;
        currentList.push({ text: content });
        
        if (isLastLine || !lines[i + 1].match(/^\s*\d+\.\s+(.+)$/)) {
          // リスト終了
          processedLines.push(renderList(listItems, 'ordered'));
          inOrderedList = false;
          listItems = [];
          listStack = [];
        }
      }
      // 箇条書きリスト
      else if (line.match(/^\s*[\*\-\•]\s+(.+)$/) || line.match(/^\s*・\s*(.+)$/)) {
        const content = line.replace(/^\s*[\*\-\•]\s+(.+)$/, '$1').replace(/^\s*・\s*(.+)$/, '$1');
        const indentLevel = getIndentLevel(line);
        
        if (!inUnordedList) {
          inUnordedList = true;
          listItems = [];
          currentListLevel = indentLevel;
          listStack = [{ items: listItems, style: 'unordered', level: indentLevel }];
        } else if (indentLevel > currentListLevel) {
          // ネストされたリスト開始
          const parentItem = listItems[listItems.length - 1];
          if (!parentItem.nestedItems) {
            parentItem.nestedItems = [];
            parentItem.nestedStyle = 'unordered';
          }
          listStack.push({ items: parentItem.nestedItems, style: 'unordered', level: indentLevel });
        } else if (indentLevel < currentListLevel) {
          // 上位レベルに戻る
          while (listStack.length > 1 && listStack[listStack.length - 1].level > indentLevel) {
            listStack.pop();
          }
        }
        
        currentListLevel = indentLevel;
        const currentList = listStack[listStack.length - 1].items;
        currentList.push({ text: content });
        
        if (isLastLine || !(lines[i + 1].match(/^\s*[\*\-\•]\s+(.+)$/) || lines[i + 1].match(/^\s*・\s*(.+)$/))) {
          // リスト終了
          processedLines.push(renderList(listItems, 'unordered'));
          inUnordedList = false;
          listItems = [];
          listStack = [];
        }
      }
      // 画像
      else if (line.match(/!\[([^\]]*)\]\(([^)]+)\)/)) {
        line = line.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, src) => `
          <div style="${STYLES.imageContainer}">
            <figure style="margin: 0; padding: 0;">
              <img src="${src}" alt="${alt}" style="${STYLES.image}" />
              ${alt ? `<figcaption style="${STYLES.imageCaption}">${alt}</figcaption>` : ''}
            </figure>
          </div>
        `);
        processedLines.push(line);
      }
      // 空行
      else if (line.trim() === '') {
        if (processedLines.length > 0 && processedLines[processedLines.length - 1] !== '') {
          processedLines.push('');
        }
      }
      // 通常の行
      else {
        if (line.startsWith('<div') || line.startsWith('<pre')) {
          processedLines.push(line);
        } else {
          processedLines.push(`<div style="margin-bottom: 18px;"><p style="${STYLES.paragraph}">${line}</p></div>`);
        }
      }
    }
    
    return processedLines.join('\n');
  }
  
  // 公開API
  return {
    articleToHtml,
    markdownToHtml
  };
})();

// 名前空間に追加
window.KB.converter = Converter;
window.Converter = Converter; // 互換性のため 