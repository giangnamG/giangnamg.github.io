---
layout: post
title: "Introduction to Password Cracking"
date: 2026-05-04 17:30:00 +0700
render_with_liquid: false
categories:
  - Password Attack
tags:
  - password-attack
  - password-cracking
source_collection: manual
---
Topics: Password Attack

# Introduction to Password Cracking

Password cracking là quá trình khôi phục plaintext password từ hash hoặc từ dữ liệu đã được mã hóa/bảo vệ bằng password. Trong pentest, kỹ thuật này thường được dùng để đánh giá độ mạnh password policy, kiểm tra credential reuse, hoặc khai thác hash thu thập được trong phạm vi được phép.

Có 3 loại tấn công mật khẩu phổ biến:

1. Rainbow attack
2. Brute-force attack
3. Dictionary attack

Ngoài ra, trong thực tế còn có các biến thể quan trọng như rule-based attack, hybrid attack, password spraying và credential stuffing. Các kỹ thuật này có mục tiêu khác nhau, nên cần phân biệt rõ giữa `offline password cracking` và `online login attack`.

## Offline vs online attack

| Type | Mục tiêu | Đặc điểm |
| --- | --- | --- |
| Offline cracking | Crack hash hoặc file đã thu thập được | Nhanh hơn, không bị lockout, phụ thuộc vào tốc độ phần cứng và hash algorithm |
| Online attack | Thử đăng nhập trực tiếp vào service | Chậm hơn, dễ bị lockout/rate-limit/logging |

Ví dụ offline cracking:

- Crack NTLM hash từ Windows
- Crack `/etc/shadow` từ Linux
- Crack ZIP, RAR, PDF, Office, KeePass, SSH private key

Ví dụ online attack:

- Password spraying vào VPN, OWA, SSH, SMB
- Credential stuffing vào web login
- Brute-force form đăng nhập trong lab

## Hashing basics

Password thường không được lưu dưới dạng plaintext. Hệ thống sẽ lưu hash của password.

Ví dụ:

```text
password -> MD5 -> 5f4dcc3b5aa765d61d8327deb882cf99
```

Khi user đăng nhập, hệ thống hash password vừa nhập rồi so sánh với hash đã lưu. Nếu hai hash giống nhau, password được xem là đúng.

Điểm quan trọng:

- Hash là one-way function, không giải mã ngược như encryption thông thường.
- Cracking thực chất là đoán password candidate, hash candidate đó, rồi so sánh với hash mục tiêu.
- Hash càng nhanh như MD5, NTLM, SHA1 thì càng dễ bị crack bằng GPU.
- Hash chậm như bcrypt, scrypt, Argon2, PBKDF2, yescrypt làm cracking tốn kém hơn.

## Salt

Salt là giá trị random được thêm vào password trước khi hash.

```text
hash = Hash(password + salt)
```

Salt giúp chống lại rainbow table vì cùng một password nhưng salt khác nhau sẽ tạo ra hash khác nhau.

Ví dụ:

| Password | Salt | Hash result |
| --- | --- | --- |
| password | salt1 | Hash khác |
| password | salt2 | Hash khác |
| password | salt3 | Hash khác |

Lưu ý: Salt không làm password yếu trở nên mạnh. Nó chỉ làm việc precompute hash hàng loạt kém hiệu quả hơn.

## Rainbow attack

Rainbow attack sử dụng bảng đã được precompute trước, ánh xạ password candidate sang hash tương ứng. Khi có hash mục tiêu, attacker tra bảng để tìm plaintext password.

Ví dụ bảng MD5:

| Password | MD5 Hash |
| --- | --- |
| 123456 | e10adc3949ba59abbe56e057f20f883e |
| 12345 | 827ccb0eea8a706c4c34a16891f84e7b |
| 123456789 | 25f9e794323b453885f5181f1b624d0b |
| password | 5f4dcc3b5aa765d61d8327deb882cf99 |
| iloveyou | f25a2fc72690b780b2a14e140ef6a9e0 |
| princess | 8afa847f50a716e64932d995c8e7435a |
| 1234567 | fcea920f7412b5da7be0cf42b8c93759 |
| rockyou | f806fc5a2a0d5ba2471600758452799c |
| 12345678 | 25d55ad283aa400af464c76d713c07ad |
| abc123 | e99a18c428cb38d5f260853678922e03 |
| ...SNIP... | ...SNIP... |

Ưu điểm:

- Tra cứu nhanh nếu hash đã nằm trong bảng.
- Hiệu quả với hash không salt và thuật toán nhanh.

Nhược điểm:

- Tốn dung lượng lưu trữ lớn.
- Kém hiệu quả với salted hash.
- Không hiệu quả nếu password không nằm trong không gian đã precompute.

Defense:

- Dùng salt random đủ dài cho mỗi user.
- Dùng password hashing algorithm chậm như Argon2id, bcrypt, scrypt, PBKDF2.
- Bắt buộc password mạnh và chống credential reuse.

## Brute-force attack

Brute-force attack thử toàn bộ candidate trong một không gian ký tự nhất định. Ví dụ thử tất cả chuỗi dài 5 ký tự gồm chữ hoa, chữ thường và số.

| Brute-force attempt | MD5 Hash |
| --- | --- |
| ...SNIP... | ...SNIP... |
| Sxejd | 2cdc813ef26e6d20c854adb107279338 |
| Sxeje | 7703349a1f943f9da6d1dfcda51f3b63 |
| Sxejf | db914f10854b97946046eabab2287178 |
| Sxejg | c0ceb70c0e0f2c3da94e75ae946f29dc |
| Sxejh | 4dca0d2b706e9344985d48f95e646ce8 |
| Sxeji | 66b5fa128df895d50b2d70353a7968a7 |
| Sxejj | dd7097ba514c136caac321e321b1b5ca |
| Sxejk | c0eb1193e62a7a57dec2fafd4177f7d9 |
| Sxejl | 5ad8e1282437da255b866d22339d1b53 |
| Sxejm | c4b95c1fe6d2a4f22620efd54c066664 |
| ...SNIP... | ...SNIP... |

Brute-force rất dễ hiểu nhưng nhanh chóng trở nên tốn kém khi password dài hơn.

Công thức tính không gian tìm kiếm:

```text
keyspace = charset_size ^ password_length
```

Ví dụ:

| Charset | Length | Keyspace |
| --- | --- | --- |
| 10 chữ số | 6 | 10^6 |
| 26 chữ thường | 8 | 26^8 |
| 62 chữ hoa/thường/số | 10 | 62^10 |
| 95 printable ASCII | 12 | 95^12 |

Defense:

- Tăng độ dài password hoặc passphrase.
- Dùng MFA cho online login.
- Rate-limit, lockout hợp lý và alert hành vi bất thường.
- Dùng hashing algorithm chậm cho password storage.

## Dictionary attack

Dictionary attack thử password từ wordlist. Wordlist thường được tạo từ dữ liệu leak, password phổ biến, tên công ty, từ khóa theo ngữ cảnh, hoặc thông tin OSINT.

Ví dụ với `rockyou.txt`:

```powershell
namng@htb[/htb]$ head --lines=20 /usr/share/wordlists/rockyou.txt

123456
12345
123456789
password
iloveyou
princess
1234567
rockyou
12345678
abc123
nicole
daniel
babygirl
monkey
lovely
jessica
654321
michael
ashley
qwerty
```

Dictionary attack hiệu quả vì người dùng thường chọn password dễ nhớ, có pattern, hoặc reuse password từ dịch vụ khác.

Ví dụ dùng John The Ripper:

```bash
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
```

Ví dụ dùng Hashcat:

```bash
hashcat -m 0 hashes.txt /usr/share/wordlists/rockyou.txt
```

## Rule-based attack

Rule-based attack biến đổi wordlist thành nhiều candidate mới. Đây là kỹ thuật rất quan trọng vì user thường không dùng đúng từ trong wordlist, mà biến đổi nó một chút.

Ví dụ biến đổi:

| Input | Rule idea | Candidate |
| --- | --- | --- |
| password | Thêm số | password1 |
| password | Viết hoa chữ đầu | Password |
| password | Thêm năm | password2026 |
| password | Thay ký tự | p@ssw0rd |
| company | Thêm ký tự đặc biệt | Company! |

John:

```bash
john --wordlist=wordlist.txt --rules hashes.txt
```

Hashcat:

```bash
hashcat -m 0 hashes.txt wordlist.txt -r rules/best64.rule
```

## Hybrid attack

Hybrid attack kết hợp dictionary với brute-force hoặc mask.

Ví dụ password có dạng `word` + 2 số:

```bash
hashcat -m 0 hashes.txt wordlist.txt -a 6 ?d?d
```

Ví dụ với John Jumbo mask mode:

```bash
john --wordlist=wordlist.txt --mask='?w?d?d' hashes.txt
```

Hybrid thường hiệu quả hơn brute-force thuần vì ưu tiên các pattern con người hay dùng.

## Password spraying

Password spraying là online attack, thử một số ít password phổ biến trên nhiều account để tránh lockout từng user.

Ví dụ pattern:

```text
Spring2026!
Company2026!
Welcome1
Password1
```

Defense:

- MFA.
- Detect nhiều account fail với cùng một password.
- Password policy chặn password phổ biến.
- Rate-limit theo IP, ASN, device fingerprint và user population.

## Credential stuffing

Credential stuffing là thử credential đã leak từ dịch vụ khác vào hệ thống mục tiêu.

Ví dụ:

```text
email@example.com:OldPassword123!
```

Defense:

- MFA.
- Kiểm tra password against breach corpus khi user đặt password.
- Alert login bất thường theo location/device.
- Không reuse password giữa các dịch vụ.

## Password cracking workflow

Workflow thực tế:

1. Xác định loại hash hoặc file cần crack.
2. Normalize input đúng format cho tool.
3. Thử wordlist phổ biến trước.
4. Thêm rule-based attack.
5. Dùng wordlist theo ngữ cảnh mục tiêu.
6. Dùng hybrid/mask nếu biết password policy.
7. Chỉ brute-force khi keyspace đủ nhỏ hoặc có lý do rõ ràng.
8. Ghi lại command, wordlist, rule, format, thời gian chạy và kết quả.

## Tooling

| Tool | Use case |
| --- | --- |
| John The Ripper | Crack nhiều loại hash/file, có `2john` converters |
| Hashcat | GPU cracking mạnh, hỗ trợ nhiều attack mode |
| hashid | Gợi ý loại hash |
| name-that-hash | Gợi ý loại hash |
| CeWL | Tạo wordlist từ website |
| crunch | Generate wordlist theo charset/pattern |
| cupp | Tạo wordlist theo thông tin cá nhân |
| princeprocessor | Generate candidate theo PRINCE attack |

## Common commands

John The Ripper:

```bash
john --list=formats
john --wordlist=/usr/share/wordlists/rockyou.txt hashes.txt
john --wordlist=wordlist.txt --rules hashes.txt
john --show hashes.txt
```

Hashcat:

```bash
hashcat --help
hashcat -m <hash_mode> hashes.txt wordlist.txt
hashcat -m <hash_mode> hashes.txt wordlist.txt -r rules/best64.rule
hashcat -m <hash_mode> hashes.txt -a 3 '?u?l?l?l?l?d?d'
```

## Notes

- Password length thường quan trọng hơn complexity ngắn.
- Passphrase dài dễ nhớ và khó brute-force hơn password ngắn phức tạp.
- Hash nhanh như MD5, SHA1, NTLM không phù hợp để lưu password.
- Salt chống rainbow table nhưng không thay thế hashing algorithm chậm.
- MFA giảm mạnh rủi ro từ password reuse và credential stuffing.
- Trong pentest, không commit hash dump, cracked password hoặc pot file vào repository.
