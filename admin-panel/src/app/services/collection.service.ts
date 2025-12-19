import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

const API_URL = 'http://localhost:7071/api';

export interface Collection {
  id: string;
  name: string;
  questionsCount: number;
  createdAt: string;
  tags?: string[];
  questions?: any[]; // For detail view
}

export interface Performance {
  id: string;
  collectionId: string;
  collectionName?: string;
  score: number;
  totalQuestions: number;
  date: string;
}

@Injectable({
  providedIn: 'root'
})
export class CollectionService {

  constructor(private http: HttpClient, private authService: AuthService) { }

  getCollections(): Observable<Collection[]> {
    return this.http.get<Collection[]>(`${API_URL}/Collections`, {
      headers: this.authService.getAuthHeaders()
    });
  }

  getCollection(id: string): Observable<Collection> {
    console.log('Fetching collection with ID:', id);
    const url = `${API_URL}/Collections/${id}`;
    console.log('URL:', url);
    return this.http.get<Collection>(url, {
        headers: this.authService.getAuthHeaders()
    });
  }

  saveCollection(name: string, questions: any[], tags?: string[]): Observable<any> {
      return this.http.post(`${API_URL}/Collections`, { name, questions, tags }, {
          headers: this.authService.getAuthHeaders()
      });
  }

  savePerformance(collectionId: string, score: number, totalQuestions: number, answers: any[]): Observable<any> {
      return this.http.post(`${API_URL}/Performance`, { collectionId, score, totalQuestions, answers }, {
          headers: this.authService.getAuthHeaders()
      });
  }

  getPerformance(): Observable<Performance[]> {
      return this.http.get<Performance[]>(`${API_URL}/Performance`, {
          headers: this.authService.getAuthHeaders()
      });
  }
}
