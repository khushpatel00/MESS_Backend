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