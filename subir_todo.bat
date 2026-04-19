@echo off
color 06
echo 🍊 FORZANDO Actualizacion Media Naranja...
cd /d "C:\Users\LAPTOP-HP\Documents\Media Naranja"

:: Forzar que Git detecte cambios
echo 🚩 Reseteando cache de archivos...
git rm -r --cached . >nul 2>&1

echo 👤 Configurando Identidad...
git config user.email "ritohp@gmail.com"
git config user.name "ritohp"

echo 📦 Preparando archivos frescos...
git add .

:: Crear un commit con marca de tiempo para que SIEMPRE sea nuevo
set commit_msg=Sync Boutique %date% %time%
git commit -m "%commit_msg%"

echo 🚀 Empujando a la nube (Forzado)...
git remote add origin https://github.com/ritohp/MediaNaranja.git 2>nul
git remote set-url origin https://github.com/ritohp/MediaNaranja.git
git branch -M main

:: El empujon final
git push -u origin main --force

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ ERROR: Sigue habiendo un problema de conexion.
) else (
    color 0A
    echo.
    echo ✅ ¡AHORA SI! Archivos enviados con exito. 🍊
    echo Vercel se actualizara en segundos.
)

pause
