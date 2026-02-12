FROM node:22-slim

WORKDIR /app
COPY apps/web/package.json apps/web/package-lock.json* ./
RUN npm ci

COPY apps/web/ .

ENV NEXT_PUBLIC_API_URL=http://localhost:5000
RUN npm run build

EXPOSE 3737
CMD ["npm", "start", "--", "--port", "3737"]
