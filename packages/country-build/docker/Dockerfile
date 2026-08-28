FROM debian:bookworm-slim AS build

RUN apt-get update && apt-get install -y --no-install-recommends \
      git ca-certificates gcc g++ make libsqlite3-dev zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

ARG TIPPECANOE_VERSION=2.79.0
RUN git clone --depth 1 --branch "${TIPPECANOE_VERSION}" \
      https://github.com/felt/tippecanoe.git /src
WORKDIR /src
RUN make -j"$(nproc)" && make install

FROM debian:bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      libsqlite3-0 zlib1g \
    && rm -rf /var/lib/apt/lists/*
COPY --from=build /usr/local/bin/tippecanoe /usr/local/bin/tippecanoe
COPY --from=build /usr/local/bin/tippecanoe-enumerate /usr/local/bin/tippecanoe-enumerate
COPY --from=build /usr/local/bin/tippecanoe-decode /usr/local/bin/tippecanoe-decode
COPY --from=build /usr/local/bin/tippecanoe-json-tool /usr/local/bin/tippecanoe-json-tool
COPY --from=build /usr/local/bin/tippecanoe-overzoom /usr/local/bin/tippecanoe-overzoom
COPY --from=build /usr/local/bin/tile-join /usr/local/bin/tile-join
WORKDIR /data
