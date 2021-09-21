FROM node:12-alpine

WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:${PATH}
COPY waitfor.sh /usr/local/bin

ENTRYPOINT ["/usr/local/bin/waitfor.sh"]
CMD "nodemon"
