import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';

export interface Topic {
  id: string;
  name: string;
  type: string;
  filePath: string;
}

export interface Domain {
  id: string;
  name: string;
  topics: Topic[];
}

export interface GenerateRequest {
  domainId: string;
  topicId: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  count: number;
  collectionName?: string;
}

export interface Question {
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

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  // In a real app, this URL would be in environment.ts
  private apiUrl = 'http://localhost:7071/api';

  constructor(private http: HttpClient, private authService: AuthService) { }

  getCatalog(): Observable<Domain[]> {
    return this.http.get<Domain[]>(`${this.apiUrl}/GetDocumentationCatalog`, {
        headers: this.authService.getAuthHeaders()
    });
  }

  generateQuestions(request: GenerateRequest): Observable<Question[]> {
    return this.http.post<Question[]>(`${this.apiUrl}/GenerateQuestions`, request, {
        headers: this.authService.getAuthHeaders()
    });
  }
}
