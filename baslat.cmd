@echo off
chcp 65001 >nul
title Ses Can Yapi - yerel onizleme
cd /d "%~dp0"
echo.
echo   Ses Can Yapi yerel onizleme
echo   ---------------------------
echo   Site  : http://localhost:4181/
echo   Panel : http://localhost:4181/panel.html
echo.
echo   Kapatmak icin bu pencereyi kapatin ya da Ctrl+C.
echo.
start "" http://localhost:4181/panel.html
py -3 -m http.server 4181 2>nul || python -m http.server 4181
