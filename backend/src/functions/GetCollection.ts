import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import { authenticateUser } from "../services/auth";
import { db } from "../services/db";

export async function GetCollection(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const user = await authenticateUser(request);
    if (!user) {
        return { status: 401, body: "Unauthorized" };
    }

    const id = request.params.id;
    if (!id) {
        return { status: 400, body: "Missing ID" };
    }

    const collections = db.collections.getAll();
    const collection = collections.find(c => c.id === id);

    if (!collection) {
        return { status: 404, body: "Collection not found" };
    }

    // Optional: Check ownership? collection.userId === user.id
    // For now, allow reading if they have the ID.

    return {
        status: 200,
        jsonBody: collection
    };
};

app.http('GetCollection', {
    methods: ['GET'],
    authLevel: 'anonymous',
    route: 'Collections/{id}',
    handler: GetCollection
});
