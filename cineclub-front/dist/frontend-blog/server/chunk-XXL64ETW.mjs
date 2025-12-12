import './polyfills.server.mjs';
import{V as r,_ as o,nd as n,ud as i}from"./chunk-I37AKPGM.mjs";var p=class t{_httpClient=o(n);getUserById(e){return this._httpClient.get(`${i.backendUrl}users/${e}`)}static \u0275fac=function(m){return new(m||t)};static \u0275prov=r({token:t,factory:t.\u0275fac,providedIn:"root"})};export{p as a};
