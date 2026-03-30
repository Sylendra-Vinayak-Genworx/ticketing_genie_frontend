import{c,r as l}from"./index-Z59NuNg7.js";import{u as h}from"./userService-FbK1hOu3.js";/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const u=c("BarChart2",[["line",{x1:"18",x2:"18",y1:"20",y2:"10",key:"1xfpm4"}],["line",{x1:"12",x2:"12",y1:"20",y2:"4",key:"be30l9"}],["line",{x1:"6",x2:"6",y1:"20",y2:"14",key:"1r4le6"}]]);/**
 * @license lucide-react v0.323.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const x=c("ShieldAlert",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"M12 8v4",key:"1got3b"}],["path",{d:"M12 16h.01",key:"1drbdi"}]]);function k(){const[r,s]=l.useState({}),i=l.useCallback(n=>{const a=n.filter(e=>!!e).filter(e=>!r[e]);a.length!==0&&a.forEach(e=>{h.getUserById(e).then(t=>s(o=>({...o,[e]:t.full_name||t.email}))).catch(()=>s(t=>({...t,[e]:e.slice(0,8)+"…"})))})},[r]);return{cache:r,resolve:i}}export{u as B,x as S,k as u};
