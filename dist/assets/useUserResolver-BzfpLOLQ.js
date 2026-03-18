import{c as u,V as i,_ as a,r as l}from"./index-D1phzCOU.js";/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const p=u("BarChart2",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const k=u("ShieldAlert",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]),y={async getAllUsers(){return(await a.get("/auth/users")).data},async getUserById(e){return(await a.get(`/auth/users/${e}`)).data},async createUser(e){return(await a.post("/auth/admin/users",e)).data},async updateUser(e,s){return(await a.patch(`/auth/users/${e}`,s)).data},async getAgentsByLead(e){return(await a.get(`/auth/leads/${e}/agents`)).data},async getUserSkills(e){return(await i.get(`/admin/users/${e}/skills`)).data},async updateUserSkills(e,s){return(await i.put(`/admin/users/${e}/skills`,s)).data}};function f(){const[e,s]=l.useState({}),n=l.useCallback(d=>{const c=d.filter(t=>!!t).filter(t=>!e[t]);c.length!==0&&c.forEach(t=>{y.getUserById(t).then(r=>s(o=>({...o,[t]:r.full_name||r.email}))).catch(()=>s(r=>({...r,[t]:t.slice(0,8)+"…"})))})},[e]);return{cache:e,resolve:n}}export{p as B,k as S,f as u};
