FROM node:alpine

WORKDIR /usr/nodeapp

COPY ./ ./

RUN npm install

CMD ["npm", "run", "app"]