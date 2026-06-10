# Twitch Chat Translator

Twitchのチャット欄をリアルタイムで日本語翻訳して表示するWebページです。

## 特徴

- **APIキー不要** - Google翻訳の非公式APIを使用
- **サーバー不要** - ブラウザだけで動作（GitHub Pagesで公開可能）
- **匿名接続** - Twitchアカウントなしでチャットを読み取り
- **翻訳元言語を選択可能** - 英語・韓国語・中国語など9言語対応
- **チャンネル名を入力可能** - 好きなチャンネルに接続

## 使い方

1. ページを開く
2. 翻訳したいTwitchチャンネル名を入力
3. 翻訳元の言語を選択
4. 「接続する」をクリック

## デモ

https://kawachan-jp.github.io/twitch-chat-translate/  
※ GitHub Pagesに公開後、URLを更新してください

## 動作環境

- PC版 Google Chrome（推奨）
- PC版 Microsoft Edge

## 技術スタック

- Twitch IRC over WebSocket（匿名接続）
- Google Translate 非公式API
- 純粋なHTML + CSS + JavaScript（フレームワーク不使用）

## 注意事項

- Google翻訳の非公式APIは予告なく変更・廃止される可能性があります
- チャットが多いチャンネルでは翻訳が追いつかない場合があります
- 本ツールの使用による損害等について開発者は責任を負いません

## 参考

- [speech-to-text](https://github.com/KAWAchan-jp/speech-to-text) - 同作者の音声認識リアルタイム字幕ツール
- [Twitch IRC Documentation](https://dev.twitch.tv/docs/irc/)
