/**
 * 記事のJSONスキーマ定義
 * このスキーマは記事データの構造を定義します
 */

// 名前空間の初期化
window.KB = window.KB || {};
window.KB.schema = window.KB.schema || {};

// 変数のローカル参照は削除
// const KB = window.KB;

// 記事スキーマの基本構造
const articleSchema = {
  // 記事の基本情報
  id: "", // 記事の一意識別子（自動生成）
  title: "", // 記事のタイトル
  category: "", // カテゴリ
  author: "", // 作成者
  createdAt: "", // 作成日時（ISO形式：YYYY-MM-DDTHH:MM:SSZ）
  updatedAt: "", // 更新日時（ISO形式：YYYY-MM-DDTHH:MM:SSZ）
  tags: [], // タグの配列
  
  // 記事の内容（複数のブロックで構成）
  content: []
};

/**
 * コンテンツブロックのテンプレート定義
 * 各コンテンツタイプの構造を定義します
 */

// 見出しブロックのテンプレート
const headingBlock = {
  type: "heading", // ブロックタイプ：見出し
  level: 2,        // 見出しレベル（1〜6）、デフォルトは2
  text: ""         // 見出しのテキスト内容
};

// 段落（本文）ブロックのテンプレート
const paragraphBlock = {
  type: "paragraph", // ブロックタイプ：段落
  text: ""           // 段落のテキスト内容
};

// 画像ブロックのテンプレート
const imageBlock = {
  type: "image",    // ブロックタイプ：画像
  src: "",          // 画像のパスまたはデータURI
  caption: ""       // 画像の説明（オプション）
};

// リストブロックのテンプレート
const listBlock = {
  type: "list",      // ブロックタイプ：リスト
  style: "unordered", // リストスタイル（ordered/unordered）
  items: []          // リスト項目の配列
};

// 名前空間に追加
window.KB.schema = {
  article: articleSchema,
  blocks: {
    heading: headingBlock,
    paragraph: paragraphBlock,
    image: imageBlock,
    list: listBlock
  }
};

// グローバルに公開（互換性のため）
window.articleSchema = articleSchema;
window.headingBlock = headingBlock;
window.paragraphBlock = paragraphBlock;
window.imageBlock = imageBlock;
window.listBlock = listBlock;

// 名前空間をグローバルに公開
window.KB = window.KB; 