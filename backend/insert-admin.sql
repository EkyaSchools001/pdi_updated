INSERT INTO "User" (id, email, password, "fullName", role, "createdAt", "updatedAt") 
VALUES (gen_random_uuid(), 'bharath.superadmin@pdi.com', '$2b$10$dWw/AO/ka.8OA1GXSjQvmcsyIhi3FiKe', 'Bharath', 'SUPERADMIN', NOW(), NOW()) 
RETURNING email, "fullName", role;
