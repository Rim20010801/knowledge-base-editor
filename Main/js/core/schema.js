/**
 * 記事のJSONスキーマ定義
 * このスキーマは記事データの構造を定義します
 * マークダウン形式に対応するように更新
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
  
  // マークダウン形式の記事内容（テキストとして保持）
  markdown: "",
  
  // メタデータ（追加情報、オプション）
  metadata: {
    summary: "",     // 記事の要約
    status: "draft", // 記事の状態（draft/published）
    references: [],  // 参考資料のリスト
    relatedArticles: [] // 関連記事IDのリスト
  }
};

/**
 * マークダウン変換に関するヘルパー関数やパラメータ
 */
const markdownRules = {
  // マークダウン記法のサポート範囲
  supported: {
    headings: true,        // 見出し（# タイトル）
    paragraphs: true,      // 段落（空行区切り）
    emphasis: true,        // 強調（*斜体*、**太字**）
    lists: true,           // リスト（- 項目、1. 項目）
    links: true,           // リンク（[テキスト](URL)）
    images: true,          // 画像（![代替テキスト](URL)）
    blockquotes: true,     // 引用（> 引用文）
    codeBlocks: true,      // コードブロック（```言語 コード```）
    horizontalRules: true, // 水平線（---）
    tables: true,          // 表（|列1|列2|）
    strikethrough: true,   // 取り消し線（~~テキスト~~）
    taskLists: true,       // タスクリスト（- [ ] タスク）
    footnotes: false,      // 脚注（未サポート）
    definitionLists: false // 定義リスト（未サポート）
  },
  
  // 拡張マークダウン記法
  extensions: {
    highlights: true,      // ハイライト（==ハイライト==）
    underline: true,       // 下線（__下線__）
    colorText: true,       // 色付きテキスト（!!赤色テキスト!!、@@緑色テキスト@@）
    fontSize: true         // フォントサイズ（^大きいテキスト^、~小さいテキスト~）
  }
};

// 名前空間に追加
window.KB.schema = {
  article: articleSchema,
  markdownRules: markdownRules
};

// グローバルに公開（互換性のため）
window.articleSchema = articleSchema;
window.markdownRules = markdownRules;

// 名前空間をグローバルに公開
window.KB = window.KB; 