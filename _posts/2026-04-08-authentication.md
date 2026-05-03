---
layout: post
title: "Authentication"
render_with_liquid: false
categories:
  - Web Security
tags:
  - authentication
---

# Authentication

## 1. Authentication Fundamentals

Authentication là quá trình xác minh identity của user hoặc client. Vì website có thể bị truy cập từ Internet, authentication mechanism cần đủ mạnh để ngăn truy cập trái phép vào dữ liệu và chức năng nhạy cảm.

Authentication vulnerabilities thường nghiêm trọng vì attacker có thể truy cập data và functionality của account bị compromise. Nếu compromise account có privilege cao, ví dụ administrator, attacker có thể kiểm soát toàn bộ application hoặc chạm tới internal infrastructure. Ngay cả account privilege thấp cũng vẫn nguy hiểm vì nó có thể mở ra dữ liệu business-sensitive hoặc các internal pages không accessible từ public surface.

### Authentication Factors

Authentication factor thường được chia thành ba nhóm chính:

- Something you know: thứ user biết, ví dụ password hoặc câu trả lời security question. Đây còn gọi là knowledge factor.
- Something you have: thứ user sở hữu, ví dụ mobile phone, security token, dedicated device hoặc authenticator app. Đây còn gọi là possession factor.
- Something you are or do: đặc điểm sinh trắc học hoặc pattern hành vi của user, ví dụ biometrics hoặc behavior patterns. Đây còn gọi là inherence factor.

Authentication mechanism có thể verify một hoặc nhiều factor. Multi-factor authentication chỉ thực sự có ý nghĩa khi các factor là khác loại, không phải cùng một factor được kiểm tra hai lần.

### Authentication vs Authorization

Authentication kiểm tra user có đúng là người họ claim hay không. Ví dụ, khi ai đó login với username `Carlos123`, authentication trả lời câu hỏi: người này có thật sự là chủ account `Carlos123` không?

Authorization kiểm tra user đã authenticated có được phép làm hành động cụ thể hay không. Sau khi `Carlos123` được xác thực, permissions mới quyết định user này có được xem dữ liệu của user khác, xóa account, hoặc dùng admin-only functionality không.

### How Authentication Vulnerabilities Arise

Authentication vulnerabilities thường phát sinh theo hai hướng:

- Mechanism yếu vì không bảo vệ đủ trước brute-force attacks.
- Implementation có logic flaw hoặc poor coding khiến attacker bypass được authentication mechanism. Trường hợp này thường được gọi là broken authentication.

Trong authentication, logic flaw thường trở thành security issue vì nó có thể làm suy yếu hoặc bypass cơ chế xác minh identity.

## 2. Password-Based Login

Password-based login là mô hình phổ biến nhất: user có một username duy nhất và secret password. Khi user nhập đúng cặp username/password, website xem việc biết secret password là bằng chứng đủ để xác minh identity.

Điểm yếu cốt lõi của mô hình này là security phụ thuộc vào việc password có được giữ bí mật và khó đoán hay không. Nếu attacker obtain hoặc guess được credentials của user khác, authentication bị compromise.

### Brute-force Attacks

Brute-force attack là quá trình trial and error để đoán valid credentials. Trong thực tế, attacker thường tự động hóa bằng wordlists username/password và tools chuyên dụng, cho phép gửi rất nhiều login attempts với tốc độ cao.

Brute-force không nhất thiết là đoán random. Attacker có thể dùng logic, public information và human behavior patterns để chọn guesses có xác suất cao hơn. Vì vậy, website chỉ dựa vào password mà thiếu brute-force protection sẽ dễ bị tấn công hơn nhiều.

### Brute-forcing Usernames

Usernames thường dễ đoán nếu chúng theo pattern dễ nhận ra. Ví dụ phổ biến là email business dạng `firstname.lastname@company.com`. Ngay cả account privilege cao cũng đôi khi dùng username predictable như `admin` hoặc `administrator`.

Khi audit authentication, cần kiểm tra website có disclose potential usernames không:

- Public user profile có thể hiển thị tên trùng với login username.
- HTTP responses đôi khi leak email addresses.
- Response có thể chứa email của administrators hoặc IT support, tạo candidate usernames chất lượng cao.

### Brute-forcing Passwords

Password brute-force phụ thuộc vào password strength. Nhiều website áp password policy như:

- Minimum length.
- Kết hợp lowercase và uppercase letters.
- Có ít nhất một special character.

Vấn đề là user thường biến password dễ nhớ thành dạng vừa đủ pass policy, thay vì tạo random high-entropy password. Ví dụ, nếu `mypassword` không được chấp nhận, user có thể đổi thành `Mypassword1!` hoặc `Myp4$$w0rd`. Nếu policy bắt đổi password định kỳ, user thường chỉ thay đổi rất nhỏ như đổi `1!` thành `1?` hoặc `2!`.

Human predictable patterns làm brute-force hiệu quả hơn nhiều so với việc thử mọi combination ký tự.

### Username Enumeration

Username enumeration xảy ra khi attacker quan sát sự khác biệt trong behavior của website để biết username có valid hay không. Nó thường xuất hiện ở login page hoặc registration form.

Nếu attacker biết trước danh sách valid usernames, brute-force login trở nên rẻ hơn nhiều vì chỉ còn phải đoán password.

Các signal enumeration quan trọng:

- Status codes: đa số guesses sai thường trả cùng HTTP status code. Nếu một guess trả status code khác, đó có thể là dấu hiệu username đúng.
- Error messages: message khác nhau giữa “username sai” và “password sai” sẽ leak username validity. Ngay cả typo nhỏ hoặc ký tự invisible trong rendered page cũng đủ tạo khác biệt.
- Response times: nếu backend chỉ check password khi username valid, request với valid username có thể chậm hơn. Attacker có thể dùng password rất dài để khuếch đại timing difference.

Best practice là làm response cho valid và invalid usernames càng giống nhau càng tốt: cùng status code, cùng generic error message, và timing khó phân biệt.

### Flawed Brute-force Protection

Brute-force protection thường nhằm làm automation khó hơn và giảm tốc độ login attempts. Hai cách phổ biến là:

- Account locking: khóa account sau quá nhiều failed login attempts.
- User rate limiting: block hoặc throttle source IP/user sau quá nhiều login requests trong thời gian ngắn.

Cả hai đều có giá trị, nhưng không invulnerable. Nếu implementation có flawed logic, attacker có thể bypass.

Một lỗi triển khai điển hình là failed counter theo IP bị reset sau khi IP owner login thành công. Nếu vậy, attacker có thể chèn credentials hợp lệ của chính mình vào wordlist sau mỗi vài failed attempts để không bao giờ chạm limit.

### Account Locking

Account locking giúp chống targeted brute-force vào một account cụ thể. Nhưng nó có các điểm yếu:

- Response báo account locked có thể giúp username enumeration.
- Nó không ngăn tốt attack nhằm compromise bất kỳ account nào, không cần target cụ thể.
- Nó không chống được credential stuffing.

Một cách bypass account locking được mô tả là:

1. Lập danh sách candidate usernames bằng enumeration hoặc common usernames.
2. Chọn password shortlist rất nhỏ, không vượt số attempts trước khi lock.
3. Thử từng password trong shortlist với từng username. Chỉ cần một user dùng password đó là attacker compromise được account mà không trigger lock.

Credential stuffing đặc biệt nguy hiểm vì nó dùng cặp `username:password` thật từ data breaches. Do mỗi username thường chỉ bị thử một lần, account locking không kích hoạt. Nếu nhiều user reuse password giữa nhiều website, một automated attack có thể compromise nhiều accounts.

### User Rate Limiting

User rate limiting block hoặc throttle IP khi có quá nhiều login requests trong thời gian ngắn. IP có thể được unblock:

- Tự động sau một khoảng thời gian.
- Thủ công bởi administrator.
- Bởi user sau khi hoàn thành CAPTCHA.

Rate limiting thường ít gây username enumeration và denial of service hơn account locking, nhưng vẫn có bypass risk:

- Attacker manipulate apparent IP address.
- Application cho phép guess nhiều passwords trong một request, làm limit theo request rate mất tác dụng.

### HTTP Basic Authentication

HTTP Basic Authentication là cơ chế cũ nhưng vẫn xuất hiện vì đơn giản và dễ implement. Server dùng token tạo từ `username:password` rồi Base64 encode. Browser tự thêm token vào `Authorization` header của các request tiếp theo:

```http
Authorization: Basic base64(username:password)
```

Cơ chế này thường không được xem là an toàn trong nhiều trường hợp vì:

- Credentials bị gửi lặp lại trong mọi request.
- Nếu thiếu HTTPS/HSTS enforcement, credentials có thể bị capture qua man-in-the-middle.
- Nhiều implementation không có brute-force protection.
- Token chỉ dựa trên static values nên dễ bị brute-force hơn.
- Nó không tự bảo vệ trước session-related exploits như CSRF.
- Credentials lộ từ một page tưởng như ít quan trọng có thể được reuse ở context nhạy cảm hơn.

## 3. Multi-Factor Authentication

Multi-factor authentication yêu cầu user prove identity bằng nhiều authentication factors. Two-factor authentication, hay 2FA, thường dùng password cộng với temporary verification code từ một out-of-band physical device.

2FA thường an toàn hơn single-factor authentication vì attacker có thể obtain password nhưng khó đồng thời obtain factor thứ hai. Tuy nhiên, MFA chỉ mạnh bằng implementation của nó.

### Same Factor Twice Is Not True MFA

Lợi ích đầy đủ của MFA chỉ đạt được khi verify nhiều factor khác nhau. Verify cùng một factor theo hai cách không phải true MFA.

Email-based 2FA là ví dụ quan trọng. User nhập password cho website, sau đó nhập code nhận qua email. Nhưng access vào email account cũng dựa trên knowledge factor, tức attacker chỉ cần kiểm soát credentials email để lấy code. Vì vậy, email-based 2FA về bản chất là knowledge factor bị kéo dài thêm, không phải true multi-factor authentication.

### Two-Factor Authentication Tokens

Verification code thường được user đọc từ một device:

- Dedicated device như RSA token hoặc keypad device, thường dùng trong online banking hoặc work laptop.
- Authenticator app như Google Authenticator, generate code trực tiếp trên device.
- SMS message gửi code tới mobile phone.

Dedicated device hoặc authenticator app thường tốt hơn vì code được generate trực tiếp trên device purpose-built cho security.

SMS-based 2FA vẫn kiểm tra possession factor ở mức nào đó, nhưng có rủi ro:

- Code truyền qua SMS nên có thể bị intercepted.
- SIM swapping cho phép attacker fraudulently lấy SIM mang số điện thoại victim.
- Nếu SIM swapping thành công, attacker nhận toàn bộ SMS gửi cho victim, bao gồm verification code.

### Bypassing Two-Factor Authentication

Một lỗi phổ biến là user nhập password ở step 1, sau đó nhập verification code ở step 2, nhưng sau step 1 application đã coi user như logged in.

Nếu protected pages chỉ kiểm tra trạng thái “đã nhập đúng password” mà không kiểm tra “đã hoàn tất 2FA”, attacker có thể trực tiếp truy cập logged-in-only pages sau step 1 và bypass step 2.

### Flawed Two-Factor Verification Logic

Một lỗi logic khác là website không đảm bảo cùng một user hoàn tất cả hai step.

Flow minh họa:

```http
POST /login-steps/first HTTP/1.1
Host: vulnerable-website.com

username=carlos&password=qwerty
```

Sau đó server gán cookie liên quan account:

```http
HTTP/1.1 200 OK
Set-Cookie: account=carlos
```

Khi submit verification code:

```http
POST /login-steps/second HTTP/1.1
Host: vulnerable-website.com
Cookie: account=carlos

verification-code=123456
```

Lỗi nằm ở chỗ step 2 dùng cookie client-controlled để xác định account. Attacker có thể login bằng account của mình, rồi đổi cookie sang victim:

```http
POST /login-steps/second HTTP/1.1
Host: vulnerable-website.com
Cookie: account=victim-user

verification-code=123456
```

Nếu attacker brute-force được verification code, họ có thể access arbitrary user account chỉ dựa trên username mà không cần victim password.

### Brute-forcing 2FA Verification Codes

2FA verification code cũng cần brute-force protection như password. Code 4 hoặc 6 digits rất nhỏ về search space; nếu thiếu protection, brute-force trở nên trivial.

Một số website logout user sau nhiều incorrect codes. Cách này vẫn có thể không đủ nếu attacker automate multi-step process bằng Burp Intruder macros hoặc Turbo Intruder.

## 4. OAuth Authentication

OAuth 2.0 ban đầu là authorization framework — cơ chế cho phép một application yêu cầu quyền truy cập giới hạn vào tài nguyên của user trên application khác mà không cần biết password của user. Tuy nhiên, cùng cơ chế này cũng được dùng rộng rãi như một phương thức đăng nhập: “Log in with Google/Facebook/GitHub...” là dạng OAuth authentication rất phổ biến.

Điểm cần phân biệt:

- OAuth gốc giải quyết authorization: client application được quyền truy cập một phần dữ liệu của user trên resource server.
- OAuth authentication dùng dữ liệu nhận được từ OAuth provider, ví dụ email address hoặc profile identifier, để đăng nhập user vào client application.
- Vì access token đôi khi được dùng như “thứ thay thế password” trong login flow, lỗi xử lý token hoặc identity data có thể dẫn tới account takeover.

### Main Roles

OAuth flow thường có ba vai trò:

- Client application: website hoặc web application muốn truy cập dữ liệu user.
- Resource owner: user sở hữu dữ liệu.
- OAuth service provider: hệ thống kiểm soát dữ liệu và cấp API, gồm authorization server và resource server.

Client application yêu cầu một scope nhất định, user login vào OAuth service và consent, sau đó client nhận access token. Client dùng access token để gọi API lấy dữ liệu cần thiết.

### OAuth Grant Types

OAuth có nhiều flow, còn gọi là grant types. Hai grant types thường gặp trong tài liệu học là authorization code grant type và implicit grant type.

Ở mức tổng quát, flow gồm các bước:

1. Client application yêu cầu quyền truy cập vào một subset dữ liệu của user, kèm grant type và scope mong muốn.
2. User được yêu cầu login vào OAuth service và consent cho quyền truy cập đó.
3. Client application nhận access token chứng minh user đã cấp quyền.
4. Client application dùng access token để gọi resource server và lấy dữ liệu.

### OAuth as Login

OAuth authentication thường hoạt động như sau:

1. User chọn đăng nhập bằng account từ website khác, ví dụ social media account.
2. Client application request access tới dữ liệu có thể identify user, thường là email address.
3. Sau khi nhận access token, client gọi resource server, thường là endpoint `/userinfo`.
4. Client dùng dữ liệu nhận được thay cho username để login user vào application.
5. Access token nhận từ authorization server thường đóng vai trò tương tự password truyền thống trong flow đăng nhập này.

Kết quả nhìn từ end-user khá giống SSO: user dùng account ở một hệ thống khác để vào website hiện tại.

### How OAuth Authentication Vulnerabilities Arise

OAuth vulnerabilities thường phát sinh vì specification tương đối flexible. Nhiều phần quan trọng cho security là optional hoặc phụ thuộc cấu hình đúng. Security vì vậy dựa rất nhiều vào việc developer chọn đúng configuration options và tự bổ sung validation cần thiết.

Các nguyên nhân phổ biến:

- Client application trust dữ liệu nhận từ browser mà không verify token tương ứng.
- OAuth service hoặc client application validate `redirect_uri` không chặt.
- Flow thiếu `state` parameter hoặc state không unguessable.
- Sensitive data như authorization code hoặc access token đi qua browser và có thể bị leak.
- Scope validation không kiểm tra scope được approve ban đầu.
- Client tin rằng identity data trong OAuth provider luôn đúng, trong khi provider có thể cho đăng ký email chưa verify.

### Identifying OAuth Authentication

Dấu hiệu dễ thấy nhất là website có tùy chọn đăng nhập bằng account từ website khác.

Trong HTTP traffic, OAuth flow thường bắt đầu bằng request tới `/authorization` endpoint. Các parameter đáng chú ý:

- `client_id`: định danh client application.
- `redirect_uri`: callback URL nơi code/token được gửi về.
- `response_type`: loại response, ví dụ code hoặc token.
- `scope`: quyền hoặc identity data được yêu cầu.
- `state`: giá trị chống CSRF, cần unguessable và tied với user session.

Ví dụ authorization request:

```http
GET /authorization?client_id=12345&redirect_uri=https://client-app.com/callback&response_type=token&scope=openid%20profile&state=ae13d489bd00e3c24 HTTP/1.1
Host: oauth-authorization-server.com
```

### OAuth Recon

Khi kiểm thử hợp pháp OAuth login, cần study toàn bộ HTTP interactions của flow. Nếu dùng external OAuth service, hostname trong authorization request thường giúp xác định provider.

Nhiều OAuth services có public API documentation. Ngoài documentation, nên kiểm tra các well-known endpoints:

```text
/.well-known/oauth-authorization-server
/.well-known/openid-configuration
```

Các endpoint này có thể trả JSON configuration chứa endpoints, supported features, response modes, scopes, signing keys hoặc thông tin mở rộng khác. Điều này giúp xác định attack surface thực tế.

### Improper Implementation of the Implicit Grant Type

Implicit grant type gửi access token qua browser dưới dạng URL fragment. Client-side JavaScript đọc token này. Nếu classic client-server web app muốn giữ session sau khi user đóng page, nó thường gửi user data và access token về server bằng `POST`, rồi server cấp session cookie.

Rủi ro nằm ở chỗ request này giống login form submission nhưng server không có password hoặc secret để so sánh. Nếu server implicitly trust dữ liệu trong request và không kiểm tra access token thật sự match user data, attacker có thể sửa parameter gửi về server để impersonate user khác.

### Flawed CSRF Protection

`state` parameter là CSRF protection quan trọng trong OAuth flow. Nó nên là unguessable value tied với user session khi flow bắt đầu, rồi được gửi qua lại giữa client application và OAuth service.

Nếu authorization request không có `state`, attacker có thể initiate OAuth flow của chính họ rồi trick browser victim hoàn tất flow đó. Tùy cách OAuth được dùng, impact có thể nghiêm trọng:

- Nếu website cho link local account với social account, attacker có thể bind victim account với social account của attacker.
- Nếu website chỉ login qua OAuth, thiếu `state` vẫn có thể tạo login CSRF, khiến victim bị login vào account của attacker.

### Leaking Authorization Codes and Access Tokens

Authorization code hoặc access token thường được gửi qua browser tới `/callback` endpoint trong `redirect_uri`. Nếu OAuth service validate `redirect_uri` lỏng lẻo, attacker có thể khiến code/token của victim bị gửi tới attacker-controlled location.

Impact:

- Stolen code/token có thể cho attacker access dữ liệu victim.
- Trong authorization code flow, attacker có thể dùng stolen code với legitimate callback để login vào victim account mà không cần biết client secret hoặc access token trực tiếp.
- Nếu victim đang có valid session với OAuth service, client application có thể hoàn tất code/token exchange thay attacker và login attacker vào account victim.

`state` hoặc `nonce` không phải lúc nào cũng chặn được attack này vì attacker có thể tự tạo giá trị mới từ browser của họ.

Một biện pháp được mô tả là authorization server có thể yêu cầu gửi `redirect_uri` cả ở token exchange step và kiểm tra nó có khớp với initial authorization request hay không.

### Flawed `redirect_uri` Validation

Best practice là client application đăng ký whitelist callback URIs hợp lệ với OAuth service. OAuth service phải validate `redirect_uri` request với whitelist này.

Các lỗi validation thường gặp:

- Chỉ check string starts with approved domain nên attacker thêm path, query hoặc fragment để bypass.
- URI parser discrepancies giữa các component của OAuth service.
- Duplicate `redirect_uri` parameters gây server-side parameter pollution.
- Production vô tình allow `localhost` URI hoặc domain bắt đầu bằng `localhost`.
- Thay đổi parameter khác như `response_mode=query/fragment` làm parsing `redirect_uri` thay đổi.
- `web_message` response mode có thể mở rộng phạm vi subdomain được phép.

Ví dụ patterns:

```text
https://default-host.com&@foo.evil-user.net#@bar.evil-user.net/
https://oauth-authorization-server.com/?client_id=123&redirect_uri=client-app.com/callback&redirect_uri=evil-user.net
localhost.evil-user.net
```

### Stealing Codes and Tokens via a Proxy Page

Ngay cả khi không thể set external `redirect_uri`, attacker có thể tìm cách đổi `redirect_uri` sang page khác trên whitelisted domain. Ví dụ default callback nằm ở `/oauth/callback`, nhưng path traversal có thể khiến backend resolve sang path khác:

```text
https://client-app.com/oauth/callback/../../example/path
```

Nếu tìm được page khác trên whitelisted domain, cần audit page đó để xem có leak code/token được không:

- Open redirect có thể forward victim cùng code/token tới attacker domain.
- Dangerous JavaScript xử lý query parameters hoặc URL fragments có thể leak dữ liệu.
- XSS có thể steal OAuth code/token, từ đó attacker login trong browser của mình và có nhiều thời gian hơn để khai thác.
- HTML injection đôi khi có thể leak authorization code qua `Referer` header, ví dụ bằng injected image.

Với implicit grant type, stolen access token không chỉ giúp login vào client application. Vì token được dùng trực tiếp với resource server, attacker còn có thể gọi API để lấy sensitive user data không hiện trong web UI.

### Flawed Scope Validation

OAuth token chỉ nên có permissions đúng với scope user đã approve. Nếu OAuth service không validate scope đúng cách, attacker có thể “upgrade” token để có quyền rộng hơn.

Trong authorization code flow, attacker có thể đăng ký malicious client application, xin scope ban đầu như `openid email`, rồi khi exchange code lấy token thì thêm scope mới như `profile`. Nếu server không so scope mới với initial authorization request, token có thể được cấp với permissions rộng hơn.

Trong implicit flow, access token đi qua browser. Nếu attacker steal token, họ có thể gọi `/userinfo` và thêm `scope` parameter. Nếu service không validate scope của request với scope lúc token được generate, attacker có thể đọc thêm dữ liệu mà user chưa approve rõ ràng.

### Unverified User Registration

Khi login bằng OAuth, client application implicitly trust thông tin do OAuth provider lưu. Đây là assumption nguy hiểm nếu provider cho user đăng ký account mà không verify đầy đủ details, đặc biệt là email address.

Attack scenario:

1. Attacker biết email của victim.
2. Attacker đăng ký account ở OAuth provider bằng email đó nếu provider không verify email.
3. Client application nhận email từ provider và cho attacker login như victim.

### OAuth and OpenID Connect

Khi OAuth được dùng cho authentication, nó thường được mở rộng bằng OpenID Connect. OpenID Connect thêm identity layer để xác định và authenticate user rõ hơn, bao gồm concepts như claims, scopes và ID token.

OAuth tự thân là authorization framework; khi được dùng để authentication, OpenID Connect bổ sung identity layer để hỗ trợ xác định và authenticate user rõ ràng hơn.

## 5. Other Authentication Mechanisms

Authentication attack surface không chỉ là login form. Các chức năng phụ trợ như remember me, password reset và password change cũng là authentication mechanisms và cần được harden tương đương.

Điểm nguy hiểm là attacker thường có thể tự tạo account, từ đó truy cập và nghiên cứu các trang phụ trợ này dễ dàng.

### Keeping Users Logged In

Tính năng stay logged in thường là checkbox “Remember me” hoặc “Keep me logged in”. Website thường tạo remember me token và lưu trong persistent cookie.

Vì possession của cookie này có thể bypass toàn bộ login process, token phải impractical to guess. Các lỗi thường gặp:

- Token được tạo bằng predictable concatenation của static values như username và timestamp.
- Token chứa password hoặc một phần password.
- Attacker tạo account riêng, quan sát cookie của mình, suy ra formula rồi brute-force cookie của user khác.

### Base64, Hashing, and Salt

Base64 không phải encryption bảo mật. Nó là two-way encoding, nên nếu cookie chỉ được “bảo vệ” bằng Base64 thì attacker có thể decode và hiểu structure.

Ngay cả one-way hash cũng không tự động an toàn. Nếu hashing algorithm dễ nhận diện và không có salt, attacker có thể hash wordlists rồi so với cookie value. Cách này còn có thể bypass login attempt limits nếu website không áp dụng limit tương tự cho cookie guesses.

Các risk khác:

- XSS có thể steal remember me cookie.
- Open-source framework documentation có thể public cách cookie được construct.
- Trong trường hợp hiếm, nếu cookie chứa hash của password phổ biến, attacker có thể lookup hash online và suy ra password.

Salt quan trọng vì nó làm hash lookup và wordlist precomputation kém hiệu quả hơn.

### Resetting User Passwords

Password reset inherently dangerous vì trong flow này user không thể chứng minh identity bằng current password. Website phải dùng alternative method để đảm bảo đúng user đang reset password.

### Sending Passwords by Email

Gửi current password qua email không nên khả thi nếu website xử lý password đúng cách ngay từ đầu. Nếu hệ thống có thể gửi lại password hiện tại, đó là dấu hiệu password có thể đang được lưu hoặc recover theo cách không an toàn.

Một số website generate password mới rồi gửi qua email. Cách này vẫn có risk vì gửi persistent password qua insecure channel nên cần tránh. Nếu dùng, generated password nên expire rất nhanh hoặc user phải đổi ngay sau khi login.

Email inbox cũng không phải secure storage:

- Inbox persistent.
- Nhiều user sync email qua nhiều devices.
- Sync hoặc access có thể đi qua channels không đủ an toàn.

### Resetting Passwords Using a URL

Cách robust hơn là gửi unique reset URL. Implementation yếu dùng parameter dễ đoán để identify account:

```http
http://vulnerable-website.com/reset-password?user=victim-user
```

Nếu attacker đổi `user` parameter sang username khác, họ có thể vào reset page cho arbitrary user.

Implementation tốt hơn dùng high-entropy token khó đoán:

```http
http://vulnerable-website.com/reset-password?token=a0ba0d1cb3b63d13822572fcff1a241895d893f659164d4cc550b421ebdd48a8
```

Best practices:

- Reset URL không nên reveal user nào đang được reset.
- Backend phải check token tồn tại.
- Token phải map tới đúng user.
- Token phải expire sau thời gian ngắn.
- Token phải bị destroy ngay sau khi reset xong.
- Khi form reset được submit, backend phải validate token lại, không chỉ validate ở lúc mở form.

Nếu website validate token khi mở page nhưng không validate lại khi submit form, attacker có thể lấy reset form từ account mình, xóa token trong request, rồi leverage form để reset arbitrary user.

Password reset poisoning cũng là một risk có thể xuất hiện nếu reset URL được generate dynamically.

### Changing User Passwords

Change password thường yêu cầu:

- Current password.
- New password.
- Confirm new password.

Vì flow này kiểm tra username/current password tương tự login, nó có thể vulnerable với cùng techniques như username enumeration hoặc brute-force.

Nó đặc biệt nguy hiểm nếu attacker có thể access trực tiếp password change page mà không logged in as victim. Ví dụ, nếu username nằm trong hidden field, attacker có thể sửa value trong request để target arbitrary users. Từ đó, page change password có thể bị dùng để enumerate usernames hoặc brute-force current passwords.

## 6. Securing Authentication Mechanisms

### Take Care With User Credentials

Authentication mechanism mạnh vẫn vô dụng nếu credentials hợp lệ bị disclose.

Nguyên tắc:

- Không gửi login data qua unencrypted connections.
- Không chỉ bật HTTPS cho login request; phải enforce redirect mọi HTTP request sang HTTPS.
- Audit website để đảm bảo username/email không bị leak qua public profiles hoặc HTTP responses.

### Don't Count On Users For Security

Strict authentication thường làm user tốn effort hơn. Human behavior khiến một số user tìm cách giảm effort, ví dụ chọn password predictable nhưng vừa đủ pass policy.

Traditional password policy có thể fail vì user ép password dễ nhớ vào rule. Thay vì chỉ yêu cầu chữ hoa/số/special character, có thể dùng password checker có feedback realtime. Ví dụ thường gặp là JavaScript library `zxcvbn` của Dropbox.

Chỉ cho phép password được đánh giá mạnh bởi password checker có thể hiệu quả hơn policy truyền thống.

### Prevent Username Enumeration

Sự tồn tại của một user có thể là sensitive information. Để giảm username enumeration:

- Dùng identical generic error messages cho mọi login outcome.
- Đảm bảo message thật sự identical, không khác typo, whitespace, punctuation hoặc invisible character.
- Trả cùng HTTP status code cho valid và invalid username.
- Làm response times giữa các scenario khó phân biệt nhất có thể.

### Implement Robust Brute-force Protection

Brute-force attack dễ xây dựng, nên website cần prevent hoặc disrupt automation.

Một approach hiệu quả là strict IP-based user rate limiting, kèm biện pháp chống apparent IP manipulation. Sau một threshold nhất định, có thể yêu cầu CAPTCHA cho mỗi login attempt.

Biện pháp này không đảm bảo loại bỏ brute-force hoàn toàn. Mục tiêu thực tế là làm attack trở nên tedious và manual hơn, khiến attacker khó tự động hóa ở scale lớn.

### Triple-check Verification Logic

Authentication logic phải được audit kỹ. Một logic flaw nhỏ có thể compromise website và users. Một check có thể bypass thì gần như không tốt hơn nhiều so với không có check.

### Don't Forget Supplementary Functionality

Không chỉ focus vào central login page. Password reset, password change, remember me và các flow account management khác là attack surface hợp lệ.

Điều này đặc biệt quan trọng nếu attacker có thể self-register account và tự khám phá các flow phụ trợ.

### Implement Proper Multi-factor Authentication

Proper MFA an toàn hơn password-only login, nhưng cần đúng bản chất:

- Verify nhiều factor khác nhau, không phải cùng một factor hai lần.
- Email code không phải true MFA vì vẫn kéo dài knowledge factor.
- SMS-based 2FA có risk như interception và SIM swapping.
- Dedicated device hoặc authenticator app generate code trực tiếp thường tốt hơn.
- 2FA logic không được có bypass đơn giản như bỏ qua step thứ hai hoặc để step thứ hai xác minh sai user.

## 7. Glossary

| Term | Giải thích ngắn |
|---|---|
| Authentication | Xác minh identity của user/client. |
| Authorization | Kiểm tra user đã authenticated có được phép làm hành động cụ thể không. |
| Knowledge factor | Factor dựa trên thứ user biết, ví dụ password. |
| Possession factor | Factor dựa trên thứ user có, ví dụ phone hoặc security token. |
| Inherence factor | Factor dựa trên thứ user là hoặc làm, ví dụ biometrics hoặc behavior pattern. |
| Brute-force attack | Trial-and-error để đoán credentials hoặc verification code. |
| Username enumeration | Xác định username có valid không bằng khác biệt status code, error message hoặc response time. |
| Account locking | Khóa account sau nhiều failed attempts. |
| User rate limiting | Giới hạn login attempts theo IP/user/request rate. |
| Credential stuffing | Dùng cặp credentials thật từ breaches để thử trên website khác. |
| HTTP Basic Authentication | Cơ chế gửi Base64(username:password) trong Authorization header. |
| Base64 | Encoding hai chiều, không phải encryption bảo mật. |
| CSRF | Session-related exploit mà HTTP Basic Authentication không tự chống được. |
| Multi-factor authentication | Authentication dùng nhiều factors. |
| Two-factor authentication | MFA với hai factors, thường password + verification code. |
| Out-of-band | Kênh/factor ngoài password flow chính, ví dụ physical device. |
| SIM swapping | Chiếm số điện thoại victim bằng SIM gian lận để nhận SMS. |
| Remember me token | Token trong persistent cookie để giữ user logged in. |
| Persistent cookie | Cookie tồn tại sau browser session. |
| Password reset token | Token dùng trong reset URL để xác định reset request hợp lệ. |
| High-entropy token | Token khó đoán, có entropy cao. |
| Password reset poisoning | Risk liên quan reset URL dynamic có thể làm lộ token reset. |
| Salt | Giá trị bổ sung vào hashing để chống lookup/precomputation. |
| CAPTCHA | Challenge làm automation brute-force khó hơn sau một threshold. |
| OAuth 2.0 | Authorization framework thường được dùng như cơ chế đăng nhập third-party. |
| Client application | Website/app muốn truy cập dữ liệu user hoặc dùng OAuth để login user. |
| Resource owner | User sở hữu dữ liệu trong OAuth flow. |
| OAuth service provider | Hệ thống cấp authorization và resource APIs. |
| Access token | Token chứng minh client được phép truy cập dữ liệu đã được user approve. |
| Authorization code | Code tạm thời dùng trong authorization code flow để exchange lấy token. |
| `redirect_uri` | Callback URL nơi code/token được gửi về. |
| `state` | Giá trị chống CSRF trong OAuth flow, cần unguessable và bind với session. |
| Scope | Quyền hoặc dữ liệu mà client application yêu cầu. |
| OpenID Connect | Identity layer mở rộng OAuth để phục vụ authentication rõ hơn. |
| zxcvbn | Password strength checker dùng để đánh giá password theo feedback realtime. |
