"use strict";var ChatWidget=(()=>{function B(s){if(!s)return"";try{let e=de(s);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),s}}function de(s){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return s.replace(/[&<>"']/g,n=>e[n]||n)}function V(s,e){let n=s.relay,r=s.uiConfig.connection;return{widgetId:n.widgetId,licenseKey:n.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,threadId:e.threadId,context:e.context,customContext:e.customContext??r?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??r?.extraInputs}}function _(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let s=new Uint8Array(16);crypto.getRandomValues(s),s[6]=s[6]&15|64,s[8]=s[8]&63|128;let e=Array.from(s).map(n=>n.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var pe="chat-widget-session-",ge="chat-widget-thread-",me="chat-widget-session-start-",H=class{constructor(e){this.sessionId=null;this.threadId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${pe}${e}`,this.threadKey=`${ge}${e}`,this.startTimeKey=`${me}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),n=sessionStorage.getItem(this.threadKey),r=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.threadId=n,this.startTime=r?new Date(r):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString())),this.threadId&&sessionStorage.setItem(this.threadKey,this.threadId)}getSessionId(){return this.sessionId||(this.sessionId=_(),this.startTime=new Date,this.saveSession()),this.sessionId}getThreadId(){return this.threadId}setThreadId(e){this.threadId=e,this.saveSession()}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.threadKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.threadId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};var he={none:0,small:6,medium:12,large:18,pill:9999},G={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function X(s,e,n=0){let r=[98,96,92,88,80,70,60,50,40,30,22,14,8],t=e*2,i={};return r.forEach((g,w)=>{let c=Math.max(0,Math.min(100,g+n*2));i[`--cw-gray-${w}`]=`hsl(${s}, ${t}%, ${c}%)`}),i}function ue(s,e,n,r){if(r){let t=5+e*2,i=10+n*.5;return{bg:`hsl(${s}, ${t}%, ${i}%)`,surface:`hsl(${s}, ${t}%, ${i+5}%)`,composerSurface:`hsl(${s}, ${t}%, ${i+5}%)`,border:`hsla(${s}, ${t}%, 90%, 0.08)`,text:`hsl(${s}, ${Math.max(0,t-10)}%, 90%)`,subText:`hsl(${s}, ${Math.max(0,t-10)}%, 60%)`,hoverSurface:`hsla(${s}, ${t}%, 90%, 0.05)`}}else{let t=10+e*3,i=98-n*2;return{bg:`hsl(${s}, ${t}%, ${i}%)`,surface:`hsl(${s}, ${t}%, ${i-5}%)`,composerSurface:`hsl(${s}, ${t}%, 100%)`,border:`hsla(${s}, ${t}%, 10%, 0.08)`,text:`hsl(${s}, ${t}%, 10%)`,subText:`hsl(${s}, ${t}%, 40%)`,hoverSurface:`hsla(${s}, ${t}%, 10%, 0.05)`}}}function Z(s,e){let n=parseInt(s.replace("#",""),16),r=Math.min(255,Math.floor((n>>16)+(255-(n>>16))*e)),t=Math.min(255,Math.floor((n>>8&255)+(255-(n>>8&255))*e)),i=Math.min(255,Math.floor((n&255)+(255-(n&255))*e));return`#${(r<<16|t<<8|i).toString(16).padStart(6,"0")}`}function J(s,e){let n=parseInt(s.replace("#",""),16),r=Math.max(0,Math.floor((n>>16)*(1-e))),t=Math.max(0,Math.floor((n>>8&255)*(1-e))),i=Math.max(0,Math.floor((n&255)*(1-e)));return`#${(r<<16|t<<8|i).toString(16).padStart(6,"0")}`}function Y(s,e=1){let n=.15+e*.05;return{"--cw-accent-primary":s,"--cw-accent-hover":J(s,n),"--cw-accent-active":J(s,n*1.5),"--cw-accent-light":Z(s,.9),"--cw-accent-lighter":Z(s,.95)}}function Q(s){let e=s.theme,n=e?.colorScheme||s.style.theme||"light",r=n==="dark",t={"--cw-primary-color":s.style.primaryColor,"--cw-bg-color":s.style.backgroundColor,"--cw-text-color":s.style.textColor,"--cw-font-family":s.style.fontFamily,"--cw-font-size":`${s.style.fontSize}px`,"--cw-corner-radius":`${s.style.cornerRadius}px`};t["--cw-color-scheme"]=n;let i=e?.radius||"medium",g=he[i]??12;t["--cw-radius-sm"]=`${Math.max(0,g-4)}px`,t["--cw-radius-md"]=`${g}px`,t["--cw-radius-lg"]=`${g+4}px`,t["--cw-radius-xl"]=`${g+8}px`,t["--cw-radius-full"]=i==="pill"?"9999px":`${g*2}px`;let w=e?.density||"normal",c=G[w]??G.normal;t["--cw-spacing-xs"]=`${4*c.padding}px`,t["--cw-spacing-sm"]=`${8*c.padding}px`,t["--cw-spacing-md"]=`${12*c.padding}px`,t["--cw-spacing-lg"]=`${16*c.padding}px`,t["--cw-spacing-xl"]=`${24*c.padding}px`,t["--cw-gap"]=`${8*c.gap}px`;let o=e?.typography;o&&(o.baseSize&&(t["--cw-font-size"]=`${o.baseSize}px`,t["--cw-font-size-sm"]=`${o.baseSize-2}px`,t["--cw-font-size-lg"]=`${o.baseSize+2}px`,t["--cw-font-size-xl"]=`${o.baseSize+4}px`),o.fontFamily&&(t["--cw-font-family"]=o.fontFamily),o.fontFamilyMono&&(t["--cw-font-family-mono"]=o.fontFamilyMono));let p=e?.color?.grayscale;if(p){let d=X(p.hue,p.tint,p.shade??0);Object.assign(t,d);let y=ue(p.hue,p.tint,p.shade??0,r);t["--cw-surface-bg"]=y.bg,t["--cw-surface-fg"]=y.surface,t["--cw-composer-surface"]=y.composerSurface,t["--cw-border-color"]=y.border,t["--cw-text-color"]=y.text,t["--cw-icon-color"]=y.subText,t["--cw-hover-surface"]=y.hoverSurface}else{let d=X(220,0,0);Object.assign(t,d)}let h=e?.color?.accent;if(h){let d=Y(h.primary,h.level??1);Object.assign(t,d),t["--cw-primary-color"]=h.primary}else{let d=Y(s.style.primaryColor,1);Object.assign(t,d)}let T=e?.color?.surface;T?(t["--cw-surface-bg"]=T.background,t["--cw-surface-fg"]=T.foreground):p||(t["--cw-surface-bg"]=r?"#1a1a1a":"#ffffff",t["--cw-surface-fg"]=r?"#2a2a2a":"#f8fafc",t["--cw-composer-surface"]=r?"#262626":"#ffffff",t["--cw-border-color"]=r?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",t["--cw-hover-surface"]=r?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let C=e?.color?.icon;C?t["--cw-icon-color"]=C:p||(t["--cw-icon-color"]=r?"#a1a1aa":"#6b7280");let m=e?.color?.userMessage;return m?(t["--cw-user-msg-text"]=m.text,t["--cw-user-msg-bg"]=m.background):h?(t["--cw-user-msg-text"]="#ffffff",t["--cw-user-msg-bg"]=h.primary):(t["--cw-user-msg-text"]=t["--cw-text-color"]||(r?"#e5e5e5":"#111827"),t["--cw-user-msg-bg"]=t["--cw-surface-fg"]||(r?"#262626":"#f3f4f6")),t["--cw-assistant-msg-text"]=t["--cw-text-color"]||(r?"#e5e5e5":"#1f2937"),t["--cw-assistant-msg-bg"]="transparent",t["--cw-border-color-strong"]=r?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",t["--cw-shadow-sm"]=r?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",t["--cw-shadow-md"]=r?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",t["--cw-shadow-lg"]=r?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",t}function ee(s){let e=s.theme?.typography?.fontSources;return!e||e.length===0?s.style.customFontUrl?s.style.customFontUrl:"":e.map(n=>`
@font-face {
  font-family: '${n.family}';
  src: url('${n.src}');
  font-weight: ${n.weight||400};
  font-style: ${n.style||"normal"};
  font-display: ${n.display||"swap"};
}
  `).join(`
`)}function j(s){let e=[],n=!1,r=0,t=[],i=s.uiConfig||{},g=new H(s.relay.licenseKey||"default"),w=i.theme?.colorScheme||i.style?.theme||"light",c=w==="dark",o={branding:{companyName:i.branding?.companyName||"Support",welcomeText:i.branding?.welcomeText||i.startScreen?.greeting||"How can we help you?",firstMessage:i.branding?.firstMessage||"Hello! Ask me anything.",logoUrl:i.branding?.logoUrl},style:{theme:w,primaryColor:i.theme?.color?.accent?.primary||i.style?.primaryColor||"#0ea5e9",backgroundColor:i.theme?.color?.surface?.background||i.style?.backgroundColor||(c?"#1a1a1a":"#ffffff"),textColor:i.style?.textColor||(c?"#e5e5e5":"#1f2937"),fontFamily:i.theme?.typography?.fontFamily||i.style?.fontFamily||'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',fontSize:i.theme?.typography?.baseSize||i.style?.fontSize||14,position:i.style?.position||"bottom-right",cornerRadius:i.style?.cornerRadius||12},features:{fileAttachmentsEnabled:i.composer?.attachments?.enabled||i.features?.fileAttachmentsEnabled||!1,allowedExtensions:i.composer?.attachments?.accept||i.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:i.composer?.attachments?.maxSize?i.composer.attachments.maxSize/1024:i.features?.maxFileSizeKB||5e3},connection:i.connection,license:i.license,theme:i.theme,startScreen:i.startScreen,composer:i.composer},p=Q(o),h=ee(o),T=document.createElement("style");T.id="n8n-chat-widget-styles",T.textContent=`
    ${h}

    #n8n-chat-widget-container {
      ${Object.entries(p).map(([a,l])=>`${a}: ${l};`).join(`
      `)}
    }

    /* Typing animation */
    .n8n-typing-container {
      display: flex;
      gap: 4px;
      padding: 4px 0;
    }
    .n8n-typing-dot {
      width: 8px;
      height: 8px;
      background: var(--cw-icon-color, #64748b);
      border-radius: 50%;
      animation: n8n-typing 1.4s infinite ease-in-out both;
    }
    .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
    .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
    @keyframes n8n-typing {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
      40% { transform: scale(1); opacity: 1; }
    }

    /* Scrollbar styling */
    #n8n-chat-messages::-webkit-scrollbar {
      width: 6px;
    }
    #n8n-chat-messages::-webkit-scrollbar-track {
      background: transparent;
    }
    #n8n-chat-messages::-webkit-scrollbar-thumb {
      background: var(--cw-border-color-strong, rgba(0,0,0,0.15));
      border-radius: 3px;
    }

    /* Starter prompts */
    .n8n-starter-prompt {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: var(--cw-spacing-sm, 8px) var(--cw-spacing-md, 12px);
      background: var(--cw-surface-fg, #f8fafc);
      border: 1px solid var(--cw-border-color, rgba(0,0,0,0.1));
      border-radius: var(--cw-radius-md, 12px);
      cursor: pointer;
      font-size: var(--cw-font-size-sm, 13px);
      color: var(--cw-text-color, #1f2937);
      transition: all 0.15s ease;
    }
    .n8n-starter-prompt:hover {
      background: var(--cw-accent-lighter, #f0f9ff);
      border-color: var(--cw-accent-primary, #0ea5e9);
    }

    /* Markdown content styling */
    .n8n-message-content p { margin: 0 0 0.5em 0; }
    .n8n-message-content p:last-child { margin-bottom: 0; }
    .n8n-message-content code {
      background: var(--cw-surface-fg, #f1f5f9);
      padding: 2px 6px;
      border-radius: 4px;
      font-family: var(--cw-font-family-mono, ui-monospace, monospace);
      font-size: 0.9em;
    }
    .n8n-message-content pre {
      background: ${c?"#0d0d0d":"#1e293b"};
      color: #e2e8f0;
      padding: var(--cw-spacing-md, 12px);
      border-radius: var(--cw-radius-sm, 8px);
      overflow-x: auto;
      margin: 0.5em 0;
    }
    .n8n-message-content pre code {
      background: none;
      padding: 0;
      color: inherit;
    }
  `,document.head.appendChild(T);let C=document.createElement("div");C.id="n8n-chat-widget-container",C.style.cssText=`
    position: fixed;
    ${o.style.position==="bottom-right"?"right: 20px;":"left: 20px;"}
    bottom: 20px;
    z-index: 999999;
    font-family: var(--cw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    font-size: var(--cw-font-size, 14px);
  `,document.body.appendChild(C);let m=document.createElement("button");m.id="n8n-chat-bubble",m.setAttribute("aria-label","Open chat"),m.style.cssText=`
    width: 60px;
    height: 60px;
    border-radius: var(--cw-radius-full, 50%);
    background: var(--cw-accent-primary, ${o.style.primaryColor});
    border: none;
    cursor: pointer;
    box-shadow: var(--cw-shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  `,m.innerHTML=`
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        fill="white"/>
    </svg>
  `,m.addEventListener("mouseenter",()=>{m.style.transform="scale(1.1)"}),m.addEventListener("mouseleave",()=>{m.style.transform="scale(1)"}),m.addEventListener("click",D),C.appendChild(m);let d=document.createElement("div");d.id="n8n-chat-window",d.style.cssText=`
    display: none;
    width: 400px;
    height: 600px;
    max-height: 80vh;
    background: var(--cw-surface-bg, ${c?"#1a1a1a":"#ffffff"});
    color: var(--cw-text-color, ${c?"#e5e5e5":"#1f2937"});
    border-radius: var(--cw-radius-xl, ${o.style.cornerRadius}px);
    box-shadow: var(--cw-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 12px;
    border: 1px solid var(--cw-border-color, ${c?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"});
  `,C.appendChild(d);let y=document.createElement("div");y.style.cssText=`
    background: var(--cw-accent-primary, ${o.style.primaryColor});
    color: white;
    padding: var(--cw-spacing-lg, 16px);
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,y.innerHTML=`
    <div style="display: flex; align-items: center; gap: var(--cw-spacing-md, 12px);">
      ${o.branding.logoUrl?`<img src="${o.branding.logoUrl}" alt="Logo" style="width: 36px; height: 36px; border-radius: var(--cw-radius-full, 50%); object-fit: cover;" />`:""}
      <div>
        <div style="font-weight: 600; font-size: var(--cw-font-size-lg, 16px);">${o.branding.companyName}</div>
        <div style="font-size: var(--cw-font-size-sm, 13px); opacity: 0.9;">${o.branding.welcomeText}</div>
      </div>
    </div>
    <button id="n8n-chat-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; width: 28px; height: 28px; opacity: 0.8; transition: opacity 0.15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">\xD7</button>
  `,d.appendChild(y),y.querySelector("#n8n-chat-close")?.addEventListener("click",D);let v=document.createElement("div");v.id="n8n-chat-messages",v.style.cssText=`
    flex: 1;
    overflow-y: auto;
    padding: var(--cw-spacing-lg, 16px);
    background: var(--cw-surface-fg, ${c?"#0d0d0d":"#f8fafc"});
  `,d.appendChild(v);let U=o.startScreen?.prompts||[],$=null;U.length>0&&($=document.createElement("div"),$.id="n8n-starter-prompts",$.style.cssText=`
      padding: var(--cw-spacing-md, 12px) var(--cw-spacing-lg, 16px);
      display: flex;
      flex-wrap: wrap;
      gap: var(--cw-spacing-sm, 8px);
      background: var(--cw-surface-fg, ${c?"#0d0d0d":"#f8fafc"});
      border-top: 1px solid var(--cw-border-color, ${c?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"});
    `,U.forEach(a=>{let l=document.createElement("button");l.className="n8n-starter-prompt",l.innerHTML=`
        ${a.icon?`<span style="font-size: 16px;">${a.icon}</span>`:""}
        <span>${a.label}</span>
      `,l.addEventListener("click",()=>{let u=document.getElementById("n8n-chat-input");u&&(u.value=a.prompt||a.label,u.focus())}),$.appendChild(l)}),d.appendChild($));let te=o.composer?.placeholder||"Type a message...",K=!!o.theme?.color?.accent,E=document.createElement("div");E.style.cssText=`
    padding: var(--cw-spacing-lg, 16px);
    padding-top: 0;
    background: var(--cw-surface-bg, ${c?"#1a1a1a":"#ffffff"});
  `;let ne=o.theme?.radius==="none"?"0px":"999px",M=`
    <div style="
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px;
      background: var(--cw-composer-surface, var(--cw-surface-fg, ${c?"#262626":"#ffffff"}));
      border-radius: ${ne};
      border: 1px solid var(--cw-border-color, ${c?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)"});
      box-shadow: ${c?"none":"0 4px 12px rgba(0,0,0,0.05)"};
      transition: box-shadow 0.15s;
    ">
  `;if(o.features.fileAttachmentsEnabled?M+=`
      <input
        type="file"
        id="n8n-chat-file-input"
        multiple
        accept="${o.features.allowedExtensions.join(",")}"
        style="display: none;"
      />
      <button
        id="n8n-chat-attach"
        type="button"
        style="
          background: transparent;
          color: var(--cw-icon-color, ${c?"#a1a1aa":"#6b7280"});
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          min-width: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s;
        "
        title="Attach files"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
      </button>
    `:M+='<div style="width: 8px;"></div>',M+=`
      <input
        type="text"
        id="n8n-chat-input"
        placeholder="${te}"
        style="
          flex: 1;
          border: none;
          background: transparent;
          outline: none;
          font-size: var(--cw-font-size-sm, 14px);
          font-family: inherit;
          color: var(--cw-text-color, ${c?"#e5e5e5":"#111827"});
          padding: 4px 8px;
        "
      />
  `,M+=`
      <button
        id="n8n-chat-send"
        type="button"
        style="
          background: ${K?`var(--cw-accent-primary, ${o.style.primaryColor})`:c?"#e5e5e5":"#171717"};
          color: ${K?"#ffffff":c?"#171717":"#ffffff"};
          border: none;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          min-width: 32px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: background 0.15s, opacity 0.15s;
        "
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="19" x2="12" y2="5"></line>
          <polyline points="5 12 12 5 19 12"></polyline>
        </svg>
      </button>
    </div>
  `,E.innerHTML=M,d.appendChild(E),o.composer?.disclaimer){let a=document.createElement("div");a.style.cssText=`
      padding: var(--cw-spacing-xs, 4px) var(--cw-spacing-lg, 16px) var(--cw-spacing-sm, 8px);
      background: var(--cw-surface-bg, ${c?"#1a1a1a":"#ffffff"});
      font-size: var(--cw-font-size-sm, 12px);
      color: var(--cw-icon-color, ${c?"#71717a":"#9ca3af"});
      text-align: center;
    `,a.textContent=o.composer.disclaimer,d.appendChild(a)}if(o.license?.brandingEnabled){let a=document.createElement("div");a.style.cssText=`
      padding: var(--cw-spacing-sm, 8px) var(--cw-spacing-lg, 16px);
      background: var(--cw-surface-fg, ${c?"#1a1a1a":"#f8f9fa"});
      border-top: 1px solid var(--cw-border-color, ${c?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"});
      text-align: center;
      font-size: var(--cw-font-size-sm, 12px);
      color: var(--cw-icon-color, ${c?"#71717a":"#6b7280"});
    `,a.innerHTML=`Powered by <a href="https://n8n.io" target="_blank" style="color: var(--cw-accent-primary, ${o.style.primaryColor}); text-decoration: none;">n8n</a>`,d.appendChild(a)}let I=E.querySelector("#n8n-chat-input"),se=E.querySelector("#n8n-chat-send"),O=E.querySelector("#n8n-chat-attach"),S=E.querySelector("#n8n-chat-file-input");se.addEventListener("click",()=>q()),I.addEventListener("keypress",a=>{a.key==="Enter"&&q()}),O&&S&&(O.addEventListener("click",()=>{S.click()}),S.addEventListener("change",a=>{let l=a.target.files;l&&(t=Array.from(l),console.log(`[N8n Chat Widget] Selected ${t.length} file(s)`))}));function D(){n=!n,n?(d.style.display="flex",m.style.display="none",e.length===0&&o.branding.firstMessage&&A("assistant",o.branding.firstMessage),I.focus()):(d.style.display="none",m.style.display="flex")}function A(a,l,u=!1){let f={id:`msg-${++r}`,role:a,content:l,timestamp:Date.now()};e.push(f);let x=document.createElement("div");x.id=f.id,x.style.cssText=`
      margin-bottom: var(--cw-spacing-md, 12px);
      display: flex;
      ${a==="user"?"justify-content: flex-end;":"justify-content: flex-start;"}
    `;let b=document.createElement("div");return b.className="n8n-message-content",b.style.cssText=`
      max-width: 75%;
      padding: var(--cw-spacing-sm, 10px) var(--cw-spacing-md, 14px);
      border-radius: var(--cw-radius-lg, 12px);
      font-size: var(--cw-font-size, 14px);
      line-height: 1.5;
      ${a==="user"?`background: var(--cw-user-msg-bg, var(--cw-accent-primary, ${o.style.primaryColor})); color: var(--cw-user-msg-text, #ffffff);`:`background: var(--cw-assistant-msg-bg, ${c?"#2a2a2a":"#f3f4f6"}); color: var(--cw-assistant-msg-text, ${c?"#e5e5e5":"#1f2937"}); box-shadow: var(--cw-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));`}
    `,a==="assistant"?u?b.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:b.innerHTML=B(l):b.textContent=l,x.appendChild(b),v.appendChild(x),v.scrollTop=v.scrollHeight,f}function N(a,l){let u=v.querySelector(`#${a}`);if(!u)return;let f=u.querySelector("div");f&&(f.innerHTML=B(l));let x=e.find(b=>b.id===a);x&&(x.content=l),v.scrollTop=v.scrollHeight}async function q(){let a=I.value.trim();if(!a)return;A("user",a),I.value="";let l=A("assistant","",!0);try{await oe(a,l.id)}catch(u){console.error("[N8n Chat Widget] Error sending message:",u),N(l.id,"Sorry, there was an error processing your message. Please try again.")}}function re(){try{let a=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(a.searchParams),domain:window.location.hostname}}catch(a){return console.error("[N8n Chat Widget] Error capturing page context:",a),{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function ie(a){return new Promise((l,u)=>{let f=new FileReader;f.onload=()=>{let b=f.result.split(",")[1];l({name:a.name,type:a.type,data:b,size:a.size})},f.onerror=()=>{u(new Error(`Failed to read file: ${a.name}`))},f.readAsDataURL(a)})}async function oe(a,l){let u=s.relay.relayUrl,f=g.getSessionId();try{let x=o.connection?.captureContext!==!1,b;t.length>0&&o.features.fileAttachmentsEnabled&&(b=await Promise.all(t.map(le=>ie(le))),t=[],S&&(S.value=""));let ae=V(s,{message:a,sessionId:f,context:x?re():void 0,customContext:o.connection?.customContext,extraInputs:o.connection?.extraInputs,attachments:b}),L=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(ae)});if(!L.ok)throw new Error(`HTTP ${L.status}: ${L.statusText}`);let P=await L.json(),ce=P.response||P.message||P.output||"No response received";N(l,ce)}catch(x){throw console.error("[N8n Chat Widget] Error sending message:",x),N(l,"Sorry, there was an error connecting to the server. Please try again."),x}}}var z=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let n=document.createElement("div");n.className="chat-window",n.id="n8n-chat-window";let r=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(n.style.cssText=r,e.showHeader){let g=this.createHeader(e.headerTitle,e.showMinimize);n.appendChild(g)}let t=this.createMessagesArea();n.appendChild(t);let i=this.createInputArea();return n.appendChild(i),n}createHeader(e,n){let r=document.createElement("div");r.className="chat-header",r.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let t=document.createElement("div");if(t.textContent=e,r.appendChild(t),n){let i=document.createElement("button");i.className="minimize-btn",i.innerHTML="\xD7",i.style.cssText=`
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      `,r.appendChild(i)}return r}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `,this.config.branding?.firstMessage){let n=document.createElement("div");n.className="message assistant",n.style.cssText=`
        background: #f0f0f0;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      `,n.textContent=this.config.branding.firstMessage,e.appendChild(n)}return e}createInputArea(){let e=document.createElement("div");e.className="chat-input-area",e.style.cssText=`
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    `;let n=document.createElement("input");n.className="chat-input",n.type="text",n.placeholder="Type your message...",n.style.cssText=`
      flex: 1;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
    `;let r=document.createElement("button");return r.className="send-btn",r.textContent="Send",r.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(n),e.appendChild(r),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let n=window.innerWidth,r=window.innerHeight;n<768&&e.classList.add("mobile"),n>r&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var F=class{constructor(e){this.config=e}createHeader(e){let n=document.createElement("div");n.className="chat-header",n.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let r=document.createElement("div");r.textContent=e.title,n.appendChild(r);let t=document.createElement("div");if(t.style.cssText="display: flex; gap: 8px; align-items: center;",e.showFullscreenToggle&&e.onFullscreenToggle){let i=this.createButton({className:"fullscreen-toggle-btn",innerHTML:"\u25F1",title:"Enter fullscreen",onClick:e.onFullscreenToggle});t.appendChild(i)}if(e.showMinimize&&e.onMinimize){let i=this.createButton({className:"minimize-btn",innerHTML:"\xD7",title:"Close",fontSize:"24px",onClick:e.onMinimize});t.appendChild(i)}return n.appendChild(t),n}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `,this.config.branding?.firstMessage){let n=document.createElement("div");n.className="message assistant",n.style.cssText=`
        background: #f0f0f0;
        padding: 12px;
        border-radius: 8px;
        margin-bottom: 12px;
      `,n.textContent=this.config.branding.firstMessage,e.appendChild(n)}return e}createInputArea(){let e=document.createElement("div");e.className="chat-input-area",e.style.cssText=`
      padding: 16px;
      border-top: 1px solid #e0e0e0;
      display: flex;
      gap: 8px;
    `;let n=document.createElement("input");n.className="chat-input",n.type="text",n.placeholder="Type your message...",n.style.cssText=`
      flex: 1;
      padding: 12px;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 14px;
    `;let r=document.createElement("button");return r.className="send-btn",r.textContent="Send",r.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(n),e.appendChild(r),e}createButton(e){let n=document.createElement("button");return n.className=e.className,n.innerHTML=e.innerHTML,n.title=e.title,n.style.cssText=`
      background: none;
      border: none;
      color: white;
      font-size: ${e.fontSize||"20px"};
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    `,n.addEventListener("click",e.onClick),n}};var k=class{constructor(e){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.uiBuilder=new F(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.bubble.addEventListener("click",()=>{this.toggleChatWindow()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),{chatWindow:this.chatWindow,bubble:this.bubble}}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
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
    `;let n=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(n);let r=this.uiBuilder.createMessagesArea();e.appendChild(r);let t=this.uiBuilder.createInputArea();return e.appendChild(t),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var R=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var W=class{constructor(e){this.chatWindow=null;R.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new z(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new k(this.config),{chatWindow:n}=e.render();this.chatWindow=n}renderNormalMode(){let e=new k(this.config),{chatWindow:n}=e.render();this.chatWindow=n}};if(typeof window<"u"){let s=window;s.Widget=W,s.N8nWidget=W}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",s):s();async function s(){let e=window.ChatWidgetConfig||{},n=e.relay||(e.uiConfig?e.uiConfig.relay:{});if(n&&n.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{j(e);return}catch(o){console.error("[N8n Chat Widget] Initialization error:",o);return}}let r=n.licenseKey||"",t="",i=!1,g=document.querySelector('div[id^="n8n-chat-"]');!r&&g&&(r=g.id.replace("n8n-chat-",""));let w=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"], script[src*="/w/"]');if(w&&w.src){let o=new URL(w.src);t=o.origin;let p=o.pathname.match(/\/w\/([A-Za-z0-9]{16})(?:\.js)?$/);if(p&&p[1])r||(r=p[1]),i=!0;else if(!r){let h=o.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);h&&h[1]&&(r=h[1])}}if(t||(t=window.location.origin),!r){console.warn("[N8n Chat Widget] Could not determine widget key.");return}let c=i?`${t}/w/${r}/config`:`${t}/api/widget/${r}/config`;try{let o=await fetch(c);if(!o.ok)throw new Error("Config fetch failed");let p=await o.json(),h={uiConfig:p,relay:{relayUrl:n.relayUrl||p.connection?.relayEndpoint||`${t}/api/chat-relay`,widgetId:n.widgetId||"",licenseKey:r}};window.ChatWidgetConfig=h,j(h)}catch(o){console.error("[N8n Chat Widget] Boot error:",o),g&&(g.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
