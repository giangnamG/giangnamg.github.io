---
layout: post
title: "Lab 13: CL.0 request smuggling"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - http-request-smuggling
  - labs
source_collection: notion_portswigger
---
# Mô tả

Phòng thí nghiệm này dễ bị tấn công smuggling yêu cầu CL.0. Máy chủ back-end bỏ qua tiêu đề `Content-Length` trên các yêu cầu đến một số điểm cuối.

Để giải quyết phòng thí nghiệm, hãy xác định một điểm cuối dễ bị tấn công, chuyển một yêu cầu đến back-end để truy cập vào bảng quản trị tại `/admin`, sau đó xóa người dùng `carlos`.

Phòng thí nghiệm này dựa trên các lỗ hổng trong thế giới thực được phát hiện bởi PortSwigger Research. Để biết thêm chi tiết, hãy xem [Browser-Powered Desync Attacks: A New Frontier in HTTP Request Smuggling](https://portswigger.net/research/browser-powered-desync-attacks#cl.0).

# Solve

## **Thăm dò các điểm cuối dễ bị tấn công**

1. Từ lịch sử HTTP Proxy&gt;, gửi yêu cầu `/resources/images/blog.svg` và `GET /` đến Burp Repeater.
2. Trong burp repeater, thêm cả hai tab này vào một nhóm mới.
3. Chuyển đến yêu cầu đầu tiên và chuyển đổi nó thành yêu cầu `POST`
4. Trong body, thêm tiền tố smuggling yêu cầu tùy ý. Kết quả sẽ giống như sau:
    
    ```jsx
    POST / HTTP/1.1
    Host: YOUR-LAB-ID.web-security-academy.net
    Content-Type: application/x-www-form-urlencoded
    Content-Length: CORRECT
    Connection: keep-alive
    
    GET /hopefully404 HTTP/1.1
    Foo: x
    ```
    
5. Đảm bảo enable HTTP/1 connection reuse
6. Sử dụng menu thả xuống bên cạnh nút **Send**, thay đổi chế độ gửi thành **Send group in sequence (single connection)**
    
    ![image.png](/assets/img/portswigger/lab-13-cl-0-request-smuggling/image.png)
    
    Quan sát phản hồi của tab `normal`
    
    ![image.png](/assets/img/portswigger/lab-13-cl-0-request-smuggling/image%201.png)
    
7. Truy cập vào /admin
    
    ![image.png](/assets/img/portswigger/lab-13-cl-0-request-smuggling/image%202.png)
    
    Quan sát phản hồi của tab normal
    
    ![image.png](/assets/img/portswigger/lab-13-cl-0-request-smuggling/image%203.png)
    
8. Tiến hành xóa carlos
    
    ![image.png](/assets/img/portswigger/lab-13-cl-0-request-smuggling/image%204.png)
    
    Quan sát phản hồi của tab normal
    
    ![image.png](/assets/img/portswigger/lab-13-cl-0-request-smuggling/image%205.png)
    
    → Hoàn thành lab
