FROM node:20-alpine

LABEL org.opencontainers.image.title="ai-first"
LABEL org.opencontainers.image.description="Generate AI context for any repository"
LABEL org.opencontainers.image.url="https://github.com/julianperezpesce/ai-first"
LABEL org.opencontainers.image.source="https://github.com/julianperezpesce/ai-first"

RUN npm install -g ai-first-cli@latest

WORKDIR /repo

ENTRYPOINT ["af"]
CMD ["init"]
