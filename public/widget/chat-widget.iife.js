"use strict";var ChatWidget=(()=>{function ne(o){if(!o)return"";try{let e=He(o);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),o}}function He(o){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return o.replace(/[&<>"']/g,t=>e[t]||t)}function de(o,e){let t=o.relay,i=o.uiConfig.connection;return{widgetId:t.widgetId,licenseKey:t.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,threadId:e.threadId,context:e.context,customContext:e.customContext??i?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??i?.extraInputs}}function pe(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let o=new Uint8Array(16);crypto.getRandomValues(o),o[6]=o[6]&15|64,o[8]=o[8]&63|128;let e=Array.from(o).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var Fe="chat-widget-session-",Re="chat-widget-thread-",ze="chat-widget-session-start-",O=class{constructor(e){this.sessionId=null;this.threadId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${Fe}${e}`,this.threadKey=`${Re}${e}`,this.startTimeKey=`${ze}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.threadKey),i=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.threadId=t,this.startTime=i?new Date(i):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString())),this.threadId&&sessionStorage.setItem(this.threadKey,this.threadId)}getSessionId(){return this.sessionId||(this.sessionId=pe(),this.startTime=new Date,this.saveSession()),this.sessionId}getThreadId(){return this.threadId}setThreadId(e){this.threadId=e,this.saveSession()}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.threadKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.threadId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};var Ae={none:0,small:6,medium:12,large:18,pill:9999},ge={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function me(o,e,t=0){let i=[98,96,92,88,80,70,60,50,40,30,22,14,8],n=e*2,s={};return i.forEach((u,v)=>{let c=Math.max(0,Math.min(100,u+t*2));s[`--cw-gray-${v}`]=`hsl(${o}, ${n}%, ${c}%)`}),s}function Ne(o,e,t,i){if(i){let n=5+e*2,s=10+t*.5;return{bg:`hsl(${o}, ${n}%, ${s}%)`,surface:`hsl(${o}, ${n}%, ${s+5}%)`,composerSurface:`hsl(${o}, ${n}%, ${s+5}%)`,border:`hsla(${o}, ${n}%, 90%, 0.08)`,text:`hsl(${o}, ${Math.max(0,n-10)}%, 90%)`,subText:`hsl(${o}, ${Math.max(0,n-10)}%, 60%)`,hoverSurface:`hsla(${o}, ${n}%, 90%, 0.05)`}}else{let n=10+e*3,s=98-t*2;return{bg:`hsl(${o}, ${n}%, ${s}%)`,surface:`hsl(${o}, ${n}%, ${s-5}%)`,composerSurface:`hsl(${o}, ${n}%, 100%)`,border:`hsla(${o}, ${n}%, 10%, 0.08)`,text:`hsl(${o}, ${n}%, 10%)`,subText:`hsl(${o}, ${n}%, 40%)`,hoverSurface:`hsla(${o}, ${n}%, 10%, 0.05)`}}}function he(o,e){let t=parseInt(o.replace("#",""),16),i=Math.min(255,Math.floor((t>>16)+(255-(t>>16))*e)),n=Math.min(255,Math.floor((t>>8&255)+(255-(t>>8&255))*e)),s=Math.min(255,Math.floor((t&255)+(255-(t&255))*e));return`#${(i<<16|n<<8|s).toString(16).padStart(6,"0")}`}function ue(o,e){let t=parseInt(o.replace("#",""),16),i=Math.max(0,Math.floor((t>>16)*(1-e))),n=Math.max(0,Math.floor((t>>8&255)*(1-e))),s=Math.max(0,Math.floor((t&255)*(1-e)));return`#${(i<<16|n<<8|s).toString(16).padStart(6,"0")}`}function fe(o,e=1){let t=.15+e*.05;return{"--cw-accent-primary":o,"--cw-accent-hover":ue(o,t),"--cw-accent-active":ue(o,t*1.5),"--cw-accent-light":he(o,.9),"--cw-accent-lighter":he(o,.95)}}function xe(o){let e=o.theme,t=e?.colorScheme||o.style.theme||"light",i=t==="dark",n={"--cw-primary-color":o.style.primaryColor,"--cw-bg-color":o.style.backgroundColor,"--cw-text-color":o.style.textColor,"--cw-font-family":o.style.fontFamily,"--cw-font-size":`${o.style.fontSize}px`,"--cw-corner-radius":`${o.style.cornerRadius}px`};n["--cw-color-scheme"]=t;let s=e?.radius||"medium",u=Ae[s]??12;n["--cw-radius-sm"]=`${Math.max(0,u-4)}px`,n["--cw-radius-md"]=`${u}px`,n["--cw-radius-lg"]=`${u+4}px`,n["--cw-radius-xl"]=`${u+8}px`,n["--cw-radius-full"]=s==="pill"?"9999px":`${u*2}px`;let v=e?.density||"normal",c=ge[v]??ge.normal;n["--cw-spacing-xs"]=`${4*c.padding}px`,n["--cw-spacing-sm"]=`${8*c.padding}px`,n["--cw-spacing-md"]=`${12*c.padding}px`,n["--cw-spacing-lg"]=`${16*c.padding}px`,n["--cw-spacing-xl"]=`${24*c.padding}px`,n["--cw-gap"]=`${8*c.gap}px`;let a=e?.typography;a&&(a.baseSize&&(n["--cw-font-size"]=`${a.baseSize}px`,n["--cw-font-size-sm"]=`${a.baseSize-2}px`,n["--cw-font-size-lg"]=`${a.baseSize+2}px`,n["--cw-font-size-xl"]=`${a.baseSize+4}px`),a.fontFamily&&(n["--cw-font-family"]=a.fontFamily),a.fontFamilyMono&&(n["--cw-font-family-mono"]=a.fontFamilyMono));let m=e?.color?.grayscale;if(m){let h=me(m.hue,m.tint,m.shade??0);Object.assign(n,h);let x=Ne(m.hue,m.tint,m.shade??0,i);n["--cw-surface-bg"]=x.bg,n["--cw-surface-fg"]=x.surface,n["--cw-composer-surface"]=x.composerSurface,n["--cw-border-color"]=x.border,n["--cw-text-color"]=x.text,n["--cw-icon-color"]=x.subText,n["--cw-hover-surface"]=x.hoverSurface}else{let h=me(220,0,0);Object.assign(n,h)}let f=e?.color?.accent;if(f){let h=fe(f.primary,f.level??1);Object.assign(n,h),n["--cw-primary-color"]=f.primary}else{let h=fe(o.style.primaryColor,1);Object.assign(n,h)}let W=e?.color?.surface;W?(n["--cw-surface-bg"]=W.background,n["--cw-surface-fg"]=W.foreground):m||(n["--cw-surface-bg"]=i?"#1a1a1a":"#ffffff",n["--cw-surface-fg"]=i?"#2a2a2a":"#f8fafc",n["--cw-composer-surface"]=i?"#262626":"#ffffff",n["--cw-border-color"]=i?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",n["--cw-hover-surface"]=i?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let T=e?.color?.icon;T?n["--cw-icon-color"]=T:m||(n["--cw-icon-color"]=i?"#a1a1aa":"#6b7280");let y=e?.color?.userMessage;return y?(n["--cw-user-msg-text"]=y.text,n["--cw-user-msg-bg"]=y.background):f?(n["--cw-user-msg-text"]="#ffffff",n["--cw-user-msg-bg"]=f.primary):(n["--cw-user-msg-text"]=n["--cw-text-color"]||(i?"#e5e5e5":"#111827"),n["--cw-user-msg-bg"]=n["--cw-surface-fg"]||(i?"#262626":"#f3f4f6")),n["--cw-assistant-msg-text"]=n["--cw-text-color"]||(i?"#e5e5e5":"#1f2937"),n["--cw-assistant-msg-bg"]="transparent",n["--cw-border-color-strong"]=i?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",n["--cw-shadow-sm"]=i?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",n["--cw-shadow-md"]=i?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",n["--cw-shadow-lg"]=i?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",n}function ye(o){let e=o.theme?.typography?.fontSources;return!e||e.length===0?o.style.customFontUrl?o.style.customFontUrl:"":e.map(t=>`
@font-face {
  font-family: '${t.family}';
  src: url('${t.src}');
  font-weight: ${t.weight||400};
  font-style: ${t.style||"normal"};
  font-display: ${t.display||"swap"};
}
  `).join(`
`)}function se(o){let e=[],t=!1,i=0,n=[],s=o.uiConfig||{},u=new O(o.relay.licenseKey||"default"),v=s.theme?.colorScheme||s.style?.theme||"light",c=v==="dark",a={branding:{companyName:s.branding?.companyName||"Support",welcomeText:s.branding?.welcomeText||s.startScreen?.greeting||"How can we help you?",firstMessage:s.branding?.firstMessage||"",logoUrl:s.branding?.logoUrl},style:{theme:v,primaryColor:s.theme?.color?.accent?.primary||s.style?.primaryColor||"#0ea5e9",backgroundColor:s.theme?.color?.surface?.background||s.style?.backgroundColor||(c?"#1a1a1a":"#ffffff"),textColor:s.style?.textColor||(c?"#e5e5e5":"#1f2937"),fontFamily:s.theme?.typography?.fontFamily||s.style?.fontFamily||'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',fontSize:s.theme?.typography?.baseSize||s.style?.fontSize||14,position:s.style?.position||"bottom-right",cornerRadius:s.style?.cornerRadius||12},features:{fileAttachmentsEnabled:s.composer?.attachments?.enabled||s.features?.fileAttachmentsEnabled||!1,allowedExtensions:s.composer?.attachments?.accept||s.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:s.composer?.attachments?.maxSize?s.composer.attachments.maxSize/1024:s.features?.maxFileSizeKB||5e3},connection:s.connection,license:s.license,theme:s.theme,startScreen:s.startScreen,composer:s.composer},m=s.startScreen?.greeting||s.branding?.welcomeText||"How can I help you today?",f=xe(a),W=ye(a),T,y,h,x,E,I,L,B=s.theme?.color?.grayscale,_=s.theme?.color?.surface;if(B){let r=B.hue||220,d=B.tint||10,g=B.shade||50;if(c){let l=5+d*2,p=10+g*.5;T=`hsl(${r}, ${l}%, ${p}%)`,E=`hsl(${r}, ${l}%, ${p+5}%)`,I=E,x=`hsla(${r}, ${l}%, 90%, 0.08)`,y=`hsl(${r}, ${Math.max(0,l-10)}%, 90%)`,h=`hsl(${r}, ${Math.max(0,l-10)}%, 60%)`,L=`hsla(${r}, ${l}%, 90%, 0.05)`}else{let l=10+d*3,p=98-g*2;T=`hsl(${r}, ${l}%, ${p}%)`,E=`hsl(${r}, ${l}%, ${p-5}%)`,I=`hsl(${r}, ${l}%, 100%)`,x=`hsla(${r}, ${l}%, 10%, 0.08)`,y=`hsl(${r}, ${l}%, 10%)`,h=`hsl(${r}, ${l}%, 40%)`,L=`hsla(${r}, ${l}%, 10%, 0.05)`}}else _?(T=_.background||(c?"#1a1a1a":"#ffffff"),E=_.foreground||(c?"#262626":"#f8fafc"),I=E,x=c?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)",y=c?"#e5e5e5":"#111827",h=c?"#a1a1aa":"#6b7280",L=c?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"):(T=c?"#1a1a1a":"#ffffff",y=c?"#e5e5e5":"#111827",h=c?"#a1a1aa":"#6b7280",x=c?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",E=c?"#262626":"#f3f4f6",I=c?"#262626":"#ffffff",L=c?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let Y=s.theme?.color?.accent?.primary||a.style.primaryColor,j=!!s.theme?.color?.accent,G=j?Y:E,X=j?"#ffffff":y;s.theme?.color?.userMessage&&(G=s.theme.color.userMessage.background||G,X=s.theme.color.userMessage.text||X);let be=()=>{switch(s.theme?.radius||"medium"){case"none":return"0px";case"small":return"4px";case"medium":return"8px";case"large":return"16px";case"pill":return"24px";default:return"12px"}},we=s.theme?.radius==="pill"?"20px":be(),Z=(()=>{switch(s.theme?.density||"normal"){case"compact":return"1rem";case"spacious":return"2.5rem";default:return"1.5rem"}})(),J=document.createElement("style");J.id="n8n-chat-widget-styles",J.textContent=`
    ${W}

    #n8n-chat-widget-container {
      ${Object.entries(f).map(([r,d])=>`${r}: ${d};`).join(`
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
      background: ${x};
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
      color: ${y};
      text-align: left;
      transition: background 0.15s;
    }
    .n8n-starter-prompt:hover {
      background: ${L};
    }
    .n8n-starter-prompt-icon {
      color: ${h};
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
      background: ${c?"#0d0d0d":"#1e293b"};
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
  `,document.head.appendChild(J);let H=document.createElement("div");H.id="n8n-chat-widget-container",H.style.cssText=`
    position: fixed;
    ${a.style.position==="bottom-right"?"right: 20px;":"left: 20px;"}
    bottom: 20px;
    z-index: 999999;
    font-family: ${a.style.fontFamily};
    font-size: ${a.style.fontSize}px;
  `,document.body.appendChild(H);let w=document.createElement("button");w.id="n8n-chat-bubble",w.setAttribute("aria-label","Open chat"),w.style.cssText=`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${Y};
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  `,w.innerHTML=`
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z" fill="white"/>
    </svg>
  `,w.addEventListener("mouseenter",()=>{w.style.transform="scale(1.1)"}),w.addEventListener("mouseleave",()=>{w.style.transform="scale(1)"}),w.addEventListener("click",ae),H.appendChild(w);let C=document.createElement("div");C.id="n8n-chat-window",C.style.cssText=`
    display: none;
    width: 400px;
    height: 600px;
    max-height: 80vh;
    background: ${T};
    color: ${y};
    border-radius: ${a.style.cornerRadius}px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 12px;
    border: 1px solid ${x};
    position: relative;
  `,H.appendChild(C);let F=document.createElement("div");F.style.cssText=`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  `,F.innerHTML=`
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
        color: ${h};
        transition: background 0.15s;
      " title="Clear History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
      <button id="n8n-chat-close" style="
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        background: transparent;
        border: none;
        cursor: pointer;
        color: ${h};
        transition: background 0.15s;
        font-size: 20px;
      " title="Close">\xD7</button>
    </div>
  `,C.appendChild(F);let $=document.createElement("div");$.id="n8n-chat-messages",$.style.cssText=`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: ${Z};
  `,C.appendChild($);let k=document.createElement("div");k.id="n8n-start-screen",k.style.cssText=`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `;let Q=document.createElement("h2");Q.style.cssText=`
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: ${y};
  `,Q.textContent=m,k.appendChild(Q);let oe=a.startScreen?.prompts||[];if(oe.length>0){let r=document.createElement("div");r.style.cssText="display: flex; flex-direction: column; gap: 4px;",oe.forEach(d=>{let g=document.createElement("button");g.className="n8n-starter-prompt",g.innerHTML=`
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span style="font-weight: 500;">${d.label}</span>
      `,g.addEventListener("click",()=>{le(d.prompt||d.label)}),r.appendChild(g)}),k.appendChild(r)}$.appendChild(k);let M=document.createElement("div");M.id="n8n-messages-list",M.style.cssText=`
    display: none;
    flex: 1;
    flex-direction: column;
    padding-top: 48px;
    gap: 16px;
  `,$.appendChild(M);let S=document.createElement("div");S.style.cssText=`
    padding: ${Z};
    padding-top: 0;
  `;let ve=s.theme?.radius==="none"?"0px":"999px",Ce=a.composer?.placeholder||"Type a message...",R=`
    <form id="n8n-composer-form" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: ${I};
      border-radius: ${ve};
      border: 1px solid ${x};
      box-shadow: ${c?"none":"0 4px 12px rgba(0,0,0,0.05)"};
      transition: box-shadow 0.15s;
    ">
  `;if(a.features.fileAttachmentsEnabled?R+=`
      <input type="file" id="n8n-file-input" multiple accept="${a.features.allowedExtensions.map(r=>"."+r).join(",")}" style="display: none;" />
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
        color: ${h};
        transition: background 0.15s;
        flex-shrink: 0;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    `:R+='<div style="width: 8px;"></div>',R+=`
    <input type="text" id="n8n-chat-input" placeholder="${Ce}" style="
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: ${y};
      padding: 4px 8px;
    " />
  `,R+=`
    <button type="submit" id="n8n-send-btn" style="
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: ${c?"#404040":"#f3f4f6"};
      border: none;
      cursor: pointer;
      color: ${c?"#737373":"#a3a3a3"};
      transition: background 0.15s, color 0.15s;
      flex-shrink: 0;
    ">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
        <line x1="12" y1="19" x2="12" y2="5"/>
        <polyline points="5 12 12 5 19 12"/>
      </svg>
    </button>
  </form>
  `,S.innerHTML=R,C.appendChild(S),a.composer?.disclaimer){let r=document.createElement("div");r.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px ${Z};
      font-size: 10px;
      color: ${h};
      opacity: 0.7;
    `,r.textContent=a.composer.disclaimer,C.appendChild(r)}let $e=S.querySelector("#n8n-composer-form"),z=S.querySelector("#n8n-chat-input"),K=S.querySelector("#n8n-send-btn"),ie=S.querySelector("#n8n-attach-btn"),A=S.querySelector("#n8n-file-input"),Te=F.querySelector("#n8n-chat-close"),Ee=F.querySelector("#n8n-clear-history");function re(){z.value.trim().length>0?(K.style.background=j?Y:c?"#e5e5e5":"#171717",K.style.color=j?"#ffffff":c?"#171717":"#ffffff"):(K.style.background=c?"#404040":"#f3f4f6",K.style.color=c?"#737373":"#a3a3a3")}z.addEventListener("input",re),$e.addEventListener("submit",r=>{r.preventDefault(),le()}),Te.addEventListener("click",ae),Ee.addEventListener("click",()=>{e.length=0,M.innerHTML="",M.style.display="none",k.style.display="flex"}),ie&&A&&(ie.addEventListener("click",()=>A.click()),A.addEventListener("change",r=>{let d=r.target.files;d&&(n=Array.from(d))}));function ae(){t=!t,t?(C.style.display="flex",w.style.display="none",z.focus()):(C.style.display="none",w.style.display="flex")}function Me(){k.style.display="none",M.style.display="flex"}function ce(r,d,g=!1){e.length===0&&Me();let l={id:`msg-${++i}`,role:r,content:d,timestamp:Date.now()};e.push(l);let p=document.createElement("div");p.id=l.id,p.className="n8n-animate-in",p.style.cssText=`
      display: flex;
      flex-direction: column;
      ${r==="user"?"align-items: flex-end;":"align-items: flex-start;"}
    `;let b=document.createElement("div");return b.className="n8n-message-content",b.style.cssText=`
      max-width: 85%;
      padding: 10px 14px;
      border-radius: ${we};
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      ${r==="user"?`background: ${G}; color: ${X};`:`background: transparent; color: ${y};`}
    `,r==="assistant"?g?b.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:b.innerHTML=ne(d):b.textContent=d,p.appendChild(b),M.appendChild(p),$.scrollTop=$.scrollHeight,l}function ee(r,d){let g=M.querySelector(`#${r}`);if(!g)return;let l=g.querySelector(".n8n-message-content");l&&(l.innerHTML=ne(d));let p=e.find(b=>b.id===r);p&&(p.content=d),$.scrollTop=$.scrollHeight}async function le(r){let d=r||z.value.trim();if(!d)return;ce("user",d),z.value="",re();let g=ce("assistant","",!0);try{await We(d,g.id)}catch(l){console.error("[N8n Chat Widget] Error sending message:",l),ee(g.id,"Sorry, there was an error processing your message. Please try again.")}}function Se(){try{let r=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(r.searchParams),domain:window.location.hostname}}catch{return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function ke(r){return new Promise((d,g)=>{let l=new FileReader;l.onload=()=>{let b=l.result.split(",")[1];d({name:r.name,type:r.type,data:b,size:r.size})},l.onerror=()=>g(new Error(`Failed to read file: ${r.name}`)),l.readAsDataURL(r)})}async function We(r,d){let g=o.relay.relayUrl,l=u.getSessionId();try{let p=a.connection?.captureContext!==!1,b;n.length>0&&a.features.fileAttachmentsEnabled&&(b=await Promise.all(n.map(ke)),n=[],A&&(A.value=""));let Ie=de(o,{message:r,sessionId:l,context:p?Se():void 0,customContext:a.connection?.customContext,extraInputs:a.connection?.extraInputs,attachments:b}),U=await fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Ie)});if(!U.ok)throw new Error(`HTTP ${U.status}: ${U.statusText}`);let te=await U.json(),Le=te.response||te.message||te.output||"No response received";ee(d,Le)}catch(p){throw console.error("[N8n Chat Widget] Error sending message:",p),ee(d,"Sorry, there was an error connecting to the server. Please try again."),p}}}var D=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let i=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(t.style.cssText=i,e.showHeader){let u=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(u)}let n=this.createMessagesArea();t.appendChild(n);let s=this.createInputArea();return t.appendChild(s),t}createHeader(e,t){let i=document.createElement("div");i.className="chat-header",i.style.cssText=`
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
    `,e.appendChild(t),e.appendChild(i),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,i=window.innerHeight;t<768&&e.classList.add("mobile"),t>i&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var q=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
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
    `,t.addEventListener("click",e.onClick),t}};var N=class{constructor(e){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.uiBuilder=new q(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.bubble.addEventListener("click",()=>{this.toggleChatWindow()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),{chatWindow:this.chatWindow,bubble:this.bubble}}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
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
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let i=this.uiBuilder.createMessagesArea();e.appendChild(i);let n=this.uiBuilder.createInputArea();return e.appendChild(n),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var V=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var P=class{constructor(e){this.chatWindow=null;V.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new D(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new N(this.config),{chatWindow:t}=e.render();this.chatWindow=t}renderNormalMode(){let e=new N(this.config),{chatWindow:t}=e.render();this.chatWindow=t}};if(typeof window<"u"){let o=window;o.Widget=P,o.N8nWidget=P}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",o):o();async function o(){let e=window.ChatWidgetConfig||{},t=e.relay||(e.uiConfig?e.uiConfig.relay:{});if(t&&t.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{se(e);return}catch(a){console.error("[N8n Chat Widget] Initialization error:",a);return}}let i=t.licenseKey||"",n="",s=!1,u=document.querySelector('div[id^="n8n-chat-"]');!i&&u&&(i=u.id.replace("n8n-chat-",""));let v=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]');if(v&&v.src){let a=new URL(v.src);n=a.origin;let m=a.pathname.match(/\/w\/([A-Za-z0-9]{16})(?:\.js)?$/);if(m&&m[1])i||(i=m[1]),s=!0;else if(!i){let f=a.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);f&&f[1]&&(i=f[1])}}if(n||(n=window.location.origin),!i){console.warn("[N8n Chat Widget] Could not determine widget key.");return}let c=s?`${n}/w/${i}/config`:`${n}/api/widget/${i}/config`;try{let a=await fetch(c);if(!a.ok)throw new Error("Config fetch failed");let m=await a.json(),f={uiConfig:m,relay:{relayUrl:t.relayUrl||m.connection?.relayEndpoint||`${n}/api/chat-relay`,widgetId:t.widgetId||"",licenseKey:i}};window.ChatWidgetConfig=f,se(f)}catch(a){console.error("[N8n Chat Widget] Boot error:",a),u&&(u.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
