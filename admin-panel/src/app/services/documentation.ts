import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class DocumentationService {
  // In a real app, this URL would be in environment.ts
  private apiUrl = 'http://localhost:7071/api';

  constructor(private http: HttpClient) { }

  getCatalog(): Observable<Domain[]> {
    return this.http.get<Domain[]>(`${this.apiUrl}/GetDocumentationCatalog`);
  }
}
