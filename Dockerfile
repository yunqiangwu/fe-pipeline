FROM node:15.8.0 as builder
WORKDIR /app
ADD ./ui/ /app/
RUN yarn --registry=https://registry.npm.taobao.org/ && yarn run build:prod

FROM node:15.8.0 as vscode-extensions-builder
WORKDIR /app
ADD ./extensions/fe-pipeline-extensions/ /app/
RUN yarn --registry=https://registry.npm.taobao.org/ && yarn run pkg-vsce

FROM node:15.8.0 as theia-extensions-builder
WORKDIR /app
ADD ./theia-plugin/theia-fe-pipeline-plugin/ /app/
RUN yarn --registry=https://registry.npm.taobao.org/

FROM node:15.8.0 as runner

RUN cd /tmp && wget https://dl.k8s.io/v1.21.0-alpha.3/kubernetes-client-linux-amd64.tar.gz -O kubernetes-client-linux-amd64.tar.gz && \
    tar -zxvf kubernetes-client-linux-amd64.tar.gz && \
    mv ./kubernetes/client/bin/kubectl /usr/local/bin/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    rm -rf /tmp/kubernetes*

EXPOSE 3000
ENV NODE_ENV=production
COPY ./docker/enterpoint.sh /enterpoint.sh
WORKDIR /app
ADD ./package.json /app/package.json
RUN yarn install --production false

ADD ./server /app/server
ADD  ./nest-cli.json ./tsconfig.build.json ./tsconfig.json ./tslint.json /app/

# ADD ./dist /app/dist
# ADD ./config /app/config
# ADD ./node_modules /app/node_modules
RUN yarn build

RUN chmod +x /enterpoint.sh
ENTRYPOINT ["/enterpoint.sh"]
COPY --from=builder /app/dist /app/fe-pipeline-home/public
COPY --from=vscode-extensions-builder /app/*.vsix /app/fe-pipeline-home/vscode-extensions/
COPY --from=theia-extensions-builder /app/*.theia /app/fe-pipeline-home/theia-plugin/

CMD [ "node", "dist/main.js" ]
