-- Connect to the markindex database
\connect markindex

-- Insert dummy users into the users table
INSERT INTO users (email, password_hash) VALUES
('john.doe@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('jane.smith@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('mike.johnson@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('sarah.wilson@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('alex.brown@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('emma.davis@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('david.miller@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('lisa.garcia@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('tom.anderson@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O'),
('maria.rodriguez@localhost.com', '$2b$10$rOzHqKtNlAOKBYZhFYmYLOX1cOqT8.ZNqVGvpYmWQoHqYmDQqT8.O');