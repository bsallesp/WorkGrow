# Cloud Architecture and Database Selection

## 1. Database Recommendation: Azure Cosmos DB (Serverless Mode)

To store the generated content (questions, quizzes) and maintain compatibility with our documentation's JSON format, the best choice balancing **cost** and **modernity** is **Azure Cosmos DB for NoSQL** using the **Serverless** tier.

### Why Serverless?
*   **Zero Cost when Idle:** Unlike traditional provisioned databases where you pay hourly (even if no one uses it), in Serverless mode you only pay per **Request Unit (RU)** consumed. If no one accesses the app, you only pay pennies for storage (disk space).
*   **Native JSON:** Since all our documentation is in JSON, Cosmos DB stores these documents natively without the need for complex ORMs or schema conversion (Schema-less).
*   **Scalability:** If the app grows, it scales automatically.

### "Ultra-Low Cost" Alternative (Only if budget is strictly zero)
*   **Azure Table Storage:** It is cheaper than Cosmos DB, but it is a simple key-value store.
    *   *Con:* Does not allow complex queries (e.g., "give me all hard questions about useEffect"). You would have to filter this in code, increasing complexity.
    *   *Recommendation:* Stick with Cosmos DB Serverless for ease of development, unless the data volume is massive and the budget is virtually zero.

---

## 2. Proposed Architecture: Azure Serverless

To ensure the "cheap way" you requested, the architecture must be fully event-driven (Serverless). This eliminates fixed costs of running servers 24/7.

### Components:

1.  **Frontend (Hosting):**
    *   **Service:** Azure Static Web Apps.
    *   **Framework:** Angular (v19+).
    *   **Cost:** Has a generous **Free Plan** that includes global hosting, SSL certificate, and integrated CI/CD with GitHub.

2.  **Backend (API & Logic):**
    *   **Service:** Azure Functions.
    *   **Plan:** Consumption Plan.
    *   **Cost:** The first 1 million executions per month are **free**. You only pay when the function runs to generate a question or save a result.

3.  **Database:**
    *   **Service:** Azure Cosmos DB for NoSQL (Serverless).
    *   **Cost:** Pay-per-operation. Estimate for dev/test is very low (< $5/month for moderate use).

4.  **File Storage (Images/Assets):**
    *   **Service:** Azure Blob Storage.
    *   **Cost:** Pennies per GB.

### Data Flow:

```mermaid
graph TD
    User[User] -->|Access App| StaticWeb[Azure Static Web App (React)]
    StaticWeb -->|Request Quiz| FuncApp[Azure Functions (Node.js/Python)]
    
    subgraph "Data Layer"
        FuncApp -->|Read Documentation| Blob[Azure Blob Storage (Original JSONs)]
        FuncApp -->|Read/Write Questions| Cosmos[Azure Cosmos DB (Serverless)]
    end
    
    FuncApp -->|Generate Question| AI[Azure OpenAI / OpenAI API]
```

## Decision Summary

*   **Database:** Azure Cosmos DB for NoSQL (Serverless).
*   **Architecture:** Serverless (Static Web Apps + Azure Functions).
*   **Key Advantage:** Virtually zero fixed cost. Cost scales linearly with actual usage.
