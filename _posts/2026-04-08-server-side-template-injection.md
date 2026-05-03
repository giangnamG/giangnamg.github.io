---
layout: post
title: "Server-side template injection"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - server-side-template-injection
source_collection: notion_portswigger
---
Technical (1)

## Lỗ hổng SSTI phát sinh như thế nào?

Lỗ hổng chèn mẫu phía máy chủ phát sinh khi tham số truyền vào template là 1 untrusted data

Các mẫu tĩnh chỉ cung cấp phần giữ chỗ để hiển thị nội dung động thường không dễ bị tấn công bởi việc tiêm mẫu phía máy chủ

Ví dụ cổ điển là một email chào mừng từng người dùng bằng tên của họ, chẳng hạn như đoạn trích sau từ Twig Template:

`$output = $twig-&gt;render("Dear {first_name},", array("first_name" =&gt; $user.first_name) );`

Điều này không dễ bị tấn công bởi SSTI vì tên của người dùng chỉ được chuyển vào mẫu dưới dạng dữ liệu.

Tuy nhiên, vì các mẫu chỉ đơn giản là các chuỗi, các nhà phát triển web đôi khi trực tiếp ghép thông tin đầu vào của người dùng vào các mẫu trước khi hiển thị. 

`$output = $twig-&gt;render("Dear " . $_GET['name']);`

Những lỗ hổng như thế này đôi khi vô tình xảy ra do thiết kế template kém của những người không quen với các tác động bảo mật. Ở một khía cạnh nào đó, điều này tương tự như các lỗ hổng SQLI xảy ra trong các câu lệnh được chuẩn bị kém.

## Xây dựng một cuộc tấn công SSTI

- details
    
    Việc xác định các lỗ hổng chèn mẫu phía máy chủ và thực hiện một cuộc tấn công thành công thường bao gồm quy trình cấp cao sau đây.
    
    ![Untitled](/assets/img/portswigger/server-side-template-injection/Untitled.png)
    
    ### **Detect**
    
    Các lỗ hổng SSTI thường không được chú ý không phải vì chúng phức tạp mà vì chúng chỉ thực sự rõ ràng đối với những người kiểm thử đang tìm kiếm chúng một cách rõ ràng.
    
    Có lẽ cách tiếp cận ban đầu đơn giản nhất là thử fuzzing mẫu bằng cách chèn một chuỗi ký tự đặc biệt thường được sử dụng trong các biểu thức mẫu, chẳng hạn như `${{&lt;%`%'"}}%\` Nếu một ngoại lệ được nêu ra, điều này cho thấy rằng cú pháp mẫu được chèn có khả năng được máy chủ diễn giải theo một cách nào đó. Đây là một dấu hiệu cho thấy lỗ hổng SSTI có thể tồn tại.
    
    Các lỗ hổng chèn mẫu phía máy chủ xảy ra trong hai bối cảnh riêng biệt, mỗi bối cảnh yêu cầu phương pháp phát hiện riêng. Bất kể kết quả của nỗ lực fuzzing của bạn là gì, điều quan trọng là bạn cũng phải thử các cách tiếp cận theo ngữ cảnh cụ thể sau đây. Nếu việc fuzzing không thể kết luận được thì một lỗ hổng vẫn có thể tự lộ diện bằng cách sử dụng một trong các phương pháp này. Ngay cả khi fuzzing gợi ý lỗ hổng chèn mẫu, bạn vẫn cần xác định bối cảnh của nó để khai thác.
    
    ### Bối cảnh bản rõ
    
    Hầu hết các ngôn ngữ mẫu cho phép bạn tự do nhập nội dung bằng cách sử dụng trực tiếp thẻ HTML hoặc bằng cú pháp gốc của mẫu, sẽ được hiển thị thành HTML ở back-end trước khi gửi phản hồi HTTP. Ví dụ: trong Freemarker, dòng `render('Hello ' + username)` sẽ hiển thị thành `Hello Carlos` Điều này đôi khi có thể bị khai thác để tấn công XSS và trên thực tế thường bị nhầm lẫn với một lỗ hổng XSS đơn giản.
    
    Tuy nhiên, bằng cách đặt các phép toán làm giá trị của tham số, chúng ta có thể kiểm tra xem liệu đây có phải là điểm truy cập tiềm năng cho một cuộc tấn công tiêm mẫu phía máy chủ hay không.
    
    Ví dụ: hãy xem xét một mẫu có chứa mã dễ bị tấn công sau:
    
    `render('Hello ' + username)`
    
    Trong quá trình kiểm tra, chúng tôi có thể kiểm tra việc chèn mẫu phía máy chủ bằng cách yêu cầu một URL như:
    
    [`http://vulnerable-website.com/?username=${7*7}``
    
    Nếu kết quả đầu ra chứa `Hello 49`, điều này cho thấy phép toán đang được đánh giá phía máy chủ.
    
    ### Bối cảnh code
    
    Trong các trường hợp khác, lỗ hổng bị lộ do dữ liệu đầu vào của người dùng được đặt trong một biểu thức mẫu, như chúng ta đã thấy trước đó với ví dụ về email của mình. Điều này có thể ở dạng tên biến do người dùng kiểm soát được đặt bên trong một tham số, chẳng hạn như:
    
    `greeting = getQueryParameter('greeting')
     engine.render("Hello {{"+greeting+"}}", data)`
    
    Trên trang web, URL sẽ giống như sau:
    
    ``http://vulnerable-website.com/?greeting=data.`username`
    
    Bối cảnh này dễ bị bỏ qua trong quá trình đánh giá vì nó không dẫn đến XSS rõ ràng và gần như không thể phân biệt được với tra cứu hashmap đơn giản. Một phương pháp kiểm tra việc chèn mẫu phía máy chủ trong ngữ cảnh này là trước tiên phải xác định rằng tham số không chứa lỗ hổng XSS trực tiếp bằng cách chèn HTML tùy ý vào giá trị:
    
    ``http://vulnerable-website.com/?greeting=data.username`&lt;tag&gt;`
    
    Nếu điều này lại dẫn đến lỗi hoặc đầu ra trống thì bạn đã sử dụng cú pháp từ ngôn ngữ tạo khuôn mẫu sai hoặc nếu không có cú pháp kiểu mẫu nào hợp lệ thì việc chèn mẫu phía máy chủ là không thể.
    
    Trong trường hợp không có XSS, điều này thường sẽ dẫn đến một mục trống ở đầu ra (chỉ xin chào mà không có tên người dùng), thẻ được mã hóa hoặc thông báo lỗi. Bước tiếp theo là thử thoát ra khỏi câu lệnh bằng cách sử dụng cú pháp tạo khuôn mẫu phổ biến và cố gắng chèn HTML tùy ý vào sau nó:
    
    ``http://vulnerable-website.com/?greeting=data.username`}}&lt;tag&gt;`
    
    Ngoài ra, nếu kết quả đầu ra được hiển thị chính xác, cùng với HTML tùy ý, thì đây là dấu hiệu chính cho thấy có lỗ hổng chèn mẫu phía máy chủ: `Hello Carlos&lt;tag&gt;`
    
    ### Identify
    
    Khi bạn đã phát hiện ra khả năng tiêm mẫu, bước tiếp theo là xác định công cụ tạo mẫu.
    
    Mặc dù có rất nhiều ngôn ngữ tạo khuôn mẫu nhưng nhiều ngôn ngữ trong số đó sử dụng cú pháp rất giống nhau được chọn cụ thể để không xung đột với các ký tự HTML. Do đó, việc tạo các tải trọng thăm dò để kiểm tra công cụ tạo mẫu nào đang được sử dụng có thể tương đối đơn giản.
    
    Chỉ cần gửi cú pháp không hợp lệ thường là đủ vì thông báo lỗi thu được sẽ cho bạn biết chính xác công cụ tạo mẫu là gì và đôi khi cả phiên bản nào. Ví dụ: biểu thức không hợp lệ `&lt;%=foobar%&gt;` kích hoạt phản hồi sau từ công cụ `ERB` dựa trên `Ruby`:
    
    `error:` (erb):1:in `&lt;main&gt;': undefined local variable or method` foobar' for main:Object (NameError)
    from /usr/lib/ruby/2.5.0/erb.rb:876:in `eval' from /usr/lib/ruby/2.5.0/erb.rb:876:in` result'
    from -e:4:in `&lt;main&gt;'
    
    Nếu không, bạn sẽ cần phải kiểm tra thủ công các tải trọng dành riêng cho ngôn ngữ khác nhau và nghiên cứu cách chúng được công cụ tạo mẫu diễn giải. Sử dụng quy trình loại bỏ dựa trên cú pháp nào có vẻ hợp lệ hoặc không hợp lệ, bạn có thể thu hẹp các tùy chọn nhanh hơn bạn nghĩ. Cách phổ biến để thực hiện việc này là đưa vào các phép toán tùy ý bằng cách sử dụng cú pháp từ các công cụ tạo mẫu khác nhau. Sau đó bạn có thể quan sát xem chúng có được đánh giá thành công hay không. Để trợ giúp quá trình này, bạn có thể sử dụng cây quyết định tương tự như sau:
    
    ![Untitled](/assets/img/portswigger/server-side-template-injection/Untitled%201.png)
    
    Bạn nên lưu ý rằng cùng một tải trọng đôi khi có thể trả về phản hồi thành công bằng nhiều ngôn ngữ mẫu.
    
    Ví dụ: tải trọng `{{7*'7'}}` trả về `49` trong `Twig` và `7777777` trong `Jinja2`. Vì vậy, điều quan trọng là không nên vội kết luận chỉ dựa trên một phản hồi thành công duy nhất.
    

## EXPLOIT

### Cú Pháp Detect

![Untitled](/assets/img/portswigger/server-side-template-injection/Untitled%201.png)

- Tiêm kết hợp các dấu `}` `}}` `{` `{{` `$` `&lt;%=` `'` `"` để kích lỗi trong bối cảnh context code
- s
- `ruby using ERB template:` `&lt;%= 7*7 %&gt;`

### Bật Chế Độ Debug

- `Django: {% debug %}`

### Cú Pháp Exploit:

1. Trong Template `Tornado`, xác định cú pháp để thực thi Python tùy ý:

```python
{% import os %} // {% %} -> dùng để import
{{os.system('rm /home/carlos/morale.txt') // {{ }} -> dùng để thực thi code
```

![Untitled](/assets/img/portswigger/server-side-template-injection/Untitled%202.png)

## Cách ngăn chặn lỗ hổng chèn mẫu phía máy chủ

Cách tốt nhất để ngăn chặn việc chèn mẫu phía máy chủ là không cho phép bất kỳ người dùng nào sửa đổi hoặc gửi mẫu mới. Tuy nhiên, điều này đôi khi không thể tránh khỏi do yêu cầu kinh doanh.

Một trong những cách đơn giản nhất để tránh tạo ra các lỗ hổng chèn mẫu phía máy chủ là luôn sử dụng  template engine "logic-less", chẳng hạn như `Mustache`, trừ khi thực sự cần thiết. Việc tách logic khỏi bản trình bày càng nhiều càng tốt có thể làm giảm đáng kể khả năng bạn gặp phải các cuộc tấn công dựa trên mẫu nguy hiểm nhất.

Một biện pháp khác là chỉ thực thi mã của người dùng trong môi trường sandboxed, nơi các mô-đun và chức năng tiềm ẩn nguy hiểm đã bị loại bỏ hoàn toàn. Thật không may, việc sandbox untrusted code vốn đã khó khăn và dễ bị bỏ qua.

Cuối cùng, một cách tiếp cận bổ sung khác là chấp nhận rằng việc thực thi mã tùy ý là điều không thể tránh khỏi và áp dụng sandboxed của riêng bạn bằng cách triển khai môi trường mẫu của bạn trong vùng chứa Docker bị khóa chẳng hạn.
