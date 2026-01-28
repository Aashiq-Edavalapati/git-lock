// A LocalStorage wrapper to simulate a real Backend + DB
// This fixes the "State Amnesia" and "Flow Flaws"

const DB_KEY = "gitlock_db_v1";

// --- INITIAL SEED DATA (Mock Credentials) ---
const SEED_DATA = {
  users: [
    { id: "u_client", name: "Client Sarah", email: "client@demo.com", role: "client", password: "123" },
    { id: "u_dev", name: "Dev John", email: "dev@demo.com", role: "developer", password: "123" }
  ],
  projects: [], // { id, name, budget, clientId, devId (nullable), status: 'Draft'|'Active' }
  locks: []     // { id, projectId, commitHash, amount, status: 'LOCKED'|'PAID', files: [], createdAt }
};

// --- CORE FUNCTIONS ---

export const initDB = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(DB_KEY)) {
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
  }
};

const getDB = () => {
  initDB();
  return JSON.parse(localStorage.getItem(DB_KEY));
};

const saveDB = (data) => {
  localStorage.setItem(DB_KEY, JSON.stringify(data));
};

// --- AUTH ---
export const authenticate = (email, password) => {
  const db = getDB();
  const user = db.users.find(u => u.email === email && u.password === password);
  return user || null;
};

// --- PROJECT MANAGEMENT ---
export const createProject = (clientId, name, budget) => {
  const db = getDB();
  const newProject = {
    id: `proj_${Date.now()}`,
    clientId,
    name,
    budget,
    devId: null, // No dev yet
    status: "Draft",
    createdAt: new Date().toISOString()
  };
  db.projects.push(newProject);
  saveDB(db);
  return newProject;
};

export const inviteDeveloper = (projectId, devEmail) => {
  const db = getDB();
  // In a real app, we'd look up the dev by email. 
  // Here, we simulate sending an invite.
  // For the demo flow to work, we'll auto-assign to our mock dev 'u_dev' 
  // if the email matches 'dev@demo.com'.
  
  const projectIndex = db.projects.findIndex(p => p.id === projectId);
  if (projectIndex === -1) return false;

  // Logic: Only assign if email matches our mock dev
  if (devEmail === "dev@demo.com") {
      db.projects[projectIndex].devId = "u_dev"; // Auto-accept for demo smoothness
      db.projects[projectIndex].status = "Active";
      saveDB(db);
      return true;
  }
  return false;
};

export const getClientProjects = (clientId) => {
  const db = getDB();
  return db.projects.filter(p => p.clientId === clientId).map(p => {
    // Join logic: attach lock info if exists
    const lock = db.locks.find(l => l.projectId === p.id);
    return { ...p, lockId: lock ? lock.id : null, lockStatus: lock ? lock.status : null };
  });
};

export const getDevProjects = (devId) => {
  const db = getDB();
  return db.projects.filter(p => p.devId === devId).map(p => {
    const lock = db.locks.find(l => l.projectId === p.id);
    return { ...p, lockId: lock ? lock.id : null, lockStatus: lock ? lock.status : null };
  });
};

// --- LOCK / VAULT MANAGEMENT ---
export const createLock = (projectId, commitHash, files) => {
  const db = getDB();
  const project = db.projects.find(p => p.id === projectId);
  if (!project) throw new Error("Project not found");

  const newLock = {
    id: `lock_${Date.now()}`,
    projectId,
    amount: project.budget,
    commitHash,
    status: "LOCKED",
    files: files, // Array of file names
    createdAt: new Date().toISOString()
  };
  
  db.locks.push(newLock);
  saveDB(db);
  return newLock;
};

export const getLock = (lockId) => {
  const db = getDB();
  const lock = db.locks.find(l => l.id === lockId);
  if (!lock) return null;
  
  const project = db.projects.find(p => p.id === lock.projectId);
  const dev = db.users.find(u => u.id === project.devId);
  const client = db.users.find(u => u.id === project.clientId);

  return { ...lock, projectName: project.name, devName: dev.name, clientName: client.name };
};

export const payLock = (lockId) => {
  const db = getDB();
  const lockIndex = db.locks.findIndex(l => l.id === lockId);
  if (lockIndex > -1) {
    db.locks[lockIndex].status = "PAID";
    saveDB(db);
    return true;
  }
  return false;
};