@echo off
color 06
echo 🍊 Optimizando Media Naranja para Despliegue...
cd /d "C:\Users\LAPTOP-HP\Documents\Media Naranja"

echo 🧹 Limpiando rastros previos...
if exist "public\.git" rmdir /s /q "public\.git"

echo 👤 Configurando Identidad...
git config user.email "ritohp@gmail.com"
git config user.name "ritohp"

echo 📦 Preparando archivos...
git init
git add .
git commit -m "Fix: Ignore TS errors and cleanup imports for Vercel"

echo 🚀 Intentando subir a GitHub...
echo (Si se detiene aqui, es que falta tu acceso de GitHub)
git remote add origin https://github.com/ritohp/MediaNaranja.git 2>nul
git remote set-url origin https://github.com/ritohp/MediaNaranja.git
git branch -M main

:: Intentar Push y capturar error
git push -u origin main --force

if %errorlevel% neq 0 (
    color 0C
    echo.
    echo ❌ ERROR DETECTADO: El codigo NO se subio a GitHub.
    echo Por favor, lee los mensajes de arriba. 
    echo Si te pide "Username" o "Password", es que necesitas un Token.
) else (
    color 0A
    echo.
    echo ✅ ¡EXITO TOTAL! El codigo ya esta en la nube.
    echo Revisa Vercel en 1 minuto.
)

pause
