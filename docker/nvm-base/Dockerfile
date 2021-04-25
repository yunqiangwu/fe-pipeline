
FROM debian:10

# ENV HTTP_PROXY=http://192.168.1.11:1080 HTTPS_PROXY=http://192.168.1.11:1080

RUN apt-get update \
 && apt-get install -y \
    curl \
    dumb-init \
    unzip \
    htop \
    locales \
    man \
    nano \
    git \
    procps \
    openssh-client \
    sudo \
    vim.tiny

#  \
  # && rm -rf /var/lib/apt/lists/*

ENV NVM_DIR /sysapp/nvm
ENV NVM_SOURCE https://gitee.com/mirrors/nvm.git
ENV NVM_NODEJS_ORG_MIRROR http://npm.taobao.org/mirrors/node

RUN mkdir -p $NVM_DIR 


RUN curl -o- https://gitee.com/mirrors/nvm/raw/v0.38.0/install.sh | bash

# ENV HTTP_PROXY= HTTPS_PROXY=

RUN . $NVM_DIR/nvm.sh && nvm install 14 && npm i -g yarn
RUN sudo chmod -R 777 $NVM_DIR

RUN adduser --gecos '' --disabled-password coder && \
  echo "coder ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers.d/nopasswd

USER coder

RUN echo '[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm' >> ~/.bashrc \
  && echo '[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion' >> ~/.bashrc


ENTRYPOINT ["/bin/bash"]
