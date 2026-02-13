-- Seed script to create test users
-- Run this with: psql -h localhost -U postgres -d school_growth_hub -f seed.sql

-- Clear existing data
TRUNCATE TABLE "Registration", "PDHour", "Goal", "ObservationDomain", "Observation", "DocumentAcknowledgement", "Document", "User" CASCADE;

-- Insert test users (passwords are hashed version of the specified passwords)
-- Password hash for 'Bharath@123', 'Indu@123', etc. using bcrypt
INSERT INTO "User" (id, email, password, "fullName", role, "createdAt", "updatedAt") VALUES
('550e8400-e29b-41d4-a716-446655440001', 'bharath.superadmin@pdi.com', '$2b$10$YourHashedPasswordHere1', 'Bharath', 'SUPERADMIN', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'indu.management@pdi.com', '$2b$10$YourHashedPasswordHere2', 'Indu', 'MANAGEMENT', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'rohit.schoolleader@pdi.com', '$2b$10$YourHashedPasswordHere3', 'Rohit', 'LEADER', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'avani.admin@pdi.com', '$2b$10$YourHashedPasswordHere4', 'Avani', 'ADMIN', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'teacher1.btmlayout@pdi.com', '$2b$10$YourHashedPasswordHere5', 'Teacher One', 'TEACHER', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'teacher2.jpnagar@pdi.com', '$2b$10$YourHashedPasswordHere6', 'Teacher Two', 'TEACHER', NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'teacher3.itpl@pdi.com', '$2b$10$YourHashedPasswordHere7', 'Teacher Three', 'TEACHER', NOW(), NOW());

SELECT 'Seed data created successfully!' as message;
