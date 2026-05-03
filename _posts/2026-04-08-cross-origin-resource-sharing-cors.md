---
layout: post
title: "Cross-origin resource sharing (CORS)"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - cross-origin-resource-sharing-cors
source_collection: notion_portswigger
---
# 1. **CORS (cross-origin resource sharing) là gì?**

là một cơ chế trình duyệt cho phép truy cập được kiểm soát vào các tài nguyên nằm ngoài một miền nhất định. Nó mở rộng và tăng thêm tính linh hoạt cho chính sách cùng nguồn gốc (SOP)

![image.png](/assets/img/portswigger/cross-origin-resource-sharing-cors/image.png)

# 2. **Same-origin policy là gì ?**

SOP hạn chế các tập lệnh trên một nguồn gốc khác đang cố gắng truy cập dữ liệu vào nguồn gốc hiện tại

Thỏa mãn điều kiện SOP khi: 

- Cùng schema
- Cùng domain name
- Cùng port

Khi trình duyệt gửi yêu cầu HTTP từ một nguồn gốc sang nguồn gốc khác, bất kỳ cookie nào, bao gồm cả cookie phiên bản xác thực, liên quan đến miền khác cũng sẽ được gửi cùng với yêu cầu. Điều này có nghĩa là phản hồi sẽ được tạo ra trong phiên bản của người dùng và bao gồm bất kỳ dữ liệu nào liên quan đặc thù đến người dùng. Nếu không có chính sách SOP, nếu bạn truy cập vào một trang web độc hại, nó sẽ có thể đọc email của bạn từ GMail, tin nhắn riêng tư từ Facebook, v.v.

**Cách SOP được triển khai**

Chính sách cùng nguồn gốc nhìn chung kiểm soát quyền truy cập của mã JavaScript vào nội dung được tải chéo tên miền. Việc tải chéo nguồn các tài nguyên của trang nhìn chung được cho phép. Ví dụ, SOP cho phép nhúng hình ảnh thông qua thẻ **&lt;img&gt;**, media thông qua thẻ **&lt;video&gt;**, và JavaScript thông qua thẻ **&lt;script&gt;**. Tuy nhiên, dù các tài nguyên bên ngoài này có thể được trang tải về, bất kỳ mã JavaScript nào trên trang sẽ không thể đọc được nội dung của các tài nguyên đó.

**Có nhiều ngoại lệ khác nhau đối với chính sách cùng nguồn gốc:**

- Một số đối tượng có thể ghi nhưng không thể đọc chéo tên miền, chẳng hạn như đối tượng **location** hoặc thuộc tính **location.href** từ các **iframe** hoặc **new window**.
- Một số đối tượng có thể đọc nhưng không thể ghi chéo tên miền, chẳng hạn như thuộc tính **length** của đối tượng **window** (lưu trữ số lượng frame đang được sử dụng trên trang) và thuộc tính **closed**.
- Hàm **replace** nhìn chung có thể được gọi chéo tên miền trên đối tượng **location**.
- Có thể gọi một số hàm nhất định chéo tên miền. Ví dụ, có thể gọi các hàm **close**, **blur** và **focus** trên một cửa sổ mới. Hàm postMessage cũng có thể được gọi trên các iframe và window mới nhằm mục đích gửi tin nhắn từ một tên miền này sang một tên miền khác.
- Do các yêu cầu từ trước (legacy), chính sách SOP được nới lỏng hơn khi xử lý cookie, do đó chúng thường có thể được truy cập từ tất cả các tên miền phụ của một trang web mặc dù về mặt kỹ thuật mỗi tên miền phụ là một nguồn khác nhau. Có thể giảm thiểu một phần rủi ro này bằng cách sử dụng cờ cookie **HttpOnly**.

Có thể nới lỏng chính sách SOP bằng cách sử dụng **document.domain**. Thuộc tính đặc biệt này cho phép nới lỏng SOP cho một tên miền cụ thể, nhưng chỉ khi nó là một phần của **FQDN** (fully qualified domain name - tên miền đầy đủ) của bạn. 

Ví dụ, có thể có một tên miền marketing.example.com và bạn muốn đọc nội dung của tên miền đó trên example.com. Để làm vậy, cả hai tên miền cần đặt document.domain thành example.com. Khi đó, SOP sẽ cho phép truy cập giữa hai tên miền này bất chấp chúng có nguồn khác nhau. Trước đây, có thể đặt document.domain thành một TLD như com, điều này cho phép truy cập giữa bất kỳ tên miền nào trên cùng một TLD, nhưng hiện nay các trình duyệt hiện đại đã ngăn chặn việc này.

## CORS ra đời

- Để nới lỏng chính sách SOP tránh gây ra hạn chế cho các trang web khi cần tương tác với tên các subdomain hoặc các trang của bên thứ ba người ta đã phát triển một cơ chế gọi là **Chia sẻ tài nguyên chéo nguồn gốc (Cross-Origin Resource Sharing - CORS)**.
- **CORS** sẽ thêm tiêu đề **Access-Control-Allow-Origin** vào phản hồi để chỉ thị rằng domain nào có quyền truy cập vào tài nguyên của domain hiện tại. Web browser sẽ so sánh domain của yêu cầu gửi đi với giá trị của **Access-Control-Allow-Origin** để quyết định xem nó có được phép hay không
- Giả sử trang web **A** chỉ định **Access-Control-Allow-Origin** cho trang **web B** thì theo mặc định của CORS, khi một trang **web B** gửi yêu cầu đến một trang **web A** bằng JavaScript, trình duyệt sẽ **không** gửi kèm các thông tin nhạy cảm như cookie hay thông tin đăng nhập (Authorization header).
Để trang web B có thể gửi được credentials (cookie, Authorization) đi, thì:
    - Phản hồi của trang **web A** phải chỉ thị **Access-Control-Allow-Credentials: true**
    - Đồng thời trang request của **web B** cũng phải được cài đặt một cách tường minh để "gửi kèm thông tin nhạy cảm".
    
    Tương tự, nếu trang web A chỉ muốn web B chỉ được thực hiện trên 1 method cụ thể, có thể phản hồi thêm: **Access-Control-Request-Method: GET, HEAD, PUT**
    

&gt; CORS không cung cấp khả năng bảo vệ chống lại các cuộc tấn công giả mạo yêu cầu liên trang web (CSRF), đây là một quan niệm sai lầm phổ biến.
CORS là sự nới lỏng có kiểm soát của chính sách cùng nguồn gốc SOP, do đó CORS được cấu hình kém thực sự có thể làm tăng khả năng xảy ra các cuộc tấn công CSRF hoặc làm trầm trọng thêm tác động của chúng. Có nhiều cách khác nhau để thực hiện các cuộc tấn công CSRF mà không cần sử dụng CORS, bao gồm các biểu mẫu HTML đơn giản và bao gồm tài nguyên liên miền.
&gt;
