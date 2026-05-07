Write-Host "🚀 Mise à jour de SMARTLAB..." -ForegroundColor Cyan

# Sauvegarde de l'ancienne version
Copy-Item "C:\smartlab\frontend\public\index.html" "C:\smartlab\backup\index_$(Get-Date -Format 'yyyyMMdd_HHmmss').html"

# Télécharger la nouvelle version (ou copier depuis source)
# Ici, remplacez par votre source de mise à jour (git, serveur, etc.)
# Exemple avec git :
# cd C:\smartlab
# git pull

# Incrémenter la version du cache
$newVersion = "v" + (Get-Date -Format "yyyyMMddHHmmss")
(Get-Content "C:\smartlab\frontend\public\sw.js") -replace 'const CACHE_NAME = .*;', "const CACHE_NAME = '$newVersion';" | Set-Content "C:\smartlab\frontend\public\sw.js"

Write-Host "✅ Mise à jour terminée ! Version : $newVersion" -ForegroundColor Green
Write-Host "📱 Les utilisateurs verront la mise à jour au prochain redémarrage de l'application" -ForegroundColor Cyan
