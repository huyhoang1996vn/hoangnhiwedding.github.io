# Hoang & Nhi — RSVP API

API nhận lời xác nhận tham dự từ thiệp mời, lưu vào PostgreSQL, rồi ghi thêm một dòng lên Google Sheet. Trang khách (`guests/index.html`) đọc lại danh sách qua `GET /rsvps`.

## Công nghệ

- Python 3.12, FastAPI, Uvicorn
- SQLAlchemy 2 + PostgreSQL 16 (`psycopg`)
- Google Sheets qua `gspread` và service account

## Cấu trúc

```
server/
  app/
    main.py        # endpoint, CORS, tạo bảng khi khởi động
    config.py      # biến môi trường
    database.py    # engine và session
    models.py      # bảng rsvps
    schemas.py     # request / response
    sheets.py      # ghi Google Sheet
  secrets/         # file JSON service account (không commit)
  Dockerfile
  docker-compose.yml
  requirements.txt
  .env             # không commit
```

## Chạy bằng Docker

Trong thư mục `server`:

```bash
docker compose up --build
```

- API: `http://127.0.0.1:8000`
- Postgres trên máy host: cổng `54322` (bên trong mạng Docker vẫn là `5432`)
- User / password / database mặc định: `wedding` / `wedding` / `wedding`

Kiểm tra:

```bash
curl http://127.0.0.1:8000/health
```

Kỳ vọng: `{"status":"ok"}`.

Bảng `rsvps` được tạo tự động lúc API khởi động. Không cần chạy migration.

## Chạy trực tiếp (không Docker)

Cần PostgreSQL đang chạy và Python 3.12.

```bash
cd server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

`DATABASE_URL` mặc định khi không set biến môi trường là:

```
postgresql+psycopg://wedding:wedding@localhost:5432/wedding
```

Trong Docker, host của database là `db`, không phải `localhost`.

## Biến môi trường

Đặt trong `server/.env`. File này không được commit.

| Biến | Ý nghĩa |
| --- | --- |
| `DATABASE_URL` | Chuỗi kết nối SQLAlchemy, driver `postgresql+psycopg` |
| `CORS_ORIGINS` | Danh sách origin được phép, phân tách bằng dấu phẩy |
| `GOOGLE_SHEET_ID` | ID spreadsheet (đoạn trong URL `/d/.../edit`) |
| `GOOGLE_SHEET_TAB` | Tên tab, mặc định `RSVP` |
| `GOOGLE_CREDENTIALS_FILE` | Đường dẫn file JSON service account, ví dụ `secrets/service-account.json` |

`CORS_ORIGINS` mặc định cho Live Server: `http://127.0.0.1:5500` và `http://localhost:5500`. Thêm origin thật (domain thiệp, URL ngrok) nếu mở site từ chỗ khác. Thiệp gọi `http://127.0.0.1:8000/rsvp` và trang khách gọi `http://127.0.0.1:8000/rsvps`.

## Google Sheet

1. Tạo một Google Cloud service account, bật Google Sheets API.
2. Tải file JSON key, đặt vào `server/secrets/`. Thư mục này được mount read-only vào container tại `/app/secrets`.
3. Share spreadsheet cho email của service account, quyền Editor.
4. Tạo tab tên `RSVP` (hoặc đổi `GOOGLE_SHEET_TAB`).
5. Điền `GOOGLE_SHEET_ID` và `GOOGLE_CREDENTIALS_FILE` trong `.env`.

Mỗi RSVP được append một dòng, theo thứ tự:

| Cột | Nội dung |
| --- | --- |
| A | `id` |
| B | họ tên |
| C | số khách |
| D | lời nhắn (để trống nếu không có) |
| E | thời gian tạo, múi `Asia/Ho_Chi_Minh`, dạng `YYYY-MM-DD HH:MM:SS` |

Nếu thiếu `GOOGLE_SHEET_ID` hoặc `GOOGLE_CREDENTIALS_FILE`, API bỏ qua bước ghi sheet. Nếu ghi sheet lỗi, RSVP vẫn được lưu trong Postgres và API vẫn trả `201`. Lỗi được ghi vào log.

## API

### `GET /health`

```json
{ "status": "ok" }
```

### `POST /rsvp`

Tạo một lời xác nhận. Trả `201`.

```json
{
  "fullName": "An Nguyen",
  "attendees": 2,
  "message": "Chúc hai bạn hạnh phúc",
  "website": ""
}
```

| Trường | Ràng buộc |
| --- | --- |
| `fullName` | Bắt buộc, sau khi trim còn 1–120 ký tự |
| `attendees` | Số nguyên từ 1 đến 20 |
| `message` | Tuỳ chọn, tối đa 1000 ký tự. Chuỗi rỗng được lưu thành `null` |
| `website` | Honeypot. Khách thật để trống. Nếu có nội dung, API trả `201` với `{"id": null}` và không lưu |

Response khi lưu thành công:

```json
{ "id": 1 }
```

### `GET /rsvps`

Danh sách lời xác nhận, mới nhất trước. Mỗi phần tử:

```json
{
  "id": 1,
  "fullName": "An Nguyen",
  "attendees": 2,
  "message": "Chúc hai bạn hạnh phúc",
  "createdAt": "2026-10-23T07:30:00+00:00"
}
```

## Bảng `rsvps`

| Cột | Kiểu |
| --- | --- |
| `id` | integer, khoá chính |
| `full_name` | varchar(120), bắt buộc |
| `attendees` | integer, bắt buộc |
| `message` | text, có thể null |
| `created_at` | timestamptz, mặc định `now()` |
