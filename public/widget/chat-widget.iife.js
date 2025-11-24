"use strict";var ChatWidget=(()=>{function R(s){if(!s)return"";try{let e=V(s);return e=e.replace(/```([\s\S]*?)```/g,"<pre><code>$1</code></pre>"),e=e.replace(/`([^`]+)`/g,"<code>$1</code>"),e=e.replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>"),e=e.replace(/\*([^*]+)\*/g,"<em>$1</em>"),e=e.replace(/\[([^\]]+)\]\((https?:\/\/[^\)]+)\)/g,'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'),e=e.replace(/\n/g,"<br>"),e}catch(e){return console.warn("Markdown rendering failed, falling back to plain text",e),s}}function V(s){let e={"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"};return s.replace(/[&<>"']/g,t=>e[t]||t)}function A(s,e){let t=s.relay,n=s.uiConfig.connection;return{widgetId:t.widgetId,licenseKey:t.licenseKey,message:e.message,chatInput:e.message,sessionId:e.sessionId,context:e.context,customContext:e.customContext??n?.customContext,attachments:e.attachments,extraInputs:e.extraInputs??n?.extraInputs}}function B(){if(typeof crypto<"u"&&typeof crypto.randomUUID=="function")return crypto.randomUUID();let s=new Uint8Array(16);crypto.getRandomValues(s),s[6]=s[6]&15|64,s[8]=s[8]&63|128;let e=Array.from(s).map(t=>t.toString(16).padStart(2,"0")).join("");return[e.slice(0,8),e.slice(8,12),e.slice(12,16),e.slice(16,20),e.slice(20,32)].join("-")}var _="chat-widget-session-",X="chat-widget-session-start-",M=class{constructor(e){this.sessionId=null;this.startTime=null;this.licenseId=e,this.storageKey=`${_}${e}`,this.startTimeKey=`${X}${e}`,this.loadSession()}loadSession(){let e=sessionStorage.getItem(this.storageKey),t=sessionStorage.getItem(this.startTimeKey);e&&(this.sessionId=e,this.startTime=t?new Date(t):new Date)}saveSession(){this.sessionId&&(sessionStorage.setItem(this.storageKey,this.sessionId),sessionStorage.setItem(this.startTimeKey,(this.startTime||new Date).toISOString()))}getSessionId(){return this.sessionId||(this.sessionId=B(),this.startTime=new Date,this.saveSession()),this.sessionId}resetSession(){sessionStorage.removeItem(this.storageKey),sessionStorage.removeItem(this.startTimeKey),this.sessionId=null,this.startTime=null}hasSession(){return sessionStorage.getItem(this.storageKey)!==null}getSessionStartTime(){if(!this.startTime){let e=sessionStorage.getItem(this.startTimeKey);e?this.startTime=new Date(e):this.startTime=new Date}return this.startTime}};function $(s){let e=[],t=!1,n=0,a=[],i=s.uiConfig||{},y=new M(s.relay.licenseKey||"default"),o={branding:{companyName:i.branding?.companyName||"Support",welcomeText:i.branding?.welcomeText||"How can we help you?",firstMessage:i.branding?.firstMessage||"Hello! Ask me anything.",logoUrl:i.branding?.logoUrl},style:{theme:i.style?.theme||"light",primaryColor:i.style?.primaryColor||"#00bfff",backgroundColor:i.style?.backgroundColor||"#ffffff",textColor:i.style?.textColor||"#333333",fontFamily:i.style?.fontFamily||'-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',fontSize:i.style?.fontSize||14,position:i.style?.position||"bottom-right",cornerRadius:i.style?.cornerRadius||12},features:{fileAttachmentsEnabled:i.features?.fileAttachmentsEnabled||!1,allowedExtensions:i.features?.allowedExtensions||["jpg","jpeg","png","gif","pdf","doc","docx"],maxFileSizeKB:i.features?.maxFileSizeKB||5e3},connection:i.connection,license:i.license},g=document.createElement("div");g.id="n8n-chat-widget-container",g.style.cssText=`
    position: fixed;
    ${o.style.position==="bottom-right"?"right: 20px;":"left: 20px;"}
    bottom: 20px;
    z-index: 999999;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  `,document.body.appendChild(g);let l=document.createElement("button");l.id="n8n-chat-bubble",l.setAttribute("aria-label","Open chat"),l.style.cssText=`
    width: 60px;
    height: 60px;
    border-radius: 50%;
    background: ${o.style.primaryColor};
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: transform 0.2s;
  `,l.innerHTML=`
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 2H4C2.9 2 2 2.9 2 4V22L6 18H20C21.1 18 22 17.1 22 16V4C22 2.9 21.1 2 20 2Z"
        fill="white"/>
    </svg>
  `,l.addEventListener("mouseenter",()=>{l.style.transform="scale(1.1)"}),l.addEventListener("mouseleave",()=>{l.style.transform="scale(1)"}),l.addEventListener("click",F),g.appendChild(l);let m=document.createElement("div");m.id="n8n-chat-window",m.style.cssText=`
    display: none;
    width: 380px;
    height: 600px;
    max-height: 80vh;
    background: white;
    border-radius: ${o.style.cornerRadius}px;
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    flex-direction: column;
    overflow: hidden;
    margin-bottom: 12px;
  `,g.appendChild(m);let v=document.createElement("div");v.style.cssText=`
    background: ${o.style.primaryColor};
    color: white;
    padding: 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  `,v.innerHTML=`
    <div style="display: flex; align-items: center; gap: 12px;">
      ${o.branding.logoUrl?`<img src="${o.branding.logoUrl}" alt="Logo" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;" />`:""}
      <div>
        <div style="font-weight: 600; font-size: 16px;">${o.branding.companyName}</div>
        <div style="font-size: 13px; opacity: 0.9;">${o.branding.welcomeText}</div>
      </div>
    </div>
    <button id="n8n-chat-close" style="background: none; border: none; color: white; cursor: pointer; font-size: 24px; line-height: 1; padding: 0; width: 28px; height: 28px;">\xD7</button>
  `,m.appendChild(v),v.querySelector("#n8n-chat-close")?.addEventListener("click",F);let f=document.createElement("div");f.id="n8n-chat-messages",f.style.cssText=`
    flex: 1;
    overflow-y: auto;
    padding: 16px;
    background: #f8f9fa;
  `,m.appendChild(f);let x=document.createElement("div");if(x.style.cssText=`
    padding: 16px;
    background: white;
    border-top: 1px solid #e5e7eb;
    display: flex;
    gap: 8px;
  `,x.innerHTML=`
    <input
      type="text"
      id="n8n-chat-input"
      placeholder="Type your message..."
      style="
        flex: 1;
        padding: 10px 14px;
        border: 1px solid #d1d5db;
        border-radius: 20px;
        outline: none;
        font-size: 14px;
      "
    />
    ${o.features.fileAttachmentsEnabled?`
    <input
      type="file"
      id="n8n-chat-file-input"
      multiple
      accept="${o.features.allowedExtensions.join(",")}"
      style="display: none;"
    />
    <button
      id="n8n-chat-attach"
      style="
        background: transparent;
        color: ${o.style.primaryColor};
        border: 1px solid ${o.style.primaryColor};
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
      "
      title="Attach files"
    >
      \u{1F4CE}
    </button>
    `:""}
    <button
      id="n8n-chat-send"
      style="
        background: ${o.style.primaryColor};
        color: white;
        border: none;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
      "
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 21L23 12L2 3V10L17 12L2 14V21Z" fill="white"/>
      </svg>
    </button>
  `,m.appendChild(x),o.license?.brandingEnabled){let r=document.createElement("div");r.style.cssText=`
      padding: 8px 16px;
      background: #f8f9fa;
      border-top: 1px solid #e5e7eb;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
    `,r.innerHTML=`Powered by <a href="https://n8n.io" target="_blank" style="color: ${o.style.primaryColor}; text-decoration: none;">n8n</a>`,m.appendChild(r)}let E=x.querySelector("#n8n-chat-input"),P=x.querySelector("#n8n-chat-send"),z=x.querySelector("#n8n-chat-attach"),b=x.querySelector("#n8n-chat-file-input");P.addEventListener("click",()=>N()),E.addEventListener("keypress",r=>{r.key==="Enter"&&N()}),z&&b&&(z.addEventListener("click",()=>{b.click()}),b.addEventListener("change",r=>{let d=r.target.files;d&&(a=Array.from(d),console.log(`[N8n Chat Widget] Selected ${a.length} file(s)`))}));function F(){t=!t,t?(m.style.display="flex",l.style.display="none",e.length===0&&o.branding.firstMessage&&H("assistant",o.branding.firstMessage),E.focus()):(m.style.display="none",l.style.display="flex")}function H(r,d,u=!1){let c={id:`msg-${++n}`,role:r,content:d,timestamp:Date.now()};e.push(c);let p=document.createElement("div");p.id=c.id,p.style.cssText=`
      margin-bottom: 12px;
      display: flex;
      ${r==="user"?"justify-content: flex-end;":"justify-content: flex-start;"}
    `;let h=document.createElement("div");return h.style.cssText=`
      max-width: 75%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 14px;
      line-height: 1.4;
      ${r==="user"?`background: ${o.style.primaryColor}; color: white;`:"background: white; color: #1f2937; box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);"}
    `,r==="assistant"?u?h.innerHTML=`
          <div class="n8n-typing-container">
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
            <div class="n8n-typing-dot"></div>
          </div>
        `:h.innerHTML=R(d):h.textContent=d,p.appendChild(h),f.appendChild(p),f.scrollTop=f.scrollHeight,c}function I(r,d){let u=f.querySelector(`#${r}`);if(!u)return;let c=u.querySelector("div");c&&(c.innerHTML=R(d));let p=e.find(h=>h.id===r);p&&(p.content=d),f.scrollTop=f.scrollHeight}async function N(){let r=E.value.trim();if(!r)return;H("user",r),E.value="";let d=H("assistant","",!0);try{await j(r,d.id)}catch(u){console.error("[N8n Chat Widget] Error sending message:",u),I(d.id,"Sorry, there was an error processing your message. Please try again.")}}function U(){try{let r=new URL(window.location.href);return{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:Object.fromEntries(r.searchParams),domain:window.location.hostname}}catch(r){return console.error("[N8n Chat Widget] Error capturing page context:",r),{pageUrl:window.location.href,pagePath:window.location.pathname,pageTitle:document.title,queryParams:{},domain:window.location.hostname}}}async function K(r){return new Promise((d,u)=>{let c=new FileReader;c.onload=()=>{let h=c.result.split(",")[1];d({name:r.name,type:r.type,data:h,size:r.size})},c.onerror=()=>{u(new Error(`Failed to read file: ${r.name}`))},c.readAsDataURL(r)})}async function j(r,d){let u=s.relay.relayUrl,c=y.getSessionId();try{let p=o.connection?.captureContext!==!1,h;a.length>0&&o.features.fileAttachmentsEnabled&&(h=await Promise.all(a.map(D=>K(D))),a=[],b&&(b.value=""));let q=A(s,{message:r,sessionId:c,context:p?U():void 0,customContext:o.connection?.customContext,extraInputs:o.connection?.extraInputs,attachments:h}),T=await fetch(u,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(q)});if(!T.ok)throw new Error(`HTTP ${T.status}: ${T.statusText}`);let k=await T.json(),O=k.response||k.message||k.output||"No response received";I(d,O)}catch(p){throw console.error("[N8n Chat Widget] Error sending message:",p),I(d,"Sorry, there was an error connecting to the server. Please try again."),p}}}var W=class{constructor(e){this.chatWindow=null;this.config=e}render(){let e=document.getElementById("chat-portal")||document.body;return this.chatWindow=this.createChatWindow({position:"fullscreen",showMinimize:!1,showHeader:this.config.portal?.showHeader??!0,headerTitle:this.config.portal?.headerTitle||this.config.branding?.companyName||"Chat"}),this.applyPortalStyles(this.chatWindow),this.addResponsiveClasses(this.chatWindow),e.appendChild(this.chatWindow),this.chatWindow.classList.add("visible"),this.chatWindow.style.display="flex",this.autoFocusInput(),this.chatWindow}createChatWindow(e){let t=document.createElement("div");t.className="chat-window",t.id="n8n-chat-window";let n=`
      background: white;
      flex-direction: column;
      overflow: hidden;
      ${this.config.style?.theme==="dark"?"background: #1a1a1a; color: white;":""}
    `;if(t.style.cssText=n,e.showHeader){let y=this.createHeader(e.headerTitle,e.showMinimize);t.appendChild(y)}let a=this.createMessagesArea();t.appendChild(a);let i=this.createInputArea();return t.appendChild(i),t}createHeader(e,t){let n=document.createElement("div");n.className="chat-header",n.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let a=document.createElement("div");if(a.textContent=e,n.appendChild(a),t){let i=document.createElement("button");i.className="minimize-btn",i.innerHTML="\xD7",i.style.cssText=`
        background: none;
        border: none;
        color: white;
        font-size: 24px;
        cursor: pointer;
        padding: 0;
        width: 24px;
        height: 24px;
      `,n.appendChild(i)}return n}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `;let n=document.createElement("button");return n.className="send-btn",n.textContent="Send",n.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(n),e}applyPortalStyles(e){Object.assign(e.style,{width:"100%",height:"100%",position:"fixed",top:"0",left:"0",bottom:"0",right:"0",borderRadius:"0",maxWidth:"none",maxHeight:"none",zIndex:"999999",display:"flex"})}addResponsiveClasses(e){let t=window.innerWidth,n=window.innerHeight;t<768&&e.classList.add("mobile"),t>n&&e.classList.add("landscape")}autoFocusInput(){setTimeout(()=>{let e=document.querySelector(".chat-input");e&&e.focus()},100)}};var L=class{constructor(e){this.config=e}createHeader(e){let t=document.createElement("div");t.className="chat-header",t.style.cssText=`
      padding: 16px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      font-weight: 600;
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;let n=document.createElement("div");n.textContent=e.title,t.appendChild(n);let a=document.createElement("div");if(a.style.cssText="display: flex; gap: 8px; align-items: center;",e.showFullscreenToggle&&e.onFullscreenToggle){let i=this.createButton({className:"fullscreen-toggle-btn",innerHTML:"\u25F1",title:"Enter fullscreen",onClick:e.onFullscreenToggle});a.appendChild(i)}if(e.showMinimize&&e.onMinimize){let i=this.createButton({className:"minimize-btn",innerHTML:"\xD7",title:"Close",fontSize:"24px",onClick:e.onMinimize});a.appendChild(i)}return t.appendChild(a),t}createMessagesArea(){let e=document.createElement("div");if(e.className="chat-messages",e.style.cssText=`
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
    `;let n=document.createElement("button");return n.className="send-btn",n.textContent="Send",n.style.cssText=`
      padding: 12px 24px;
      background: ${this.config.style?.primaryColor||"#00bfff"};
      color: white;
      border: none;
      border-radius: 8px;
      cursor: pointer;
      font-size: 14px;
    `,e.appendChild(t),e.appendChild(n),e}createButton(e){let t=document.createElement("button");return t.className=e.className,t.innerHTML=e.innerHTML,t.title=e.title,t.style.cssText=`
      background: none;
      border: none;
      color: white;
      font-size: ${e.fontSize||"20px"};
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
    `,t.addEventListener("click",e.onClick),t}};var w=class{constructor(e){this.chatWindow=null;this.bubble=null;this.isFullscreen=!1;this.escKeyHandler=null;this.config=e,this.uiBuilder=new L(e)}render(){return this.bubble=this.createBubble(),document.body.appendChild(this.bubble),this.chatWindow=this.createChatWindow(),document.body.appendChild(this.chatWindow),this.bubble.addEventListener("click",()=>{this.toggleChatWindow()}),this.escKeyHandler=e=>{e.key==="Escape"&&this.isFullscreen&&this.exitFullscreen()},document.addEventListener("keydown",this.escKeyHandler),{chatWindow:this.chatWindow,bubble:this.bubble}}createBubble(){let e=document.createElement("button");return e.className="chat-bubble",e.innerHTML="\u{1F4AC}",e.style.cssText=`
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
    `;let t=this.uiBuilder.createHeader({title:this.config.branding?.companyName||"Chat",showMinimize:!0,showFullscreenToggle:!0,onMinimize:()=>this.toggleChatWindow(),onFullscreenToggle:()=>this.toggleFullscreen()});e.appendChild(t);let n=this.uiBuilder.createMessagesArea();e.appendChild(n);let a=this.uiBuilder.createInputArea();return e.appendChild(a),e}toggleChatWindow(){this.chatWindow&&(this.chatWindow.style.display==="none"?this.chatWindow.style.display="flex":this.chatWindow.style.display="none")}toggleFullscreen(){this.isFullscreen?this.exitFullscreen():this.enterFullscreen()}enterFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!0,this.chatWindow.classList.add("fullscreen"),this.bubble.style.display="none",Object.assign(this.chatWindow.style,{position:"fixed",top:"0px",left:"0px",bottom:"0",right:"0",width:"100%",height:"100%",borderRadius:"0",maxWidth:"none",maxHeight:"none"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F2",e.title="Exit fullscreen")}exitFullscreen(){if(!this.chatWindow||!this.bubble)return;this.isFullscreen=!1,this.chatWindow.classList.remove("fullscreen"),this.bubble.style.display="block",Object.assign(this.chatWindow.style,{position:"absolute",bottom:"90px",right:"20px",top:"auto",left:"auto",width:"400px",height:"600px",borderRadius:"12px",maxWidth:"400px",maxHeight:"600px"});let e=this.chatWindow.querySelector(".fullscreen-toggle-btn");e&&(e.innerHTML="\u25F1",e.title="Enter fullscreen")}destroy(){this.escKeyHandler&&document.removeEventListener("keydown",this.escKeyHandler)}};var S=class{static validate(e){if(e.mode==="portal"&&!e.license)throw new Error("License required for portal mode");e.connection?.webhookUrl&&!this.isValidUrl(e.connection.webhookUrl)&&console.error("Invalid webhook URL:",e.connection.webhookUrl)}static isValidUrl(e){try{return new URL(e),!0}catch{return!1}}};var C=class{constructor(e){this.chatWindow=null;S.validate(e),this.config=e,this.mode=e.mode||"normal"}isPortalMode(){return this.mode==="portal"}isEmbeddedMode(){return this.mode==="embedded"}render(){this.isPortalMode()?this.renderPortalMode():this.isEmbeddedMode()?this.renderEmbeddedMode():this.renderNormalMode()}renderPortalMode(){let e=new W(this.config);this.chatWindow=e.render()}renderEmbeddedMode(){let e=new w(this.config),{chatWindow:t}=e.render();this.chatWindow=t}renderNormalMode(){let e=new w(this.config),{chatWindow:t}=e.render();this.chatWindow=t}};if(typeof window<"u"){let s=window;s.Widget=C,s.N8nWidget=C}(function(){"use strict";console.log("%c[N8n Chat Widget] Script Loaded","background: #222; color: #bada55; padding: 4px; border-radius: 4px;"),document.readyState==="loading"?document.addEventListener("DOMContentLoaded",s):s();async function s(){let e=window.ChatWidgetConfig||{},t=e.relay||(e.uiConfig?e.uiConfig.relay:{});if(t&&t.relayUrl&&(e.branding||e.uiConfig&&e.uiConfig.branding)){console.log("[N8n Chat Widget] Using existing full configuration");try{$(e);return}catch(o){console.error("[N8n Chat Widget] Initialization error:",o);return}}let n=t.licenseKey||"",a="",i=document.querySelector('div[id^="n8n-chat-"]');!n&&i&&(n=i.id.replace("n8n-chat-",""));let y=document.querySelector('script[src*="/chat-widget.js"], script[src*="/bundle.js"]');if(y&&y.src){let o=new URL(y.src);if(a=o.origin,!n){let g=o.pathname.match(/\/api\/widget\/([^\/]+)\/chat-widget/);g&&g[1]&&(n=g[1])}}if(a||(a=window.location.origin),!n){console.warn("[N8n Chat Widget] Could not determine license key.");return}try{let o=await fetch(`${a}/api/widget/${n}/config`);if(!o.ok)throw new Error("Config fetch failed");let g=await o.json(),l={uiConfig:g,relay:{relayUrl:t.relayUrl||g.connection?.relayEndpoint||`${a}/api/chat-relay`,widgetId:t.widgetId||"",licenseKey:n}};window.ChatWidgetConfig=l,$(l)}catch(o){console.error("[N8n Chat Widget] Boot error:",o),i&&(i.innerHTML='<div style="color:red;padding:10px;border:1px solid red">Widget Error: Config Load Failed</div>')}}})();})();
