import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserMongoComplete } from '../../auth/interfaces/user.interface';
import { SupabaseClient } from '@supabase/supabase-js';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly _httpClient: HttpClient = inject(HttpClient);
  private readonly supabase = inject(SupabaseClient);

  getUserById(id: string): Observable<UserMongoComplete> {
    return this._httpClient.get<UserMongoComplete>(`${environment.backendUrl}users/${id}`);
  }

  async getUsersByIds(ids: string[]): Promise<UserMongoComplete[]> {
    if (ids.length === 0) return [];

    const chunkSize = 50;
    const chunks: string[][] = [];
    for (let i = 0; i < ids.length; i += chunkSize) {
      chunks.push(ids.slice(i, i + chunkSize));
    }

    const allUsers: UserMongoComplete[] = [];

    for (const chunk of chunks) {
      const { data, error } = await this.supabase
        .from('profile')
        .select('id, fullName, avatarUrl, username')
        .in('id', chunk);

      if (error) {
        console.error('Error fetching users by ids:', error);
        continue;
      }

      if (data) {
        allUsers.push(...(data as UserMongoComplete[]));
      }
    }

    return allUsers;
  }
}
