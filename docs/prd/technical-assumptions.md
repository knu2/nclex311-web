# Technical Assumptions

## Repository Structure: Monorepo

A monorepo is recommended to house the unified Next.js application and the separate PDF parsing utility, simplifying project management.

## Service Architecture: Integrated (Next.js)

Since the complex PDF parsing will be handled by a separate one-time script, the application's backend requirements (auth, payments, data APIs) are streamlined. Therefore, we will use an **integrated architecture where the Next.js framework handles both the frontend and the backend API routes**. This simplifies development, deployment, and maintenance.

## Testing Requirements: Unit + Integration

The testing strategy will focus on a combination of unit tests for individual components (React components, API routes) and integration tests for key user workflows.

## Additional Technical Assumptions and Requests

*   **Application Framework:** **Next.js** will be used for both the frontend and backend, providing a unified React-based development experience.
*   **PDF Parsing Utility:** A **separate, one-time utility will be built in Python** to perform the initial database seeding from the source PDF. This is a temporary tool, not part of the deployed application.
*   **Database:** **PostgreSQL** remains the recommended database.
*   **API:** The backend API will be implemented using **Next.js API Routes**.
*   **Deployment:** The Next.js application will be deployed on a cloud platform optimized for it, such as **Vercel**, or a major provider like **AWS** or **Google Cloud**.
*   **Payment Gateway:** The system will exclusively use the **Maya Business API**.
