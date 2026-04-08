---
layout: post
title: "JWT attacks"
render_with_liquid: false
categories:
  - PortSwigger
tags:
  - portswigger
  - jwt-attacks
source_collection: notion_portswigger
---
JWT bao gồm 3 phần: header, payload và signature. Mỗi cái này được phân tách bằng dấu chấm

Phần header và payload của JWT là các đối tượng JSON được mã hóa base64url

**JWT signature:** được băm từ header và payload + secret key

Vì chữ ký được lấy trực tiếp từ phần còn lại của mã thông báo nên việc thay đổi một byte của tiêu đề hoặc tải trọng sẽ dẫn đến chữ ký không khớp.

Nếu không biết khóa ký bí mật của máy chủ thì sẽ không thể tạo chữ ký chính xác cho tiêu đề hoặc tải trọng nhất định.

- **1. Khai thác xác minh chữ ký JWT thiếu sót, Chấp nhận chữ ký tùy ý**
    
    Theo thiết kế, các máy chủ thường không lưu trữ bất kỳ thông tin nào về JWT mà chúng phát hành. Thay vào đó, mỗi mã thông báo là một thực thể hoàn toàn khép kín. Điều này có một số ưu điểm nhưng cũng gây ra một vấn đề cơ bản - máy chủ thực sự không biết gì về nội dung ban đầu của mã thông báo hoặc thậm chí chữ ký ban đầu là gì.
    
    Do đó, nếu máy chủ không xác minh chữ ký đúng cách thì sẽ không có gì ngăn cản kẻ tấn công thực hiện các thay đổi tùy ý đối với phần còn lại của mã thông báo.
    
    Ví dụ: Xét một JWT chứa các xác nhận quyền sở hữu sau:
    
    ```jsx
    {
        "username": "carlos",
        "isAdmin": false
    }
    ```
    
    Nếu máy chủ xác định phiên dựa trên tên người dùng này, việc sửa đổi giá trị của nó có thể cho phép kẻ tấn công mạo danh những người dùng đã đăng nhập khác. Tương tự, nếu giá trị `isAdmin` được sử dụng để kiểm soát quyền truy cập, điều này có thể cung cấp leo thang đặc quyền.
    
    `ATTACK`
    
    Thư viện JWT thường cung cấp một phương thức để xác minh mã thông báo và một phương thức khác chỉ giải mã chúng. Ví dụ: thư viện Node.js `jsonwebtoken` có `verify()` và `decode()`.
    
    Đôi khi, các nhà phát triển nhầm lẫn hai phương thức này và chỉ chuyển mã thông báo đến cho phương thức `decode()`. Điều này có nghĩa là ứng dụng hoàn toàn không xác minh chữ ký.
    
    Điều này tức là ta có thể tự ký hoặc không ký
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image.png)
    
- **2. Chấp nhận mã thông báo không có chữ ký**
    
     Tiêu đề JWT chứa tham số `alg`. Điều này cho máy chủ biết thuật toán nào đã được sử dụng để ký mã thông báo và do đó, thuật toán nào cần sử dụng khi xác minh chữ ký.
    
    ```jsx
    {
        "alg": "HS256",
        "typ": "JWT"
    }
    ```
    
    Điều này vốn có sai sót vì máy chủ không có tùy chọn nào khác ngoài việc hoàn toàn tin tưởng vào thông tin đầu vào do người dùng kiểm soát từ mã thông báo mà tại thời điểm này, mã thông báo này vẫn chưa được xác minh.
    
    JWT có thể được ký bằng nhiều thuật toán khác nhau, nhưng cũng có thể không được ký. 
    
    Trong trường hợp này, tham số `alg` được đặt thành `none`
    
    Do sự nguy hiểm rõ ràng của việc này, các máy chủ thường từ chối các mã thông báo không có chữ ký.
    
    Tuy nhiên, vì loại lọc này phụ thuộc vào phân tích cú pháp chuỗi nên đôi khi bạn có thể bỏ qua các bộ lọc này bằng cách sử dụng các kỹ thuật làm xáo trộn cổ điển, chẳng hạn như viết hoa hỗn hợp và mã hóa không mong muốn.
    
    `Note: Ngay cả khi mã thông báo không được ký, phần tải trọng vẫn phải được kết thúc bằng dấu chấm ở cuối.`
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%201.png)
    
- 3. **Brute-forcing secret keys**
    
    Một số thuật toán ký, chẳng hạn như HS256 (HMAC + SHA-256), sử dụng một chuỗi độc lập, tùy ý làm khóa bí mật. Cũng giống như mật khẩu, điều quan trọng là bí mật này không thể dễ dàng bị đoán ra hoặc bị kẻ tấn công brute-force.
    
    Mặt khác, họ có thể tạo JWT với bất kỳ giá trị tiêu đề và tải trọng nào họ thích, sau đó sử dụng khóa để ký lại mã thông báo bằng chữ ký hợp lệ.
    
    Khi triển khai ứng dụng JWT, các nhà phát triển đôi khi mắc lỗi như quên thay đổi bí mật mặc định. Trong trường hợp này, việc kẻ tấn công có thể brute-force bí mật của máy chủ bằng cách sử dụng [`wordlist of well-known secrets](https://github.com/wallarm/jwt-secrets/blob/master/jwt.secrets.list).`
    
    **Brute-forcing secret keys using hashcat**
    Cài đặt: [install hashcat manually](https://hashcat.net/wiki/doku.php?id=frequently_asked_questions#how_do_i_install_hashcat)
    
    Bạn chỉ cần một JWT hợp lệ, được ký từ máy chủ mục tiêu và [`wordlist of well-known secrets`](https://github.com/wallarm/jwt-secrets/blob/master/jwt.secrets.list). Sau đó, bạn có thể chạy lệnh sau, chuyển JWT và danh sách từ làm đối số:
    
    ```jsx
    hashcat -a 0 -m 16500 <jwt> <wordlist>
    ```
    
    `Hashcat` ký tiêu đề và tải trọng từ JWT bằng cách sử dụng từng bí mật trong danh sách từ, sau đó so sánh chữ ký kết quả với chữ ký gốc từ máy chủ. Nếu bất kỳ chữ ký nào trùng khớp, `hashcat` sẽ xuất ra bí mật đã xác định ở định dạng sau, cùng với nhiều chi tiết khác:
    
    ```jsx
    <jwt>:<identified-secret>
    ```
    
    `Note: Nếu bạn chạy lệnh nhiều lần, bạn cần thêm cờ --show để xuất kết quả.` 
    
    [: JWT authentication bypass via weak signing key | Web Security Academy (portswigger.net)](https://portswigger.net/web-security/jwt/lab-jwt-authentication-bypass-via-weak-signing-key)
    
- 4. **JWT header parameter injections**
    - **Giới thiệu**
        
        Theo đặc tả JWS, chỉ có tham số tiêu đề `alg` là bắt buộc. Tuy nhiên, trong thực tế, các tiêu đề JWT (còn được gọi là tiêu đề JOSE) thường chứa một số tham số khác.
        
        • `jwk` (JSON Web Key) - Cung cấp một đối tượng JSON được nhúng đại diện cho khóa.
        • `jku` (JSON Web Key Set URL) - Cung cấp một URL mà từ đó máy chủ có thể tìm nạp một bộ khóa chứa khóa chính xác.
        • `kid` (Key ID) - Cung cấp ID mà máy chủ có thể sử dụng để xác định khóa chính xác trong trường hợp có nhiều khóa để chọn. Tùy thuộc vào định dạng của khóa, có thể match với tham số `kid` .
        
    - **Injecting self-signed JWTs via the jwk parameter: (**Tiêm JWT tự ký thông qua tham số jwk**)**
        
        Đặc tả JSON Web Signature (JWS) là một định dạng được tiêu chuẩn hóa để biểu diễn các khóa dưới dạng đối tượng JSON. mô tả tham số tiêu đề `jwk` tùy chọn mà máy chủ có thể sử dụng để nhúng khóa chung trực tiếp vào chính mã thông báo ở định dạng JWK.
        
        ```jsx
        {
            "kid": "ed2Nf8sb-sD6ng0-scs5390g-fFD8sfxG",
            "typ": "JWT",
            "alg": "RS256",
            "jwk": {
                "kty": "RSA",
                "e": "AQAB",
                "kid": "ed2Nf8sb-sD6ng0-scs5390g-fFD8sfxG",
                "n": "yy1wpYmffgXBxhAUJzHHocCuJolwDqql75ZWuCQ_cb33K2vh9m"
            }
        }
        ```
        

&gt; Mô tả
Bài lab này sử dụng cơ chế dựa trên JWT để xử lý các phiên. Do lỗi trong việc triển khai, máy chủ không xác minh chữ ký của bất kỳ JWT nào mà nó nhận được.
Để giải bài lab, hãy chỉnh sửa token phiên của bạn để truy cập vào bảng điều khiển quản trị ở `/admin` , sau đó xóa người dùng `carlos` .
Bạn có thể đăng nhập vào tài khoản của mình bằng các thông tin đăng nhập sau: `wiener:peter`
&gt; 

Bài lab này nói về việc ứng dụng không kiểm tra signature của JWT, ta có thể kiểm chứng bằng cách xóa phần signature đi, và xem phản hồi

- Trước khi xóa signature
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%202.png)
    
- Sau khi xóa signature
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%203.png)
    

⇒ Xác nhận được ứng dụng không hề kiểm tra signature của JWT gửi lên

Vậy thì chúng ta có thể giả mạo được JWT

Sửa trường sub trong ảnh từ user wiener sang user admin

![image.png](/assets/img/portswigger/jwt-attacks/image%204.png)

**Kết quả**

![image.png](/assets/img/portswigger/jwt-attacks/image%205.png)

&gt; Mô tả
Bài lab này sử dụng cơ chế dựa trên JWT để xử lý các phiên. Máy chủ được cấu hình không an toàn để chấp nhận JWT không có chữ ký.
&gt; 
&gt; 
&gt; Để giải quyết bài tập này, hãy sửa đổi mã thông báo phiên của bạn để có quyền truy cập vào bảng điều khiển quản trị tại /admin, sau đó xóa người dùng carlos.
&gt; Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin đăng nhập sau: wiener:peter
&gt; 
1. Trong bài lab, đăng nhập vào tài khoản của bạn.
2. Trong Burp, vào tab **Proxy &gt; HTTP history** và xem request sau khi đăng nhập `GET /my-account`. Quan sát thấy cookie phiên làm việc của bạn là một JWT. Gửi request này sang **Burp Repeater**.
3. Nhấp đúp vào phần payload của token để xem nó dưới dạng JSON đã giải mã trong tab **Inspector**. Chú ý rằng trường `sub` chứa tên người dùng của bạn. 
4. Trong **Burp Repeater**, thay đổi đường dẫn thành `/admin` và gửi request. Quan sát rằng bảng điều khiển admin chỉ có thể truy cập khi đăng nhập với user `administrator`.
5. Chọn phần payload của JWT một lần nữa. Trong tab **Inspector**, thay đổi giá trị của trường `sub` thành `administrator`, sau đó nhấn **Apply changes**.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%206.png)
    
6. Chọn phần header của JWT, sau đó dùng **Inspector** thay đổi giá trị của tham số `alg` thành `none`. Nhấn **Apply changes**.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%207.png)
    
7. Trong **Message Editor**, xoá phần chữ ký (signature) của JWT, nhưng nhớ giữ lại dấu chấm (`.`) sau phần payload.
8. Gửi request và quan sát rằng bạn đã truy cập thành công vào bảng điều khiển admin.
9. Trong phần phản hồi, tìm URL để xoá user **carlos** (`/admin/delete?username=carlos`). Gửi request tới endpoint này để hoàn thành bài lab.

**Giải thích**

Lỗi ở trên có thể xảy ra vì ứng dụng verify signature với logic như đoạn code sau:

```python
def verify_jwt(token):
    header, payload, signature = parse_jwt(token)
    
    # Đọc thuật toán từ header
    alg = header.get('alg')

    if alg == 'none':
        # Không xác minh chữ ký
        return payload
    elif alg == 'HS256':
        expected_signature = hmac_sha256(header + "." + payload, SECRET_KEY)
        if signature == expected_signature:
            return payload
        else:
            raise Exception("Invalid signature")
    else:
        raise Exception("Unsupported algorithm")
```

Chung quy lại là khi `alg=none` mà backend với luồng verify như trên hoặc tương tự thì kết quả verify sẽ luôn trả về `True` dù có thay đổi payload trong JWT như nào đi chăng nữa. 

Trong 1 vài trường hợp như trong bài lab, phải xóa phần signature trong JWT khi gửi đi

 

&gt; Mô tả:
Bài thực hành này sử dụng cơ chế dựa trên JWT để xử lý các phiên. Nó sử dụng một khóa bí mật cực kỳ yếu để ký và xác minh các token. Điều này có thể bị tấn công bằng phương pháp thử tất cả các khả năng với một danh sách từ các bí mật phổ biến.

Để giải quyết buổi thực hành, trước tiên brute-force để tìm ra khóa bí mật của trang web. Khi bạn đã có được khóa này, hãy sử dụng nó để ký một token phiên đã được chỉnh sửa mà cho bạn quyền truy cập vào bảng điều khiển quản trị ở `/admin` , sau đó xóa người dùng `carlos` .

Bạn có thể đăng nhập vào tài khoản của mình bằng các thông tin đăng nhập sau: `wiener:peter`

Chúng tôi cũng đề nghị sử dụng hashcat để tấn công bằng lực lượng (brute-force) khóa bí mật. Để biết chi tiết cách thực hiện, hãy tham khảo Tấn công bằng lực lượng khóa bí mật sử dụng hashcat.

[wordlist of common secrets](https://github.com/wallarm/jwt-secrets/blob/master/jwt.secrets.list).
&gt; 

### Phần 1 - Brute-force secret key

Chưa cần Brute-Force, BurpSuite đã tự phát hiện ra JWT sử dụng secret key yếu =))

![image.png](/assets/img/portswigger/jwt-attacks/image%208.png)

Nhưng ta vẫn tiến hành làm theo yêu cầu của lab nhé

Sau khi đăng nhập với tài khoản `wiener` ta có JWT sau:

```python
eyJraWQiOiJkYTkxMjE3My1mZWIyLTQ4M2QtOWRmOC05YjY0ZWNmODhjMDkiLCJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJwb3J0c3dpZ2dlciIsImV4cCI6MTc1MTQ3MDY0Miwic3ViIjoid2llbmVyIn0.1cWheLbsZiMFSumANy5jiSiM7PJLVHdU5ADWSdTEgyA
```

Đưa JWT kia vào 1 file jwt.hash, và sau đó chạy lệnh HashCat với wordlist được đính kèm trong phần mô tả sau

![image.png](/assets/img/portswigger/jwt-attacks/image%209.png)

```python
hashcat -a 0 -m 16500 jwt.hash wordlists/jwt.secrets.list
```

Sau khi chạy thì ta nhận được trạng thái cracked

![image.png](/assets/img/portswigger/jwt-attacks/image%2010.png)

Secret key tìm được là `secret1`

Tạo 1 JWT giả danh administrator dựa trên secret key của ứng dụng bị crack

Paste JWT của bạn vào, và sau đó nhập secret key vào

![image.png](/assets/img/portswigger/jwt-attacks/image%2011.png)

Kết quả là `Valid secret`

Thay đổi trường `sub` thành `administrator`

## Phần 2 - Tạo khoá giả mạo

1. Sử dụng **Burp Decoder**, **mã hoá Base64** giá trị **secret** mà bạn đã brute-force được ở phần trước.
2. Trong Burp, vào tab **JWT Editor Keys** và nhấn **New Symmetric Key**. Trong hộp thoại, nhấn **Generate** để tạo một khoá mới ở định dạng JWK. Lưu ý rằng bạn không cần chọn kích thước khoá vì nó sẽ được cập nhật tự động sau đó.
3. Thay thế giá trị đã tạo trong thuộc tính `k` bằng chuỗi secret đã mã hoá Base64.

![image.png](/assets/img/portswigger/jwt-attacks/image%2012.png)

1. Nhấn **OK** để lưu khoá.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%2013.png)
    

## Phần 3 - Sửa đổi và ký lại JWT

1. Quay lại request `GET /admin` trong **Burp Repeater** và chuyển sang tab **JSON Web Token** (tab chỉnh sửa token do extension tạo ra).
2. Trong phần payload, thay đổi giá trị của trường `sub` thành `administrator`.
3. Ở dưới cùng của tab, nhấn **Sign**, sau đó chọn khoá mà bạn đã tạo ở phần trước.
4. Đảm bảo rằng tuỳ chọn **Don't modify header** được chọn, sau đó nhấn **OK**. Token đã được ký lại với chữ ký hợp lệ.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%2014.png)
    
5. Gửi request và quan sát rằng bạn đã truy cập thành công vào bảng điều khiển admin.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%2015.png)
    
6. Trong phần phản hồi, tìm URL để xoá user **carlos** (`/admin/delete?username=carlos`). Gửi request tới endpoint này để hoàn thành bài lab.

&gt; Mô tả
Bài thực hành này sử dụng cơ chế dựa trên JWT để xử lý các phiên. Máy chủ hỗ trợ tham số `jwk` trong tiêu đề JWT. Tham số này đôi khi được sử dụng để nhúng khóa xác thực đúng trực tiếp vào token. Tuy nhiên, nó không kiểm tra xem khóa được cung cấp có đến từ nguồn tin cậy hay không.

Để giải quyết buổi thực hành, hãy chỉnh sửa và ký một JWT để bạn có quyền truy cập vào bảng điều khiển quản trị ở `/admin` , sau đó xóa người dùng `carlos` 

Bạn có thể đăng nhập vào tài khoản của mình bằng các thông tin đăng nhập sau: `wiener:peter`
&gt; 

## Phần 1 - Giải Lab

1. Trong **Burp**, tải extension **JWT Editor** từ **BApp Store**.
2. Trong bài lab, đăng nhập vào tài khoản của bạn và gửi request **GET /my-account** sau khi đăng nhập tới **Burp Repeater**.
3. Trong **Burp Repeater**, thay đổi đường dẫn thành **/admin** và gửi request. Quan sát rằng bảng điều khiển admin chỉ truy cập được khi đăng nhập bằng user **administrator**.
4. Trên thanh tab chính của Burp, chuyển sang tab **JWT Editor Keys**.
5. Nhấn **New RSA Key**.
    
    ![{ADF83AB0-E651-4DCE-AAC0-680058002E29}.png](/assets/img/portswigger/jwt-attacks/ADF83AB0-E651-4DCE-AAC0-680058002E29.png)
    
6. Trong hộp thoại, nhấn **Generate** để tự động tạo một cặp khóa (public/private), sau đó nhấn **OK** để lưu khóa. Lưu ý rằng bạn không cần chọn kích thước khóa vì nó sẽ được tự động cấu hình sau đó.
    
    ![{254CCBB4-2945-4DDA-B5BA-34E1D8E8BD6D}.png](/assets/img/portswigger/jwt-attacks/254CCBB4-2945-4DDA-B5BA-34E1D8E8BD6D.png)
    
7. Quay lại request **GET /admin** trong **Burp Repeater** và chuyển sang tab **JSON Web Token** được tạo bởi extension.
8. Trong phần payload, thay đổi giá trị của trường **sub** thành **administrator**.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%2016.png)
    
9. Ở dưới cùng của tab **JSON Web Token**, nhấn **Attack**, sau đó chọn **Embedded JWK**. Khi được hỏi, chọn khóa RSA mà bạn vừa tạo và nhấn **OK**.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%2017.png)
    
10. Trong phần header của JWT, quan sát rằng đã có thêm tham số **jwk**, chứa public key của bạn.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%2018.png)
    
11. Gửi request. Quan sát rằng bạn đã truy cập thành công vào bảng điều khiển admin.
    
    ![image.png](/assets/img/portswigger/jwt-attacks/image%2019.png)
    
12. Trong phần phản hồi, tìm URL để xoá user **carlos** (`/admin/delete?username=carlos`). Gửi request tới endpoint này để hoàn thành bài lab.

---

### **Ghi chú:**

Thay vì sử dụng tính năng **Attack** có sẵn trong extension **JWT Editor**, bạn cũng có thể tự nhúng **JWK** bằng cách thêm thủ công tham số **jwk** vào phần **header** của JWT. Trong trường hợp này, bạn cũng cần cập nhật trường **kid** trong header sao cho nó khớp với **kid** của khóa đã nhúng.

## Phần 2 - Lý thuyết **JWT header parameter injections**

## Tổng quan
