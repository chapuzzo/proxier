FROM node:12-alpine

WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:${PATH}

# ENTRYPOINT ["/bin/sh"]
CMD "nodemon"