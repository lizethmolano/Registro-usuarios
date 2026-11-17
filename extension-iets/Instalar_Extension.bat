@echo off
chcp 65001 > nul
title Instalar Extension Autollenador IETS
echo ==============================================================
echo    INSTALADOR DE LA EXTENSION CHROME - REPOSITORIO IETS
echo ==============================================================
echo.
echo 1. Abriendo la pagina de Extensiones en Google Chrome...
start "" "chrome.exe" "chrome://extensions"

echo 2. Abriendo la carpeta de la extension...
start "" explorer.exe "%~dp0extension_iets"

echo.
echo ==============================================================
echo               PASOS PARA ACTIVARLA (Solo 1 vez):
echo ==============================================================
echo   1. En Chrome, activa 'Modo de desarrollador' (arriba a la derecha).
echo   2. Haz clic en el boton 'Cargar descomprimida' (arriba a la izquierda).
echo   3. Selecciona la carpeta 'extension_iets' que se abrio en pantalla.
echo ==============================================================
echo.
echo ¡Y listo! Al abrir https://repositorio.iets.org.co/admin/upload
echo veras la barra de autollenado directamente en la pagina web.
echo Solo arrastras el PDF sobre la pagina y se llena de inmediato.
echo.
pause
