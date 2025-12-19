import { app, HttpRequest, HttpResponseInit, InvocationContext } from "@azure/functions";
import * as fs from 'fs';
import * as path from 'path';

interface Topic {
    id: string;
    name: string;
    type: string;
    filePath: string;
}

interface Domain {
    id: string;
    name: string;
    topics: Topic[];
}

export async function GetDocumentationCatalog(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    // Determine the path to the documentation folder
    // Locally, we are in /backend, so documentation is in ../documentation
    // In production, we might need a different strategy (e.g., deployment artifact), 
    // but for this task we assume the folder exists relative to the backend root.
    const docsRoot = path.resolve(process.cwd(), '../documentation');
    
    context.log(`Scanning documentation at: ${docsRoot}`);

    if (!fs.existsSync(docsRoot)) {
        return {
            status: 404,
            body: JSON.stringify({ error: "Documentation folder not found", path: docsRoot })
        };
    }

    const catalog: Domain[] = [];

    try {
        // Level 1: Domains (e.g., react19)
        const domains = fs.readdirSync(docsRoot, { withFileTypes: true })
            .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'));

        for (const domainDir of domains) {
            const domainId = domainDir.name;
            const domainPath = path.join(docsRoot, domainId);
            
            const domain: Domain = {
                id: domainId,
                name: formatName(domainId),
                topics: []
            };

            // Recursively find all JSON files in this domain
            const files = getAllFiles(domainPath);
            
            for (const file of files) {
                if (file.endsWith('.json')) {
                    // content relative to domain root, e.g., "hooks/useState.json"
                    const relativePath = path.relative(domainPath, file);
                    const pathParts = relativePath.split(path.sep);
                    
                    // Name is the filename without extension
                    const fileName = path.basename(file, '.json');
                    
                    // ID includes the category if present, e.g., "hooks/useState"
                    // We normalize path separators to forward slashes for IDs
                    const id = relativePath.replace(/\\/g, '/').replace('.json', '');
                    
                    // Attempt to determine type from parent folder (e.g., "hooks")
                    const type = pathParts.length > 1 ? pathParts[pathParts.length - 2] : 'general';

                    domain.topics.push({
                        id: id,
                        name: fileName,
                        type: type,
                        filePath: file
                    });
                }
            }

            catalog.push(domain);
        }

        return {
            status: 200,
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(catalog)
        };

    } catch (error) {
        context.error("Error scanning documentation:", error);
        return {
            status: 500,
            body: JSON.stringify({ error: "Internal Server Error", details: error.message })
        };
    }
};

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

function formatName(id: string): string {
    // Simple formatter: react19 -> React 19
    if (id === 'react19') return 'React 19';
    return id.charAt(0).toUpperCase() + id.slice(1);
}

app.http('GetDocumentationCatalog', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: GetDocumentationCatalog
});
