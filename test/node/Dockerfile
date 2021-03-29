FROM node

WORKDIR /usr/src/app

COPY src .
COPY test/node/initdb /usr/src

RUN npm install -g nodemon

CMD node /usr/src/initdb && nodemon --legacy-watch --inspect=0.0.0.0:9229 bin/www