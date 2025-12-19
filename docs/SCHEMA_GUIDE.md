# Universal Technical Knowledge Base Schema

## Overview
This repository hosts a structured, technology-agnostic knowledge base designed to fuel automated learning tools, quizzes, flashcards, and AI study assistants. 

The core philosophy is to separate **raw technical data** from **educational context**. We don't just store "what code does"; we store "how to think about it," "when to use it," and "how it connects to other concepts."

## The Schema Structure
All JSON files in this repository must adhere to the standard schema defined in `schemas/hook-schema.json` (renaming to `universal-schema.json` recommended for future).

### 1. Meta (`meta`)
*   **Purpose**: administrative tracking and versioning.
*   **Fields**:
    *   `technology`: The main tech stack (e.g., "React", "Python", "AWS").
    *   `topic`: High-level category (e.g., "Hooks", "Data Structures").
    *   `sub_topic`: Specific area (e.g., "Effect Hooks").
    *   `version`: The version of the technology being documented (crucial for keeping docs up-to-date).
    *   `doc_url`: Link to the official documentation.

### 2. Taxonomy (`taxonomy`)
*   **Purpose**: Filtering and curriculum generation.
*   **Fields**:
    *   `difficulty`: `Beginner`, `Intermediate`, or `Advanced`.
    *   `tags`: Keywords for search and grouping (e.g., "performance", "memory").
    *   `prerequisites`: What a student must know *before* learning this topic.

### 3. Mental Model (`mental_model`)
*   **Purpose**: To teach the *intuition* behind the concept, not just the syntax.
*   **Fields**:
    *   `analogy`: A non-technical comparison (e.g., "An IP address is like a home address").
    *   `explanation`: A brief expansion on the analogy.

### 4. Real World Use Cases (`real_world_use_cases`)
*   **Purpose**: To answer "Why should I care?" or "When will I actually use this?".
*   **Format**: A list of concrete, practical scenarios.

### 5. Related Concepts (`related_concepts`)
*   **Purpose**: To build a **Knowledge Graph**. This helps in generating recommendations (e.g., "Since you learned X, you should learn Y").
*   **Fields**:
    *   `concept`: Name of the related topic.
    *   `relationship`: How it connects (e.g., "Alternative to", "Often used with", "Deprecates").

### 6. Concepts (`concepts`)
*   **Purpose**: The actual technical content broken down into atomic units.
*   **Fields**:
    *   `id`: Unique identifier (snake_case).
    *   `name`: Human-readable title.
    *   `type`: `concept`, `pattern`, `anti_pattern`, or `advanced_concept`.
    *   `description`: High-level summary.
    *   `details`: Bullet points of crucial technical behavior.
    *   `code_example`: A concise snippet + explanation.

---

## Example (Non-React)
Here is how this schema applies to a completely different technology, like **SQL**.

```json
{
  "meta": {
    "technology": "SQL",
    "topic": "Indexing",
    "sub_topic": "B-Tree",
    "version": "ANSI 92"
  },
  "taxonomy": {
    "difficulty": "Intermediate",
    "tags": ["performance", "database", "optimization"],
    "prerequisites": ["Select Statements", "Table Scans"]
  },
  "mental_model": {
    "analogy": "Phone Book",
    "explanation": "Searching a table without an index is like reading a phone book page by page. An index is like the alphabetical tabs on the side that let you jump straight to 'S'."
  },
  "real_world_use_cases": [
    "Speeding up user search by email.",
    "Optimizing foreign key joins in large transaction tables."
  ],
  "concepts": [
    {
      "id": "clustered_index",
      "name": "Clustered Index",
      "type": "concept",
      "description": "Sorts the actual data rows on disk.",
      "details": ["Only one per table allowed.", "Fastest for range queries."]
    }
  ]
}
```

## Validation
To validate any new JSON file, ensure your editor supports JSON Schema or run a validation script against `schemas/hook-schema.json`.
