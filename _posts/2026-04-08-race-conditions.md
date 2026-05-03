---
layout: post
title: "Race conditions"
render_with_liquid: false
categories:
  - Web Security
tags:
  - portswigger
  - race-conditions
source_collection: notion_portswigger
---
# I. Race Condition là gì, xảy ra khi nào?

`Race Condition` là một loại lỗ hổng phổ biến có liên quan chặt chẽ đến các lỗi logic nghiệp vụ. Chúng xảy ra khi các trang web xử lý yêu cầu đồng thời mà không có biện pháp bảo vệ thích hợp.

Điều này có thể dẫn đến nhiều luồng riêng biệt tương tác với một dữ liệu cùng một lúc dẫn đến `va chạm` gây ra hành vi ngoài ý muốn trong ứng dụng.
