# 合晶 6182 抽籤網站 🎴

朋友群內專用的台股抽籤迷你網站。一張 **合晶 (6182)**，六位朋友抽，每個 IP 限抽一次，全部抽完才開獎。

## 名單
Aki · Queenie · Jimmy · Stanley · Even · Chris

## 流程
1. 打開網站，輸入自己的名字登入（必須在名單中）
2. 從 6 張籤中點選一張（已被抽走的會變灰）
3. 等候其他人抽完（畫面顯示誰還沒抽）
4. 全部抽完自動開獎 🎉

## 規則
- 每個 IP 只能抽一次
- 同一個名字只能被使用一次
- 中籤者 = 抽到「中籤位」的人（伺服器啟動時隨機產生並寫入 `data.json`）
- 抽過後重新打開頁面會直接回到等待 / 開獎畫面

## 本地啟動
```bash
npm install
npm start
# http://localhost:3000
```

## 一鍵部署到 Render（手機也能用）

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/kurtzlu/gg)

點上面的按鈕 → 用 GitHub 登入 Render → 看到 Blueprint 預覽 → 點 **Apply** → 等 1–2 分鐘，
拿到 `https://heshin-lottery-XXXX.onrender.com` 這種網址，貼給朋友。

> ⚠️ Render 免費方案 15 分鐘無人訪問會休眠，重啟後 `data.json` 會重置。
> 6 個人請集中在同一個時段內抽完（半小時內），就沒問題。
> 若要永久保存，可在 Render 加付費 disk 或改用 Upstash Redis（README 末端說明）。

## 其他部署方式
任何支援 Node 18+ 的服務都可以（Railway / Fly.io / 自架 VPS）。
- 監聽 `PORT` 環境變數
- 狀態持久化於 `data.json`
- 若部署在反向代理後方，已啟用 `trust proxy` 以取得真實 IP

## 重抽（管理員）
設定環境變數 `ADMIN_TOKEN`，然後：
```bash
curl -X POST https://<your-host>/api/reset -H "X-Admin-Token: <token>"
```
這會清掉 `data.json` 並重新產生中籤位。
