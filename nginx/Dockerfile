FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy our nginx config
COPY nginx.conf /etc/nginx/conf.d/wedding-planner.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
