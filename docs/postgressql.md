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

## Show all index

\di

## Show all views

\dv

## Show triggers for specific tables

\d <users>

## Run queries

### Select all users

SELECT \* FROM users;

# pgAdmin
