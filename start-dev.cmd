@echo off
setlocal
set "ROOT=%~dp0"
set "CODEX_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
set "CODEX_BIN=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\bin"
if exist "%CODEX_NODE%\node.exe" set "PATH=%CODEX_NODE%;%PATH%"
if exist "%CODEX_BIN%\pnpm.cmd" set "PATH=%CODEX_BIN%;%PATH%"
cd /d "%ROOT%"

set "PORT="
for /L %%P in (3000,1,3010) do (
  node -e "const net=require('net');const port=Number(process.argv[1]);const server=net.createServer();server.once('error',()=>process.exit(1));server.listen(port,'::',()=>server.close(()=>process.exit(0)));" %%P
  if not errorlevel 1 (
    set "PORT=%%P"
    goto found_port
  )
)

echo Could not find a free port from 3000 to 3010.
echo Close the old dev server or localhost window and try again.
pause
exit /b 1

:found_port
echo Starting Taytlo: http://localhost:%PORT%
echo If the browser did not open automatically, copy the link above.
call "%ROOT%node_modules\.bin\next.cmd" dev -p %PORT%
if errorlevel 1 pause
