---
layout: post
title: "Authentication"
render_with_liquid: false
categories:
  - PortSwigger
tags:
  - portswigger
  - authentication
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Server-side

# **Lab 01: Username enumeration via different responses**

&gt; Mô tả
Bài lab này dễ bị tấn công bằng cách liệt kê tên người dùng và tấn công đánh cắp mật khẩu. Nó có một tài khoản với tên người dùng và mật khẩu có thể dự đoán được, có thể tìm thấy trong các danh sách từ sau:
&gt; 
&gt; - [Candidate usernames](https://portswigger.net/web-security/authentication/auth-lab-usernames)
&gt; - [Candidate passwords](https://portswigger.net/web-security/authentication/auth-lab-passwords)
&gt; Để giải quyết lab này, hãy liệt kê một tên đăng nhập hợp lệ, tấn công bằng brute-force , sau đó truy cập trang tài khoản của họ.

Brute-force bằng BurpSuite phổ biến quá rồi, mình sẽ làm bằng ffuf nhóe 

Đầu tiên chúng ta hãy xem qua form đăng nhập của lab

![{42E43AC4-B7DB-4514-AD6B-0E82FCEB37F4}.png](/assets/img/portswigger/authentication/42E43AC4-B7DB-4514-AD6B-0E82FCEB37F4.png)

Chúng ta thấy khi đăng nhập sai, phản hồi trả về là `Invalid username`

Ứng dụng phản username đăng nhập không đúng rồi, kiểu logic này rất dễ bị fuzzing ra username nhé

Theo logic bài này, thì chúng ta sẽ đi tìm username hợp lệ rồi mới tìm password của username hợp lệ đó

Lưu 2 file wordlist mà portswigger cung cấp trước đã nhé

![{5E78CD87-2636-451C-AEC0-C603466E357B}.png](/assets/img/portswigger/authentication/5E78CD87-2636-451C-AEC0-C603466E357B.png)

Sau đó chúng ta sử dụng FFUF để brute-force, lệnh sẽ như sau:

```markdown
ffuf -u "https://0a7500ad0484744080388fdd000a0096.web-security-academy.net/login" \
     -X POST -http2 -d "username=USER&password=PASS" \
     -w usernames.txt:USER -w passwords.txt:PASS \
     -fr "Invalid" -t 100
```

![{B5EAB22B-CD32-4FF4-BE35-6541345BC568}.png](/assets/img/portswigger/authentication/B5EAB22B-CD32-4FF4-BE35-6541345BC568.png)

Người dùng `akamai` được khớp với khá nhiểu password, ta đăng nhập thử với 1 password tìm được bất kỳ nhé

![image.png](/assets/img/portswigger/authentication/image.png)

Phản hồi trả về là `Incorrect password` có vẻ như username=akamai là đúng

Tiếp tục brute-force password của `akamai` bằng cách bỏ qua phản hồi có chứ từ khóa `Incorrect password` đi

```markdown
ffuf -u "https://0a7500ad0484744080388fdd000a0096.web-security-academy.net/login" \                                                                                                                         ─╯
     -X POST -http2 -d "username=USER&password=PASS" \
     -w usernames.txt:USER -w passwords.txt:PASS \
     -fr "Invalid|Incorrect" -t 100
```

![image.png](/assets/img/portswigger/authentication/image%201.png)

Ta tìm được password của `akamai` là `superman` với status code là `302`

Hãy đăng nhập thử nhé

![image.png](/assets/img/portswigger/authentication/image%202.png)

# **Lab 02: 2FA simple bypass**

**1. Lỗ hổng này là gì?**

**2FA Bypass** xảy ra khi ứng dụng **không kiểm tra xem user đã hoàn thành bước xác thực 2FA chưa** trước khi cho phép truy cập các trang được bảo vệ.

**Logic lỗi:**

`Login (username/password) → 2FA page → /my-account
                              ↓
                      Attacker skip trực tiếp đến /my-account`

**2. Nguyên nhân lỗ hổng**

Server chỉ kiểm tra:

- ✅ User đã đăng nhập chưa (session tồn tại)
- ❌ **KHÔNG** kiểm tra user đã verify 2FA chưa

**3. Quy trình khai thác**

Bước 1: Đăng nhập tài khoản của bạn trước (để hiểu flow)

`wiener:peter → Nhận mã 2FA qua email → Xác nhận → /my-account`

**Ghi nhớ URL sau khi login thành công:** `/my-account`

Bước 2: Đăng nhập tài khoản nạn nhân

`carlos:montoya → Được redirect đến trang nhập mã 2FA`

Bước 3: Bypass 2FA

**Thay vì nhập mã 2FA**, bạn chỉ cần:

- Thay đổi URL trực tiếp từ `/login2` → `/my-account`

4. Tóm tắt các bước thực hiện

| Bước | Hành động | URL |
| --- | --- | --- |
| 1 | Login với carlos:montoya | `/login` |
| 2 | Server redirect đến 2FA | `/login2` |
| 3 | **BYPASS**: Đổi URL thủ công | `/my-account` |
| 4 | Lab solved! ✅ | Account page loads |

5. Tại sao attack này hoạt động?

`┌─────────────────────────────────────────────────────────┐
│                    SERVER LOGIC                         │
├─────────────────────────────────────────────────────────┤
│  POST /login (username + password)                      │
│       ↓                                                 │
│  [Set session cookie] ← Session đã active sau bước này │
│       ↓                                                 │
│  Redirect → /login2 (2FA page)                         │
│       ↓                                                 │
│  GET /my-account                                        │
│       ↓                                                 │
│  Server check: session valid? → YES → Show page        │
│  Server KHÔNG check: 2FA verified? → ❌ MISSING        │
└─────────────────────────────────────────────────────────┘`

# **Lab 03: Password reset broken logic**

## 1. Lỗ hổng là gì?

Server **không validate reset token** khi đổi mật khẩu. Attacker có thể xóa token và thay đổi username để đổi password của bất kỳ ai.

---

## 2. Flow bình thường vs Flow tấn công

### Flow Password Reset bình thường:

```jsx
┌─────────┐         ┌─────────┐         ┌─────────┐
│  User   │         │ Server  │         │  Email  │
└────┬────┘         └────┬────┘         └────┬────┘
     │                   │                   │
     │ 1. Forgot pass    │                   │
     │   username=wiener │                   │
     │──────────────────>│                   │
     │                   │                   │
     │                   │ 2. Generate token │
     │                   │   abc123xyz       │
     │                   │──────────────────>│
     │                   │                   │
     │      3. Email với link:               │
     │      /forgot-password?token=abc123xyz │
     │<──────────────────────────────────────│
     │                   │                   │
     │ 4. Click link     │                   │
     │    Submit new pass│                   │
     │    + token=abc123 │                   │
     │──────────────────>│                   │
     │                   │                   │
     │                   │ 5. Validate:      │
     │                   │    token valid?   │
     │                   │    token=user?    │
     │                   │    token expired? │
     │                   │                   │
     │  6. Password      │                   │
     │     changed!      │                   │
     │<──────────────────│                   │
     ▼                   ▼                   ▼
```

### Flow tấn công (Exploit):

```jsx
┌──────────┐                    ┌─────────┐
│ Attacker │                    │ Server  │
└────┬─────┘                    └────┬────┘
     │                               │
     │ 1. Request reset cho wiener   │
     │──────────────────────────────>│
     │                               │
     │ 2. Nhận email với token       │
     │<──────────────────────────────│
     │                               │
     │ 3. Intercept request trong    │
     │    Burp, modify:              │
     │    - Xóa token (để rỗng)      │
     │    - Đổi username → carlos    │
     │                               │
     │ 4. Send modified request:     │
     │    token=                     │
     │    username=carlos ←──────── THAY ĐỔI
     │    new-password=hacked        │
     │──────────────────────────────>│
     │                               │
     │                               │ 5. Server KHÔNG
     │                               │    validate token
     │                               │    ↓
     │                               │    Đổi pass carlos!
     │                               │
     │ 6. Login carlos:hacked        │
     │──────────────────────────────>│
     │                               │
     │ 7. Access granted! ✓          │
     │<──────────────────────────────│
     ▼                               ▼
```

---

## 3. Visualize Request Modification

```jsx
╔═══════════════════════════════════════════════════════════════════════╗
║                        REQUEST GỐC (Hợp lệ)                           ║
╠═══════════════════════════════════════════════════════════════════════╣
║ POST /forgot-password?temp-forgot-password-token=abc123xyz HTTP/2     ║
║                                                                       ║
║ temp-forgot-password-token=abc123xyz                                  ║
║ username=wiener                                                       ║
║ new-password-1=newpass                                                ║
║ new-password-2=newpass                                                ║
╚═══════════════════════════════════════════════════════════════════════╝
                                    │
                                    │ MODIFY
                                    ▼
╔═══════════════════════════════════════════════════════════════════════╗
║                       REQUEST EXPLOIT                                 ║
╠═══════════════════════════════════════════════════════════════════════╣
║ POST /forgot-password?temp-forgot-password-token= HTTP/2              ║
║                                                 ▲                     ║
║                                                 └─── XÓA TOKEN        ║
║                                                                       ║
║ temp-forgot-password-token=  ◄─────────────────────── XÓA TOKEN       ║
║ username=carlos              ◄─────────────────────── ĐỔI USERNAME    ║
║ new-password-1=hacked                                                 ║
║ new-password-2=hacked                                                 ║
╚═══════════════════════════════════════════════════════════════════════╝
```

---

## 4. Các bước khai thác

| Bước | Hành động | Mục đích |
| --- | --- | --- |
| 1 | Click "Forgot password", nhập `wiener` | Trigger flow reset |
| 2 | Check email, lấy link reset | Có request mẫu |
| 3 | Trong Burp HTTP History, tìm `POST /forgot-password?temp-forgot-password-token=...` | Phân tích request |
| 4 | Send to Repeater | Chuẩn bị modify |
| 5 | Xóa giá trị token ở URL và body | Test validation |
| 6 | Đổi `username=carlos` | Target victim |
| 7 | Send request | Đổi password carlos |
| 8 | Login `carlos:hacked` | Verify exploit |

---

## 5. Server Logic So Sánh

```jsx
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER LỖI (Lab này)                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   def reset_password(request):                                  │
│       username = request.POST['username']                       │
│       new_pass = request.POST['new-password-1']                 │
│                                                                 │
│       # ❌ Token được lấy nhưng KHÔNG validate                  │
│       token = request.POST['token']                             │
│                                                                 │
│       # ❌ Đổi pass trực tiếp dựa vào username                  │
│       user = get_user(username)                                 │
│       user.password = new_pass  ←── NGUY HIỂM!                  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

```jsx
┌─────────────────────────────────────────────────────────────────┐
│                    SERVER ĐÚNG                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   def reset_password(request):                                  │
│       token = request.POST['token']                             │
│       username = request.POST['username']                       │
│                                                                 │
│       # ✅ Validate đầy đủ                                      │
│       if not token:                                             │
│           return ERROR                                          │
│                                                                 │
│       reset_req = get_reset_request(token)                      │
│       if not reset_req:                     # Token tồn tại?    │
│           return ERROR                                          │
│       if reset_req.username != username:    # Token đúng user?  │
│           return ERROR                                          │
│       if reset_req.expired:                 # Token hết hạn?    │
│           return ERROR                                          │
│       if reset_req.used:                    # Token đã dùng?    │
│           return ERROR                                          │
│                                                                 │
│       # ✅ Chỉ đổi pass khi mọi thứ OK                          │
│       user.password = new_pass                                  │
│       reset_req.used = True                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Checklist kiểm tra Password Reset

```jsx
┌────┬─────────────────────────────────┬──────────┬──────────┐
│ #  │ Test Case                       │ Expected │ Lab này  │
├────┼─────────────────────────────────┼──────────┼──────────┤
│ 1  │ Token rỗng                      │ ❌ Reject │ ✅ Accept │
│ 2  │ Token random/sai                │ ❌ Reject │ ✅ Accept │
│ 3  │ Token của user A cho user B     │ ❌ Reject │ ✅ Accept │
│ 4  │ Token hết hạn                   │ ❌ Reject │ N/A      │
│ 5  │ Token đã sử dụng (reuse)        │ ❌ Reject │ N/A      │
│ 6  │ Thay đổi username trong request │ ❌ Reject │ ✅ Accept │
└────┴─────────────────────────────────┴──────────┴──────────┘
```

# **Lab 04: Username enumeration via subtly different responses**

**Lab: Dò tìm tên người dùng thông qua các phản hồi khác biệt nhỏ**

Lab này tồn tại một lỗ hổng tinh tế cho phép dò tìm tên người dùng (username enumeration) và tấn công dò mật khẩu (password brute-force). Nó chứa một tài khoản với tên người dùng và mật khẩu dễ đoán, có thể tìm thấy trong các danh sách từ (wordlist) sau:

- [**Danh sách tên người dùng ứng viên**](https://portswigger.net/web-security/authentication/auth-lab-usernames)
- [**Danh sách mật khẩu ứng viên**](https://portswigger.net/web-security/authentication/auth-lab-passwords)

Để giải quyết lab, hãy dò tìm ra một tên người dùng hợp lệ, thực hiện brute-force mật khẩu của người dùng đó, sau đó truy cập vào trang tài khoản của họ.

1. Khi Burp đang chạy, hãy gửi một tên người dùng và mật khẩu không hợp lệ. Bôi đen tham số username trong yêu cầu POST /login và gửi nó đến **Burp Intruder**.
2. Đi tới tab **Intruder**. Chú ý rằng tham số username đã tự động được đánh dấu là vị trí payload (vị trí chèn dữ liệu thử nghiệm).
3. Trong bảng điều khiển **Payloads** bên cạnh, đảm bảo rằng loại payload **Simple list** được chọn và thêm [**danh sách các tên người dùng ứng viên**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fportswigger.net%2Fweb-security%2Fauthentication%2Fauth-lab-usernames) vào.
4. Nhấp vào tab **Settings** để mở bảng cài đặt. Trong mục **Grep - Extract**, nhấp **Add**. Trong hộp thoại xuất hiện, cuộn xuống phần phản hồi (response) cho đến khi bạn tìm thấy thông báo lỗi Invalid username or password.. Sử dụng chuột để bôi đen nội dung văn bản của thông báo đó. Các cài đặt khác sẽ tự động được điều chỉnh. Nhấp **OK** và sau đó bắt đầu cuộc tấn công (**Start attack**).
5. Khi cuộc tấn công hoàn tất, hãy chú ý rằng có thêm một cột chứa thông báo lỗi mà bạn đã trích xuất. Sắp xếp kết quả dựa trên cột này để nhận thấy rằng một trong số chúng có sự khác biệt nhỏ.
6. Quan sát kỹ hơn phản hồi khác biệt này và nhận thấy rằng nó chứa một lỗi đánh máy trong thông báo lỗi - thay vì dấu chấm (.), lại có một khoảng trắng (dấu cách) ở cuối. Hãy ghi nhớ tên người dùng này.
7. Đóng cửa sổ kết quả và quay lại tab **Intruder**. Điền tên người dùng bạn vừa xác định vào và thêm vị trí payload vào tham số password:
    
    username=ten-nguoi-dung-da-tim-thay&password=§invalid-password§
    
8. Trong bảng điều khiển **Payloads**, xóa danh sách tên người dùng cũ và thay thế bằng [**danh sách các mật khẩu**](https://www.google.com/url?sa=E&q=https%3A%2F%2Fportswigger.net%2Fweb-security%2Fauthentication%2Fauth-lab-passwords). Bắt đầu cuộc tấn công.
9. Khi cuộc tấn công hoàn tất, hãy chú ý rằng một trong các yêu cầu đã nhận được phản hồi 302. Hãy ghi nhớ mật khẩu này.
10. Đăng nhập bằng tên người dùng và mật khẩu mà bạn đã xác định, sau đó truy cập trang tài khoản người dùng để hoàn thành lab.

# **Lab: 2FA bypass using a brute-force attack**

### **Tóm tắt nội dung**

Bài lab này mô tả một tình huống mà cơ chế xác thực hai yếu tố (2FA) của một trang web có lỗ hổng, cho phép kẻ tấn công vượt qua bằng phương pháp brute-force. Người thực hành đã có được tên người dùng và mật khẩu hợp lệ (carlos:montoya) nhưng không có mã xác minh 2FA. Mục tiêu của bài lab là thực hiện tấn công brute-force để tìm ra mã 2FA, từ đó truy cập vào trang tài khoản của người dùng "carlos".

Một điểm đáng chú ý của hệ thống này là người dùng sẽ bị đăng xuất sau hai lần nhập sai mã 2FA. Đây có vẻ là một cơ chế bảo vệ, nhưng nó lại có thể bị khai thác. Kẻ tấn công có thể tự động hóa quá trình đăng nhập lại sau mỗi lần thử sai, khiến cho việc giới hạn số lần thử trở nên vô hiệu.

## **Các bước giải quyết**

**1. Cấu hình Burp Macro để tự động đăng nhập lại:**

- **Phân tích:** Nhận thấy rằng sau hai lần nhập mã 2FA không chính xác, hệ thống sẽ tự động đăng xuất người dùng. Để có thể thử tất cả các mã có thể, cần phải tự động đăng nhập lại sau mỗi lần thử.
- **Thực hiện:**
    - Trong Burp Suite, đi tới `Settings` &gt; `Sessions`.
    - Tạo một quy tắc xử lý phiên (`Session Handling Rule`) mới.
    - Trong tab `Scope`, chọn áp dụng cho tất cả các URL (`Include all URLs`).
    - Quay lại tab `Details`, thêm một hành động (`Rule Action`) → Chọn `Run a macro`.
    - Ghi lại một macro bao gồm ba yêu cầu (request) của quá trình đăng nhập bằng cách giữ control và chọn vào 3 request sau **GET /login, POST /login (với thông tin đăng nhập của carlos), và GET /login2.**
    - Kiểm tra macro để đảm bảo nó hoạt động chính xác bằng cách xác nhận rằng phản hồi cuối cùng là trang yêu cầu nhập mã 2FA.

**2. Sử dụng Burp Intruder để Brute-force mã 2FA:**

- **Chuẩn bị tấn công:**
    - Gửi yêu cầu POST /login2 (yêu cầu xác thực mã 2FA) đến Burp Intruder.
    - Trong Burp Intruder, xác định tham số chứa mã 2FA (mfa-code) làm vị trí tấn công (payload position).
- **Cấu hình Payloads:**
    - Chọn loại payload là "`Numbers`".
    - Thiết lập phạm vi từ 0 đến 9999, với bước nhảy là 1.
    - Định dạng số thành chuỗi có 4 chữ số (ví dụ: 0001, 0012, ...) bằng cách set `min/max integer digits` = 4 và `max fraction digits` = 0.
- **Cấu hình Resource Pool:**
    - Thiết lập số lượng yêu cầu đồng thời tối đa (`Maximum concurrent requests`) là `1`. Điều này rất quan trọng để tránh bị đăng xuất do nhập sai quá hai lần liên tiếp.
- **Thực hiện tấn công và tìm kết quả:**
    - Bắt đầu cuộc tấn công.
    - Theo dõi kết quả và tìm kiếm yêu cầu có mã trạng thái (status code) là 302, điều này cho thấy một sự chuyển hướng, nghĩa là mã 2FA đã được chấp nhận.
    - Khi tìm thấy yêu cầu thành công, hiển thị phản hồi trong trình duyệt ("Show response in browser") và sao chép URL để truy cập vào tài khoản của Carlos và hoàn thành bài lab.
