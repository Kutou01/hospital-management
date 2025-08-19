@echo off
echo Starting Serena MCP Server for Hospital Management System...
echo.
echo Context: ide-assistant (optimized for development)
echo Project: hospital-management
echo Port: 24282 (dashboard)
echo.
echo Press Ctrl+C to stop the server
echo.

uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project "D:\Test\hospital-management"

pause
