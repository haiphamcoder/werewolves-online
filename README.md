# Werewolves Online

Ứng dụng web chơi **Ma sói** (Werewolves) nhiều người trong thời gian thực: tạo phòng, mời bạn qua link hoặc QR, phân vai trò và điều phối các giai đoạn đêm / ngày qua máy chủ trung tâm.

Ý tưởng và luồng quản trò được tham khảo từ công cụ **[Quản trò Ma Sói - vibe.j2team.org](https://vibe.j2team.org/werewolf-host)** (J2Team). Đây là bản triển khai riêng (stack và mã nguồn khác).

## Công nghệ

| Phần | Công nghệ |
| ---- | --------- |
| Frontend | React 19, TypeScript, Vite 8, Mantine UI, React Router |
| Realtime | Socket.IO (client ↔ server) |
| Backend | Node.js, Express, Socket.IO, CORS |

Repo dùng **pnpm workspace**: gói gốc là SPA, thư mục `server/` là API + WebSocket.

## Yêu cầu

- **Node.js** (khuyến nghị LTS hiện tại)
- **pnpm** (`corepack enable` hoặc cài `pnpm` toàn cục)

## Cài đặt

```bash
git clone <repo-url>
cd werewolves-online
pnpm install
```

Lệnh trên cài dependency cho cả frontend và gói `server/`.

## Biến môi trường

### Frontend (thư mục gốc, file `.env`)

Tạo `.env` từ `.env.example`:

| Biến | Mô tả |
| ------ | -------- |
| `VITE_SOCKET_URL` | URL gốc của backend (ưu tiên). Ví dụ: `http://localhost:3001` |
| `VITE_API_URL` | Dùng khi không set `VITE_SOCKET_URL`; cùng host/port với Express + Socket.IO |
| `VITE_PORT` | Port dev của Vite (tham khảo; mặc định Vite thường là 5173) |

Nếu không set `VITE_SOCKET_URL` / `VITE_API_URL`, client không kết nối socket và không gọi `/health` (keep-alive).

### Backend (`server/.env`)

Tạo `server/.env` từ `server/.env.example`:

| Biến | Mô tả |
| ------ | -------- |
| `PORT` | Cổng HTTP (mặc định `3001`) |
| `CLIENT_ORIGIN` | Danh sách origin **phân tách bằng dấu phẩy** được phép gọi API / WebSocket (CORS). Ví dụ local: `http://localhost:5173`. Production: `https://ten-app-cua-ban.vercel.app` (không thêm `/` ở cuối). |
| `ALLOW_VERCEL_PREVIEWS` | Đặt `true` trên host (ví dụ Render) nếu cần test bằng **Vercel preview** (`*.vercel.app`); các URL preview không trùng production domain. |

## Chạy phát triển (local)

Cần **hai terminal**:

1. **Backend**

   ```bash
   cd server
   pnpm dev
   ```

   Server lắng nghe `PORT` (mặc định `3001`), có `/health` và Socket.IO.

2. **Frontend**

   ```bash
   pnpm dev
   ```

   Mở URL Vite in ra (thường `http://localhost:5173`). Đảm bảo `CLIENT_ORIGIN` trong `server/.env` trùng origin đó.

## Build & chạy production (local)

```bash
# Frontend
pnpm build
pnpm preview   # hoặc phục vụ thư mục dist bằng web server tĩnh

# Backend
cd server
pnpm build
pnpm start   # chạy dist/index.js, cần biến môi trường (PORT, CLIENT_ORIGIN, …)
```

## Triển khai gợi ý

- **Frontend (SPA)**: Vercel, Netlify, Cloudflare Pages, v.v. — trỏ build command `pnpm build`, output `dist`.
- **Backend**: Render, Railway, Fly.io, VPS, v.v. — chạy `pnpm start` trong `server/` sau `pnpm build`, set `PORT` do nền tảng cung cấp.
- Trên **Vercel**, thêm biến `VITE_API_URL` / `VITE_SOCKET_URL` trỏ tới URL HTTPS của backend (ví dụ `https://werewolves-online.onrender.com`).
- Trên **Render** (hoặc tương tự), set `CLIENT_ORIGIN` đúng production URL của frontend (và `ALLOW_VERCEL_PREVIEWS=true` nếu chỉ dùng preview Vercel).

Ứng dụng có **keep-alive** (`GET /health` định kỳ) để giảm tình trạng idle spin-down trên free tier; endpoint này cùng CORS với phần còn lại của API.

## Cấu trúc thư mục (rút gọn)

```text
werewolves-online/
├── src/                 # React SPA (trang, hooks, UI)
├── server/              # Express + Socket.IO
│   └── src/
├── public/
├── vite.config.ts
├── package.json
└── pnpm-workspace.yaml  # gói con: server
```

## Lệnh npm/pnpm hữu ích (frontend)

| Lệnh | Mô tả |
| ------ | -------- |
| `pnpm dev` | Dev server Vite |
| `pnpm build` | Build production |
| `pnpm preview` | Xem bản build trên máy |
| `pnpm lint` | ESLint |
| `pnpm test` | Vitest |
| `pnpm format` | Prettier |

Trong `server/`: `pnpm dev` (watch), `pnpm build`, `pnpm start`.
