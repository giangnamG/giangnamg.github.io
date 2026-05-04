---
layout: post
title: "Catching Files over HTTP/S"
render_with_liquid: false
categories:
  - File Transfer
tags:
  - file-transfer
  - http
  - https
  - nginx
source_collection: manual
---
Topics: File Transfer, HTTP, HTTPS

## Overview

Web transfer là một trong các cách phổ biến nhất để truyền file vì `HTTP` và `HTTPS` thường được firewall cho phép. Nếu dùng `HTTPS`, dữ liệu cũng được mã hóa trong quá trình truyền, tránh việc gửi file nhạy cảm qua cleartext.

Trong pentest hoặc lab, ngoài Python `uploadserver`, có thể dùng Nginx hoặc Apache để dựng endpoint nhận upload. Bài này tập trung vào Nginx vì cấu hình thường gọn hơn và ít rủi ro vô tình bật thực thi PHP/web shell hơn Apache.

Nguyên tắc quan trọng:

- Không để upload directory có khả năng execute script.
- Dùng path khó đoán, ví dụ `/SecretUploadDirectory/`.
- Ưu tiên HTTPS thay vì HTTP.
- Chỉ bật method cần thiết, thường là `PUT`.
- Giới hạn kích thước upload.
- Kiểm tra log và cleanup file sau khi hoàn tất.
- Không upload dữ liệu thật ngoài scope; nếu test DLP, dùng dữ liệu giả.

## Quick Python Upload Server

Nếu cần receiver nhanh:

```bash
pip3 install uploadserver
python3 -m uploadserver
```

Upload bằng `curl`:

```bash
curl -X POST -F "files=@file.txt" http://<server-ip>:8000/upload
```

Nếu cần HTTPS với self-signed certificate:

```bash
openssl req -x509 -out server.pem -keyout server.pem -newkey rsa:2048 -nodes -sha256 -subj '/CN=upload'
python3 -m uploadserver 443 --server-certificate server.pem
```

Upload:

```bash
curl -k -X POST -F "files=@file.txt" https://<server-ip>/upload
```

`-k` chỉ dùng trong lab khi bạn chủ động dùng self-signed certificate.

## Nginx PUT Upload

Tạo thư mục nhận upload:

```bash
sudo mkdir -p /var/www/uploads/SecretUploadDirectory
sudo chown -R www-data:www-data /var/www/uploads/SecretUploadDirectory
sudo chmod 750 /var/www/uploads/SecretUploadDirectory
```

Tạo file cấu hình:

```bash
sudo nano /etc/nginx/sites-available/upload.conf
```

Nội dung tối thiểu:

```nginx
server {
    listen 9001;

    location /SecretUploadDirectory/ {
        root /var/www/uploads;
        dav_methods PUT;
    }
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/upload.conf /etc/nginx/sites-enabled/
```

Kiểm tra cấu hình:

```bash
sudo nginx -t
```

Restart Nginx:

```bash
sudo systemctl restart nginx.service
```

Nếu lỗi, kiểm tra log:

```bash
sudo tail -50 /var/log/nginx/error.log
```

Nếu port 80 bị default site chiếm hoặc conflict config:

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx.service
```

Upload bằng `curl`:

```bash
curl -T file.txt http://<server-ip>:9001/SecretUploadDirectory/file.txt
```

Kiểm tra file đã nhận:

```bash
sudo ls -lah /var/www/uploads/SecretUploadDirectory/
sudo tail -5 /var/www/uploads/SecretUploadDirectory/file.txt
```

## Safer Nginx PUT Configuration

Cấu hình thực tế nên giới hạn method, size, logging, và tránh directory listing:

```nginx
server {
    listen 9001;
    server_name _;

    client_max_body_size 50m;
    autoindex off;

    location /SecretUploadDirectory/ {
        root /var/www/uploads;
        dav_methods PUT;
        create_full_put_path on;
        dav_access user:rw group:rw all:r;

        limit_except PUT {
            deny all;
        }
    }
}
```

Ghi chú:

- `client_max_body_size` giới hạn kích thước file upload.
- `create_full_put_path on` cho phép tạo path con nếu cần.
- `limit_except PUT` chặn các method khác trong location này.
- `autoindex off` tránh list directory qua browser.
- `ngx_http_dav_module` phải có trong build Nginx; nếu `dav_methods` lỗi khi `nginx -t`, kiểm tra module/package Nginx.

## Nginx Upload Over HTTPS

Tạo self-signed certificate trong lab:

```bash
sudo openssl req -x509 -nodes -days 1 -newkey rsa:2048 \
  -keyout /etc/ssl/private/upload.key \
  -out /etc/ssl/certs/upload.crt \
  -subj "/CN=upload"
```

Cấu hình HTTPS:

```nginx
server {
    listen 9443 ssl;
    server_name _;

    ssl_certificate /etc/ssl/certs/upload.crt;
    ssl_certificate_key /etc/ssl/private/upload.key;

    client_max_body_size 50m;
    autoindex off;

    location /SecretUploadDirectory/ {
        root /var/www/uploads;
        dav_methods PUT;
        create_full_put_path on;
        dav_access user:rw group:rw all:r;

        limit_except PUT {
            deny all;
        }
    }
}
```

Reload:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

Upload:

```bash
curl -k -T file.txt https://<server-ip>:9443/SecretUploadDirectory/file.txt
```

Trong engagement thật, nên dùng certificate hợp lệ hoặc certificate đã được khách hàng phê duyệt thay vì self-signed.

## Basic Authentication

Nếu muốn tránh endpoint upload mở hoàn toàn, bật basic auth:

```bash
sudo apt-get install apache2-utils
sudo htpasswd -c /etc/nginx/upload.htpasswd uploaduser
```

Thêm vào `location`:

```nginx
auth_basic "Upload";
auth_basic_user_file /etc/nginx/upload.htpasswd;
```

Upload bằng `curl`:

```bash
curl -u uploaduser:'<password>' -T file.txt https://<server-ip>:9443/SecretUploadDirectory/file.txt -k
```

Không reuse password này cho hệ thống khác. Xóa user/password sau khi lab hoặc engagement kết thúc.

## Upload From Windows

PowerShell:

```powershell
Invoke-WebRequest -Uri "https://<server-ip>:9443/SecretUploadDirectory/file.txt" -Method PUT -InFile ".\file.txt" -SkipCertificateCheck
```

Windows PowerShell 5.1 không có `-SkipCertificateCheck`. Trong lab self-signed certificate, có thể dùng `curl.exe`:

```cmd
curl.exe -k -T file.txt https://<server-ip>:9443/SecretUploadDirectory/file.txt
```

Hoặc với HTTP:

```cmd
curl.exe -T file.txt http://<server-ip>:9001/SecretUploadDirectory/file.txt
```

## Upload From Linux

`curl`:

```bash
curl -T file.txt http://<server-ip>:9001/SecretUploadDirectory/file.txt
```

HTTPS self-signed:

```bash
curl -k -T file.txt https://<server-ip>:9443/SecretUploadDirectory/file.txt
```

`wget` với method PUT:

```bash
wget --method=PUT --body-file=file.txt http://<server-ip>:9001/SecretUploadDirectory/file.txt
```

## Verify Received Files

Trên máy gửi:

```bash
sha256sum file.txt
```

Trên server nhận:

```bash
sha256sum /var/www/uploads/SecretUploadDirectory/file.txt
```

Windows:

```powershell
Get-FileHash .\file.txt -Algorithm SHA256
```

Hash hai bên nên giống nhau.

## Cleanup

Sau khi hoàn tất:

```bash
sudo rm -f /var/www/uploads/SecretUploadDirectory/file.txt
sudo rm /etc/nginx/sites-enabled/upload.conf
sudo systemctl reload nginx
```

Nếu đã tạo credential basic auth hoặc certificate tạm:

```bash
sudo rm -f /etc/nginx/upload.htpasswd
sudo rm -f /etc/ssl/private/upload.key /etc/ssl/certs/upload.crt
```

## Notes

- HTTP upload tiện nhưng không bảo vệ dữ liệu trên đường truyền.
- HTTPS upload vẫn cần kiểm soát access; encryption không thay thế authentication.
- Không đặt upload directory trong app production đang execute PHP/ASP/JSP.
- Với dữ liệu nhạy cảm, encrypt file trước rồi mới upload qua HTTPS.
- Theo dõi `/var/log/nginx/access.log` và `/var/log/nginx/error.log` để debug upload.
