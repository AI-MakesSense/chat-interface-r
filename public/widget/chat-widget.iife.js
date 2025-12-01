"use strict";var ChatWidget=(()=>{function ue(o){if(!o)return"";try{let e=Oe(o);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),o}}function Oe(o){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return o.replace(/[&<>"']/g,t=>e[t]||t)}function Ce(o,e){let t=o.relay,i=o.uiConfig.connection;return{widgetId:t.widgetId,licenseKey:t.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,threadId:e.threadId,context:e.context,customContext:e.customContext??i?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??i?.extraInputs}}function $e(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let o=new Uint8Array(16);crypto.getRandomValues(o),o[6]=o[6]&15|64,o[8]=o[8]&63|128;let e=Array.from(o).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var De="chat-widget-session-",Ge="chat-widget-thread-",Ve="chat-widget-session-start-",te=class{constructor(e){this.sessionId=null;this.threadId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${De}${e}`,this.threadKey=`${Ge}${e}`,this.startTimeKey=`${Ve}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.threadKey),i=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.threadId=t,this.startTime=i?new Date(i):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString())),this.threadId&&sessionStorage.setItem(this.threadKey,this.threadId)}getSessionId(){return this.sessionId||(this.sessionId=$e(),this.startTime=new Date,this.saveSession()),this.sessionId}getThreadId(){return this.threadId}setThreadId(e){this.threadId=e,this.saveSession()}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.threadKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.threadId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};var _e={none:0,small:6,medium:12,large:18,pill:9999},Se={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function Ee(o,e,t=0){let i=[98,96,92,88,80,70,60,50,40,30,22,14,8],n=e*2,s={};return i.forEach((f,w)=>{let a=Math.max(0,Math.min(100,f+t*2));s[`--cw-gray-${w}`]=`hsl(${o}, ${n}%, ${a}%)`}),s}function Ye(o,e,t,i){if(i){let n=5+e*2,s=10+t*.5;return{bg:`hsl(${o}, ${n}%, ${s}%)`,surface:`hsl(${o}, ${n}%, ${s+5}%)`,composerSurface:`hsl(${o}, ${n}%, ${s+5}%)`,border:`hsla(${o}, ${n}%, 90%, 0.08)`,text:`hsl(${o}, ${Math.max(0,n-10)}%, 90%)`,subText:`hsl(${o}, ${Math.max(0,n-10)}%, 60%)`,hoverSurface:`hsla(${o}, ${n}%, 90%, 0.05)`}}else{let n=10+e*3,s=98-t*2;return{bg:`hsl(${o}, ${n}%, ${s}%)`,surface:`hsl(${o}, ${n}%, ${s-5}%)`,composerSurface:`hsl(${o}, ${n}%, 100%)`,border:`hsla(${o}, ${n}%, 10%, 0.08)`,text:`hsl(${o}, ${n}%, 10%)`,subText:`hsl(${o}, ${n}%, 40%)`,hoverSurface:`hsla(${o}, ${n}%, 10%, 0.05)`}}}function Te(o,e){let t=parseInt(o.replace("#",""),16),i=Math.min(255,Math.floor((t>>16)+(255-(t>>16))*e)),n=Math.min(255,Math.floor((t>>8&255)+(255-(t>>8&255))*e)),s=Math.min(255,Math.floor((t&255)+(255-(t&255))*e));return`#${(i<<16|n<<8|s).toString(16).padStart(6,"0")}`}function Me(o,e){let t=parseInt(o.replace("#",""),16),i=Math.max(0,Math.floor((t>>16)*(1-e))),n=Math.max(0,Math.floor((t>>8&255)*(1-e))),s=Math.max(0,Math.floor((t&255)*(1-e)));return`#${(i<<16|n<<8|s).toString(16).padStart(6,"0")}`}function ke(o,e=1){let t=.15+e*.05;return{"--cw-accent-primary":o,"--cw-accent-hover":Me(o,t),"--cw-accent-active":Me(o,t*1.5),"--cw-accent-light":Te(o,.9),"--cw-accent-lighter":Te(o,.95)}}function Ie(o){let e=o.theme,t=e?.colorScheme||o.style.theme||"light",i=t==="dark",n={"--cw-primary-color":o.style.primaryColor,"--cw-bg-color":o.style.backgroundColor,"--cw-text-color":o.style.textColor,"--cw-font-family":o.style.fontFamily,"--cw-font-size":`${o.style.fontSize}px`,"--cw-corner-radius":`${o.style.cornerRadius}px`};n["--cw-color-scheme"]=t;let s=e?.radius||"medium",f=_e[s]??12;n["--cw-radius-sm"]=`${Math.max(0,f-4)}px`,n["--cw-radius-md"]=`${f}px`,n["--cw-radius-lg"]=`${f+4}px`,n["--cw-radius-xl"]=`${f+8}px`,n["--cw-radius-full"]=s==="pill"?"9999px":`${f*2}px`;let w=e?.density||"normal",a=Se[w]??Se.normal;n["--cw-spacing-xs"]=`${4*a.padding}px`,n["--cw-spacing-sm"]=`${8*a.padding}px`,n["--cw-spacing-md"]=`${12*a.padding}px`,n["--cw-spacing-lg"]=`${16*a.padding}px`,n["--cw-spacing-xl"]=`${24*a.padding}px`,n["--cw-gap"]=`${8*a.gap}px`;let d=e?.typography;d&&(d.baseSize&&(n["--cw-font-size"]=`${d.baseSize}px`,n["--cw-font-size-sm"]=`${d.baseSize-2}px`,n["--cw-font-size-lg"]=`${d.baseSize+2}px`,n["--cw-font-size-xl"]=`${d.baseSize+4}px`),d.fontFamily&&(n["--cw-font-family"]=d.fontFamily),d.fontFamilyMono&&(n["--cw-font-family-mono"]=d.fontFamilyMono));let p=e?.color?.grayscale;if(p){let C=Ee(p.hue,p.tint,p.shade??0);Object.assign(n,C);let $=Ye(p.hue,p.tint,p.shade??0,i);n["--cw-surface-bg"]=$.bg,n["--cw-surface-fg"]=$.surface,n["--cw-composer-surface"]=$.composerSurface,n["--cw-border-color"]=$.border,n["--cw-text-color"]=$.text,n["--cw-icon-color"]=$.subText,n["--cw-hover-surface"]=$.hoverSurface}else{let C=Ee(220,0,0);Object.assign(n,C)}let y=e?.color?.accent;if(y){let C=ke(y.primary,y.level??1);Object.assign(n,C),n["--cw-primary-color"]=y.primary}else{let C=ke(o.style.primaryColor,1);Object.assign(n,C)}let F=e?.color?.surface;F?(n["--cw-surface-bg"]=F.background,n["--cw-surface-fg"]=F.foreground):p||(n["--cw-surface-bg"]=i?"#1a1a1a":"#ffffff",n["--cw-surface-fg"]=i?"#2a2a2a":"#f8fafc",n["--cw-composer-surface"]=i?"#262626":"#ffffff",n["--cw-border-color"]=i?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",n["--cw-hover-surface"]=i?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let m=e?.color?.icon;m?n["--cw-icon-color"]=m:p||(n["--cw-icon-color"]=i?"#a1a1aa":"#6b7280");let z=e?.color?.userMessage;return z?(n["--cw-user-msg-text"]=z.text,n["--cw-user-msg-bg"]=z.background):y?(n["--cw-user-msg-text"]="#ffffff",n["--cw-user-msg-bg"]=y.primary):(n["--cw-user-msg-text"]=n["--cw-text-color"]||(i?"#e5e5e5":"#111827"),n["--cw-user-msg-bg"]=n["--cw-surface-fg"]||(i?"#262626":"#f3f4f6")),n["--cw-assistant-msg-text"]=n["--cw-text-color"]||(i?"#e5e5e5":"#1f2937"),n["--cw-assistant-msg-bg"]="transparent",n["--cw-border-color-strong"]=i?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",n["--cw-shadow-sm"]=i?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",n["--cw-shadow-md"]=i?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",n["--cw-shadow-lg"]=i?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",n}function We(o){let e=o.theme?.typography?.fontSources;return!e||e.length===0?o.style.customFontUrl?o.style.customFontUrl:"":e.map(t=>`
@font-face {
  font-family: '${t.family}';
  src: url('${t.src}');
  font-weight: ${t.weight||400};
  font-style: ${t.style||"normal"};
  font-display: ${t.display||"swap"};
}
  `).join(`
`)}function he(o){let e=[],t=!1,i=0,n=[],s=o.uiConfig||{},f=new te(o.relay.licenseKey||"default"),w=s.theme?.colorScheme||s.style?.theme||"light",a=w==="dark",d=r=>{switch(r){case"System":return'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';case"Space Grotesk":return'"Space Grotesk", sans-serif';case"Comfortaa":return'"Comfortaa", cursive';case"Bricolage Grotesque":return'"Bricolage Grotesque", sans-serif';case"OpenAI Sans":return'"Inter", sans-serif';case"system-ui":return'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';default:return r?`"${r}", sans-serif`:'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'}},p=s.theme?.typography?.fontFamily||s.style?.fontFamily||"System",y=d(p),F=s.theme?.typography?.baseSize||s.style?.fontSize||16,m={branding:{companyName:s.branding?.companyName||"Support",welcomeText:s.branding?.welcomeText||s.startScreen?.greeting||"How can we help you?",firstMessage:s.branding?.firstMessage||"",logoUrl:s.branding?.logoUrl},style:{theme:w,primaryColor:s.theme?.color?.accent?.primary||s.style?.primaryColor||"#0ea5e9",backgroundColor:s.theme?.color?.surface?.background||s.style?.backgroundColor||(a?"#1a1a1a":"#ffffff"),textColor:s.style?.textColor||(a?"#e5e5e5":"#1f2937"),fontFamily:y,fontSize:F,position:s.style?.position||"bottom-right",cornerRadius:s.style?.cornerRadius||12},features:{fileAttachmentsEnabled:s.composer?.attachments?.enabled||s.features?.fileAttachmentsEnabled||!1,allowedExtensions:s.composer?.attachments?.accept||s.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:s.composer?.attachments?.maxSize?s.composer.attachments.maxSize/1024:s.features?.maxFileSizeKB||5e3},connection:s.connection,license:s.license,theme:s.theme,startScreen:s.startScreen,composer:s.composer},z=s.startScreen?.greeting||s.branding?.welcomeText||"How can I help you today?",C=Ie(m),$=We(m),R,b,S,I,T,A,B,V=s.theme?.color?.grayscale,N=s.theme?.color?.surface;if(V){let r=V.hue||220,c=V.tint||10,u=V.shade||50;if(a){let l=5+c*2,g=10+u*.5;R=`hsl(${r}, ${l}%, ${g}%)`,T=`hsl(${r}, ${l}%, ${g+5}%)`,A=T,I=`hsla(${r}, ${l}%, 90%, 0.08)`,b=`hsl(${r}, ${Math.max(0,l-10)}%, 90%)`,S=`hsl(${r}, ${Math.max(0,l-10)}%, 60%)`,B=`hsla(${r}, ${l}%, 90%, 0.05)`}else{let l=10+c*3,g=98-u*2;R=`hsl(${r}, ${l}%, ${g}%)`,T=`hsl(${r}, ${l}%, ${g-5}%)`,A=`hsl(${r}, ${l}%, 100%)`,I=`hsla(${r}, ${l}%, 10%, 0.08)`,b=`hsl(${r}, ${l}%, 10%)`,S=`hsl(${r}, ${l}%, 40%)`,B=`hsla(${r}, ${l}%, 10%, 0.05)`}}else N?(R=N.background||(a?"#1a1a1a":"#ffffff"),T=N.foreground||(a?"#262626":"#f8fafc"),A=T,I=a?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)",b=a?"#e5e5e5":"#111827",S=a?"#a1a1aa":"#6b7280",B=a?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"):(R=a?"#1a1a1a":"#ffffff",b=a?"#e5e5e5":"#111827",S=a?"#a1a1aa":"#6b7280",I=a?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",T=a?"#262626":"#f3f4f6",A=a?"#262626":"#ffffff",B=a?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");s.theme?.color?.text&&(b=s.theme.color.text),s.theme?.color?.icon&&(S=s.theme.color.icon);let ie=s.theme?.color?.accent?.primary||m.style.primaryColor,P=!!s.theme?.color?.accent,re=P?ie:T,ae=P?"#ffffff":b;s.theme?.color?.userMessage&&(re=s.theme.color.userMessage.background||re,ae=s.theme.color.userMessage.text||ae);let Le=()=>{switch(s.theme?.radius||"medium"){case"none":return"0px";case"small":return"4px";case"medium":return"8px";case"large":return"16px";case"pill":return"24px";default:return"12px"}},He=s.theme?.radius==="pill"?"20px":Le(),ce=(()=>{switch(s.theme?.density||"normal"){case"compact":return"1rem";case"spacious":return"2.5rem";default:return"1.5rem"}})(),fe={"Space Grotesk":"Space+Grotesk:wght@400;500;600;700",Comfortaa:"Comfortaa:wght@400;500;600;700","Bricolage Grotesque":"Bricolage+Grotesque:wght@400;500;600;700",Inter:"Inter:wght@400;500;600;700"};if(fe[p]){let r=document.createElement("link");r.rel="stylesheet",r.href=`https://fonts.googleapis.com/css2?family=${fe[p]}&display=swap`,document.head.appendChild(r)}let le=s.theme?.typography?.fontSources;le&&le.length>0&&le.forEach(r=>{if(r.src){let c=document.createElement("style");c.textContent=r.src,document.head.appendChild(c)}});let de=document.createElement("style");de.id="n8n-chat-widget-styles",de.textContent=`
    ${$}

    #n8n-chat-widget-container {
      ${Object.entries(C).map(([r,c])=>`${r}: ${c};`).join(`
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
      color: ${S};
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
      background: ${T};
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
    ${m.style.position==="bottom-right"?"right: 24px;":"left: 24px;"}
    bottom: 24px;
    z-index: 999999;
    font-family: ${m.style.fontFamily};
    font-size: ${m.style.fontSize}px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `,document.body.appendChild(j);let _,U;P?(_=ie,U="#ffffff"):N?(_=N.foreground||"#f8fafc",U=a?"#e5e5e5":"#111827"):(_=a?"#ffffff":"#000000",U=a?"#000000":"#ffffff");let v=document.createElement("button");v.id="n8n-chat-bubble",v.setAttribute("aria-label","Open chat"),v.style.cssText=`
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
  `;let Y=document.createElement("div");Y.style.cssText="position: relative; width: 24px; height: 24px;";let X=document.createElement("span");X.id="n8n-bubble-message-icon",X.innerHTML=`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${U}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 1; transform: rotate(0deg) scale(1);">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
    </svg>
  `;let J=document.createElement("span");J.id="n8n-bubble-close-icon",J.innerHTML=`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${U}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 0; transform: rotate(-90deg) scale(0.5);">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  `,Y.appendChild(X),Y.appendChild(J),v.appendChild(Y);let L=X.querySelector("svg"),H=J.querySelector("svg");v.addEventListener("mouseenter",()=>{v.style.transform="scale(1.05)"}),v.addEventListener("mouseleave",()=>{v.style.transform="scale(1)"}),v.addEventListener("click",Be);let h=document.createElement("div");h.id="n8n-chat-window",h.style.cssText=`
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
  `,j.appendChild(h),j.appendChild(v);let Z=document.createElement("div");Z.style.cssText=`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  `,Z.innerHTML=`
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
        color: ${S};
        transition: background 0.15s;
      " title="Clear History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  `,h.appendChild(Z);let E=document.createElement("div");E.id="n8n-chat-messages",E.style.cssText=`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: ${ce};
  `,h.appendChild(E);let W=document.createElement("div");W.id="n8n-start-screen",W.style.cssText=`
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
  `,pe.textContent=z,W.appendChild(pe);let ye=m.startScreen?.prompts||[];if(ye.length>0){let r=document.createElement("div");r.style.cssText="display: flex; flex-direction: column; gap: 4px;",ye.forEach(c=>{let u=document.createElement("button");u.className="n8n-starter-prompt",u.innerHTML=`
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span style="font-weight: 500;">${c.label}</span>
      `,u.addEventListener("click",()=>{ve(c.prompt||c.label)}),r.appendChild(u)}),W.appendChild(r)}E.appendChild(W);let M=document.createElement("div");M.id="n8n-messages-list",M.style.cssText=`
    display: none;
    flex: 1;
    flex-direction: column;
    padding-top: 48px;
    gap: 16px;
  `,E.appendChild(M);let k=document.createElement("div");k.style.cssText=`
    padding: ${ce};
    padding-top: 0;
  `;let Fe=s.theme?.radius==="none"?"0px":"999px",ze=m.composer?.placeholder||"Type a message...",K=`
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
  `;if(m.features.fileAttachmentsEnabled?K+=`
      <input type="file" id="n8n-file-input" multiple accept="${m.features.allowedExtensions.map(r=>"."+r).join(",")}" style="display: none;" />
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
        color: ${S};
        transition: background 0.15s;
        flex-shrink: 0;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    `:K+='<div style="width: 8px;"></div>',K+=`
    <input type="text" id="n8n-chat-input" placeholder="${ze}" style="
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
  `,k.innerHTML=K,h.appendChild(k),m.composer?.disclaimer){let r=document.createElement("div");r.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px ${ce};
      font-size: 10px;
      color: ${S};
      opacity: 0.7;
    `,r.textContent=m.composer.disclaimer,h.appendChild(r)}let Re=k.querySelector("#n8n-composer-form"),q=k.querySelector("#n8n-chat-input"),Q=k.querySelector("#n8n-send-btn"),xe=k.querySelector("#n8n-attach-btn"),O=k.querySelector("#n8n-file-input"),Ae=Z.querySelector("#n8n-clear-history");function be(){q.value.trim().length>0?(Q.style.background=P?ie:a?"#e5e5e5":"#171717",Q.style.color=P?"#ffffff":a?"#171717":"#ffffff"):(Q.style.background=a?"#404040":"#f3f4f6",Q.style.color=a?"#737373":"#a3a3a3")}q.addEventListener("input",be),Re.addEventListener("submit",r=>{r.preventDefault(),ve()}),Ae.addEventListener("click",()=>{e.length=0,M.innerHTML="",M.style.display="none",W.style.display="flex"}),xe&&O&&(xe.addEventListener("click",()=>O.click()),O.addEventListener("change",r=>{let c=r.target.files;c&&(n=Array.from(c))}));function Be(){t=!t,t?(h.style.display="flex",h.style.opacity="0",h.style.transform="scale(0.95) translateY(16px)",requestAnimationFrame(()=>{h.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",h.style.opacity="1",h.style.transform="scale(1) translateY(0)"}),L&&(L.style.opacity="0",L.style.transform="rotate(90deg) scale(0.5)"),H&&(H.style.opacity="1",H.style.transform="rotate(0deg) scale(1)"),q.focus()):(h.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",h.style.opacity="0",h.style.transform="scale(0.95) translateY(16px)",setTimeout(()=>{h.style.display="none"},300),L&&(L.style.opacity="1",L.style.transform="rotate(0deg) scale(1)"),H&&(H.style.opacity="0",H.style.transform="rotate(-90deg) scale(0.5)"))}function Ne(){W.style.display="none",M.style.display="flex"}function we(r,c,u=!1){e.length===0&&Ne();let l={id:`msg-${++i}`,role:r,content:c,timestamp:Date.now()};e.push(l);let g=document.createElement("div");g.id=l.id,g.className="n8n-animate-in",g.style.cssText=`
      display: flex;
      flex-direction: column;
      ${r==="user"?"align-items: flex-end;":"align-items: flex-start;"}
    `;let x=document.createElement("div");return x.className="n8n-message-content",x.style.cssText=`
      max-width: 85%;
      padding: 10px 14px;
      border-radius: ${He};
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      ${r==="user"?`background: ${re}; color: ${ae};`:`background: transparent; color: ${b};`}
    `,r==="assistant"?u?x.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:x.innerHTML=ue(c):x.textContent=c,g.appendChild(x),M.appendChild(g),E.scrollTop=E.scrollHeight,l}function ge(r,c){let u=M.querySelector(`#${r}`);if(!u)return;let l=u.querySelector(".n8n-message-content");l&&(l.innerHTML=ue(c));let g=e.find(x=>x.id===r);g&&(g.content=c),E.scrollTop=E.scrollHeight}async function ve(r){let c=r||q.value.trim();if(!c)return;we("user",c),q.value="",be();let u=we("assistant","",!0);try{await Ue(c,u.id)}catch(l){console.error("[N8n Chat Widget] Error sending message:",l),ge(u.id,"Sorry, there was an error processing your message. Please try again.")}}function Pe(){try{let r=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(r.searchParams),domain:window.location.hostname}}catch{return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function je(r){return new Promise((c,u)=>{let l=new FileReader;l.onload=()=>{let x=l.result.split(",")[1];c({name:r.name,type:r.type,data:x,size:r.size})},l.onerror=()=>u(new Error(`Failed to read file: ${r.name}`)),l.readAsDataURL(r)})}async function Ue(r,c){let u=o.relay.relayUrl,l=f.getSessionId();try{let g=m.connection?.captureContext!==!1,x;n.length>0&&m.features.fileAttachmentsEnabled&&(x=await Promise.all(n.map(je)),n=[],O&&(O.value=""));let Ke=Ce(o,{message:r,sessionId:l,context:g?Pe():void 0,customContext:m.connection?.customContext,extraInputs:m.connection?.extraInputs,attachments:x}),ee=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Ke)});if(!ee.ok)throw new Error(`HTTP ${ee.status}: ${ee.statusText}`);let me=await ee.json(),qe=me.response||me.message||me.output||"No response received";ge(c,qe)}catch(g){throw console.error("[N8n Chat Widget] Error sending message:",g),ge(c,"Sorry, there was an error connecting to the server. Please try again."),g}}}var ne=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let i=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(t.style.cssText=i,e.showHeader){let f=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(f)}let n=this.createMessagesArea();t.appendChild(n);let s=this.createInputArea();return t.appendChild(s),t}createHeader(e,t){let i=document.createElement("div");i.className="chat-header",i.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let n=document.createElement("div");if(n.textContent=e,i.appendChild(n),t){let s=document.createElement("button");s.className="minimize-btn",s.innerHTML="\xD7",s.style.cssText=`
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      `,i.appendChild(s)}return i}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `;let i=document.createElement("button");return i.className="send-btn",i.textContent="Send",i.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(i),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,i=window.innerHeight;t<768&&e.classList.add("mobile"),t>i&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var se=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let i=document.createElement("div");i.textContent=e.title,t.appendChild(i);let n=document.createElement("div");if(n.style.cssText="display: flex; gap: 8px; align-items: center;",e.showFullscreenToggle&&e.onFullscreenToggle){let s=this.createButton({className:"fullscreen-toggle-btn",innerHTML:"\u25F1",title:"Enter fullscreen",onClick:e.onFullscreenToggle});n.appendChild(s)}if(e.showMinimize&&e.onMinimize){let s=this.createButton({className:"minimize-btn",innerHTML:"\xD7",title:"Close",fontSize:"24px",onClick:e.onMinimize});n.appendChild(s)}return t.appendChild(n),t}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `;let i=document.createElement("button");return i.className="send-btn",i.textContent="Send",i.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(i),e}createButton(e){let t=document.createElement("button");return t.className=e.className,t.innerHTML=e.innerHTML,t.title=e.title,t.style.cssText=`
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
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let i=this.uiBuilder.createMessagesArea();e.appendChild(i);let n=this.uiBuilder.createInputArea();return e.appendChild(n),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var oe=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var G=class{constructor(e){this.chatWindow=null;oe.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new ne(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new D(this.config),{chatWindow:t}=e.render();this.chatWindow=t}renderNormalMode(){let e=new D(this.config),{chatWindow:t}=e.render();this.chatWindow=t}};if(typeof window<"u"){let o=window;o.Widget=G,o.N8nWidget=G}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",o):o();async function o(){let e=window.ChatWidgetConfig||{},t=e.relay||(e.uiConfig?e.uiConfig.relay:{});if(t&&t.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{he(e);return}catch(d){console.error("[N8n Chat Widget] Initialization error:",d);return}}let i=t.licenseKey||"",n="",s=!1,f=document.querySelector('div[id^="n8n-chat-"]');!i&&f&&(i=f.id.replace("n8n-chat-",""));let w=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]');if(w&&w.src){let d=new URL(w.src);n=d.origin;let p=d.pathname.match(/\/w\/([A-Za-z0-9]{16})(?:\.js)?$/);if(p&&p[1])i||(i=p[1]),s=!0;else if(!i){let y=d.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);y&&y[1]&&(i=y[1])}}if(n||(n=window.location.origin),!i){console.warn("[N8n Chat Widget] Could not determine widget key.");return}let a=s?`${n}/w/${i}/config`:`${n}/api/widget/${i}/config`;try{let d=await fetch(a);if(!d.ok)throw new Error("Config fetch failed");let p=await d.json(),y={uiConfig:p,relay:{relayUrl:t.relayUrl||p.connection?.relayEndpoint||`${n}/api/chat-relay`,widgetId:t.widgetId||"",licenseKey:i}};window.ChatWidgetConfig=y,he(y)}catch(d){console.error("[N8n Chat Widget] Boot error:",d),f&&(f.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
