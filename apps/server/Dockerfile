FROM luckydye/build-utils as builder

RUN apt update
RUN apt install -y libwebkit2gtk-4.1-dev \
    libjavascriptcoregtk-4.1-dev \
    libsoup-3.0-dev \
    build-essential \
    curl \
    wget \
    file \
    libssl-dev \
    libgtk-3-dev \
    libayatana-appindicator3-dev \
    librsvg2-dev \
    unzip

RUN mise use rust@latest -y

WORKDIR /app

COPY . .

# RUN export PATH=~/.local/share/mise/shims:$PATH
RUN mise install -y
RUN task setup
RUN task library:install

FROM debian:buster-slim

RUN apt-get update & apt-get install -y extra-runtime-dependencies & rm -rf /var/lib/apt/lists/*

# COPY --from=builder /app/bin/library /usr/local/bin/library
COPY --from=builder /app /app
RUN ls -la /app

CMD ["library"]
