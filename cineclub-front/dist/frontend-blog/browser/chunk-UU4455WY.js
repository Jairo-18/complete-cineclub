import{l as y}from"./chunk-ZUAAQJ5J.js";import{a as h}from"./chunk-HI5P6VLK.js";import{Nc as m,Tc as n,V as d,_ as l}from"./chunk-4XNWJBNU.js";import{a as f,b as u,i as c}from"./chunk-ODN5LVDJ.js";var b=class s{supabase=h;_notificationsService=l(y);_httpClient=l(m);getUsers(){return c(this,arguments,function*(e=1,r=10,t={}){try{let a=(e-1)*r,g=a+r-1,o=this.supabase.from("profile").select(`
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
          `,{count:"exact"}).order("created_at",{ascending:!1}).range(a,g);t.search&&t.search.trim()!==""&&(o=o.or(`fullName.ilike.%${t.search}%,email.ilike.%${t.search}%,username.ilike.%${t.search}%`)),t.roleType&&t.roleType.trim()!==""&&(o=o.eq("roleTypeId",t.roleType)),t.country&&t.country.trim()!==""&&(o=o.eq("country",t.country));let{data:v,count:U,error:p}=yield o;if(p)throw p;return{data:v?.map(i=>u(f({},i),{roleType:Array.isArray(i.roleType)?i.roleType[0]:i.roleType})),count:U}}catch(a){throw console.error("\u274C Error al obtener usuarios:",a.message),this._notificationsService.error("No se pudieron cargar los usuarios."),a}})}getRoleTypes(){return c(this,null,function*(){try{let{data:e,error:r}=yield this.supabase.from("roleType").select("id, code, name").order("name",{ascending:!0});if(r)throw r;return e||[]}catch(e){throw console.error("\u274C Error al obtener roles:",e.message),this._notificationsService.error("No se pudieron cargar los roles."),e}})}getUserEditPanel(e){return this._httpClient.get(`${n.backendUrl}users/${e}`)}updateUserProfile(e,r){return this._httpClient.patch(`${n.backendUrl}users/${e}`,r)}createUser(e){return this._httpClient.post(`${n.backendUrl}users/register`,e)}updateUser(e,r){return this._httpClient.patch(`${n.backendUrl}users/${e}`,r)}deleteUserPanel(e){return this._httpClient.delete(`${n.backendUrl}users/${e}`)}static \u0275fac=function(r){return new(r||s)};static \u0275prov=d({token:s,factory:s.\u0275fac,providedIn:"root"})};export{b as a};
