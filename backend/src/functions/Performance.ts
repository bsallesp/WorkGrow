import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateUser } from "../services/auth";
import { db, Performance } from "../services/db";
import { v4 as uuidv4 } from 'uuid';

export async function PerformanceFunc(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const user = await authenticateUser(request);
    if (!user) {
        return { status: 401, body: "Unauthorized" };
    }

    if (request.method === 'GET') {
        // Get user's performance history
        const allPerf = db.performance.getAll();
        const userPerf = allPerf.filter(p => p.userId === user.id);
        
        // Maybe join with collection name?
        const collections = db.collections.getAll();
        const enriched = userPerf.map(p => {
            const col = collections.find(c => c.id === p.collectionId);
            return {
                ...p,
                collectionName: col ? col.name : 'Unknown Collection'
            };
        });

        return {
            status: 200,
            jsonBody: enriched
        };
    } else if (request.method === 'POST') {
        try {
            const body = await request.json() as any;
            const { collectionId, score, totalQuestions, answers } = body;

            if (!collectionId || score === undefined || !totalQuestions) {
                return { status: 400, body: "Invalid payload" };
            }

            const newPerf: Performance = {
                id: uuidv4(),
                userId: user.id,
                collectionId,
                score,
                totalQuestions,
                answers,
                date: new Date().toISOString()
            };

            db.performance.save(newPerf);

            return { status: 201, jsonBody: newPerf };
        } catch (error) {
            context.log('Error saving performance', error);
            return { status: 500, body: "Internal Server Error" };
        }
    }

    return { status: 405, body: "Method Not Allowed" };
};

app.http('Performance', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: PerformanceFunc
});
