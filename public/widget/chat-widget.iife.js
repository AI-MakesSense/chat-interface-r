"use strict";var ChatWidget=(()=>{function ye(a){if(!a)return"";try{let e=Ge(a);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),a}}function Ge(a){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return a.replace(/[&<>"']/g,t=>e[t]||t)}function $e(a,e){let t=a.relay,o=a.uiConfig.connection;return{widgetId:t.widgetId,licenseKey:t.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,threadId:e.threadId,context:e.context,customContext:e.customContext??o?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??o?.extraInputs}}function Se(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let a=new Uint8Array(16);crypto.getRandomValues(a),a[6]=a[6]&15|64,a[8]=a[8]&63|128;let e=Array.from(a).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var Ze="chat-widget-session-",_e="chat-widget-thread-",Ye="chat-widget-session-start-",te=class{constructor(e){this.sessionId=null;this.threadId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${Ze}${e}`,this.threadKey=`${_e}${e}`,this.startTimeKey=`${Ye}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.threadKey),o=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.threadId=t,this.startTime=o?new Date(o):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString())),this.threadId&&sessionStorage.setItem(this.threadKey,this.threadId)}getSessionId(){return this.sessionId||(this.sessionId=Se(),this.startTime=new Date,this.saveSession()),this.sessionId}getThreadId(){return this.threadId}setThreadId(e){this.threadId=e,this.saveSession()}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.threadKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.threadId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};var Xe={none:0,small:6,medium:12,large:18,pill:9999},Ee={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function Te(a,e,t=0){let o=[98,96,92,88,80,70,60,50,40,30,22,14,8],n=e*2,i={};return o.forEach((u,M)=>{let r=Math.max(0,Math.min(100,u+t*2));i[`--cw-gray-${M}`]=`hsl(${a}, ${n}%, ${r}%)`}),i}function Je(a,e,t,o){if(o){let n=5+e*2,i=10+t*.5;return{bg:`hsl(${a}, ${n}%, ${i}%)`,surface:`hsl(${a}, ${n}%, ${i+5}%)`,composerSurface:`hsl(${a}, ${n}%, ${i+5}%)`,border:`hsla(${a}, ${n}%, 90%, 0.08)`,text:`hsl(${a}, ${Math.max(0,n-10)}%, 90%)`,subText:`hsl(${a}, ${Math.max(0,n-10)}%, 60%)`,hoverSurface:`hsla(${a}, ${n}%, 90%, 0.05)`}}else{let n=10+e*3,i=98-t*2;return{bg:`hsl(${a}, ${n}%, ${i}%)`,surface:`hsl(${a}, ${n}%, ${i-5}%)`,composerSurface:`hsl(${a}, ${n}%, 100%)`,border:`hsla(${a}, ${n}%, 10%, 0.08)`,text:`hsl(${a}, ${n}%, 10%)`,subText:`hsl(${a}, ${n}%, 40%)`,hoverSurface:`hsla(${a}, ${n}%, 10%, 0.05)`}}}function ke(a,e){let t=parseInt(a.replace("#",""),16),o=Math.min(255,Math.floor((t>>16)+(255-(t>>16))*e)),n=Math.min(255,Math.floor((t>>8&255)+(255-(t>>8&255))*e)),i=Math.min(255,Math.floor((t&255)+(255-(t&255))*e));return`#${(o<<16|n<<8|i).toString(16).padStart(6,"0")}`}function He(a,e){let t=parseInt(a.replace("#",""),16),o=Math.max(0,Math.floor((t>>16)*(1-e))),n=Math.max(0,Math.floor((t>>8&255)*(1-e))),i=Math.max(0,Math.floor((t&255)*(1-e)));return`#${(o<<16|n<<8|i).toString(16).padStart(6,"0")}`}function Le(a,e=1){let t=.15+e*.05;return{"--cw-accent-primary":a,"--cw-accent-hover":He(a,t),"--cw-accent-active":He(a,t*1.5),"--cw-accent-light":ke(a,.9),"--cw-accent-lighter":ke(a,.95)}}function Ie(a){let e=a.theme,t=e?.colorScheme||a.style.theme||"light",o=t==="dark",n={"--cw-primary-color":a.style.primaryColor,"--cw-bg-color":a.style.backgroundColor,"--cw-text-color":a.style.textColor,"--cw-font-family":a.style.fontFamily,"--cw-font-size":`${a.style.fontSize}px`,"--cw-corner-radius":`${a.style.cornerRadius}px`};n["--cw-color-scheme"]=t;let i=e?.radius||"medium",u=Xe[i]??12;n["--cw-radius-sm"]=`${Math.max(0,u-4)}px`,n["--cw-radius-md"]=`${u}px`,n["--cw-radius-lg"]=`${u+4}px`,n["--cw-radius-xl"]=`${u+8}px`,n["--cw-radius-full"]=i==="pill"?"9999px":`${u*2}px`;let M=e?.density||"normal",r=Ee[M]??Ee.normal;n["--cw-spacing-xs"]=`${4*r.padding}px`,n["--cw-spacing-sm"]=`${8*r.padding}px`,n["--cw-spacing-md"]=`${12*r.padding}px`,n["--cw-spacing-lg"]=`${16*r.padding}px`,n["--cw-spacing-xl"]=`${24*r.padding}px`,n["--cw-gap"]=`${8*r.gap}px`;let h=e?.typography;h&&(h.baseSize&&(n["--cw-font-size"]=`${h.baseSize}px`,n["--cw-font-size-sm"]=`${h.baseSize-2}px`,n["--cw-font-size-lg"]=`${h.baseSize+2}px`,n["--cw-font-size-xl"]=`${h.baseSize+4}px`),h.fontFamily&&(n["--cw-font-family"]=h.fontFamily),h.fontFamilyMono&&(n["--cw-font-family-mono"]=h.fontFamilyMono));let g=e?.color?.grayscale;if(g){let x=Te(g.hue,g.tint,g.shade??0);Object.assign(n,x);let b=Je(g.hue,g.tint,g.shade??0,o);n["--cw-surface-bg"]=b.bg,n["--cw-surface-fg"]=b.surface,n["--cw-composer-surface"]=b.composerSurface,n["--cw-border-color"]=b.border,n["--cw-text-color"]=b.text,n["--cw-icon-color"]=b.subText,n["--cw-hover-surface"]=b.hoverSurface}else{let x=Te(220,0,0);Object.assign(n,x)}let C=e?.color?.accent;if(C){let x=Le(C.primary,C.level??1);Object.assign(n,x),n["--cw-primary-color"]=C.primary}else{let x=Le(a.style.primaryColor,1);Object.assign(n,x)}let E=e?.color?.surface;E?(n["--cw-surface-bg"]=E.background,n["--cw-surface-fg"]=E.foreground):g||(n["--cw-surface-bg"]=o?"#1a1a1a":"#ffffff",n["--cw-surface-fg"]=o?"#2a2a2a":"#f8fafc",n["--cw-composer-surface"]=o?"#262626":"#ffffff",n["--cw-border-color"]=o?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",n["--cw-hover-surface"]=o?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let d=e?.color?.icon;d?n["--cw-icon-color"]=d:g||(n["--cw-icon-color"]=o?"#a1a1aa":"#6b7280");let f=e?.color?.userMessage;return f?(n["--cw-user-msg-text"]=f.text,n["--cw-user-msg-bg"]=f.background):C?(n["--cw-user-msg-text"]="#ffffff",n["--cw-user-msg-bg"]=C.primary):(n["--cw-user-msg-text"]=n["--cw-text-color"]||(o?"#e5e5e5":"#111827"),n["--cw-user-msg-bg"]=n["--cw-surface-fg"]||(o?"#262626":"#f3f4f6")),n["--cw-assistant-msg-text"]=n["--cw-text-color"]||(o?"#e5e5e5":"#1f2937"),n["--cw-assistant-msg-bg"]="transparent",n["--cw-border-color-strong"]=o?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",n["--cw-shadow-sm"]=o?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",n["--cw-shadow-md"]=o?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",n["--cw-shadow-lg"]=o?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",n}function ze(a){let e=a.theme?.typography?.fontSources;return!e||e.length===0?a.style.customFontUrl?a.style.customFontUrl:"":e.map(t=>`
@font-face {
  font-family: '${t.family}';
  src: url('${t.src}');
  font-weight: ${t.weight||400};
  font-style: ${t.style||"normal"};
  font-display: ${t.display||"swap"};
}
  `).join(`
`)}var We={sparkles:'<path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/>',message:'<path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>',lightbulb:'<path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/>',rocket:'<path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/>',zap:'<polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>',star:'<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',heart:'<path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/>',search:'<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',messageSquare:'<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',messagesSquare:'<path d="M14 9a2 2 0 0 1-2 2H6l-4 4V4c0-1.1.9-2 2-2h8a2 2 0 0 1 2 2v5Z"/><path d="M18 9h2a2 2 0 0 1 2 2v11l-4-4h-6a2 2 0 0 1-2-2v-1"/>',mail:'<rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',phone:'<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',send:'<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>',atSign:'<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-3.92 7.94"/>',target:'<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',trendingUp:'<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',activity:'<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>',play:'<polygon points="5 3 19 12 5 21 5 3"/>',wand:'<path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/>',flame:'<path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>',code:'<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',terminal:'<polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/>',server:'<rect x="2" y="2" width="20" height="8" rx="2" ry="2"/><rect x="2" y="14" width="20" height="8" rx="2" ry="2"/><line x1="6" y1="6" x2="6.01" y2="6"/><line x1="6" y1="18" x2="6.01" y2="18"/>',cpu:'<rect x="4" y="4" width="16" height="16" rx="2" ry="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/>',database:'<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>',braces:'<path d="M8 3H7a2 2 0 0 0-2 2v5a2 2 0 0 1-2 2 2 2 0 0 1 2 2v5c0 1.1.9 2 2 2h1"/><path d="M16 21h1a2 2 0 0 0 2-2v-5c0-1.1.9-2 2-2a2 2 0 0 1-2-2V5a2 2 0 0 0-2-2h-1"/>',fileCode:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><path d="m10 13-2 2 2 2"/><path d="m14 17 2-2-2-2"/>',globe:'<circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>',wifi:'<path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/>',pen:'<path d="m12 19 7-7 3 3-7 7-3-3z"/><path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"/><path d="m2 2 7.586 7.586"/><circle cx="11" cy="11" r="2"/>',pencil:'<path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/>',edit:'<path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>',palette:'<circle cx="13.5" cy="6.5" r="0.5"/><circle cx="17.5" cy="10.5" r="0.5"/><circle cx="8.5" cy="7.5" r="0.5"/><circle cx="6.5" cy="12.5" r="0.5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.555C21.965 6.012 17.461 2 12 2z"/>',image:'<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',camera:'<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',video:'<polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>',music:'<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',mic:'<path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/>',film:'<rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"/><line x1="7" y1="2" x2="7" y2="22"/><line x1="17" y1="2" x2="17" y2="22"/><line x1="2" y1="12" x2="22" y2="12"/><line x1="2" y1="7" x2="7" y2="7"/><line x1="2" y1="17" x2="7" y2="17"/><line x1="17" y1="17" x2="22" y2="17"/><line x1="17" y1="7" x2="22" y2="7"/>',briefcase:'<rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>',creditCard:'<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>',dollar:'<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',piggyBank:'<path d="M19 5c-1.5 0-2.8 1.4-3 2-3.5-1.5-11-.3-11 5 0 1.8 0 3 2 4.5V20h4v-2h3v2h4v-4c1-.5 1.7-1 2-2h2v-4h-2c0-1-.5-1.5-1-2h0V5z"/><path d="M2 9v1c0 1.1.9 2 2 2h1"/><path d="M16 11h0"/>',receipt:'<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1-2-1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>',fileText:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/>',shoppingCart:'<circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>',shoppingBag:'<path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/>',book:'<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>',graduationCap:'<path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/>',library:'<path d="m16 6 4 14"/><path d="M12 6v14"/><path d="M8 8v12"/><path d="M4 4v16"/>',brain:'<path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>',user:'<path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',users:'<path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',userPlus:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>',userCheck:'<path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><polyline points="17 11 19 13 23 9"/>',smile:'<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',thumbsUp:'<path d="M7 10v12"/><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"/>',thumbsDown:'<path d="M17 14V2"/><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"/>',compass:'<circle cx="12" cy="12" r="10"/><polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>',mapPin:'<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>',map:'<polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>',navigation:'<polygon points="3 11 22 2 13 21 11 13 3 11"/>',home:'<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',building:'<rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',calendar:'<rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>',clock:'<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',timer:'<line x1="10" y1="2" x2="14" y2="2"/><line x1="12" y1="14" x2="12" y2="8"/><circle cx="12" cy="14" r="8"/>',history:'<path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/>',wrench:'<path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>',settings:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',cog:'<path d="M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z"/><path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/><path d="M12 2v2"/><path d="M12 22v-2"/><path d="m17 20.66-1-1.73"/><path d="M11 10.27 7 3.34"/><path d="m20.66 17-1.73-1"/><path d="m3.34 7 1.73 1"/><path d="M14 12h8"/><path d="M2 12h2"/><path d="m20.66 7-1.73 1"/><path d="m3.34 17 1.73-1"/><path d="m17 3.34-1 1.73"/><path d="m11 13.73-4 6.93"/>',sliders:'<line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/>',filter:'<polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>',shield:'<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',lock:'<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',key:'<path d="m21 2-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4"/>',eye:'<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',eyeOff:'<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>',help:'<circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>',info:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>',alert:'<circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>',check:'<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>',x:'<circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/>',bell:'<path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>',sun:'<circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>',moon:'<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>',cloud:'<path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z"/>',cloudRain:'<line x1="16" y1="13" x2="16" y2="21"/><line x1="8" y1="13" x2="8" y2="21"/><line x1="12" y1="15" x2="12" y2="23"/><path d="M20 16.58A5 5 0 0 0 18 7h-1.26A8 8 0 1 0 4 15.25"/>',leaf:'<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"/>',flower:'<path d="M12 7.5a4.5 4.5 0 1 1 4.5 4.5M12 7.5A4.5 4.5 0 1 0 7.5 12M12 7.5V9m-4.5 3a4.5 4.5 0 1 0 4.5 4.5M7.5 12H9m7.5 0a4.5 4.5 0 1 1-4.5 4.5m4.5-4.5H15m-3 4.5V15"/><circle cx="12" cy="12" r="3"/><path d="m8 16 1.5-1.5"/><path d="M14.5 9.5 16 8"/><path d="m8 8 1.5 1.5"/><path d="M14.5 14.5 16 16"/>',tree:'<path d="M10 10v.2A3 3 0 0 1 8.9 16v0H5v0h0a3 3 0 0 1-1-5.8V10a3 3 0 0 1 6 0Z"/><path d="M7 16v6"/><path d="M13 19v3"/><path d="M10.3 14a9.8 9.8 0 0 0 2.57-6.7c0-2.2.13-5.3 5.13-5.3 2.5 0 3 1.56 3 3v1.9a9.8 9.8 0 0 1-2.57 6.7A4.6 4.6 0 0 1 15.8 15a3 3 0 0 1-3 3v0H10v0a3 3 0 0 1-.7-5.92Z"/>',box:'<path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',gift:'<polyline points="20 12 20 22 4 22 4 12"/><rect x="2" y="7" width="20" height="5"/><line x1="12" y1="22" x2="12" y2="7"/><path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"/><path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"/>',package:'<line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>',coffee:'<path d="M17 8h1a4 4 0 1 1 0 8h-1"/><path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z"/><line x1="6" y1="2" x2="6" y2="4"/><line x1="10" y1="2" x2="10" y2="4"/><line x1="14" y1="2" x2="14" y2="4"/>',flag:'<path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/>',award:'<circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>',crown:'<path d="m2 4 3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14"/>',file:'<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/>',folder:'<path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>',folderOpen:'<path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>',download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>',upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>',link:'<path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>',share:'<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>',externalLink:'<path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>'};function Qe(a){return We[a]||We.message}function ue(a){let e=[],t=!1,o=0,n=[],i=a.uiConfig||{},u=new te(a.relay.licenseKey||"default"),M=i.theme?.colorScheme||i.style?.theme||"light",r=M==="dark",h=s=>{switch(s){case"System":return'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';case"Space Grotesk":return'"Space Grotesk", sans-serif';case"Comfortaa":return'"Comfortaa", cursive';case"Bricolage Grotesque":return'"Bricolage Grotesque", sans-serif';case"OpenAI Sans":return'"Inter", sans-serif';case"system-ui":return'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';default:return s?`"${s}", sans-serif`:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}},g=i.theme?.typography?.fontFamily||i.style?.fontFamily||"System",C=h(g),E=i.theme?.typography?.baseSize||i.style?.fontSize||16,d={branding:{companyName:i.branding?.companyName||"Support",welcomeText:i.branding?.welcomeText||i.startScreen?.greeting||"How can we help you?",firstMessage:i.branding?.firstMessage||"",logoUrl:i.branding?.logoUrl},style:{theme:M,primaryColor:i.theme?.color?.accent?.primary||i.style?.primaryColor||"#0ea5e9",backgroundColor:i.theme?.color?.surface?.background||i.style?.backgroundColor||(r?"#1a1a1a":"#ffffff"),textColor:i.style?.textColor||(r?"#e5e5e5":"#1f2937"),fontFamily:C,fontSize:E,position:i.style?.position||"bottom-right",cornerRadius:i.style?.cornerRadius||12},features:{fileAttachmentsEnabled:i.composer?.attachments?.enabled||i.features?.fileAttachmentsEnabled||!1,allowedExtensions:i.composer?.attachments?.accept||i.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:i.composer?.attachments?.maxSize?i.composer.attachments.maxSize/1024:i.features?.maxFileSizeKB||5e3},connection:i.connection,license:i.license,theme:i.theme,startScreen:i.startScreen,composer:i.composer},f=i.startScreen?.greeting||i.branding?.welcomeText||"How can I help you today?",x=Ie(d),b=ze(d),P,$,T,z,H,V,N,Z=i.theme?.color?.grayscale,j=i.theme?.color?.surface;if(Z){let s=Z.hue||220,l=Z.tint||10,p=Z.shade||50;if(r){let c=5+l*2,y=10+p*.5;P=`hsl(${s}, ${c}%, ${y}%)`,H=`hsl(${s}, ${c}%, ${y+5}%)`,V=H,z=`hsla(${s}, ${c}%, 90%, 0.08)`,$=`hsl(${s}, ${Math.max(0,c-10)}%, 90%)`,T=`hsl(${s}, ${Math.max(0,c-10)}%, 60%)`,N=`hsla(${s}, ${c}%, 90%, 0.05)`}else{let c=10+l*3,y=98-p*2;P=`hsl(${s}, ${c}%, ${y}%)`,H=`hsl(${s}, ${c}%, ${y-5}%)`,V=`hsl(${s}, ${c}%, 100%)`,z=`hsla(${s}, ${c}%, 10%, 0.08)`,$=`hsl(${s}, ${c}%, 10%)`,T=`hsl(${s}, ${c}%, 40%)`,N=`hsla(${s}, ${c}%, 10%, 0.05)`}}else j?(P=j.background||(r?"#1a1a1a":"#ffffff"),H=j.foreground||(r?"#262626":"#f8fafc"),V=H,z=r?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)",$=r?"#e5e5e5":"#111827",T=r?"#a1a1aa":"#6b7280",N=r?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"):(P=r?"#1a1a1a":"#ffffff",$=r?"#e5e5e5":"#111827",T=r?"#a1a1aa":"#6b7280",z=r?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",H=r?"#262626":"#f3f4f6",V=r?"#262626":"#ffffff",N=r?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");i.theme?.color?.text&&($=i.theme.color.text),i.theme?.color?.icon&&(T=i.theme.color.icon);let se=i.theme?.color?.accent?.primary||d.style.primaryColor,U=!!i.theme?.color?.accent,oe=U?se:H,re=U?"#ffffff":$;i.theme?.color?.userMessage&&(oe=i.theme.color.userMessage.background||oe,re=i.theme.color.userMessage.text||re);let Ae=()=>{switch(i.theme?.radius||"medium"){case"none":return"0px";case"small":return"4px";case"medium":return"8px";case"large":return"16px";case"pill":return"24px";default:return"12px"}},Fe=i.theme?.radius==="pill"?"20px":Ae(),le=(()=>{switch(i.theme?.density||"normal"){case"compact":return"1rem";case"spacious":return"2.5rem";default:return"1.5rem"}})(),fe={"Space Grotesk":"Space+Grotesk:wght@400;500;600;700",Comfortaa:"Comfortaa:wght@400;500;600;700","Bricolage Grotesque":"Bricolage+Grotesque:wght@400;500;600;700",Inter:"Inter:wght@400;500;600;700"};if(fe[g]){let s=document.createElement("link");s.rel="stylesheet",s.href=`https://fonts.googleapis.com/css2?family=${fe[g]}&display=swap`,document.head.appendChild(s)}let ce=i.theme?.typography?.fontSources;ce&&ce.length>0&&ce.forEach(s=>{if(s.src){let l=document.createElement("style");l.textContent=s.src,document.head.appendChild(l)}}),document.getElementById("n8n-chat-widget-styles")?.remove(),document.getElementById("n8n-chat-widget-container")?.remove();let de=document.createElement("style");de.id="n8n-chat-widget-styles",de.textContent=`
    ${b}

    #n8n-chat-widget-container {
      ${Object.entries(x).map(([s,l])=>`${s}: ${l};`).join(`
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
      background: ${z};
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
      color: ${$};
      text-align: left;
      transition: background 0.15s;
    }
    .n8n-starter-prompt:hover {
      background: ${N};
    }
    .n8n-starter-prompt-icon {
      color: ${T};
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
      background: ${H};
      padding: 2px 6px;
      border-radius: 4px;
      font-family: ui-monospace, monospace;
      font-size: 0.9em;
    }
    .n8n-message-content pre {
      background: ${r?"#0d0d0d":"#1e293b"};
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
  `,document.head.appendChild(de);let xe=a.display?.mode||"popup",pe=xe==="inline",_=xe==="portal",S=!pe&&!_,Y=document.body;if(pe){let s=a.display?.containerId||"chat-widget",l=document.getElementById(s);if(!l){console.warn(`[N8n Chat Widget] Inline container not found: #${s}`);return}Y=l,Y.innerHTML=""}else _&&(Y=document.getElementById(a.display?.containerId||"chat-portal")||document.body);let W=document.createElement("div");W.id="n8n-chat-widget-container",S?W.style.cssText=`
      position: fixed;
      ${d.style.position==="bottom-right"?"right: 24px;":"left: 24px;"}
      bottom: 24px;
      z-index: 999999;
      font-family: ${d.style.fontFamily};
      font-size: ${d.style.fontSize}px;
      display: flex;
      flex-direction: column;
      align-items: flex-end;
    `:pe?W.style.cssText=`
      position: relative;
      width: 100%;
      height: 100%;
      min-height: 420px;
      z-index: 999999;
      font-family: ${d.style.fontFamily};
      font-size: ${d.style.fontSize}px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    `:W.style.cssText=`
      position: fixed;
      inset: 0;
      width: 100%;
      height: 100%;
      z-index: 999999;
      font-family: ${d.style.fontFamily};
      font-size: ${d.style.fontSize}px;
      display: flex;
      flex-direction: column;
      align-items: stretch;
    `,Y.appendChild(W);let X,K;U?(X=se,K="#ffffff"):j?(X=j.foreground||"#f8fafc",K=r?"#e5e5e5":"#111827"):(X=r?"#ffffff":"#000000",K=r?"#000000":"#ffffff");let w=null,A=null,F=null;if(S){w=document.createElement("button"),w.id="n8n-chat-bubble",w.setAttribute("aria-label","Open chat"),w.style.cssText=`
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: ${X};
      border: none;
      cursor: pointer;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s, box-shadow 0.3s;
      position: relative;
    `;let s=document.createElement("div");s.style.cssText="position: relative; width: 24px; height: 24px;";let l=document.createElement("span");l.id="n8n-bubble-message-icon",l.innerHTML=`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${K}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 1; transform: rotate(0deg) scale(1);">
        <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
      </svg>
    `;let p=document.createElement("span");p.id="n8n-bubble-close-icon",p.innerHTML=`
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${K}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 0; transform: rotate(-90deg) scale(0.5);">
        <path d="M18 6 6 18"/>
        <path d="m6 6 12 12"/>
      </svg>
    `,s.appendChild(l),s.appendChild(p),w.appendChild(s),A=l.querySelector("svg"),F=p.querySelector("svg"),w.addEventListener("mouseenter",()=>{w&&(w.style.transform="scale(1.05)")}),w.addEventListener("mouseleave",()=>{w&&(w.style.transform="scale(1)")}),w.addEventListener("click",Ne)}let m=document.createElement("div");m.id="n8n-chat-window",m.style.cssText=`
    display: ${S?"none":"flex"};
    width: ${S?"380px":"100%"};
    height: ${S?"600px":"100%"};
    max-height: ${S?"80vh":"none"};
    background: ${P};
    color: ${$};
    border-radius: ${_?"0":S?"24px":`${d.style.cornerRadius||12}px`};
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: ${S?"16px":"0"};
    border: ${_?"none":`1px solid ${z}`};
    position: relative;
    transform-origin: ${S?"bottom right":"center"};
  `,W.appendChild(m),w&&W.appendChild(w);let J=document.createElement("div");J.style.cssText=`
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
        color: ${T};
        transition: background 0.15s;
      " title="Clear History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  `,m.appendChild(J);let k=document.createElement("div");k.id="n8n-chat-messages",k.style.cssText=`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: ${le};
  `,m.appendChild(k);let R=document.createElement("div");R.id="n8n-start-screen",R.style.cssText=`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `;let he=document.createElement("h2");he.style.cssText=`
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: ${$};
  `,he.textContent=f,R.appendChild(he);let be=d.startScreen?.prompts||[];if(be.length>0){let s=document.createElement("div");s.style.cssText="display: flex; flex-direction: column; gap: 4px;",be.forEach(l=>{let p=document.createElement("button");p.className="n8n-starter-prompt";let c=Qe(l.icon||"message");p.innerHTML=`
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            ${c}
          </svg>
        </span>
        <span style="font-weight: 500;">${l.label}</span>
      `,p.addEventListener("click",()=>{Ce(l.prompt||l.label)}),s.appendChild(p)}),R.appendChild(s)}k.appendChild(R);let L=document.createElement("div");L.id="n8n-messages-list",L.style.cssText=`
    display: none;
    flex: 1;
    flex-direction: column;
    padding-top: 48px;
    gap: 16px;
  `,k.appendChild(L);let I=document.createElement("div");I.style.cssText=`
    padding: ${le};
    padding-top: 0;
  `;let Re=i.theme?.radius==="none"?"0px":"999px",Be=d.composer?.placeholder||"Type a message...",O=`
    <form id="n8n-composer-form" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: ${V};
      border-radius: ${Re};
      border: 1px solid ${z};
      box-shadow: ${r?"none":"0 4px 12px rgba(0,0,0,0.05)"};
      transition: box-shadow 0.15s;
    ">
  `;if(d.features.fileAttachmentsEnabled?O+=`
      <input type="file" id="n8n-file-input" multiple accept="${d.features.allowedExtensions.map(s=>"."+s).join(",")}" style="display: none;" />
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
        color: ${T};
        transition: background 0.15s;
        flex-shrink: 0;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    `:O+='<div style="width: 8px;"></div>',O+=`
    <input type="text" id="n8n-chat-input" placeholder="${Be}" style="
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: ${$};
      padding: 4px 8px;
    " />
  `,O+=`
    <button type="submit" id="n8n-send-btn" style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${r?"#404040":"#f3f4f6"};
      border: none;
      cursor: pointer;
      color: ${r?"#737373":"#a3a3a3"};
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    </button>
  </form>
  `,I.innerHTML=O,m.appendChild(I),d.composer?.disclaimer){let s=document.createElement("div");s.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px ${le};
      font-size: 10px;
      color: ${T};
      opacity: 0.7;
    `,s.textContent=d.composer.disclaimer,m.appendChild(s)}let Pe=I.querySelector("#n8n-composer-form"),B=I.querySelector("#n8n-chat-input"),Q=I.querySelector("#n8n-send-btn"),we=I.querySelector("#n8n-attach-btn"),q=I.querySelector("#n8n-file-input"),Ve=J.querySelector("#n8n-clear-history");function ve(){B.value.trim().length>0?(Q.style.background=U?se:r?"#e5e5e5":"#171717",Q.style.color=U?"#ffffff":r?"#171717":"#ffffff"):(Q.style.background=r?"#404040":"#f3f4f6",Q.style.color=r?"#737373":"#a3a3a3")}B.addEventListener("input",ve),Pe.addEventListener("submit",s=>{s.preventDefault(),Ce()}),Ve.addEventListener("click",()=>{e.length=0,L.innerHTML="",L.style.display="none",R.style.display="flex"}),we&&q&&(we.addEventListener("click",()=>q.click()),q.addEventListener("change",s=>{let l=s.target.files;l&&(n=Array.from(l))}));function Ne(){S&&(t=!t,t?(m.style.display="flex",m.style.opacity="0",m.style.transform="scale(0.95) translateY(16px)",requestAnimationFrame(()=>{m.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",m.style.opacity="1",m.style.transform="scale(1) translateY(0)"}),A&&(A.style.opacity="0",A.style.transform="rotate(90deg) scale(0.5)"),F&&(F.style.opacity="1",F.style.transform="rotate(0deg) scale(1)"),B.focus()):(m.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",m.style.opacity="0",m.style.transform="scale(0.95) translateY(16px)",setTimeout(()=>{m.style.display="none"},300),A&&(A.style.opacity="1",A.style.transform="rotate(0deg) scale(1)"),F&&(F.style.opacity="0",F.style.transform="rotate(-90deg) scale(0.5)")))}S||(t=!0,m.style.display="flex",m.style.opacity="1",m.style.transform="none",B.focus());function je(){R.style.display="none",L.style.display="flex"}function Me(s,l,p=!1){e.length===0&&je();let c={id:`msg-${++o}`,role:s,content:l,timestamp:Date.now()};e.push(c);let y=document.createElement("div");y.id=c.id,y.className="n8n-animate-in",y.style.cssText=`
      display: flex;
      flex-direction: column;
      ${s==="user"?"align-items: flex-end;":"align-items: flex-start;"}
    `;let v=document.createElement("div");return v.className="n8n-message-content",v.style.cssText=`
      max-width: 85%;
      padding: 10px 14px;
      border-radius: ${Fe};
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      ${s==="user"?`background: ${oe}; color: ${re};`:`background: transparent; color: ${$};`}
    `,s==="assistant"?p?v.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:v.innerHTML=ye(l):v.textContent=l,y.appendChild(v),L.appendChild(y),k.scrollTop=k.scrollHeight,c}function ge(s,l){let p=L.querySelector(`#${s}`);if(!p)return;let c=p.querySelector(".n8n-message-content");c&&(c.innerHTML=ye(l));let y=e.find(v=>v.id===s);y&&(y.content=l),k.scrollTop=k.scrollHeight}async function Ce(s){let l=s||B.value.trim();if(!l)return;Me("user",l),B.value="",ve();let p=Me("assistant","",!0);try{await Oe(l,p.id)}catch(c){console.error("[N8n Chat Widget] Error sending message:",c),ge(p.id,"Sorry, there was an error processing your message. Please try again.")}}function Ue(){try{let s=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(s.searchParams),domain:window.location.hostname}}catch{return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function Ke(s){return new Promise((l,p)=>{let c=new FileReader;c.onload=()=>{let v=c.result.split(",")[1];l({name:s.name,type:s.type,data:v,size:s.size})},c.onerror=()=>p(new Error(`Failed to read file: ${s.name}`)),c.readAsDataURL(s)})}async function Oe(s,l){let p=a.relay.relayUrl,c=u.getSessionId();try{let y=d.connection?.captureContext!==!1,v;n.length>0&&d.features.fileAttachmentsEnabled&&(v=await Promise.all(n.map(Ke)),n=[],q&&(q.value=""));let qe=$e(a,{message:s,sessionId:c,context:y?Ue():void 0,customContext:d.connection?.customContext,extraInputs:d.connection?.extraInputs,attachments:v}),ee=await fetch(p,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(qe)});if(!ee.ok)throw new Error(`HTTP ${ee.status}: ${ee.statusText}`);let me=await ee.json(),De=me.response||me.message||me.output||"No response received";ge(l,De)}catch(y){throw console.error("[N8n Chat Widget] Error sending message:",y),ge(l,"Sorry, there was an error connecting to the server. Please try again."),y}}}var ne=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let o=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(t.style.cssText=o,e.showHeader){let u=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(u)}let n=this.createMessagesArea();t.appendChild(n);let i=this.createInputArea();return t.appendChild(i),t}createHeader(e,t){let o=document.createElement("div");o.className="chat-header",o.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let n=document.createElement("div");if(n.textContent=e,o.appendChild(n),t){let i=document.createElement("button");i.className="minimize-btn",i.innerHTML="\xD7",i.style.cssText=`
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      `,o.appendChild(i)}return o}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `,e.appendChild(t),e.appendChild(o),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,o=window.innerHeight;t<768&&e.classList.add("mobile"),t>o&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var ie=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let o=document.createElement("div");o.textContent=e.title,t.appendChild(o);let n=document.createElement("div");if(n.style.cssText="display: flex; gap: 8px; align-items: center;",e.showFullscreenToggle&&e.onFullscreenToggle){let i=this.createButton({className:"fullscreen-toggle-btn",innerHTML:"\u25F1",title:"Enter fullscreen",onClick:e.onFullscreenToggle});n.appendChild(i)}if(e.showMinimize&&e.onMinimize){let i=this.createButton({className:"minimize-btn",innerHTML:"\xD7",title:"Close",fontSize:"24px",onClick:e.onMinimize});n.appendChild(i)}return t.appendChild(n),t}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `,t.addEventListener("click",e.onClick),t}};var D=class{constructor(e){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.uiBuilder=new ie(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.bubble.addEventListener("click",()=>{this.toggleChatWindow()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),{chatWindow:this.chatWindow,bubble:this.bubble}}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
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
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let o=this.uiBuilder.createMessagesArea();e.appendChild(o);let n=this.uiBuilder.createInputArea();return e.appendChild(n),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var ae=class{static validate(e){if(e.mode==="portal"&&!e.license&&!e.widgetKey)throw new Error("License or widgetKey required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var G=class{constructor(e){this.chatWindow=null;ae.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new ne(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new D(this.config),{chatWindow:t}=e.render();this.chatWindow=t}renderNormalMode(){let e=new D(this.config),{chatWindow:t}=e.render();this.chatWindow=t}};if(typeof window<"u"){let a=window;a.Widget=G,a.N8nWidget=G}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",a):a();async function a(){let e=window.ChatWidgetConfig||{},t=e.relay||(e.uiConfig?e.uiConfig.relay:{}),o=Array.from(document.querySelectorAll('script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]')),n=o[o.length-1]||null,i=(n?.getAttribute("data-mode")||n?.getAttribute("data-embed")||"").trim().toLowerCase(),u="popup";i==="inline"?u="inline":(i==="portal"||i==="fullpage")&&(u="portal");let M=e?.display?.mode;(M==="popup"||M==="inline"||M==="portal")&&(u=M);let r={mode:u,containerId:e?.display?.containerId||n?.getAttribute("data-container")||void 0};if(t&&t.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{ue({...e,display:r});return}catch(f){console.error("[N8n Chat Widget] Initialization error:",f);return}}let h=t.licenseKey||"",g="",C=!1,E=document.querySelector('div[id^="n8n-chat-"]');if(!h&&E&&(h=E.id.replace("n8n-chat-","")),n&&n.src){let f=new URL(n.src);g=f.origin;let x=f.pathname.match(/\/w\/([A-Za-z0-9]{16})(?:\.js)?$/);if(x&&x[1])h||(h=x[1]),C=!0;else if(!h){let b=f.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);b&&b[1]&&(h=b[1])}}if(g||(g=window.location.origin),!h){console.warn("[N8n Chat Widget] Could not determine widget key.");return}let d=C?`${g}/w/${h}/config`:`${g}/api/widget/${h}/config`;try{let f=await fetch(d);if(!f.ok)throw new Error("Config fetch failed");let x=await f.json(),b={uiConfig:x,relay:{relayUrl:t.relayUrl||x.connection?.relayEndpoint||`${g}/api/chat-relay`,widgetId:t.widgetId||"",licenseKey:h},display:r};window.ChatWidgetConfig=b,ue(b)}catch(f){console.error("[N8n Chat Widget] Boot error:",f),E&&(E.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
