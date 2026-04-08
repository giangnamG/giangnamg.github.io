---
layout: post
title: "Lab 01: Detecting NoSQL injection"
categories:
  - PortSwigger
tags:
  - portswigger
  - labs
  - nosql-injection
---
Bộ lọc danh mục sản phẩm trong bài lab này hoạt động trên nền tảng cơ sở dữ liệu NoSQL MongoDB. Nó tồn tại lỗ hổng NoSQL injection.
Để hoàn thành bài lab, hãy thực hiện một cuộc tấn công NoSQL injection khiến ứng dụng hiển thị các sản phẩm chưa được phát hành

1. Trong trình duyệt của Burp, truy cập bài lab và nhấp vào một bộ lọc danh mục sản phẩm.
2. Trong Burp, đi tới **Proxy > HTTP history**. Nhấp chuột phải vào yêu cầu lọc danh mục (category filter request) và chọn **Send to Repeater**.
    
    ![image.png]({ '/assets/img/portswigger-labs/lab-01-detecting-nosql-injection/image.png' | relative_url })
    
3. Trong **Repeater**, gửi một ký tự `'`vào tham số category. Chú ý rằng việc này gây ra lỗi cú pháp JavaScript. Điều này có thể cho thấy đầu vào của người dùng không được lọc hoặc làm sạch (sanitized) đúng cách.
    
    ![image.png]({ '/assets/img/portswigger-labs/lab-01-detecting-nosql-injection/image%201.png' | relative_url })
    
4. Gửi một payload JavaScript hợp lệ vào giá trị của tham số truy vấn category. Bạn có thể sử dụng payload sau:
    
    ```jsx
    Gifts'+'
    ```
    
    ![image.png]({ '/assets/img/portswigger-labs/lab-01-detecting-nosql-injection/image%202.png' | relative_url })
    
    Đảm bảo mã hóa URL (URL-encode) payload bằng cách bôi đen nó và sử dụng phím tắt Ctrl-U. Chú ý rằng nó không gây ra lỗi cú pháp. Điều này chỉ ra rằng một dạng injection phía máy chủ có thể đang diễn ra.
    
5. Xác định xem bạn có thể tiêm (inject) các điều kiện boolean để thay đổi phản hồi hay không:
    - Chèn một điều kiện **sai** (false) vào tham số category. Ví dụ:
        
        ```jsx
        Gifts' && 0 && 'x
        ```
        
        Đảm bảo URL-encode payload. 
        
        Kết quả: không có sản phẩm nào được truy xuất.
        
        ![image.png]({ '/assets/img/portswigger-labs/lab-01-detecting-nosql-injection/image%203.png' | relative_url })
        
    - Chèn một điều kiện **đúng** (true) vào tham số category. Ví dụ:
        
        ```jsx
        Gifts' && 1 && 'x
        ```
        
        Đảm bảo URL-encode payload.
        
        Kết quả: các sản phẩm trong danh mục Gifts được truy xuất.
        
        ![image.png]({ '/assets/img/portswigger-labs/lab-01-detecting-nosql-injection/image%204.png' | relative_url })
        
6. Gửi một điều kiện boolean luôn trả về giá trị đúng (true) trong tham số category. Ví dụ:
    
    ```jsx
    Gifts'||1||'
    ```
    
    ![image.png]({ '/assets/img/portswigger-labs/lab-01-detecting-nosql-injection/image%205.png' | relative_url })
    
7. Nhấp chuột phải vào phản hồi (response) và chọn **Show response in browser** (Hiển thị phản hồi trong trình duyệt).
8. Sao chép URL và tải nó trong trình duyệt của Burp. Xác minh rằng phản hồi hiện đã chứa các sản phẩm chưa phát hành. Bài lab đã được giải quyết.
