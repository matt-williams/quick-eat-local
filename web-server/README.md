# web-server

```
sudo docker build -t web-server .
sudo docker run --name quick-eat-local-web-server --link quick-eat-local-db:postgres -e DB_HOSTNAME=postgres -p 80:80 -p 443:443 -d --restart=always web-server
```
