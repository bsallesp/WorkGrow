# Question Generation Engine Design

## Core Concept: Documentation-Driven Generation (DDG)

The "Question Creation Module" will not generate random questions. Instead, it will strictly adhere to the **Source of Truth** established in our JSON documentation files. This ensures that every quiz question reinforces the specific *Mental Models*, *Analogies*, and *Best Practices* defined in our knowledge base.

### 1. The Workflow

```mermaid
graph LR
    Doc[Source JSON (e.g., useState.json)] -->|Extract Context| Engine[Generation Engine]
    Engine -->|Construct Prompt| AI[Azure OpenAI (GPT-4o)]
    AI -->|Returns JSON| RawQ[Raw Questions]
    RawQ -->|Validate Schema| Validator[Schema Validator]
    Validator -->|Save| DB[(Cosmos DB)]
```

### 2. Generation Strategy

The engine will generate three specific types of questions to test different levels of understanding:

#### A. Conceptual (Beginner)
*   **Source:** `mental_model` and `meta.description` fields.
*   **Goal:** Test if the user understands *what* the hook is and the analogy used (e.g., "The Light Switch" for `useState`).

#### B. Practical (Intermediate)
*   **Source:** `usage_patterns` and `syntax` fields.
*   **Goal:** Test syntax knowledge and standard use cases.

#### C. Debugging (Advanced)
*   **Source:** `common_pitfalls` and `best_practices` fields.
*   **Goal:** Present a broken code snippet (derived from a pitfall) and ask the user to identify the bug or fix it.

### 3. The Question Data Schema

The generated questions will be stored in Cosmos DB with the following JSON structure:

```json
{
  "id": "uuid-v4",
  "partitionKey": "react19", 
  "source_topic": "hooks/useEffect",
  "difficulty": "advanced",
  "type": "multiple_choice",
  "content": {
    "question_text": "You are reviewing the following code. The effect is running on every render, causing performance issues. What is the cause?",
    "code_snippet": "useEffect(() => {\n  console.log('Running');\n}); // Missing dependency array",
    "options": [
      "The dependency array is missing.",
      "The effect function is not async.",
      "The return value is missing.",
      "useEffect cannot be used in this component."
    ],
    "correct_answer_index": 0
  },
  "explanation": "As defined in our documentation, omitting the dependency array causes the Effect to run after *every* render. To fix this, provide an array (empty [] for mount only, or with variables).",
  "tags": ["performance", "pitfall"]
}
```

### 4. Implementation Details (Azure Functions)

We will create an Azure Function (Triggered by HTTP or Timer) that:
1.  **Loads** a Documentation JSON file.
2.  **Selects** a specific section (e.g., "Pitfall #1").
3.  **Sends** a prompt to the AI:
    > "Create a multiple-choice question based on this specific pitfall: 'Infinite Loops'. Use the following code example as a base..."
4.  **Parses** the response and validates it against the schema above.
5.  **Upserts** to Cosmos DB.
