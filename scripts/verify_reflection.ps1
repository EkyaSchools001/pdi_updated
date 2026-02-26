$baseUrl = "http://localhost:4000/api/v1"
$loginBody = @{
    email    = "rohit.schoolleader@pdi.com"
    password = "Rohit@123"
} | ConvertTo-Json

try {
    Write-Host "Logging in as School Leader..."
    $loginResponse = Invoke-WebRequest -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $loginData = $loginResponse.Content | ConvertFrom-Json
    $token = $loginData.token
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json"
    }

    Write-Host "Fetching observations..."
    $obsResponse = Invoke-WebRequest -Uri "$baseUrl/observations" -Method Get -Headers $headers
    $obsData = $obsResponse.Content | ConvertFrom-Json
    
    if ($obsData.data.observations.Count -gt 0) {
        $firstObsId = $obsData.data.observations[0].id
        Write-Host "Testing patch for observation ID: $firstObsId"

        $patchBody = @{
            hasReflection      = $true
            teacherReflection  = "Detailed Verification Reflection"
            detailedReflection = @{ 
                strengths    = "Verified strengths"
                improvements = "Verified areas"
                goal         = "Verified goal"
                sections     = @{
                    planning = @{
                        title    = "Planning"
                        ratings  = @( @{ indicator = "Indicator 1"; rating = "Highly Effective" } )
                        evidence = "Test Evidence"
                    }
                }
            }
            status             = "Submitted"
        } | ConvertTo-Json -Depth 10

        $patchRes = Invoke-WebRequest -Uri "$baseUrl/observations/$firstObsId" -Method Patch -Body $patchBody -Headers $headers
        Write-Host "Patch Status: $($patchRes.StatusCode)"
        Write-Host "Response: $($patchRes.Content)"
    }
    else {
        Write-Host "No observations found to test."
    }
}
catch {
    Write-Host "Error: $_"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $respBody = $reader.ReadToEnd()
        Write-Host "Error Response Body: $respBody"
    }
}
