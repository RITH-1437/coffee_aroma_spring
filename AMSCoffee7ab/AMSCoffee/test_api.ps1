# Test Contact API
$body = @{
    name = "Test User"
    email = "test@example.com"
    phone = "123456789"
    subject = "General Inquiry"
    message = "This is a test message to verify the contact form API is working properly."
} | ConvertTo-Json

$headers = @{
    'Content-Type' = 'application/json'
}

try {
    $response = Invoke-RestMethod -Uri 'http://localhost:8080/api/contacts' -Method Post -Body $body -Headers $headers
    Write-Host "SUCCESS: Contact created successfully!" -ForegroundColor Green
    Write-Host "Response: $($response | ConvertTo-Json)" -ForegroundColor Cyan
} catch {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)" -ForegroundColor Yellow
}