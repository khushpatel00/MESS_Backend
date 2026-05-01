module.exports = {
  apps: [{
    name: "MESS",
    script: "index.js",
    instances: "max",
    autorestart: true,
    watch: false,
    max_memory_restart: "300M"
  }]
}