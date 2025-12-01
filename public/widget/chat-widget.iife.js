"use strict";var ChatWidget=(()=>{function me(i){if(!i)return"";try{let e=De(i);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),i}}function De(i){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return i.replace(/[&<>"']/g,t=>e[t]||t)}function Ce(i,e){let t=i.relay,o=i.uiConfig.connection;return{widgetId:t.widgetId,licenseKey:t.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,threadId:e.threadId,context:e.context,customContext:e.customContext??o?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??o?.extraInputs}}function Me(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let i=new Uint8Array(16);crypto.getRandomValues(i),i[6]=i[6]&15|64,i[8]=i[8]&63|128;let e=Array.from(i).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var Ve="chat-widget-session-",Ge="chat-widget-thread-",_e="chat-widget-session-start-",te=class{constructor(e){this.sessionId=null;this.threadId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${Ve}${e}`,this.threadKey=`${Ge}${e}`,this.startTimeKey=`${_e}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.threadKey),o=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.threadId=t,this.startTime=o?new Date(o):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString())),this.threadId&&sessionStorage.setItem(this.threadKey,this.threadId)}getSessionId(){return this.sessionId||(this.sessionId=Me(),this.startTime=new Date,this.saveSession()),this.sessionId}getThreadId(){return this.threadId}setThreadId(e){this.threadId=e,this.saveSession()}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.threadKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.threadId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};var Ye={none:0,small:6,medium:12,large:18,pill:9999},$e={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function Se(i,e,t=0){let o=[98,96,92,88,80,70,60,50,40,30,22,14,8],n=e*2,s={};return o.forEach((f,w)=>{let a=Math.max(0,Math.min(100,f+t*2));s[`--cw-gray-${w}`]=`hsl(${i}, ${n}%, ${a}%)`}),s}function Ze(i,e,t,o){if(o){let n=5+e*2,s=10+t*.5;return{bg:`hsl(${i}, ${n}%, ${s}%)`,surface:`hsl(${i}, ${n}%, ${s+5}%)`,composerSurface:`hsl(${i}, ${n}%, ${s+5}%)`,border:`hsla(${i}, ${n}%, 90%, 0.08)`,text:`hsl(${i}, ${Math.max(0,n-10)}%, 90%)`,subText:`hsl(${i}, ${Math.max(0,n-10)}%, 60%)`,hoverSurface:`hsla(${i}, ${n}%, 90%, 0.05)`}}else{let n=10+e*3,s=98-t*2;return{bg:`hsl(${i}, ${n}%, ${s}%)`,surface:`hsl(${i}, ${n}%, ${s-5}%)`,composerSurface:`hsl(${i}, ${n}%, 100%)`,border:`hsla(${i}, ${n}%, 10%, 0.08)`,text:`hsl(${i}, ${n}%, 10%)`,subText:`hsl(${i}, ${n}%, 40%)`,hoverSurface:`hsla(${i}, ${n}%, 10%, 0.05)`}}}function Ee(i,e){let t=parseInt(i.replace("#",""),16),o=Math.min(255,Math.floor((t>>16)+(255-(t>>16))*e)),n=Math.min(255,Math.floor((t>>8&255)+(255-(t>>8&255))*e)),s=Math.min(255,Math.floor((t&255)+(255-(t&255))*e));return`#${(o<<16|n<<8|s).toString(16).padStart(6,"0")}`}function Te(i,e){let t=parseInt(i.replace("#",""),16),o=Math.max(0,Math.floor((t>>16)*(1-e))),n=Math.max(0,Math.floor((t>>8&255)*(1-e))),s=Math.max(0,Math.floor((t&255)*(1-e)));return`#${(o<<16|n<<8|s).toString(16).padStart(6,"0")}`}function ke(i,e=1){let t=.15+e*.05;return{"--cw-accent-primary":i,"--cw-accent-hover":Te(i,t),"--cw-accent-active":Te(i,t*1.5),"--cw-accent-light":Ee(i,.9),"--cw-accent-lighter":Ee(i,.95)}}function Ie(i){let e=i.theme,t=e?.colorScheme||i.style.theme||"light",o=t==="dark",n={"--cw-primary-color":i.style.primaryColor,"--cw-bg-color":i.style.backgroundColor,"--cw-text-color":i.style.textColor,"--cw-font-family":i.style.fontFamily,"--cw-font-size":`${i.style.fontSize}px`,"--cw-corner-radius":`${i.style.cornerRadius}px`};n["--cw-color-scheme"]=t;let s=e?.radius||"medium",f=Ye[s]??12;n["--cw-radius-sm"]=`${Math.max(0,f-4)}px`,n["--cw-radius-md"]=`${f}px`,n["--cw-radius-lg"]=`${f+4}px`,n["--cw-radius-xl"]=`${f+8}px`,n["--cw-radius-full"]=s==="pill"?"9999px":`${f*2}px`;let w=e?.density||"normal",a=$e[w]??$e.normal;n["--cw-spacing-xs"]=`${4*a.padding}px`,n["--cw-spacing-sm"]=`${8*a.padding}px`,n["--cw-spacing-md"]=`${12*a.padding}px`,n["--cw-spacing-lg"]=`${16*a.padding}px`,n["--cw-spacing-xl"]=`${24*a.padding}px`,n["--cw-gap"]=`${8*a.gap}px`;let d=e?.typography;d&&(d.baseSize&&(n["--cw-font-size"]=`${d.baseSize}px`,n["--cw-font-size-sm"]=`${d.baseSize-2}px`,n["--cw-font-size-lg"]=`${d.baseSize+2}px`,n["--cw-font-size-xl"]=`${d.baseSize+4}px`),d.fontFamily&&(n["--cw-font-family"]=d.fontFamily),d.fontFamilyMono&&(n["--cw-font-family-mono"]=d.fontFamilyMono));let p=e?.color?.grayscale;if(p){let C=Se(p.hue,p.tint,p.shade??0);Object.assign(n,C);let M=Ze(p.hue,p.tint,p.shade??0,o);n["--cw-surface-bg"]=M.bg,n["--cw-surface-fg"]=M.surface,n["--cw-composer-surface"]=M.composerSurface,n["--cw-border-color"]=M.border,n["--cw-text-color"]=M.text,n["--cw-icon-color"]=M.subText,n["--cw-hover-surface"]=M.hoverSurface}else{let C=Se(220,0,0);Object.assign(n,C)}let y=e?.color?.accent;if(y){let C=ke(y.primary,y.level??1);Object.assign(n,C),n["--cw-primary-color"]=y.primary}else{let C=ke(i.style.primaryColor,1);Object.assign(n,C)}let z=e?.color?.surface;z?(n["--cw-surface-bg"]=z.background,n["--cw-surface-fg"]=z.foreground):p||(n["--cw-surface-bg"]=o?"#1a1a1a":"#ffffff",n["--cw-surface-fg"]=o?"#2a2a2a":"#f8fafc",n["--cw-composer-surface"]=o?"#262626":"#ffffff",n["--cw-border-color"]=o?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",n["--cw-hover-surface"]=o?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let h=e?.color?.icon;h?n["--cw-icon-color"]=h:p||(n["--cw-icon-color"]=o?"#a1a1aa":"#6b7280");let F=e?.color?.userMessage;return F?(n["--cw-user-msg-text"]=F.text,n["--cw-user-msg-bg"]=F.background):y?(n["--cw-user-msg-text"]="#ffffff",n["--cw-user-msg-bg"]=y.primary):(n["--cw-user-msg-text"]=n["--cw-text-color"]||(o?"#e5e5e5":"#111827"),n["--cw-user-msg-bg"]=n["--cw-surface-fg"]||(o?"#262626":"#f3f4f6")),n["--cw-assistant-msg-text"]=n["--cw-text-color"]||(o?"#e5e5e5":"#1f2937"),n["--cw-assistant-msg-bg"]="transparent",n["--cw-border-color-strong"]=o?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",n["--cw-shadow-sm"]=o?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",n["--cw-shadow-md"]=o?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",n["--cw-shadow-lg"]=o?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",n}function We(i){let e=i.theme?.typography?.fontSources;return!e||e.length===0?i.style.customFontUrl?i.style.customFontUrl:"":e.map(t=>`
@font-face {
  font-family: '${t.family}';
  src: url('${t.src}');
  font-weight: ${t.weight||400};
  font-style: ${t.style||"normal"};
  font-display: ${t.display||"swap"};
}
  `).join(`
`)}var Le={help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',sparkles:'<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',pen:'<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',server:'<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',terminal:'<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',message:'<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>',rocket:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',lightbulb:'<line x1="9" y1="18" x2="15" y2="18"/><line x1="10" y1="22" x2="14" y2="22"/><path d="M15.09 14c.18-.98.65-1.74 1.41-2.5A4.65 4.65 0 0 0 18 8 6 6 0 0 0 6 8c0 1 .23 2.23 1.5 3.5A4.61 4.61 0 0 1 8.91 14"/>',search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',globe:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',cpu:'<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',compass:'<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',mapPin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',mic:'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',briefcase:'<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',coffee:'<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',cloud:'<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',calendar:'<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',gift:'<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',creditCard:'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>'};function Xe(i){return Le[i]||Le.message}function ue(i){let e=[],t=!1,o=0,n=[],s=i.uiConfig||{},f=new te(i.relay.licenseKey||"default"),w=s.theme?.colorScheme||s.style?.theme||"light",a=w==="dark",d=r=>{switch(r){case"System":return'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';case"Space Grotesk":return'"Space Grotesk", sans-serif';case"Comfortaa":return'"Comfortaa", cursive';case"Bricolage Grotesque":return'"Bricolage Grotesque", sans-serif';case"OpenAI Sans":return'"Inter", sans-serif';case"system-ui":return'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';default:return r?`"${r}", sans-serif`:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}},p=s.theme?.typography?.fontFamily||s.style?.fontFamily||"System",y=d(p),z=s.theme?.typography?.baseSize||s.style?.fontSize||16,h={branding:{companyName:s.branding?.companyName||"Support",welcomeText:s.branding?.welcomeText||s.startScreen?.greeting||"How can we help you?",firstMessage:s.branding?.firstMessage||"",logoUrl:s.branding?.logoUrl},style:{theme:w,primaryColor:s.theme?.color?.accent?.primary||s.style?.primaryColor||"#0ea5e9",backgroundColor:s.theme?.color?.surface?.background||s.style?.backgroundColor||(a?"#1a1a1a":"#ffffff"),textColor:s.style?.textColor||(a?"#e5e5e5":"#1f2937"),fontFamily:y,fontSize:z,position:s.style?.position||"bottom-right",cornerRadius:s.style?.cornerRadius||12},features:{fileAttachmentsEnabled:s.composer?.attachments?.enabled||s.features?.fileAttachmentsEnabled||!1,allowedExtensions:s.composer?.attachments?.accept||s.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:s.composer?.attachments?.maxSize?s.composer.attachments.maxSize/1024:s.features?.maxFileSizeKB||5e3},connection:s.connection,license:s.license,theme:s.theme,startScreen:s.startScreen,composer:s.composer},F=s.startScreen?.greeting||s.branding?.welcomeText||"How can I help you today?",C=Ie(h),M=We(h),R,b,$,I,E,A,B,G=s.theme?.color?.grayscale,N=s.theme?.color?.surface;if(G){let r=G.hue||220,l=G.tint||10,m=G.shade||50;if(a){let c=5+l*2,g=10+m*.5;R=`hsl(${r}, ${c}%, ${g}%)`,E=`hsl(${r}, ${c}%, ${g+5}%)`,A=E,I=`hsla(${r}, ${c}%, 90%, 0.08)`,b=`hsl(${r}, ${Math.max(0,c-10)}%, 90%)`,$=`hsl(${r}, ${Math.max(0,c-10)}%, 60%)`,B=`hsla(${r}, ${c}%, 90%, 0.05)`}else{let c=10+l*3,g=98-m*2;R=`hsl(${r}, ${c}%, ${g}%)`,E=`hsl(${r}, ${c}%, ${g-5}%)`,A=`hsl(${r}, ${c}%, 100%)`,I=`hsla(${r}, ${c}%, 10%, 0.08)`,b=`hsl(${r}, ${c}%, 10%)`,$=`hsl(${r}, ${c}%, 40%)`,B=`hsla(${r}, ${c}%, 10%, 0.05)`}}else N?(R=N.background||(a?"#1a1a1a":"#ffffff"),E=N.foreground||(a?"#262626":"#f8fafc"),A=E,I=a?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)",b=a?"#e5e5e5":"#111827",$=a?"#a1a1aa":"#6b7280",B=a?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"):(R=a?"#1a1a1a":"#ffffff",b=a?"#e5e5e5":"#111827",$=a?"#a1a1aa":"#6b7280",I=a?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",E=a?"#262626":"#f3f4f6",A=a?"#262626":"#ffffff",B=a?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");s.theme?.color?.text&&(b=s.theme.color.text),s.theme?.color?.icon&&($=s.theme.color.icon);let oe=s.theme?.color?.accent?.primary||h.style.primaryColor,P=!!s.theme?.color?.accent,re=P?oe:E,ae=P?"#ffffff":b;s.theme?.color?.userMessage&&(re=s.theme.color.userMessage.background||re,ae=s.theme.color.userMessage.text||ae);let He=()=>{switch(s.theme?.radius||"medium"){case"none":return"0px";case"small":return"4px";case"medium":return"8px";case"large":return"16px";case"pill":return"24px";default:return"12px"}},ze=s.theme?.radius==="pill"?"20px":He(),ce=(()=>{switch(s.theme?.density||"normal"){case"compact":return"1rem";case"spacious":return"2.5rem";default:return"1.5rem"}})(),fe={"Space Grotesk":"Space+Grotesk:wght@400;500;600;700",Comfortaa:"Comfortaa:wght@400;500;600;700","Bricolage Grotesque":"Bricolage+Grotesque:wght@400;500;600;700",Inter:"Inter:wght@400;500;600;700"};if(fe[p]){let r=document.createElement("link");r.rel="stylesheet",r.href=`https://fonts.googleapis.com/css2?family=${fe[p]}&display=swap`,document.head.appendChild(r)}let le=s.theme?.typography?.fontSources;le&&le.length>0&&le.forEach(r=>{if(r.src){let l=document.createElement("style");l.textContent=r.src,document.head.appendChild(l)}});let de=document.createElement("style");de.id="n8n-chat-widget-styles",de.textContent=`
    ${M}

    #n8n-chat-widget-container {
      ${Object.entries(C).map(([r,l])=>`${r}: ${l};`).join(`
      `)}
    }

    /* Typing animation */
    .n8n-typing-container {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }
    .n8n-typing-dot {
      width: 6px;
      height: 6px;
      background: currentColor;
      border-radius: 50%;
      opacity: 0.6;
      animation: n8n-bounce 1.4s infinite ease-in-out both;
    }
    .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes n8n-bounce {
      0%, 60%, 100% { transform: translateY(0); }
      30% { transform: translateY(-4px); }
    }

    /* Scrollbar styling */
    #n8n-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    #n8n-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #n8n-chat-messages::-webkit-scrollbar-thumb {
      background: ${I};
      border-radius: 3px;
    }

    /* Starter prompts - matching preview */
    .n8n-starter-prompt {
      display: flex;
      align-items: center;
      gap: 12px;
      width: 100%;
      padding: 8px;
      background: transparent;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
      color: ${b};
      text-align: left;
      transition: background 0.15s;
    }
    .n8n-starter-prompt:hover {
      background: ${B};
    }
    .n8n-starter-prompt-icon {
      color: ${$};
      opacity: 0.7;
      transition: opacity 0.15s;
    }
    .n8n-starter-prompt:hover .n8n-starter-prompt-icon {
      opacity: 1;
    }

    /* Markdown content styling */
    .n8n-message-content p { margin: 0 0 0.5em 0; }
    .n8n-message-content p:last-child { margin-bottom: 0; }
    .n8n-message-content code {
      background: ${E};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 0.9em;
    }
    .n8n-message-content pre {
      background: ${a?"#0d0d0d":"#1e293b"};
      color: #e2e8f0;
      padding: 12px;
      border-radius: 8px;
      overflow-x: auto;
      margin: 0.5em 0;
    }
    .n8n-message-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }

    /* Animation */
    @keyframes n8n-fade-in {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .n8n-animate-in {
      animation: n8n-fade-in 0.3s ease-out;
    }
  `,document.head.appendChild(de);let j=document.createElement("div");j.id="n8n-chat-widget-container",j.style.cssText=`
    position: fixed;
    ${h.style.position==="bottom-right"?"right: 24px;":"left: 24px;"}
    bottom: 24px;
    z-index: 999999;
    font-family: ${h.style.fontFamily};
    font-size: ${h.style.fontSize}px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `,document.body.appendChild(j);let _,U;P?(_=oe,U="#ffffff"):N?(_=N.foreground||"#f8fafc",U=a?"#e5e5e5":"#111827"):(_=a?"#ffffff":"#000000",U=a?"#000000":"#ffffff");let v=document.createElement("button");v.id="n8n-chat-bubble",v.setAttribute("aria-label","Open chat"),v.style.cssText=`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${_};
    border: none;
    cursor: pointer;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
  `;let Y=document.createElement("div");Y.style.cssText="position: relative; width: 24px; height: 24px;";let Z=document.createElement("span");Z.id="n8n-bubble-message-icon",Z.innerHTML=`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${U}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 1; transform: rotate(0deg) scale(1);">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
    </svg>
  `;let X=document.createElement("span");X.id="n8n-bubble-close-icon",X.innerHTML=`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${U}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 0; transform: rotate(-90deg) scale(0.5);">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  `,Y.appendChild(Z),Y.appendChild(X),v.appendChild(Y);let L=Z.querySelector("svg"),H=X.querySelector("svg");v.addEventListener("mouseenter",()=>{v.style.transform="scale(1.05)"}),v.addEventListener("mouseleave",()=>{v.style.transform="scale(1)"}),v.addEventListener("click",Ne);let u=document.createElement("div");u.id="n8n-chat-window",u.style.cssText=`
    display: none;
    width: 380px;
    height: 600px;
    max-height: 80vh;
    background: ${R};
    color: ${b};
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 16px;
    border: 1px solid ${I};
    position: relative;
    transform-origin: bottom right;
  `,j.appendChild(u),j.appendChild(v);let J=document.createElement("div");J.style.cssText=`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  `,J.innerHTML=`
    <div style="pointer-events: auto;"></div>
    <div style="display: flex; align-items: center; gap: 4px; pointer-events: auto;">
      <button id="n8n-clear-history" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        color: ${$};
        transition: background 0.15s;
      " title="Clear History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  `,u.appendChild(J);let S=document.createElement("div");S.id="n8n-chat-messages",S.style.cssText=`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: ${ce};
  `,u.appendChild(S);let W=document.createElement("div");W.id="n8n-start-screen",W.style.cssText=`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `;let pe=document.createElement("h2");pe.style.cssText=`
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: ${b};
  `,pe.textContent=F,W.appendChild(pe);let ye=h.startScreen?.prompts||[];if(ye.length>0){let r=document.createElement("div");r.style.cssText="display: flex; flex-direction: column; gap: 4px;",ye.forEach(l=>{let m=document.createElement("button");m.className="n8n-starter-prompt";let c=Xe(l.icon||"message");m.innerHTML=`
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${c}
          </svg>
        </span>
        <span style="font-weight: 500;">${l.label}</span>
      `,m.addEventListener("click",()=>{ve(l.prompt||l.label)}),r.appendChild(m)}),W.appendChild(r)}S.appendChild(W);let T=document.createElement("div");T.id="n8n-messages-list",T.style.cssText=`
    display: none;
    flex: 1;
    flex-direction: column;
    padding-top: 48px;
    gap: 16px;
  `,S.appendChild(T);let k=document.createElement("div");k.style.cssText=`
    padding: ${ce};
    padding-top: 0;
  `;let Fe=s.theme?.radius==="none"?"0px":"999px",Re=h.composer?.placeholder||"Type a message...",K=`
    <form id="n8n-composer-form" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: ${A};
      border-radius: ${Fe};
      border: 1px solid ${I};
      box-shadow: ${a?"none":"0 4px 12px rgba(0,0,0,0.05)"};
      transition: box-shadow 0.15s;
    ">
  `;if(h.features.fileAttachmentsEnabled?K+=`
      <input type="file" id="n8n-file-input" multiple accept="${h.features.allowedExtensions.map(r=>"."+r).join(",")}" style="display: none;" />
      <button type="button" id="n8n-attach-btn" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        color: ${$};
        transition: background 0.15s;
        flex-shrink: 0;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    `:K+='<div style="width: 8px;"></div>',K+=`
    <input type="text" id="n8n-chat-input" placeholder="${Re}" style="
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: ${b};
      padding: 4px 8px;
    " />
  `,K+=`
    <button type="submit" id="n8n-send-btn" style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${a?"#404040":"#f3f4f6"};
      border: none;
      cursor: pointer;
      color: ${a?"#737373":"#a3a3a3"};
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    </button>
  </form>
  `,k.innerHTML=K,u.appendChild(k),h.composer?.disclaimer){let r=document.createElement("div");r.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px ${ce};
      font-size: 10px;
      color: ${$};
      opacity: 0.7;
    `,r.textContent=h.composer.disclaimer,u.appendChild(r)}let Ae=k.querySelector("#n8n-composer-form"),O=k.querySelector("#n8n-chat-input"),Q=k.querySelector("#n8n-send-btn"),xe=k.querySelector("#n8n-attach-btn"),q=k.querySelector("#n8n-file-input"),Be=J.querySelector("#n8n-clear-history");function be(){O.value.trim().length>0?(Q.style.background=P?oe:a?"#e5e5e5":"#171717",Q.style.color=P?"#ffffff":a?"#171717":"#ffffff"):(Q.style.background=a?"#404040":"#f3f4f6",Q.style.color=a?"#737373":"#a3a3a3")}O.addEventListener("input",be),Ae.addEventListener("submit",r=>{r.preventDefault(),ve()}),Be.addEventListener("click",()=>{e.length=0,T.innerHTML="",T.style.display="none",W.style.display="flex"}),xe&&q&&(xe.addEventListener("click",()=>q.click()),q.addEventListener("change",r=>{let l=r.target.files;l&&(n=Array.from(l))}));function Ne(){t=!t,t?(u.style.display="flex",u.style.opacity="0",u.style.transform="scale(0.95) translateY(16px)",requestAnimationFrame(()=>{u.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",u.style.opacity="1",u.style.transform="scale(1) translateY(0)"}),L&&(L.style.opacity="0",L.style.transform="rotate(90deg) scale(0.5)"),H&&(H.style.opacity="1",H.style.transform="rotate(0deg) scale(1)"),O.focus()):(u.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",u.style.opacity="0",u.style.transform="scale(0.95) translateY(16px)",setTimeout(()=>{u.style.display="none"},300),L&&(L.style.opacity="1",L.style.transform="rotate(0deg) scale(1)"),H&&(H.style.opacity="0",H.style.transform="rotate(-90deg) scale(0.5)"))}function Pe(){W.style.display="none",T.style.display="flex"}function we(r,l,m=!1){e.length===0&&Pe();let c={id:`msg-${++o}`,role:r,content:l,timestamp:Date.now()};e.push(c);let g=document.createElement("div");g.id=c.id,g.className="n8n-animate-in",g.style.cssText=`
      display: flex;
      flex-direction: column;
      ${r==="user"?"align-items: flex-end;":"align-items: flex-start;"}
    `;let x=document.createElement("div");return x.className="n8n-message-content",x.style.cssText=`
      max-width: 85%;
      padding: 10px 14px;
      border-radius: ${ze};
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      ${r==="user"?`background: ${re}; color: ${ae};`:`background: transparent; color: ${b};`}
    `,r==="assistant"?m?x.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:x.innerHTML=me(l):x.textContent=l,g.appendChild(x),T.appendChild(g),S.scrollTop=S.scrollHeight,c}function ge(r,l){let m=T.querySelector(`#${r}`);if(!m)return;let c=m.querySelector(".n8n-message-content");c&&(c.innerHTML=me(l));let g=e.find(x=>x.id===r);g&&(g.content=l),S.scrollTop=S.scrollHeight}async function ve(r){let l=r||O.value.trim();if(!l)return;we("user",l),O.value="",be();let m=we("assistant","",!0);try{await Ke(l,m.id)}catch(c){console.error("[N8n Chat Widget] Error sending message:",c),ge(m.id,"Sorry, there was an error processing your message. Please try again.")}}function je(){try{let r=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(r.searchParams),domain:window.location.hostname}}catch{return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function Ue(r){return new Promise((l,m)=>{let c=new FileReader;c.onload=()=>{let x=c.result.split(",")[1];l({name:r.name,type:r.type,data:x,size:r.size})},c.onerror=()=>m(new Error(`Failed to read file: ${r.name}`)),c.readAsDataURL(r)})}async function Ke(r,l){let m=i.relay.relayUrl,c=f.getSessionId();try{let g=h.connection?.captureContext!==!1,x;n.length>0&&h.features.fileAttachmentsEnabled&&(x=await Promise.all(n.map(Ue)),n=[],q&&(q.value=""));let Oe=Ce(i,{message:r,sessionId:c,context:g?je():void 0,customContext:h.connection?.customContext,extraInputs:h.connection?.extraInputs,attachments:x}),ee=await fetch(m,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Oe)});if(!ee.ok)throw new Error(`HTTP ${ee.status}: ${ee.statusText}`);let he=await ee.json(),qe=he.response||he.message||he.output||"No response received";ge(l,qe)}catch(g){throw console.error("[N8n Chat Widget] Error sending message:",g),ge(l,"Sorry, there was an error connecting to the server. Please try again."),g}}}var ne=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let o=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(t.style.cssText=o,e.showHeader){let f=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(f)}let n=this.createMessagesArea();t.appendChild(n);let s=this.createInputArea();return t.appendChild(s),t}createHeader(e,t){let o=document.createElement("div");o.className="chat-header",o.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let n=document.createElement("div");if(n.textContent=e,o.appendChild(n),t){let s=document.createElement("button");s.className="minimize-btn",s.innerHTML="\xD7",s.style.cssText=`
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      `,o.appendChild(s)}return o}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `,this.config.branding?.firstMessage){let t=document.createElement("div");t.className="message assistant",t.style.cssText=`
        background: #f0f0f0;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      `,t.textContent=this.config.branding.firstMessage,e.appendChild(t)}return e}createInputArea(){let e=document.createElement("div");e.className="chat-input-area",e.style.cssText=`
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    `;let t=document.createElement("input");t.className="chat-input",t.type="text",t.placeholder="Type your message...",t.style.cssText=`
      flex: 1;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
    `;let o=document.createElement("button");return o.className="send-btn",o.textContent="Send",o.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(o),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,o=window.innerHeight;t<768&&e.classList.add("mobile"),t>o&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var se=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let o=document.createElement("div");o.textContent=e.title,t.appendChild(o);let n=document.createElement("div");if(n.style.cssText="display: flex; gap: 8px; align-items: center;",e.showFullscreenToggle&&e.onFullscreenToggle){let s=this.createButton({className:"fullscreen-toggle-btn",innerHTML:"\u25F1",title:"Enter fullscreen",onClick:e.onFullscreenToggle});n.appendChild(s)}if(e.showMinimize&&e.onMinimize){let s=this.createButton({className:"minimize-btn",innerHTML:"\xD7",title:"Close",fontSize:"24px",onClick:e.onMinimize});n.appendChild(s)}return t.appendChild(n),t}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `,this.config.branding?.firstMessage){let t=document.createElement("div");t.className="message assistant",t.style.cssText=`
        background: #f0f0f0;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      `,t.textContent=this.config.branding.firstMessage,e.appendChild(t)}return e}createInputArea(){let e=document.createElement("div");e.className="chat-input-area",e.style.cssText=`
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    `;let t=document.createElement("input");t.className="chat-input",t.type="text",t.placeholder="Type your message...",t.style.cssText=`
      flex: 1;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
    `;let o=document.createElement("button");return o.className="send-btn",o.textContent="Send",o.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(o),e}createButton(e){let t=document.createElement("button");return t.className=e.className,t.innerHTML=e.innerHTML,t.title=e.title,t.style.cssText=`
      background: none;
      border: none;
      color: white;
      font-size: ${e.fontSize||"20px"};
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    `,t.addEventListener("click",e.onClick),t}};var D=class{constructor(e){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.uiBuilder=new se(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.bubble.addEventListener("click",()=>{this.toggleChatWindow()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),{chatWindow:this.chatWindow,bubble:this.bubble}}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999998;
    `,e}createChatWindow(){let e=document.createElement("div");e.className="chat-window",e.id="n8n-chat-window",e.style.cssText=`
      position: absolute;
      bottom: 90px;
      right: 20px;
      width: 400px;
      height: 600px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let o=this.uiBuilder.createMessagesArea();e.appendChild(o);let n=this.uiBuilder.createInputArea();return e.appendChild(n),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var ie=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var V=class{constructor(e){this.chatWindow=null;ie.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new ne(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new D(this.config),{chatWindow:t}=e.render();this.chatWindow=t}renderNormalMode(){let e=new D(this.config),{chatWindow:t}=e.render();this.chatWindow=t}};if(typeof window<"u"){let i=window;i.Widget=V,i.N8nWidget=V}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",i):i();async function i(){let e=window.ChatWidgetConfig||{},t=e.relay||(e.uiConfig?e.uiConfig.relay:{});if(t&&t.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{ue(e);return}catch(d){console.error("[N8n Chat Widget] Initialization error:",d);return}}let o=t.licenseKey||"",n="",s=!1,f=document.querySelector('div[id^="n8n-chat-"]');!o&&f&&(o=f.id.replace("n8n-chat-",""));let w=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]');if(w&&w.src){let d=new URL(w.src);n=d.origin;let p=d.pathname.match(/\/w\/([A-Za-z0-9]{16})(?:\.js)?$/);if(p&&p[1])o||(o=p[1]),s=!0;else if(!o){let y=d.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);y&&y[1]&&(o=y[1])}}if(n||(n=window.location.origin),!o){console.warn("[N8n Chat Widget] Could not determine widget key.");return}let a=s?`${n}/w/${o}/config`:`${n}/api/widget/${o}/config`;try{let d=await fetch(a);if(!d.ok)throw new Error("Config fetch failed");let p=await d.json(),y={uiConfig:p,relay:{relayUrl:t.relayUrl||p.connection?.relayEndpoint||`${n}/api/chat-relay`,widgetId:t.widgetId||"",licenseKey:o}};window.ChatWidgetConfig=y,ue(y)}catch(d){console.error("[N8n Chat Widget] Boot error:",d),f&&(f.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
