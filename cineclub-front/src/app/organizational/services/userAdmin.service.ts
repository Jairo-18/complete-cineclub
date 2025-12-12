/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject } from '@angular/core';
import { SupabaseClient } from '@supabase/supabase-js';
import { NotificationsService } from '../../shared/services/notifications.service';
import { supabase } from '../../supabaseClient';
import { environment } from '../../../environments/environment';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import {
  ApiResponseCreateInterface,
  ApiResponseInterface,
} from '../../shared/interfaces/api-response.interface';
import { UserCompleteInterface } from '../../auth/interfaces/user.interface';
import { CreateUserPanel } from '../interfaces/create.interface';

export interface UserSearchParams {
  search?: string;
  roleType?: string;
  country?: string;
}

export interface UserSearchParams {
  search?: string;
  roleType?: string;
  country?: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserAdminService {
  private readonly supabase: SupabaseClient = supabase;
  private readonly _notificationsService: NotificationsService = inject(NotificationsService);
  private readonly _httpClient: HttpClient = inject(HttpClient);

  async getUsers(page: number = 1, limit: number = 10, params: UserSearchParams = {}) {
    try {
      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let query = this.supabase
        .from('profile')
        .select(
          `
          id,
          fullName,
          email,
          country,
          phone,
          username,
          created_at,
          roleTypeId,
          roleType:roleType!fk_profile_roletype (
            id,
            code,
            name
          )
          `,
          { count: 'exact' }
        )
        .order('created_at', { ascending: false })
        .range(from, to);

      if (params.search && params.search.trim() !== '') {
        query = query.or(
          `fullName.ilike.%${params.search}%,email.ilike.%${params.search}%,username.ilike.%${params.search}%`
        );
      }

      if (params.roleType && params.roleType.trim() !== '') {
        query = query.eq('roleTypeId', params.roleType);
      }

      if (params.country && params.country.trim() !== '') {
        query = query.eq('country', params.country);
      }

      const { data, count, error } = await query;

      if (error) throw error;

      const transformedData = data?.map((user) => ({
        ...user,
        roleType: Array.isArray(user.roleType) ? user.roleType[0] : user.roleType,
      }));

      return { data: transformedData, count };
    } catch (error: any) {
      console.error('❌ Error al obtener usuarios:', error.message);
      this._notificationsService.error('No se pudieron cargar los usuarios.');
      throw error;
    }
  }

  async getRoleTypes() {
    try {
      const { data, error } = await this.supabase
        .from('roleType')
        .select('id, code, name')
        .order('name', { ascending: true });

      if (error) throw error;

      return data || [];
    } catch (error: any) {
      console.error('❌ Error al obtener roles:', error.message);
      this._notificationsService.error('No se pudieron cargar los roles.');
      throw error;
    }
  }

  getUserEditPanel(userId: string): Observable<ApiResponseInterface<UserCompleteInterface>> {
    return this._httpClient.get<ApiResponseInterface<UserCompleteInterface>>(
      `${environment.backendUrl}users/${userId}`
    );
  }

  updateUserProfile(userId: string, body: unknown): Observable<void> {
    return this._httpClient.patch<void>(`${environment.backendUrl}users/${userId}`, body);
  }

  createUser(user: CreateUserPanel): Observable<ApiResponseCreateInterface> {
    return this._httpClient.post<ApiResponseCreateInterface>(
      `${environment.backendUrl}users/register`,
      user
    );
  }

  updateUser(userId: string, body: unknown): Observable<void> {
    return this._httpClient.patch<void>(`${environment.backendUrl}users/${userId}`, body);
  }

  deleteUserPanel(id: string): Observable<unknown> {
    return this._httpClient.delete(`${environment.backendUrl}users/${id}`);
  }
}
