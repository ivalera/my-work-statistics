import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';

export interface Board {
  id: number;
  title: string;
  columns: Column[];
}

export interface Column {
  id: number;
  uid: string;
  title: string;
  sort_order: number;
  col_count: number;
  type: number;
  board_id: number;
  column_id: number | null;
  external_id: string | null;
  rules: number;
  pause_sla: boolean;
}

export interface Card {
  id: number;
  title: string;
  updated: string;
  created: string;
  column_id: number;
  sort_order: number;
  properties: {
    id_411710?: string; // количество часов
  };
  owner: {
    full_name: string;
    email: string;
    username: string;
  };
  members?: Array<{
    id: number;
    username: string;
    full_name: string;
    email: string;
  }>;
}

export interface BoardResponse {
  cards: Card[];
  columns: Column[];
  title: string;
  description: string | null;
  id: number;
}

@Injectable({
  providedIn: 'root'
})
export class KaitenService {
  private apiUrl = '/api';

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private getHeaders(): HttpHeaders {
    const apiKey = this.authService.getApiKey();
    return new HttpHeaders({
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    });
  }

  getBoards(spaceId: number): Observable<Board[]> {
    return this.http.get<Board[]>(`${this.apiUrl}/spaces/${spaceId}/boards`, {
      headers: this.getHeaders()
    });
  }

  getBoardCards(spaceId: number, boardId: number, username?: string): Observable<Card[]> {
    return this.http.get<BoardResponse>(`${this.apiUrl}/spaces/${spaceId}/boards/${boardId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        let cards = response.cards || [];
        if (username) {
          cards = cards.filter(card => 
            card.owner.username === username || 
            (card.members && card.members.some(member => member.username === username))
          );
        }
        return cards;
      })
    );
  }
} 