# API Specification

## REST API Specification (OpenAPI)

The following is a summary of the core API endpoints. A more detailed `openapi.yaml` file will be generated as part of the development process.

```yaml
openapi: 3.0.0
info:
  title: "NCLEX311-Web API"
  version: "1.0.0"
  description: "API for the NCLEX311-Web interactive learning platform."
servers:
  - url: "/api"
    description: "Next.js API Routes"

paths:
  /auth/{...}:
    summary: "Authentication handled by Auth.js (NextAuth)."
    description: "Endpoints like /api/auth/signin, /api/auth/signout, /api/auth/session are automatically provided by the Auth.js library."

  /chapters:
    get:
      summary: "Get all chapters"
      description: "Returns a list of all chapters with their nested concepts, used for building the main navigation."

  /concepts/{conceptId}:
    get:
      summary: "Get a single concept"
      description: "Returns the full details for a single concept, including its content and associated quiz. The API will enforce premium access rules for chapters 5-8."

  /concepts/{conceptId}/comments:
    get:
      summary: "Get comments for a concept"
      description: "Retrieves a paginated list of comments for a specific concept."
    post:
      summary: "Post a new comment"
      description: "Allows a logged-in user to post a comment on a concept. (Requires authentication)"

  /me/dashboard:
    get:
      summary: "Get user dashboard data"
      description: "A single endpoint to fetch all data for the user's dashboard, including lists of bookmarked and completed concepts. (Requires authentication)"

  /me/bookmarks:
    post:
      summary: "Bookmark a concept"
      description: "Adds a concept to the current user's bookmarks. (Requires authentication)"
    delete:
      summary: "Remove a bookmark"
      description: "Removes a concept from the current user's bookmarks. (Requires authentication)"

  /me/completed-concepts:
    post:
      summary: "Mark a concept as complete"
      description: "Marks a concept as complete for the current user. (Requires authentication)"
    delete:
      summary: "Un-mark a concept as complete"
      description: "Removes the 'complete' status from a concept for the current user. (Requires authentication)"

  /payments/checkout-session:
    post:
      summary: "Create a payment checkout session"
      description: "Initiates a payment process with Maya Business and returns a checkout URL for the client to redirect to. (Requires authentication)"

  /webhooks/payment-provider:
    post:
      summary: "Webhook for payment provider"
      description: "A public endpoint for Maya Business to send asynchronous updates on payment status (e.g., SUCCESSFUL, FAILED)."

```
