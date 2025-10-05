# Terminal

## Reload database

docker-compose down -v
docker-compose up --build

## Access database

docker exec -it markindex_postgres psql -U postgres

## Go to specific database

docker exec -it markindex_postgres psql -U postgres -d markindex

## List all tables

\dt

## List all users

\du

## Show table structure

\d users

## Show all functions and procedures

\df

## Run queries

### Select all users

SELECT \* FROM users;

# pgAdmin
