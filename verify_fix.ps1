$baseUrl = "http://localhost:4000/api/v1"

# 1. Login to get token
Write-Host "Logging in..."
$loginBody = @{
    email = "rohit.schoolleader@pdi.com"
    password = "Rohit@123"
} | ConvertTo-Json

try {
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = ($loginResponse.Content | ConvertTo-Json | ConvertFrom-Json).token
    # Actually the response is probably { status: 'success', token: '...', data: { user: ... } }
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    Write-Host "Login successful. Token acquired."
} catch {
    Write-Host "Login failed: $_"
    exit
}

$headers = @{
    "Authorization" = "Bearer $token"
    "Content-Type"  = "application/json"
}

# 2. Test saving observation for a seeded teacher
Write-Host "Testing observation for seeded teacher (Teacher One)..."
$obsSeededBody = @{
    teacher = "Teacher One"
    teacherEmail = "teacher1.btmlayout@pdi.com"
    date = "2026-02-12"
    campus = "CMR NPS"
    score = 4.0
    domain = "Instruction"
    classroom = @{
        block = "B1"
        grade = "G5"
        section = "A"
        learningArea = "Math"
    }
} | ConvertTo-Json

try {
    $obsSeededResponse = Invoke-WebRequest -Uri "$baseUrl/observations" -Method Post -Body $obsSeededBody -Headers $headers
    Write-Host "Seeded teacher observation saved: $($obsSeededResponse.StatusCode)"
} catch {
    Write-Host "Seeded teacher observation failed: $_"
}

# 3. Test saving observation for a NEW teacher (auto-creation)
Write-Host "Testing observation for NEW teacher (Auto-creation)..."
$newTeacherEmail = "verify.auto.$(Get-Date -Format "yyyyMMddHHmmss")@pdi.com"
$obsNewBody = @{
    teacher = "Verification New Teacher"
    teacherEmail = $newTeacherEmail
    date = "2026-02-12"
    campus = "CMR NPS"
    score = 3.5
    domain = "Culture"
    classroom = @{
        block = "B2"
        grade = "G6"
        section = "B"
        learningArea = "Science"
    }
} | ConvertTo-Json

try {
    $obsNewResponse = Invoke-WebRequest -Uri "$baseUrl/observations" -Method Post -Body $obsNewBody -Headers $headers
    Write-Host "New teacher observation saved: $($obsNewResponse.StatusCode)"
    
    # 4. Verify user was created
    # We don't have a direct users endpoint exposed in observationController but we can check the observation response
    $obsNewData = $obsNewResponse.Content | ConvertFrom-Json
    Write-Host "New Observation Response Data: $($obsNewResponse.Content)"
    if ($obsNewData.data.observation.teacherId -ne "unknown") {
        Write-Host "SUCCESS: teacherId is $($obsNewData.data.observation.teacherId), auto-creation worked!"
    } else {
        Write-Host "FAILURE: teacherId is unknown"
    }
} catch {
    Write-Host "New teacher observation failed: $_"
}
