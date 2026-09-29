/*
  VIRELLO STORE FRONTEND
  ----------------------
  This file is intentionally a single HTML file so it is easy to copy and run.

  IMPORTANT:
  A browser-only HTML file cannot securely provide:
    - server-side password hashing
    - central database storage across devices
    - real protected backend admin routes

  Therefore this file provides the complete UI and a browser prototype.
  For production, replace the storage/auth functions below with API calls
  to a real backend/database. NEVER put a production password in this file.
*/

const STORAGE_KEY = "virello_store_frontend_demo_v1";

const defaultState = {
  settings: {
    businessName: "Virello Store",
    adminUsername: "admin",
    /* Demo-only placeholder state. Do not use this as production authentication. */
    demoPassword: "CHANGE-ME",
    email: "placeholder@example.com",
    phone: "",
    whatsapp: "",
    instagram: ""
  },
  content: {
    headline: "Quality products. A simple way to shop.",
    text: "Self satisfaction above other things. Browse our products, place your order and keep your reference number to track it.",
    cta: "Let's Dive In",
    promise: "A smooth shopping experience from product selection to delivery.",
    stat1: "2K+",
    stat1Label: "Orders",
    stat2: "100+",
    stat2Label: "Delivery / Service",
    stat3: "100%",
    stat3Label: "Delivery Satisfaction"
  },
  products: [
    {
      id:"p1", name:"Premium Collection Item", price:25000, category:"Featured",
      description:"A placeholder product. Replace this with your real product information from the Admin Portal.",
      image:"", availability:"Available"
    },
    {
      id:"p2", name:"Signature Collection Item", price:35000, category:"Featured",
      description:"A placeholder product. Replace this with your real product information from the Admin Portal.",
      image:"", availability:"Available"
    },
    {
      id:"p3", name:"Classic Collection Item", price:18000, category:"Classic",
      description:"A placeholder product. Replace this with your real product information from the Admin Portal.",
      image:"", availability:"Available"
    }
  ],
  orders: [],
  reviews: [
    {id:"r1",name:"Customer Review",rating:5,text:"Placeholder review — replace with a real customer review or clearly identify admin-created content.",date:new Date().toISOString()}
  ],
  rules: "Ordering, delivery, returns/exchanges, cancellations and payment policies will be published here by the business owner. Please confirm the final business policies before publishing them."
};

let state = loadState();
let adminLoggedIn = false;
let secretTaps = 0;
let tapTimer = null;

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

function loadState(){
  try{
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? {...clone(defaultState), ...JSON.parse(saved)} : clone(defaultState);
  }catch(e){
    return clone(defaultState);
  }
}

function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

/* ---------- PUBLIC SITE ---------- */

function escapeHTML(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[c]));
}

function money(value){
  return "₦" + Number(value || 0).toLocaleString("en-NG",{maximumFractionDigits:2});
}

function renderPublic(){
  const name = state.settings.businessName || "Virello Store";
  document.title = name;
  document.querySelectorAll(".dynamic-name").forEach(el => el.textContent = name);
  document.getElementById("brandName").firstChild.textContent = name;

  const c = state.content;
  document.getElementById("heroHeadline").textContent = c.headline;
  document.getElementById("heroText").textContent = c.text;
  document.getElementById("heroCta").textContent = c.cta;
  document.getElementById("heroPromise").textContent = c.promise;
  ["1","2","3"].forEach(n=>{
    document.getElementById("stat"+n).textContent = c["stat"+n];
    document.getElementById("stat"+n+"Label").textContent = c["stat"+n+"Label"];
  });

  const email = state.settings.email || "Not supplied";
  const phone = state.settings.phone || "Not supplied";
  const wa = state.settings.whatsapp || "";

  const emailEl=document.getElementById("contactEmail");
  emailEl.textContent=email;
  emailEl.href = state.settings.email ? "mailto:"+state.settings.email : "#";

  const phoneEl=document.getElementById("contactPhone");
  phoneEl.textContent=phone;
  phoneEl.href = state.settings.phone ? "tel:"+state.settings.phone : "#";

  const waEl=document.getElementById("contactWhatsApp");
  waEl.textContent=wa || "Not supplied";
  waEl.href=wa || "#";

  const socials=document.getElementById("socialLinks");
  socials.innerHTML=state.settings.instagram
    ? `<a class="btn btn-secondary btn-small" href="${escapeHTML(state.settings.instagram)}" target="_blank" rel="noopener">Social Media</a>`
    : "";

  document.getElementById("rulesContent").innerHTML =
    escapeHTML(state.rules).replace(/\n/g,"<br>");

  renderCategories();
  renderProducts();
  renderReviews();
}

function renderCategories(){
  const select=document.getElementById("categoryFilter");
  const current=select.value;
  const categories=[...new Set(state.products.map(p=>p.category).filter(Boolean))].sort();
  select.innerHTML='<option value="">All categories</option>'+categories.map(c=>`<option>${escapeHTML(c)}</option>`).join("");
  select.value=categories.includes(current)?current:"";
}

function renderProducts(){
  const grid=document.getElementById("productsGrid");
  const query=document.getElementById("productSearch").value.toLowerCase().trim();
  const category=document.getElementById("categoryFilter").value;

  const products=state.products.filter(p=>{
    if(p.availability==="Hidden") return false;
    const match=!query || (p.name+" "+p.description+" "+p.category).toLowerCase().includes(query);
    const cat=!category || p.category===category;
    return match && cat;
  });

  if(!products.length){
    grid.innerHTML='<div class="notice">No products match your search.</div>';
    return;
  }

  grid.innerHTML=products.map(p=>{
    const image=p.image
      ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" loading="lazy">`
      : `<span class="placeholder-letter">${escapeHTML((p.name||"V")[0])}</span>`;
    const unavailable=p.availability!=="Available";
    return `
      <article class="product-card">
        <div class="product-image">${image}</div>
        <div class="product-body">
          <span class="badge">${escapeHTML(p.category)}</span>
          <h3>${escapeHTML(p.name)}</h3>
          <p class="price">${money(p.price)}</p>
          <p class="muted">${escapeHTML(p.description)}</p>
          <div class="product-actions">
            <button class="btn btn-secondary btn-small" onclick="showProduct('${p.id}')">Details</button>
            <button class="btn btn-primary btn-small" ${unavailable?"disabled":""} onclick="openOrder('${p.id}')">${unavailable?"Unavailable":"Order"}</button>
          </div>
        </div>
      </article>`;
  }).join("");
}

function renderReviews(){
  const grid=document.getElementById("reviewsGrid");
  if(!state.reviews.length){
    grid.innerHTML='<div class="notice">No reviews have been published yet.</div>';
    return;
  }
  grid.innerHTML=state.reviews.map(r=>`
    <article class="review-card">
      <strong>${escapeHTML(r.name)}</strong>
      <div class="stars">${"★".repeat(Number(r.rating))}${"☆".repeat(5-Number(r.rating))}</div>
      <p>${escapeHTML(r.text)}</p>
      <small class="muted">${new Date(r.date).toLocaleDateString()}</small>
    </article>`).join("");
}

function showProduct(id){
  const p=state.products.find(x=>x.id===id);
  if(!p)return;
  const image=p.image
    ? `<img src="${escapeHTML(p.image)}" alt="${escapeHTML(p.name)}" style="width:100%;max-height:340px;object-fit:cover;border-radius:15px;margin-bottom:18px">`
    : `<div class="product-image" style="height:260px;border-radius:15px;margin-bottom:18px"><span class="placeholder-letter">${escapeHTML(p.name[0])}</span></div>`;
  document.getElementById("productDetails").innerHTML=`
    ${image}
    <span class="eyebrow">${escapeHTML(p.category)}</span>
    <h2>${escapeHTML(p.name)}</h2>
    <p class="price">${money(p.price)}</p>
    <p class="muted">${escapeHTML(p.description)}</p>
    <p style="margin:15px 0"><strong>Status:</strong> ${escapeHTML(p.availability)}</p>
    <button class="btn btn-primary" ${p.availability!=="Available"?"disabled":""} onclick="closeModal('productModal');openOrder('${p.id}')">${p.availability==="Available"?"Order Now":"Unavailable"}</button>`;
  openModal("productModal");
}

function openOrder(id){
  const p=state.products.find(x=>x.id===id);
  if(!p || p.availability!=="Available") return;
  document.getElementById("orderProductId").value=id;
  document.getElementById("orderProductName").textContent=p.name;
  document.getElementById("orderProductPrice").textContent=money(p.price)+" each";
  document.getElementById("orderNotice").innerHTML="";
  document.getElementById("orderForm").reset();
  document.getElementById("orderProductId").value=id;
  document.getElementById("orderQuantity").value=1;
  openModal("orderModal");
}

function generateRef(){
  return "VIR-"+Date.now().toString().slice(-8)+"-"+Math.floor(100+Math.random()*900);
}

document.getElementById("orderForm").addEventListener("submit",e=>{
  e.preventDefault();
  const p=state.products.find(x=>x.id===document.getElementById("orderProductId").value);
  const qty=Number(document.getElementById("orderQuantity").value);
  if(!p || p.availability!=="Available" || qty<1)return;

  const order={
    id:crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    reference:generateRef(),
    customerName:document.getElementById("customerName").value.trim(),
    phone:document.getElementById("customerPhone").value.trim(),
    delivery:document.getElementById("deliveryInfo").value.trim(),
    items:[{productId:p.id,name:p.name,quantity:qty,price:p.price}],
    total:p.price*qty,
    status:"Pending",
    createdAt:new Date().toISOString()
  };
  state.orders.push(order);
  saveState();

  document.getElementById("orderNotice").innerHTML=`
    <div class="notice success">
      <strong>Order submitted.</strong><br>
      Your reference number is <strong>${escapeHTML(order.reference)}</strong>.<br>
      Keep this number to track your order.
    </div>`;
  document.getElementById("orderForm").reset();
});

document.getElementById("trackForm").addEventListener("submit",e=>{
  e.preventDefault();
  const ref=document.getElementById("trackRef").value.trim().toUpperCase();
  const order=state.orders.find(o=>o.reference.toUpperCase()===ref);
  const box=document.getElementById("trackResult");
  if(!order){
    box.innerHTML='<div class="track-result error">No order found with that reference number.</div>';
    return;
  }
  box.innerHTML=`
    <div class="track-result success">
      <strong>${escapeHTML(order.reference)}</strong><br>
      Status: <strong>${escapeHTML(order.status)}</strong><br>
      Items: ${order.items.map(i=>escapeHTML(i.name)+" × "+i.quantity).join(", ")}<br>
      Order date: ${new Date(order.createdAt).toLocaleString()}
    </div>`;
});

document.getElementById("contactForm").addEventListener("submit",e=>{
  e.preventDefault();
  document.getElementById("contactNotice").innerHTML='<div class="notice success">Message form submitted in this browser prototype. A real production version should send it to the backend.</div>';
  e.target.reset();
});

/* ---------- MODALS ---------- */

function openModal(id){document.getElementById(id).classList.add("open")}
function closeModal(id){document.getElementById(id).classList.remove("open")}
document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>closeModal(btn.dataset.close)));
document.querySelectorAll(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")}));

/* ---------- SECRET 6 TAPS ---------- */

function revealAdminLogin(){
  secretTaps=0;
  clearTimeout(tapTimer);
  document.getElementById("loginNotice").innerHTML="";
  document.getElementById("loginForm").reset();
  openModal("loginModal");
}

function registerSixTap(target){
  target.addEventListener("click",()=>{
    secretTaps++;
    clearTimeout(tapTimer);
    tapTimer=setTimeout(()=>secretTaps=0,2200);
    if(secretTaps>=6) revealAdminLogin();
  });
}

registerSixTap(document.getElementById("secretAdmin"));
registerSixTap(document.getElementById("brandName"));
document.getElementById("footerAdminLogin").addEventListener("click",revealAdminLogin);

/* ---------- LOGIN DEMO ---------- */

document.getElementById("loginForm").addEventListener("submit",e=>{
  e.preventDefault();
  const username=document.getElementById("loginUsername").value;
  const password=document.getElementById("loginPassword").value;

  /*
    PRODUCTION:
    This check MUST be replaced by a server API request.
    Never store or compare a production password in browser JavaScript.
  */
  if(username===state.settings.adminUsername && password===state.settings.demoPassword){
    adminLoggedIn=true;
    closeModal("loginModal");
    document.getElementById("publicApp").style.display="none";
    document.getElementById("adminApp").style.display="block";
    renderAdmin();
  }else{
    document.getElementById("loginNotice").innerHTML='<div class="notice error">Invalid admin login.</div>';
  }
});

document.getElementById("logoutBtn").addEventListener("click",()=>{
  adminLoggedIn=false;
  document.getElementById("adminApp").style.display="none";
  document.getElementById("publicApp").style.display="block";
  window.scrollTo(0,0);
});

/* ---------- ADMIN NAV ---------- */

document.querySelectorAll(".admin-nav button").forEach(btn=>{
  btn.addEventListener("click",()=>{
    document.querySelectorAll(".admin-nav button").forEach(b=>b.classList.remove("active"));
    document.querySelectorAll(".admin-section").forEach(s=>s.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById(btn.dataset.adminSection).classList.add("active");
    renderAdmin();
  });
});

/* ---------- ADMIN RENDER ---------- */

function notice(id,text,type="success"){
  document.getElementById(id).innerHTML=`<div class="notice ${type}">${escapeHTML(text)}</div>`;
}

function renderAdmin(){
  if(!adminLoggedIn)return;
  document.getElementById("dashProducts").textContent=state.products.length;
  document.getElementById("dashOrders").textContent=state.orders.length;
  document.getElementById("dashPending").textContent=state.orders.filter(o=>o.status==="Pending").length;
  document.getElementById("dashReviews").textContent=state.reviews.length;

  renderAdminProducts();
  renderAdminOrders();
  renderAdminReviews();
  fillAdminForms();
}

function renderAdminProducts(){
  const tbody=document.getElementById("adminProductsTable");
  tbody.innerHTML=state.products.map(p=>`
    <tr>
      <td><strong>${escapeHTML(p.name)}</strong><br><small>${escapeHTML(p.description.slice(0,70))}</small></td>
      <td>${money(p.price)}</td>
      <td>${escapeHTML(p.category)}</td>
      <td>${escapeHTML(p.availability)}</td>
      <td class="admin-actions">
        <button class="btn btn-secondary btn-small" onclick="editProduct('${p.id}')">Edit</button>
        <button class="btn btn-danger btn-small" onclick="deleteProduct('${p.id}')">Delete</button>
      </td>
    </tr>`).join("");
}

function renderAdminOrders(){
  const tbody=document.getElementById("adminOrdersTable");
  tbody.innerHTML=state.orders.length
    ? state.orders.slice().reverse().map(o=>`
      <tr>
        <td><strong>${escapeHTML(o.reference)}</strong><br><small>${new Date(o.createdAt).toLocaleString()}</small></td>
        <td>${escapeHTML(o.customerName)}<br>${escapeHTML(o.phone)}<br><small>${escapeHTML(o.delivery)}</small></td>
        <td>${o.items.map(i=>escapeHTML(i.name)+" × "+i.quantity).join("<br>")}</td>
        <td>${money(o.total)}</td>
        <td>
          <select class="select" onchange="changeOrderStatus('${o.id}',this.value)">
            ${["Pending","Confirmed","Processing","Ready/Dispatched","Delivered","Cancelled"].map(s=>`<option ${s===o.status?"selected":""}>${s}</option>`).join("")}
          </select>
        </td>
        <td><button class="btn btn-danger btn-small" onclick="deleteOrder('${o.id}')">Delete</button></td>
      </tr>`).join("")
    : '<tr><td colspan="6">No orders yet.</td></tr>';
}

function renderAdminReviews(){
  const tbody=document.getElementById("adminReviewsTable");
  tbody.innerHTML=state.reviews.map(r=>`
    <tr>
      <td>${escapeHTML(r.name)}</td>
      <td>${r.rating}/5</td>
      <td>${escapeHTML(r.text)}</td>
      <td><button class="btn btn-danger btn-small" onclick="deleteReview('${r.id}')">Delete</button></td>
    </tr>`).join("");
}

function fillAdminForms(){
  const c=state.content,s=state.settings;
  document.getElementById("contentHeadline").value=c.headline;
  document.getElementById("contentText").value=c.text;
  document.getElementById("contentCta").value=c.cta;
  document.getElementById("contentPromise").value=c.promise;
  ["1","2","3"].forEach(n=>{
    document.getElementById("contentStat"+n).value=c["stat"+n];
    document.getElementById("contentStat"+n+"Label").value=c["stat"+n+"Label"];
  });
  document.getElementById("adminEmail").value=s.email||"";
  document.getElementById("adminPhone").value=s.phone||"";
  document.getElementById("adminWhatsApp").value=s.whatsapp||"";
  document.getElementById("adminInstagram").value=s.instagram||"";
  document.getElementById("adminRules").value=state.rules;
  document.getElementById("businessNameInput").value=s.businessName;
  document.getElementById("newUsername").value=s.adminUsername;
}

/* ---------- PRODUCT ADMIN ---------- */

document.getElementById("productAdminForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=document.getElementById("editProductId").value;
  const data={
    name:document.getElementById("adminProductName").value.trim(),
    price:Number(document.getElementById("adminProductPrice").value),
    category:document.getElementById("adminProductCategory").value.trim(),
    image:document.getElementById("adminProductImage").value.trim(),
    description:document.getElementById("adminProductDescription").value.trim(),
    availability:document.getElementById("adminProductAvailability").value
  };

  if(id){
    const p=state.products.find(x=>x.id===id);
    Object.assign(p,data);
    notice("productAdminNotice","Product updated.");
  }else{
    state.products.push({id:"p-"+Date.now(),...data});
    notice("productAdminNotice","Product added.");
  }
  saveState(); renderPublic(); renderAdmin(); resetProductForm();
});

function editProduct(id){
  const p=state.products.find(x=>x.id===id);if(!p)return;
  document.getElementById("editProductId").value=p.id;
  document.getElementById("adminProductName").value=p.name;
  document.getElementById("adminProductPrice").value=p.price;
  document.getElementById("adminProductCategory").value=p.category;
  document.getElementById("adminProductImage").value=p.image;
  document.getElementById("adminProductDescription").value=p.description;
  document.getElementById("adminProductAvailability").value=p.availability;
  document.getElementById("productFormTitle").textContent="Edit Product";
  document.getElementById("cancelProductEdit").style.display="inline-flex";
  window.scrollTo({top:0,behavior:"smooth"});
}

function resetProductForm(){
  document.getElementById("productAdminForm").reset();
  document.getElementById("editProductId").value="";
  document.getElementById("productFormTitle").textContent="Add Product";
  document.getElementById("cancelProductEdit").style.display="none";
}
document.getElementById("cancelProductEdit").addEventListener("click",resetProductForm);

function deleteProduct(id){
  if(!confirm("Delete this product?"))return;
  state.products=state.products.filter(p=>p.id!==id);
  saveState();renderPublic();renderAdmin();
}

/* ---------- ORDER ADMIN ---------- */

function changeOrderStatus(id,status){
  const o=state.orders.find(x=>x.id===id);if(!o)return;
  o.status=status;
  saveState();
  renderPublic();renderAdmin();
}
function deleteOrder(id){
  if(!confirm("Delete this order?"))return;
  state.orders=state.orders.filter(o=>o.id!==id);
  saveState();renderAdmin();renderPublic();
}

/* ---------- REVIEWS ADMIN ---------- */

document.getElementById("reviewAdminForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.reviews.push({
    id:"r-"+Date.now(),
    name:document.getElementById("reviewName").value.trim(),
    rating:Number(document.getElementById("reviewRating").value),
    text:document.getElementById("reviewText").value.trim(),
    date:new Date().toISOString()
  });
  saveState();e.target.reset();renderPublic();renderAdmin();
});

function deleteReview(id){
  if(!confirm("Delete this review?"))return;
  state.reviews=state.reviews.filter(r=>r.id!==id);
  saveState();renderPublic();renderAdmin();
}

/* ---------- CONTENT ADMIN ---------- */

document.getElementById("contentForm").addEventListener("submit",e=>{
  e.preventDefault();
  const c=state.content;
  c.headline=document.getElementById("contentHeadline").value;
  c.text=document.getElementById("contentText").value;
  c.cta=document.getElementById("contentCta").value;
  c.promise=document.getElementById("contentPromise").value;
  ["1","2","3"].forEach(n=>{
    c["stat"+n]=document.getElementById("contentStat"+n).value;
    c["stat"+n+"Label"]=document.getElementById("contentStat"+n+"Label").value;
  });
  saveState();renderPublic();notice("contentNotice","Homepage content saved.");
});

/* ---------- CONTACT ADMIN ---------- */

document.getElementById("contactAdminForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.settings.email=document.getElementById("adminEmail").value.trim();
  state.settings.phone=document.getElementById("adminPhone").value.trim();
  state.settings.whatsapp=document.getElementById("adminWhatsApp").value.trim();
  state.settings.instagram=document.getElementById("adminInstagram").value.trim();
  saveState();renderPublic();notice("contactAdminNotice","Contact information saved.");
});

/* ---------- RULES ADMIN ---------- */

document.getElementById("rulesForm").addEventListener("submit",e=>{
  e.preventDefault();
  state.rules=document.getElementById("adminRules").value;
  saveState();renderPublic();notice("rulesAdminNotice","Rules/Terms saved.");
});

/* ---------- BUSINESS NAME ---------- */

document.getElementById("businessNameForm").addEventListener("submit",e=>{
  e.preventDefault();
  const value=document.getElementById("businessNameInput").value.trim();
  if(!value)return;
  state.settings.businessName=value;
  saveState();renderPublic();notice("businessNotice","Business name saved.");
});

/* ---------- USERNAME ---------- */

document.getElementById("usernameForm").addEventListener("submit",e=>{
  e.preventDefault();
  const value=document.getElementById("newUsername").value.trim();
  if(!value)return;
  state.settings.adminUsername=value;
  saveState();
  notice("usernameNotice","Username changed in this browser prototype.");
});

/* ---------- PASSWORD ---------- */

document.getElementById("passwordForm").addEventListener("submit",e=>{
  e.preventDefault();
  const current=document.getElementById("currentPassword").value;
  const next=document.getElementById("newPassword").value;
  const confirmPassword=document.getElementById("confirmPassword").value;

  if(current!==state.settings.demoPassword){
    notice("passwordNotice","Current password is incorrect.","error");
    return;
  }
  if(next.length<8){
    notice("passwordNotice","New password must be at least 8 characters.","error");
    return;
  }
  if(next!==confirmPassword){
    notice("passwordNotice","New passwords do not match.","error");
    return;
  }

  /*
    DEMO ONLY:
    A production application MUST send current/new credentials to the server.
    The server must verify the current password and hash the new password
    with a modern password hashing algorithm such as Argon2id or bcrypt.
  */
  state.settings.demoPassword=next;
  saveState();
  e.target.reset();
  notice("passwordNotice","Password changed in this browser prototype. Connect this form to the backend before production use.");
});

/* ---------- NAV ---------- */

document.getElementById("brandName").addEventListener("click",()=>{
  if(secretTaps===0) window.location.hash="home";
});

document.getElementById("menuBtn").addEventListener("click",()=>{
  document.getElementById("navLinks").classList.toggle("open");
});
document.querySelectorAll(".nav-links a").forEach(a=>a.addEventListener("click",()=>document.getElementById("navLinks").classList.remove("open")));
document.getElementById("productSearch").addEventListener("input",renderProducts);
document.getElementById("categoryFilter").addEventListener("change",renderProducts);

document.getElementById("year").textContent=new Date().getFullYear();

/* Initial render */
renderPublic();
