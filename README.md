# If you're intended to run the Server on a linux machine, 
## use this command to simplify the automations, (i tested it myself)
```
[Service]
ExecStart=/usr/bin/node /app/app.js
Restart=always
RestartSec=3
```

this operataion will ensure keeping the server alive forever, untill the machine is online
# WARNING
Do not use this specific operation as this is made to be auto started as soon as the OS boots up, so dont try to run this on a personal machine, this one is intended to be ran on Linux Servers


install PM2 'globally' yourself 👍

```
 PM2 is a Production Process Manager for Node.js applications with a built-in Load Balancer.

Start and Daemonize any application:
$ pm2 start app.js

Load Balance 4 instances of api.js:
$ pm2 start api.js -i 4

Monitor in production:
$ pm2 monitor

Make pm2 auto-boot at server restart:
$ pm2 startup

To go further checkout:
http://pm2.io/
```