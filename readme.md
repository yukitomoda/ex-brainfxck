# Brainfuck

Brainfuckのインタプリタです。

## 独自拡張について

このモジュールには、大量の独自拡張が含まれます。もはやBrainfuckの初期のコンセプトは無視され、「パズル感を出すこと」を最も重要な要素としています。

### 独自拡張の方針

#### 特に魅力的でもない、面倒な操作を簡素化すること

自分の考えた美しいアルゴリズムを表現したいだけなのに`100`という数字を自分がどこに保存していたか、現在のポインタがどこだったかを忘れるのはただ面倒なだけで、Brainfuckの魅力の一つではありません。また`a/b`や`if (a < b)`などはアルゴリズムを考える対象として魅力的ではありますが、あまりに原始的な操作であるために、プログラミング自体を阻害しかねません。

文字レジスタやカウンタの概念を導入することによって、プログラマが自由に、のびのびとプログラミングできる環境を作ります。

#### パズル要素の重視

Brainfuckプログラマはもはや学術的意味などとうの昔に忘れて、パズルに近い遊戯としてプログラミングしているように思われます。

この拡張はそのようなパズル的要素を十分残し、むしろ新しいパズルの問題をプログラマに提供します。

## 実装

Brainfuckにはいくらか実装依存となる箇所が存在しますが、このインタプリタでは以下の通りに実装されています。

### 配列のサイズの上限

JavaScriptの配列に従います。

### 配列のポインタが負数となったときの扱い

JavaScriptの配列で負数をインデックスとした場合に従います。

### 255以上の値をインクリメントしたとき

全くチェックは行われず、JavaScriptの`number`型に従います。この値は`Infinity`、`NaN`などの無効な値に十分なり得ます。

ウェブ上で公開されているBrainfuckコードの一部には、`255`をインクリメントしたときに`0`となること期待しているコードがあるかもしれません。このインタプリタではそのようなコードが正しく動かないことがありますので、注意してください。

### 0以下の値をデクリメントしたとき

全くチェックは行われず、JavaScriptの`number`型に従います。この値は`Infinity`、`NaN`などの無効な値に十分なり得ます。

ウェブ上で公開されているBrainfuckコードの一部には、`0`をデクリメントしたときに`255`となること期待しているコードがあるかもしれません。このインタプリタではそのようなコードが正しく動かないことがありますので、注意してください。

### `[`に対応する`]`が見つからないとき

コードの実行が終了されます。

### `]`に対応する`[`が見つからないとき

コードの最初に移動します。（つまり、コードの手前に対応する`[`があるかのように扱われます。）