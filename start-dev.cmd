@echo off
setlocal
set "ROOT=%~dp0"
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"
if exist "%CODEX_NODE%\node.exe" set "PATH=%CODEX_NODE%;%PATH%"
if exist "%CODEX_BIN%\pnpm.cmd" set "PATH=%CODEX_BIN%;%PATH%"
cd /d "%ROOT%"
pnpm dev
