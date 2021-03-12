#!/bin/sh
set -eu

# We do this first to ensure sudo works below when renaming the user.
# Otherwise the current container UID may not exist in the passwd database.
eval "$(fixuid -q)"

if [ "${DOCKER_USER-}" ] && [ "$DOCKER_USER" != "$USER" ]; then
  echo "$DOCKER_USER ALL=(ALL) NOPASSWD:ALL" | sudo tee -a /etc/sudoers.d/nopasswd > /dev/null
  # Unfortunately we cannot change $HOME as we cannot move any bind mounts
  # nor can we bind mount $HOME into a new home as that requires a privileged container.
  sudo usermod --login "$DOCKER_USER" coder
  sudo groupmod -n "$DOCKER_USER" coder

  USER="$DOCKER_USER"

  sudo sed -i "/coder/d" /etc/sudoers.d/nopasswd
fi

if [ -d "/fe-pipeline-app/vscode-extensions" ]; then

  for EXTENSIONS_FILE in /fe-pipeline-app/vscode-extensions/*.vsix; do
    echo todo --install-extension $EXTENSIONS_FILE
    /usr/bin/code-server --install-extension $EXTENSIONS_FILE
  done

fi

dumb-init /usr/bin/code-server "$@"
