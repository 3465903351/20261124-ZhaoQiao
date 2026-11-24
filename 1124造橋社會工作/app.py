"""苗栗造橋創生文化匯流網 — Flask application."""
from __future__ import annotations

import os
import sqlite3
from pathlib import Path
from flask import Flask, jsonify, render_template, request

BASE_DIR = Path(__file__).resolve().parent
DB_PATH = Path(os.environ.get("DATABASE_PATH", BASE_DIR / "database.db"))
app = Flask(__name__)
app.config["JSON_AS_ASCII"] = False

JOBS = [
    ("琩裕營造有限公司", "土木工程與建築機械", "現場資深工程師、現場工程師、行政助理", "月薪 30,000 元至 65,000 元以上"),
    ("萬積科技股份有限公司", "環境衛生與污染防治", "業務專員、廠務倉管員、大貨車與聯結車司機", "月薪 30,000 元至 50,000 元以上"),
    ("連泰紙業股份有限公司", "造紙與環保工程", "儲備幹部、廢水處理人員、環保工程師、職業聯結司機", "月薪 32,000 元至 45,000 元"),
    ("百立容器工業股份有限公司", "塑膠製品製造", "倉儲人員、品管人員、12小時班作業員", "月薪 30,000 元至 38,000 元"),
    ("私立心連心居家長照機構", "長照與居家照護", "居家照顧服務員", "時薪 200 元至 250 元（轉場津貼190元/時）"),
    ("全家便利商店", "連鎖零售流通", "門市計時支援人員", "時薪 196 元至 238 元"),
]

def connect_db():
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    with connect_db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT, company TEXT NOT NULL,
            industry TEXT NOT NULL, positions TEXT NOT NULL, salary TEXT NOT NULL)""")
        conn.execute("""CREATE TABLE IF NOT EXISTS bookings (
            id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL,
            phone TEXT NOT NULL, organization TEXT NOT NULL, experience TEXT NOT NULL,
            booking_date TEXT NOT NULL, people INTEGER NOT NULL,
            notes TEXT DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)""")
        if conn.execute("SELECT COUNT(*) FROM jobs").fetchone()[0] == 0:
            conn.executemany("INSERT INTO jobs(company,industry,positions,salary) VALUES(?,?,?,?)", JOBS)

init_db()

@app.get("/")
def index():
    with connect_db() as conn:
        jobs = [dict(row) for row in conn.execute("SELECT * FROM jobs ORDER BY id")]
    return render_template("index.html", jobs=jobs)

@app.get("/api/jobs")
def api_jobs():
    industry = request.args.get("industry", "").strip()
    with connect_db() as conn:
        if industry and industry != "全部產業":
            rows = conn.execute("SELECT * FROM jobs WHERE industry = ? ORDER BY id", (industry,))
        else:
            rows = conn.execute("SELECT * FROM jobs ORDER BY id")
        return jsonify([dict(row) for row in rows])

@app.post("/api/bookings")
def create_booking():
    data = request.get_json(silent=True) or request.form
    fields = {key: str(data.get(key, "")).strip() for key in ("name", "phone", "organization", "experience", "booking_date", "people", "notes")}
    if any(not fields[key] for key in ("name", "phone", "organization", "experience", "booking_date", "people")):
        return jsonify({"error": "請完整填寫姓名、電話、單位、體驗項目、日期與人數。"}), 400
    try:
        people = int(fields["people"])
        if people < 1 or people > 500:
            raise ValueError
    except ValueError:
        return jsonify({"error": "預約人數須介於 1 至 500 人。"}), 400
    with connect_db() as conn:
        cur = conn.execute("""INSERT INTO bookings(name,phone,organization,experience,booking_date,people,notes)
            VALUES(?,?,?,?,?,?,?)""", (fields["name"], fields["phone"], fields["organization"], fields["experience"], fields["booking_date"], people, fields["notes"]))
        booking_id = cur.lastrowid
    return jsonify({"message": "預約已送出，我們將與您聯繫確認。", "booking_id": booking_id}), 201

@app.get("/api/bookings")
def list_bookings():
    with connect_db() as conn:
        rows = conn.execute("SELECT * FROM bookings ORDER BY created_at DESC, id DESC LIMIT 100")
        return jsonify([dict(row) for row in rows])

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 5000)), debug=os.environ.get("FLASK_DEBUG") == "1")
