import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Member } from 'src/app/_models/member';
import { Observable, of } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { Photo } from '../_models/photo';
import { PaginatedResult, Pagination } from '../_models/pagination';
import { AccountService } from './account.service';
import { User } from '../_models/user';
import { UserParams } from '../_models/userParams';
import { getPaginatedResult, getPaginationHeaders } from './paginationHelper';

@Injectable({
  providedIn: 'root'
})
export class MembersService {
  baseUrl = environment.apiUrl;
  members: Member[] = [];
  memberCache = new Map();
  user: User;
  userParams: UserParams;
  
  constructor(private http: HttpClient, private accountService: AccountService) { 
    this.accountService.currentUser$.pipe(take(1)).subscribe(response => {
      this.user = response;
      this.userParams = new UserParams(response);
    })
  }

  getUserParams() {
    return this.userParams;
  }
  
  setUserParams(params: UserParams) {
    this.userParams = params;
  }

  resetUserParams() {
    this.userParams = new UserParams(this.user);
    return this.userParams;
  }

  getMembers(UserParams) {
    var response = this.memberCache.get(Object.values(UserParams).join('-'));
    if (response) {
      return of(response);
    }

    let params = getPaginationHeaders(UserParams.pageNumber, UserParams.pageSize);

    params = params.append('minAge', UserParams.minAge.toString());
    params = params.append('maxAge', UserParams.maxAge.toString());
    params = params.append('gender', UserParams.gender);
    params = params.append('orderBy', UserParams.orderBy);
    
    return getPaginatedResult<Member[]>(this.baseUrl + 'users', params, this.http).pipe(map(result => {
      this.memberCache.set(Object.values(UserParams).join('-'), result);
      // console.log(this.memberCache);
      return result;
    }));
  }

  getMember(username: string): Observable<Member> {
    const member = [...this.memberCache.values()].reduce((arr, elem) => arr.concat(elem.result),[]).find((member: Member) => member.username === username);
    // console.log(this.memberCache.values());
    if (member) {
      return of (member);
    }

    return this.http.get<Member>(this.baseUrl + 'users/' + username);
  }

  updateMember(member: Member) {
    return this.http.put(this.baseUrl + 'users', member).pipe(
      map(() => {
        const index = this.members.indexOf(member);
        this.members[index] = member;
      })
    );
  }

  setMainPhoto(photoId: number) {
    return this.http.put(this.baseUrl + 'users/set-main-photo/' + photoId, {});
  }

  deletePhoto(photoId: number) {
    return this.http.delete(this.baseUrl + 'users/delete-photo/' + photoId);
  }

  addLike(username: string) {
    return this.http.post(this.baseUrl + 'likes/' + username, {});
  }

  getLikes(predicate: string, pageNumber: number, pageSize: number) {
    let params = getPaginationHeaders(pageNumber, pageSize);
    params = params.append('predicate', predicate);
    return getPaginatedResult<Partial<Member[]>>(this.baseUrl + 'likes', params, this.http);
  }
}
