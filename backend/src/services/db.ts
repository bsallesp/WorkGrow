import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

const DATA_DIR = path.join(__dirname, '../../data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  googleId: string;
}

export interface Collection {
  id: string;
  name: string;
  userId: string; // Owner
  questions: any[]; // Store the full questions
  createdAt: string;
  tags?: string[];
}

export interface Performance {
  id: string;
  userId: string;
  collectionId: string;
  score: number;
  totalQuestions: number;
  answers: any[]; // Detailed answers
  date: string;
}

class JsonDb<T> {
  private filePath: string;

  constructor(filename: string) {
    this.filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(this.filePath)) {
      fs.writeFileSync(this.filePath, JSON.stringify([]));
    }
  }

  getAll(): T[] {
    const data = fs.readFileSync(this.filePath, 'utf-8');
    return JSON.parse(data);
  }

  save(item: T) {
    const items = this.getAll();
    items.push(item);
    fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2));
  }

  update(items: T[]) {
    fs.writeFileSync(this.filePath, JSON.stringify(items, null, 2));
  }
}

export const db = {
  users: new JsonDb<User>('users.json'),
  collections: new JsonDb<Collection>('collections.json'),
  performance: new JsonDb<Performance>('performance.json')
};
