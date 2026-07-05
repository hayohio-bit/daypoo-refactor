$content = Get-Content -Path "..\.env"
foreach ($line in $content) {
    if ($line -match "^[^#\s]+=.*") {
        $parts = $line.Split('=', 2)
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()
        [System.Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}
.\gradlew.bat bootRun --info > backend_full.log 2>&1
