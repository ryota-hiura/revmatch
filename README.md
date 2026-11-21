# REV-MATCH ASSIST & JERK TELEMETRY

OBD2非対応のネオクラシック・マニュアルトランスミッション車（初期ターゲット：**1991年式 Porsche 928 GT / 5速MT / 5.0L V8**）向けに開発した、車両無加工・スマートフォン完結型のドライビング支援＆テレメトリWebアプリケーションです。

マイク入力（エンジン音のFFT解析）、GPS、加速度センサー（IMU）を組み合わせ、現在のギアポジション推定、シフトダウン時（1段・2段落とし）の目標ブリッピング回転数のリアルタイム提示、およびシフトショック（躍度：Jerk）の計測・AI分析用ログ出力を行います。

---

## 1. 技術スタックと開発制約（For GitHub Copilot）

本プロジェクトを改修・拡張する際は、以下の設計方針と制約を厳守してください。

- **アーキテクチャ:** ビルドツールや外部ライブラリ（React, Vue, npmパッケージ等）を一切使用しない **Pure HTML5 / CSS3 / Vanilla JavaScript** 構成。
- **ファイル構成:** 各アプリは単一のHTMLファイル（CSS/JSインライン記述）で完結させ、**GitHub Pages** 上でそのまま静的ホスティングして動作させる。
- **オフライン・モバイルファースト:** 車載スマホ（Safari / Chrome）での利用を前提とし、HTTPS環境下で Web Audio API / Geolocation API / DeviceMotion API を使用する。
- **言語:** UI表示およびコード内のコメント・AI出力用プロンプトは日本語を基本とする。

---

## 2. ファイル構成

| ファイル名 | 役割 | 実行環境 |
| :--- | :--- | :--- |
| `index.html` | **本番アプリ（車載メーター＆テレメトリ）**<br>マイクFFTによるRPM検出、GPS車速取得、ギア推定、ターゲットレブゲージ表示、シフトダウン採点、AI分析用JSON出力を行う。 | スマートフォン（実車）または PCブラウザ（検証時） |
| `simulator.html` | **検証用テストベンチ（仮想車両＆V8サウンド合成）**<br>Web Audio APIで回転数に連動したエンジン音を合成・再生しつつ、加減速・クラッチ・ブリッピング・シフト操作を模擬する。 | PCブラウザ |

### 連携仕様（机上検証モード）
- **音声経由:** PCで `simulator.html` のエンジン音をスピーカー再生し、スマホの `index.html` のマイクで拾うことで実機音響テストが可能。
- **タブ間通信:** 同一ブラウザの別タブで `index.html` と `simulator.html` を開いた場合、`BroadcastChannel('928gt_sim_bus')` を通じて仮想車速と加速度が自動同期される。
  ```javascript
  // BroadcastChannel メッセージ形式
  { type: 'TELEMETRY', speedKmh: Number, accelMs2: Number }
