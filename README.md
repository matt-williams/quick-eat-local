# Quick Eat Local
Fast, convenient foodhall service

![Quick Eat Local Icon](quick-eat-local.png)

Try it at [quick.eat.local.uk.to](https://quick.eat.local.uk.to/).

## Local development

```
# Install node and npm
sudo apt-get install nodejs-legacy npm

# Upgrade node
sudo npm cache clean -f
sudo npm install -g n
sudo n stable

# Allow node to bind to ports 80 and 443
sudo setcap cap_net_bind_service=+ep `readlink -f \`which node\``

# Install Angular2 CLI tools
npm install -g @angular/cli
```

## Deployment

```
# Install Docker (on Ubuntu 16.04)
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable"
sudo apt-get update
sudo apt-get install -y docker-ce

# Start Postgres in a container
sudo docker run --name quick-eat-local-db -e POSTGRES_PASSWORD=quick-eat-local -p 5432:5432 -d --restart=always postgres

# Inject the schema
sudo docker run -i --rm --link quick-eat-local-db:postgres -e PGPASSWORD=quick-eat-local postgres psql -h postgres -U postgres < schema.sql
```
