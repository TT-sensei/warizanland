# わり算ファンタジーバトル

小学3年生のわり算を、モンスターとのバトル・特訓・図鑑集めとして練習できるWeb教材です。

## 公開ページ

https://tt-sensei.github.io/warizanland/

## 学習レベル

- レベル1：割る数が2〜5の、あまりのないわり算
- レベル2：割る数が6〜9の、あまりのないわり算
- レベル3：割る数2〜9の、あまりのないランダム問題
- レベル4：割る数2〜9の、あまりのあるわり算

すべての問題は、割る数×1〜9をもとに作っています。レベル4も「割る数×商＋あまり」で生成するため、基本九九を使って考えられます。

## 学習サイクル

バトル → 誤答記録 → わり算マップ → 仲間と特訓 → 苦手克服 → 再バトル

- 9問正解で通常モンスターを撃破
- 正解を重ねるとATTACK、5コンボごとにSPECIAL
- 間違えると仲間のHPが1減り、苦手問題として特訓に記録
- 特訓はHP・敵・タイマーなしの10問セット
- 苦手問題は少し間を空けて再出題し、あとで2回連続正解すると克服
- 主人公、モンスター図鑑、コレクション、称号レベルを保存

## 技術構成

HTML / CSS / Vanilla JavaScript、GitHub Pages、localStorageのみで動作します。外部API・APIキー・DB・BGMは使用しません。

設計はedu-kitに合わせ、edu-components、edu-effects、sounds-recipe-、edu-assets、navi-character-の実在する素材を参照しています。

## 構成

warizanland/
├─ index.html
├─ style.css
├─ app.js
├─ data.js
├─ logic.js
├─ tests.mjs
├─ package.json
└─ README.md

## テスト

    npm test
