-- Connect to the markindex database
\connect markindex

-- Insert users into the users table
INSERT INTO users (email, password_hash) VALUES
('john.doe@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O');

-- Insert businesses into the businesses table
INSERT INTO businesses (business_name) VALUES
('Acme APS');

-- Insert user_business relations into the user_businesses table
INSERT INTO user_businesses (user_id, business_id) VALUES
(1, 1);