FROM node:18-alpine
ENV PORT=80
EXPOSE 80
ADD package*.json /code/
WORKDIR /code
CMD ["npm", "start"]
RUN npm install -g npm && npm ci --omit=optional --omit=dev && npm cache clean --force
ADD . /code/

