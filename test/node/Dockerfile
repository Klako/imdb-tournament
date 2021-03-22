FROM node

WORKDIR /usr/src/app

COPY src .

RUN npm install -g nodemon

CMD npm run waitdb && nodemon --legacy-watch --inspect=0.0.0.0:9229 bin/www