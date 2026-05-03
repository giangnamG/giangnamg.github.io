---
layout: post
title: "Authentication"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - authentication
source_collection: portswigger_web_security_academy
---

# Authentication - PortSwigger Study Notes

> Phạm vi: ghi chú này tổng hợp và trình bày lại nội dung từ PortSwigger Web Security Academy về Authentication. Nội dung chỉ dùng cho học tập, lab, kiểm thử hợp pháp, hoặc hệ thống đã được ủy quyền.

Nguồn chính:

- [Authentication vulnerabilities](https://portswigger.net/web-security/authentication#what-is-authentication)
- [Vulnerabilities in password-based login](https://portswigger.net/web-security/authentication/password-based)
- [Vulnerabilities in multi-factor authentication](https://portswigger.net/web-security/authentication/multi-factor)
- [Vulnerabilities in other authentication mechanisms](https://portswigger.net/web-security/authentication/other-mechanisms)
- [How to secure your authentication mechanisms](https://portswigger.net/web-security/authentication/securing)

## 0. Source Coverage Map

| Source | Original heading/subheading | Covered in module | Status |
|---|---|---|---|
| Authentication vulnerabilities | Authentication vulnerabilities | 1, 2, 9 | Đã xử lý |
| Authentication vulnerabilities | Labs | 1, 8 | Đã xử lý |
| Authentication vulnerabilities | What is authentication? | 1, 2 | Đã xử lý |
| Authentication vulnerabilities | What is the difference between authentication and authorization? | 1, 2, 7 | Đã xử lý |
| Authentication vulnerabilities | How do authentication vulnerabilities arise? | 1, 2 | Đã xử lý |
| Authentication vulnerabilities | What is the impact of vulnerable authentication? | 1, 2 | Đã xử lý |
| Authentication vulnerabilities | Vulnerabilities in authentication mechanisms | 1, 3, 4, 5 | Đã xử lý |
| Authentication vulnerabilities | Vulnerabilities in third-party authentication mechanisms | 1 | Đã xử lý |
| Authentication vulnerabilities | Read more - OAuth authentication | 1 | Đã xử lý |
| Authentication vulnerabilities | Preventing attacks on your own authentication mechanisms | 6 | Đã xử lý |
| Authentication vulnerabilities | Read more - How to secure your authentication mechanisms | 6 | Đã xử lý |
| Authentication vulnerabilities | Find vulnerabilities in your authentication using Burp Suite | 1, 8 | Đã xử lý |
| Password-based login | Vulnerabilities in password-based login | 3 | Đã xử lý |
| Password-based login | Brute-force attacks | 3, 7, 8 | Đã xử lý |
| Password-based login | Brute-forcing usernames | 3 | Đã xử lý |
| Password-based login | Brute-forcing passwords | 3 | Đã xử lý |
| Password-based login | Username enumeration | 3, 6, 7, 8 | Đã xử lý |
| Password-based login | Flawed brute-force protection | 3, 6 | Đã xử lý |
| Password-based login | Account locking | 3, 7, 8 | Đã xử lý |
| Password-based login | User rate limiting | 3, 6, 7, 8 | Đã xử lý |
| Password-based login | HTTP basic authentication | 3, 7, 8 | Đã xử lý |
| Password-based login | Find vulnerabilities in your authentication using Burp Suite | 8 | Đã xử lý |
| Multi-factor authentication | Vulnerabilities in multi-factor authentication | 4 | Đã xử lý |
| Multi-factor authentication | Two-factor authentication tokens | 4, 7 | Đã xử lý |
| Multi-factor authentication | Bypassing two-factor authentication | 4, 8 | Đã xử lý |
| Multi-factor authentication | Flawed two-factor verification logic | 4, 6, 8 | Đã xử lý |
| Multi-factor authentication | Brute-forcing 2FA verification codes | 4, 6, 8 | Đã xử lý |
| Multi-factor authentication | Find vulnerabilities in your authentication using Burp Suite | 8 | Đã xử lý |
| Other authentication mechanisms | Vulnerabilities in other authentication mechanisms | 5 | Đã xử lý |
| Other authentication mechanisms | Keeping users logged in | 5 | Đã xử lý |
| Other authentication mechanisms | Resetting user passwords | 5 | Đã xử lý |
| Other authentication mechanisms | Sending passwords by email | 5 | Đã xử lý |
| Other authentication mechanisms | Resetting passwords using a URL | 5 | Đã xử lý |
| Other authentication mechanisms | Read more - Password reset poisoning | 5, 7 | Đã xử lý |
| Other authentication mechanisms | Changing user passwords | 5 | Đã xử lý |
| Other authentication mechanisms | Find vulnerabilities in your authentication using Burp Suite | 8 | Đã xử lý |
| Securing authentication mechanisms | How to secure your authentication mechanisms | 6 | Đã xử lý |
| Securing authentication mechanisms | Take care with user credentials | 6 | Đã xử lý |
| Securing authentication mechanisms | Don't count on users for security | 6 | Đã xử lý |
| Securing authentication mechanisms | Prevent username enumeration | 6 | Đã xử lý |
| Securing authentication mechanisms | Implement robust brute-force protection | 6 | Đã xử lý |
| Securing authentication mechanisms | Triple-check your verification logic | 6 | Đã xử lý |
| Securing authentication mechanisms | Don't forget supplementary functionality | 6 | Đã xử lý |
| Securing authentication mechanisms | Implement proper multi-factor authentication | 6 | Đã xử lý |
| Securing authentication mechanisms | Find vulnerabilities in your authentication using Burp Suite | 8 | Đã xử lý |

## 1. Module Overview

Authentication là quá trình xác minh danh tính của user hoặc client. Vì website có thể bị truy cập từ Internet, authentication mechanism cần đủ mạnh để ngăn người không hợp lệ truy cập dữ liệu và chức năng nhạy cảm.

Authentication khác Authorization ở điểm cốt lõi:

- Authentication trả lời câu hỏi: "Bạn có đúng là người bạn tự nhận không?"
- Authorization trả lời câu hỏi: "Sau khi đã xác thực, bạn có được phép làm hành động này không?"

Authentication vulnerabilities thường nghiêm trọng vì một lỗi nhỏ trong login flow có thể dẫn tới account takeover. Khi account bị chiếm, attacker có toàn bộ quyền của account đó. Nếu account có quyền cao, attacker có thể kiểm soát ứng dụng hoặc tiếp cận hạ tầng nội bộ. Ngay cả low-privileged account cũng có thể mở thêm attack surface ở các trang nội bộ không public.

Theo PortSwigger, authentication vulnerabilities thường phát sinh từ hai nhóm nguyên nhân:

- Cơ chế quá yếu trước brute-force attack.
- Logic flaw hoặc poor coding khiến attacker bypass authentication hoàn toàn. Đây thường được gọi là broken authentication.

Website authentication thường không chỉ có login form. Các chức năng như password reset, password change, remember me, 2FA, và third-party authentication cũng là attack surface. Các lab của PortSwigger dùng Burp Suite để thực hành trên mục tiêu cố ý dễ tổn thương; ghi chú này chỉ đặt trong bối cảnh tương tự.

Vulnerabilities in third-party authentication mechanisms: PortSwigger tách OAuth authentication thành topic riêng. Ghi chú này chỉ nhắc rằng third-party login cũng là authentication surface, còn chi tiết OAuth thuộc module riêng.

## 2. Module 1: Authentication Fundamentals

### Authentication

- Giải thích ngắn gọn: Authentication là quá trình xác minh identity — danh tính của user hoặc client.
- Ý nghĩa bảo mật: Nếu xác minh sai, hệ thống có thể cấp quyền truy cập cho người không hợp lệ.
- Ví dụ dễ hiểu: User nhập username `Carlos123` và password; hệ thống cần kiểm tra người đó có thật sự là chủ account không.
- Lỗi thường gặp: Chỉ dựa vào password yếu, không chống brute-force, hoặc có logic cho phép bỏ qua bước xác thực.
- Ghi chú từ PortSwigger: Robust authentication là thành phần nền tảng của web security vì website thường public trên Internet.

### Something you know

- Giải thích ngắn gọn: Something you know là factor dựa trên thứ user biết, ví dụ password hoặc câu trả lời security question.
- Ý nghĩa bảo mật: Nếu attacker đoán, thu thập, hoặc brute-force được giá trị này, factor bị compromise.
- Ví dụ dễ hiểu: Password, PIN, answer cho câu hỏi "Tên trường cấp ba của bạn là gì?"
- Lỗi thường gặp: Password dễ đoán, câu hỏi bảo mật có đáp án public, password reuse.
- Ghi chú từ PortSwigger: Nhóm này còn gọi là knowledge factors.

### Knowledge factors

- Giải thích ngắn gọn: Knowledge factor — yếu tố xác thực dựa trên kiến thức mà user biết.
- Ý nghĩa bảo mật: Cần được bảo vệ khỏi brute-force, credential stuffing, leakage, và enumeration.
- Ví dụ dễ hiểu: Password của tài khoản hoặc recovery answer.
- Lỗi thường gặp: Cho phép thử vô hạn, error message tiết lộ username, password policy dễ bị người dùng lách bằng mẫu dễ đoán.
- Ghi chú từ PortSwigger: Password-based login lấy việc biết secret password làm bằng chứng danh tính.

### Something you have

- Giải thích ngắn gọn: Something you have là factor dựa trên vật/thiết bị user sở hữu.
- Ý nghĩa bảo mật: Attacker cần chiếm thêm thiết bị hoặc token, khó hơn so với chỉ biết password.
- Ví dụ dễ hiểu: Mobile phone, security token, dedicated keypad, authenticator app.
- Lỗi thường gặp: Gửi code qua SMS dễ bị interception hoặc SIM swapping.
- Ghi chú từ PortSwigger: Nhóm này còn gọi là possession factors.

### Possession factors

- Giải thích ngắn gọn: Possession factor — yếu tố xác thực dựa trên quyền sở hữu một vật hoặc thiết bị.
- Ý nghĩa bảo mật: Tăng chi phí tấn công vì cần kiểm soát vật/thiết bị ngoài password.
- Ví dụ dễ hiểu: RSA token, app tạo verification code.
- Lỗi thường gặp: Coi email-based 2FA là true MFA, hoặc triển khai SMS 2FA mà bỏ qua rủi ro SIM swapping.
- Ghi chú từ PortSwigger: 2FA thường kết hợp password với temporary verification code từ out-of-band physical device.

### Something you are or do

- Giải thích ngắn gọn: Something you are or do là factor dựa trên đặc điểm sinh trắc hoặc hành vi.
- Ý nghĩa bảo mật: Có thể khó giả mạo hơn password, nhưng không phải website nào cũng triển khai thực tế.
- Ví dụ dễ hiểu: Biometrics hoặc behavior pattern.
- Lỗi thường gặp: Tin rằng mọi biometric deployment đều phù hợp với web app; PortSwigger lưu ý việc verify biometric factor là không thực tế với phần lớn website.
- Ghi chú từ PortSwigger: Nhóm này còn gọi là inherence factors.

### Inherence factors

- Giải thích ngắn gọn: Inherence factor — yếu tố xác thực dựa trên đặc điểm vốn có hoặc hành vi của user.
- Ý nghĩa bảo mật: Có thể cung cấp lớp xác minh khác với knowledge/possession.
- Ví dụ dễ hiểu: Vân tay, khuôn mặt, hoặc pattern hành vi.
- Lỗi thường gặp: Dùng một factor yếu rồi gọi là MFA dù không có factor độc lập khác.
- Ghi chú từ PortSwigger: Multi-factor chỉ đạt lợi ích đầy đủ khi xác minh nhiều factor khác loại.

### Authentication vs Authorization

- Giải thích ngắn gọn: Authentication xác minh danh tính; Authorization xác minh quyền thực hiện hành động.
- Ý nghĩa bảo mật: Nhầm lẫn hai khái niệm có thể dẫn đến hệ thống "biết user là ai" nhưng vẫn cấp quyền sai.
- Ví dụ dễ hiểu: `Carlos123` login thành công là authentication. Việc `Carlos123` có được xóa account người khác hay không là authorization.
- Lỗi thường gặp: Kiểm tra login xong nhưng không kiểm tra permission cho từng chức năng nhạy cảm.
- Ghi chú từ PortSwigger: Sau khi user được authenticated, permissions mới quyết định họ authorized làm gì.

### How authentication vulnerabilities arise

- Giải thích ngắn gọn: Lỗ hổng authentication phát sinh khi cơ chế yếu hoặc implementation logic sai.
- Ý nghĩa bảo mật: Vì authentication là cổng vào, logic flaw ở đây thường trở thành issue nghiêm trọng.
- Ví dụ dễ hiểu: Không giới hạn brute-force; 2FA page cho phép truy cập protected page sau password step mà chưa nhập code.
- Lỗi thường gặp: Counter reset sai, cookie xác định user trong 2FA bị tin tưởng, reset token không được validate lại.
- Ghi chú từ PortSwigger: Logic flaw trong authentication rất dễ dẫn đến security issue.

### Impact of vulnerable authentication

- Giải thích ngắn gọn: Tác động có thể từ chiếm account thường đến kiểm soát ứng dụng nếu chiếm account quyền cao.
- Ý nghĩa bảo mật: Account takeover mở dữ liệu, chức năng, và attack surface bổ sung.
- Ví dụ dễ hiểu: Compromise admin account có thể dẫn tới toàn quyền trên app; compromise user thường vẫn có thể lộ business data.
- Lỗi thường gặp: Đánh giá thấp rủi ro low-privileged account vì nghĩ account đó không có dữ liệu nhạy cảm.
- Ghi chú từ PortSwigger: Một số high-severity attack chỉ khả thi từ internal/authenticated pages.

## 3. Module 2: Vulnerabilities in Password-Based Login

Password-based login là mô hình user có username duy nhất và secret password. Nếu attacker đoán hoặc lấy được credential, website coi attacker như user hợp lệ. Vì vậy password-based login cần chống brute-force, enumeration, credential stuffing, và các lỗi HTTP Basic Authentication.

### Brute-force attacks

- Cơ chế hoạt động: Attacker thử nhiều username/password bằng trial and error, thường tự động hóa bằng wordlist.
- Vì sao xảy ra: Website dựa vào password như sole factor và không có protection đủ mạnh.
- Dấu hiệu nhận biết: Nhiều login attempt nhanh, nhiều failed guess, response có thể khác nhau theo username/password.
- Ví dụ trong tài liệu: Brute-force không nhất thiết random; attacker dùng logic, pattern, và public knowledge để đoán hiệu quả hơn.
- Tác động: Compromise account, mở thêm dữ liệu và chức năng.
- Cách phòng tránh hoặc giảm thiểu: Rate limiting mạnh, CAPTCHA sau ngưỡng nhất định, generic responses, không tiết lộ username, MFA phù hợp.
- Thuật ngữ cần nhớ: brute-force attack, wordlist, password-based login.

### Brute-forcing usernames

- Cơ chế hoạt động: Attacker đoán username theo pattern hoặc thu thập username public.
- Vì sao xảy ra: Username thường theo format dễ đoán hoặc bị leak ở profile/response.
- Dấu hiệu nhận biết: Business login dạng `firstname.lastname@example.com`, username như `admin`, `administrator`, profile name giống login name.
- Ví dụ trong tài liệu: Public profile có thể ẩn nội dung nhưng vẫn lộ tên dùng làm username; HTTP response đôi khi lộ email admin hoặc IT support.
- Tác động: Rút ngắn đáng kể bước brute-force vì chỉ còn cần password.
- Cách phòng tránh hoặc giảm thiểu: Audit public profile và response để không lộ username/email nhạy cảm; dùng generic login behavior.
- Thuật ngữ cần nhớ: username disclosure, candidate usernames.

### Brute-forcing passwords

- Cơ chế hoạt động: Attacker thử password dựa trên wordlist, pattern người dùng, hoặc biến thể của password quen thuộc.
- Vì sao xảy ra: Người dùng thường chọn password dễ nhớ rồi chỉnh cho hợp password policy.
- Dấu hiệu nhận biết: Password policy truyền thống yêu cầu minimum length, uppercase/lowercase, special character nhưng không đánh giá độ dễ đoán.
- Ví dụ trong tài liệu: `mypassword` có thể bị biến thành `Mypassword1!` hoặc `Myp4$$w0rd`; khi bắt đổi định kỳ, user có thể đổi `Mypassword1!` thành `Mypassword2!`.
- Tác động: Password tưởng mạnh về hình thức nhưng vẫn dễ đoán theo human pattern.
- Cách phòng tránh hoặc giảm thiểu: Password checker đánh giá độ mạnh thực tế; reject password dễ đoán; brute-force protection.
- Thuật ngữ cần nhớ: high-entropy password, password policy, password checker.

### Username enumeration

- Cơ chế hoạt động: Attacker quan sát khác biệt trong hành vi website để biết username có tồn tại hay không.
- Vì sao xảy ra: Login/registration trả về response khác nhau cho valid username, invalid username, hoặc wrong password.
- Dấu hiệu nhận biết: Khác status code, error message, hoặc response time.
- Ví dụ trong tài liệu: Login sai cả username/password có message khác với login đúng username nhưng sai password; registration báo username đã tồn tại.
- Tác động: Giảm thời gian brute-force vì attacker tạo được shortlist valid usernames.
- Cách phòng tránh hoặc giảm thiểu: Generic error message, cùng HTTP status code, response time khó phân biệt.
- Thuật ngữ cần nhớ: username enumeration, generic error message.

### Username enumeration via status codes

- Cơ chế hoạt động: Một guess trả về HTTP status code khác với đa số request sai.
- Vì sao xảy ra: Backend dùng flow khác nhau theo trạng thái username.
- Dấu hiệu nhận biết: Hầu hết guess trả về một status code, nhưng một username trả code khác.
- Ví dụ trong tài liệu: Status code khác là tín hiệu mạnh rằng username có thể đúng.
- Tác động: Cho phép lọc valid username bằng automation.
- Cách phòng tránh hoặc giảm thiểu: Trả cùng HTTP status code cho mọi kết quả login tương đương.
- Thuật ngữ cần nhớ: HTTP status code.

### Username enumeration via error messages

- Cơ chế hoạt động: Error message khác nhau tiết lộ trạng thái username/password.
- Vì sao xảy ra: Developer viết message riêng hoặc có typo nhỏ làm hai message khác nhau.
- Dấu hiệu nhận biết: Khác chỉ một ký tự, kể cả ký tự không thấy trên rendered page.
- Ví dụ trong tài liệu: Một message cho "username và password sai", message khác cho "password sai".
- Tác động: Attacker nhận biết username đúng.
- Cách phòng tránh hoặc giảm thiểu: Message phải identical thật sự, không chỉ nhìn tương tự trên UI.
- Thuật ngữ cần nhớ: error message, rendered page.

### Username enumeration via response times

- Cơ chế hoạt động: Response time khác nhau cho thấy backend xử lý khác nhau.
- Vì sao xảy ra: Website chỉ check password nếu username hợp lệ, tạo thêm thời gian xử lý.
- Dấu hiệu nhận biết: Một số request chậm hơn rõ rệt so với baseline.
- Ví dụ trong tài liệu: Dùng password rất dài có thể khuếch đại delay nếu backend kiểm tra password.
- Tác động: Enumeration ngay cả khi status code và message giống nhau.
- Cách phòng tránh hoặc giảm thiểu: Làm response time giữa các scenario khó phân biệt; tránh flow chỉ xử lý tốn thời gian khi username hợp lệ.
- Thuật ngữ cần nhớ: timing difference, response time.

### Flawed brute-force protection

- Cơ chế hoạt động: Protection có tồn tại nhưng logic cho phép bypass hoặc giảm hiệu quả.
- Vì sao xảy ra: Counter reset sai, limit áp dụng sai đối tượng, hoặc attacker điều khiển apparent IP.
- Dấu hiệu nhận biết: Đăng nhập thành công vào account của chính attacker làm reset failed-attempt counter; IP block có thể né.
- Ví dụ trong tài liệu: Attacker chèn credential hợp lệ của chính mình định kỳ trong wordlist để reset counter.
- Tác động: Defense gần như vô dụng dù nhìn có vẻ có brute-force protection.
- Cách phòng tránh hoặc giảm thiểu: Thiết kế counter/lockout/rate limit theo threat model; test logic bằng nhiều flow.
- Thuật ngữ cần nhớ: failed-attempt counter, lockout logic.

### Account locking

- Cơ chế hoạt động: Lock account sau một số lần login thất bại.
- Vì sao xảy ra: Đây là cách phổ biến để chống targeted brute-force.
- Dấu hiệu nhận biết: Server response báo account locked; response này cũng có thể leak valid username.
- Ví dụ trong tài liệu: Nếu limit là 3 attempts, attacker chọn tối đa 3 password phổ biến rồi thử trên danh sách usernames; chỉ cần một user dùng password đó là compromise.
- Tác động: Giảm targeted brute-force nhưng không chặn tốt attack nhắm vào bất kỳ account nào; có thể hỗ trợ username enumeration; có rủi ro denial of service.
- Cách phòng tránh hoặc giảm thiểu: Kết hợp với rate limiting, generic lockout behavior, monitoring, và controls chống credential stuffing.
- Thuật ngữ cần nhớ: account locking, credential stuffing.

### Credential stuffing

- Cơ chế hoạt động: Attacker dùng danh sách `username:password` thật bị rò rỉ từ data breach để thử trên website khác.
- Vì sao xảy ra: Nhiều user reuse username/password ở nhiều website.
- Dấu hiệu nhận biết: Mỗi username có thể chỉ bị thử một lần, nên account locking truyền thống không kích hoạt.
- Ví dụ trong tài liệu: Massive dictionary gồm genuine credentials bị đánh cắp có thể compromise nhiều account bằng một automated attack.
- Tác động: Account locking không đủ; có thể chiếm nhiều account nhanh.
- Cách phòng tránh hoặc giảm thiểu: Rate limiting, MFA, breach password checking, anomaly detection, không chỉ dựa vào lock theo account.
- Thuật ngữ cần nhớ: credential stuffing, data breach, password reuse.

### User rate limiting

- Cơ chế hoạt động: Chặn hoặc làm chậm login request khi một IP gửi quá nhiều request trong thời gian ngắn.
- Vì sao xảy ra: Website muốn giảm brute-force automation mà ít gây username enumeration/DoS hơn account locking.
- Dấu hiệu nhận biết: IP bị block, được unblock tự động sau thời gian, bởi admin, hoặc sau CAPTCHA.
- Ví dụ trong tài liệu: Attacker có thể manipulate apparent IP hoặc tìm cách guess nhiều password trong một request.
- Tác động: Nếu logic yếu, attacker vẫn bypass được rate limit.
- Cách phòng tránh hoặc giảm thiểu: IP-based rate limiting nghiêm ngặt, chống spoof apparent IP, CAPTCHA sau ngưỡng, giới hạn theo nhiều chiều.
- Thuật ngữ cần nhớ: user rate limiting, CAPTCHA, apparent IP.

### HTTP Basic Authentication

- Cơ chế hoạt động: Browser lưu token được tạo từ `username:password` sau khi Base64 encode, rồi tự gửi trong `Authorization` header cho các request tiếp theo.
- Vì sao xảy ra: Cơ chế cũ, đơn giản, dễ triển khai nên vẫn xuất hiện.
- Dấu hiệu nhận biết: Header dạng `Authorization: Basic base64(username:password)`.
- Ví dụ trong tài liệu: Token chỉ gồm static values, được browser gửi lặp lại trong nhiều request.
- Tác động: Nếu không enforce HTTPS/HSTS, credential có thể bị capture qua man-in-the-middle; thường thiếu brute-force protection; dễ bị session-related exploit như CSRF; credential lộ có thể được reuse ở nơi nhạy cảm hơn.
- Cách phòng tránh hoặc giảm thiểu: Tránh dùng cho ứng dụng nhạy cảm; enforce HTTPS/HSTS; thêm brute-force protection; dùng session mechanism có CSRF protection; không gửi credential lặp lại nếu có lựa chọn tốt hơn.
- Thuật ngữ cần nhớ: HTTP Basic Authentication, Authorization header, Base64, HSTS, CSRF.

## 4. Module 3: Vulnerabilities in Multi-Factor Authentication

Multi-factor authentication — xác thực nhiều yếu tố — yêu cầu user chứng minh danh tính bằng nhiều authentication factors. Two-factor authentication (2FA) là dạng phổ biến gồm hai factor, thường là password và verification code tạm thời.

2FA thường an toàn hơn single-factor authentication vì attacker dù lấy được password vẫn cần yếu tố thứ hai từ nguồn out-of-band. Tuy nhiên, MFA chỉ mạnh khi implementation đúng và các factor thật sự khác loại.

### Multi-factor authentication

- Cơ chế: Kết hợp nhiều factor, ví dụ knowledge factor và possession factor.
- Ý nghĩa: Giảm rủi ro khi một factor bị compromise.
- Lỗi logic thường gặp: Gọi hai lần kiểm tra cùng một factor là MFA.
- Ví dụ từ tài liệu: Email-based 2FA yêu cầu password và code từ email, nhưng truy cập email cũng chỉ dựa vào knowledge factor là credential email.

### Two-factor authentication / 2FA

- Cơ chế: User nhập password, sau đó nhập temporary verification code.
- Ý nghĩa: Attacker cần cả password và code.
- Lỗi logic thường gặp: User bị coi là logged in sau bước password dù chưa hoàn tất code.
- Ví dụ từ tài liệu: Nếu sau password step có thể truy cập thẳng trang "logged-in only", 2FA bị bypass.

### Two-factor authentication tokens

- Cơ chế hoạt động: Verification code được user đọc từ thiết bị hoặc app.
- Dedicated device: Thiết bị chuyên dụng như token/keypad cho banking hoặc work laptop, tạo code trực tiếp và được thiết kế cho security.
- Authenticator app: App như Google Authenticator cũng tạo code trực tiếp.
- SMS-based 2FA: Code được gửi qua SMS tới điện thoại user.
- Rủi ro SMS: Code truyền qua SMS có thể bị intercept; SIM swapping cho phép attacker nhận SMS của victim.
- Tác động: Possession factor yếu hơn nếu kênh truyền hoặc số điện thoại bị chiếm.
- Cách phòng tránh hoặc giảm thiểu: Ưu tiên dedicated device hoặc authenticator app tạo code trực tiếp.
- Thuật ngữ cần nhớ: 2FA token, out-of-band, SIM swapping, authenticator app.

### Bypassing two-factor authentication

- Cơ chế hoạt động: Attacker hoàn thành password step rồi bỏ qua verification step bằng cách truy cập trực tiếp protected page.
- Vì sao xảy ra: Ứng dụng đặt user vào trạng thái gần như logged in trước khi code được verify và không check completion của bước 2.
- Flow dễ hiểu:
  1. User/attacker nhập username + password.
  2. Ứng dụng chuyển tới trang nhập 2FA code.
  3. Nếu protected page không kiểm tra cờ "2FA completed", request trực tiếp tới page đó vẫn được chấp nhận.
- Lỗi logic nằm ở đâu: Authorization cho page protected dựa vào "password step passed" thay vì "full authentication completed".
- Tác động: 2FA bị vô hiệu hóa hoàn toàn.
- Cách phòng tránh hoặc giảm thiểu: Mọi protected resource phải kiểm tra trạng thái authentication cuối cùng, bao gồm completion của 2FA.

### Flawed two-factor verification logic

- Cơ chế hoạt động: Sau bước password, website không ràng buộc chắc chắn bước 2FA với cùng user.
- Vì sao xảy ra: Server dùng cookie hoặc parameter có thể sửa để xác định account đang verify.
- Flow minh họa trong phạm vi lab:
  1. Attacker login bằng credential của chính mình.
  2. Server cấp cookie đại diện cho account đang ở bước 2FA.
  3. Request verify code dùng cookie đó để xác định account.
  4. Nếu attacker sửa cookie sang username victim, server có thể kiểm tra code cho victim thay vì account ban đầu.
- Lỗi logic nằm ở đâu: Server tin client-controlled value để quyết định account của bước 2FA.
- Tác động: Nếu code có thể brute-force, attacker có thể login arbitrary user chỉ dựa trên username, không cần password victim.
- Cách phòng tránh hoặc giảm thiểu: Ràng buộc 2FA challenge server-side với authenticated user của bước 1; không tin cookie/parameter có thể sửa; invalidate challenge sau nhiều lỗi.
- Thuật ngữ cần nhớ: verification logic, client-controlled cookie, account binding.

### Brute-forcing 2FA verification codes

- Cơ chế hoạt động: Attacker thử nhiều 2FA code, thường là 4 hoặc 6 chữ số.
- Vì sao xảy ra: Code ngắn, không có brute-force protection đủ mạnh.
- Dấu hiệu nhận biết: Nhập sai nhiều code vẫn tiếp tục được thử; logout sau vài code sai nhưng process có thể tự động hóa.
- Ví dụ trong tài liệu: Một số site logout user sau một số code sai, nhưng attacker nâng cao có thể automate multi-step process bằng Burp Intruder macro hoặc Turbo Intruder trong lab.
- Tác động: Cracking code trở nên đơn giản nếu không rate limit.
- Cách phòng tránh hoặc giảm thiểu: Rate limit theo challenge/user/IP, expire code nhanh, invalidate challenge, lock hoặc step-up hợp lý, monitor automation.
- Thuật ngữ cần nhớ: 2FA verification code, macro, Turbo Intruder.

## 5. Module 4: Vulnerabilities in Other Authentication Mechanisms

Authentication attack surface không chỉ nằm ở login page. Supplementary functionality — chức năng phụ trợ như remember me, password reset, password change — cũng phải mạnh tương đương login flow, nhất là khi attacker có thể tự tạo account để nghiên cứu behavior.

### Keeping users logged in

- Chức năng hợp lệ: Cho phép user vẫn đăng nhập sau khi đóng browser session, thường qua checkbox "Remember me" hoặc "Keep me logged in".
- Lỗi triển khai có thể xảy ra: Token được tạo từ static values dễ đoán như username + timestamp, hoặc dùng cả password trong cookie.
- Vì sao nguy hiểm: Ai có persistent cookie hợp lệ có thể bypass toàn bộ login process.
- Best practice từ tài liệu: Remember me token phải impractical to guess; không dựa vào cấu trúc dễ đoán.

### Remember me token

- Chức năng hợp lệ: Đại diện trạng thái đăng nhập lâu dài.
- Lỗi triển khai có thể xảy ra: Token predictable, suy luận được từ cookie của account attacker tự tạo.
- Vì sao nguy hiểm: Attacker có thể brute-force cookie của user khác nếu biết công thức tạo token.
- Best practice từ tài liệu: Token cần high entropy, không tạo từ static values dễ đoán, áp dụng limit cho cookie guesses tương tự login attempts.

### Persistent cookie

- Chức năng hợp lệ: Lưu token "remember me" qua nhiều browser sessions.
- Lỗi triển khai có thể xảy ra: Cookie bị steal qua XSS hoặc bị reverse-engineer nếu format đơn giản.
- Vì sao nguy hiểm: Possession cookie tương đương login bypass.
- Best practice từ tài liệu: Thiết kế cookie không suy luận được; bảo vệ khỏi theft; không chứa secret hoặc password.

### Base64 không phải encryption bảo mật

- Chức năng hợp lệ: Base64 là encoding hai chiều, dùng biểu diễn dữ liệu.
- Lỗi triển khai có thể xảy ra: Website "mã hóa" cookie bằng Base64 rồi tin rằng attacker không đoán được.
- Vì sao nguy hiểm: Base64 decode dễ dàng, không bảo mật.
- Best practice từ tài liệu: Không xem Base64 là encryption; không dựa vào encoding để bảo vệ token.

### Hashing algorithm và Salt

- Chức năng hợp lệ: Hash là one-way function; salt là giá trị bổ sung để chống precomputed/hash lookup.
- Lỗi triển khai có thể xảy ra: Dùng hash dễ nhận diện và không có salt cho cookie/token chứa giá trị có thể đoán.
- Vì sao nguy hiểm: Attacker có thể hash wordlist để brute-force token; hash password phổ biến có thể lookup online.
- Best practice từ tài liệu: Salt quan trọng cho effective encryption/hashing; không dùng password hoặc static predictable values trong cookie.

### Resetting user passwords

- Chức năng hợp lệ: Cho user quên password đặt lại mật khẩu bằng phương pháp thay thế.
- Lỗi triển khai có thể xảy ra: Reset flow xác minh sai user, token yếu, token không expire, token không bị destroy sau khi dùng, hoặc validate token không đầy đủ.
- Vì sao nguy hiểm: Password reset vốn nguy hiểm vì password-based authentication bình thường không dùng được trong scenario này.
- Best practice từ tài liệu: Token phải high entropy, expire nhanh, và bị destroy ngay sau reset.

### Sending passwords by email

- Chức năng hợp lệ: Một số hệ thống generate password mới và gửi qua email khi reset.
- Lỗi triển khai có thể xảy ra: Gửi current password hoặc persistent password qua kênh không an toàn.
- Vì sao nguy hiểm: Email inbox persistent, không thiết kế để lưu confidential info, có thể sync qua nhiều thiết bị/kênh không an toàn; dễ bị man-in-the-middle nếu password sống lâu.
- Best practice từ tài liệu: Không bao giờ có thể gửi current password nếu hệ thống xử lý password đúng; tránh gửi persistent password qua insecure channel; nếu buộc dùng generated password thì phải expire rất nhanh hoặc bắt user đổi ngay.

### Resetting passwords using a URL

- Chức năng hợp lệ: Gửi unique URL dẫn tới password reset page.
- Lỗi triển khai có thể xảy ra: URL dùng parameter dễ đoán như `?user=victim-user`.
- Vì sao nguy hiểm: Attacker đổi parameter sang username khác để reset arbitrary user.
- Ví dụ an toàn hơn: URL chứa token khó đoán, không tiết lộ user, ví dụ dạng `?token=<high-entropy-token>`.
- Best practice từ tài liệu: Backend kiểm tra token tồn tại và map với user nào; token expire sau thời gian ngắn; destroy ngay sau reset; validate token lại khi submit form.

### Password reset poisoning

- Chức năng hợp lệ: Reset email sinh URL động.
- Lỗi triển khai có thể xảy ra: Nếu URL reset được generate từ input không an toàn, attacker có thể khiến victim nhận link chứa host/parameter do attacker kiểm soát.
- Vì sao nguy hiểm: Attacker có thể đánh cắp reset token của victim và đổi password.
- Best practice từ tài liệu: Kiểm soát chặt URL generation, không tin Host/header không đáng tin, bảo vệ token.

### Changing user passwords

- Chức năng hợp lệ: User nhập current password và new password hai lần để đổi mật khẩu.
- Lỗi triển khai có thể xảy ra: Form đổi mật khẩu tin hidden field username hoặc cho truy cập trực tiếp mà không đăng nhập đúng user.
- Vì sao nguy hiểm: Attacker sửa hidden username để target user khác; có thể enumeration hoặc brute-force current password qua chức năng này.
- Best practice từ tài liệu: Password change phải mạnh như login page; user identity lấy từ session server-side; không tin hidden field.

## 6. Module 5: Securing Authentication Mechanisms

| Risk | Defensive principle | Implementation note | Common mistake |
|---|---|---|---|
| Credential bị lộ trên network | Take care with user credentials | Không gửi login data qua unencrypted connections; enforce HTTPS bằng redirect HTTP sang HTTPS. | Chỉ bật HTTPS cho login URL nhưng vẫn cho HTTP request tồn tại. |
| Username/email disclosure | Audit disclosure | Kiểm tra public profile và HTTP response để không lộ username/email, đặc biệt admin/IT support. | Nghĩ rằng ẩn nội dung profile là đủ trong khi profile name vẫn là login username. |
| User chọn password dễ đoán | Don't count on users for security | Enforce secure behavior bằng password checker. | Password policy truyền thống khiến user tạo biến thể dễ đoán như thêm số/ký tự đặc biệt. |
| Password policy hình thức | Password checker | Dùng checker đánh giá strength theo thời gian thực; PortSwigger nêu `zxcvbn` của Dropbox là ví dụ. | Chỉ yêu cầu length + uppercase + special char mà không đánh giá pattern. |
| Username enumeration | Prevent username enumeration | Dùng generic error messages identical thật sự, cùng HTTP status code, response time khó phân biệt. | Message nhìn giống nhau trên UI nhưng HTML/source khác một ký tự. |
| Brute-force login | Implement robust brute-force protection | Strict IP-based user rate limiting, chống manipulation apparent IP, CAPTCHA sau ngưỡng nhất định. | Rate limit dễ bypass bằng IP spoof/header hoặc reset counter sai. |
| Brute-force vẫn có thể xảy ra | Make automation tedious | CAPTCHA sau limit không xóa bỏ hoàn toàn threat nhưng làm attack chậm và thủ công hơn. | Tin rằng CAPTCHA/rate limit đơn lẻ là tuyệt đối. |
| Verification logic flaw | Triple-check verification logic | Audit mọi check/validation; một check bypass được gần như không có check. | Chỉ test happy path, không test direct URL access hoặc parameter tampering. |
| Supplementary functionality yếu | Don't forget supplementary functionality | Password reset/change là attack surface hợp lệ như login page. | Chỉ harden login page, bỏ qua reset/change/remember me. |
| Email-based 2FA bị hiểu sai | Implement proper MFA | Email-based 2FA không phải true MFA vì vẫn dựa vào knowledge factor của email account. | Gọi password + email code là MFA đầy đủ. |
| SMS-based 2FA unreliable | Prefer stronger possession factor | SMS technically là possession nhưng có rủi ro interception và SIM swapping. | Xem SMS code là luôn đủ mạnh. |
| 2FA code source yếu | Dedicated device/app | Ưu tiên dedicated device hoặc app tự generate code trực tiếp. | Gửi code qua kênh dễ bị chặn. |
| 2FA bypass | Check 2FA logic | Protected pages phải kiểm tra full authentication state, không chỉ password step. | User được coi là logged in trước khi hoàn thành 2FA. |

## 7. Glossary - Thuật ngữ quan trọng

| Term | Giữ nguyên tiếng Anh | Giải thích tiếng Việt | Ví dụ ngắn |
|---|---|---|---|
| Authentication | Authentication | Xác minh user/client có đúng danh tính đã khai báo không. | Kiểm tra password của `Carlos123`. |
| Authorization | Authorization | Xác minh user đã đăng nhập có được phép làm hành động không. | User có được xóa account khác không. |
| Knowledge factor | Knowledge factor | Factor dựa trên thứ user biết. | Password, security answer. |
| Possession factor | Possession factor | Factor dựa trên thứ user sở hữu. | Security token, authenticator app. |
| Inherence factor | Inherence factor | Factor dựa trên đặc điểm vốn có/hành vi. | Biometrics. |
| Brute-force attack | Brute-force attack | Thử nhiều giá trị để đoán credential/code. | Dùng wordlist password. |
| Username enumeration | Username enumeration | Suy ra username có tồn tại qua response khác biệt. | Message "Incorrect password" khác "Invalid username". |
| Account locking | Account locking | Khóa account sau nhiều lần login sai. | Lock sau 5 failed attempts. |
| User rate limiting | User rate limiting | Giới hạn tốc độ request login theo user/IP/nguữ cảnh. | CAPTCHA sau nhiều request. |
| Credential stuffing | Credential stuffing | Thử credential thật bị rò rỉ từ breach ở website khác. | `email:password` từ breach list. |
| HTTP Basic Authentication | HTTP Basic Authentication | Cơ chế browser gửi credential Base64 trong Authorization header. | `Authorization: Basic ...` |
| Authorization header | Authorization header | HTTP header chứa credential/token xác thực. | Basic token trong mỗi request. |
| Base64 | Base64 | Encoding hai chiều, không phải encryption bảo mật. | Decode được `username:password`. |
| CSRF | CSRF | Cross-Site Request Forgery, ép browser gửi request không mong muốn. | Request đổi trạng thái dùng credential tự gửi. |
| Multi-factor authentication | Multi-factor authentication | Xác thực bằng nhiều factor khác loại. | Password + device token. |
| Two-factor authentication | Two-factor authentication | MFA với hai factor. | Password + 6-digit code từ app. |
| 2FA token | 2FA token | Code/token dùng ở bước xác thực thứ hai. | Code từ RSA token. |
| Out-of-band | Out-of-band | Kênh/nguồn tách khỏi login password flow. | Device tạo code riêng. |
| SIM swapping | SIM swapping | Gian lận chuyển số điện thoại victim sang SIM attacker. | Attacker nhận SMS 2FA. |
| Verification logic | Verification logic | Logic server kiểm tra một bước xác thực/xác minh. | Check 2FA code thuộc đúng user. |
| Remember me token | Remember me token | Token giúp duy trì login qua nhiều session. | Cookie "remember me". |
| Persistent cookie | Persistent cookie | Cookie tồn tại sau khi đóng browser session. | Cookie lưu nhiều ngày. |
| Password reset token | Password reset token | Token dùng xác định request reset password hợp lệ. | `?token=<random>`. |
| High-entropy token | High-entropy token | Token khó đoán do đủ ngẫu nhiên. | Chuỗi random dài. |
| Password reset poisoning | Password reset poisoning | Làm nhiễm độc URL reset để lấy token của victim. | Reset link trỏ về host attacker. |
| Salt | Salt | Giá trị bổ sung vào hash để chống lookup/precomputed attack. | Salt riêng cho password hash. |
| Hash | Hash | Hàm một chiều tạo digest từ dữ liệu. | Hash password trước khi lưu. |
| CAPTCHA | CAPTCHA | Bài kiểm tra phân biệt người với automation. | CAPTCHA sau nhiều login attempt. |
| HSTS | HSTS | Cơ chế buộc browser dùng HTTPS cho domain. | Giảm rủi ro downgrade sang HTTP. |
| Broken authentication | Broken authentication | Authentication có logic/implementation cho phép bypass. | Bỏ qua bước 2FA. |
| Persistent password | Persistent password | Password có hiệu lực lâu dài. | Password gửi qua email nhưng không expire. |
| Password checker | Password checker | Công cụ đánh giá độ mạnh password. | `zxcvbn`. |

## 8. Checklist ôn tập

- [ ] Tôi có phân biệt được Authentication và Authorization không?
- [ ] Tôi có nhớ ba nhóm factor: Something you know, Something you have, Something you are or do không?
- [ ] Tôi có hiểu vì sao authentication vulnerabilities thường critical không?
- [ ] Tôi có hiểu brute-force attack không chỉ là random guessing mà còn tận dụng pattern người dùng không?
- [ ] Tôi có hiểu username enumeration xảy ra qua status code, error message, response time không?
- [ ] Tôi có hiểu account locking và user rate limiting có thể bị bypass như thế nào trong tài liệu không?
- [ ] Tôi có hiểu credential stuffing khác brute-force password thông thường như thế nào không?
- [ ] Tôi có hiểu vì sao HTTP Basic Authentication có rủi ro không?
- [ ] Tôi có hiểu vì sao Base64 không bảo vệ credential/token không?
- [ ] Tôi có hiểu thế nào là flawed 2FA verification logic không?
- [ ] Tôi có hiểu vì sao email-based 2FA không phải true MFA không?
- [ ] Tôi có hiểu hạn chế của SMS-based 2FA và SIM swapping không?
- [ ] Tôi có hiểu vì sao remember me token phải khó đoán không?
- [ ] Tôi có hiểu password reset token phải high-entropy, expire nhanh, và bị destroy sau khi dùng không?
- [ ] Tôi có hiểu password reset poisoning là gì và vì sao nguy hiểm không?
- [ ] Tôi có hiểu password change cũng là attack surface như login page không?
- [ ] Tôi có hiểu các nguyên tắc securing authentication mechanisms không?
- [ ] Tôi có biết vì sao cần audit supplementary functionality, không chỉ login page không?

## 9. Final Coverage Audit

| Original heading/subheading | Trình bày ở mục nào | Có bị gộp không | Thiếu ví dụ/cảnh báo/mitigation? |
|---|---|---|---|
| Authentication vulnerabilities | 1, 2 | Không | Không |
| Labs | 1, 8 | Gộp vào context học tập/lab | Không |
| What is authentication? | 1, 2 | Không | Không |
| What is the difference between authentication and authorization? | 1, 2, 7 | Không | Không |
| How do authentication vulnerabilities arise? | 1, 2 | Không | Không |
| What is the impact of vulnerable authentication? | 1, 2 | Không | Không |
| Vulnerabilities in authentication mechanisms | 1, 3, 4, 5 | Gộp thành các module vulnerability | Không |
| Vulnerabilities in third-party authentication mechanisms | 1 | Gộp thành note OAuth ngoài phạm vi chi tiết | Không |
| Preventing attacks on your own authentication mechanisms | 6 | Không | Không |
| Vulnerabilities in password-based login | 3 | Không | Không |
| Brute-force attacks | 3 | Không | Không |
| Brute-forcing usernames | 3 | Không | Không |
| Brute-forcing passwords | 3 | Không | Không |
| Username enumeration | 3, 6 | Không | Không |
| Flawed brute-force protection | 3, 6 | Không | Không |
| Account locking | 3 | Không | Không |
| User rate limiting | 3, 6 | Không | Không |
| HTTP basic authentication | 3 | Không | Không |
| Vulnerabilities in multi-factor authentication | 4 | Không | Không |
| Two-factor authentication tokens | 4 | Không | Không |
| Bypassing two-factor authentication | 4 | Không | Không |
| Flawed two-factor verification logic | 4, 6 | Không | Không |
| Brute-forcing 2FA verification codes | 4 | Không | Không |
| Vulnerabilities in other authentication mechanisms | 5 | Không | Không |
| Keeping users logged in | 5 | Không | Không |
| Resetting user passwords | 5 | Không | Không |
| Sending passwords by email | 5 | Không | Không |
| Resetting passwords using a URL | 5 | Không | Không |
| Password reset poisoning | 5, 7 | Gộp từ Read more topic reference | Không |
| Changing user passwords | 5 | Không | Không |
| How to secure your authentication mechanisms | 6 | Không | Không |
| Take care with user credentials | 6 | Không | Không |
| Don't count on users for security | 6 | Không | Không |
| Prevent username enumeration | 6 | Không | Không |
| Implement robust brute-force protection | 6 | Không | Không |
| Triple-check your verification logic | 6 | Không | Không |
| Don't forget supplementary functionality | 6 | Không | Không |
| Implement proper multi-factor authentication | 6 | Không | Không |
| Find vulnerabilities in your authentication using Burp Suite | 1, 8 | Gộp thành note về lab/tooling hợp pháp | Không |

### Bổ sung sau audit

Không phát hiện heading/subheading gốc nào trong phạm vi 5 trang bị thiếu. Các CTA/footer lặp lại của PortSwigger được xử lý như context tooling/lab, không biến thành nội dung kỹ thuật riêng.
