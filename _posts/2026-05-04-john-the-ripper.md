---
layout: post
title: "John The Ripper"
render_with_liquid: false
categories:
  - Password Attack
tags:
  - password-attack
  - john-the-ripper
source_collection: manual
---
Topics: Password Attack

# Introduction to John The Ripper

John The Ripper là công cụ crack password cho pentester. Công cụ này thường được dùng để kiểm thử độ mạnh của password sau khi đã thu thập được hash hợp lệ trong phạm vi được phép.

Một số use case phổ biến:

- Crack hash từ Linux `/etc/shadow`
- Crack NTLM, NetNTLMv2, Kerberos, ZIP, RAR, PDF, Office, SSH private key
- Kiểm thử password policy bằng wordlist, rule và mask
- Audit lại mật khẩu yếu trong môi trường nội bộ

> Chỉ thực hiện password cracking trong lab hoặc hệ thống đã được cấp quyền kiểm thử.

## Cơ chế crack của John

John có các cơ chế crack password chính sau:

- `Dictionary attack`: thử mật khẩu từ wordlist.
- `Rule-based attack`: biến đổi wordlist hoặc thông tin user thành candidate password mới.
- `Brute-force attack`: tạo candidate theo không gian ký tự hoặc pattern.
- `Hybrid attack`: kết hợp wordlist với rule, mask hoặc pattern.

## Quick workflow

Workflow cơ bản khi dùng John:

1. Thu thập hash hoặc file cần crack trong phạm vi hợp lệ.
2. Xác định định dạng hash.
3. Nếu là file như ZIP, RAR, PDF, SSH key, KeePass, dùng công cụ `*2john*` để convert sang hash.
4. Chạy John với mode phù hợp.
5. Xem kết quả bằng `john --show`.
6. Lưu lại command, wordlist, rule và format đã dùng để reproduce.

Ví dụ:

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt --format=nt hashes.txt
john --show --format=nt hashes.txt
```

## Các chế độ crack

John có các chế độ crack sau:

- `Single crack mode`
- `Wordlist mode`
- `Incremental mode`
- `External mode`
- `Mask mode` nếu dùng bản Jumbo

## Single crack mode

Single crack mode là kỹ thuật generate password candidate dựa trên rule-based.

Kỹ thuật generate sử dụng một tập hợp rule với input là thông tin liên quan đến user, ví dụ:

- Username
- Home directory name
- Full name
- Phone number
- Room number
- GECOS field trong Linux

Chế độ này hữu ích khi crack password của user Linux vì nhiều người dùng đặt mật khẩu dựa trên tên, username hoặc biến thể cá nhân.

Ví dụ với file `passwd` có định dạng sau:

```text
r0lf:$6$ues25dIanlctrWxg$nZHVz2z4kCy1760Ee28M1xtHdGoy0C2cYzZ8l2sVa1kIa8K9gAcdBP.GI6ng/qA4oaMrgElZ1Cb9OeXO4Fvy3/:0:0:Rolf Sebastian:/home/r0lf:/bin/bash
```

Thực hiện crack:

```bash
namng@htb[/htb]$ john --single passwd
[...SNIP...]        (r0lf)
1g 0:00:00:00 DONE 1/3 (2025-04-10 07:47) 12.50g/s 5400p/s 5400c/s 5400C/s NAITSABESFL0R..rSebastiannaitsabeSr
Use the "--show" option to display all of the cracked passwords reliably
Session completed.
```

Trong trường hợp này, password hash đã được cracked thành công.

Hiển thị kết quả:

```bash
john --show passwd
```

## Wordlist mode

Wordlist mode là kỹ thuật crack mật khẩu dựa trên dictionary attack.

Syntax:

```bash
namng@htb[/htb]$ john --wordlist=<wordlist_file> <hash_file>
```

Ví dụ:

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
```

Kết hợp wordlist với rule:

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt --rules hashes.txt
```

Một số rule thường dùng:

```bash
john --list=rules
john --wordlist=wordlist.txt --rules=Single hashes.txt
john --wordlist=wordlist.txt --rules=Wordlist hashes.txt
```

Rule-based attack rất quan trọng vì user thường không dùng password random hoàn toàn. Họ hay thêm số, năm, ký tự đặc biệt, viết hoa chữ đầu, hoặc thay `a` thành `@`, `o` thành `0`.

## Incremental mode

Incremental mode dựa trên brute-force attack và tạo ra các mật khẩu ứng cử dựa trên mô hình thống kê, thường là chuỗi Markov.

Không giống brute-force hoàn toàn ngẫu nhiên, incremental mode sử dụng mô hình thống kê để ưu tiên những candidate có xác suất cao hơn, dẫn đến phương pháp hiệu quả hơn so với vét cạn đơn giản.

Basic syntax:

```bash
namng@htb[/htb]$ john --incremental <hash_file>
```

Có thể chỉ định charset:

```bash
john --incremental=Digits hashes.txt
john --incremental=Lower hashes.txt
john --incremental=Alnum hashes.txt
```

Incremental mode có thể rất tốn thời gian. Nên dùng sau khi đã thử single mode, wordlist, rule và các pattern có xác suất cao.

## Mask mode

Mask mode hữu ích khi biết một phần pattern của password, ví dụ policy yêu cầu chữ hoa, chữ thường, số hoặc ký tự đặc biệt.

Ví dụ thử password có dạng `Summer` + 4 số:

```bash
john --mask='Summer?d?d?d?d' hashes.txt
```

Một số token thường gặp:

| Token | Ý nghĩa |
| --- | --- |
| `?l` | Lowercase letters |
| `?u` | Uppercase letters |
| `?d` | Digits |
| `?s` | Symbols |
| `?a` | All printable ASCII |
| `?w` | Words from wordlist |

Ví dụ hybrid wordlist + mask:

```bash
john --wordlist=wordlist.txt --mask='?w?d?d' hashes.txt
```

## Identifying hash formats

Xem các tài liệu sau để kiểm tra các định dạng của hash:

- <https://openwall.info/wiki/john/sample-hashes>
- <https://pentestmonkey.net/cheat-sheet/john-the-ripper-hash-formats>

Sử dụng công cụ HashID:

```bash
namng@htb[/htb]$ hashid -j 193069ceb0461e1d40d216e32c79c704
```

Kết quả:

```text
Analyzing '193069ceb0461e1d40d216e32c79c704'
[+] MD2 [JtR Format: md2]
[+] MD5 [JtR Format: raw-md5]
[+] MD4 [JtR Format: raw-md4]
[+] Double MD5
[+] LM [JtR Format: lm]
[+] RIPEMD-128 [JtR Format: ripemd-128]
[+] Haval-128 [JtR Format: haval-128-4]
[+] Tiger-128
[+] Skein-256(128)
[+] Skein-512(128)
[+] Lotus Notes/Domino 5 [JtR Format: lotus5]
[+] Skype
[+] Snefru-128 [JtR Format: snefru-128]
[+] NTLM [JtR Format: nt]
[+] Domain Cached Credentials [JtR Format: mscach]
[+] Domain Cached Credentials 2 [JtR Format: mscach2]
[+] DNSSEC(NSEC3)
[+] RAdmin v2.x [JtR Format: radmin]
```

Trong ví dụ này, định dạng của mã băm vẫn chưa thực sự rõ ràng. Một hash có thể match nhiều thuật toán khác nhau nếu chỉ nhìn vào độ dài và charset.

Trong ví dụ cụ thể này, định dạng băm là RIPEMD-128.

Khi đã biết format, nên chỉ định rõ `--format` để John không đoán sai:

```bash
john --format=ripemd-128 --wordlist=wordlist.txt hash.txt
```

Liệt kê format John hỗ trợ:

```bash
john --list=formats
john --list=formats | grep -i ntlm
```

JtR hỗ trợ hàng trăm định dạng băm, một số trong đó được liệt kê trong bảng bên dưới. Tham số `--format` có thể được cung cấp để hướng dẫn JtR định dạng băm mục tiêu.

| Hash format | Example command | Description |
| --- | --- | --- |
| afs | `john --format=afs [...] <hash_file>` | AFS password hashes |
| bfegg | `john --format=bfegg [...] <hash_file>` | bfegg hashes used in Eggdrop IRC bots |
| bf | `john --format=bf [...] <hash_file>` | Blowfish-based crypt(3) hashes |
| bsdi | `john --format=bsdi [...] <hash_file>` | BSDi crypt(3) hashes |
| crypt | `john --format=crypt [...] <hash_file>` | Traditional Unix crypt(3) hashes |
| des | `john --format=des [...] <hash_file>` | Traditional DES-based crypt(3) hashes |
| dmd5 | `john --format=dmd5 [...] <hash_file>` | Dragonfly BSD MD5 password hashes |
| dominosec | `john --format=dominosec [...] <hash_file>` | IBM Lotus Domino 6/7 password hashes |
| episerver | `john --format=episerver [...] <hash_file>` | EPiServer SID password hashes |
| hdaa | `john --format=hdaa [...] <hash_file>` | hdaa password hashes used in Openwall GNU/Linux |
| hmac-md5 | `john --format=hmac-md5 [...] <hash_file>` | HMAC-MD5 password hashes |
| hmailserver | `john --format=hmailserver [...] <hash_file>` | hMailServer password hashes |
| ipb2 | `john --format=ipb2 [...] <hash_file>` | Invision Power Board 2 password hashes |
| krb4 | `john --format=krb4 [...] <hash_file>` | Kerberos 4 password hashes |
| krb5 | `john --format=krb5 [...] <hash_file>` | Kerberos 5 password hashes |
| lm | `john --format=lm [...] <hash_file>` | LM password hashes |
| lotus5 | `john --format=lotus5 [...] <hash_file>` | Lotus Notes/Domino 5 password hashes |
| mscash | `john --format=mscash [...] <hash_file>` | MS Cache password hashes |
| mscash2 | `john --format=mscash2 [...] <hash_file>` | MS Cache v2 password hashes |
| mschapv2 | `john --format=mschapv2 [...] <hash_file>` | MS CHAP v2 password hashes |
| mskrb5 | `john --format=mskrb5 [...] <hash_file>` | MS Kerberos 5 password hashes |
| mssql05 | `john --format=mssql05 [...] <hash_file>` | MS SQL 2005 password hashes |
| mssql | `john --format=mssql [...] <hash_file>` | MS SQL password hashes |
| mysql-fast | `john --format=mysql-fast [...] <hash_file>` | MySQL fast password hashes |
| mysql | `john --format=mysql [...] <hash_file>` | MySQL password hashes |
| mysql-sha1 | `john --format=mysql-sha1 [...] <hash_file>` | MySQL SHA1 password hashes |
| netlm | `john --format=netlm [...] <hash_file>` | NetLM hashes |
| netlmv2 | `john --format=netlmv2 [...] <hash_file>` | NetLMv2 hashes |
| netntlm | `john --format=netntlm [...] <hash_file>` | NetNTLM hashes |
| netntlmv2 | `john --format=netntlmv2 [...] <hash_file>` | NetNTLMv2 hashes |
| nethalflm | `john --format=nethalflm [...] <hash_file>` | Half LM hashes |
| md5ns | `john --format=md5ns [...] <hash_file>` | MD5 namespace password hashes |
| nsldap | `john --format=nsldap [...] <hash_file>` | OpenLDAP SHA password hashes |
| ssha | `john --format=ssha [...] <hash_file>` | Salted SHA password hashes |
| nt | `john --format=nt [...] <hash_file>` | NTLM password hashes |
| openssha | `john --format=openssha [...] <hash_file>` | OpenSSH private key password hashes |
| oracle11 | `john --format=oracle11 [...] <hash_file>` | Oracle 11 password hashes |
| oracle | `john --format=oracle [...] <hash_file>` | Oracle password hashes |
| pdf | `john --format=pdf [...] <hash_file>` | PDF password hashes |
| phpass-md5 | `john --format=phpass-md5 [...] <hash_file>` | PHPass-MD5 password hashes |
| phps | `john --format=phps [...] <hash_file>` | PHPS password hashes |
| pix-md5 | `john --format=pix-md5 [...] <hash_file>` | Cisco PIX MD5 password hashes |
| po | `john --format=po [...] <hash_file>` | Sybase SQL Anywhere password hashes |
| rar | `john --format=rar [...] <hash_file>` | RAR password hashes |
| raw-md4 | `john --format=raw-md4 [...] <hash_file>` | Raw MD4 password hashes |
| raw-md5 | `john --format=raw-md5 [...] <hash_file>` | Raw MD5 password hashes |
| raw-md5-unicode | `john --format=raw-md5-unicode [...] <hash_file>` | Raw MD5 Unicode password hashes |
| raw-sha1 | `john --format=raw-sha1 [...] <hash_file>` | Raw SHA1 password hashes |
| raw-sha224 | `john --format=raw-sha224 [...] <hash_file>` | Raw SHA224 password hashes |
| raw-sha256 | `john --format=raw-sha256 [...] <hash_file>` | Raw SHA256 password hashes |
| raw-sha384 | `john --format=raw-sha384 [...] <hash_file>` | Raw SHA384 password hashes |
| raw-sha512 | `john --format=raw-sha512 [...] <hash_file>` | Raw SHA512 password hashes |
| salted-sha | `john --format=salted-sha [...] <hash_file>` | Salted SHA password hashes |
| sapb | `john --format=sapb [...] <hash_file>` | SAP CODVN B password hashes |
| sapg | `john --format=sapg [...] <hash_file>` | SAP CODVN G password hashes |
| sha1-gen | `john --format=sha1-gen [...] <hash_file>` | Generic SHA1 password hashes |
| skey | `john --format=skey [...] <hash_file>` | S/Key one-time password hashes |
| ssh | `john --format=ssh [...] <hash_file>` | SSH password hashes |
| sybasease | `john --format=sybasease [...] <hash_file>` | Sybase ASE password hashes |
| xsha | `john --format=xsha [...] <hash_file>` | Extended SHA password hashes |
| zip | `john --format=zip [...] <hash_file>` | ZIP password hashes |

## Cracking Linux hashes

Với Linux, hash thường nằm trong `/etc/shadow`, còn thông tin user nằm trong `/etc/passwd`. John có thể crack tốt hơn nếu dùng `unshadow` để ghép hai file này lại.

```bash
unshadow passwd shadow > linux.hashes
john --wordlist=/usr/share/wordlists/rockyou.txt linux.hashes
john --show linux.hashes
```

Một số prefix hash phổ biến trong `/etc/shadow`:

| Prefix | Format |
| --- | --- |
| `$1$` | MD5-crypt |
| `$2a$`, `$2y$` | bcrypt |
| `$5$` | SHA-256-crypt |
| `$6$` | SHA-512-crypt |
| `$y$` | yescrypt |

## Cracking Windows hashes

NTLM hash thường dùng format `nt` trong John.

```bash
john --format=nt --wordlist=/usr/share/wordlists/rockyou.txt ntlm.hashes
john --show --format=nt ntlm.hashes
```

NetNTLMv2 thường được thu thập từ responder hoặc coercion trong lab nội bộ. Format hay dùng là `netntlmv2`.

```bash
john --format=netntlmv2 --wordlist=/usr/share/wordlists/rockyou.txt netntlmv2.hashes
```

## Cracking files

JtR đi kèm với nhiều công cụ `2john` có thể được sử dụng để xử lý các tập tin và tạo ra các mã băm tương thích với JtR.

Cú pháp tổng quát:

```bash
namng@htb[/htb]$ <tool> <file_to_crack> > file.hash
```

Một số công cụ đi kèm với JtR:

| Tool | Description |
| --- | --- |
| `pdf2john` | Converts PDF documents for John |
| `ssh2john` | Converts SSH private keys for John |
| `mscash2john` | Converts MS Cash hashes for John |
| `keychain2john` | Converts OS X keychain files for John |
| `rar2john` | Converts RAR archives for John |
| `pfx2john` | Converts PKCS#12 files for John |
| `truecrypt_volume2john` | Converts TrueCrypt volumes for John |
| `keepass2john` | Converts KeePass databases for John |
| `vncpcap2john` | Converts VNC PCAP files for John |
| `putty2john` | Converts PuTTY private keys for John |
| `zip2john` | Converts ZIP archives for John |
| `hccap2john` | Converts WPA/WPA2 handshake captures for John |
| `office2john` | Converts MS Office documents for John |
| `wpa2john` | Converts WPA/WPA2 handshakes for John |
| `gpg2john` | Converts GPG private keys for John |
| `bitlocker2john` | Converts BitLocker recovery data for John |

Collection lớn hơn có thể được tìm thấy trên Pwnbox:

```bash
namng@htb[/htb]$ locate *2john*

/usr/bin/bitlocker2john
/usr/bin/dmg2john
/usr/bin/gpg2john
/usr/bin/hccap2john
/usr/bin/keepass2john
/usr/bin/putty2john
/usr/bin/racf2john
/usr/bin/rar2john
/usr/bin/uaf2john
/usr/bin/vncpcap2john
/usr/bin/wlanhcx2john
/usr/bin/wpapcap2john
/usr/bin/zip2john

...SNIP...
```

## Examples with 2john

ZIP:

```bash
zip2john backup.zip > backup.zip.hash
john --wordlist=/usr/share/wordlists/rockyou.txt backup.zip.hash
john --show backup.zip.hash
```

RAR:

```bash
rar2john archive.rar > archive.rar.hash
john --wordlist=/usr/share/wordlists/rockyou.txt archive.rar.hash
```

SSH private key:

```bash
ssh2john id_rsa > id_rsa.hash
john --wordlist=/usr/share/wordlists/rockyou.txt id_rsa.hash
```

KeePass:

```bash
keepass2john database.kdbx > keepass.hash
john --wordlist=/usr/share/wordlists/rockyou.txt keepass.hash
```

Office:

```bash
office2john report.docx > office.hash
john --wordlist=/usr/share/wordlists/rockyou.txt office.hash
```

## Session management

John lưu trạng thái crack trong session. Điều này hữu ích khi chạy job lâu.

Đặt tên session:

```bash
john --session=ntlm_audit --format=nt --wordlist=wordlist.txt hashes.txt
```

Restore session:

```bash
john --restore=ntlm_audit
```

Xem status trong khi John đang chạy:

```text
Press any key in the John terminal
```

Hoặc dùng:

```bash
john --status=ntlm_audit
```

## Pot file

John lưu password đã crack vào `john.pot`. Nếu chạy lại cùng hash, John có thể hiển thị kết quả ngay mà không cần crack lại.

Xem kết quả:

```bash
john --show hashes.txt
```

Chỉ định pot file riêng cho từng engagement:

```bash
john --pot=client-a.pot --wordlist=wordlist.txt hashes.txt
john --pot=client-a.pot --show hashes.txt
```

## Performance options

Một số option hữu ích:

```bash
john --fork=4 --wordlist=wordlist.txt hashes.txt
john --node=1/4 --wordlist=wordlist.txt hashes.txt
john --test
```

Ý nghĩa:

| Option | Ý nghĩa |
| --- | --- |
| `--fork=N` | Chạy nhiều process trên cùng máy |
| `--node=M/N` | Chia workload giữa nhiều node |
| `--test` | Benchmark format |
| `--verbosity=N` | Điều chỉnh độ chi tiết output |

## Common commands

| Mục tiêu | Command |
| --- | --- |
| Crack bằng wordlist | `john --wordlist=wordlist.txt hashes.txt` |
| Chỉ định format | `john --format=nt --wordlist=wordlist.txt hashes.txt` |
| Dùng rule | `john --wordlist=wordlist.txt --rules hashes.txt` |
| Incremental | `john --incremental hashes.txt` |
| Mask | `john --mask='?u?l?l?l?l?d?d' hashes.txt` |
| Show cracked password | `john --show hashes.txt` |
| List formats | `john --list=formats` |
| List rules | `john --list=rules` |
| Restore session | `john --restore=<session_name>` |

## Notes

- Luôn xác định đúng format trước khi crack để tránh mất thời gian.
- Nên thử `single` và wordlist có rule trước khi dùng incremental.
- Hash chậm như bcrypt, yescrypt, PBKDF2, Office, KeePass sẽ tốn thời gian hơn nhiều so với NTLM hoặc raw MD5.
- LM hash yếu hơn NTLM vì chia password thành hai block 7 ký tự và không phân biệt chữ hoa/thường.
- Với engagement thật, nên ghi lại nguồn hash, format, command, wordlist, rule, thời gian chạy và kết quả.
- Không nên đưa `john.pot`, hash dump hoặc password cracked vào repository.
