$response = Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/auth/login' -Method Post -ContentType 'application/json' -Body (@{email='avani.admin@pdi.com'; password='Avani@123'} | ConvertTo-Json)
$token = $response.token
if (!$token) {
    Write-Host "Login Failed"
    exit 1
}
Write-Host "Login Successful. Token received."

$stats = Invoke-RestMethod -Uri 'http://localhost:4000/api/v1/stats/admin' -Method Get -Headers @{Authorization="Bearer $token"}
$stats | ConvertTo-Json -Depth 5
