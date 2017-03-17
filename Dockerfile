FROM node:6.9.1

RUN git clone -b rsplab https://github.com/streamreasoning/TripleWave.git triplewave

WORKDIR triplewave/

RUN npm install
RUN rm -rf config/*