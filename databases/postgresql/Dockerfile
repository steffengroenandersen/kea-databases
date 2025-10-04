FROM postgres:15-alpine

# Set environment variables
ENV POSTGRES_DB=markindex
ENV POSTGRES_USER=markindex_user
ENV POSTGRES_PASSWORD=markindex_password

# Copy initialization scripts
COPY scripts/ /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432