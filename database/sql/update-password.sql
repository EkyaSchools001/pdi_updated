UPDATE "User" 
SET password = '$2b$10$58UMFJg7swoaTOpbD0VRlejO6wjBsKa8VNLdyaIIQ/qrlNn2SSEj'
WHERE email = 'bharath.superadmin@pdi.com';

SELECT email, "fullName", role FROM "User" WHERE email = 'bharath.superadmin@pdi.com';
