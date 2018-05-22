FROM node:alpine

WORKDIR /usr/src/app
COPY . /usr/src/app

RUN npm install -s --no-progress

CMD ["npm", "start"]
