# Script para eliminar la función duplicada processConfirmation
$filePath = "d:\rorProjects\invitaciones\clientes\quinces\basic\quince-basic-new-demo\components\sections\AttendanceConfirmation.tsx"

# Leer todas las líneas del archivo
$lines = Get-Content $filePath

# Encontrar las líneas de inicio y fin de la función duplicada (la segunda)
$startLine = -1
$endLine = -1
$functionCount = 0

for ($i = 0; $i -lt $lines.Length; $i++) {
    if ($lines[$i] -match "^\s*const processConfirmation = async \(\) => \{") {
        $functionCount++
        if ($functionCount -eq 2) {
            $startLine = $i
            Write-Host "Función duplicada encontrada en línea: $($i + 1)"
        }
    }
    
    # Si encontramos la segunda función, buscar su cierre
    if ($startLine -ne -1 -and $lines[$i] -match "^\s*\};\s*$" -and $i -gt $startLine) {
        $endLine = $i
        Write-Host "Final de función duplicada en línea: $($i + 1)"
        break
    }
}

if ($startLine -ne -1 -and $endLine -ne -1) {
    Write-Host "Eliminando líneas desde $($startLine + 1) hasta $($endLine + 1)"
    
    # Crear array sin las líneas problemáticas
    $newLines = @()
    for ($i = 0; $i -lt $lines.Length; $i++) {
        if ($i -lt $startLine -or $i -gt $endLine) {
            $newLines += $lines[$i]
        }
    }
    
    # Escribir el archivo corregido
    $newLines | Set-Content $filePath
    Write-Host "Archivo corregido exitosamente"
} else {
    Write-Host "No se pudo encontrar la función duplicada"
}