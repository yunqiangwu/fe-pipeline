FROM node as builder
WORKDIR /app
ADD ./ui/ /app/
RUN yarn && yarn run build

FROM node as runner
EXPOSE 3000
COPY ./docker/enterpoint.sh /enterpoint.sh
RUN chmod +x /enterpoint.sh
ENTRYPOINT ["/enterpoint.sh"]
COPY --from=builder /app/dist /app/fe-pipeline-home/public
WORKDIR /app
ADD ./package.json /app/package.json
RUN yarn

ADD ./server /app/server
ADD  ./nest-cli.json ./tsconfig.build.json ./tsconfig.json ./tslint.json /app/

# ADD ./dist /app/dist
# ADD ./config /app/config
# ADD ./node_modules /app/node_modules

RUN yarn run build

CMD [ "node", "dist/main.js" ]
