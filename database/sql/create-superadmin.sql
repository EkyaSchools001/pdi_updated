-- Create Super Admin account
-- Password: Bharath@123 (hashed)

INSERT INTO "User" (id, email, password, "fullName", role, "createdAt", "updatedAt")
VALUES (
    gen_random_uuid(),
    'bharath.superadmin@pdi.com',
    '$2b$10$dWw/AO/ka.8OA1GXSjQvmcsyIhi3FiKe',
    'Bharath',
    'SUPERADMIN',
    NOW(),
    NOW()
)
ON CONFLICT (email) DO NOTHING;

SELECT 'Super Admin created successfully!' as message;
SELECT * FROM "User" WHERE email = 'bharath.superadmin@pdi.com';
