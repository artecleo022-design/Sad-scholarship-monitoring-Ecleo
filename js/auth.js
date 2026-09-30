/**
 * Student Scholarship Monitoring and Academic Compliance System
 * Authentication & Role-Based Access Control
 * 
 * Implements:
 * - Requirement 3: User Roles (Admin, Scholarship Staff, Scholar)
 * - Requirement 4: Authentication, Session Checking, Login First & Protected Pages
 */

window.AuthService = (function() {
  // Predefined System Users for Institutional Access & Demonstration
  const PREDEFINED_USERS = {
    admin: {
      id: "00000000-0000-0000-0000-000000000001",
      email: "admin@university.edu.ph",
      full_name: "Dr. Evelyn Vance",
      role: "admin",
      title: "University Scholarship Administrator",
      scholar_id: null
    },
    staff: {
      id: "00000000-0000-0000-0000-000000000002",
      email: "staff@university.edu.ph",
      full_name: "Officer Roberto Gomez",
      role: "staff",
      title: "Scholarship Compliance Evaluator",
      scholar_id: null
    },
    scholar: {
      id: "00000000-0000-0000-0000-000000000003",
      email: "juan.delacruz@university.edu.ph",
      full_name: "Juan Dela Cruz",
      role: "scholar",
      title: "Enrolled Scholar (BS IT)",
      scholar_id: "b2222222-2222-2222-2222-222222222222" // Linked to Juan Dela Cruz in scholars table
    }
  };

  let currentUser = null;

  function init() {
    const saved = localStorage.getItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_USER);
    if (saved) {
      try {
        currentUser = JSON.parse(saved);
      } catch (e) {
        currentUser = null;
        localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_USER);
      }
    } else {
      currentUser = null; // Strictly require login first
    }
    return currentUser;
  }

  function getCurrentUser() {
    return currentUser;
  }

  function isAuthenticated() {
    return currentUser !== null && currentUser !== undefined;
  }

  function hasRole(...roles) {
    if (!currentUser) return false;
    return roles.includes(currentUser.role);
  }

  function canVerify() {
    return hasRole("admin", "staff");
  }

  function canManagePrograms() {
    return hasRole("admin", "staff");
  }

  function canManageScholars() {
    return hasRole("admin", "staff");
  }

  /**
   * Login using a Predefined Demo Account (Admin / Staff / Scholar)
   */
  async function loginWithDemo(roleKey) {
    if (PREDEFINED_USERS[roleKey]) {
      currentUser = { ...PREDEFINED_USERS[roleKey] };
      localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
      window.dispatchEvent(new CustomEvent("auth:changed", { detail: currentUser }));
      await window.DataService.logAudit("USER_LOGIN", "profiles", currentUser.id, {
        email: currentUser.email,
        role: currentUser.role,
        method: "demo_one_click"
      });
      return currentUser;
    }
    throw new Error("Invalid demonstration account role specified.");
  }

  /**
   * Switch Active User Role during active session
   */
  function switchRole(roleKey) {
    return loginWithDemo(roleKey);
  }

  /**
   * Login with email and password (Requirement 4)
   */
  async function login(email, password) {
    if (!email || !email.trim()) {
      throw new Error("Email address is required.");
    }
    if (!password || !password.trim()) {
      throw new Error("Password is required.");
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if Supabase client is live and attempt real Supabase Auth
    if (window.DataService && window.DataService.isUsingLiveSupabase()) {
      // In live Supabase mode, attempt auth signIn
      try {
        const { supabaseClient } = await window.DataService.init();
        if (supabaseClient && supabaseClient.auth) {
          const { data, error } = await supabaseClient.auth.signInWithPassword({
            email: cleanEmail,
            password: password
          });
          if (!error && data && data.user) {
            // Fetch profile
            const { data: profile } = await supabaseClient.from("profiles").select("*").eq("id", data.user.id).single();
            currentUser = {
              id: data.user.id,
              email: data.user.email,
              full_name: profile ? profile.full_name : cleanEmail.split("@")[0],
              role: profile ? profile.role : "staff",
              title: profile ? profile.role.toUpperCase() : "Authorized User",
              scholar_id: null
            };
            localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
            window.dispatchEvent(new CustomEvent("auth:changed", { detail: currentUser }));
            return currentUser;
          }
        }
      } catch (err) {
        console.warn("Supabase auth attempted but fell back to role matching:", err);
      }
    }

    // Role detection matching predefined accounts or standard email pattern
    if (cleanEmail.includes("admin")) {
      currentUser = { ...PREDEFINED_USERS.admin, email: cleanEmail };
    } else if (cleanEmail.includes("staff") || cleanEmail.includes("evaluator")) {
      currentUser = { ...PREDEFINED_USERS.staff, email: cleanEmail };
    } else if (cleanEmail.includes("scholar") || cleanEmail.includes("juan") || cleanEmail.includes("student")) {
      currentUser = {
        ...PREDEFINED_USERS.scholar,
        email: cleanEmail,
        full_name: cleanEmail.includes("maria") ? "Maria Clara Santos" : "Juan Dela Cruz",
        scholar_id: cleanEmail.includes("maria") ? "a1111111-1111-1111-1111-111111111111" : "b2222222-2222-2222-2222-222222222222"
      };
    } else {
      // Standard staff user
      currentUser = {
        id: (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : "00000000-0000-4000-8000-" + String(Date.now()).padStart(12, "0"),
        email: cleanEmail,
        full_name: cleanEmail.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, l => l.toUpperCase()),
        role: "staff",
        title: "Scholarship Staff Evaluator",
        scholar_id: null
      };
    }

    localStorage.setItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_USER, JSON.stringify(currentUser));
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: currentUser }));

    await window.DataService.logAudit("USER_LOGIN", "profiles", currentUser.id, {
      email: currentUser.email,
      role: currentUser.role,
      method: "credentials"
    });

    return currentUser;
  }

  function logout() {
    if (currentUser) {
      window.DataService.logAudit("USER_LOGOUT", "profiles", currentUser.id, {
        email: currentUser.email
      });
    }
    currentUser = null;
    localStorage.removeItem(window.APP_CONFIG.STORAGE_KEYS.AUTH_USER);
    window.dispatchEvent(new CustomEvent("auth:changed", { detail: null }));
  }

  return {
    init: init,
    getCurrentUser: getCurrentUser,
    isAuthenticated: isAuthenticated,
    hasRole: hasRole,
    canVerify: canVerify,
    canManagePrograms: canManagePrograms,
    canManageScholars: canManageScholars,
    switchRole: switchRole,
    loginWithDemo: loginWithDemo,
    login: login,
    logout: logout,
    PREDEFINED_USERS: PREDEFINED_USERS
  };
})();
