### A = -A

```bf
0A=2455-
2A?-
```

### r = A + B

```bf
55A= 15B=
A?r= B?r+
```

### r = A - B

```bf
55A= 15B=
A?r= B?r-
```

### r = A * B

既にカウンタがセットされているとき、`?`コマンドが乗算を行うことを利用する。

```bf
0A=2345A- 987B=
A?B?r=
```

### r = A / B

このアルゴリズムは`A`、 `B`が正のときしか使用できない。`A`、`B`が負の数を取りうるときは、絶対値を取って適用し、後から正負を考慮する。端数は切り捨て。

繰り返しを用いるので他の四則演算に比べ圧倒的に計算量が多い。

1. `A`が0以下になるまで`A -= B`をし、カウンタ`r`で回数を数える。
2. `A`が0より小さくなった場合、1回多く引きすぎているため`r -= 1`をする。

```bf
12345A= 987B=

0r= A?a=
[r+ B?a-] a?b- [r-_]
```

### r = A % B

`r = A / B`とほぼ同じで、こちらは最後に`A`に余った数を取得する。

1. `A`が0以下になるまで`A -= B`をし、カウンタ`r`で回数を数える。
2. `A`が0より小さくなった場合、`A += B`をする。

```bf
12345A= 987B=

A?r=
[B?r-] 0b=r?b- [B?r+_]
```

### r = A / B, s = A % B

```bf
12345A= 987B=

0r= A?s=
[r+ B?s-] 0b=s?b- [r- B?s+_]
```

### r = abs(A)

`[]`は正の数のときのみ実行となるため、一度必ず0以下となるようにしてから最後に符号を逆にしている。

1. `A`が正の数ならば、`A -= 2 * A`で符号を反転する。
2. `A -= 2 * A`

```bf
0A=145-
A?r= [2r?-_] 2r?-
```

### r = a^2

```bf
0A=29A-

A??r=
```

### goto

`|[_]`は「常に入り、常に出る」ため、実行にほぼ影響を及ぼさない。これと`_2[]`がさらに外側の`]`にジャンプすることを利用して、完全に同じとはいかないものの、gotoを実現できる。

```bf
|[
  a=
  _2[]
  2a=
_]
_[ここでaは1（2a=がスキップされている）]
```

### if-else

1. 末尾（elseブロックの後）に飛ぶ場所を作るため、全体を`|[_]`で囲む
2. 条件を満たす場合のブロックを作る
3. 条件を満たす場合のブロックの最後に、1で作った末尾に飛ぶためのコマンド`_3[]`を付ける

```bf
|[ a [
  b=  _[ ・・・条件を満たす場合のブロック ]
_3[]]
  2b= _[ ・・・条件を満たさない場合のブロック ]
_]
```

### サブルーチンジャンプ

かなり無理矢理ではあるものの、カーソルを動かせばどこへでも飛べる。

1. サブルーチンの定義
   1. Aにサブルーチンの場所を記録する。ただし、取得するカーソルから実際に実行する場所へ値をずらしておく。
   2. サブルーチンは`_[ |]`で囲み、外から入った場合は通り抜け、中から入った場合はリターンフィールドに記録された場所に戻るようにする。
2. サブルーチンの呼び出し
   1. `|[`でリターンフィールドを記録する。ただし、記録された位置から実際に戻ってきたときに実行する場所へ値をずらしておく。
   2. カーソルを`A`の値に書き換える。
   3. サブルーチンの`|]`によって戻ってきた後は、記録したリターンフィールドを消すよう`_]`を実行する。

```bf
_[ r = a * b を実行するサブルーチンA ]
&?A=6+_[
    a?b?r=
|]

2a=3b=
|[@7+ A?&=_]
r?a=4b=
|[@7+ A?&=_]
r?a=5b=
|[@7+ A?&=_]
```

### 数字の印字

1. まず入力となる数値の桁を調べる。（最初のループ）
2. 数値を`10^d`で割り、商を数値として出力する。
3. 余りを次の数値としてこれを繰り返す。

```bf
98051A=

0a= A?a- [ 45t=. 2a?- _] 2a?-

0d= e= [
    10e?=
    a?t=
    e?t- [ d+ _]
t]

a[
    0i=
    e= d?f= [10e?= f-]

    a?t= [ i+ e?t-]
    0s= t?s- [i- e?t+ _]
    t?a=

    48i+.

    d-
a]
```