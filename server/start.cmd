@echo off
REM JSON Server para desarrollo
REM Puerto por defecto: 3000

echo Iniciando JSON Server...
echo Puerto: 3000
echo Base de datos: db.json
echo Rutas: routes.json
echo.

json-server --watch db.json --routes routes.json

pause
