---
layout: post
title: "NoSQL injection"
render_with_liquid: false
categories:
  - Web Security
  - Common Injection
tags:
  - portswigger
  - nosql-injection
source_collection: notion_portswigger
---
## 1. NoSQL Injection là gì

NoSQL Injection là một lỗ hổng trong đó kẻ tấn công có thể can thiệp vào các truy vấn mà ứng dụng thực hiện đối với cơ sở dữ liệu NoSQL. Việc tiêm NoSQL có thể cho phép kẻ tấn công:

- Bypass authentication or protection mechanisms.
- Extract or edit data.
- Cause a denial of service.
- Execute code on the server.

Không giống như SQL, NoSQL sử dụng nhiều ngôn ngữ truy vấn thay vì tiêu chuẩn chung như SQL và có ít ràng buộc quan hệ hơn.

## 2. Các kiểu NoSQL Injection

Có hai kiểu tiêm NoSQL khác nhau:

- `Syntax injection` : Điều này xảy ra khi có thể phá vỡ cú pháp truy vấn NoSQL, cho phép đưa tải trọng của riêng mình vào. Phương pháp này tương tự như phương pháp được sử dụng trong SQL Injection. Tuy nhiên, bản chất của cuộc tấn công rất khác nhau vì cơ sở dữ liệu NoSQL sử dụng nhiều ngôn ngữ truy vấn, loại cú pháp truy vấn và các cấu trúc dữ liệu khác nhau, mỗi loại sẽ có kiểu tiêm khác nhau có thể là ngôn ngữ truy vấn tùy chỉnh hoặc ngôn ngữ phổ biến như XML hoặc JSON.
- `Operator injection` : Điều này xảy ra khi có thể sử dụng toán tử truy vấn NoSQL để thao tác truy vấn.

## 3. **NoSQL syntax injection**

- **Detect NoSQL syntax injection**
    
    Để phát hiện các lỗ hổng chèn NoSQL bằng cách cố gắng phá vỡ cú pháp truy vấn. Để làm điều này kiểm tra một cách có hệ thống từng đầu vào bằng cách gửi các chuỗi fuzz và các ký tự đặc biệt của từng loại ngôn ngữ (XML hoặc JSON) gây ra lỗi cơ sở dữ liệu hoặc một số hành vi có thể phát hiện khác nếu chúng không được ứng dụng dọn dẹp hoặc lọc đầy đủ.
    
    - **Payload chung nhất để detect lỗi NoSQL syntax injection**
        
        ```python
        '"`{
        ;$Foo}
        $Foo \xYZ
        Lưu kết thúc sau \xYZ là null byte: %00 hoặc \u0000
        ```
        
        Nếu tham số cần Fuzzing nằm trên URL, cần EncodeURL:
        
        `'%22%60%7b%0d%0a%3b%24Foo%7d%0d%0a%24Foo%20%5cxYZ%00`
        
        Nếu tham số cần Fuzzing nằm trong format JSON: `'\"`{\r;$Foo}\n$Foo \\xYZ\u0000`
        Payload này nhằm kiến ứng dụng bắn ra lỗi, từ đó để biết được bối cảnh và điều chỉnh lại payload sao cho phù hợp.
        
    - **Xác định ký tự nào được xử lý**
        
        Nhằm xác định những ký tự nào được ứng dụng hiểu là cú pháp, bằng cách gửi đi từng ký tự riêng lẻ như `'` `"` `{` `}`
        
        Có thể gửi `'` , dẫn đến truy vấn MongoDB sau: `this.category == '''`
        
        Nếu điều này gây ra thay đổi so với phản hồi ban đầu, điều này có thể cho thấy ký tự `'` đã phá vỡ cú pháp truy vấn và gây ra lỗi cú pháp.
        
        Xác nhận điều này bằng cách gửi chuỗi truy vấn hợp lệ trong đầu vào bằng cách `escaping the quote`: `this.category == '\''`
        
- **Exploit NoSQL syntax injection**
    - **Kiểm tra xem có thể chèn điều kiện Boolean không**
        
        Sau khi phát hiện lỗ hổng, bước tiếp theo là xác định xem có thể tác động đến các điều kiện `boolean` bằng cú pháp NoSQL hay không.
        
        Để kiểm tra điều này, hãy gửi hai yêu cầu, một yêu cầu có điều kiện sai và một yêu cầu có điều kiện đúng.
        
        - Điều kiện sai: `' && 0 && 'x`
        - Điều kiện đúng: `' && 1 && 'x`
        
        Nếu ứng dụng hoạt động khác đi, điều này cho thấy rằng điều kiện sai ảnh hưởng đến logic truy vấn, nhưng điều kiện đúng thì không. Nghĩa là việc đưa kiểu cú pháp này vào sẽ tác động đến truy vấn phía máy chủ.
        
    - **Ghi đè lên các điều kiện hiện có**
        
        Bây giờ đã xác định rằng có thể tác động đến các điều kiện boolean, cố gắng ghi đè các điều kiện hiện có để khai thác lỗ hổng.
        
        Có thể đưa vào một điều kiện JavaScript luôn đánh giá là đúng `'||1||'`:
        
        ```python
        https://insecure-website.com/product/lookup?category=fizzy%27%7c%7c%31%7c%7c%27
        ```
        
        Điều này dẫn đến truy vấn MongoDB sau:
        
        `this.category == 'fizzy'||'1'=='1'`
        
        Vì điều kiện được chèn luôn đúng nên truy vấn đã sửa đổi sẽ trả về tất cả các mục. Điều này cho phép xem tất cả các sản phẩm trong bất kỳ danh mục nào, bao gồm cả danh mục ẩn hoặc không xác định.
        
    - **Exploiting syntax injection to extract data**
        
        Trong nhiều cơ sở dữ liệu NoSQL, một số toán tử truy vấn hoặc hàm có thể chạy mã JavaScript, chẳng hạn như toán tử `$where` và hàm `mapReduce()` của MongoDB.
        
        Điều này có nghĩa là nếu một ứng dụng dễ bị tấn công sử dụng các toán tử hoặc hàm này thì cơ sở dữ liệu có thể thực thi JavaScript như một phần của truy vấn
        
        Hãy xem xét một ứng dụng dễ bị tấn công cho phép người dùng tra cứu tên người dùng đã đăng ký khác và hiển thị vai trò của họ. Điều này kích hoạt một yêu cầu tới URL:
        
        [`https://insecure-website.com/user/lookup?username=](https://insecure-website.com/user/lookup?username=admin)admin` 
        
        Query: 
        
        ```json
        db.users.find({ "$where": "this.username == 'admin'" });
        ```
        
        Vì truy vấn sử dụng toán tử `$where`, nên có thể thử đưa các hàm JavaScript vào truy vấn này để nó trả về dữ liệu nhạy cảm.
        
        Điều này trả về ký tự đầu tiên của chuỗi mật khẩu của người dùng, cho phép bạn trích xuất ký tự mật khẩu theo từng ký tự.
        
        ```jsx
        // admin' && this.password[0] == 'a' || 'a'=='b
        db.users.find({
         "$where": "this.username == 'admin' && this.password[0] == 'a' || 'a'=='b'" 
        });
        ```
        
        Có thể sử dụng hàm JavaScript `match()` để trích xuất thông tin. Ví dụ: tải trọng sau cho phép bạn xác định xem mật khẩu có chứa các chữ số hay không:
        
        ```jsx
        // admin' && this.password.match(/\d/) || 'a'=='b
        db.users.find({
         "$where": "this.username == 'admin' && this.password.match(/\d/) || 'a'=='b'" 
        });
        ```
        

## 4. **NoSQL operator injection**

Xảy ra khi sử dụng các toán tử truy vấn để chỉ định các điều kiện mà dữ liệu phải đáp ứng để được đưa vào kết quả truy vấn

- **Toán tử truy vấn MongoDB bao gồm:**
    - `$where` So khớp các tài liệu thỏa mãn biểu thức JavaScript.
    - `$ne` Khớp tất cả các giá trị không bằng với một giá trị được chỉ định.
    - `$in` Khớp tất cả các giá trị được chỉ định trong một mảng.
    - `$regex` Chọn tài liệu có giá trị khớp với biểu thức chính quy được chỉ định.
- **Detecting operator injection in MongoDB**
    
    Kiểm tra từng đầu vào với một loạt toán tử:
    
    ```json
    {
    	"username":"wiener",
    	"password":"peter"
    }
    ```
    
    Để kiểm tra xem thông tin nhập vào `username` có xử lý toán tử truy vấn hay không, bạn có thể thử thao tác chèn sau: 
    
    ```json
    {
    	"username":{
    		"$ne":"invalid"
    	},
    	"password":{
    		"peter"
    		}
    }
    ```
    
    Nếu toán tử `$ne` được áp dụng, điều này sẽ truy vấn tất cả người dùng có `username` không bằng với chuỗi `invalid`.
    
- **Exploit using operator injection  in MongoDB**
    - **Nếu cả thông tin nhập  `username` và `password` đều xử lý toán tử thì có thể bỏ qua xác thực bằng cách sử dụng trọng tải sau:**
        
        ```json
        {
        	"username":{
        		"$ne":"invalid"
        	},
        	"password":{
        		"$ne":"invalid"
        	}
        }
        ```
        
        Truy vấn này trả về tất cả thông tin đăng nhập trong đó cả  `username` và `password`  đều không bằng với chuỗi `invalid` . Kết quả là đã đăng nhập vào ứng dụng với tư cách là người dùng đầu tiên trong bộ sưu tập.
        
    - **Để nhắm mục tiêu vào một tài khoản, bạn có thể tạo trọng tải bao gồm tên người dùng đã biết hoặc tên người dùng mà bạn đã đoán**
        
        ```json
        {
        	"username":{
        		"$in":["admin","administrator","superadmin"]
        	},
        	"password":{
        		"$ne":""
        	}
        }
        ```
        
    - **Exploiting NoSQL operator injection to extract data**
        - **Exploit trên tham số**
            
            Từ việc detect lỗ hổng từ các tham số ở trên, ta có thể dùng `$regex` để brute-force từng ký tự của chuỗi
            
            ```jsx
            {
            	"username":"admin",
            	"password":{
            		"$regex":"^a"
            	}
            }
            ```
            
            `Giải thích:`  Tìm bản ghi có `username=admin`  và có `password`  thỏa mãn chuỗi regex ký tự đầu tiên của `password` là chữ `a` 
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled.png)
            
            Giả sử kết quả của brute-force là chữ `e` , ta thêm lại chữ `e` và tiếp tục brute-force 
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%201.png)
            
            Lặp lại cho đến khi hết chuỗi
            
            ```jsx
            {
            	"username":"carlos",
            	"password":{
            		"$regex":"^somethingfound§a§"
            	}
            }
            ```
            
        - **Kỹ thuật tìm các field ẩn và giá trị của field ẩn đó**
            
            Ngay cả khi truy vấn ban đầu không sử dụng bất kỳ toán tử nào cho phép chạy JavaScript tùy ý, vẫn có thể tự mình tiêm một trong những toán tử này. Sau đó, có thể sử dụng các điều kiện boolean để xác định xem ứng dụng có thực thi bất kỳ JavaScript nào mà bạn đưa vào thông qua toán tử này hay không.
            
            Các bước thực hiện phương pháp này như sau:
            
            `Bước 1` Check Error message
            
            Ví dụ: True ⇒ ‘Account locked’, False ⇒ ‘Invalid’
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%202.png)
            
            `Bước 2`   **Tìm các field (key) ẩn**
            
            field ẩn này có thể là các mã token, các secret của 1 user được dùng để tạo lại mật khẩu chẳng hạn
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%203.png)
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%204.png)
            
            `giải thích` 
            
            Object.keys() - Liệt kê tất cả các key của 1 đối tượng có định dạng JSON
            
            Object.keys(this) - Tham số `this` chính là đối tượng hiện tại đang xét
            
            Object.keys(this)[0] - Lấy ra key đầu tiên của Object (Trong mongodb, mọi đối tượng truy vấn đề phải có `_id`)
            
            Tăng dần vị trí của key từ 0, ta tìm được số key so sánh với số field trong request, ta sẽ xác định được liệu có field ẩn nào không
            
            `Bước 3`  **Tìm tên của field (Key) ẩn**
            
             Giải sử key bị ẩn ngoài `_id` `username` `password` nằm ở vị trí số 4 có index=3
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%205.png)
            
            Ta sử dụng regex như phần [**Exploit trên tham số](https://www.notion.so/NoSQL-Injection-078fcfc45b154f859b3d2b103157f905?pvs=21)** để lấy được từng ký tự
            
            Giả sử tìm được key ẩn là `unlockToken`  sang Bước 4 tiến hành lấy giá trị của `unlockToken` trong database 
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%206.png)
            
            `Bước 4` Extract giá trị của field ẩn trong DB
            
            Trước hết cần tìm độ dài của data 
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%207.png)
            
            Extract
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%208.png)
            
            ![Untitled](/assets/img/portswigger/nosql-injection/Untitled%209.png)
            
            Có thể Extract bằng chuỗi regex như ở trên.
            
- **Các phương thức gửi truy vấn**
    
    Trong JSON có thể chèn các toán tử truy vấn dưới dạng các đối tượng lồng nhau:
    
    `{"username":{"$ne":"invalid"}}`
    
    Đối với đầu vào dựa trên URL, có thể chèn toán tử truy vấn thông qua tham số URL. 
    
    `username=wiener`  ⇒  `username[$ne]=invalid`
    
    Nếu cách này không hiệu quả, có thể thử cách sau:
    
    1. Chuyển đổi phương thức yêu cầu từ `GET` sang `POST`.
    2. Thay đổi tiêu đề `Content-Type` thành `application/json`
    3. Thêm JSON payload vào boby
    
    `NOTE`: Có thể sử dụng [Content Type Converter](https://portswigger.net/bappstore/db57ecbe2cb7446292a94aa6181c9278) extension trong burpsuite để tự động chuyển đổi phương thức yêu cầu
    
    - JSON To XML
    - XML to JSON
    - Body parameters to JSON
    - Body parameters to XML

## 5. Case Study

### Lab 01: Detecting NoSQL injection

#### Mô tả
Bộ lọc danh mục sản phẩm trong bài lab này hoạt động trên nền tảng cơ sở dữ liệu NoSQL MongoDB. Nó tồn tại lỗ hổng NoSQL injection.
Để hoàn thành bài lab, hãy thực hiện một cuộc tấn công NoSQL injection khiến ứng dụng hiển thị các sản phẩm chưa được phát hành

#### Solve
1. Trong trình duyệt của Burp, truy cập bài lab và nhấp vào một bộ lọc danh mục sản phẩm.
2. Trong Burp, đi tới **Proxy &gt; HTTP history**. Nhấp chuột phải vào yêu cầu lọc danh mục (category filter request) và chọn **Send to Repeater**.
    
    ![image.png](/assets/img/portswigger/lab-01-detecting-nosql-injection/image.png)
    
3. Trong **Repeater**, gửi một ký tự `'`vào tham số category. Chú ý rằng việc này gây ra lỗi cú pháp JavaScript. Điều này có thể cho thấy đầu vào của người dùng không được lọc hoặc làm sạch (sanitized) đúng cách.
    
    ![image.png](/assets/img/portswigger/lab-01-detecting-nosql-injection/image%201.png)
    
4. Gửi một payload JavaScript hợp lệ vào giá trị của tham số truy vấn category. Bạn có thể sử dụng payload sau:
    
    ```jsx
    Gifts'+'
    ```
    
    ![image.png](/assets/img/portswigger/lab-01-detecting-nosql-injection/image%202.png)
    
    Đảm bảo mã hóa URL (URL-encode) payload bằng cách bôi đen nó và sử dụng phím tắt Ctrl-U. Chú ý rằng nó không gây ra lỗi cú pháp. Điều này chỉ ra rằng một dạng injection phía máy chủ có thể đang diễn ra.
    
5. Xác định xem bạn có thể tiêm (inject) các điều kiện boolean để thay đổi phản hồi hay không:
    - Chèn một điều kiện **sai** (false) vào tham số category. Ví dụ:
        
        ```jsx
        Gifts' && 0 && 'x
        ```
        
        Đảm bảo URL-encode payload. 
        
        Kết quả: không có sản phẩm nào được truy xuất.
        
        ![image.png](/assets/img/portswigger/lab-01-detecting-nosql-injection/image%203.png)
        
    - Chèn một điều kiện **đúng** (true) vào tham số category. Ví dụ:
        
        ```jsx
        Gifts' && 1 && 'x
        ```
        
        Đảm bảo URL-encode payload.
        
        Kết quả: các sản phẩm trong danh mục Gifts được truy xuất.
        
        ![image.png](/assets/img/portswigger/lab-01-detecting-nosql-injection/image%204.png)
        
6. Gửi một điều kiện boolean luôn trả về giá trị đúng (true) trong tham số category. Ví dụ:
    
    ```jsx
    Gifts'||1||'
    ```
    
    ![image.png](/assets/img/portswigger/lab-01-detecting-nosql-injection/image%205.png)
    
7. Nhấp chuột phải vào phản hồi (response) và chọn **Show response in browser** (Hiển thị phản hồi trong trình duyệt).
8. Sao chép URL và tải nó trong trình duyệt của Burp. Xác minh rằng phản hồi hiện đã chứa các sản phẩm chưa phát hành. Bài lab đã được giải quyết.

### Lab 02: Exploiting NoSQL operator injection to bypass authentication

#### Mô tả
Chức năng đăng nhập của bài lab này hoạt động trên nền tảng cơ sở dữ liệu NoSQL MongoDB. Nó tồn tại lỗ hổng NoSQL injection thông qua việc sử dụng các toán tử (operators) của MongoDB.
Để hoàn thành bài lab, hãy đăng nhập vào ứng dụng với tư cách là người dùng quản trị (administrator).
Bạn có thể đăng nhập vào tài khoản của riêng mình bằng thông tin đăng nhập sau: wiener:peter.

#### Solve
1. Trong trình duyệt của Burp, đăng nhập vào ứng dụng bằng thông tin wiener:peter.
2. Trong Burp, đi tới **Proxy &gt; HTTP history**. Nhấp chuột phải vào yêu cầu POST /login và chọn **Send to Repeater**.
3. Trong **Repeater**, kiểm tra các tham số username và password để xác định xem chúng có cho phép bạn tiêm (inject) các toán tử MongoDB hay không:
    - Thay đổi giá trị của tham số username từ "wiener" thành
        
        ```jsx
        {"$ne":""}
        ```
        
        (nghĩa là "không bằng rỗng"), sau đó gửi yêu cầu. Chú ý rằng thao tác này cho phép bạn đăng nhập.
        
        ![image.png](/assets/img/portswigger/lab-02-exploiting-nosql-operator-injection-to-bypass-authentication/image.png)
        
    - Thay đổi giá trị của tham số username từ `{"$ne":""}` thành `{"$regex":"wien.*"}`, sau đó gửi yêu cầu. Chú ý rằng bạn cũng có thể đăng nhập khi sử dụng toán tử $regex.
        
        ![image.png](/assets/img/portswigger/lab-02-exploiting-nosql-operator-injection-to-bypass-authentication/image%201.png)
        
    - Khi tham số `username`được đặt là `{"$ne":""}`, hãy thay đổi giá trị của tham số `password` từ "peter" thành `{"$ne":""}`, sau đó gửi lại yêu cầu. Chú ý rằng điều này khiến truy vấn trả về một số lượng bản ghi không mong muốn (thường là lỗi hoặc chuyển hướng lạ). Điều này chỉ ra rằng có nhiều hơn một người dùng đã được chọn (vì điều kiện đúng với tất cả mọi người).
        
        ![image.png](/assets/img/portswigger/lab-02-exploiting-nosql-operator-injection-to-bypass-authentication/image%202.png)
        
    - Khi tham số `password` được giữ nguyên là `{"$ne":""}`, hãy thay đổi giá trị của tham số `username` thành `{"$regex":"admin.*"}`, sau đó gửi lại yêu cầu. Chú ý rằng điều này giúp bạn đăng nhập thành công với tư cách là người dùng admin.
        
        ![image.png](/assets/img/portswigger/lab-02-exploiting-nosql-operator-injection-to-bypass-authentication/image%203.png)
        
4. Đăng nhập bằng admin và xóa Carlos

### Lab 03: Exploiting NoSQL injection to extract data

#### Mô tả
Chức năng tra cứu người dùng (user lookup) của bài lab này hoạt động trên nền tảng cơ sở dữ liệu NoSQL MongoDB. Nó tồn tại lỗ hổng NoSQL injection.

Để hoàn thành bài lab, hãy trích xuất mật khẩu của người dùng quản trị (administrator), sau đó đăng nhập vào tài khoản của họ.

Bạn có thể đăng nhập vào tài khoản của chính mình bằng thông tin sau: wiener:peter.

**Mẹo**

Mật khẩu chỉ sử dụng các chữ cái thường.

#### Solve
1. Trong trình duyệt của Burp, truy cập bài lab và đăng nhập vào ứng dụng bằng thông tin wiener:peter.
2. Trong Burp, đi tới **Proxy &gt; HTTP history**. Nhấp chuột phải vào yêu cầu GET /user/lookup?user=wiener và chọn **Send to Repeater**.
    
    ![image.png](/assets/img/portswigger/lab-03-exploiting-nosql-injection-to-extract-data/image.png)
    
3. Trong **Repeater**, gửi ký tự ' vào tham số user. Chú ý rằng việc này gây ra lỗi. Điều này có thể cho thấy đầu vào của người dùng không được lọc hoặc làm sạch (sanitized) đúng cách.
    
    ![image.png](/assets/img/portswigger/lab-03-exploiting-nosql-injection-to-extract-data/image%201.png)
    
4. Gửi một payload JavaScript hợp lệ vào tham số user. Ví dụ, bạn có thể sử dụng:
    
    ```jsx
    wiener'+'
    ```
    
    ![image.png](/assets/img/portswigger/lab-03-exploiting-nosql-injection-to-extract-data/image%202.png)
    
    Đảm bảo mã hóa URL (URL-encode) payload bằng cách bôi đen nó và sử dụng phím tắt Ctrl-U. Chú ý rằng nó truy xuất chi tiết tài khoản cho người dùng wiener, điều này chỉ ra rằng một dạng tiêm mã phía máy chủ (server-side injection) có thể đang diễn ra.
    
5. Xác định xem bạn có thể tiêm các điều kiện boolean để thay đổi phản hồi hay không:
    - Gửi một điều kiện **sai** (false) trong tham số user. Ví dụ:
        
        ```jsx
        wiener' && '1'=='2
        ```
        
        Đảm bảo URL-encode payload. Kết quả: trả về thông báo Could not find user (Không tìm thấy người dùng).
        
        ![image.png](/assets/img/portswigger/lab-03-exploiting-nosql-injection-to-extract-data/image%203.png)
        
    - Gửi một điều kiện **đúng** (true) trong tham số user. Ví dụ:
        
        ```jsx
        wiener' && '1'=='1
        ```
        
        Đảm bảo URL-encode payload. Chú ý rằng nó không còn gây ra lỗi nữa. Thay vào đó, nó truy xuất chi tiết tài khoản cho người dùng wiener. Điều này chứng minh rằng bạn có thể kích hoạt các phản hồi khác nhau cho các điều kiện đúng và sai.
        
        ![image.png](/assets/img/portswigger/lab-03-exploiting-nosql-injection-to-extract-data/image%204.png)
        
6. Xác định độ dài mật khẩu:
    - Thay đổi tham số user thành:
        
        ```jsx
        administrator' && this.password.length < 30 || 'a'=='b
        ```
        
        Sau đó gửi yêu cầu.
        
        ![image.png](/assets/img/portswigger/lab-03-exploiting-nosql-injection-to-extract-data/image%205.png)
        
        Đảm bảo URL-encode payload. Chú ý rằng phản hồi truy xuất chi tiết tài khoản cho người dùng administrator. Điều này chỉ ra rằng điều kiện là đúng (true) vì mật khẩu ngắn hơn 30 ký tự.
        
    - Giảm độ dài mật khẩu trong payload, sau đó gửi lại yêu cầu.
    - Tiếp tục thử các độ dài khác nhau.
    - Chú ý rằng khi bạn gửi giá trị 9, bạn lấy được chi tiết tài khoản của administrator, nhưng khi gửi giá trị 8, bạn nhận được thông báo lỗi vì điều kiện sai. Điều này chỉ ra rằng mật khẩu dài **8 ký tự**.
7. Nhấp chuột phải vào yêu cầu và chọn **Send to Intruder**.
8. Trong **Intruder**, thực hiện vét cạn (enumerate) mật khẩu:
    - Thay đổi tham số user thành:
        
        ```jsx
        administrator' && this.password[§0§]=='§a§
        ```
        
        ![image.png](/assets/img/portswigger/lab-03-exploiting-nosql-injection-to-extract-data/image%206.png)
        
        Payload này bao gồm hai vị trí payload (payload positions). Hãy chắc chắn rằng payload đã được URL-encode (các ký tự đặc biệt).
        
    - Chọn **Cluster bomb** từ menu thả xuống "Attack type".
    - Trong bảng **Payloads** ở bên cạnh, chọn **position 1** từ danh sách thả xuống "Payload position". Thêm các số từ 0 đến 7 (tương ứng với từng ký tự của mật khẩu).
    - Chọn **position 2** từ danh sách thả xuống "Payload position", sau đó thêm các chữ cái thường từ a đến z. Nếu bạn đang sử dụng Burp Suite Professional, bạn có thể dùng danh sách a-z có sẵn.
    - Nhấp **Start attack**.
    - Sắp xếp kết quả tấn công theo **Payload 1**, sau đó theo **Length** (Độ dài phản hồi). Chú ý rằng sẽ có một yêu cầu cho mỗi vị trí ký tự (0 đến 7) được đánh giá là đúng (true) và truy xuất được chi tiết của administrator. Ghi lại các chữ cái từ cột **Payload 2** ghép lại với nhau.
9. Trong trình duyệt của Burp, đăng nhập với tư cách người dùng administrator bằng mật khẩu vừa tìm được. Bài lab đã được giải quyết.

### Lab 04: Exploiting NoSQL operator injection to extract unknown fields

#### Mô tả
Chức năng tra cứu người dùng trong bài lab này hoạt động trên nền tảng cơ sở dữ liệu NoSQL MongoDB. Nó tồn tại lỗ hổng NoSQL injection.

Để hoàn thành bài lab, hãy đăng nhập với tư cách là carlos.

**Mẹo**

Để giải bài lab này, trước tiên bạn cần trích xuất (exfiltrate) giá trị của token đặt lại mật khẩu (password reset token) của người dùng carlos.

#### Solve
1. Trong trình duyệt của Burp, thử đăng nhập vào ứng dụng với tên người dùng carlos và mật khẩu invalid. Chú ý rằng bạn nhận được thông báo lỗi Invalid username or password (Tên người dùng hoặc mật khẩu không hợp lệ).
2. Trong Burp, đi tới **Proxy &gt; HTTP history**. Nhấp chuột phải vào yêu cầu POST /login và chọn **Send to Repeater**.
3. Trong **Repeater**, thay đổi giá trị của tham số `password` từ "invalid" thành `{"$ne":"invalid"}`, sau đó gửi yêu cầu. 
    
    ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image.png)
    
    **Thay đổi sang user carlos**
    
    ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%201.png)
    
    Chú ý rằng bây giờ bạn nhận được thông báo lỗi Account locked (Tài khoản bị khóa). Bạn không thể truy cập tài khoản của Carlos.
    
    Phản hồi này chỉ ra rằng toán tử `$ne` (not equal - không bằng) đã được chấp nhận và ứng dụng có lỗ hổng.
    
4. Trong trình duyệt của Burp, thử đặt lại mật khẩu cho tài khoản carlos. Khi bạn gửi tên người dùng carlos, hãy quan sát rằng cơ chế đặt lại yêu cầu xác minh email, vì vậy bạn không thể tự mình đặt lại tài khoản.
5. Trong **Repeater**, sử dụng yêu cầu POST /login để kiểm tra xem ứng dụng có dễ bị tấn công JavaScript injection hay không:
    - Thêm "$where": "0" làm một tham số bổ sung trong dữ liệu JSON như sau:
        
        ```jsx
        {"username":"carlos","password":{"$ne":"invalid"}, "$where": "0"}
        ```
        
    - Gửi yêu cầu. Chú ý rằng bạn nhận được thông báo lỗi Invalid username or password.
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%202.png)
        
    - Thay đổi `"$where": "0"` thành `"$where": "1"`, sau đó gửi lại yêu cầu. Chú ý rằng bạn nhận được thông báo lỗi Account locked. Điều này chỉ ra rằng mã JavaScript trong mệnh đề $where đang được thực thi.
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%203.png)
        
6. Nhấp chuột phải vào yêu cầu và chọn **Send to Intruder**.
7. Trong **Intruder**, xây dựng một cuộc tấn công để xác định tất cả các trường (fields) trên đối tượng người dùng (user object):
    - Cập nhật tham số $where như sau:
        
        ```jsx
        "$where":"Object.keys(this)[1].match('^.{}.*')"
        ```
        
    - Thêm hai vị trí payload (payload positions). Vị trí đầu tiên xác định số thứ tự ký tự, và vị trí thứ hai xác định chính ký tự đó:
        
        ```jsx
        "$where":"Object.keys(this)[1].match('^.{§§}§§.*')"
        ```
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%204.png)
        
    - Chọn **Cluster bomb** từ menu thả xuống "Attack type".
    - Trong bảng **Payloads** bên cạnh, chọn **position 1** từ danh sách "Payload position", sau đó đặt "Payload type" là **Numbers**. Đặt phạm vi số, ví dụ từ 0 đến 20.
    - Chọn **position 2** từ danh sách "Payload position" và đảm bảo "Payload type" được đặt là **Simple list**. Thêm tất cả các số, chữ cái thường và chữ cái hoa làm payload. Nếu bạn dùng Burp Suite Professional, bạn có thể dùng các danh sách có sẵn a-z, A-Z, và 0-9. (abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ)
    - Nhấp **Start attack**.
    - Sắp xếp kết quả tấn công theo **Payload 1**, sau đó theo **Length** (Độ dài), để xác định các phản hồi có thông báo Account locked thay vì Invalid username or password.
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%205.png)
        
        Kết quả: các ký tự trong cột **Payload 2** ghép lại thành tên của tham số: `username`.
        
    - Lặp lại các bước trên để xác định các tham số JSON khác. Bạn có thể làm điều này bằng cách tăng chỉ số (index) của mảng keys sau mỗi lần thử, ví dụ:
        
        ```jsx
        "$where":"Object.keys(this)[2].match('^.{}.*')"
        "$where":"Object.keys(this)[2].match(/^a/)"
        ```
        
    - *Chú ý rằng một trong các tham số JSON tìm được là dành cho token đặt lại mật khẩu tại index=4.*
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%206.png)
        
        Sắp xếp lại ta được field: `resetToken`
        
8. Kiểm tra tên trường đặt lại mật khẩu vừa tìm được dưới dạng tham số truy vấn trên các endpoint khác nhau:
    - Trong **Proxy &gt; HTTP history**, xác định yêu cầu GET /forgot-password là một endpoint tiềm năng, vì nó liên quan đến chức năng đặt lại mật khẩu. Nhấp chuột phải vào yêu cầu và chọn **Send to Repeater**.
    - Trong **Repeater**, gửi một trường không hợp lệ trong URL: GET /forgot-password?foo=invalid. Chú ý rằng phản hồi giống hệt với phản hồi gốc.
    - Gửi tên trường token đặt lại mật khẩu (mà bạn đã trích xuất được) vào URL: GET /forgot-password?`resetToken`=invalid. Chú ý rằng bạn nhận được thông báo lỗi Invalid token. Điều này xác nhận rằng bạn đã có tên token và endpoint chính xác.
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%207.png)
        
9. Trong **Intruder**, sử dụng yêu cầu POST /login để xây dựng một cuộc tấn công nhằm trích xuất giá trị token đặt lại mật khẩu của Carlos:
    - Giữ nguyên các cài đặt từ cuộc tấn công trước của bạn, nhưng cập nhật tham số $where như sau:
        
        ```jsx
        "$where":"this.resetToken.match('^.{§§}§§.*')"
        ```
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%208.png)
        
    - *Đảm bảo thay thế TENTOKENCUABAN bằng tên trường token thực tế mà bạn đã tìm thấy ở bước trước.*
    - Nhấp **Start attack**.
    - Sắp xếp kết quả theo **Payload 1**, sau đó theo **Length**, để xác định các phản hồi Account locked. Ghi lại các ký tự từ cột **Payload 2** ghép lại với nhau để có chuỗi token.
        
        ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%209.png)
        
        `acbfafc43512414f`
        
10. Trong **Repeater**, gửi giá trị của token đặt lại mật khẩu vào URL của yêu cầu GET /forgot-password:
    
    ```jsx
    GET /forgot-password?resetToken=acbfafc43512414f
    ```
    
    ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%2010.png)
    
11. Đăng nhập vào tài khoản của carlos để solve lab
    
    ![image.png](/assets/img/portswigger/lab-04-exploiting-nosql-operator-injection-to-extract-unknown-fields/image%2011.png)

## Ngăn chặn việc tiêm NoSQL

- Dọn dẹp và xác thực thông tin đầu vào của người dùng bằng cách sử dụng while list gồm các ký tự được chấp nhận.
- Chèn thông tin đầu vào của người dùng bằng cách sử dụng các truy vấn được tham số hóa thay vì nối chuỗi trực tiếp thông tin đầu vào của người dùng vào truy vấn.
- Để ngăn chặn việc chèn toán tử, hãy áp dụng danh sách cho phép các khóa được chấp nhận.

## Tổng Kết

Detect **syntax injection:** 

- Thử chèn các ký tự `' " \ ; { }`  có thể nó sẽ gây ra lỗi cơ sở dữ liệu.
- Tùy thuộc vào bối cảnh: `&& '1'=='2` `|| '1'=='1` `'||1||’`
- `'` ⇒ Lỗi; `\'` ⇒ không lỗi

Detect **operator injection:** 

- `$where` So khớp các tài liệu thỏa mãn biểu thức JavaScript.
- `$ne` Khớp tất cả các giá trị không bằng với một giá trị được chỉ định.
- `$in` Khớp tất cả các giá trị được chỉ định trong một mảng.
- `$regex` Chọn tài liệu có giá trị khớp với biểu thức chính quy được chỉ định.
- Thử chèn các toán tử `$where` `$ne` `$in` `$regex` vào các parameter:
    
    ```jsx
    Content-Type: application/json
    {
    	"username":{
    		"$ne":"invalid"
    	},
    	"password":{
    		"peter"
    		}
    }
    Hoặc
    Content-Type: application/x-www-form-urlencoded
    username[$ne]=invalid&&password=peter
    ```
    
- Thử chèn thêm các toán tử `$where` `$ne` `$in` `$regex` như 1 key mới của Object:
    
    ```jsx
    {
    	"username":"carlos",
    	"password":{
    		"$ne":""
    	},
    	"$where":"0"
    }
    // "$where":"0" => lỗi || "$where":"1" => Không lỗi
    ```
    

Sử dụng `Object.keys(this)` để extract các field của đối tượng `this` có trong database

Sử dụng `Object.keys(this)[index]` để extract 1 field của đối tượng `this` có trong database

Sử dụng `this.fieldName`  đế extract giá trị của 1 field tìm được
