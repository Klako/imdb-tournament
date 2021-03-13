FROM node

WORKDIR /usr/src/app

COPY src .

RUN npm install -g nodemon

RUN npm install

CMD npm run waitdb && nodemon bin/www --legacy-watch