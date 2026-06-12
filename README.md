# Twitch Chat Translator

Twitchのチャット欄をリアルタイム翻訳して表示するWebページです。

## 特徴

- **APIキー不要** - Google翻訳の非公式APIを使用
- **サーバー不要** - ブラウザだけで動作（GitHub Pagesで公開可能）
- **匿名接続** - Twitchアカウントなしでチャットを読み取り
- **言語自動検出** - 翻訳元言語を自動で識別
- **多言語対応** - 翻訳元・翻訳先ともに14言語から選択可能
- **接続中に言語切替** - チャット画面からリアルタイムで言語変更
- **チャット送信機能（実験的）** - Twitchアカウントでログインしてチャット言語に翻訳して送信

## 使い方

1. [ページを開く](https://kawachan-jp.github.io/twitch-chat-translate/)
2. 翻訳したいTwitchチャンネル名を入力
3. 翻訳元（デフォルト: 自動検出）・翻訳先（デフォルト: 日本語）を選択
4. 「接続する」をクリック
5. 接続後もヘッダーから言語を切り替えられます

## チャット送信機能（実験的）

接続後にヘッダーの「送信 [実験的]」をONにすると使えます。

1. 「Twitchでログイン」ボタンをクリックしてTwitchアカウントで認証
2. メッセージを入力してEnterまたは「送信」を押す
3. 入力テキストが自動的にチャットの言語に翻訳されて送信される

> **注意:** 翻訳元が「自動検出」のときは翻訳せずそのまま送信されます。チャット言語に翻訳したい場合は翻訳元を手動で指定してください。

## デモ

https://kawachan-jp.github.io/twitch-chat-translate/

## 対応言語

自動検出 / 英語 / 韓国語 / 中国語（簡体字・繁体字）/ スペイン語 / フランス語 / ドイツ語 / ポルトガル語 / ロシア語 / 日本語 / アラビア語 / ヒンディー語 / タイ語 / ベトナム語 / インドネシア語

## 動作環境

- PC・スマホ問わず主要ブラウザで動作
- Google Chrome / Microsoft Edge 推奨

## 技術スタック

- Twitch IRC over WebSocket（匿名接続 / OAuth認証）
- Google Translate 非公式API（`sl=auto` で言語自動検出）
- Twitch Helix API（ログインユーザー名取得）
- 純粋なHTML + CSS + JavaScript（フレームワーク不使用）

## 注意事項

- Google翻訳の非公式APIは予告なく変更・廃止される可能性があります
- チャットが多いチャンネルでは翻訳が追いつかない場合があります
- 本ツールの使用による損害等について開発者は責任を負いません

## 参考

- [speech-to-text](https://github.com/KAWAchan-jp/speech-to-text) - 同作者の音声認識リアルタイム字幕ツール
- [Twitch IRC Documentation](https://dev.twitch.tv/docs/irc/)
