@echo off
setlocal
cd /d "%~dp0"
set "NODE_EXE=C:\Users\cba35\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if exist "%NODE_EXE%" (
  "%NODE_EXE%" match-server.js
) else (
  node match-server.js
)
pause