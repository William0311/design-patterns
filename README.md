# 設計模式實踐

GoF 23 個設計模式的 TypeScript 實作，附可互動的瀏覽器 demo 與單元測試。

每個 pattern 一頁，結構固定：**問題情境 → 不用它會痛在哪 → 用了之後 → 可以跑的 demo → 什麼時候不要用**。

最後一段是重點。這 23 個模式出自 1994 年，其中好幾個在 TypeScript 裡已經是語言內建功能或反模式，這裡不會假裝它們同等重要。

## 網址

| 環境 | 分支 | 網址 |
| --- | --- | --- |
| 正式 | `main` | https://william0311.github.io/design-patterns/ |
| 預覽 | `dev` | https://william0311.github.io/design-patterns/dev/ |

## 進度

2 / 23。已完成：**Command**（繪圖板 undo/redo demo）、**Strategy**（RAG 助手 A/B 實驗條件切換 demo）。

## 本機開發

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 單元測試
npm run typecheck  # tsc --noEmit
npm run build      # typecheck + vite build
```

## 開發流程

```text
feat/xxx ──(直推或 PR)──> dev ──(必須 PR + CI 綠)──> main
```

`dev` 可直推，推上去自動部署到 `/dev/` 預覽站，自己驗過再開 PR 進 `main`。
`main` 有 ruleset 保護，必須走 PR 且 CI 綠才能合併。

## 專案結構

```text
index.html                     目錄頁
command.html                   Command pattern 頁
src/
  styles.css                   共用樣式
  dev-banner.ts                預覽環境橫幅（依 URL 路徑判斷）
  patterns/command/
    command.ts                 pattern 本體
    command.test.ts            單元測試
    demo.ts                    瀏覽器 demo 的 DOM 接線
  patterns/strategy/
    naive.ts                   刻意保留的 if/else 爛版本（頁面的 before 範例）
    strategy.ts                pattern 本體
    strategy.test.ts           單元測試
    demo.ts                    瀏覽器 demo 的 DOM 接線
```

### 為什麼頁面都放在根目錄

Vite 的 `base` 在 build 時就寫死，但正式站在 `/design-patterns/`、預覽站在 `/design-patterns/dev/`，路徑深度不同。
解法是 `base: './'`（相對路徑）＋**所有頁面維持同一層**，這樣同一份 build 在兩個環境都能正確載入資源。

新增 pattern 時請照這個規則：新頁面放根目錄（如 `observer.html`），並加進 `vite.config.ts` 的 `rollupOptions.input`。
