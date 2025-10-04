## Reload database

docker-compose down -v
docker-compose up --build

## Access database

docker exec -it markindex_postgres psql -U postgres
