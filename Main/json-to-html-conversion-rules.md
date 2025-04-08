# JSON→HTML変換ルール

## 基本構造

```json
{
  "id": "article-123",
  "title": "記事タイトル",
  "category": "カテゴリ名",
  "tags": ["タグ1", "タグ2"],
  "updatedAt": "2024-04-06T10:30:00Z",
  "content": [
    // 各種コンテンツブロック
  ]
}
```

## コンテンツブロック

### 見出し

```json
{
  "type": "heading",
  "level": 2,
  "text": "見出しテキスト"
}
```

- `level`: 1〜6（デフォルト：2）
- H2、H3は特別なスタイリングあり

### 段落

```json
{
  "type": "paragraph",
  "text": "段落テキスト"
}
```

### リスト

```json
{
  "type": "list",
  "style": "bullet",
  "items": ["項目1", "項目2", "項目3"]
}
```

- `style`: "bullet"（箇条書き）または "ordered"（番号付き）

### 画像ブロック

画像を表示するためのブロックです。

**必須プロパティ**:
- `src`: 画像のURL (文字列)

**オプションプロパティ**:
- `alt`: 代替テキスト (文字列)
- `caption`: 画像の説明文 (文字列、インラインフォーマット対応)
- `width`: 画像の幅 (数値またはパーセンテージなどの単位付き文字列)
- `height`: 画像の高さ (数値またはパーセンテージなどの単位付き文字列)

**使用例**:
```json
{
  "type": "image",
  "src": "https://example.com/image.jpg",
  "alt": "サンプル画像",
  "caption": "これは**サンプル画像**です",
  "width": "80%"
}
```

または

```json
{
  "type": "image",
  "src": "https://example.com/image.jpg",
  "width": 500,
  "height": 300
}
```

**注意事項**:
- `width`と`height`は省略可能。省略時は画像の元のサイズが使用されます。
- `width`と`height`は数値の場合はピクセル単位、文字列の場合はそのまま使用されます（例: "50%", "300px"）。
- すべての画像は中央寄せで表示されます。

## インラインフォーマット

テキスト内に以下のマークアップを記述可能：

| マークアップ | 意味 | HTML変換結果 |
|-------------|------|------------|
| `**テキスト**` | 太字 | `<strong>テキスト</strong>` |
| `` `コード` `` | インラインコード | `<code>コード</code>` |
| `_テキスト_` | 斜体/強調 | `<em>テキスト</em>` |
| `__テキスト__` | 下線 | `<u>テキスト</u>` |
| `==テキスト==` | 青色テキスト | `<span style="color: #3182ce;">テキスト</span>` |
| `!!テキスト!!` | 赤色テキスト | `<span style="color: #e53e3e;">テキスト</span>` |
| `@@テキスト@@` | 緑色テキスト | `<span style="color: #38a169;">テキスト</span>` |
| `++テキスト++` | ハイライト | `<mark>テキスト</mark>` |

## 変換例

### 入力（JSON）

```json
{
  "title": "マークダウンの使い方",
  "content": [
    {
      "type": "heading",
      "level": 2,
      "text": "フォーマットについて"
    },
    {
      "type": "paragraph",
      "text": "テキスト内で**太字**や`コード`を使うことができます。"
    },
    {
      "type": "list",
      "style": "bullet",
      "items": [
        "==青色テキスト==の例",
        "!!赤色テキスト!!の例",
        "@@緑色テキスト@@の例"
      ]
    }
  ]
}
```

### 出力（HTML）

変換後はスタイル付きのHTMLとして表示されます。CSS不要で表示可能です。

## スタイル定義

主要なスタイル定義は以下の通りです：

```javascript
const STYLES = {
  headingH2: 'font-size: 22px; color: #2d3748; font-weight: 700; margin: 0; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0;',
  headingH3: 'font-size: 18px; color: #2d3748; font-weight: 600; border-left: 3px solid #4a5568; padding-left: 10px; margin: 0;',
  paragraph: 'margin: 0; font-size: 16px; line-height: 1.8; color: #4a5568; text-align: justify; letter-spacing: 0.01em;',
  listContainer: 'margin-bottom: 20px; background-color: #f8fafc; border-radius: 8px; padding: 15px 15px 15px 20px;',
  orderedList: 'margin: 0; padding-left: 30px; color: #2d3748; font-size: 16px; line-height: 1.8; counter-reset: item;',
  unorderedList: 'margin: 0; padding-left: 25px; color: #2d3748; font-size: 16px; line-height: 1.8; list-style-type: none;'
};
```

## 実装方法

1. 記事データ（JSON）をHTML文字列に変換する `articleToHtml` 関数を使用します
2. 各ブロックタイプに応じた処理を行い、適切なHTMLを生成します
3. テキスト内のマークアップを検出して対応するHTMLに変換します
4. すべてのユーザー入力（テキスト）はHTMLエスケープされます

## 使用例

```javascript
import Converter from './js/converter.js';

// JSONデータ
const articleData = { /* 記事データ */ };

// HTMLに変換
const htmlResult = Converter.articleToHtml(articleData);

// 結果をDOM要素に挿入
document.getElementById('article-container').innerHTML = htmlResult;
``` 