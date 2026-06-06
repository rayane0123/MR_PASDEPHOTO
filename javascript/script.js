// ==================== BASE DE DONNÉES LOCALE ====================
const STORE = {
  users: "mrpd_users",
  session: "mrpd_session",
  bookings: "mrpd_bookings"
};

function getStorage(key, defaultValue = []) {
  try {
    return JSON.parse(localStorage.getItem(key)) || defaultValue;
  } catch {
    return defaultValue;
  }
}

function setStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function showToast(message, isError = false) {
  const existing = document.querySelector(".toast");
  if (existing) existing.remove();
  const toast = document.createElement("div");
  toast.className = "toast";
  toast.textContent = message;
  if (isError) toast.setAttribute("error", "true");
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function getCurrentUser() {
  return getStorage(STORE.session, null);
}

function isLoggedIn() {
  return getCurrentUser() !== null;
}

function initDatabase() {
  if (!localStorage.getItem(STORE.bookings)) setStorage(STORE.bookings, []);
  
  const users = getStorage(STORE.users, []);
  const adminExists = users.find(u => u.email === "admin@gmail.com");
  if (!adminExists) {
    users.push({
      id: "admin_1",
      nom: "Admin MR",
      email: "admin@gmail.com",
      tel: "0551015975",
      password: "123456",
      role: "admin",
      createdAt: new Date().toLocaleString("fr-FR")
    });
    setStorage(STORE.users, users);
  }
}

// ==================== INSCRIPTION ====================
function register() {
  const nom = document.getElementById("reg_nom")?.value.trim();
  const email = document.getElementById("reg_email")?.value.trim().toLowerCase();
  const tel = document.getElementById("reg_tel")?.value.trim();
  const password = document.getElementById("reg_password")?.value;

  if (!nom || !email || !tel || !password) {
    return showToast("Tous les champs sont requis", true);
  }
  if (!email.includes("@") || !email.includes(".")) {
    return showToast("Email invalide", true);
  }
  if (password.length < 6) {
    return showToast("Le mot de passe doit contenir au moins 6 caractères", true);
  }

  const users = getStorage(STORE.users, []);
  if (users.find(u => u.email === email)) {
    return showToast("Cet email est déjà utilisé", true);
  }

  const newUser = {
    id: Date.now().toString(),
    nom,
    email,
    tel,
    password,
    role: "client",
    createdAt: new Date().toLocaleString("fr-FR")
  };
  users.push(newUser);
  setStorage(STORE.users, users);
  showToast("✅ Compte créé avec succès ! Redirection...");
  setTimeout(() => {
    const isInContent = window.location.pathname.includes("/content/");
    window.location.href = isInContent ? "connexion.html" : "content/connexion.html";
  }, 1500);
}

// ==================== CONNEXION ====================
function login() {
  const email = document.getElementById("login_email")?.value.trim().toLowerCase();
  const password = document.getElementById("login_password")?.value;

  if (!email || !password) {
    return showToast("Veuillez remplir tous les champs", true);
  }

  const users = getStorage(STORE.users, []);
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) {
    return showToast("Email ou mot de passe incorrect", true);
  }

  setStorage(STORE.session, {
    id: user.id,
    nom: user.nom,
    email: user.email,
    tel: user.tel,
    role: user.role,
    createdAt: user.createdAt
  });
  showToast(`✅ Bienvenue ${user.nom} !`);
  
  setTimeout(() => {
    const isInContent = window.location.pathname.includes("/content/");
    const redirectUrl = isInContent ? "../mon-compte.html" : "mon-compte.html";
    window.location.href = redirectUrl;
  }, 1500);
}

// ==================== DÉCONNEXION ====================
function logout() {
  if (confirm("Êtes-vous sûr de vouloir vous déconnecter ?")) {
    localStorage.removeItem(STORE.session);
    showToast("Déconnecté avec succès");
    setTimeout(() => {
      const isInContent = window.location.pathname.includes("/content/");
      const redirectUrl = isInContent ? "../index.html" : "index.html";
      window.location.href = redirectUrl;
    }, 1500);
  }
}

// ==================== ESPACE PERSONNEL ====================
function loadUserDashboard() {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "index.html";
    return;
  }

  if (document.getElementById("profile_nom")) {
    document.getElementById("profile_nom").textContent = user.nom;
    document.getElementById("profile_email").textContent = user.email;
    document.getElementById("profile_tel").textContent = user.tel || "Non renseigné";
  }

  const allBookings = getStorage(STORE.bookings, []);
  const myBookings = allBookings.filter(b => b.userEmail === user.email);
  const container = document.getElementById("user_bookings");
  
  if (container) {
    if (myBookings.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: var(--text-muted);">
          <p style="font-size: 3rem; margin-bottom: 16px;">📭</p>
          <p style="font-size: 1.1rem;">Vous n'avez pas encore de réservations</p>
          <p style="margin-top: 16px;"><a href="content/reservation.html" class="btn">Créer une réservation</a></p>
        </div>
      `;
    } else {
      container.innerHTML = myBookings.map(b => `
        <div class="reservation-card">
          <strong style="font-size: 1.1rem;">${b.service} — ${b.eventType}</strong><br>
          <p style="margin-top: 12px; color: var(--text-muted);">
            📅 ${new Date(b.date).toLocaleDateString('fr-FR')} à ${b.time || ''}
            <br>👥 ${b.guests} invités
            <br>📍 ${b.location}
            <br>📞 ${b.phone}
          </p>
          <div class="status" style="display: inline-block; margin-top: 12px; padding: 6px 16px; background: rgba(16, 185, 129, 0.1); color: var(--success); border-radius: 50px; font-size: 0.85rem; font-weight: 600;">✅ ${b.status}</div>
        </div>
      `).join("");
    }
  }
}

// ==================== RÉSERVATION ====================
function makeBooking(e) {
  if (e) e.preventDefault();
  
  const user = getCurrentUser();
  if (!user) {
    showToast("Veuillez vous connecter pour réserver", true);
    setTimeout(() => {
      const isInContent = window.location.pathname.includes("/content/");
      const redirectUrl = isInContent ? "connexion.html" : "content/connexion.html";
      window.location.href = redirectUrl;
    }, 1500);
    return;
  }

  const nom = document.getElementById("book_nom")?.value.trim();
  const prenom = document.getElementById("book_prenom")?.value.trim();
  const service = document.getElementById("book_service")?.value;
  const eventType = document.getElementById("book_type")?.value;
  const date = document.getElementById("book_date")?.value;
  const time = document.getElementById("book_time")?.value;
  const location = document.getElementById("book_location")?.value;
  const guests = document.getElementById("book_guests")?.value;
  const phone = document.getElementById("book_phone")?.value.trim();
  const email = document.getElementById("book_email")?.value.trim();
  const address = document.getElementById("book_address")?.value.trim();
  const details = document.getElementById("book_details")?.value.trim() || "";

  if (!nom || !prenom || !eventType || !date || !time || !location || !guests || !phone || !email || !address) {
    return showToast("Tous les champs obligatoires (*) doivent être remplis", true);
  }

  const guestCount = parseInt(guests);
  if (guestCount < 10) {
    return showToast("Le nombre minimum d'invités est 10", true);
  }

  const bookings = getStorage(STORE.bookings, []);
  const newBooking = {
    id: Date.now().toString(),
    userEmail: user.email,
    nom, prenom,
    service: service || "Standard",
    eventType, 
    date, 
    time,
    location,
    address,
    guests: guestCount,
    phone,
    email,
    details,
    status: "En attente de confirmation",
    createdAt: new Date().toLocaleString("fr-FR")
  };
  
  bookings.push(newBooking);
  setStorage(STORE.bookings, bookings);
  showToast("✅ Réservation enregistrée ! Nous vous contacterons bientôt.");
  
  setTimeout(() => {
    const isInContent = window.location.pathname.includes("/content/");
    const redirectUrl = isInContent ? "../mon-compte.html" : "mon-compte.html";
    window.location.href = redirectUrl;
  }, 1500);
}

// ==================== SERVICES ====================
function loadServices(filter = "all") {
  const services = [
    { name: "Pack Standard", price: "À partir de 8 000 DA", category: "standard", desc: "Discrétion totale pour vos fêtes familiales et anniversaires. Équipe de base.", icon: "🎂" },
    { name: "Pack VIP Mariage", price: "À partir de 15 000 DA", category: "vip", desc: "Équipe dédiée, signalétique élégante, accompagnement des familles. Cérémonie complète.", icon: "💒" },
    { name: "Pack Soirée Privée", price: "À partir de 12 000 DA", category: "vip", desc: "Villa, hôtel, réception intime : protection sur mesure avec équipe renforcée.", icon: "🥂" },
    { name: "Pack Concert", price: "À partir de 25 000 DA", category: "premium", desc: "Gestion des flux, zones sensibles, équipe renforcée pour événements musicaux.", icon: "🎤" },
    { name: "Pack Traditionnel", price: "Sur devis", category: "premium", desc: "Espaces séparés, respect des traditions, équipe féminine/masculine adaptée.", icon: "🕌" },
    { name: "Pack Entreprise", price: "À partir de 20 000 DA", category: "vip", desc: "Séminaires, conférences, soirées d'entreprise avec discrétion professionnelle.", icon: "🏢" }
  ];
  
  const filtered = filter === "all" ? services : services.filter(s => s.category === filter);
  const container = document.getElementById("servicesContainer");
  if (container) {
    container.innerHTML = filtered.map((s, idx) => `
      <div class="card" style="animation: slideUp 0.6s ease ${idx * 0.1}s both;">
        <div class="card-icon">${s.icon}</div>
        <h3>${s.name}</h3>
        <p>${s.desc}</p>
        <p style="font-weight: 700; margin: 20px 0 0; color: var(--primary);">${s.price}</p>
        <a href="reservation.html?service=${encodeURIComponent(s.name)}" class="btn" style="margin-top: 24px; display: inline-block;">Choisir ce pack</a>
      </div>
    `).join("");
  }
}

// ==================== NAVIGATION DYNAMIQUE ====================
function updateNavigation() {
  const user = getCurrentUser();
  const nav = document.querySelector(".nav");
  if (!nav) return;
  
  const existingDynamic = document.getElementById("dynamic-nav-items");
  if (existingDynamic) existingDynamic.remove();
  
  const dynamicDiv = document.createElement("div");
  dynamicDiv.id = "dynamic-nav-items";
  dynamicDiv.style.display = "flex";
  dynamicDiv.style.gap = "8px";
  dynamicDiv.style.alignItems = "center";
  dynamicDiv.style.flexWrap = "wrap";
  
  const isInContent = window.location.pathname.includes("/content/");
  
  if (user) {
    // LIEN MON COMPTE
    const compteLink = document.createElement("a");
    compteLink.href = isInContent ? "../mon-compte.html" : "mon-compte.html";
    compteLink.textContent = `👤 ${user.nom.split(' ')[0]}`;
    compteLink.style.padding = "10px 20px";
    compteLink.style.borderRadius = "50px";
    compteLink.style.textDecoration = "none";
    compteLink.style.color = "var(--text-muted)";
    compteLink.style.fontWeight = "500";
    compteLink.style.transition = "all 0.3s ease";
    compteLink.style.cursor = "pointer";
    
    compteLink.onmouseover = function() {
      this.style.background = "rgba(212, 165, 116, 0.1)";
      this.style.color = "var(--primary)";
    };
    compteLink.onmouseout = function() {
      this.style.background = "transparent";
      this.style.color = "var(--text-muted)";
    };
    
    // LIEN DÉCONNEXION
    const logoutLink = document.createElement("a");
    logoutLink.textContent = "Déconnexion";
    logoutLink.href = "#";
    logoutLink.style.padding = "10px 20px";
    logoutLink.style.borderRadius = "50px";
    logoutLink.style.textDecoration = "none";
    logoutLink.style.background = "rgba(239, 68, 68, 0.1)";
    logoutLink.style.color = "var(--error)";
    logoutLink.style.fontWeight = "500";
    logoutLink.style.transition = "all 0.3s ease";
    logoutLink.style.cursor = "pointer";
    
    logoutLink.onmouseover = function() {
      this.style.background = "rgba(239, 68, 68, 0.2)";
    };
    logoutLink.onmouseout = function() {
      this.style.background = "rgba(239, 68, 68, 0.1)";
    };
    
    logoutLink.onclick = (e) => { 
      e.preventDefault(); 
      logout(); 
    };
    
    dynamicDiv.appendChild(compteLink);
    dynamicDiv.appendChild(logoutLink);
  } else {
    // LIEN CONNEXION
    const loginLink = document.createElement("a");
    loginLink.href = isInContent ? "connexion.html" : "content/connexion.html";
    loginLink.textContent = "Connexion";
    loginLink.style.padding = "10px 20px";
    loginLink.style.borderRadius = "50px";
    loginLink.style.textDecoration = "none";
    loginLink.style.color = "var(--text-muted)";
    loginLink.style.fontWeight = "500";
    loginLink.style.transition = "all 0.3s ease";
    loginLink.style.cursor = "pointer";
    
    loginLink.onmouseover = function() {
      this.style.background = "rgba(212, 165, 116, 0.1)";
      this.style.color = "var(--primary)";
    };
    loginLink.onmouseout = function() {
      this.style.background = "transparent";
      this.style.color = "var(--text-muted)";
    };
    
    // LIEN INSCRIPTION
    const registerLink = document.createElement("a");
    registerLink.href = isInContent ? "inscription.html" : "content/inscription.html";
    registerLink.textContent = "Inscription";
    registerLink.style.padding = "10px 20px";
    registerLink.style.borderRadius = "50px";
    registerLink.style.background = "linear-gradient(135deg, var(--primary), var(--primary-dark))";
    registerLink.style.color = "white";
    registerLink.style.fontWeight = "600";
    registerLink.style.textDecoration = "none";
    registerLink.style.boxShadow = "0 8px 20px rgba(212, 165, 116, 0.3)";
    registerLink.style.transition = "all 0.3s ease";
    registerLink.style.cursor = "pointer";
    
    registerLink.onmouseover = function() {
      this.style.transform = "translateY(-2px)";
      this.style.boxShadow = "0 12px 28px rgba(212, 165, 116, 0.4)";
    };
    registerLink.onmouseout = function() {
      this.style.transform = "translateY(0)";
      this.style.boxShadow = "0 8px 20px rgba(212, 165, 116, 0.3)";
    };
    
    dynamicDiv.appendChild(loginLink);
    dynamicDiv.appendChild(registerLink);
  }
  nav.appendChild(dynamicDiv);
}

function prefillServiceOnBooking() {
  const params = new URLSearchParams(window.location.search);
  const service = params.get("service");
  if (service && document.getElementById("book_service")) {
    document.getElementById("book_service").value = service;
  }
}

// ==================== ANIMATIONS SCROLL ====================
function initScrollAnimations() {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.style.opacity = "1";
        e.target.style.transform = "translateY(0)";
        observer.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll(".card, .section-title").forEach(el => {
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    el.style.transition = "all 0.6s ease";
    observer.observe(el);
  });
}

// ==================== INITIALISATION ====================
document.addEventListener("DOMContentLoaded", () => {
  initDatabase();
  updateNavigation();
  loadServices();
  prefillServiceOnBooking();
  initScrollAnimations();
  
  if (document.getElementById("user_bookings")) {
    loadUserDashboard();
  }
  
  const bookingForm = document.getElementById("bookingForm");
  if (bookingForm) {
    bookingForm.addEventListener("submit", makeBooking);
  }

  // Focus animations sur inputs
  document.querySelectorAll("input, select, textarea").forEach(el => {
    el.addEventListener("focus", function() {
      this.style.borderColor = "var(--primary)";
    });
    el.addEventListener("blur", function() {
      this.style.borderColor = "var(--border-dark)";
    });
  });
});
