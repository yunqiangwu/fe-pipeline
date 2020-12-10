FROM node as builder
WORKDIR /app
ADD ./ui/ /app/
RUN yarn && yarn run build

FROM node as runner
EXPOSE 3000
COPY --from=builder /app/dist /app/fe-pipeline-home/public
WORKDIR /app
ADD ./package.json /app/package.json
RUN yarn && yarn run build

ADD ./dist /app/dist
ADD ./config /app/config
# ADD ./node_modules /app/node_modules

CMD [ "node", "dist/main.js" ]
