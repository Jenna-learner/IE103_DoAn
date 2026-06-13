#!/bin/bash

# 1. Tên Database của bạn
DB_NAME="fnb_chain_db"
DB_USER="postgres"

echo "=== ĐANG NGẮT TOÀN BỘ KẾT NỐI VÀ RESET DATABASE ==="

# 2. Ngắt kết nối từ các ứng dụng/Backend đang bám vào DB (Tránh lỗi database is being accessed by other users)
psql -U $DB_USER -d template1 -c "SELECT pg_terminate_backend(pg_stat_activity.pid) FROM pg_stat_activity WHERE pg_stat_activity.datname = '$DB_NAME' AND pid <> pg_backend_pid();"

# 3. Xóa và khởi tạo lại Database sạch
psql -U $DB_USER -c "DROP DATABASE IF EXISTS $DB_NAME WITH (FORCE);"
psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;"

echo "=== ĐANG NẠP LẠI HỆ THỐNG FILE DỮ LIỆU MỚI ==="

# 4. Chạy lần lượt 5 file theo đúng thứ tự lịch trình
psql -U $DB_USER -d $DB_NAME -f 01_schema_ddl.sql
psql -U $DB_USER -d $DB_NAME -f 02_triggers_procedures.sql
psql -U $DB_USER -d $DB_NAME -f 03_security_roles.sql
psql -U $DB_USER -d $DB_NAME -f 04_sample_data.sql
psql -U $DB_USER -d $DB_NAME -f 05_demo_role_accounts.sql

echo "=== ĐÃ RESET VÀ NẠP DATA THÀNH CÔNG 100%! ==="
