FROM node:22-alpine AS build
WORKDIR /app
COPY WebApp/package.json WebApp/package-lock.json ./
RUN npm ci
COPY WebApp/ ./
RUN npm run build

FROM nginxinc/nginx-unprivileged:stable-alpine AS final
COPY WebApp/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
