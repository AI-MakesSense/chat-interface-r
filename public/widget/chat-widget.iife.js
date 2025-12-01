"use strict";var ChatWidget=(()=>{function le(o){if(!o)return"";try{let e=Pe(o);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),o}}function Pe(o){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return o.replace(/[&<>"']/g,t=>e[t]||t)}function fe(o,e){let t=o.relay,i=o.uiConfig.connection;return{widgetId:t.widgetId,licenseKey:t.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,threadId:e.threadId,context:e.context,customContext:e.customContext??i?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??i?.extraInputs}}function ye(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let o=new Uint8Array(16);crypto.getRandomValues(o),o[6]=o[6]&15|64,o[8]=o[8]&63|128;let e=Array.from(o).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var Be="chat-widget-session-",je="chat-widget-thread-",Ke="chat-widget-session-start-",J=class{constructor(e){this.sessionId=null;this.threadId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${Be}${e}`,this.threadKey=`${je}${e}`,this.startTimeKey=`${Ke}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.threadKey),i=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.threadId=t,this.startTime=i?new Date(i):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString())),this.threadId&&sessionStorage.setItem(this.threadKey,this.threadId)}getSessionId(){return this.sessionId||(this.sessionId=ye(),this.startTime=new Date,this.saveSession()),this.sessionId}getThreadId(){return this.threadId}setThreadId(e){this.threadId=e,this.saveSession()}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.threadKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.threadId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};var Ue={none:0,small:6,medium:12,large:18,pill:9999},xe={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function be(o,e,t=0){let i=[98,96,92,88,80,70,60,50,40,30,22,14,8],n=e*2,s={};return i.forEach((h,v)=>{let a=Math.max(0,Math.min(100,h+t*2));s[`--cw-gray-${v}`]=`hsl(${o}, ${n}%, ${a}%)`}),s}function Oe(o,e,t,i){if(i){let n=5+e*2,s=10+t*.5;return{bg:`hsl(${o}, ${n}%, ${s}%)`,surface:`hsl(${o}, ${n}%, ${s+5}%)`,composerSurface:`hsl(${o}, ${n}%, ${s+5}%)`,border:`hsla(${o}, ${n}%, 90%, 0.08)`,text:`hsl(${o}, ${Math.max(0,n-10)}%, 90%)`,subText:`hsl(${o}, ${Math.max(0,n-10)}%, 60%)`,hoverSurface:`hsla(${o}, ${n}%, 90%, 0.05)`}}else{let n=10+e*3,s=98-t*2;return{bg:`hsl(${o}, ${n}%, ${s}%)`,surface:`hsl(${o}, ${n}%, ${s-5}%)`,composerSurface:`hsl(${o}, ${n}%, 100%)`,border:`hsla(${o}, ${n}%, 10%, 0.08)`,text:`hsl(${o}, ${n}%, 10%)`,subText:`hsl(${o}, ${n}%, 40%)`,hoverSurface:`hsla(${o}, ${n}%, 10%, 0.05)`}}}function we(o,e){let t=parseInt(o.replace("#",""),16),i=Math.min(255,Math.floor((t>>16)+(255-(t>>16))*e)),n=Math.min(255,Math.floor((t>>8&255)+(255-(t>>8&255))*e)),s=Math.min(255,Math.floor((t&255)+(255-(t&255))*e));return`#${(i<<16|n<<8|s).toString(16).padStart(6,"0")}`}function ve(o,e){let t=parseInt(o.replace("#",""),16),i=Math.max(0,Math.floor((t>>16)*(1-e))),n=Math.max(0,Math.floor((t>>8&255)*(1-e))),s=Math.max(0,Math.floor((t&255)*(1-e)));return`#${(i<<16|n<<8|s).toString(16).padStart(6,"0")}`}function Ce(o,e=1){let t=.15+e*.05;return{"--cw-accent-primary":o,"--cw-accent-hover":ve(o,t),"--cw-accent-active":ve(o,t*1.5),"--cw-accent-light":we(o,.9),"--cw-accent-lighter":we(o,.95)}}function $e(o){let e=o.theme,t=e?.colorScheme||o.style.theme||"light",i=t==="dark",n={"--cw-primary-color":o.style.primaryColor,"--cw-bg-color":o.style.backgroundColor,"--cw-text-color":o.style.textColor,"--cw-font-family":o.style.fontFamily,"--cw-font-size":`${o.style.fontSize}px`,"--cw-corner-radius":`${o.style.cornerRadius}px`};n["--cw-color-scheme"]=t;let s=e?.radius||"medium",h=Ue[s]??12;n["--cw-radius-sm"]=`${Math.max(0,h-4)}px`,n["--cw-radius-md"]=`${h}px`,n["--cw-radius-lg"]=`${h+4}px`,n["--cw-radius-xl"]=`${h+8}px`,n["--cw-radius-full"]=s==="pill"?"9999px":`${h*2}px`;let v=e?.density||"normal",a=xe[v]??xe.normal;n["--cw-spacing-xs"]=`${4*a.padding}px`,n["--cw-spacing-sm"]=`${8*a.padding}px`,n["--cw-spacing-md"]=`${12*a.padding}px`,n["--cw-spacing-lg"]=`${16*a.padding}px`,n["--cw-spacing-xl"]=`${24*a.padding}px`,n["--cw-gap"]=`${8*a.gap}px`;let c=e?.typography;c&&(c.baseSize&&(n["--cw-font-size"]=`${c.baseSize}px`,n["--cw-font-size-sm"]=`${c.baseSize-2}px`,n["--cw-font-size-lg"]=`${c.baseSize+2}px`,n["--cw-font-size-xl"]=`${c.baseSize+4}px`),c.fontFamily&&(n["--cw-font-family"]=c.fontFamily),c.fontFamilyMono&&(n["--cw-font-family-mono"]=c.fontFamilyMono));let m=e?.color?.grayscale;if(m){let f=be(m.hue,m.tint,m.shade??0);Object.assign(n,f);let x=Oe(m.hue,m.tint,m.shade??0,i);n["--cw-surface-bg"]=x.bg,n["--cw-surface-fg"]=x.surface,n["--cw-composer-surface"]=x.composerSurface,n["--cw-border-color"]=x.border,n["--cw-text-color"]=x.text,n["--cw-icon-color"]=x.subText,n["--cw-hover-surface"]=x.hoverSurface}else{let f=be(220,0,0);Object.assign(n,f)}let y=e?.color?.accent;if(y){let f=Ce(y.primary,y.level??1);Object.assign(n,f),n["--cw-primary-color"]=y.primary}else{let f=Ce(o.style.primaryColor,1);Object.assign(n,f)}let L=e?.color?.surface;L?(n["--cw-surface-bg"]=L.background,n["--cw-surface-fg"]=L.foreground):m||(n["--cw-surface-bg"]=i?"#1a1a1a":"#ffffff",n["--cw-surface-fg"]=i?"#2a2a2a":"#f8fafc",n["--cw-composer-surface"]=i?"#262626":"#ffffff",n["--cw-border-color"]=i?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",n["--cw-hover-surface"]=i?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let T=e?.color?.icon;T?n["--cw-icon-color"]=T:m||(n["--cw-icon-color"]=i?"#a1a1aa":"#6b7280");let b=e?.color?.userMessage;return b?(n["--cw-user-msg-text"]=b.text,n["--cw-user-msg-bg"]=b.background):y?(n["--cw-user-msg-text"]="#ffffff",n["--cw-user-msg-bg"]=y.primary):(n["--cw-user-msg-text"]=n["--cw-text-color"]||(i?"#e5e5e5":"#111827"),n["--cw-user-msg-bg"]=n["--cw-surface-fg"]||(i?"#262626":"#f3f4f6")),n["--cw-assistant-msg-text"]=n["--cw-text-color"]||(i?"#e5e5e5":"#1f2937"),n["--cw-assistant-msg-bg"]="transparent",n["--cw-border-color-strong"]=i?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",n["--cw-shadow-sm"]=i?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",n["--cw-shadow-md"]=i?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",n["--cw-shadow-lg"]=i?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",n}function Te(o){let e=o.theme?.typography?.fontSources;return!e||e.length===0?o.style.customFontUrl?o.style.customFontUrl:"":e.map(t=>`
@font-face {
  font-family: '${t.family}';
  src: url('${t.src}');
  font-weight: ${t.weight||400};
  font-style: ${t.style||"normal"};
  font-display: ${t.display||"swap"};
}
  `).join(`
`)}function de(o){let e=[],t=!1,i=0,n=[],s=o.uiConfig||{},h=new J(o.relay.licenseKey||"default"),v=s.theme?.colorScheme||s.style?.theme||"light",a=v==="dark",c={branding:{companyName:s.branding?.companyName||"Support",welcomeText:s.branding?.welcomeText||s.startScreen?.greeting||"How can we help you?",firstMessage:s.branding?.firstMessage||"",logoUrl:s.branding?.logoUrl},style:{theme:v,primaryColor:s.theme?.color?.accent?.primary||s.style?.primaryColor||"#0ea5e9",backgroundColor:s.theme?.color?.surface?.background||s.style?.backgroundColor||(a?"#1a1a1a":"#ffffff"),textColor:s.style?.textColor||(a?"#e5e5e5":"#1f2937"),fontFamily:s.theme?.typography?.fontFamily||s.style?.fontFamily||'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',fontSize:s.theme?.typography?.baseSize||s.style?.fontSize||14,position:s.style?.position||"bottom-right",cornerRadius:s.style?.cornerRadius||12},features:{fileAttachmentsEnabled:s.composer?.attachments?.enabled||s.features?.fileAttachmentsEnabled||!1,allowedExtensions:s.composer?.attachments?.accept||s.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:s.composer?.attachments?.maxSize?s.composer.attachments.maxSize/1024:s.features?.maxFileSizeKB||5e3},connection:s.connection,license:s.license,theme:s.theme,startScreen:s.startScreen,composer:s.composer},m=s.startScreen?.greeting||s.branding?.welcomeText||"How can I help you today?",y=$e(c),L=Te(c),T,b,f,x,E,H,F,O=s.theme?.color?.grayscale,z=s.theme?.color?.surface;if(O){let r=O.hue||220,d=O.tint||10,g=O.shade||50;if(a){let l=5+d*2,p=10+g*.5;T=`hsl(${r}, ${l}%, ${p}%)`,E=`hsl(${r}, ${l}%, ${p+5}%)`,H=E,x=`hsla(${r}, ${l}%, 90%, 0.08)`,b=`hsl(${r}, ${Math.max(0,l-10)}%, 90%)`,f=`hsl(${r}, ${Math.max(0,l-10)}%, 60%)`,F=`hsla(${r}, ${l}%, 90%, 0.05)`}else{let l=10+d*3,p=98-g*2;T=`hsl(${r}, ${l}%, ${p}%)`,E=`hsl(${r}, ${l}%, ${p-5}%)`,H=`hsl(${r}, ${l}%, 100%)`,x=`hsla(${r}, ${l}%, 10%, 0.08)`,b=`hsl(${r}, ${l}%, 10%)`,f=`hsl(${r}, ${l}%, 40%)`,F=`hsla(${r}, ${l}%, 10%, 0.05)`}}else z?(T=z.background||(a?"#1a1a1a":"#ffffff"),E=z.foreground||(a?"#262626":"#f8fafc"),H=E,x=a?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.08)",b=a?"#e5e5e5":"#111827",f=a?"#a1a1aa":"#6b7280",F=a?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)"):(T=a?"#1a1a1a":"#ffffff",b=a?"#e5e5e5":"#111827",f=a?"#a1a1aa":"#6b7280",x=a?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",E=a?"#262626":"#f3f4f6",H=a?"#262626":"#ffffff",F=a?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let te=s.theme?.color?.accent?.primary||c.style.primaryColor,R=!!s.theme?.color?.accent,ne=R?te:E,se=R?"#ffffff":b;s.theme?.color?.userMessage&&(ne=s.theme.color.userMessage.background||ne,se=s.theme.color.userMessage.text||se);let Ee=()=>{switch(s.theme?.radius||"medium"){case"none":return"0px";case"small":return"4px";case"medium":return"8px";case"large":return"16px";case"pill":return"24px";default:return"12px"}},Me=s.theme?.radius==="pill"?"20px":Ee(),oe=(()=>{switch(s.theme?.density||"normal"){case"compact":return"1rem";case"spacious":return"2.5rem";default:return"1.5rem"}})(),ie=document.createElement("style");ie.id="n8n-chat-widget-styles",ie.textContent=`
    ${L}

    #n8n-chat-widget-container {
      ${Object.entries(y).map(([r,d])=>`${r}: ${d};`).join(`
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
      color: ${b};
      text-align: left;
      transition: background 0.15s;
    }
    .n8n-starter-prompt:hover {
      background: ${F};
    }
    .n8n-starter-prompt-icon {
      color: ${f};
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
  `,document.head.appendChild(ie);let A=document.createElement("div");A.id="n8n-chat-widget-container",A.style.cssText=`
    position: fixed;
    ${c.style.position==="bottom-right"?"right: 24px;":"left: 24px;"}
    bottom: 24px;
    z-index: 999999;
    font-family: ${c.style.fontFamily};
    font-size: ${c.style.fontSize}px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
  `,document.body.appendChild(A);let D,N;R?(D=te,N="#ffffff"):z?(D=z.foreground||"#f8fafc",N=a?"#e5e5e5":"#111827"):(D=a?"#ffffff":"#000000",N=a?"#000000":"#ffffff");let C=document.createElement("button");C.id="n8n-chat-bubble",C.setAttribute("aria-label","Open chat"),C.style.cssText=`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${D};
    border: none;
    cursor: pointer;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.3s, box-shadow 0.3s;
    position: relative;
  `;let q=document.createElement("div");q.style.cssText="position: relative; width: 24px; height: 24px;";let V=document.createElement("span");V.id="n8n-bubble-message-icon",V.innerHTML=`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${N}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 1; transform: rotate(0deg) scale(1);">
      <path d="m3 21 1.9-5.7a8.5 8.5 0 1 1 3.8 3.8z"/>
    </svg>
  `;let _=document.createElement("span");_.id="n8n-bubble-close-icon",_.innerHTML=`
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="${N}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="position: absolute; inset: 0; transition: all 0.3s; opacity: 0; transform: rotate(-90deg) scale(0.5);">
      <path d="M18 6 6 18"/>
      <path d="m6 6 12 12"/>
    </svg>
  `,q.appendChild(V),q.appendChild(_),C.appendChild(q);let W=V.querySelector("svg"),I=_.querySelector("svg");C.addEventListener("mouseenter",()=>{C.style.transform="scale(1.05)"}),C.addEventListener("mouseleave",()=>{C.style.transform="scale(1)"}),C.addEventListener("click",Le);let u=document.createElement("div");u.id="n8n-chat-window",u.style.cssText=`
    display: none;
    width: 380px;
    height: 600px;
    max-height: 80vh;
    background: ${T};
    color: ${b};
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 16px;
    border: 1px solid ${x};
    position: relative;
    transform-origin: bottom right;
  `,A.appendChild(u),A.appendChild(C);let Y=document.createElement("div");Y.style.cssText=`
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    padding: 16px;
    z-index: 10;
    display: flex;
    justify-content: space-between;
    pointer-events: none;
  `,Y.innerHTML=`
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
        color: ${f};
        transition: background 0.15s;
      " title="Clear History">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
      </button>
    </div>
  `,u.appendChild(Y);let $=document.createElement("div");$.id="n8n-chat-messages",$.style.cssText=`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    padding: ${oe};
  `,u.appendChild($);let k=document.createElement("div");k.id="n8n-start-screen",k.style.cssText=`
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
  `;let re=document.createElement("h2");re.style.cssText=`
    font-size: 1.5rem;
    font-weight: 600;
    margin-bottom: 1.5rem;
    line-height: 1.3;
    letter-spacing: -0.01em;
    color: ${b};
  `,re.textContent=m,k.appendChild(re);let pe=c.startScreen?.prompts||[];if(pe.length>0){let r=document.createElement("div");r.style.cssText="display: flex; flex-direction: column; gap: 4px;",pe.forEach(d=>{let g=document.createElement("button");g.className="n8n-starter-prompt",g.innerHTML=`
        <span class="n8n-starter-prompt-icon">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </span>
        <span style="font-weight: 500;">${d.label}</span>
      `,g.addEventListener("click",()=>{he(d.prompt||d.label)}),r.appendChild(g)}),k.appendChild(r)}$.appendChild(k);let M=document.createElement("div");M.id="n8n-messages-list",M.style.cssText=`
    display: none;
    flex: 1;
    flex-direction: column;
    padding-top: 48px;
    gap: 16px;
  `,$.appendChild(M);let S=document.createElement("div");S.style.cssText=`
    padding: ${oe};
    padding-top: 0;
  `;let Se=s.theme?.radius==="none"?"0px":"999px",ke=c.composer?.placeholder||"Type a message...",P=`
    <form id="n8n-composer-form" style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: ${H};
      border-radius: ${Se};
      border: 1px solid ${x};
      box-shadow: ${a?"none":"0 4px 12px rgba(0,0,0,0.05)"};
      transition: box-shadow 0.15s;
    ">
  `;if(c.features.fileAttachmentsEnabled?P+=`
      <input type="file" id="n8n-file-input" multiple accept="${c.features.allowedExtensions.map(r=>"."+r).join(",")}" style="display: none;" />
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
        color: ${f};
        transition: background 0.15s;
        flex-shrink: 0;
      ">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </button>
    `:P+='<div style="width: 8px;"></div>',P+=`
    <input type="text" id="n8n-chat-input" placeholder="${ke}" style="
      flex: 1;
      border: none;
      background: transparent;
      outline: none;
      font-size: 14px;
      font-family: inherit;
      color: ${b};
      padding: 4px 8px;
    " />
  `,P+=`
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
  `,S.innerHTML=P,u.appendChild(S),c.composer?.disclaimer){let r=document.createElement("div");r.style.cssText=`
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 8px ${oe};
      font-size: 10px;
      color: ${f};
      opacity: 0.7;
    `,r.textContent=c.composer.disclaimer,u.appendChild(r)}let We=S.querySelector("#n8n-composer-form"),B=S.querySelector("#n8n-chat-input"),G=S.querySelector("#n8n-send-btn"),ge=S.querySelector("#n8n-attach-btn"),j=S.querySelector("#n8n-file-input"),Ie=Y.querySelector("#n8n-clear-history");function me(){B.value.trim().length>0?(G.style.background=R?te:a?"#e5e5e5":"#171717",G.style.color=R?"#ffffff":a?"#171717":"#ffffff"):(G.style.background=a?"#404040":"#f3f4f6",G.style.color=a?"#737373":"#a3a3a3")}B.addEventListener("input",me),We.addEventListener("submit",r=>{r.preventDefault(),he()}),Ie.addEventListener("click",()=>{e.length=0,M.innerHTML="",M.style.display="none",k.style.display="flex"}),ge&&j&&(ge.addEventListener("click",()=>j.click()),j.addEventListener("change",r=>{let d=r.target.files;d&&(n=Array.from(d))}));function Le(){t=!t,t?(u.style.display="flex",u.style.opacity="0",u.style.transform="scale(0.95) translateY(16px)",requestAnimationFrame(()=>{u.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",u.style.opacity="1",u.style.transform="scale(1) translateY(0)"}),W&&(W.style.opacity="0",W.style.transform="rotate(90deg) scale(0.5)"),I&&(I.style.opacity="1",I.style.transform="rotate(0deg) scale(1)"),B.focus()):(u.style.transition="opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",u.style.opacity="0",u.style.transform="scale(0.95) translateY(16px)",setTimeout(()=>{u.style.display="none"},300),W&&(W.style.opacity="1",W.style.transform="rotate(0deg) scale(1)"),I&&(I.style.opacity="0",I.style.transform="rotate(-90deg) scale(0.5)"))}function He(){k.style.display="none",M.style.display="flex"}function ue(r,d,g=!1){e.length===0&&He();let l={id:`msg-${++i}`,role:r,content:d,timestamp:Date.now()};e.push(l);let p=document.createElement("div");p.id=l.id,p.className="n8n-animate-in",p.style.cssText=`
      display: flex;
      flex-direction: column;
      ${r==="user"?"align-items: flex-end;":"align-items: flex-start;"}
    `;let w=document.createElement("div");return w.className="n8n-message-content",w.style.cssText=`
      max-width: 85%;
      padding: 10px 14px;
      border-radius: ${Me};
      line-height: 1.5;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      ${r==="user"?`background: ${ne}; color: ${se};`:`background: transparent; color: ${b};`}
    `,r==="assistant"?g?w.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:w.innerHTML=le(d):w.textContent=d,p.appendChild(w),M.appendChild(p),$.scrollTop=$.scrollHeight,l}function ae(r,d){let g=M.querySelector(`#${r}`);if(!g)return;let l=g.querySelector(".n8n-message-content");l&&(l.innerHTML=le(d));let p=e.find(w=>w.id===r);p&&(p.content=d),$.scrollTop=$.scrollHeight}async function he(r){let d=r||B.value.trim();if(!d)return;ue("user",d),B.value="",me();let g=ue("assistant","",!0);try{await Re(d,g.id)}catch(l){console.error("[N8n Chat Widget] Error sending message:",l),ae(g.id,"Sorry, there was an error processing your message. Please try again.")}}function Fe(){try{let r=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(r.searchParams),domain:window.location.hostname}}catch{return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function ze(r){return new Promise((d,g)=>{let l=new FileReader;l.onload=()=>{let w=l.result.split(",")[1];d({name:r.name,type:r.type,data:w,size:r.size})},l.onerror=()=>g(new Error(`Failed to read file: ${r.name}`)),l.readAsDataURL(r)})}async function Re(r,d){let g=o.relay.relayUrl,l=h.getSessionId();try{let p=c.connection?.captureContext!==!1,w;n.length>0&&c.features.fileAttachmentsEnabled&&(w=await Promise.all(n.map(ze)),n=[],j&&(j.value=""));let Ae=fe(o,{message:r,sessionId:l,context:p?Fe():void 0,customContext:c.connection?.customContext,extraInputs:c.connection?.extraInputs,attachments:w}),X=await fetch(g,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(Ae)});if(!X.ok)throw new Error(`HTTP ${X.status}: ${X.statusText}`);let ce=await X.json(),Ne=ce.response||ce.message||ce.output||"No response received";ae(d,Ne)}catch(p){throw console.error("[N8n Chat Widget] Error sending message:",p),ae(d,"Sorry, there was an error connecting to the server. Please try again."),p}}}var Z=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let i=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(t.style.cssText=i,e.showHeader){let h=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(h)}let n=this.createMessagesArea();t.appendChild(n);let s=this.createInputArea();return t.appendChild(s),t}createHeader(e,t){let i=document.createElement("div");i.className="chat-header",i.style.cssText=`
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
    `,e.appendChild(t),e.appendChild(i),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,i=window.innerHeight;t<768&&e.classList.add("mobile"),t>i&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var Q=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
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
    `,t.addEventListener("click",e.onClick),t}};var K=class{constructor(e){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.uiBuilder=new Q(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.bubble.addEventListener("click",()=>{this.toggleChatWindow()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),{chatWindow:this.chatWindow,bubble:this.bubble}}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
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
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let i=this.uiBuilder.createMessagesArea();e.appendChild(i);let n=this.uiBuilder.createInputArea();return e.appendChild(n),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var ee=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var U=class{constructor(e){this.chatWindow=null;ee.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new Z(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new K(this.config),{chatWindow:t}=e.render();this.chatWindow=t}renderNormalMode(){let e=new K(this.config),{chatWindow:t}=e.render();this.chatWindow=t}};if(typeof window<"u"){let o=window;o.Widget=U,o.N8nWidget=U}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",o):o();async function o(){let e=window.ChatWidgetConfig||{},t=e.relay||(e.uiConfig?e.uiConfig.relay:{});if(t&&t.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{de(e);return}catch(c){console.error("[N8n Chat Widget] Initialization error:",c);return}}let i=t.licenseKey||"",n="",s=!1,h=document.querySelector('div[id^="n8n-chat-"]');!i&&h&&(i=h.id.replace("n8n-chat-",""));let v=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]');if(v&&v.src){let c=new URL(v.src);n=c.origin;let m=c.pathname.match(/\/w\/([A-Za-z0-9]{16})(?:\.js)?$/);if(m&&m[1])i||(i=m[1]),s=!0;else if(!i){let y=c.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);y&&y[1]&&(i=y[1])}}if(n||(n=window.location.origin),!i){console.warn("[N8n Chat Widget] Could not determine widget key.");return}let a=s?`${n}/w/${i}/config`:`${n}/api/widget/${i}/config`;try{let c=await fetch(a);if(!c.ok)throw new Error("Config fetch failed");let m=await c.json(),y={uiConfig:m,relay:{relayUrl:t.relayUrl||m.connection?.relayEndpoint||`${n}/api/chat-relay`,widgetId:t.widgetId||"",licenseKey:i}};window.ChatWidgetConfig=y,de(y)}catch(c){console.error("[N8n Chat Widget] Boot error:",c),h&&(h.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
