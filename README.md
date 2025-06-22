
TeamRouter is a secure, robust proxy interface that enables your team to collectively use OpenRouter's large language models (LLMs) while maintaining individual user accountability and comprehensive chat history logging.

Features
User & API Key Management:
Register team members and securely store encrypted individual OpenRouter API keys. Each request uses the correct user’s key.

Proxy OpenRouter API Calls:
Relay requests to OpenRouter API with per-user authentication, forwarding parameters transparently.

Chat History & Context Persistence:
Store all chat sessions and messages in a database, including timestamps, request/response payloads, and model info.

Contextual Chat Continuation:
Retrieve prior session history to maintain conversation context within the model's token limits.

Security & Reliability:
Encrypted API key storage, authentication, authorization, error handling, and rate limiting.

Getting Started
Setup Database: Configure PostgreSQL/MySQL/MongoDB with tables/collections for users, API keys, sessions, and messages.

Configure Server:

Securely manage environment variables (encryption keys, DB credentials).

Implement user authentication (e.g., JWT, OAuth).

Run the proxy server to accept authenticated OpenRouter requests.

Usage:

Users register and store their OpenRouter API keys.

Send requests through TeamRouter REST API.

View and continue chat sessions with persisted context.

