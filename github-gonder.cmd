@echo off
chcp 65001 >nul
title Ses Can Yapi - GitHub'a gonder
cd /d "%~dp0"
set "GIT_TERMINAL_PROMPT=1"
set "GCM_INTERACTIVE=auto"
set "GIT_ASKPASS="
set "GIT_EDITOR="
set "CLAUDECODE="
set "CLAUDE_CODE_ENTRYPOINT="
echo.
echo   GitHub'a gonderiliyor: github.com/heyinora-max/sescanyapi
echo   ------------------------------------------------------------
echo   Giris penceresi acilirsa: hesap heyinora-max
echo.
git push origin main
echo.
if errorlevel 1 (
  echo   GONDERILEMEDI. Yukaridaki hatayi Claude'a soyleyin.
) else (
  echo   TAMAM - gonderildi. Canli site birkac dakika icinde guncellenir:
  echo   https://heyinora-max.github.io/sescanyapi/
)
echo.
pause
