---
layout: post
title: "🍪 DOM-based cookie manipulation (1)"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - dom-based-vulnerabilities
source_collection: notion_portswigger
---
# **1. Giới thiệu**

### ✨ Mục tiêu bài học:

- Hiểu khái niệm về lỗ hổng DOM-based cookie manipulation.
- Biết cách khai thác và các hậu quả tiềm ẩn.
- Xác định các sink nguy hiểm.
- Thực hành phòng chống trong code JavaScript.

---

## 🍪 **2. Khái niệm DOM-based Cookie Manipulation**

### 📖 Định nghĩa:

DOM-based cookie manipulation là một kiểu lỗ hổng **client-side**, xảy ra khi **JavaScript ghi dữ liệu do người dùng kiểm soát (untrusted input)** vào **cookie (`document.cookie`)** mà không kiểm tra hoặc lọc dữ liệu đúng cách.

### 📌 Ví dụ thực tế:

```
document.cookie = 'theme=' + location.hash.slice(1);
```

Nếu người dùng truy cập:

```
https://example.com/#darkmode
```

→ Trình duyệt sẽ lưu cookie:

**Kẻ tấn công** có thể thay đổi URL thành:

```
https://example.com/#admin
```

→ Cookie bị ghi thành `theme=admin`.

---

## 💥 **3. Tác hại của Cookie Manipulation**

### ⚠️ 3.1. Thay đổi hành vi ứng dụng:

Nếu cookie được sử dụng để bật/tắt các chế độ như `"mode=demo"` hoặc `"user=admin"` thì attacker có thể thay đổi chức năng ứng dụng theo ý muốn.

---

### 🕵️‍♂️ 3.2. Tấn công **Session Fixation**:

**Session Fixation** xảy ra khi attacker đặt trước cookie chứa một session ID hợp lệ mà hắn biết, rồi dụ nạn nhân truy cập.

### Ví dụ:

```
document.cookie = 'session=' + location.hash.slice(1);
```

Kẻ tấn công gửi:

```
https://victim.com/#abc123
```

→ Cookie của nạn nhân: `session=abc123`

→ Nếu `abc123` là token do attacker sở hữu, hắn có thể **đăng nhập vào phiên của nạn nhân**.

---

### 🌐 3.3. Ảnh hưởng đến **các subdomain khác**:

Nếu các trang web cùng cấp (`a.example.com`, `b.example.com`) dùng chung cookie (với domain `.example.com`), thì:

- Một cookie độc từ `a.example.com` có thể ảnh hưởng đến hành vi của `b.example.com`.

---

## 🔎 **4. Sink nguy hiểm**

| Sink | Mô tả |
| --- | --- |
| `document.cookie` | Ghi cookie, nếu dữ liệu từ `location.hash`, `location.search`, `document.URL`,... → nguy cơ cao |

---

## 🔨 **5. Kỹ thuật khai thác**

### 📌 Ví dụ URL khai thác:

```
https://victim.com/#admin
```

### 📌 Payload độc:

```
document.cookie = "role=" + location.hash.slice(1);
```

→ Nếu ứng dụng dùng `cookie.role` để xác định quyền hạn → attacker có thể **gian lận vai trò**.

---

## 🛡️ **6. Phòng tránh**

| Cách phòng tránh | Mô tả |
| --- | --- |
| ❌ Không ghi trực tiếp dữ liệu người dùng vào cookie | Tránh dùng `document.cookie = ...` với dữ liệu từ URL |
| ✅ Kiểm tra whitelist | So sánh giá trị trước khi ghi: `['dark', 'light'].includes(value)` |
| ✅ Sanitize đầu vào | Xóa ký tự đặc biệt như `=`, `;`, `%0A` |
| ✅ Set cookie bằng server (khi cần bảo mật cao) | Dùng HTTP header `Set-Cookie` thay vì JavaScript |

---

## ✅ **7. Ví dụ an toàn**

```
const theme = new URLSearchParams(location.search).get('theme');
const allowed = ['light', 'dark'];

if (allowed.includes(theme)) {
  document.cookie = `theme=${theme}; path=/; SameSite=Strict`;
}
```

---

## 🧪 **8. Kiểm thử (Pentest Checklist)**

| Hành động | Mục tiêu |
| --- | --- |
| Thêm `#admin`, `?theme=admin` vào URL | Xem cookie có bị ghi giá trị không kiểm soát không |
| Kiểm tra xem cookie có dùng để xác định vai trò không | Nếu có, cố gắng thay đổi để nâng quyền |
| Quan sát xem cookie bị phản chiếu trong HTML hay JS không | Có thể kết hợp tấn công XSS |
| Thử ghi session token bằng `location.hash` | Kiểm tra khả năng session fixation |

---

## 📚 **9. Tổng kết**

| Nội dung | Trạng thái |
| --- | --- |
| Hiểu định nghĩa cookie manipulation | ✅ |
| Nhận diện sink nguy hiểm (`document.cookie`) | ✅ |
| Biết các kỹ thuật khai thác (hash injection, session fixation) | ✅ |
| Có thể viết code phòng tránh an toàn | ✅ |
| Biết cách kiểm thử lỗ hổng | ✅ |

---

## 📝 **10. Bài tập thực hành gợi ý**

1. Viết đoạn code tạo cookie từ `location.search` và kiểm tra khai thác.
2. Chỉnh sửa đoạn code để chặn các giá trị độc hại.
3. Thử tạo một attack chain gồm cookie manipulation → privilege escalation.
