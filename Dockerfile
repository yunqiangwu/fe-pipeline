# FROM registry.cn-hangzhou.aliyuncs.com/choerodon-tools/hugo:0.40.3 as builder
# WORKDIR /app
# RUN npm install -g grunt-cli gulp
# COPY . .
# RUN npm install --save-dev toml grunt gulp string html-entities marked gulp-uglify gulp-htmlmin gulp-clean-css gulp-concat path js-yaml
# RUN gulp && grunt index
# RUN hugo
# RUN gulp html

FROM node
EXPOSE 3000
# COPY --from=builder /app/public /usr/share/nginx/html
WORKDIR /app
ADD ./package.json /app/package.json
RUN yarn

ADD ./dist /app/dist
ADD ./config /app/config
# ADD ./node_modules /app/node_modules



CMD [ "node", "dist/main.js" ]
