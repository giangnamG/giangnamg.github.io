---
layout: post
title: "OAuth 2.0 authentication vulnerabilities (1)"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - oauth-authentication
source_collection: notion_portswigger
---
Khi duyệt web, bạn gần như chắc chắn đã từng gặp các trang web cho phép bạn đăng nhập bằng tài khoản mạng xã hội của mình. Rất có thể tính năng này được xây dựng bằng nền tảng OAuth 2.0 phổ biến. OAuth 2.0 rất hấp dẫn đối với kẻ tấn công vì nó vừa cực kỳ phổ biến vừa dễ mắc lỗi thực thi. Điều này có thể dẫn đến một số lỗ hổng, cho phép kẻ tấn công thu được dữ liệu nhạy cảm của người dùng và tiềm năng bỏ qua xác thực hoàn toàn.

Chủ đề này được viết dựa trên `PortSwigger` , cùng với bài báo [Hidden OAuth Attack Vectors.](https://portswigger.net/research/hidden-oauth-attack-vectors)

# 1. **OAuth là gì?**

**OAuth** là một framework ủy quyền được sử dụng rộng rãi, cho phép các trang web và ứng dụng web yêu cầu quyền truy cập giới hạn vào tài khoản người dùng trên một ứng dụng khác mà không cần tiết lộ thông tin đăng nhập của họ cho ứng dụng yêu cầu. OAuth cho phép người dùng kiểm soát chi tiết dữ liệu họ muốn chia sẻ thay vì phải trao quyền kiểm soát toàn bộ tài khoản cho bên thứ ba.

Quy trình OAuth cơ bản được sử dụng phổ biến để tích hợp các chức năng của bên thứ ba mà yêu cầu truy cập vào một số dữ liệu nhất định từ tài khoản của người dùng. Ví dụ, một ứng dụng có thể dùng OAuth để truy cập danh sách liên hệ email của bạn, nhằm đề xuất những người có thể kết nối với bạn. Ngoài ra, OAuth cũng được sử dụng để cung cấp dịch vụ xác thực của bên thứ ba, cho phép người dùng đăng nhập bằng tài khoản của họ từ một trang web khác.

**OAuth 2.0** là tiêu chuẩn hiện tại, nhưng một số trang web vẫn sử dụng phiên bản cũ hơn như **OAuth 1.0** OAuth 2.0 được viết lại hoàn toàn, không phát triển trực tiếp từ OAuth 1.0, vì vậy chúng rất khác nhau. Do đó, từ "OAuth" trong tài liệu chỉ đề cập đến OAuth 2.0.

# 2. **OAuth 2.0 hoạt động như thế nào?**

OAuth 2.0 được thiết kế để cho phép các ứng dụng khác nhau chia sẻ quyền truy cập vào dữ liệu người dùng một cách an toàn. Thay vì phải đưa toàn bộ thông tin tài khoản cho ứng dụng bên ngoài, OAuth 2.0 chỉ cấp một số quyền cụ thể mà người dùng đồng ý.

**Ba thành phần chính của OAuth 2.0:**

✅**Client application**: Đây là ứng dụng (hoặc website) muốn truy cập dữ liệu của người dùng.

✅**Resource owner**: Chính là người dùng – người sở hữu dữ liệu mà ứng dụng muốn truy cập.

✅**OAuth service provider**: Là dịch vụ cung cấp quyền truy cập và quản lý dữ liệu. Họ sẽ cung cấp API để các ứng dụng (client) có thể yêu cầu quyền truy cập.

**Quy trình cơ bản của OAuth 2.0 gồm các bước:**

1️⃣ Ứng dụng client gửi yêu cầu truy cập một phần dữ liệu của người dùng. Nó cũng phải nói rõ “kiểu quyền truy cập” mà nó muốn có (ví dụ: chỉ đọc dữ liệu, hay chỉnh sửa, …).

2️⃣ Người dùng được yêu cầu đăng nhập vào dịch vụ (OAuth provider) và xác nhận đồng ý cho phép ứng dụng sử dụng quyền truy cập mà nó yêu cầu.

3️⃣ Sau khi đồng ý, ứng dụng client nhận được một “access token”. Đây giống như một vé vào cửa – chứng minh rằng người dùng đã đồng ý cho ứng dụng quyền đó.

4️⃣ Ứng dụng client dùng “access token” này để gọi các API, truy cập và lấy dữ liệu từ máy chủ chứa dữ liệu (resource server).

Có thể dùng sơ đồ sau để mô tả

```
     +--------+                               +---------------+
     |        |--(A)- Authorization Request ->|   Resource    |
     |        |                               |     Owner     |
     |        |<-(B)-- Authorization Grant ---|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(C)-- Authorization Grant -->| Authorization |
     | Client |                               |     Server    |
     |        |<-(D)----- Access Token -------|               |
     |        |                               +---------------+
     |        |
     |        |                               +---------------+
     |        |--(E)----- Access Token ------>|    Resource   |
     |        |                               |     Server    |
     |        |<-(F)--- Protected Resource ---|               |
     +--------+                               +---------------+
```

Có nhiều cách gọi là “flow” hoặc “grant type” để triển khai OAuth, như authorization code flow hay implicit flow. Tuy nhiên, hầu hết đều tuân theo 4 bước cơ bản trên.

# 3. OAuth grant type

“Grant type” trong OAuth quyết định **trình tự các bước** của quy trình cấp quyền (authorization process). Nó cũng ảnh hưởng đến cách mà ứng dụng client giao tiếp với dịch vụ OAuth ở từng giai đoạn, bao gồm cách “access token” (mã truy cập) được gửi. Do đó, “grant type” còn gọi là **OAuth flow**.

Mỗi dịch vụ OAuth phải được cấu hình để hỗ trợ một số loại grant type nhất định, và ứng dụng client cần chọn grant type mình muốn sử dụng khi gửi yêu cầu cấp quyền.

---

**Có nhiều loại grant type khác nhau** với mức độ phức tạp và yêu cầu bảo mật riêng. Tuy nhiên, **hai loại phổ biến nhất** được nhấn mạnh ở đây là:

✅ **Authorization code grant type**

✅ **Implicit grant type**

Đây là hai loại grant type bạn sẽ gặp nhiều nhất khi học và triển khai OAuth.

## 3.1. OAuth scopes

- Trong bất kỳ loại grant type OAuth nào, ứng dụng client **phải chỉ định dữ liệu** mà nó muốn truy cập và **loại hành động** mà nó muốn thực hiện. Điều này được thực hiện thông qua **tham số `scope`** trong yêu cầu cấp quyền (authorization request) gửi tới dịch vụ OAuth.
- Với OAuth cơ bản, các scope mà ứng dụng client có thể yêu cầu **là duy nhất cho mỗi dịch vụ OAuth**.
- **Tên của scope chỉ là một chuỗi văn bản tùy ý**, nhưng có thể thay đổi rất nhiều tùy vào nhà cung cấp dịch vụ.
- Một số dịch vụ thậm chí sử dụng **URI đầy đủ** làm tên scope, giống như endpoint của REST API.

Ví dụ, khi ứng dụng muốn truy cập **danh sách liên hệ của người dùng**, tên scope có thể có nhiều dạng, tùy thuộc vào dịch vụ OAuth được sử dụng:

```jsx
scope=contacts
scope=contacts.read
scope=contact-list-r
scope=https://oauth-authorization-server.com/auth/scopes/user/contacts.read
```

&gt; **Lưu ý:** Khi OAuth được sử dụng cho **xác thực** (authentication), các **scope chuẩn của [OpenID Connect](https://portswigger.net/web-security/oauth/openid)** sẽ thường được sử dụng thay thế.
&gt; 

## 3.2 **Authorization code grant type**

**Cách hoạt động:**

![image.png](/assets/img/portswigger/oauth-2-0-authentication-vulnerabilities-1/image.png)

1. **Authorization request**
    
    Client gửi request tới OAuth service để xin quyền truy cập vào dữ liệu người dùng cụ thể.
    
    ```jsx
    GET /authorization?client_id=12345&redirect_uri=https://client-app.com/callback
    &response_type=code&scope=openid%20profile&state=ae13d489bd00e3c24 HTTP/1.1
    Host: `oauth-authorization-server.com`
    ```
    
    - `client_id` là ***username*** của client đã được đăng ký với OAuth service từ trước đó
    - `redirect_uri` là 1 url call back của client sẽ được OAuth service sử dụng để grant code cho client
    - `response_type` Xác định loại phản hồi mà client muốn nhận và tương ứng với nó là loại `grant authorization` nào mà client muốn được thực hiện. Đối với loại `Authorization code`, giá trị `response_type` phải là `code`.
    - `scope` Được sử dụng để chỉ định tập hợp con dữ liệu của người dùng mà Client muốn truy cập, đây là phạm vi tùy chỉnh do nhà cung cấp OAuth đặt hoặc phạm vi được tiêu chuẩn hóa được xác định bởi đặc tả [OpenID Connect.](https://portswigger.net/web-security/oauth/openid)
    - `state` được gắn với phiên hiện tại trên ứng dụng Client. Dịch vụ OAuth sẽ trả về giá trị chính xác này trong phản hồi, cùng với authorization code. Tham số này đóng vai trò như một dạng mã thông báo CSRF cho Client bằng cách đảm bảo rằng yêu cầu tới điểm cuối /callback của nó là từ cùng một người đã khởi tạo OAuth Flow.
2. **User login and consent**
    
    Khi máy chủ ủy quyền nhận được **Authorization request**, nó sẽ chuyển hướng người dùng đến trang đăng nhập, nơi họ sẽ được nhắc đăng nhập vào tài khoản của mình với nhà cung cấp OAuth.
    
    Sau đó, họ sẽ được cung cấp danh sách dữ liệu mà ứng dụng Client muốn truy cập. Điều này dựa trên Scope được xác định trong **Authorization request**. Người dùng có thể chọn có đồng ý với quyền truy cập này hay không.
    
    Khi người dùng đã phê duyệt, bước này sẽ tự động hoàn thành miễn là người dùng vẫn có phiên hợp lệ với dịch vụ OAuth. Nói cách khác, trong lần đầu tiên người dùng chọn "Đăng nhập bằng mạng xã hội", họ sẽ cần đăng nhập thủ công và đưa ra sự đồng ý, nhưng nếu sau đó họ truy cập lại ứng dụng khách, họ thường có thể đăng nhập lại bằng một nhấp chuột duy nhất.
    
3. **Authorization code grant**
    
    Nếu người dùng đồng ý với quyền truy cập được yêu cầu, trình duyệt của họ sẽ được chuyển hướng đến điểm cuối `/callback` bằng yêu cầu GET đã được chỉ định trong tham số `redirect_uri`của **Authorization request**
    
    Yêu cầu GET kết quả sẽ chứa `Authorization code` dưới dạng tham số truy vấn.
    
    ```jsx
    GET /callback?code=a1b2c3d4e5f6g7h8&state=ae13d489bd00e3c24 HTTP/1.1
    Host: client-app.com
    ```
    
4. **Access token request**
    
    Sau khi ứng dụng khách nhận được `Authorization code`, nó cần đổi mã đó để lấy `Access Token` 
    
    Để thực hiện việc này, nó sẽ gửi yêu cầu POST từ máy chủ đến máy chủ tới điểm cuối `/token` của dịch vụ OAuth.
    
    ```jsx
    POST /token HTTP/1.1
    Host: oauth-authorization-server.com
    …
    client_id=1234&client_secret=SECRET&redirect_uri=https://client-app.com/callback
    &grant_type=authorization_code&code=a1b2c3d4e5f6g7h8
    ```
    
    - `client_secret` là mật khẩu đã được đăng ký với dịch vụ OAuth.
    - `grant_type` Được sử dụng để đảm bảo điểm cuối mới biết loại cấp phép nào mà ứng dụng khách muốn sử dụng. Trong trường hợp này, giá trị này phải được đặt thành `authorization_code`.
5. **Access token grant**
    
    Dịch vụ OAuth sẽ xác thực **Access token request**. Nếu xác thực thành công, máy chủ sẽ phản hồi bằng cách cấp cho ứng dụng client mã `access token` với phạm vi được yêu cầu từ trước đó.
    
6. **API call**  
    
    B1ây giờ ứng dụng Client đã có `access token`, nó có thể lấy dữ liệu của người dùng từ `resource server`.
    
    ```jsx
    GET /userinfo HTTP/1.1
    Host: oauth-resource-server.com
    Authorization: Bearer z0y9x8w7v6u5...
    ```
    
7. **User Data**
    
    `resource server` phải xác minh rằng mã thông báo hợp lệ và nó thuộc về ứng dụng Client hiện tại. Nếu đúng, nó sẽ phản hồi bằng cách gửi tài nguyên được yêu cầu, tức là dữ liệu của người dùng dựa trên phạm vi của `Access token`.
    
8. **User Logged In** 

## 3.3 **Implicit grant type**

**Implicit grant type** trong OAuth 2.0 là một phương thức đơn giản hơn so với authorization code grant. Thay vì phải qua bước trung gian lấy mã ủy quyền (authorization code) rồi mới đổi thành access token, client application **nhận trực tiếp access token** ngay sau khi người dùng đồng ý cấp quyền.

Bạn có thể thắc mắc: “Sao không phải lúc nào ứng dụng client cũng dùng implicit grant type cho nhanh?”. Câu trả lời là **vì nó kém an toàn hơn nhiều**.

Toàn bộ giao tiếp trong implicit flow diễn ra qua **các lần chuyển hướng của trình duyệt**, không có “back-channel” bảo mật (như authorization code grant). Điều này khiến **access token và dữ liệu người dùng dễ bị lộ** hơn trước các cuộc tấn công.

Implicit grant type thường được dùng cho các **ứng dụng một trang (SPA)** hoặc **ứng dụng desktop** – những loại khó có thể lưu trữ an toàn `client_secret` trên backend. Vì không có client_secret, các ứng dụng này cũng không tận dụng được ưu điểm bảo mật của authorization code grant.

**Các bước chính của quy trình implicit grant**

![image.png](/assets/img/portswigger/oauth-2-0-authentication-vulnerabilities-1/image.png)

**1️⃣ Gửi yêu cầu cấp quyền (Authorization request)**

Quy trình bắt đầu tương tự như authorization code grant, nhưng với một điểm khác:

Tham số `response_type` phải đặt là `token`, để yêu cầu nhận luôn access token.

📦 Ví dụ yêu cầu:

```
GET /authorization?client_id=12345&redirect_uri=https://client-app.com/callback&response_type=token&scope=openid%20profile&state=ae13d489bd00e3c24 HTTP/1.1
Host: oauth-authorization-server.com
```

---

**2️⃣ Đăng nhập và chấp thuận (User login and consent)**

Người dùng được đưa đến màn hình đăng nhập, rồi được hỏi có đồng ý cấp quyền không.

Bước này **giống hệt** như trong authorization code grant.

---

**3️⃣ Nhận access token trực tiếp (Access token grant)**

Nếu người dùng đồng ý, trình duyệt **chuyển hướng về `redirect_uri`** kèm theo **access token** (thay vì authorization code).

Token được gửi trong **URL fragment** (phần sau dấu `#`), ví dụ:

```
GET /callback#access_token=z0y9x8w7v6u5&token_type=Bearer&expires_in=5000&scope=openid%20profile&state=ae13d489bd00e3c24 HTTP/1.1
Host: client-app.com
```

Vì access token nằm trong URL fragment, nó **không được gửi trực tiếp đến server**. Ứng dụng client **phải có script để trích xuất fragment này** và lưu access token.

---

**4️⃣ Gọi API lấy dữ liệu người dùng (API call)**

Khi đã lấy được access token, ứng dụng client có thể gọi API của resource server (ví dụ: `/userinfo`) **trực tiếp từ trình duyệt**.

📦 Ví dụ:

```
GET /userinfo HTTP/1.1
Host: oauth-resource-server.com
Authorization: Bearer z0y9x8w7v6u5
```

---

**5️⃣ Nhận dữ liệu người dùng (Resource grant)**

Resource server kiểm tra xem token có hợp lệ và thuộc về ứng dụng client không. Nếu hợp lệ, server trả về dữ liệu người dùng, ví dụ:

```json
{
  "username": "carlos",
  "email": "carlos@carlos-montoya.net"
}
```

Ứng dụng client có thể sử dụng dữ liệu này theo mục đích của nó. Trong các tình huống đăng nhập OAuth, thông tin này thường được dùng để tạo session cho người dùng – tức là **đăng nhập người dùng một cách an toàn và liền mạch**.

# 4 Sử dụng OAuth trong xác thực

Ban đầu, OAuth không được thiết kế để **xác thực (authentication)** – nó chỉ nhằm **ủy quyền (authorization)**, tức là cho phép ứng dụng client truy cập một số dữ liệu của người dùng.

Tuy nhiên, thực tế, OAuth đã được **ứng dụng rộng rãi để xác thực người dùng** (dùng tài khoản mạng xã hội để đăng nhập thay vì tài khoản riêng). Khi bạn thấy một trang cho phép "Đăng nhập bằng Google", "Đăng nhập bằng Facebook"… đó chính là OAuth 2.0 authentication.

---

1️⃣ **Người dùng chọn đăng nhập bằng tài khoản mạng xã hội** (hoặc dịch vụ OAuth).

2️⃣ Ứng dụng client gửi yêu cầu đến dịch vụ OAuth, xin **truy cập một số dữ liệu** (như email, username, ảnh đại diện…).

3️⃣ Người dùng đăng nhập và đồng ý.

4️⃣ Ứng dụng client nhận **access token**.

5️⃣ Ứng dụng dùng token này để **gọi API** (thường là endpoint `/userinfo`) lấy dữ liệu người dùng.

6️⃣ Ứng dụng **dùng thông tin trả về** (email, username) để tạo **session đăng nhập** cho người dùng (như “Single Sign-On – SSO”).
