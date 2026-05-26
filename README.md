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

## 部署
任何支援 Node 18+ 的服務都可以（Render / Railway / Fly.io / 自架 VPS）。
- 監聽 `PORT` 環境變數
- 狀態持久化於 `data.json`（部署平台需提供 persistent volume；單機 / 短期使用沒問題）
- 若部署在反向代理後方，已啟用 `trust proxy` 以取得真實 IP

## 重抽（管理員）
設定環境變數 `ADMIN_TOKEN`，然後：
```bash
curl -X POST https://<your-host>/api/reset -H "X-Admin-Token: <token>"
```
這會清掉 `data.json` 並重新產生中籤位。
