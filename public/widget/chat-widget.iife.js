"use strict";var ChatWidget=(()=>{var f=class{constructor(e,t){this.chatWindow=null;this.config=e,this.widget=t}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.widget.ui.chatWindow=this.chatWindow,this.widget.ui.messagesContainer=this.chatWindow.querySelector(".chat-messages"),this.widget.ui.input=this.chatWindow.querySelector(".chat-input"),this.widget.ui.sendBtn=this.chatWindow.querySelector(".send-btn"),this.bindEvents(),this.autoFocusInput(),this.chatWindow}bindEvents(){this.widget.ui.sendBtn&&this.widget.ui.sendBtn.addEventListener("click",()=>this.widget.handleSendMessage()),this.widget.ui.input&&this.widget.ui.input.addEventListener("keypress",e=>{e.key==="Enter"&&this.widget.handleSendMessage()})}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let s=`
      background: ${this.config.style?.theme==="dark"?"#1a1a1a":"white"};
      color: ${this.config.style?.theme==="dark"?"white":"inherit"};
      flex-direction: column;
      overflow: hidden;
    `;if(t.style.cssText=s,e.showHeader){let o=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(o)}let i=this.createMessagesArea();t.appendChild(i);let r=this.createInputArea();return t.appendChild(r),t}createHeader(e,t){let s=document.createElement("div");s.className="chat-header",s.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let i=document.createElement("div");return i.textContent=e,s.appendChild(i),s}createMessagesArea(){let e=document.createElement("div");return e.className="chat-messages",e.style.cssText=`
      flex: 1;
      overflow-y: auto;
      padding: 16px;
    `,this.config.branding?.firstMessage,e}createInputArea(){let e=document.createElement("div");e.className="chat-input-area",e.style.cssText=`
      padding: 16px;
      border-top: 1px solid ${this.config.style?.theme==="dark"?"#333":"#e0e0e0"};
      display: flex;
      gap: 8px;
    `;let t=document.createElement("input");t.className="chat-input",t.type="text",t.placeholder="Type your message...",t.style.cssText=`
      flex: 1;
      padding: 12px;
      border: 1px solid ${this.config.style?.theme==="dark"?"#333":"#e0e0e0"};
      border-radius: 8px;
      font-size: 14px;
      background: ${this.config.style?.theme==="dark"?"#262626":"white"};
      color: ${this.config.style?.theme==="dark"?"white":"inherit"};
    `;let s=document.createElement("button");return s.className="send-btn",s.textContent="Send",s.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(s),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,s=window.innerHeight;t<768&&e.classList.add("mobile"),t>s&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var y=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let s=document.createElement("div");s.textContent=e.title,t.appendChild(s);let i=document.createElement("div");if(i.style.cssText="display: flex; gap: 8px; align-items: center;",e.showFullscreenToggle&&e.onFullscreenToggle){let r=this.createButton({className:"fullscreen-toggle-btn",innerHTML:"\u25F1",title:"Enter fullscreen",onClick:e.onFullscreenToggle});i.appendChild(r)}if(e.showMinimize&&e.onMinimize){let r=this.createButton({className:"minimize-btn",innerHTML:"\xD7",title:"Close",fontSize:"24px",onClick:e.onMinimize});i.appendChild(r)}return t.appendChild(i),t}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `;let s=document.createElement("button");return s.className="send-btn",s.textContent="Send",s.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(s),e}createButton(e){let t=document.createElement("button");return t.className=e.className,t.innerHTML=e.innerHTML,t.title=e.title,t.style.cssText=`
      background: none;
      border: none;
      color: white;
      font-size: ${e.fontSize||"20px"};
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    `,t.addEventListener("click",e.onClick),t}};var m=class{constructor(e,t){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.widget=t,this.uiBuilder=new y(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.widget.ui.bubble=this.bubble,this.widget.ui.chatWindow=this.chatWindow,this.bubble.addEventListener("click",()=>{this.widget.toggleChat()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),this.bindEvents(),{chatWindow:this.chatWindow,bubble:this.bubble}}bindEvents(){this.widget.ui.sendBtn&&this.widget.ui.sendBtn.addEventListener("click",()=>this.widget.handleSendMessage()),this.widget.ui.input&&this.widget.ui.input.addEventListener("keypress",e=>{e.key==="Enter"&&this.widget.handleSendMessage()})}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
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
      background: ${this.config.style?.theme==="dark"?"#1a1a1a":"white"};
      color: ${this.config.style?.theme==="dark"?"white":"inherit"};
      border-radius: 12px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.2);
      display: none;
      flex-direction: column;
      overflow: hidden;
      z-index: 999999;
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.widget.toggleChat(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let s=this.uiBuilder.createMessagesArea();e.appendChild(s),this.widget.ui.messagesContainer=s;let i=this.uiBuilder.createInputArea();return e.appendChild(i),this.widget.ui.input=i.querySelector(".chat-input"),this.widget.ui.sendBtn=i.querySelector(".send-btn"),e}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var w=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};function E(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let n=new Uint8Array(16);crypto.getRandomValues(n),n[6]=n[6]&15|64,n[8]=n[8]&63|128;let e=Array.from(n).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var H="chat-widget-session-",R="chat-widget-thread-",z="chat-widget-session-start-",b=class{constructor(e){this.sessionId=null;this.threadId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${H}${e}`,this.threadKey=`${R}${e}`,this.startTimeKey=`${z}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.threadKey),s=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.threadId=t,this.startTime=s?new Date(s):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString())),this.threadId&&sessionStorage.setItem(this.threadKey,this.threadId)}getSessionId(){return this.sessionId||(this.sessionId=E(),this.startTime=new Date,this.saveSession()),this.sessionId}getThreadId(){return this.threadId}setThreadId(e){this.threadId=e,this.saveSession()}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.threadKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.threadId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};function M(n,e){let t=n.relay,s=n.uiConfig.connection,i={message:e.message,chatInput:e.message,sessionId:e.sessionId,threadId:e.threadId,context:e.context,customContext:e.customContext??s?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??s?.extraInputs};return t.widgetKey?i.widgetKey=t.widgetKey:(i.widgetId=t.widgetId,i.licenseKey=t.licenseKey),i}function C(n){if(!n)return"";try{let e=A(n);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),n}}function A(n){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return n.replace(/[&<>"']/g,t=>e[t]||t)}var K={none:0,small:6,medium:12,large:18,pill:9999},T={compact:{padding:.75,gap:.75},normal:{padding:1,gap:1},spacious:{padding:1.25,gap:1.25}};function $(n,e,t=0){let s=[98,96,92,88,80,70,60,50,40,30,22,14,8],i=e*2,r={};return s.forEach((o,g)=>{let d=Math.max(0,Math.min(100,o+t*2));r[`--cw-gray-${g}`]=`hsl(${n}, ${i}%, ${d}%)`}),r}function N(n,e,t,s){if(s){let i=5+e*2,r=10+t*.5;return{bg:`hsl(${n}, ${i}%, ${r}%)`,surface:`hsl(${n}, ${i}%, ${r+5}%)`,composerSurface:`hsl(${n}, ${i}%, ${r+5}%)`,border:`hsla(${n}, ${i}%, 90%, 0.08)`,text:`hsl(${n}, ${Math.max(0,i-10)}%, 90%)`,subText:`hsl(${n}, ${Math.max(0,i-10)}%, 60%)`,hoverSurface:`hsla(${n}, ${i}%, 90%, 0.05)`}}else{let i=10+e*3,r=98-t*2;return{bg:`hsl(${n}, ${i}%, ${r}%)`,surface:`hsl(${n}, ${i}%, ${r-5}%)`,composerSurface:`hsl(${n}, ${i}%, 100%)`,border:`hsla(${n}, ${i}%, 10%, 0.08)`,text:`hsl(${n}, ${i}%, 10%)`,subText:`hsl(${n}, ${i}%, 40%)`,hoverSurface:`hsla(${n}, ${i}%, 10%, 0.05)`}}}function W(n,e){let t=parseInt(n.replace("#",""),16),s=Math.min(255,Math.floor((t>>16)+(255-(t>>16))*e)),i=Math.min(255,Math.floor((t>>8&255)+(255-(t>>8&255))*e)),r=Math.min(255,Math.floor((t&255)+(255-(t&255))*e));return`#${(s<<16|i<<8|r).toString(16).padStart(6,"0")}`}function I(n,e){let t=parseInt(n.replace("#",""),16),s=Math.max(0,Math.floor((t>>16)*(1-e))),i=Math.max(0,Math.floor((t>>8&255)*(1-e))),r=Math.max(0,Math.floor((t&255)*(1-e)));return`#${(s<<16|i<<8|r).toString(16).padStart(6,"0")}`}function F(n,e=1){let t=.15+e*.05;return{"--cw-accent-primary":n,"--cw-accent-hover":I(n,t),"--cw-accent-active":I(n,t*1.5),"--cw-accent-light":W(n,.9),"--cw-accent-lighter":W(n,.95)}}function k(n){let e=n.theme,t=e?.colorScheme||n.style.theme||"light",s=t==="dark",i={"--cw-primary-color":n.style.primaryColor,"--cw-bg-color":n.style.backgroundColor,"--cw-text-color":n.style.textColor,"--cw-font-family":n.style.fontFamily,"--cw-font-size":`${n.style.fontSize}px`,"--cw-corner-radius":`${n.style.cornerRadius}px`};i["--cw-color-scheme"]=t;let r=e?.radius||"medium",o=K[r]??12;i["--cw-radius-sm"]=`${Math.max(0,o-4)}px`,i["--cw-radius-md"]=`${o}px`,i["--cw-radius-lg"]=`${o+4}px`,i["--cw-radius-xl"]=`${o+8}px`,i["--cw-radius-full"]=r==="pill"?"9999px":`${o*2}px`;let g=e?.density||"normal",d=T[g]??T.normal;i["--cw-spacing-xs"]=`${4*d.padding}px`,i["--cw-spacing-sm"]=`${8*d.padding}px`,i["--cw-spacing-md"]=`${12*d.padding}px`,i["--cw-spacing-lg"]=`${16*d.padding}px`,i["--cw-spacing-xl"]=`${24*d.padding}px`,i["--cw-gap"]=`${8*d.gap}px`;let a=e?.typography;a&&(a.baseSize&&(i["--cw-font-size"]=`${a.baseSize}px`,i["--cw-font-size-sm"]=`${a.baseSize-2}px`,i["--cw-font-size-lg"]=`${a.baseSize+2}px`,i["--cw-font-size-xl"]=`${a.baseSize+4}px`),a.fontFamily&&(i["--cw-font-family"]=a.fontFamily),a.fontFamilyMono&&(i["--cw-font-family-mono"]=a.fontFamilyMono));let c=e?.color?.grayscale;if(c){let h=$(c.hue,c.tint,c.shade??0);Object.assign(i,h);let u=N(c.hue,c.tint,c.shade??0,s);i["--cw-surface-bg"]=u.bg,i["--cw-surface-fg"]=u.surface,i["--cw-composer-surface"]=u.composerSurface,i["--cw-border-color"]=u.border,i["--cw-text-color"]=u.text,i["--cw-icon-color"]=u.subText,i["--cw-hover-surface"]=u.hoverSurface}else{let h=$(220,0,0);Object.assign(i,h)}let l=e?.color?.accent;if(l){let h=F(l.primary,l.level??1);Object.assign(i,h),i["--cw-primary-color"]=l.primary}else{let h=F(n.style.primaryColor,1);Object.assign(i,h)}let x=e?.color?.surface;x?(i["--cw-surface-bg"]=x.background,i["--cw-surface-fg"]=x.foreground):c||(i["--cw-surface-bg"]=s?"#1a1a1a":"#ffffff",i["--cw-surface-fg"]=s?"#2a2a2a":"#f8fafc",i["--cw-composer-surface"]=s?"#262626":"#ffffff",i["--cw-border-color"]=s?"rgba(255,255,255,0.08)":"rgba(0,0,0,0.08)",i["--cw-hover-surface"]=s?"rgba(255,255,255,0.05)":"rgba(0,0,0,0.05)");let S=e?.color?.icon;S?i["--cw-icon-color"]=S:c||(i["--cw-icon-color"]=s?"#a1a1aa":"#6b7280");let v=e?.color?.userMessage;return v?(i["--cw-user-msg-text"]=v.text,i["--cw-user-msg-bg"]=v.background):l?(i["--cw-user-msg-text"]="#ffffff",i["--cw-user-msg-bg"]=l.primary):(i["--cw-user-msg-text"]=i["--cw-text-color"]||(s?"#e5e5e5":"#111827"),i["--cw-user-msg-bg"]=i["--cw-surface-fg"]||(s?"#262626":"#f3f4f6")),i["--cw-assistant-msg-text"]=i["--cw-text-color"]||(s?"#e5e5e5":"#1f2937"),i["--cw-assistant-msg-bg"]="transparent",i["--cw-border-color-strong"]=s?"rgba(255,255,255,0.2)":"rgba(0,0,0,0.15)",i["--cw-shadow-sm"]=s?"0 1px 2px rgba(0,0,0,0.3)":"0 1px 2px rgba(0,0,0,0.05)",i["--cw-shadow-md"]=s?"0 4px 12px rgba(0,0,0,0.4)":"0 4px 12px rgba(0,0,0,0.1)",i["--cw-shadow-lg"]=s?"0 8px 24px rgba(0,0,0,0.5)":"0 8px 24px rgba(0,0,0,0.15)",i}function L(n){let e=n.theme?.typography?.fontSources;return!e||e.length===0?n.style.customFontUrl?n.style.customFontUrl:"":e.map(t=>`
@font-face {
  font-family: '${t.family}';
  src: url('${t.src}');
  font-weight: ${t.weight||400};
  font-style: ${t.style||"normal"};
  font-display: ${t.display||"swap"};
}
  `).join(`
`)}var p=class{constructor(e){this.messages=[];this.isOpen=!1;this.messageIdCounter=0;this.selectedFiles=[];this.ui={chatWindow:null,messagesContainer:null,input:null,sendBtn:null,fileInput:null,bubble:null};w.validate(e),this.config=this.mergeConfig(e),this.mode=e.mode||"normal";let t=this.config.license?.key||"default";this.sessionManager=new b(t)}mergeConfig(e){let t=e.theme?.colorScheme||e.style?.theme||"light",s=t==="dark";return{...e,branding:{companyName:e.branding?.companyName||"Support",welcomeText:e.branding?.welcomeText||e.startScreen?.greeting||"How can we help you?",firstMessage:e.branding?.firstMessage||"Hello! Ask me anything.",logoUrl:e.branding?.logoUrl},style:{theme:t,primaryColor:e.theme?.color?.accent?.primary||e.style?.primaryColor||"#0ea5e9",backgroundColor:e.theme?.color?.surface?.background||e.style?.backgroundColor||(s?"#1a1a1a":"#ffffff"),textColor:e.style?.textColor||(s?"#e5e5e5":"#1f2937"),fontFamily:e.theme?.typography?.fontFamily||e.style?.fontFamily||'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',fontSize:e.theme?.typography?.baseSize||e.style?.fontSize||14,position:e.style?.position||"bottom-right",cornerRadius:e.style?.cornerRadius||12},features:{fileAttachmentsEnabled:e.composer?.attachments?.enabled||e.features?.fileAttachmentsEnabled||!1,allowedExtensions:e.composer?.attachments?.accept||e.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:e.composer?.attachments?.maxSize?e.composer.attachments.maxSize/1024:e.features?.maxFileSizeKB||5e3}}}render(){this.injectGlobalStyles(),this.mode==="portal"?new f(this.config,this).render():this.mode==="embedded"?new m(this.config,this).render():new m(this.config,this).render(),(this.mode==="portal"||this.mode==="embedded")&&(this.isOpen=!0)}injectGlobalStyles(){let e=k(this.config),t=L(this.config),s=document.createElement("style");s.id="n8n-chat-widget-styles",s.textContent=`
      ${t}
      :root {
        ${Object.entries(e).map(([i,r])=>`${i}: ${r};`).join(`
        `)}
      }
      /* Shared Utility Classes */
      .n8n-typing-container { display: flex; gap: 4px; padding: 4px 0; }
      .n8n-typing-dot {
        width: 8px; height: 8px; background: var(--cw-icon-color, #64748b);
        border-radius: 50%; animation: n8n-typing 1.4s infinite ease-in-out both;
      }
      .n8n-typing-dot:nth-child(1) { animation-delay: -0.32s; }
      .n8n-typing-dot:nth-child(2) { animation-delay: -0.16s; }
      @keyframes n8n-typing {
        0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
        40% { transform: scale(1); opacity: 1; }
      }
      .n8n-message-content p { margin: 0 0 0.5em 0; }
      .n8n-message-content p:last-child { margin-bottom: 0; }
      .n8n-message-content code {
        background: var(--cw-surface-fg, #f1f5f9); padding: 2px 6px;
        border-radius: 4px; font-family: var(--cw-font-family-mono, ui-monospace, monospace);
        font-size: 0.9em;
      }
      .n8n-message-content pre {
        background: ${this.config.style?.theme==="dark"?"#0d0d0d":"#1e293b"};
        color: #e2e8f0; padding: 12px; border-radius: 8px; overflow-x: auto; margin: 0.5em 0;
      }
    `,document.head.appendChild(s)}toggleChat(){this.mode==="portal"||this.mode==="embedded"||(this.isOpen=!this.isOpen,this.ui.chatWindow&&this.ui.bubble&&(this.isOpen?(this.ui.chatWindow.style.display="flex",this.ui.bubble.style.display="none",this.messages.length===0&&this.config.branding?.firstMessage&&this.addMessage("assistant",this.config.branding.firstMessage),this.ui.input?.focus()):(this.ui.chatWindow.style.display="none",this.ui.bubble.style.display="flex")))}addMessage(e,t,s=!1){let i={id:`msg-${++this.messageIdCounter}`,role:e,content:t,timestamp:Date.now()};if(this.messages.push(i),this.ui.messagesContainer){let r=document.createElement("div");r.id=i.id,r.style.cssText=`
        margin-bottom: var(--cw-spacing-md, 12px);
        display: flex;
        ${e==="user"?"justify-content: flex-end;":"justify-content: flex-start;"}
      `;let o=document.createElement("div");o.className="n8n-message-content",o.style.cssText=`
        max-width: 75%;
        padding: var(--cw-spacing-sm, 10px) var(--cw-spacing-md, 14px);
        border-radius: var(--cw-radius-lg, 12px);
        font-size: var(--cw-font-size, 14px);
        line-height: 1.5;
        ${e==="user"?`background: var(--cw-user-msg-bg, var(--cw-accent-primary, ${this.config.style?.primaryColor})); color: var(--cw-user-msg-text, #ffffff);`:`background: var(--cw-assistant-msg-bg, ${this.config.style?.theme==="dark"?"#2a2a2a":"#f3f4f6"}); color: var(--cw-assistant-msg-text, ${this.config.style?.theme==="dark"?"#e5e5e5":"#1f2937"}); box-shadow: var(--cw-shadow-sm, 0 1px 2px rgba(0, 0, 0, 0.05));`}
      `,e==="assistant"?s?o.innerHTML=`
            <div class="n8n-typing-container">
              <div class="n8n-typing-dot"></div><div class="n8n-typing-dot"></div><div class="n8n-typing-dot"></div>
            </div>
          `:o.innerHTML=C(t):o.textContent=t,r.appendChild(o),this.ui.messagesContainer.appendChild(r),this.ui.messagesContainer.scrollTop=this.ui.messagesContainer.scrollHeight}return i}updateMessage(e,t){let s=this.ui.messagesContainer?.querySelector(`#${e}`);if(s){let r=s.querySelector(".n8n-message-content");r&&(r.innerHTML=C(t))}let i=this.messages.find(r=>r.id===e);i&&(i.content=t),this.ui.messagesContainer&&(this.ui.messagesContainer.scrollTop=this.ui.messagesContainer.scrollHeight)}async handleSendMessage(){if(!this.ui.input)return;let e=this.ui.input.value.trim();if(!e)return;this.addMessage("user",e),this.ui.input.value="";let t=this.addMessage("assistant","",!0);try{await this.streamResponse(e,t.id)}catch(s){console.error("[N8n Chat Widget] Error sending message:",s),this.updateMessage(t.id,"Sorry, there was an error processing your message. Please try again.")}}async streamResponse(e,t){let s=this.config.connection?.relayEndpoint||this.config.connection?.webhookUrl;if(!s)throw new Error("No relay URL configured");let i=this.sessionManager.getSessionId(),r=this.config.connection?.captureContext!==!1,o;this.selectedFiles.length>0&&this.config.features.fileAttachmentsEnabled&&(o=await Promise.all(this.selectedFiles.map(l=>this.encodeFile(l))),this.selectedFiles=[],this.ui.fileInput&&(this.ui.fileInput.value=""));let g=M({uiConfig:this.config,relay:{relayUrl:s,widgetId:this.config.widgetId||"default",licenseKey:this.config.license?.key||"default"}},{message:e,sessionId:i,context:r?this.capturePageContext():void 0,customContext:this.config.connection?.customContext,attachments:o}),d=await fetch(s,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(g)});if(!d.ok)throw new Error(`HTTP ${d.status}`);let a=await d.json(),c=a.response||a.message||a.output||"No response received";this.updateMessage(t,c)}capturePageContext(){try{let e=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(e.searchParams),domain:window.location.hostname}}catch{return{}}}async encodeFile(e){return new Promise((t,s)=>{let i=new FileReader;i.onload=()=>t({name:e.name,type:e.type,data:i.result.split(",")[1],size:e.size}),i.onerror=()=>s(new Error("File read error")),i.readAsDataURL(e)})}handleFileSelect(e){e&&(this.selectedFiles=Array.from(e),console.log(`[Widget] Selected ${this.selectedFiles.length} files`))}};if(typeof window<"u"){let n=window;n.Widget=p,n.N8nWidget=p}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",n):n();async function n(){let t=window.ChatWidgetConfig||{},s=t.relay||(t.uiConfig?t.uiConfig.relay:{}),i=t.branding||t.uiConfig&&t.uiConfig.branding;if(s&&s.relayUrl&&i){console.log("[N8n Chat Widget] Using existing full configuration");try{let a=e(t);new p(a).render();return}catch(a){console.error("[N8n Chat Widget] Initialization error:",a);return}}let r=s.licenseKey||"",o="",g=document.querySelector('div[id^="n8n-chat-"]');!r&&g&&(r=g.id.replace("n8n-chat-",""));let d=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"]');if(d&&d.src){let a=new URL(d.src);if(o=a.origin,!r){let c=a.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);c&&c[1]&&(r=c[1])}}if(o||(o=window.location.origin),!r){console.warn("[N8n Chat Widget] Could not determine license key.");return}try{let a=await fetch(`${o}/api/widget/${r}/config`);if(!a.ok)throw new Error("Config fetch failed");let c=await a.json(),l={...c,connection:{...c.connection,relayEndpoint:s.relayUrl||c.connection?.relayEndpoint||`${o}/api/chat-relay`},license:{...c.license,key:r},widgetId:s.widgetId||c.widgetId||""};window.ChatWidgetConfig=l,new p(l).render()}catch(a){console.error("[N8n Chat Widget] Boot error:",a),g&&(g.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}function e(t){if(t.uiConfig){let s=t.uiConfig;return t.relay&&(s.connection={...s.connection,relayEndpoint:t.relay.relayUrl},s.license={...s.license,key:t.relay.licenseKey}),s}return t}})();})();
