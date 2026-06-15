@echo off
echo ====================================================
echo   Guardando y Sincronizando Secundaria Renacimiento
echo ====================================================
cd /d "%~dp0"

echo 1. Preparando archivos...
git add .

echo 2. Guardando version local...
git commit -m "Auto-respaldo: %date% %time%"

echo 3. Descargando posibles cambios de la otra computadora...
git pull origin main --rebase

echo 4. Subiendo a la nube...
git push origin main

echo ====================================================
echo   LISTO. Ya puedes apagar la computadora o irte.
echo ====================================================
pause
