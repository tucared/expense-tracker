FROM node:20

ARG TZ
ENV TZ="$TZ"

ARG CLAUDE_CODE_VERSION=latest

# Install basic development tools and iptables/ipset
RUN apt-get update && apt-get install -y --no-install-recommends \
  less \
  git \
  procps \
  sudo \
  fzf \
  zsh \
  man-db \
  unzip \
  gnupg2 \
  gh \
  iptables \
  ipset \
  iproute2 \
  dnsutils \
  aggregate \
  jq \
  nano \
  vim \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Playwright system dependencies and Chrome
# These are required for browser automation with Playwright
RUN apt-get update && apt-get install -y --no-install-recommends \
  # Playwright dependencies for Chromium
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libatspi2.0-0 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libdrm2 \
  libgbm1 \
  libglib2.0-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libx11-6 \
  libxcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxkbcommon0 \
  libxrandr2 \
  # Additional dependencies for full browser support
  fonts-liberation \
  xdg-utils \
  wget \
  ca-certificates \
  && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Google Chrome for Playwright MCP server (amd64 only)
# On arm64, Chromium will be used instead via Playwright's bundled browser
RUN ARCH=$(dpkg --print-architecture) && \
  if [ "$ARCH" = "amd64" ]; then \
    wget -q -O - https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && apt-get clean && rm -rf /var/lib/apt/lists/*; \
  else \
    echo "Skipping Google Chrome installation on $ARCH (not available). Using Playwright bundled Chromium."; \
  fi

# Create symlink to Playwright bundled Chromium for arm64 compatibility
# This allows MCP Playwright server to find a browser at /opt/google/chrome/chrome
RUN ARCH=$(dpkg --print-architecture) && \
  if [ "$ARCH" != "amd64" ]; then \
    mkdir -p /opt/google/chrome; \
  fi

# Ensure default node user has access to /usr/local/share
RUN mkdir -p /usr/local/share/npm-global && \
  chown -R node:node /usr/local/share

ARG USERNAME=node

# Persist bash history.
RUN SNIPPET="export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  && mkdir /commandhistory \
  && touch /commandhistory/.bash_history \
  && chown -R $USERNAME /commandhistory

# Set `DEVCONTAINER` environment variable to help with orientation
ENV DEVCONTAINER=true

# Create workspace and config directories and set permissions
RUN mkdir -p /workspace /home/node/.claude && \
  chown -R node:node /workspace /home/node/.claude

WORKDIR /workspace

ARG GIT_DELTA_VERSION=0.18.2
RUN ARCH=$(dpkg --print-architecture) && \
  wget "https://github.com/dandavison/delta/releases/download/${GIT_DELTA_VERSION}/git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb" && \
  sudo dpkg -i "git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb" && \
  rm "git-delta_${GIT_DELTA_VERSION}_${ARCH}.deb"

# Install Jujutsu VCS
ARG JJ_VERSION=0.36.0
RUN ARCH=$(dpkg --print-architecture) && \
  if [ "$ARCH" = "amd64" ]; then JJ_ARCH="x86_64"; else JJ_ARCH="aarch64"; fi && \
  wget "https://github.com/jj-vcs/jj/releases/download/v${JJ_VERSION}/jj-v${JJ_VERSION}-${JJ_ARCH}-unknown-linux-musl.tar.gz" && \
  tar -xzf "jj-v${JJ_VERSION}-${JJ_ARCH}-unknown-linux-musl.tar.gz" && \
  sudo mv jj /usr/local/bin/ && \
  rm "jj-v${JJ_VERSION}-${JJ_ARCH}-unknown-linux-musl.tar.gz"

# Set up non-root user
USER node

# Install global packages
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin

# Set the default shell to zsh rather than sh
ENV SHELL=/bin/zsh

# Set the default editor and visual
ENV EDITOR=nano
ENV VISUAL=nano

# Default powerline10k theme
ARG ZSH_IN_DOCKER_VERSION=1.2.0
RUN sh -c "$(wget -O- https://github.com/deluan/zsh-in-docker/releases/download/v${ZSH_IN_DOCKER_VERSION}/zsh-in-docker.sh)" -- \
  -p git \
  -p fzf \
  -a "source /usr/share/doc/fzf/examples/key-bindings.zsh" \
  -a "source /usr/share/doc/fzf/examples/completion.zsh" \
  -a "export PROMPT_COMMAND='history -a' && export HISTFILE=/commandhistory/.bash_history" \
  -x

# Install Claude
RUN npm install -g @anthropic-ai/claude-code@${CLAUDE_CODE_VERSION}

# Install Playwright browsers and create Chrome symlink for MCP server on arm64
# This must run as node user so browsers install to /home/node/.cache/ms-playwright
RUN ARCH=$(dpkg --print-architecture) && \
  npx playwright install chromium && \
  if [ "$ARCH" != "amd64" ]; then \
    CHROMIUM_PATH=$(find /home/node/.cache/ms-playwright -name "chrome" -type f -path "*/chrome-linux/*" 2>/dev/null | head -1) && \
    if [ -n "$CHROMIUM_PATH" ]; then \
      echo "Found Chromium at: $CHROMIUM_PATH"; \
    fi; \
  fi

# Copy and set up firewall script
COPY init-firewall.sh /usr/local/bin/
USER root
RUN chmod +x /usr/local/bin/init-firewall.sh && \
  echo "node ALL=(root) NOPASSWD: /usr/local/bin/init-firewall.sh" > /etc/sudoers.d/node-firewall && \
  chmod 0440 /etc/sudoers.d/node-firewall

# Create Chrome symlink for MCP Playwright server on arm64
# The MCP server looks for Chrome at /opt/google/chrome/chrome
RUN ARCH=$(dpkg --print-architecture) && \
  if [ "$ARCH" != "amd64" ]; then \
    CHROMIUM_PATH=$(find /home/node/.cache/ms-playwright -name "chrome" -type f -path "*/chrome-linux/*" 2>/dev/null | head -1) && \
    if [ -n "$CHROMIUM_PATH" ]; then \
      mkdir -p /opt/google/chrome && \
      ln -sf "$CHROMIUM_PATH" /opt/google/chrome/chrome && \
      echo "Created symlink: /opt/google/chrome/chrome -> $CHROMIUM_PATH"; \
    fi; \
  fi

USER node