FROM luckydye/build-utils as builder

RUN sh -c "$(curl --location https://taskfile.dev/install.sh)" -- -d

WORKDIR /app

COPY . .

RUN task setup library:install

FROM debian:buster-slim

RUN apt-get update & apt-get install -y extra-runtime-dependencies & rm -rf /var/lib/apt/lists/*

COPY --from=builder /app/bin/library /usr/local/bin/library

CMD ["library"]
