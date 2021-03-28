FROM node

WORKDIR /usr/src/app

COPY src .
COPY test/node/waitdb ./bin/

RUN npm install -g nodemon

CMD node bin/waitdb && nodemon --legacy-watch --inspect=0.0.0.0:9229 bin/www