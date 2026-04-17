FROM node:20-alpine AS builder

WORKDIR /app

# Add .npmrc for reliable installs
COPY .npmrc* ./
COPY package*.json ./

# Install with flags to avoid hanging on optional/peer deps
RUN npm install --legacy-peer-deps --no-optional --prefer-offline=false \
    --fetch-timeout=60000 \
    --loglevel=warn

COPY . .
RUN npm run build

FROM nginx:1.25-alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
