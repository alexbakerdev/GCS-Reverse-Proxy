FROM node:fermium-alpine
RUN npm install -g npm

ADD package*.json /code/
WORKDIR /code
RUN npm ci --no-optional --production

ADD . /code/

ENV PORT=80
EXPOSE 80

CMD ["npm", "start"]
