FROM node:16 as builder
WORKDIR /app
ADD ./ui/ /app/
RUN yarn --registry=https://registry.npm.taobao.org/ && yarn run build:prod

FROM node:16 as runner

EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /app
ADD ./package.json /app/package.json
ADD ./prisma /app/prisma
RUN yarn install --registry=https://registry.npm.taobao.org/ --production false

ADD ./server /app/server
ADD  ./nest-cli.json ./tsconfig.build.json ./tsconfig.json ./tslint.json /app/

# ADD ./dist /app/dist
# ADD ./config /app/config
# ADD ./node_modules /app/node_modules
RUN yarn build

COPY ./docker/enterpoint.sh /enterpoint.sh
RUN chmod +x /enterpoint.sh
ENTRYPOINT ["/enterpoint.sh"]
COPY --from=builder /app/dist /app/fe-pipeline-home/public

CMD [ "node", "dist/main.js" ]
