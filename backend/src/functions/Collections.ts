import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateUser } from "../services/auth";
import { db, Collection } from "../services/db";
import { v4 as uuidv4 } from 'uuid';

export async function Collections(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const user = await authenticateUser(request);
    if (!user) {
        return { status: 401, body: "Unauthorized" };
    }

    if (request.method === 'GET') {
        const collections = db.collections.getAll();
        // Filter by user or public? For now, let's return all or just user's. 
        // User said "create the list of already existing collections", implies shared or personal.
        // Let's return all for now so they can see examples, or filter by user.
        // Let's filter by user AND shared ones if we had that concept. For now just user's.
        const userCollections = collections.filter(c => c.userId === user.id);
        
        return {
            status: 200,
            jsonBody: userCollections.map(c => ({
                id: c.id,
                name: c.name,
                questionsCount: c.questions.length,
                createdAt: c.createdAt,
                tags: c.tags
            }))
        };
    } else if (request.method === 'POST') {
        try {
            const body = await request.json() as any;
            const { name, questions, tags } = body;

            if (!name || !questions || !Array.isArray(questions)) {
                return { status: 400, body: "Invalid payload" };
            }

            const newCollection: Collection = {
                id: uuidv4(),
                name,
                userId: user.id,
                questions,
                createdAt: new Date().toISOString(),
                tags
            };

            db.collections.save(newCollection);

            return { status: 201, jsonBody: newCollection };
        } catch (error) {
            context.log('Error creating collection', error);
            return { status: 500, body: "Internal Server Error" };
        }
    }

    return { status: 405, body: "Method Not Allowed" };
};

app.http('Collections', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: Collections
});
