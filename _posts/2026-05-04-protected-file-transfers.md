---
layout: post
title: "Protected File Transfers"
render_with_liquid: false
categories:
  - File Transfer
tags:
  - file-transfer
  - encryption
  - protected-transfer
source_collection: manual
---
Topics: File Transfer, Encryption, Data Handling

## Overview

Trong pentest, incident response, forensic, hoặc internal security assessment, chúng ta có thể gặp dữ liệu nhạy cảm như:

- danh sách user
- credential hoặc password hash
- database dump
- file cấu hình chứa secret
- enumeration data về hạ tầng mạng hoặc Active Directory
- output scan có hostname, IP, service, path nội bộ

Khi cần truyền các dữ liệu này, ưu tiên dùng transport đã mã hóa như `SSH`, `SFTP`, `SCP`, `HTTPS`, hoặc tunnel/VPN được phê duyệt. Nếu không có transport an toàn, hãy mã hóa file trước khi truyền.

Lưu ý quan trọng: trừ khi scope yêu cầu rõ ràng, không nên lấy hoặc sao chép dữ liệu thật như PII, dữ liệu tài chính, thẻ tín dụng, hồ sơ khách hàng, bí mật thương mại. Nếu mục tiêu là kiểm tra DLP hoặc egress filtering, hãy tạo dữ liệu giả mô phỏng định dạng dữ liệu cần bảo vệ.

## Data Handling Checklist

- Xác nhận scope cho phép thu thập loại dữ liệu đó.
- Chỉ lấy tối thiểu dữ liệu cần chứng minh impact.
- Ưu tiên tạo proof bằng metadata, sample nhỏ, hoặc dữ liệu giả.
- Mã hóa file trước khi truyền nếu transport không bảo mật.
- Dùng passphrase mạnh, duy nhất cho từng khách hàng/từng engagement.
- Không hardcode passphrase trong script, command history, ticket, hoặc report thô.
- Verify hash trước và sau khi transfer.
- Xóa plaintext tạm sau khi đã xác nhận file encrypted hoạt động.
- Ghi chú nơi lưu trữ, thời điểm tạo, người có quyền truy cập, và cách hủy dữ liệu sau engagement.

## Recommended Protected Transports

Ưu tiên theo thứ tự thực tế:

1. `SFTP` hoặc `SCP` qua SSH.
2. `HTTPS` upload/download với certificate hợp lệ.
3. SMB trong network tin cậy hoặc qua VPN, nếu policy cho phép.
4. File đã mã hóa rồi mới truyền qua HTTP, FTP, Netcat, RDP drive, hoặc kênh khác.

Nếu vừa có transport mã hóa vừa có file encryption, dùng cả hai khi dữ liệu đủ nhạy cảm.

## File Encryption On Windows

Một cách tiện trong lab là dùng PowerShell AES helper như `Invoke-AESEncryption.ps1`. Script này hỗ trợ encrypt/decrypt string và file.

Source code:

```powershell
function Invoke-AESEncryption {
    [CmdletBinding()]
    [OutputType([string])]
    Param
    (
        [Parameter(Mandatory = $true)]
        [ValidateSet('Encrypt', 'Decrypt')]
        [String]$Mode,

        [Parameter(Mandatory = $true)]
        [String]$Key,

        [Parameter(Mandatory = $true, ParameterSetName = "CryptText")]
        [String]$Text,

        [Parameter(Mandatory = $true, ParameterSetName = "CryptFile")]
        [String]$Path
    )

    Begin {
        $shaManaged = New-Object System.Security.Cryptography.SHA256Managed
        $aesManaged = New-Object System.Security.Cryptography.AesManaged
        $aesManaged.Mode = [System.Security.Cryptography.CipherMode]::CBC
        $aesManaged.Padding = [System.Security.Cryptography.PaddingMode]::Zeros
        $aesManaged.BlockSize = 128
        $aesManaged.KeySize = 256
    }

    Process {
        $aesManaged.Key = $shaManaged.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($Key))

        switch ($Mode) {
            'Encrypt' {
                if ($Text) {
                    $plainBytes = [System.Text.Encoding]::UTF8.GetBytes($Text)
                }

                if ($Path) {
                    $File = Get-Item -Path $Path -ErrorAction SilentlyContinue
                    if (!$File.FullName) {
                        Write-Error -Message "File not found!"
                        break
                    }

                    $plainBytes = [System.IO.File]::ReadAllBytes($File.FullName)
                    $outPath = $File.FullName + ".aes"
                }

                $encryptor = $aesManaged.CreateEncryptor()
                $encryptedBytes = $encryptor.TransformFinalBlock($plainBytes, 0, $plainBytes.Length)
                $encryptedBytes = $aesManaged.IV + $encryptedBytes
                $aesManaged.Dispose()

                if ($Text) {
                    return [System.Convert]::ToBase64String($encryptedBytes)
                }

                if ($Path) {
                    [System.IO.File]::WriteAllBytes($outPath, $encryptedBytes)
                    (Get-Item $outPath).LastWriteTime = $File.LastWriteTime
                    return "File encrypted to $outPath"
                }
            }

            'Decrypt' {
                if ($Text) {
                    $cipherBytes = [System.Convert]::FromBase64String($Text)
                }

                if ($Path) {
                    $File = Get-Item -Path $Path -ErrorAction SilentlyContinue
                    if (!$File.FullName) {
                        Write-Error -Message "File not found!"
                        break
                    }

                    $cipherBytes = [System.IO.File]::ReadAllBytes($File.FullName)
                    $outPath = $File.FullName -replace ".aes"
                }

                $aesManaged.IV = $cipherBytes[0..15]
                $decryptor = $aesManaged.CreateDecryptor()
                $decryptedBytes = $decryptor.TransformFinalBlock($cipherBytes, 16, $cipherBytes.Length - 16)
                $aesManaged.Dispose()

                if ($Text) {
                    return [System.Text.Encoding]::UTF8.GetString($decryptedBytes).Trim([char]0)
                }

                if ($Path) {
                    [System.IO.File]::WriteAllBytes($outPath, $decryptedBytes)
                    (Get-Item $outPath).LastWriteTime = $File.LastWriteTime
                    return "File decrypted to $outPath"
                }
            }
        }
    }

    End {
        $shaManaged.Dispose()
        $aesManaged.Dispose()
    }
}
```

Import module:

```powershell
Import-Module .\Invoke-AESEncryption.ps1
```

Encrypt string:

```powershell
Invoke-AESEncryption -Mode Encrypt -Key "p@ssw0rd" -Text "Secret Text"
```

Decrypt string:

```powershell
Invoke-AESEncryption -Mode Decrypt -Key "p@ssw0rd" -Text "<base64-ciphertext>"
```

Encrypt file:

```powershell
Invoke-AESEncryption -Mode Encrypt -Key "p4ssw0rd" -Path .\scan-results.txt
```

Kết quả sẽ tạo file:

```text
scan-results.txt.aes
```

Decrypt file:

```powershell
Invoke-AESEncryption -Mode Decrypt -Key "p4ssw0rd" -Path .\scan-results.txt.aes
```

Sau khi encrypt, chỉ transfer file `.aes`. Không gửi plaintext qua kênh không bảo mật.

## Minimal Invoke-AESEncryption Usage Notes

Nếu dùng script `Invoke-AESEncryption.ps1`, cần lưu ý:

- Script thường derive key từ passphrase bằng SHA256 rồi dùng AES.
- File encrypted thường được ghi thêm extension `.aes`.
- IV phải được lưu cùng ciphertext để decrypt được.
- Passphrase yếu vẫn có thể bị brute-force nếu file bị lộ.
- Không reuse cùng passphrase cho nhiều khách hàng hoặc nhiều engagement.

Với dữ liệu cực kỳ nhạy cảm, nên ưu tiên công cụ chuẩn hơn như `GPG`, `age`, `7-Zip AES-256`, hoặc giải pháp client-approved.

## Windows 7-Zip Encryption

Nếu có `7z.exe`, có thể nén và mã hóa bằng AES-256:

```cmd
7z a -t7z protected.7z scan-results.txt -p -mhe=on
```

Giải nén:

```cmd
7z x protected.7z
```

`-mhe=on` mã hóa cả tên file trong archive. Khi chạy với `-p` mà không nhập password trực tiếp trên command line, 7-Zip sẽ prompt password, giảm rủi ro lộ qua command history/process list.

## Windows Compress Then Encrypt

Nén trước khi encrypt giúp giảm kích thước và gom nhiều file:

```powershell
Compress-Archive -Path .\loot\* -DestinationPath .\loot.zip
```

Sau đó encrypt archive:

```powershell
Invoke-AESEncryption -Mode Encrypt -Key "unique-strong-passphrase" -Path .\loot.zip
```

Transfer:

```text
loot.zip.aes
```

## File Encryption On Linux With OpenSSL

OpenSSL thường có sẵn trên Linux. Có thể encrypt file bằng AES-256 với PBKDF2:

```bash
openssl enc -aes256 -iter 100000 -pbkdf2 -salt -in /etc/passwd -out passwd.enc
```

Decrypt:

```bash
openssl enc -d -aes256 -iter 100000 -pbkdf2 -in passwd.enc -out passwd
```

Nên dùng passphrase mạnh và duy nhất. Nếu bên không được phép lấy được file `.enc`, passphrase yếu vẫn có thể bị brute-force offline.

## Avoid Password Leakage

Không nên truyền passphrase trực tiếp trong command line như:

```bash
openssl enc -aes256 -pbkdf2 -pass pass:WeakPassword -in file -out file.enc
```

Lý do:

- command có thể lưu trong shell history
- process list có thể hiển thị argument
- log hoặc EDR có thể ghi command line

Tốt hơn là để tool prompt password, hoặc dùng file chứa secret được bảo vệ quyền đọc:

```bash
chmod 600 passphrase.txt
openssl enc -aes256 -iter 100000 -pbkdf2 -salt -in file.bin -out file.bin.enc -pass file:passphrase.txt
```

Sau đó xóa file passphrase nếu chỉ dùng tạm.

## Linux GPG Symmetric Encryption

Nếu có `gpg`, dùng symmetric encryption:

```bash
gpg -c --cipher-algo AES256 file.bin
```

Kết quả:

```text
file.bin.gpg
```

Decrypt:

```bash
gpg -o file.bin -d file.bin.gpg
```

GPG phù hợp khi cần workflow quen thuộc, hỗ trợ cả symmetric và public-key encryption.

## Age Encryption

Nếu có `age`, nên dùng vì syntax đơn giản và thiết kế hiện đại.

Tạo key:

```bash
age-keygen -o key.txt
```

Encrypt bằng recipient public key:

```bash
age -r <recipient-public-key> -o file.bin.age file.bin
```

Decrypt:

```bash
age -d -i key.txt -o file.bin file.bin.age
```

Public-key encryption hữu ích khi không muốn chia sẻ passphrase qua kênh khác.

## Verify Before And After Transfer

Tính hash plaintext trước khi encrypt:

```bash
sha256sum file.bin
```

Encrypt:

```bash
openssl enc -aes256 -iter 100000 -pbkdf2 -salt -in file.bin -out file.bin.enc
```

Sau khi transfer và decrypt ở máy nhận:

```bash
openssl enc -d -aes256 -iter 100000 -pbkdf2 -in file.bin.enc -out file.bin
sha256sum file.bin
```

Hash plaintext ban đầu và plaintext sau khi decrypt phải giống nhau.

Windows:

```powershell
Get-FileHash .\file.bin -Algorithm SHA256
```

## Secure Transfer Examples

SCP:

```bash
scp file.bin.enc user@<server-ip>:/secure-drop/file.bin.enc
```

SFTP:

```bash
sftp user@<server-ip>
put file.bin.enc
exit
```

HTTPS upload:

```bash
curl -X POST -F "files=@file.bin.enc" https://<server-ip>/upload
```

Nếu chỉ có HTTP hoặc Netcat, vẫn transfer file đã encrypt:

```bash
nc <receiver-ip> 9001 < file.bin.enc
```

## Cleanup Plaintext

Sau khi xác nhận file encrypted đã transfer thành công:

Linux:

```bash
shred -u file.bin
```

Nếu filesystem là journaling, SSD, cloud disk, hoặc snapshot-backed storage, `shred` không đảm bảo xóa tuyệt đối. Khi đó cần dựa vào encrypted-at-rest storage và quy trình cleanup của engagement.

Windows PowerShell:

```powershell
Remove-Item .\file.bin
```

Windows không có secure delete built-in đáng tin cậy cho mọi loại storage. Với dữ liệu nhạy cảm, tốt nhất là không ghi plaintext ra disk nếu không cần, hoặc lưu trong encrypted container.

## Reporting Notes

Khi báo cáo, không đưa secret thật hoặc dữ liệu nhạy cảm đầy đủ vào report. Nên:

- mask secret, chỉ giữ vài ký tự đầu/cuối nếu cần
- dùng hash hoặc screenshot đã redact
- mô tả đường dẫn và bằng chứng impact thay vì đính kèm dữ liệu thật
- lưu artifact nhạy cảm trong vault hoặc encrypted archive riêng
- thống nhất với khách hàng về retention và destruction timeline

## Notes

- Encryption không thay thế authorization. Chỉ thu thập dữ liệu nằm trong scope.
- Dùng passphrase mạnh, duy nhất, không reuse giữa khách hàng.
- Ưu tiên transport an toàn trước, sau đó encrypt file nếu dữ liệu nhạy cảm.
- Verify hash để chắc file không bị lỗi khi transfer.
- Xóa plaintext tạm càng sớm càng tốt sau khi hoàn tất.
