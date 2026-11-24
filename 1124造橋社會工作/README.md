# 苗栗造橋創生文化匯流網

以 Flask、SQLite 與原生 JavaScript 建置的地方創生資訊網站，Render Blueprint 設定位於 `render.yaml`。

## 本機啟動

```bash
python -m venv .venv
# Windows PowerShell: .venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

開啟 `http://127.0.0.1:5000`。首次啟動會在專案根目錄建立 `database.db`，並寫入六筆職缺；預約資料會保存在同一資料庫。可用 `DATABASE_PATH` 環境變數指定資料庫路徑。

## Render 部署

將專案推送到 GitHub 後，在 Render 建立 Blueprint，Render 會讀取 `render.yaml`、安裝 `requirements.txt` 並以 Gunicorn 啟動。服務使用 Starter 方案，並掛載 `/var/data` 持久化磁碟，SQLite 資料庫因而能跨服務重新啟動保留；Render Starter 方案與磁碟可能產生費用。掛載磁碟的服務維持單一執行個體，重新部署期間可能短暫中斷。首次部署會自動初始化資料表與種子職缺。

## API

- `GET /api/jobs?industry=產業類別`：列出全部職缺或依產業篩選。
- `POST /api/bookings`：以 JSON 或表單欄位建立預約，回傳 `booking_id`。
- `GET /api/bookings`：回傳最新 100 筆預約。此端點目前是示範管理視角，正式公開前應加上管理員驗證。

頁面中的企劃人物、案例、補助級距與職缺資料按專案需求提供的內容呈現；補助資格、租金試算與職缺狀況均附有提示，正式對外使用前請依主管機關公告及合作單位最新資訊更新。
