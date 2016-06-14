@echo off

for /F "eol=# delims== tokens=1,*" %%a in (config\config.properties) do (

    rem proper lines have both a and b set
    rem if okay, assign property to some kind of namespace
    rem so some.property becomes test.some.property in batch-land
    if NOT "%%a"=="" if NOT "%%b"=="" set config.%%a=%%b
)

rem debug namespace test.
set config.

rem do something useful with your vars
if NOT config.mode=="transform"(
   java -jar jena-fuseki-server-2.3.1.jar --update --mem /ds &
   timeout 5
)

node app.js