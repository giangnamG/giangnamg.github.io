---
layout: post
title: "Open Redirection (1)"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - dom-based-vulnerabilities
source_collection: notion_portswigger
---
### 🔐 Giải thích: DOM-based Open Redirection

---

### 📌 **1. DOM-based Open Redirection là gì?**

Đây là một lỗ hổng bảo mật **Client-side**, xảy ra khi **JavaScript trong trình duyệt** sử dụng **dữ liệu do người dùng kiểm soát (user input)** để **chuyển hướng (redirect)** tới một URL khác **mà không có kiểm tra đầy đủ**.

### Ví dụ:

```
let url = /https?:\/\/.+/.exec(location.hash);
if (url) {
  location = url[0];
}
```

Nếu người dùng truy cập:

```
https://example.com/#https://attacker.com

```

Thì đoạn code trên sẽ **chuyển hướng ngay** đến `https://attacker.com` → đây là **open redirect**.

---

### 🧨 **2. Tác hại của DOM-based Open Redirection**

- **Phishing (lừa đảo)**: Kẻ tấn công tạo liên kết trông như từ trang hợp pháp, ví dụ:
    
    ```
    https://trusted-site.com/#https://evil.com
    ```
    
    Người dùng nghĩ rằng link đến trang hợp pháp, nhưng thực tế bị chuyển hướng sang trang giả mạo.
    
- **Chèn mã độc (JavaScript injection)**: Nếu attacker có thể chèn `javascript:` URI, như:
    
    ```
    https://victim.com/#javascript:alert(1)
    ```
    
    Trình duyệt có thể thực thi mã JS độc hại → **XSS dạng DOM-based**.
    

---

### 🧪 **3. Các sink nguy hiểm (nơi dữ liệu được sử dụng)**

Dưới đây là những API/sink phổ biến dễ bị DOM-based open redirect nếu dùng sai:

| **Sink** | **Mô tả** | **Có thể gây redirect?** | **Nguy cơ** |
| --- | --- | --- | --- |
| `location` | Đối tượng toàn bộ URL, có thể gán để redirect | ✅ Có | Ghi giá trị sẽ chuyển hướng |
| `location.host` | Domain + Port (VD: `example.com:8080`) | ❌ Không trực tiếp | Có thể bị giả mạo domain |
| `location.hostname` | Chỉ domain (VD: `example.com`) | ❌ Không trực tiếp | Dễ bị đánh lừa bằng subdomain |
| `location.href` | URL đầy đủ (VD: `https://example.com/path`) | ✅ Có | Gán sẽ redirect |
| `location.pathname` | Phần path của URL (VD: `/home`) | ❌ Không trực tiếp | Dễ bị chèn nội dung lạ nếu nối sai cách |
| `location.search` | Query string (VD: `?next=/dashboard`) | ❌ Không trực tiếp | Nguồn input attacker có thể kiểm soát |
| `location.protocol` | Giao thức (`http:`, `https:`, `javascript:`...) | ✅ Có | Cho phép chuyển sang `javascript:` nếu không lọc kỹ |
| `location.assign()` | Hàm JS dùng để điều hướng đến URL khác | ✅ Có | Redirect ngay lập tức |
| `location.replace()` | Giống `assign()` nhưng không lưu trong history | ✅ Có | Redirect ngay lập tức |
| `open()` | `window.open(url)` → mở URL trong tab mới | ✅ Có | Nếu `url` do attacker điều khiển |
| `element.srcdoc` | Cho phép gán HTML vào iframe | ❌ Không redirect | Dễ bị XSS nếu không escape |
| `XMLHttpRequest.open()` | Mở kết nối đến URL → nếu `url` bị điều khiển → leak data | ❌ Không redirect | CSRF / Data leak đến domain ngoài |
| `XMLHttpRequest.send()` | Gửi request đến URL đã mở ở `open()` | ❌ Không trực tiếp | Bị lạm dụng khi `open()` có URL do attacker đặt |
| `jQuery.ajax()` / `$.ajax()` | Hàm gửi AJAX → nếu `url` do người dùng kiểm soát → nguy hiểm | ❌ Không redirect | Gửi request đến domain độc, leak cookie/token |

---

👉 **Ghi nhớ**: Các sink không trực tiếp redirect vẫn nguy hiểm nếu kết hợp với input không được kiểm soát.

---

### 🛡️ **4. Cách phòng tránh**

- **Không dùng dữ liệu từ URL (như `location.hash`, `location.search`, `location.pathname`) để redirect trực tiếp**.
- **Xác thực domain hoặc whitelist** các URL được phép redirect đến.
- **Chỉ cho phép redirect nội bộ** (internal path), ví dụ `/dashboard` thay vì `http://example.com`.

### ✅ Ví dụ an toàn:

```
const whitelist = ['/home', '/profile', '/orders'];
const target = new URLSearchParams(location.search).get('redirect');
if (whitelist.includes(target)) {
  location.href = target;
} else {
  location.href = '/home';
}
```

---

### 📚 Tài liệu nên xem thêm:

- OWASP: URL Validation Cheat Sheet
- PortSwigger Web Security Academy – DOM-based vulnerabilities
