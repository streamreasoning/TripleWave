FROM node:6.9.1

#RUN git clone -b rsplab https://github.com/streamreasoning/TripleWave.git triplewave

COPY src/ /opt/tw

WORKDIR /opt/tw 

RUN  ls &&npm install
