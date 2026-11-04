import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

export function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, key] = storedHash.split(':');
  const checkKey = crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
  return crypto.timingSafeEqual(Buffer.from(checkKey, 'hex'), Buffer.from(key, 'hex'));
}

export interface User {
  id: string;
  name: string;
  email: string;
  passwordHash?: string;
  role: string;
  apiKey: string;
  createdAt: string;
}

export interface SavedLocation {
  id: string;
  userId: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  stationId?: string;
  createdAt: string;
}

export interface AlertRule {
  id: string;
  userId: string;
  locationName: string;
  lat: number;
  lon: number;
  pollutant: 'AQI' | 'PM2.5' | 'PM10' | 'NO2' | 'O3' | 'SO2' | 'CO';
  operator: '>' | '>=' | '<';
  threshold: number;
  unit: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  notificationChannel: 'Push & Email' | 'SMS Direct' | 'Webhook' | 'Console';
  active: boolean;
  createdAt: string;
}

export interface ExceedanceEvent {
  id: string;
  alertRuleId?: string;
  locationName: string;
  stationId: string;
  pollutant: string;
  observedValue: number;
  threshold: number;
  unit: string;
  severity: 'Critical' | 'Warning' | 'Advisory';
  status: 'Active Exceedance' | 'Investigating' | 'Resolved';
  timestamp: string;
  details: string;
}

export interface ComparisonSession {
  id: string;
  userId?: string;
  title: string;
  locations: Array<{
    name: string;
    lat: number;
    lon: number;
    country: string;
  }>;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  context?: {
    location?: string;
    aqi?: number;
    pm25?: number;
    modelUsed?: string;
  };
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  savedLocations: SavedLocation[];
  alertRules: AlertRule[];
  exceedanceEvents: ExceedanceEvent[];
  comparisonSessions: ComparisonSession[];
  chatSessions: ChatSession[];
  meta: {
    version: string;
    lastUpdated: string;
    initializedAt: string;
  };
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'ecotrack.json');

function getDefaultData(): DatabaseSchema {
  const now = new Date().toISOString();
  return {
    users: [],
    savedLocations: [
      {
        id: 'loc_tokyo',
        userId: 'system',
        name: 'Tokyo, Japan',
        lat: 35.6895,
        lon: 139.6917,
        country: 'Japan',
        stationId: 'TK-SHINJUKU-SENSOR-4A',
        createdAt: now,
      },
      {
        id: 'loc_london',
        userId: 'system',
        name: 'London, United Kingdom',
        lat: 51.5074,
        lon: -0.1278,
        country: 'United Kingdom',
        stationId: 'LON-BLOOMSBURY-A2',
        createdAt: now,
      },
      {
        id: 'loc_delhi',
        userId: 'system',
        name: 'Delhi NCR, India',
        lat: 28.6139,
        lon: 77.209,
        country: 'India',
        stationId: 'DEL-ANAND-VIHAR-09',
        createdAt: now,
      },
    ],
    alertRules: [
      {
        id: 'rule_delhi_pm25',
        userId: 'system',
        locationName: 'Delhi NCR — Anand Vihar',
        lat: 28.6469,
        lon: 77.316,
        pollutant: 'PM2.5',
        operator: '>',
        threshold: 250,
        unit: 'µg/m³',
        severity: 'Critical',
        notificationChannel: 'Push & Email',
        active: true,
        createdAt: now,
      },
      {
        id: 'rule_saopaulo_pm10',
        userId: 'system',
        locationName: 'São Paulo — Congonhas Basin',
        lat: -23.6273,
        lon: -46.6566,
        pollutant: 'PM10',
        operator: '>',
        threshold: 120,
        unit: 'µg/m³',
        severity: 'Warning',
        notificationChannel: 'SMS Direct',
        active: true,
        createdAt: now,
      },
      {
        id: 'rule_london_no2',
        userId: 'system',
        locationName: 'London — Euston Road Corridor',
        lat: 51.528,
        lon: -0.1337,
        pollutant: 'NO2',
        operator: '>',
        threshold: 85,
        unit: 'µg/m³',
        severity: 'Advisory',
        notificationChannel: 'Webhook',
        active: true,
        createdAt: now,
      },
    ],
    exceedanceEvents: [
      {
        id: 'inc_4091',
        alertRuleId: 'rule_delhi_pm25',
        locationName: 'Delhi NCR — Anand Vihar Station',
        stationId: 'DEL-AV-092',
        pollutant: 'PM2.5',
        observedValue: 312.4,
        threshold: 250.0,
        unit: 'µg/m³',
        severity: 'Critical',
        status: 'Active Exceedance',
        timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
        details: 'Severe boundary layer thermal inversion cap at 340m trapping local vehicular and biomass particulates. Regional ventilation index collapsed to 0.08 m²/s.',
      },
      {
        id: 'inc_3982',
        alertRuleId: 'rule_saopaulo_pm10',
        locationName: 'São Paulo — Congonhas Corridor',
        stationId: 'SP-CGH-104',
        pollutant: 'PM10',
        observedValue: 142.1,
        threshold: 120.0,
        unit: 'µg/m³',
        severity: 'Warning',
        status: 'Investigating',
        timestamp: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
        details: 'Pre-frontal stagnation cell with calm winds (0.4 m/s) elevating coarse aerosol particulates in airport perimeter corridor.',
      },
      {
        id: 'inc_3810',
        alertRuleId: 'rule_london_no2',
        locationName: 'London — Euston Road Street Canyon',
        stationId: 'LON-EUS-018',
        pollutant: 'NO2',
        observedValue: 94.6,
        threshold: 85.0,
        unit: 'µg/m³',
        severity: 'Advisory',
        status: 'Active Exceedance',
        timestamp: new Date(Date.now() - 85 * 60 * 1000).toISOString(),
        details: 'Morning commuter bus & heavy diesel transport surge trapped in narrow urban street canyon during low solar photolysis window.',
      },
    ],
    comparisonSessions: [
      {
        id: 'comp_tri_city',
        userId: 'system',
        title: 'Tri-Continental Mega-Urban Comparison (Tokyo vs London vs Delhi)',
        locations: [
          { name: 'Tokyo, Japan', lat: 35.6895, lon: 139.6917, country: 'Japan' },
          { name: 'London, United Kingdom', lat: 51.5074, lon: -0.1278, country: 'United Kingdom' },
          { name: 'Delhi NCR, India', lat: 28.6139, lon: 77.209, country: 'India' },
        ],
        createdAt: now,
      },
    ],
    chatSessions: [
      {
        id: 'session_default',
        title: 'Atmospheric Dispersion & Inversion Analysis',
        updatedAt: now,
        messages: [
          {
            id: 'msg_init',
            role: 'assistant',
            content: 'Welcome to EcoTrack AI Environmental Copilot. Telemetry feeds from Open-Meteo, WMO GAW calibrated physical ground sensors, and Copernicus orbital observations are synchronized. How can I assist your atmospheric diagnostic today?',
            timestamp: now,
          },
        ],
      },
    ],
    meta: {
      version: '3.4.0',
      lastUpdated: now,
      initializedAt: now,
    },
  };
}

class Database {
  private data: DatabaseSchema;
  private saveTimeout: NodeJS.Timeout | null = null;

  constructor() {
    this.ensureDirectory();
    this.data = this.load();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (err) {
        console.error('Failed to create data directory:', err);
      }
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.users && parsed.alertRules) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing db file, creating default state:', err);
    }

    const defaultData = getDefaultData();
    this.persistSync(defaultData);
    return defaultData;
  }

  private persistSync(data: DatabaseSchema) {
    try {
      this.ensureDirectory();
      const tempPath = `${DB_FILE}.tmp.${Date.now()}`;
      fs.writeFileSync(tempPath, JSON.stringify(data, null, 2), 'utf-8');
      fs.renameSync(tempPath, DB_FILE);
    } catch (err) {
      console.error('Error writing to database file:', err);
    }
  }

  public schedulePersist() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }
    this.saveTimeout = setTimeout(() => {
      this.data.meta.lastUpdated = new Date().toISOString();
      this.persistSync(this.data);
      this.saveTimeout = null;
    }, 100);
  }

  // --- Users ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public createUser(user: Omit<User, 'id' | 'createdAt'>): User {
    const newUser: User = {
      ...user,
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.schedulePersist();
    return newUser;
  }

  public upsertLocalUser(userData: { id?: string; email: string; name?: string; role?: string; apiKey?: string; createdAt?: string }): User {
    let existing = this.data.users.find(u => (userData.id && u.id === userData.id) || u.email.toLowerCase() === userData.email.toLowerCase());
    if (existing) {
      if (userData.name) existing.name = userData.name;
      if (userData.role) existing.role = userData.role;
      this.schedulePersist();
      return existing;
    }
    const newUser: User = {
      id: userData.id || `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      name: userData.name || 'Authenticated Operator',
      email: userData.email,
      role: userData.role || 'Environmental Systems Engineer',
      apiKey: userData.apiKey || `eco_${Math.random().toString(36).substring(2, 12)}`,
      createdAt: userData.createdAt || new Date().toISOString(),
    };
    this.data.users.push(newUser);
    this.schedulePersist();
    return newUser;
  }

  public upsertFirebaseUser(firebaseUser: { uid: string; email?: string; name?: string }): User {
    return this.upsertLocalUser({
      id: firebaseUser.uid,
      email: firebaseUser.email || `${firebaseUser.uid}@ecotrack.local`,
      name: firebaseUser.name,
    });
  }

  public updateUserPassword(email: string, newHash: string): boolean {
    const user = this.getUserByEmail(email);
    if (user) {
      user.passwordHash = newHash;
      this.schedulePersist();
      return true;
    }
    return false;
  }

  // --- Saved Locations ---
  public getSavedLocations(userId?: string): SavedLocation[] {
    if (userId) {
      return this.data.savedLocations.filter(loc => loc.userId === userId || loc.userId === 'system');
    }
    // Guest access: return only default system benchmark locations
    return this.data.savedLocations.filter(loc => loc.userId === 'system');
  }

  public addSavedLocation(loc: Omit<SavedLocation, 'id' | 'createdAt'>): SavedLocation {
    const existing = this.data.savedLocations.find(
      l => Math.abs(l.lat - loc.lat) < 0.05 && Math.abs(l.lon - loc.lon) < 0.05 && l.userId === loc.userId
    );
    if (existing) {
      return existing;
    }
    const newLoc: SavedLocation = {
      ...loc,
      id: `loc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.savedLocations.push(newLoc);
    this.schedulePersist();
    return newLoc;
  }

  public deleteSavedLocation(id: string, userId?: string): boolean {
    const prevLen = this.data.savedLocations.length;
    this.data.savedLocations = this.data.savedLocations.filter(l => {
      if (l.id !== id) return true;
      if (userId && l.userId !== userId && l.userId !== 'system') return true;
      return false;
    });
    if (this.data.savedLocations.length !== prevLen) {
      this.schedulePersist();
      return true;
    }
    return false;
  }

  // --- Alert Rules ---
  public getAllActiveRulesForEvaluation(): AlertRule[] {
    // Internal method for background threshold checking across all nodes
    return this.data.alertRules.filter(r => r.active);
  }

  public getAlertRules(userId?: string): AlertRule[] {
    if (userId) {
      return this.data.alertRules.filter(r => r.userId === userId || r.userId === 'system');
    }
    // Guest access: return ONLY default system benchmark rules, never private user rules
    return this.data.alertRules.filter(r => r.userId === 'system');
  }

  public addAlertRule(rule: Omit<AlertRule, 'id' | 'createdAt'>): AlertRule {
    const newRule: AlertRule = {
      ...rule,
      id: `rule_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    this.data.alertRules.push(newRule);
    this.schedulePersist();
    return newRule;
  }

  public updateAlertRule(
    id: string,
    userId: string | undefined,
    updates: Partial<Omit<AlertRule, 'id' | 'createdAt' | 'userId'>>
  ): AlertRule | null {
    const rule = this.data.alertRules.find(r => r.id === id);
    if (!rule) return null;
    if (userId && rule.userId !== userId && rule.userId !== 'system') {
      return null;
    }
    Object.assign(rule, updates);
    this.schedulePersist();
    return rule;
  }

  public toggleAlertRule(id: string, userId?: string): AlertRule | null {
    const rule = this.data.alertRules.find(r => r.id === id);
    if (rule) {
      if (userId && rule.userId !== userId && rule.userId !== 'system') {
        return null;
      }
      rule.active = !rule.active;
      this.schedulePersist();
      return rule;
    }
    return null;
  }

  public deleteAlertRule(id: string, userId?: string): boolean {
    const prevLen = this.data.alertRules.length;
    this.data.alertRules = this.data.alertRules.filter(r => {
      if (r.id !== id) return true;
      if (userId && r.userId !== userId && r.userId !== 'system') return true;
      return false;
    });
    if (this.data.alertRules.length !== prevLen) {
      this.schedulePersist();
      return true;
    }
    return false;
  }

  // --- Exceedance Events ---
  public getExceedanceEvents(): ExceedanceEvent[] {
    return this.data.exceedanceEvents;
  }

  public recordExceedanceEvent(event: Omit<ExceedanceEvent, 'id' | 'timestamp'>): ExceedanceEvent {
    const newEvent: ExceedanceEvent = {
      ...event,
      id: `inc_${Math.floor(1000 + Math.random() * 9000)}`,
      timestamp: new Date().toISOString(),
    };
    this.data.exceedanceEvents.unshift(newEvent);
    if (this.data.exceedanceEvents.length > 50) {
      this.data.exceedanceEvents = this.data.exceedanceEvents.slice(0, 50);
    }
    this.schedulePersist();
    return newEvent;
  }

  // --- Chat Sessions ---
  public getChatSession(id: string = 'session_default'): ChatSession {
    let session = this.data.chatSessions.find(s => s.id === id);
    if (!session) {
      session = {
        id,
        title: 'Environmental Research Session',
        messages: [],
        updatedAt: new Date().toISOString(),
      };
      this.data.chatSessions.push(session);
    }
    return session;
  }

  public addChatMessage(sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage {
    const session = this.getChatSession(sessionId);
    const newMsg: ChatMessage = {
      ...message,
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
    };
    session.messages.push(newMsg);
    session.updatedAt = new Date().toISOString();
    this.schedulePersist();
    return newMsg;
  }

  public clearChatSession(sessionId: string) {
    const session = this.getChatSession(sessionId);
    session.messages = [];
    session.updatedAt = new Date().toISOString();
    this.schedulePersist();
  }

  // --- Comparison Sessions ---
  public getComparisonSessions(userId?: string): ComparisonSession[] {
    if (userId) {
      return this.data.comparisonSessions.filter(s => s.userId === userId || s.userId === 'system');
    }
    return this.data.comparisonSessions;
  }

  public saveComparisonSession(session: Omit<ComparisonSession, 'id' | 'createdAt'>): ComparisonSession {
    const newSession: ComparisonSession = {
      ...session,
      id: `comp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.comparisonSessions.unshift(newSession);
    this.schedulePersist();
    return newSession;
  }
}

export const db = new Database();
