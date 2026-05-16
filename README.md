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

### !! CAUTION
You'll also need to get a .env file to start up the server
You can get the refrence at the .env.example to make your own .env and start the server on

I suggest to use `openssl base64` key as JWT_SECRET instead of clown secrets
```
openssl rand -base64 64

# or hex

openssl rand -hex 64
```
Example output: 
`mF8fL4e7uL7J5m0M2U0lWf9F0m4jXr9Q0bLxM8bVtYf`