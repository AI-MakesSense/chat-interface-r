"use strict";var ChatWidget=(()=>{function B(s){if(!s)return"";try{let e=de(s);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),s}}function de(s){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return s.replace(/[&<>"']/g,t=>e[t]||t)}function V(s,e){let t=s.relay,r=s.uiConfig.connection;return{widgetId:t.widgetId,licenseKey:t.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,context:e.context,customContext:e.customContext??r?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??r?.extraInputs}}function _(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let s=new Uint8Array(16);crypto.getRandomValues(s),s[6]=s[6]&15|64,s[8]=s[8]&63|128;let e=Array.from(s).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var pe="chat-widget-session-",ge="chat-widget-session-start-",I=class{constructor(e){this.sessionId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${pe}${e}`,this.startTimeKey=`${ge}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.startTime=t?new Date(t):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString()))}getSessionId(){return this.sessionId||(this.sessionId=_(),this.startTime=new Date,this.saveSession()),this.sessionId}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};var me={none:0,small:6,medium:12,large:18,pill:9999},G={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function X(s,e,t=0){let r=[98,96,92,88,80,70,60,50,40,30,22,14,8],n=e*2,i={};return r.forEach((m,p)=>{let c=Math.max(0,Math.min(100,m+t*2));i[`--cw-gray-${p}`]=`hsl(${s}, ${n}%, ${c}%)`}),i}function ue(s,e,t,r){if(r){let n=5+e*2,i=10+t*.5;return{bg:`hsl(${s}, ${n}%, ${i}%)`,surface:`hsl(${s}, ${n}%, ${i+5}%)`,composerSurface:`hsl(${s}, ${n}%, ${i+5}%)`,border:`hsla(${s}, ${n}%, 90%, 0.08)`,text:`hsl(${s}, ${Math.max(0,n-10)}%, 90%)`,subText:`hsl(${s}, ${Math.max(0,n-10)}%, 60%)`,hoverSurface:`hsla(${s}, ${n}%, 90%, 0.05)`}}else{let n=10+e*3,i=98-t*2;return{bg:`hsl(${s}, ${n}%, ${i}%)`,surface:`hsl(${s}, ${n}%, ${i-5}%)`,composerSurface:`hsl(${s}, ${n}%, 100%)`,border:`hsla(${s}, ${n}%, 10%, 0.08)`,text:`hsl(${s}, ${n}%, 10%)`,subText:`hsl(${s}, ${n}%, 40%)`,hoverSurface:`hsla(${s}, ${n}%, 10%, 0.05)`}}}function J(s,e){let t=parseInt(s.replace("#",""),16),r=Math.min(255,Math.floor((t>>16)+(255-(t>>16))*e)),n=Math.min(255,Math.floor((t>>8&255)+(255-(t>>8&255))*e)),i=Math.min(255,Math.floor((t&255)+(255-(t&255))*e));return`#${(r<<16|n<<8|i).toString(16).padStart(6,"0")}`}function Y(s,e){let t=parseInt(s.replace("#",""),16),r=Math.max(0,Math.floor((t>>16)*(1-e))),n=Math.max(0,Math.floor((t>>8&255)*(1-e))),i=Math.max(0,Math.floor((t&255)*(1-e)));return`#${(r<<16|n<<8|i).toString(16).padStart(6,"0")}`}function Z(s,e=1){let t=.15+e*.05;return{"--cw-accent-primary":s,"--cw-accent-hover":Y(s,t),"--cw-accent-active":Y(s,t*1.5),"--cw-accent-light":J(s,.9),"--cw-accent-lighter":J(s,.95)}}function Q(s){let e=s.theme,t=e?.colorScheme||s.style.theme||"light",r=t==="dark",n={"--cw-primary-color":s.style.primaryColor,"--cw-bg-color":s.style.backgroundColor,"--cw-text-color":s.style.textColor,"--cw-font-family":s.style.fontFamily,"--cw-font-size":`${s.style.fontSize}px`,"--cw-corner-radius":`${s.style.cornerRadius}px`};n["--cw-color-scheme"]=t;let i=e?.radius||"medium",m=me[i]??12;n["--cw-radius-sm"]=`${Math.max(0,m-4)}px`,n["--cw-radius-md"]=`${m}px`,n["--cw-radius-lg"]=`${m+4}px`,n["--cw-radius-xl"]=`${m+8}px`,n["--cw-radius-full"]=i==="pill"?"9999px":`${m*2}px`;let p=e?.density||"normal",c=G[p]??G.normal;n["--cw-spacing-xs"]=`${4*c.padding}px`,n["--cw-spacing-sm"]=`${8*c.padding}px`,n["--cw-spacing-md"]=`${12*c.padding}px`,n["--cw-spacing-lg"]=`${16*c.padding}px`,n["--cw-spacing-xl"]=`${24*c.padding}px`,n["--cw-gap"]=`${8*c.gap}px`;let a=e?.typography;a&&(a.baseSize&&(n["--cw-font-size"]=`${a.baseSize}px`,n["--cw-font-size-sm"]=`${a.baseSize-2}px`,n["--cw-font-size-lg"]=`${a.baseSize+2}px`,n["--cw-font-size-xl"]=`${a.baseSize+4}px`),a.fontFamily&&(n["--cw-font-family"]=a.fontFamily),a.fontFamilyMono&&(n["--cw-font-family-mono"]=a.fontFamilyMono));let y=e?.color?.grayscale;if(y){let d=X(y.hue,y.tint,y.shade??0);Object.assign(n,d);let b=ue(y.hue,y.tint,y.shade??0,r);n["--cw-surface-bg"]=b.bg,n["--cw-surface-fg"]=b.surface,n["--cw-composer-surface"]=b.composerSurface,n["--cw-border-color"]=b.border,n["--cw-text-color"]=b.text,n["--cw-icon-color"]=b.subText,n["--cw-hover-surface"]=b.hoverSurface}else{let d=X(220,0,0);Object.assign(n,d)}let v=e?.color?.accent;if(v){let d=Z(v.primary,v.level??1);Object.assign(n,d),n["--cw-primary-color"]=v.primary}else{let d=Z(s.style.primaryColor,1);Object.assign(n,d)}let E=e?.color?.surface;E?(n["--cw-surface-bg"]=E.background,n["--cw-surface-fg"]=E.foreground):y||(n["--cw-surface-bg"]=r?"#1a1a1a":"#ffffff",n["--cw-surface-fg"]=r?"#2a2a2a":"#f8fafc",n["--cw-composer-surface"]=r?"#262626":"#ffffff",n["--cw-border-color"]=r?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",n["--cw-hover-surface"]=r?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let C=e?.color?.icon;C?n["--cw-icon-color"]=C:y||(n["--cw-icon-color"]=r?"#a1a1aa":"#6b7280");let g=e?.color?.userMessage;return g?(n["--cw-user-msg-text"]=g.text,n["--cw-user-msg-bg"]=g.background):v?(n["--cw-user-msg-text"]="#ffffff",n["--cw-user-msg-bg"]=v.primary):(n["--cw-user-msg-text"]=n["--cw-text-color"]||(r?"#e5e5e5":"#111827"),n["--cw-user-msg-bg"]=n["--cw-surface-fg"]||(r?"#262626":"#f3f4f6")),n["--cw-assistant-msg-text"]=n["--cw-text-color"]||(r?"#e5e5e5":"#1f2937"),n["--cw-assistant-msg-bg"]="transparent",n["--cw-border-color-strong"]=r?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",n["--cw-shadow-sm"]=r?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",n["--cw-shadow-md"]=r?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",n["--cw-shadow-lg"]=r?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",n}function ee(s){let e=s.theme?.typography?.fontSources;return!e||e.length===0?s.style.customFontUrl?s.style.customFontUrl:"":e.map(t=>`
@font-face {
  font-family: '${t.family}';
  src: url('${t.src}');
  font-weight: ${t.weight||400};
  font-style: ${t.style||"normal"};
  font-display: ${t.display||"swap"};
}
  `).join(`
`)}function j(s){let e=[],t=!1,r=0,n=[],i=s.uiConfig||{},m=new I(s.relay.licenseKey||"default"),p=i.theme?.colorScheme||i.style?.theme||"light",c=p==="dark",a={branding:{companyName:i.branding?.companyName||"Support",welcomeText:i.branding?.welcomeText||i.startScreen?.greeting||"How can we help you?",firstMessage:i.branding?.firstMessage||"Hello! Ask me anything.",logoUrl:i.branding?.logoUrl},style:{theme:p,primaryColor:i.theme?.color?.accent?.primary||i.style?.primaryColor||"#0ea5e9",backgroundColor:i.theme?.color?.surface?.background||i.style?.backgroundColor||(c?"#1a1a1a":"#ffffff"),textColor:i.style?.textColor||(c?"#e5e5e5":"#1f2937"),fontFamily:i.theme?.typography?.fontFamily||i.style?.fontFamily||'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',fontSize:i.theme?.typography?.baseSize||i.style?.fontSize||14,position:i.style?.position||"bottom-right",cornerRadius:i.style?.cornerRadius||12},features:{fileAttachmentsEnabled:i.composer?.attachments?.enabled||i.features?.fileAttachmentsEnabled||!1,allowedExtensions:i.composer?.attachments?.accept||i.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:i.composer?.attachments?.maxSize?i.composer.attachments.maxSize/1024:i.features?.maxFileSizeKB||5e3},connection:i.connection,license:i.license,theme:i.theme,startScreen:i.startScreen,composer:i.composer},y=Q(a),v=ee(a),E=document.createElement("style");E.id="n8n-chat-widget-styles",E.textContent=`
    ${v}

    #n8n-chat-widget-container {
      ${Object.entries(y).map(([o,l])=>`${o}: ${l};`).join(`
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
  `,document.head.appendChild(E);let C=document.createElement("div");C.id="n8n-chat-widget-container",C.style.cssText=`
    position: fixed;
    ${a.style.position==="bottom-right"?"right: 20px;":"left: 20px;"}
    bottom: 20px;
    z-index: 999999;
    font-family: var(--cw-font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif);
    font-size: var(--cw-font-size, 14px);
  `,document.body.appendChild(C);let g=document.createElement("button");g.id="n8n-chat-bubble",g.setAttribute("aria-label","Open chat"),g.style.cssText=`
    width: 60px;
    height: 60px;
    border-radius: var(--cw-radius-full, 50%);
    background: var(--cw-accent-primary, ${a.style.primaryColor});
    border: none;
    cursor: pointer;
    box-shadow: var(--cw-shadow-lg, 0 4px 12px rgba(0, 0, 0, 0.15));
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s, box-shadow 0.2s;
  `,g.innerHTML=`
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        fill="white"/>
    </svg>
  `,g.addEventListener("mouseenter",()=>{g.style.transform="scale(1.1)"}),g.addEventListener("mouseleave",()=>{g.style.transform="scale(1)"}),g.addEventListener("click",D),C.appendChild(g);let d=document.createElement("div");d.id="n8n-chat-window",d.style.cssText=`
    display: none;
    width: 400px;
    height: 600px;
    max-height: 80vh;
    background: var(--cw-surface-bg, ${c?"#1a1a1a":"#ffffff"});
    color: var(--cw-text-color, ${c?"#e5e5e5":"#1f2937"});
    border-radius: var(--cw-radius-xl, ${a.style.cornerRadius}px);
    box-shadow: var(--cw-shadow-lg, 0 8px 24px rgba(0, 0, 0, 0.15));
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 12px;
    border: 1px solid var(--cw-border-color, ${c?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"});
  `,C.appendChild(d);let b=document.createElement("div");b.style.cssText=`
    background: var(--cw-accent-primary, ${a.style.primaryColor});
    color: white;
    padding: var(--cw-spacing-lg, 16px);
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,b.innerHTML=`
    <div style="display: flex; align-items: center; gap: var(--cw-spacing-md, 12px);">
      ${a.branding.logoUrl?`<img src="${a.branding.logoUrl}" alt="Logo" style="width: 36px; height: 36px; border-radius: var(--cw-radius-full, 50%); object-fit: cover;" />`:""}
      <div>
        <div style="font-weight: 600; font-size: var(--cw-font-size-lg, 16px);">${a.branding.companyName}</div>
        <div style="font-size: var(--cw-font-size-sm, 13px); opacity: 0.9;">${a.branding.welcomeText}</div>
      </div>
    </div>
    <button id="n8n-chat-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; width: 28px; height: 28px; opacity: 0.8; transition: opacity 0.15s;" onmouseover="this.style.opacity='1'" onmouseout="this.style.opacity='0.8'">\xD7</button>
  `,d.appendChild(b),b.querySelector("#n8n-chat-close")?.addEventListener("click",D);let w=document.createElement("div");w.id="n8n-chat-messages",w.style.cssText=`
    flex: 1;
    overflow-y: auto;
    padding: var(--cw-spacing-lg, 16px);
    background: var(--cw-surface-fg, ${c?"#0d0d0d":"#f8fafc"});
  `,d.appendChild(w);let U=a.startScreen?.prompts||[],$=null;U.length>0&&($=document.createElement("div"),$.id="n8n-starter-prompts",$.style.cssText=`
      padding: var(--cw-spacing-md, 12px) var(--cw-spacing-lg, 16px);
      display: flex;
      flex-wrap: wrap;
      gap: var(--cw-spacing-sm, 8px);
      background: var(--cw-surface-fg, ${c?"#0d0d0d":"#f8fafc"});
      border-top: 1px solid var(--cw-border-color, ${c?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"});
    `,U.forEach(o=>{let l=document.createElement("button");l.className="n8n-starter-prompt",l.innerHTML=`
        ${o.icon?`<span style="font-size: 16px;">${o.icon}</span>`:""}
        <span>${o.label}</span>
      `,l.addEventListener("click",()=>{let u=document.getElementById("n8n-chat-input");u&&(u.value=o.prompt||o.label,u.focus())}),$.appendChild(l)}),d.appendChild($));let te=a.composer?.placeholder||"Type a message...",K=!!a.theme?.color?.accent,T=document.createElement("div");T.style.cssText=`
    padding: var(--cw-spacing-lg, 16px);
    padding-top: 0;
    background: var(--cw-surface-bg, ${c?"#1a1a1a":"#ffffff"});
  `;let ne=a.theme?.radius==="none"?"0px":"999px",M=`
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
  `;if(a.features.fileAttachmentsEnabled?M+=`
      <input
        type="file"
        id="n8n-chat-file-input"
        multiple
        accept="${a.features.allowedExtensions.join(",")}"
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
          background: ${K?`var(--cw-accent-primary, ${a.style.primaryColor})`:c?"#e5e5e5":"#171717"};
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
  `,T.innerHTML=M,d.appendChild(T),a.composer?.disclaimer){let o=document.createElement("div");o.style.cssText=`
      padding: var(--cw-spacing-xs, 4px) var(--cw-spacing-lg, 16px) var(--cw-spacing-sm, 8px);
      background: var(--cw-surface-bg, ${c?"#1a1a1a":"#ffffff"});
      font-size: var(--cw-font-size-sm, 12px);
      color: var(--cw-icon-color, ${c?"#71717a":"#9ca3af"});
      text-align: center;
    `,o.textContent=a.composer.disclaimer,d.appendChild(o)}if(a.license?.brandingEnabled){let o=document.createElement("div");o.style.cssText=`
      padding: var(--cw-spacing-sm, 8px) var(--cw-spacing-lg, 16px);
      background: var(--cw-surface-fg, ${c?"#1a1a1a":"#f8f9fa"});
      border-top: 1px solid var(--cw-border-color, ${c?"rgba(255,255,255,0.1)":"rgba(0,0,0,0.1)"});
      text-align: center;
      font-size: var(--cw-font-size-sm, 12px);
      color: var(--cw-icon-color, ${c?"#71717a":"#6b7280"});
    `,o.innerHTML=`Powered by <a href="https://n8n.io" target="_blank" style="color: var(--cw-accent-primary, ${a.style.primaryColor}); text-decoration: none;">n8n</a>`,d.appendChild(o)}let L=T.querySelector("#n8n-chat-input"),se=T.querySelector("#n8n-chat-send"),O=T.querySelector("#n8n-chat-attach"),S=T.querySelector("#n8n-chat-file-input");se.addEventListener("click",()=>q()),L.addEventListener("keypress",o=>{o.key==="Enter"&&q()}),O&&S&&(O.addEventListener("click",()=>{S.click()}),S.addEventListener("change",o=>{let l=o.target.files;l&&(n=Array.from(l),console.log(`[N8n Chat Widget] Selected ${n.length} file(s)`))}));function D(){t=!t,t?(d.style.display="flex",g.style.display="none",e.length===0&&a.branding.firstMessage&&N("assistant",a.branding.firstMessage),L.focus()):(d.style.display="none",g.style.display="flex")}function N(o,l,u=!1){let f={id:`msg-${++r}`,role:o,content:l,timestamp:Date.now()};e.push(f);let h=document.createElement("div");h.id=f.id,h.style.cssText=`
      margin-bottom: var(--cw-spacing-md, 12px);
      display: flex;
      ${o==="user"?"justify-content: flex-end;":"justify-content: flex-start;"}
    `;let x=document.createElement("div");return x.className="n8n-message-content",x.style.cssText=`
      max-width: 75%;
      padding: var(--cw-spacing-sm, 10px) var(--cw-spacing-md, 14px);
      border-radius: var(--cw-radius-lg, 12px);
      font-size: var(--cw-font-size, 14px);
      line-height: 1.5;
      ${o==="user"?`background: var(--cw-user-msg-bg, var(--cw-accent-primary, ${a.style.primaryColor})); color: var(--cw-user-msg-text, #ffffff);`:`background: var(--cw-assistant-msg-bg, ${c?"#2a2a2a":"#f3f4f6"}); color: var(--cw-assistant-msg-text, ${c?"#e5e5e5":"#1f2937"}); box-shadow: var(--cw-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));`}
    `,o==="assistant"?u?x.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:x.innerHTML=B(l):x.textContent=l,h.appendChild(x),w.appendChild(h),w.scrollTop=w.scrollHeight,f}function A(o,l){let u=w.querySelector(`#${o}`);if(!u)return;let f=u.querySelector("div");f&&(f.innerHTML=B(l));let h=e.find(x=>x.id===o);h&&(h.content=l),w.scrollTop=w.scrollHeight}async function q(){let o=L.value.trim();if(!o)return;N("user",o),L.value="";let l=N("assistant","",!0);try{await oe(o,l.id)}catch(u){console.error("[N8n Chat Widget] Error sending message:",u),A(l.id,"Sorry, there was an error processing your message. Please try again.")}}function ie(){try{let o=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(o.searchParams),domain:window.location.hostname}}catch(o){return console.error("[N8n Chat Widget] Error capturing page context:",o),{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function re(o){return new Promise((l,u)=>{let f=new FileReader;f.onload=()=>{let x=f.result.split(",")[1];l({name:o.name,type:o.type,data:x,size:o.size})},f.onerror=()=>{u(new Error(`Failed to read file: ${o.name}`))},f.readAsDataURL(o)})}async function oe(o,l){let u=s.relay.relayUrl,f=m.getSessionId();try{let h=a.connection?.captureContext!==!1,x;n.length>0&&a.features.fileAttachmentsEnabled&&(x=await Promise.all(n.map(le=>re(le))),n=[],S&&(S.value=""));let ae=V(s,{message:o,sessionId:f,context:h?ie():void 0,customContext:a.connection?.customContext,extraInputs:a.connection?.extraInputs,attachments:x}),H=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(ae)});if(!H.ok)throw new Error(`HTTP ${H.status}: ${H.statusText}`);let P=await H.json(),ce=P.response||P.message||P.output||"No response received";A(l,ce)}catch(h){throw console.error("[N8n Chat Widget] Error sending message:",h),A(l,"Sorry, there was an error connecting to the server. Please try again."),h}}}var z=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let r=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(t.style.cssText=r,e.showHeader){let m=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(m)}let n=this.createMessagesArea();t.appendChild(n);let i=this.createInputArea();return t.appendChild(i),t}createHeader(e,t){let r=document.createElement("div");r.className="chat-header",r.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let n=document.createElement("div");if(n.textContent=e,r.appendChild(n),t){let i=document.createElement("button");i.className="minimize-btn",i.innerHTML="\xD7",i.style.cssText=`
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
    `;let r=document.createElement("button");return r.className="send-btn",r.textContent="Send",r.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(r),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,r=window.innerHeight;t<768&&e.classList.add("mobile"),t>r&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var F=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let r=document.createElement("div");r.textContent=e.title,t.appendChild(r);let n=document.createElement("div");if(n.style.cssText="display: flex; gap: 8px; align-items: center;",e.showFullscreenToggle&&e.onFullscreenToggle){let i=this.createButton({className:"fullscreen-toggle-btn",innerHTML:"\u25F1",title:"Enter fullscreen",onClick:e.onFullscreenToggle});n.appendChild(i)}if(e.showMinimize&&e.onMinimize){let i=this.createButton({className:"minimize-btn",innerHTML:"\xD7",title:"Close",fontSize:"24px",onClick:e.onMinimize});n.appendChild(i)}return t.appendChild(n),t}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `;let r=document.createElement("button");return r.className="send-btn",r.textContent="Send",r.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(r),e}createButton(e){let t=document.createElement("button");return t.className=e.className,t.innerHTML=e.innerHTML,t.title=e.title,t.style.cssText=`
      background: none;
      border: none;
      color: white;
      font-size: ${e.fontSize||"20px"};
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    `,t.addEventListener("click",e.onClick),t}};var k=class{constructor(e){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.uiBuilder=new F(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.bubble.addEventListener("click",()=>{this.toggleChatWindow()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),{chatWindow:this.chatWindow,bubble:this.bubble}}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
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
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let r=this.uiBuilder.createMessagesArea();e.appendChild(r);let n=this.uiBuilder.createInputArea();return e.appendChild(n),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var R=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var W=class{constructor(e){this.chatWindow=null;R.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new z(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new k(this.config),{chatWindow:t}=e.render();this.chatWindow=t}renderNormalMode(){let e=new k(this.config),{chatWindow:t}=e.render();this.chatWindow=t}};if(typeof window<"u"){let s=window;s.Widget=W,s.N8nWidget=W}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",s):s();async function s(){let e=window.ChatWidgetConfig||{},t=e.relay||(e.uiConfig?e.uiConfig.relay:{});if(t&&t.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{j(e);return}catch(p){console.error("[N8n Chat Widget] Initialization error:",p);return}}let r=t.licenseKey||"",n="",i=document.querySelector('div[id^="n8n-chat-"]');!r&&i&&(r=i.id.replace("n8n-chat-",""));let m=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"]');if(m&&m.src){let p=new URL(m.src);if(n=p.origin,!r){let c=p.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);c&&c[1]&&(r=c[1])}}if(n||(n=window.location.origin),!r){console.warn("[N8n Chat Widget] Could not determine license key.");return}try{let p=await fetch(`${n}/api/widget/${r}/config`);if(!p.ok)throw new Error("Config fetch failed");let c=await p.json(),a={uiConfig:c,relay:{relayUrl:t.relayUrl||c.connection?.relayEndpoint||`${n}/api/chat-relay`,widgetId:t.widgetId||"",licenseKey:r}};window.ChatWidgetConfig=a,j(a)}catch(p){console.error("[N8n Chat Widget] Boot error:",p),i&&(i.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
