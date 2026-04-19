@echo off
echo 🍊 Optimizando Media Naranja para Despliegue...
cd /d "C:\Users\LAPTOP-HP\Documents\Media Naranja"

:: Limpiar errores previos
echo 🧹 Limpiando rastros...
if exist "public\.git" rmdir /s /q "public\.git"
if exist ".git" rmdir /s /q ".git"

:: Configurar Identidad
echo 👤 Firmando como Media Naranja...
git config --global user.email "ritohp@gmail.com"
git config --global user.name "ritohp"

:: Inicializar y Subir
echo 🚀 Lanzando a la nube...
git init
git add .
git commit -m "Media Naranja: Lanzamiento Boutique Premium"
git branch -M main
git remote add origin https://github.com/ritohp/MediaNaranja.git
git push -u origin main --force

echo.
echo ✅ ¡PROCESO COMPLETADO! 🍊
echo Ahora ve a Vercel.com y conecta este repositorio.
pause
