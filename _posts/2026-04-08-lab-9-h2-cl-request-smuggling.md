---
layout: post
title: "Lab 9: H2.CL request smuggling"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - http-request-smuggling
  - labs
source_collection: notion_portswigger
---
# Mô tả

Phòng thí nghiệm này dễ bị tấn công request smuggling vì máy chủ front-end hạ cấp các yêu cầu HTTP/2 ngay cả khi chúng có độ dài không rõ ràng.

Để giải bài tập thực hành, hãy thực hiện một cuộc tấn công đánh cắp yêu cầu (request smuggling) khiến trình duyệt của nạn nhân tải và thực thi một tệp JavaScript độc hại từ máy chủ khai thác, gọi hàm alert(document.cookie). Người dùng nạn nhân truy cập trang chủ cứ sau 10 giây.

Bạn cần làm gián đoạn kết nối ngay trước khi trình duyệt của nạn nhân cố gắng nhập tài nguyên JavaScript.

Nếu không, nó sẽ tải payload từ máy chủ khai thác nhưng không thực thi. Bạn có thể cần lặp lại cuộc tấn công nhiều lần trước khi tìm ra thời điểm chính xác.

# Solve

1. Xác nhận H2.CL, bằng việc gửi vài lần yêu cầu sau
    
    ```php
    POST / HTTP/2
    Host: 0a0700b5042a503482118e72004d00a7.web-security-academy.net
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 0
    
    GET /404 HTTP/1.1
    Host: foo
    Content-Length: 5
    
    x=1
    ```
    
    ![image.png](/assets/img/portswigger/lab-9-h2-cl-request-smuggling/image.png)
    
    Nếu status code thay đổi luân phiên 200 và 404 thì xác nhận đây là lỗi H2.CL
    
2.
