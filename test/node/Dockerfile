FROM node

WORKDIR /usr/src/app

COPY ../src .

RUN npm install

CMD npm run waitdb && npm start