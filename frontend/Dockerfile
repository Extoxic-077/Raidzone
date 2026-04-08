FROM nginx:alpine

# Install envsubst (included in gettext package)
RUN apk add --no-cache gettext

# Copy static frontend files
COPY . /usr/share/nginx/html/

# Remove Docker-specific files from the served directory
RUN rm -f /usr/share/nginx/html/Dockerfile \
          /usr/share/nginx/html/nginx.conf \
          /usr/share/nginx/html/docker-entrypoint.sh

# Copy nginx config as a template (PORT substituted at runtime)
COPY nginx.conf /etc/nginx/conf.d/default.conf.template

# Remove default nginx config
RUN rm -f /etc/nginx/conf.d/default.conf

# Copy and set executable entrypoint
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Cloud Run sets $PORT; default to 8080
ENV PORT=8080
EXPOSE ${PORT}

ENTRYPOINT ["/docker-entrypoint.sh"]
