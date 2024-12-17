FROM node:18.16.0 as builder
WORKDIR /build

COPY . /build
RUN npm clean-install
RUN npm run build

FROM node:18.16.0-slim

WORKDIR /app

COPY --from=builder /build/dist /app/dist
COPY --from=builder /build/views /app/views
COPY --from=builder /build/public /app/public
COPY --from=builder /build/node_modules /app/node_modules
CMD ["node", "dist/index.js"]