# ContractFlow — Hệ thống Quản lý Hợp đồng

Ứng dụng quản lý hợp đồng theo Đề 34, triển khai bằng Docker Compose: Node.js/Express, PostgreSQL, pgAdmin, Nginx reverse proxy, Prometheus, Grafana, Loki và Promtail. Không kèm mẫu báo cáo.

## Chức năng
- Tổng quan số hợp đồng, tổng giá trị, hợp đồng sắp hết hạn và số đối tác.
- Tạo, xem, tìm kiếm, lọc, cập nhật trạng thái và xóa hợp đồng.
- Quản lý đối tác khách hàng/nhà cung cấp/đối tác khác.
- Lưu loại hợp đồng, người phụ trách, ngày bắt đầu/kết thúc, giá trị, mô tả và lịch sử sự kiện.
- PostgreSQL có ràng buộc dữ liệu, index và dữ liệu mẫu.
- Health check, Prometheus metrics, dashboard Grafana và log tập trung Loki/Promtail.
- Đăng nhập một tài khoản cấu hình qua `.env`, với các màn hình riêng cho tổng quan, hợp đồng và đối tác.
- Hardening: app non-root, read-only filesystem, drop Linux capabilities, giới hạn PID, rate limit, Helmet security headers, network backend nội bộ, DB không publish cổng ra host.

## Chạy trên Windows
1. Cài Docker Desktop và bật Linux containers.
2. Mở PowerShell tại thư mục `contract-management`.
3. Tạo file cấu hình: `Copy-Item .env.example .env`. Sửa toàn bộ mật khẩu mẫu trong `.env` trước khi dùng thực tế.
4. Điền `AUTH_USERNAME`, `AUTH_PASSWORD` và `SESSION_SECRET` trong `.env`.
5. Khởi động ứng dụng và database: `docker compose up -d --build`.
6. Khởi động giám sát: `docker compose --profile monitoring up -d`.
7. Khởi động pgAdmin nếu cần: `docker compose --profile admin up -d`.

## URL
- Website qua Nginx: http://localhost:8080
- Đăng nhập: dùng `AUTH_USERNAME` và `AUTH_PASSWORD` trong `.env` (mặc định demo: `admin` / `change_this_login_password`).
- Health: http://localhost:8080/health
- Grafana: http://localhost:3001 (tài khoản/mật khẩu trong `.env`)
- pgAdmin: http://localhost:5050 (profile `admin`, chỉ bind localhost)
- Prometheus: chỉ truy cập nội bộ Docker theo mặc định.

## Git và 3 commit gợi ý
```powershell
git init
git add .
git commit -m "chore: bootstrap contract management stack"
git add app/public app/server.js postgres/init.sql
git commit -m "feat: implement contract and party management"
git add docker-compose.yml nginx prometheus grafana loki promtail .env.example README.md SECURITY.md
git commit -m "ops: add reverse proxy monitoring logging and hardening"
```
Tạo repository trên GitHub rồi kết nối remote theo URL repository của bạn; không commit `.env`.

## Kiểm tra nhanh
```powershell
docker compose ps
curl.exe http://localhost:8080/health
curl.exe http://localhost:8080/api/contracts
```
Nếu sửa schema sau lần chạy đầu tiên, lưu ý thư mục dữ liệu PostgreSQL dùng volume nên `init.sql` chỉ tự chạy khi tạo database lần đầu. Không xóa volume nếu cần giữ dữ liệu.

## Ghi chú
Đây là bản demo học tập, đăng nhập dùng chung một tài khoản và chưa có phân quyền từng người dùng, chữ ký số, upload tài liệu hoặc quy trình phê duyệt pháp lý. Không đưa lên Internet công khai trước khi bổ sung TLS, quản lý bí mật và hệ thống danh tính phù hợp.
