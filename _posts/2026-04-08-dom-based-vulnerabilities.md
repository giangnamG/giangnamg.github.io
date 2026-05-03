---
layout: post
title: "DOM-based vulnerabilities"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - dom-based-vulnerabilities
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Client-side

# **Lab 01: [DOM XSS using web messages](https://portswigger.net/web-security/dom-based/controlling-the-web-message-source/lab-dom-xss-using-web-messages)**

Bài lab này trình bày một lỗ hổng bảo mật đơn giản liên quan đến tin web message. Để hoàn thành bài lab, bạn cần sử dụng máy chủ khai thác (exploit server) để gửi một tin nhắn đến trang web mục tiêu, kích hoạt việc gọi hàm `print()`.

Hãy chú ý rằng trang chủ của bài lab có chứa một lệnh gọi `addEventListener()` để lắng nghe các tin nhắn web được gửi đến.

![image.png](/assets/img/portswigger/dom-based-vulnerabilities/image.png)

Bây giờ, hãy truy cập vào máy chủ khai thác và thêm đoạn mã `iframe` sau vào phần thân (body) của trang. Lưu ý thay thế YOUR-LAB-ID bằng ID bài lab của bạn:

```python
<iframe src="https://YOUR-LAB-ID.web-security-academy.net/" onload="this.contentWindow.postMessage('<img src=1 onerror=print()>','*')">
```

Khi `iframe`được tải, phương thức `postMessage()` sẽ gửi một web message đến trang chủ. Bộ lắng nghe sự kiện (event listener) trên trang chủ, vốn được thiết kế để hiển thị quảng cáo, sẽ nhận nội dung của tin nhắn web này và chèn thẳng vào thẻ div có ID là `ads`

Tuy nhiên, thay vì một nội dung quảng cáo hợp lệ, bộ lắng nghe lại nhận và chèn thẻ `&lt;img&gt;` do chúng ta gửi sang. Thẻ này chứa một thuộc tính src không hợp lệ (src=1). Việc trình duyệt không thể tải được tài nguyên này sẽ gây ra lỗi, từ đó kích hoạt trình xử lý sự kiện `onerror` và thực thi payload (phần mã độc hại) của chúng ta, trong trường hợp này là hàm `print()`

**Trường hợp được phép sử dụng &lt;iframe&gt;**

Thẻ &lt;iframe&gt; (Inline Frame) cho phép nhúng một tài liệu HTML độc lập từ bên thứ 3 vào trang web hiện tại. Việc này hữu ích trong nhiều trường hợp chính đáng. 

**Các biện pháp bắt buộc để sử dụng &lt;iframe&gt; an toàn**

1. Luôn luôn kiểm tra nguồn gốc (origin) của nội dung được nhúng
2. **Sử dụng thuộc tính sandbox**
    
    Sandbox sẽ chặn thực thi script, chặn cửa sổ pop-up, chặn các plugin, và nhiều hơn nữa. Chỉ cấp các quyền thực sự cần thiết
    
    Theo mặc định, sandbox sẽ chặn tất cả các hành vi rủi ro. Sau đó, bạn chỉ bật những gì cần thiết:
    
    - *allow-scripts* for JavaScript
    - *allow-forms* for form submission
    - *allow-same-origin* for origin access
    - **Ví dụ**: Chỉ cho phép thực thi script và truy cập tài nguyên từ cùng một nguồn.
    
    ```python
    <iframe src="trusted-source.com/widget" sandbox="allow-scripts allow-same-origin"></iframe>
    ```
    
3. Sử dụng chính sách CSP
    
    Sử dụng chỉ thị frame-src để chỉ định các nguồn hợp lệ được phép nhúng vào trang của bạn
    
    - **Ví dụ (trong HTTP header):** Chỉ cho phép nhúng &lt;iframe&gt; từ chính trang của bạn và từ YouTube.
        
        ```python
        Content-Security-Policy: frame-src 'self' https://youtube.com;
        ```
        
    
    Chỉ thị frame-ancestors cho phép bạn kiểm soát chính xác những trang web nào có thể nhúng nội dung của bạn. Mặc dù tương tự như X-Frame-Options, nhưng nó linh hoạt hơn và hỗ trợ trình duyệt tốt hơn.
    
    ```python
    Content-Security-Policy: frame-ancestors ‘self’ https://trusted-site.com
    ```
    
    Kiểm soát bảo mật này ngăn chặn trang web của bạn xuất hiện trong các trang web độc hại được thiết kế cho các cuộc tấn công lừa đảo
    
4. **Sử dụng thuộc tính allow**
    
    Thuộc tính này cho phép kiểm soát chi tiết các tính năng mà &lt;iframe&gt; có thể truy cập, chẳng hạn như máy ảnh, micro, hoặc chế độ toàn màn hình
    
    **Ví dụ:** 
    
    ```python
    <iframe src="video-player.com" allow="fullscreen; camera 'none'; microphone 'none'"></iframe>
    ```
    
5. **Thiết lập X-Frame-Options Header:**
    
    Để chống lại Clickjacking, hãy cấu hình máy chủ web của bạn để gửi HTTP header X-Frame-Options.
    
    - X-Frame-Options: DENY (Không cho phép bất kỳ trang nào nhúng)
    - X-Frame-Options: SAMEORIGIN (Chỉ cho phép các trang từ cùng một nguồn nhúng)
    - X-Frame-Options: *ALLOW-FROM uri (Chỉ cho phép các uri được liệt kê trong chỉ chị allow-from)*
6. **Event listeners**
    
    Việc giao tiếp giữa trang của bạn và nội dung iframe cần được xử lý cẩn thận. API postMessage cho phép giao tiếp này, nhưng bạn phải xác minh nguồn gốc của mọi tin nhắn.
    
    Luôn xác thực nguồn gốc của tin nhắn trước khi xử lý chúng:
    
    ```python
    if (event.origin !== ‘https://trusted-source.com’) return;
    ```
    
    Điều này ngăn chặn các cuộc tấn công cross-frame, trong đó các trang web độc hại gửi các lệnh có vẻ như đến từ các nguồn đáng tin cậy.
    

# **Lab 02: DOM XSS using web messages and a JavaScript URL**

Bài lab này trình bày về một lỗ hổng chuyển hướng dựa trên DOM (DOM-based redirection) được kích hoạt thông qua web message. Để hoàn thành bài lab, bạn cần xây dựng một trang HTML trên máy chủ khai thác (exploit server) để khai thác lỗ hổng này và gọi hàm print()

Khi phân tích mã nguồn của trang mục tiêu, hãy chú ý đến đoạn mã xử lý sự kiện `addEventListener()`, được dùng để lắng nghe các tin nhắn web. Lỗ hổng nằm ở chỗ logic kiểm tra đầu vào sử dụng phương thức `indexOf()` một cách thiếu sót. Cụ thể, nó chỉ kiểm tra sự tồn tại của chuỗi "http:" hoặc "https:" ở *bất kỳ vị trí nào* trong dữ liệu tin nhắn, thay vì kiểm tra xem tin nhắn có *bắt đầu* bằng các chuỗi này hay không. 

![image.png](/assets/img/portswigger/dom-based-vulnerabilities/image%201.png)

Điểm cuối (sink) của lỗ hổng này là `location.href`, nơi dữ liệu đầu vào sẽ được thực thi.

Truy cập vào máy chủ khai thác và thêm đoạn mã iframe sau vào phần thân (body) của trang. Lưu ý thay thế YOUR-LAB-ID bằng ID bài lab của bạn:

```python
<iframe src="https://YOUR-LAB-ID.web-security-academy.net/" onload="this.contentWindow.postMessage('javascript:print()//http:','*')">
```

Lưu lại mã khai thác và gửi nó đến nạn nhân.

**Phân tích cơ chế khai thác:**

1. **Gửi Payload:** Khi iframe được tải, phương thức `postMessage()` sẽ gửi một tin nhắn đến trang chính. Tin nhắn này chứa một payload JavaScript được xây dựng đặc biệt: `javascript:print()//http:`.
    - `javascript:print()`: Đây là phần payload chính, sử dụng lược đồ (protocol) javascript: để thực thi mã khi được gán cho location.href.
    - `//http:`Phần này đóng vai trò mồi nhử. Dấu // biến phần còn lại của chuỗi thành một chú thích (comment) trong JavaScript, do đó trình duyệt sẽ bỏ qua nó. Tuy nhiên, nó lại chứa chuỗi "http:" mà cơ chế kiểm tra `indexOf()` đang tìm kiếm.
2. **Vượt qua Cơ chế kiểm tra:** Bộ lắng nghe sự kiện trên trang chính nhận được payload. Quá trình kiểm tra bằng indexOf('http:') trả về kết quả là "true" (tìm thấy chuỗi), vì thế nó cho rằng đây là một URL hợp lệ.
3. **Kích hoạt Sink:** Sau khi vượt qua bước kiểm tra, toàn bộ payload `javascript:print()//http:` được chuyển đến sink `location.href`. Trình duyệt sẽ cố gắng điều hướng đến địa chỉ này, nhận diện lược đồ javascript: và thực thi đoạn mã theo sau, tức là hàm print(), hoàn thành mục tiêu của bài lab.

# **Lab 03: DOM XSS using web messages and `JSON.parse`**

Bài lab này trình bày về một kịch bản tấn công DOM XSS, trong đó dữ liệu độc hại được truyền qua web message và được xử lý bởi hàm `JSON.parse`. Để hoàn thành bài lab, bạn cần xây dựng một trang HTML trên máy chủ khai thác (exploit server) để khai thác lỗ hổng này và gọi hàm print().

Khi phân tích mã nguồn của trang mục tiêu, chúng ta thấy một bộ lắng nghe sự kiện (event listener) được đăng ký để xử lý các tin nhắn web. Lỗ hổng cốt lõi nằm ở việc ứng dụng tin tưởng và xử lý dữ liệu nhận được qua tin nhắn web mà không có sự kiểm tra nguồn gốc (origin check) đầy đủ.

![image.png](/assets/img/portswigger/dom-based-vulnerabilities/image%202.png)

Cụ thể, bộ lắng nghe sự kiện này nhận một chuỗi, phân tích nó bằng JSON.parse() để chuyển thành đối tượng JavaScript. Sau đó, nó sử dụng câu lệnh switch để xử lý dựa trên thuộc tính type của đối tượng. Trong trường hợp type là load-channel, ứng dụng sẽ lấy giá trị của thuộc tính `url` và gán trực tiếp vào thuộc tính `src` của một thẻ `iframe`. Đây chính là điểm cuối (sink) của lỗ hổng.

Truy cập vào máy chủ khai thác và thêm đoạn mã iframe sau vào phần thân (body) của trang. Lưu ý thay thế YOUR-LAB-ID bằng ID bài lab của bạn:

```python
<iframe src=https://YOUR-LAB-ID.web-security-academy.net/ onload='this.contentWindow.postMessage("{\"type\":\"load-channel\",\"url\":\"javascript:print()\"}","*")'>
```

Lưu lại mã khai thác và gửi nó đến nạn nhân.

1. **Gửi Payload:** Khi iframe trên máy chủ khai thác được tải, phương thức postMessage() sẽ gửi một tin nhắn dưới dạng chuỗi JSON đến trang chính.
    - "{\"type\":\"load-channel\",\"url\":\"javascript:print()\"}": Đây là chuỗi JSON được xây dựng cẩn thận. Lưu ý các dấu " được thoát bằng \ để trở thành một chuỗi hợp lệ trong thuộc tính onload.
    - "*": Đối số thứ hai chỉ định rằng tin nhắn có thể được gửi đến bất kỳ nguồn gốc (origin) nào, làm cho việc khai thác dễ dàng hơn.
2. **Xử lý và Kích hoạt Lỗ hổng:**
    - Bộ lắng nghe sự kiện trên trang chính nhận được chuỗi JSON và sử dụng JSON.parse() để chuyển đổi nó thành một đối tượng JavaScript: { type: "load-channel", url: "javascript:print()" }.
    - Câu lệnh switch trên trang sẽ khớp với trường hợp case 'load-channel'.
    - Tại đây, giá trị của thuộc tính url (chính là payload của chúng ta: javascript:print()) được lấy ra và gán cho thuộc tính src của thẻ iframe trên trang (tên là ACMEplayer.element).
3. **Thực thi Mã độc:**
    - Khi trình duyệt cố gắng tải nguồn (source) cho iframe này, nó sẽ nhận diện lược đồ (protocol) javascript: và thực thi đoạn mã theo sau nó.
    - Kết quả là hàm print() được gọi thành công trong ngữ cảnh của trang nạn nhân, hoàn thành cuộc tấn công.

# **Lab 04: DOM-based open redirection**

Bài lab này trình bày về một lỗ hổng chuyển hướng mở dựa trên DOM. Để hoàn thành bài lab, bạn cần khai thác lỗ hổng này để chuyển hướng nạn nhân đến máy chủ khai thác (exploit server).

Trên trang chi tiết bài đăng của blog, có một liên kết "Back to Blog" với đoạn mã xử lý sự kiện onclick như sau:

```python
<a href='#' onclick='returnURL = /url=https?:\/\/.+)/.exec(location); if(returnUrl)location.href = returnUrl[1];else location.href = "/"'>Back to Blog</a>
```

1. **returnURL = /url=https?:\/\/.+)/.exec(location)**:
    - location: là toàn bộ URL hiện tại
    - Đoạn mã này sử dụng một biểu thức chính quy (Regular Expression) để tìm kiếm trong URL hiện tại (location) để khớp và lấy một chuỗi bắt đầu bằng url= và theo sau là http:// hoặc https://.
    - Phần .+ sẽ khớp với bất kỳ ký tự nào cho đến hết chuỗi URL.
    - Quan trọng nhất, phần (https?:\/\/.+) nằm trong một nhóm bắt giữ (capturing group). Nếu biểu thức khớp, toàn bộ URL được cung cấp sẽ được lưu vào nhóm này.
2. **if(returnUrl)location.href = returnUrl[1]**:
    - Nếu biểu thức chính quy tìm thấy một kết quả khớp (returnUrl không phải là null), đoạn mã sẽ lấy nội dung của nhóm bắt giữ đầu tiên (returnUrl[1]) - chính là URL do người dùng cung cấp.
    - Sau đó, nó gán giá trị này cho `location.href`, khiến trình duyệt thực hiện chuyển hướng đến URL đó. Đây chính là **sink** (điểm cuối) của lỗ hổng.

Lỗ hổng cốt lõi ở đây là ứng dụng chỉ xác thực rằng tham số url có chứa một URL bắt đầu bằng http:// hoặc https://, nhưng hoàn toàn không giới hạn tên miền (domain) của URL đó. Điều này cho phép kẻ tấn công chèn vào một URL trỏ đến bất kỳ trang web độc hại nào.

Để giải quyết bài lab, bạn cần xây dựng và truy cập URL sau. Hãy nhớ thay thế YOUR-LAB-ID và YOUR-EXPLOIT-SERVER-ID bằng các giá trị tương ứng của bạn:

```python
https://YOUR-LAB-ID.web-security-academy.net/post?postId=4&url=https://YOUR-EXPLOIT-SERVER-ID.exploit-server.net/
```

Khi nạn nhân truy cập vào URL này và nhấp vào liên kết "Back to Blog", trình duyệt của họ sẽ thực thi mã onclick, tìm thấy tham số url trỏ đến máy chủ khai thác của bạn và thực hiện chuyển hướng đến đó, hoàn thành mục tiêu của bài lab

# **Lab 05: DOM-based cookie manipulation**

Bài lab này trình bày về một cuộc tấn công DOM-based, trong đó kẻ tấn công có thể thao túng cookie ở phía client. Để hoàn thành bài lab, bạn cần tiêm (inject) một cookie chứa mã độc, mà khi được xử lý ở một trang khác, sẽ gây ra lỗ hổng Cross-Site Scripting (XSS) và gọi hàm print(). Bạn sẽ cần sử dụng máy chủ khai thác để điều hướng nạn nhân đến các trang cần thiết một cách tự động.

Khi phân tích ứng dụng, chúng ta phát hiện ra rằng trang chủ sử dụng một cookie phía client có tên là `lastViewedProduct`. Giá trị của cookie này chính là URL của trang sản phẩm cuối cùng mà người dùng đã xem

Lỗ hổng này là một dạng **Stored XSS phía client (Client-Side Stored XSS)**, bao gồm hai giai đoạn:

1. **Giai đoạn ghi (Write):** Trên các trang sản phẩm, có một đoạn mã JavaScript lấy URL hiện tại và lưu vào cookie `lastViewedProduct`. Đây là điểm chúng ta có thể tiêm payload vào.
2. **Giai đoạn đọc (Read):** Trên trang chủ, một đoạn mã khác đọc giá trị từ cookie `lastViewedProduct` và có thể ghi nó vào DOM mà không qua xử lý hay mã hóa đúng cách. Đây là điểm payload sẽ được thực thi

Truy cập vào máy chủ khai thác và thêm đoạn mã iframe sau vào phần thân (body) của trang. Lưu ý thay thế YOUR-LAB-ID bằng ID bài lab của bạn:

```python
<iframe src="https://YOUR-LAB-ID.web-security-academy.net/product?productId=1&'><script>print()</script>" onload="if(!window.x)this.src='https://YOUR-LAB-ID.web-security-academy.net';window.x=1;">
```

Cuộc tấn công diễn ra một cách tinh vi và tự động qua các bước sau:

**Bước 1: Tải URL Độc hại:**

- `src="https://.../product?productId=1&'&gt;&lt;script&gt;print()&lt;/script&gt;"`: Thuộc tính src của iframe trỏ đến một URL sản phẩm hợp lệ, nhưng được nối thêm một payload JavaScript (`&'&gt;&lt;script&gt;print()&lt;/script&gt;`).
- Khi iframe tải lần đầu tiên, trình duyệt của nạn nhân sẽ truy cập vào URL độc hại này.

**Bước 2: Ghi Cookie Độc hại (Poisoning the Cookie):**

- Đoạn mã JavaScript trên trang sản phẩm sẽ được thực thi. Nó sẽ lấy toàn bộ URL hiện tại của iframe (bao gồm cả payload của chúng ta) và lưu vào cookie `lastViewedProduct`. Tại thời điểm này, cookie của nạn nhân đã bị nhiễm độc.

**Bước 3: Che giấu và Chuyển hướng:**

- `onload="if(!window.x)this.src='https://...';window.x=1;"`: Đây là một kỹ thuật thông minh để che giấu cuộc tấn công.
- Ngay sau khi iframe tải xong (và đã ghi cookie độc hại), sự kiện onload được kích hoạt.
- Đoạn mã này ngay lập tức thay đổi src của iframe để trỏ về trang chủ hợp lệ. Điều này khiến nạn nhân không hề hay biết rằng trình duyệt của họ vừa truy cập một URL độc hại.
- Việc sử dụng cờ window.x để đảm bảo hành động chuyển hướng này chỉ xảy ra một lần duy nhất, tránh tạo ra vòng lặp vô tận.

**Bước 4: Kích hoạt Payload XSS:**

- Khi iframe được chuyển hướng về trang chủ, đoạn mã JavaScript trên trang chủ sẽ chạy.
- Nó đọc giá trị từ cookie `lastViewedProduct`. Vì cookie này đã bị nhiễm độc, giá trị đọc được chính là payload của chúng ta.
- Ứng dụng sau đó ghi giá trị này vào DOM mà không xử lý, khiến cho payload &lt;script&gt;print()&lt;/script&gt; được thực thi.

Kết quả là hàm print() được gọi thành công, hoàn thành mục tiêu của bài lab mà không cần nạn nhân thực hiện thêm bất kỳ tương tác nào.

# **Lab 06: Exploiting DOM clobbering to enable XSS**

**Khai thác lỗ hổng DOM Clobbering để thực thi XSS**

Bài lab này trình bày về một lỗ hổng DOM Clobbering. Chức năng bình luận cho phép người dùng chèn một số thẻ HTML "an toàn". Để hoàn thành bài lab, bạn cần xây dựng một chuỗi HTML injection để ghi đè (clobber) một biến JavaScript, từ đó tạo điều kiện thực thi XSS và gọi hàm alert().

**Lưu ý:** Giải pháp cho bài lab này được thiết kế để hoạt động hiệu quả nhất trên trình duyệt Chrome.

**1. Nguyên nhân Gốc rễ: Mẫu Lập trình Nguy hiểm**

Mã nguồn của trang chi tiết bài đăng có import một tệp JavaScript là `loadCommentsWithDomClobbering.js`, chứa đoạn mã sau:

```python
let defaultAvatar = window.defaultAvatar || {avatar: '/resources/images/avatarDefault.svg'}
```

Đây là một mẫu lập trình cực kỳ nguy hiểm và là nguồn gốc của lỗ hổng. Logic của nó là: "Nếu biến toàn cục `window.defaultAvatar` đã tồn tại, hãy sử dụng nó. Nếu không, hãy tạo một đối tượng mặc định".

Chính việc kiểm tra sự tồn tại của một biến toàn cục (window.defaultAvatar) trước khi khởi tạo đã mở ra cánh cửa cho tấn công **DOM Clobbering**. DOM Clobbering là một kỹ thuật tấn công trong đó kẻ tấn công chèn các phần tử HTML (như &lt;a&gt;, &lt;form&gt;, &lt;input&gt;) vào trang để tạo ra các biến toàn cục trong môi trường JavaScript. Trình duyệt sẽ tự động tạo các thuộc tính trên đối tượng window tương ứng với id của các phần tử này.

Mục tiêu của chúng ta là "clobber" (ghi đè) biến window.defaultAvatar bằng một đối tượng do chúng ta kiểm soát, thay vì để nó là undefined và nhận giá trị mặc định. Đối tượng này phải chứa một thuộc tính tên là avatar mang theo payload XSS của chúng ta.

```python
if (comment.body) {
    let commentBodyPElement = document.createElement("p");
    commentBodyPElement.innerHTML = DOMPurify.sanitize(comment.body);
		commentSection.appendChild(commentBodyPElement);
}
```

Trang web sử dụng thư viện DOMPurify để lọc mã HTML độc hại. Tuy nhiên, cấu hình DOMPurify của trang này có một điểm yếu: nó cho phép sử dụng giao thức `cid:`. Giao thức này không thực hiện mã hóa URL (URL-encode) đối với dấu ngoặc kép ("). Điều này cho phép chúng ta chèn một dấu ngoặc kép đã được mã hóa dưới dạng thực thể HTML ("), nó sẽ vượt qua bộ lọc và sau đó được trình duyệt giải mã lại thành dấu ngoặc kép thực sự tại thời điểm chạy, giúp chúng ta thoát khỏi ngữ cảnh chuỗi.

### Bước 1: Tiêm Payload để Clobber Biến

Truy cập một trong các bài đăng trên blog và đăng một bình luận chứa đoạn mã HTML sau:

```python
<a id=defaultAvatar><a id=defaultAvatar name=avatar href="cid:&quot;onerror=alert(1)//">
```

- &lt;a id=defaultAvatar&gt;: Chúng ta tạo hai thẻ &lt;a&gt; có cùng id là defaultAvatar. Khi có nhiều phần tử cùng id, trình duyệt (đặc biệt là Chrome) sẽ nhóm chúng lại thành một HTMLCollection (một đối tượng giống như mảng). Do đó, biến toàn cục window.defaultAvatar bây giờ sẽ trỏ đến HTMLCollection này, không còn là undefined nữa.
- name=avatar: Trong một HTMLCollection, bạn có thể truy cập các phần tử con thông qua thuộc tính name của chúng. Bằng cách đặt name="avatar" cho thẻ &lt;a&gt; thứ hai, chúng ta đã tạo ra một thuộc tính avatar trên HTMLCollection đó. Giờ đây, window.defaultAvatar.avatar sẽ trỏ đến chính thẻ &lt;a&gt; thứ hai này.
- href="cid:&quot;onerror=alert(1)//": Giá trị của thuộc tính href của thẻ &lt;a&gt; thứ hai sẽ trở thành giá trị của window.defaultAvatar.avatar.
    - cid:: Giao thức được phép bởi DOMPurify.
    - &quot;: Dấu ngoặc kép được mã hóa. Nó sẽ qua mặt DOMPurify, và sau đó trình duyệt sẽ diễn giải nó thành " khi gán giá trị.
    - onerror=alert(1): Payload XSS chính của chúng ta.
    - //: Dấu chú thích trong JavaScript để vô hiệu hóa bất kỳ ký tự nào có thể được thêm vào sau payload, đảm bảo mã không bị lỗi cú pháp.

![{335752AC-FED7-4D40-A851-69E3A60FA25A}.png](/assets/img/portswigger/dom-based-vulnerabilities/335752AC-FED7-4D40-A851-69E3A60FA25A.png)

Sau khi đăng bình luận này, biến window.defaultAvatar trên trang đã bị ghi đè thành công. Nó không còn là một đối tượng JavaScript mặc định nữa mà đã trở thành một HTMLCollection độc hại.

### Bước 2: Kích hoạt Payload

Quay trở lại bài đăng và **tạo một bình luận thứ hai** chứa bất kỳ nội dung nào (ví dụ: "test").

Hành động này sẽ kích hoạt lại việc tải và hiển thị các bình luận, bao gồm cả avatar. Lần này, khi đoạn mã `loadCommentsWithDomClobbering.js` được thực thi:

1. Câu lệnh `let defaultAvatar = window.defaultAvatar || ...` được chạy.
2. window.defaultAvatar lúc này **không phải** là undefined. Nó chính là HTMLCollection mà chúng ta đã tạo. Do đó, toán tử || sẽ trả về window.defaultAvatar.
3. Khi mã nguồn tiếp tục xử lý để hiển thị avatar, nó sẽ cố gắng truy cập defaultAvatar.avatar để lấy đường dẫn hình ảnh.
4. Giá trị nó nhận được là chuỗi độc hại của chúng ta: cid:"onerror=alert(1)//.
5. Giá trị này có thể được chèn vào một thuộc tính của thẻ &lt;img&gt;, ví dụ: &lt;img src='cid:"onerror=alert(1)//'&gt;.
6. Trình duyệt không thể tải tài nguyên từ src này, gây ra lỗi và kích hoạt sự kiện onerror.
7. Hàm alert(1) được thực thi thành công.

![{0FDF80E6-0634-4439-A17A-FC43D3371093}.png](/assets/img/portswigger/dom-based-vulnerabilities/0FDF80E6-0634-4439-A17A-FC43D3371093.png)

# **Lab 07: Clobbering DOM attributes to bypass HTML filters**

Bài lab này trình bày một lỗ hổng trong thư viện lọc HTML có tên là HTMLJanitor, vốn rất dễ bị tấn công bởi kỹ thuật DOM Clobbering. Để hoàn thành bài lab, bạn cần xây dựng một vector tấn công để vượt qua bộ lọc, sau đó sử dụng DOM Clobbering để tiêm một payload gọi hàm print(). Bạn sẽ cần sử dụng máy chủ khai thác (exploit server) để tự động hóa cuộc tấn công trên trình duyệt của nạn nhân

**Lưu ý:** Giải pháp cho bài lab này được thiết kế để hoạt động trên Chrome và có thể không hoạt động trên Firefox.

Ứng dụng sử dụng thư viện HTMLJanitor để làm sạch (sanitize) các đoạn mã HTML do người dùng gửi trong phần bình luận. Cơ chế hoạt động của thư viện này (trong phiên bản bị lỗi) là dựa vào một thuộc tính cấu hình tên là `attributes`để quyết định những thuộc tính HTML nào được phép giữ lại.

1. Nó nhận một đoạn HTML đầu vào.
2. Nó duyệt qua từng thẻ HTML.
3. Đối với mỗi thẻ, nó kiểm tra các thuộc tính của thẻ đó dựa trên một danh sách các thuộc tính được phép/bị cấm, có thể được lưu trong một đối tượng cấu hình (ví dụ: config.attributes).
4. Vòng lặp kiểm tra có thể trông giống như for (let i = 0; i &lt; config.attributes.length; i++).

Điểm yếu chí mạng là thư viện này không lường trước được khả năng chính đối tượng config của nó bị ghi đè (clobbered) bởi các phần tử từ DOM. Cụ thể, chúng ta có thể ghi đè lên thuộc tính attributes trong đối tượng cấu hình đó.

Khi chúng ta tiêm một phần tử HTML có id="attributes" vào DOM, biến config.attributes thay vì trỏ đến một mảng các chuỗi (có thuộc tính .length), giờ đây lại trỏ đến một đối tượng HTMLElement (ví dụ: &lt;input&gt;). Một HTMLElement không có thuộc tính .length. Do đó, khi vòng lặp kiểm tra config.attributes.length, nó sẽ nhận về giá trị undefined. Trong JavaScript, undefined khi được dùng trong ngữ cảnh số học (như điều kiện của vòng lặp for) sẽ được coi là 0.

Kết quả là vòng lặp lọc thuộc tính sẽ không bao giờ chạy. Bộ lọc bị vô hiệu hóa hoàn toàn, cho phép chúng ta tiêm bất kỳ thuộc tính nào mình muốn, bao gồm cả các trình xử lý sự kiện nguy hiểm như onfocus.

**Bước 1: Tiêm Vector Clobbering và Payload XSS**

Truy cập một trong các bài đăng trên blog và đăng một bình luận chứa đoạn mã HTML sau:

```python
<form id=x tabindex=0 onfocus=print()><input id=attributes>
```

- &lt;input id=attributes&gt;: Đây là **vector clobbering**. Nó tạo ra một phần tử trong DOM với id là attributes. Phần tử này sẽ ghi đè lên thuộc tính attributes của đối tượng cấu hình HTMLJanitor, làm cho vòng lặp lọc bị vô hiệu hóa như đã giải thích ở trên.
- &lt;form ...&gt;: Thẻ chứa payload chính của chúng ta.
- onfocus=print(): Đây là **vector XSS**. Vì bộ lọc đã bị vô hiệu hóa, thuộc tính onfocus này không bị loại bỏ. Nó sẽ thực thi hàm print() khi phần tử form nhận được focus.
- id=x: Gán một id cho thẻ form để chúng ta có thể nhắm mục tiêu vào nó sau này.
- tabindex=0: Một thuộc tính quan trọng. Nó làm cho một phần tử vốn không thể focus (như &lt;form&gt;) trở thành có thể focus. Điều này là cần thiết để sự kiện onfocus có thể được kích hoạt.

![image.png](/assets/img/portswigger/dom-based-vulnerabilities/image%203.png)

**Bước 2: Tự động hóa việc Kích hoạt Payload**

Truy cập máy chủ khai thác và thêm đoạn mã iframe sau vào phần thân (body):

```python
<iframe src=https://YOUR-LAB-ID.web-security-academy.net/post?postId=3 onload="setTimeout(()=>this.src=this.src+'#x',500)">
```

Hãy nhớ thay thế URL bằng ID bài lab của bạn và đảm bảo postId khớp với bài đăng mà bạn đã chèn bình luận ở bước trước

- src=...: iframe sẽ tải trang blog chứa bình luận độc hại của chúng ta.
- onload="...": Đoạn mã này sẽ thực thi sau khi trang trong iframe đã tải xong.
- setTimeout(..., 500): Đặt một khoảng trễ 500ms. Khoảng trễ này rất quan trọng vì các bình luận thường được tải động bằng JavaScript sau khi trang đã tải xong. Chúng ta cần đảm bảo bình luận chứa payload của mình đã được hiển thị trên trang trước khi cố gắng tương tác với nó.
- this.src=this.src+'#x': Sau khoảng trễ, đoạn mã này lấy URL hiện tại của iframe và nối thêm chuỗi #x (URL fragment) vào cuối. Khi trình duyệt thấy một URL fragment, nó sẽ cố gắng di chuyển đến (focus vào) phần tử HTML có id tương ứng. Trong trường-hợp này, nó sẽ focus vào thẻ &lt;form id=x&gt; của chúng ta.

**Tổng kết luồng tấn công:**

1. Trình duyệt của nạn nhân tải trang từ máy chủ khai thác.
2. iframe được tạo và tải trang blog post.
3. Trang blog post tải và hiển thị bình luận độc hại (&lt;form&gt; và &lt;input&gt;).
4. Sau 500ms, onload của iframe kích hoạt, thay đổi URL của iframe thành ...#x.
5. Trình duyệt nhận lệnh focus vào phần tử có id="x".
6. Sự kiện onfocus trên thẻ &lt;form&gt; được kích hoạt.
7. Hàm print() được gọi thành công, hoàn thành cuộc tấn công
