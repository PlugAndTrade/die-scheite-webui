FROM node:10.0.0 as builder

WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./
RUN npm install

COPY src ./src
COPY public ./public
ENV REACT_APP_DIESCHEITE_API='/api'
RUN npm run build

FROM nginx:1.15-alpine
COPY --from=builder /usr/src/app/build /usr/share/nginx/html

COPY ./nginx/entrypoint.sh /entrypoint.sh
COPY ./nginx/nginx.conf.template /etc/nginx/

EXPOSE 80
ENV DIESCHEITE_API dieacheite-api

ENTRYPOINT ["/entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
