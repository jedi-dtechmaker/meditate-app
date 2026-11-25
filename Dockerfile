FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --workspaces=false --no-audit --no-fund
COPY --chown=node:node server.ts bibleService.ts ./
COPY --chown=node:node api ./api
COPY --chown=node:node shared ./shared
COPY --chown=node:node data ./data
USER node
EXPOSE 3000
HEALTHCHECK --interval=30s --timeout=5s CMD node -e "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["npm", "start"]
