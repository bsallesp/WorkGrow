import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as fs from 'fs';
import * as path from 'path';
import Anthropic from "@anthropic-ai/sdk";
import { authenticateUser } from "../services/auth";
import { db, Collection } from "../services/db";
import { v4 as uuidv4 } from 'uuid';

// Define interfaces for request and response
interface GenerateRequest {
    domainId: string;
    topicId: string;
    difficulty: 'beginner' | 'intermediate' | 'advanced';
    count: number;
    collectionName?: string;
}

interface Question {
    id: string;
    type: string;
    content: {
        question_text: string;
        options: string[];
        correct_answer_index: number;
        code_snippet?: string;
    };
    explanation: string;
    tags?: string[];
    collectionName?: string;
}

export async function GenerateQuestions(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const user = await authenticateUser(request);

    let body: GenerateRequest;
    try {
        body = await request.json() as GenerateRequest;
    } catch (e) {
        return { status: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
    }

    const { domainId, difficulty, count, collectionName } = body;
    let { topicId } = body;

    if (!domainId) {
        return { status: 400, body: JSON.stringify({ error: "Missing domainId" }) };
    }

    // 1. Load Documentation Content
    const docsRoot = path.resolve(process.cwd(), '../documentation');
    
    // If topicId is missing, pick a random file from the domain
    if (!topicId) {
        const domainPath = path.join(docsRoot, domainId);
        if (!fs.existsSync(domainPath)) {
            return { status: 404, body: JSON.stringify({ error: "Domain folder not found", path: domainPath }) };
        }
        
        const allFiles = getAllFiles(domainPath);
        const jsonFiles = allFiles.filter(f => f.endsWith('.json'));
        
        if (jsonFiles.length === 0) {
             return { status: 404, body: JSON.stringify({ error: "No documentation files found in domain" }) };
        }
        
        const randomFile = jsonFiles[Math.floor(Math.random() * jsonFiles.length)];
        
        // Convert absolute path back to relative topicId
        // e.g. .../react19/hooks/useState.json -> hooks/useState
        const relativePath = path.relative(domainPath, randomFile);
        topicId = relativePath.replace(/\\/g, '/').replace('.json', '');
        
        context.log(`No topicId provided. Selected random topic: ${topicId}`);
    }

    // topicId is "hooks/useState" and we want to append .json
    // We trust topicId matches the relative path structure within the domain
    const filePath = path.join(docsRoot, domainId, `${topicId}.json`);

    context.log(`Reading documentation from: ${filePath}`);

    if (!fs.existsSync(filePath)) {
        return { status: 404, body: JSON.stringify({ error: "Documentation file not found", path: filePath }) };
    }

    const docContent = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    // 2. Prepare Context for AI
    const systemPrompt = `You are a Senior Technical Examiner. Your goal is to generate multiple-choice questions based STRICTLY on the provided documentation.
    
    Difficulty Guidelines:
    - Beginner: Focus on 'mental_model' and 'meta.description'. Conceptual understanding.
    - Intermediate: Focus on 'usage_patterns' and 'syntax'. Practical implementation.
    - Advanced: Focus on 'common_pitfalls' and 'best_practices'. Debugging and optimization.

    Output Format:
    Return a valid JSON array of objects (AND NOTHING ELSE) with this schema:
    [
      {
        "content": {
            "question_text": "...",
            "options": ["A", "B", "C", "D"],
            "correct_answer_index": 0,
            "code_snippet": "Optional code here..."
        },
        "explanation": "..."
      }
    ]
    `;

    const userPrompt = `
    Context:
    ${JSON.stringify(docContent, null, 2)}

    Task:
    Generate ${count} ${difficulty} questions about ${docContent.taxonomy?.category || 'General'}/${docContent.name}.
    Ensure the questions are derived ONLY from the provided JSON content.
    Return only the JSON array. Do not include markdown formatting like \`\`\`json.
    `;

    // 3. Call Anthropic Claude (or Mock if no key)
    const apiKey = process.env.ANTHROPIC_API_KEY;

    if (!apiKey) {
        context.log("No ANTHROPIC_API_KEY found. Returning mock data.");
        const mockQuestions = generateMockQuestions(docContent, difficulty, count);
        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mockQuestions)
        };
    }

    try {
        const anthropic = new Anthropic({ apiKey: apiKey });
        
        const message = await anthropic.messages.create({
            model: "claude-3-haiku-20240307",
            max_tokens: 4096,
            system: systemPrompt,
            messages: [
                { role: "user", content: userPrompt }
            ]
        });

        // Parse response - Claude returns an array of ContentBlock
        // We assume text content.
        const textBlock = message.content[0];
        let result = "";
        if (textBlock.type === 'text') {
            result = textBlock.text;
        }

        // Clean up markdown code blocks if present (Claude likes to be helpful)
        result = result.replace(/```json/g, '').replace(/```/g, '').trim();

        const questions = JSON.parse(result || "[]");

        // Post-process: Add Tags automatically based on context
        const generatedTags = [
            domainId, 
            ...topicId.split('/')
        ].filter(Boolean);

        const enrichedQuestions = questions.map((q: any) => ({
            ...q,
            tags: generatedTags,
            collectionName: collectionName || 'Auto Generated'
        }));

        // Automatically save collection if name provided and user authenticated
        if (collectionName && user) {
            try {
                const newCollection: Collection = {
                    id: uuidv4(),
                    name: collectionName,
                    userId: user.id,
                    questions: enrichedQuestions,
                    createdAt: new Date().toISOString(),
                    tags: generatedTags
                };
                db.collections.save(newCollection);
                context.log(`Saved collection '${collectionName}' for user ${user.email}`);
            } catch (err) {
                context.error('Failed to save collection automatically', err);
            }
        }

        return {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(enrichedQuestions)
        };

    } catch (error) {
        context.error("Anthropic API Error:", error);
        // Fallback to mock if API fails? Or return error? 
        // Better to return error to debug.
        return {
            status: 500,
            body: JSON.stringify({ error: "Failed to generate questions via AI", details: error.message })
        };
    }
};

function generateMockQuestions(doc: any, difficulty: string, count: number): any[] {
    // Simple deterministic generator for demo purposes
    const questions = [];
    for (let i = 0; i < count; i++) {
        questions.push({
            id: `mock-${Date.now()}-${i}`,
            type: "multiple_choice",
            content: {
                question_text: `[MOCK ${difficulty.toUpperCase()}] What is the primary purpose of ${doc.name}? (Derived from ${doc.meta.title})`,
                options: [
                    doc.meta.description,
                    "To cause side effects in every render",
                    "To store global state in Redux",
                    "To fetch data from a SOAP API"
                ],
                correct_answer_index: 0
            },
            explanation: `As stated in the documentation: "${doc.mental_model?.summary || 'N/A'}"`
        });
    }
    return questions;
}

function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath, { withFileTypes: true });

    files.forEach(function(file) {
        if (fs.statSync(dirPath + "/" + file.name).isDirectory()) {
            arrayOfFiles = getAllFiles(dirPath + "/" + file.name, arrayOfFiles);
        } else {
            arrayOfFiles.push(path.join(dirPath, "/", file.name));
        }
    });

    return arrayOfFiles;
}

app.http('GenerateQuestions', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: GenerateQuestions
});
