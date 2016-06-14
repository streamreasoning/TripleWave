@echo off

for /F "eol=# delims== tokens=1,*" %%a in (config\config.properties) do (

    rem proper lines have both a and b set
    rem if okay, assign property to some kind of namespace
    rem so some.property becomes test.some.property in batch-land
    rem if NOT "%%a"=="" if NOT "%%b"=="" set config.%%a=%%b

    if "%%a"=="mode"(
      set use="%%b"
    )
)

rem do something useful with your vars
if NOT use=="transform"(
   java -jar jena-fuseki-server-2.3.1.jar --update --mem \ds &
   timeout 5
)

node app.js