FROM node:15.8.0 as builder
WORKDIR /app
ADD ./ui/ /app/
RUN yarn --registry=https://registry.npm.taobao.org/ && yarn run build:prod

FROM node:15.8.0 as vscode-extensions-builder
WORKDIR /app
ADD ./extensions/fe-pipeline-extensions/ /app/
RUN yarn --registry=https://registry.npm.taobao.org/ && yarn run pkg-vsce


FROM node:15.8.0 as theia-plugins-builder
WORKDIR /app
ADD ./theia-plugin/theia-fe-pipeline-plugin/ /app/
RUN yarn --registry=https://registry.npm.taobao.org/


# FROM node:14-buster as theia-extensions-builder
# ## User account
# RUN adduser --disabled-password --gecos '' theia && \
#     adduser theia sudo && \
#     echo '%sudo ALL=(ALL) NOPASSWD:ALL' >> /etc/sudoers
    
# ARG GITHUB_TOKEN

# # # Use "latest" or "next" version for Theia packages
# # ARG version=latest

# # Optionally build a striped Theia application with no map file or .ts sources.
# # Makes image ~150MB smaller when enabled
# ARG strip=false
# ENV strip=$strip

# WORKDIR /home/theia

# ADD extensions/theia-fe-pipeline-extensions/theia-fe-pipeline-extensions ./theia-fe-pipeline-extensions
# RUN cd ./theia-fe-pipeline-extensions && yarn --ignore-engines --registry=https://registry.npm.taobao.org/
# COPY ./docker/theia-ide/package.json ./package.json

# RUN chown -R theia:theia /home/theia

# USER theia

# RUN yarn add theia-fe-pipeline-extensions@file:./theia-fe-pipeline-extensions --ignore-engines && yarn --ignore-engines --registry=https://registry.npm.taobao.org/

# RUN if [ "$strip" = "true" ]; then \
#     NODE_OPTIONS="--max_old_space_size=4096" npx theia build && \
#     npx theia download:plugins && \
#     yarn --ignore-engines --production && \
#     yarn autoclean --init && \
#     echo *.ts >> .yarnclean && \
#     echo *.ts.map >> .yarnclean && \
#     echo *.spec.* >> .yarnclean && \
#     yarn autoclean --force && \
#     yarn cache clean \
# ;else \
# NODE_OPTIONS="--max_old_space_size=4096" npx theia build && npx theia download:plugins \
# ;fi


FROM node:15.8.0 as runner

RUN cd /tmp && wget https://dl.k8s.io/v1.21.0-alpha.3/kubernetes-client-linux-amd64.tar.gz -O kubernetes-client-linux-amd64.tar.gz && \
    tar -zxvf kubernetes-client-linux-amd64.tar.gz && \
    mv ./kubernetes/client/bin/kubectl /usr/local/bin/kubectl && \
    chmod +x /usr/local/bin/kubectl && \
    rm -rf /tmp/kubernetes*

EXPOSE 3000
ENV NODE_ENV=production
WORKDIR /app
ADD ./package.json /app/package.json
RUN yarn install --production false

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
COPY --from=vscode-extensions-builder /app/*.vsix /app/fe-pipeline-home/vscode-extensions/
COPY --from=theia-plugins-builder /app/*.theia /app/fe-pipeline-home/theia-plugin/
# COPY --from=theia-extensions-builder /home/theia /app/fe-pipeline-home/theia

CMD [ "node", "dist/main.js" ]
