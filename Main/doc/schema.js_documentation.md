# 記事スキーマ定義モジュール

## 概要

`schema.js`は記事データの構造を定義するスキーマモジュールです。記事オブジェクトの標準構造と、各種コンテンツブロック（見出し、段落、リスト、画像）のテンプレートを提供します。このモジュールは、記事データの一貫性と正確性を確保するための基準となります。

## 基本構造

このモジュールは以下の主要コンポーネントで構成されています：

1. **記事スキーマ** - 記事オブジェクトの基本構造
2. **ブロックテンプレート** - 各種コンテンツブロックの構造
3. **名前空間エクスポート** - KBオブジェクトへの追加

## 記事スキーマ

### 記事の基本構造

記事オブジェクトは以下のプロパティで構成されています：

```javascript
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
```

#### プロパティ説明

- **id** (string) - 一意の識別子。通常「article_」プレフィックスと現在のタイムスタンプで自動生成されます。
- **title** (string) - 記事のタイトル
- **category** (string) - 記事のカテゴリ
- **author** (string) - 作成者名
- **createdAt** (string) - 作成日時（ISO8601形式）
- **updatedAt** (string) - 更新日時（ISO8601形式）
- **tags** (Array\<string\>) - タグの配列
- **content** (Array\<Object\>) - コンテンツブロックの配列

## コンテンツブロック

記事の内容は、さまざまなタイプのコンテンツブロックで構成されます。各ブロックは`type`プロパティでタイプを識別します。

### 見出しブロック

見出しブロックは記事の見出しを表現します。

```javascript
const headingBlock = {
  type: "heading", // ブロックタイプ：見出し
  level: 2,        // 見出しレベル（1〜6）、デフォルトは2
  text: ""         // 見出しのテキスト内容
};
```

#### プロパティ説明

- **type** (string) - 常に "heading"
- **level** (number) - 見出しのレベル（1〜6）、デフォルトは2
- **text** (string) - 見出しのテキスト内容

### 段落ブロック

段落ブロックは記事の本文テキストを表現します。

```javascript
const paragraphBlock = {
  type: "paragraph", // ブロックタイプ：段落
  text: ""           // 段落のテキスト内容
};
```

#### プロパティ説明

- **type** (string) - 常に "paragraph"
- **text** (string) - 段落のテキスト内容

### 画像ブロック

画像ブロックは記事内の画像を表現します。

```javascript
const imageBlock = {
  type: "image",    // ブロックタイプ：画像
  src: "",          // 画像のパスまたはデータURI
  caption: ""       // 画像の説明（オプション）
};
```

#### プロパティ説明

- **type** (string) - 常に "image"
- **src** (string) - 画像のURL、ファイルパス、またはデータURI
- **caption** (string, optional) - 画像の説明文（キャプション）
- **alt** (string, optional) - 画像の代替テキスト（アクセシビリティ用）
- **width** (number|string, optional) - 画像の幅（ピクセル数または'100%'など）
- **height** (number|string, optional) - 画像の高さ（ピクセル数または'auto'など）

### リストブロック

リストブロックは箇条書きまたは番号付きリストを表現します。

```javascript
const listBlock = {
  type: "list",      // ブロックタイプ：リスト
  style: "unordered", // リストスタイル（ordered/unordered）
  items: []          // リスト項目の配列
};
```

#### プロパティ説明

- **type** (string) - 常に "list"
- **style** (string) - "ordered"（番号付き）または"unordered"（箇条書き）
- **items** (Array\<string\>) - リスト項目の配列

## 使用例

スキーマを使用して新しい記事オブジェクトを作成する例：

```javascript
// 新しい記事オブジェクトの作成
const newArticle = Object.assign({}, KB.schema.article);
newArticle.id = 'article_' + Date.now();
newArticle.title = '新しい記事';
newArticle.author = 'ユーザー名';
newArticle.createdAt = new Date().toISOString();
newArticle.updatedAt = new Date().toISOString();
newArticle.tags = ['メモ', '重要'];

// 見出しブロックの追加
const heading = Object.assign({}, KB.schema.blocks.heading);
heading.text = '見出し1';
heading.level = 2;
newArticle.content.push(heading);

// 段落ブロックの追加
const paragraph = Object.assign({}, KB.schema.blocks.paragraph);
paragraph.text = 'これは段落のテキストです。マークダウン風の**書式**も_サポート_しています。';
newArticle.content.push(paragraph);

// リストブロックの追加
const list = Object.assign({}, KB.schema.blocks.list);
list.style = 'ordered';
list.items = ['項目1', '項目2', '項目3'];
newArticle.content.push(list);

// 画像ブロックの追加
const image = Object.assign({}, KB.schema.blocks.image);
image.src = 'path/to/image.jpg';
image.caption = '画像の説明';
newArticle.content.push(image);

// 作成した記事を保存
KB.database.save(newArticle);
```

## エディタ連携

このスキーマはエディタUIと連携し、ユーザーが記事を作成・編集する際の構造を提供します。

- 新しいブロックの追加時に、対応するテンプレートがコピーされて使用されます。
- 作成された記事はスキーマに準拠しているため、一貫した表示と処理が可能です。

## 注意点

- このスキーマはアプリケーション内部の一貫性を保つためのものであり、サーバー側でのバリデーションは別途必要です。
- シンプルさを優先し、必要最小限のプロパティのみを定義しています。
- 互換性のため、スキーマオブジェクトはグローバル変数としても公開されていますが、新しいコードでは`KB.schema`名前空間を使用することが推奨されます。 

## 名前空間へのエクスポート

```javascript
// 名前空間の初期化
window.KB = window.KB || {};
window.KB.schema = window.KB.schema || {};

// 名前空間にスキーマを追加
window.KB.schema = {
  article: articleSchema,
  blocks: {
    heading: headingBlock,
    paragraph: paragraphBlock,
    image: imageBlock,
    list: listBlock
  }
};
```

このモジュールは、グローバルの`window.KB`名前空間の`schema`プロパティとしてスキーマ定義をエクスポートしています。これにより、アプリケーション全体から一貫したスキーマ定義にアクセスできるようになり、データの整合性が保たれます。

この名前空間パターンはアプリケーション全体で統一されており、各モジュールは自身の機能を`window.KB`の適切なプロパティに追加します。これにより名前空間の競合を防ぎ、コードの組織化と保守性が向上します。 