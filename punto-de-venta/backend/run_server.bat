@echo off
title Servidor Punto de Venta
cd /d "C:\Users\Servidor\.gemini\antigravity\scratch\secundaria-renacimiento\punto-de-venta\backend"

:loop
echo Iniciando servidor de Punto de Venta...
node server.js
echo El servidor se detuvo inesperadamente. Reiniciando en 5 segundos...
ping 127.0.0.1 -n 6 >nul
goto loop
