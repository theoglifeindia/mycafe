
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  onSnapshot, 
  setDoc, 
  updateDoc, 
  deleteDoc,
  getDoc, 
  query, 
  orderBy, 
  Timestamp,
  deleteField
} from 'firebase/firestore';
import { MenuItem, Table, Order, BusinessProfile, AppSettings, Customer } from '../types.ts';
import { INITIAL_MENU, INITIAL_TABLES, INITIAL_PROFILE, INITIAL_SETTINGS } from '../constants.tsx';
import { compressImageDataUrl } from './imageCompressor.ts';

/**
 * Utility to remove undefined keys from an object before sending to Firestore.
 * Firestore updateDoc fails if keys have undefined values.
 */
const cleanData = (obj: any) => {
  const newObj: any = {};
  Object.keys(obj).forEach(key => {
    if (obj[key] !== undefined) {
      newObj[key] = obj[key];
    }
  });
  return newObj;
};

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY || "AIzaSyB-cPRYfJPeFmFSoxa3l9HyhJX1tmoaoFs", 
  authDomain: process.env.FIREBASE_AUTH_DOMAIN || "myrbpos.firebaseapp.com",
  projectId: process.env.FIREBASE_PROJECT_ID || "myrbpos",
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "myrbpos.firebasestorage.app",
  messagingSenderId: process.env.FIREBASE_SENDER_ID || "29530955620",
  appId: process.env.FIREBASE_APP_ID || "1:29530955620:web:cf22aa54c4952a8a786471"
};

const app = initializeApp(firebaseConfig);
const firestore = getFirestore(app);

class FirestoreService {
  async testConnection(): Promise<boolean> {
    try {
      if (firebaseConfig.projectId.includes("YOUR_PROJECT_ID") || firebaseConfig.projectId.includes("your-project-id")) {
        console.error("Firestore Error: Placeholder Project IDs detected.");
        return false;
      }
      await getDoc(doc(firestore, 'config', 'app_settings'));
      return true;
    } catch (e: any) {
      console.error("Firestore Connection Error:", e);
      return false;
    }
  }

  subscribeToMenu(callback: (items: MenuItem[]) => void) {
    const q = query(collection(firestore, 'menu_items'), orderBy('category'));
    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as MenuItem));
      if (items.length === 0) callback(INITIAL_MENU);
      else callback(items);
    }, (err) => console.error("Menu Subscription Error:", err));
  }

  async updateMenu(items: MenuItem[]) {
    for (const item of items) {
      await setDoc(doc(firestore, 'menu_items', item.id), cleanData(item));
    }
  }

  subscribeToTables(callback: (tables: Table[]) => void) {
    return onSnapshot(collection(firestore, 'tables'), (snapshot) => {
      const tables = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Table));
      if (tables.length === 0) callback(INITIAL_TABLES);
      else callback(tables);
    }, (err) => console.error("Table Subscription Error:", err));
  }

  async setTables(tables: Table[]) {
    for (const table of tables) {
      await setDoc(doc(firestore, 'tables', table.id), cleanData(table));
    }
  }

  async updateTable(id: string, updates: Partial<Table>) {
    const processedUpdates: any = { ...updates };
    // Convert null explicitly to deleteField() for Firestore field removal
    Object.keys(processedUpdates).forEach(key => {
      if (processedUpdates[key] === null) {
        processedUpdates[key] = deleteField();
      }
    });
    await updateDoc(doc(firestore, 'tables', id), cleanData(processedUpdates));
  }

  async deleteTable(id: string) {
    await deleteDoc(doc(firestore, 'tables', id));
  }

  subscribeToOrders(callback: (orders: Order[]) => void) {
    const q = query(collection(firestore, 'orders'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      const orders = snapshot.docs.map(d => ({ ...d.data(), id: d.id } as Order));
      callback(orders);
    }, (err) => console.error("Orders Subscription Error:", err));
  }

  async createOrder(order: Order) {
    const docId = order.id.startsWith('ORD_') ? order.id : `ORD_${order.id.replace('#', '')}`;
    await setDoc(doc(firestore, 'orders', docId), {
      ...cleanData(order),
      id: docId,
      serverTimestamp: Timestamp.now()
    });
  }

  subscribeToSettings(callback: (settings: AppSettings) => void) {
    return onSnapshot(doc(firestore, 'config', 'app_settings'), (docSnap) => {
      if (docSnap.exists()) {
        callback(docSnap.data() as AppSettings);
      } else {
        this.updateSettings(INITIAL_SETTINGS);
        callback(INITIAL_SETTINGS);
      }
    });
  }

  async updateSettings(settings: AppSettings) {
    const cleaned = cleanData(settings);
    if (cleaned.logoUrl && typeof cleaned.logoUrl === 'string' && cleaned.logoUrl.startsWith('data:image')) {
      try {
        cleaned.logoUrl = await compressImageDataUrl(cleaned.logoUrl, 300, 300, 0.7);
      } catch (e) {
        console.error("Failed to compress settings logoUrl:", e);
      }
    }
    await setDoc(doc(firestore, 'config', 'app_settings'), cleaned);
  }

  async getProfile(): Promise<BusinessProfile | null> {
    const snap = await getDoc(doc(firestore, 'config', 'business_profile'));
    if (snap.exists()) return snap.data() as BusinessProfile;
    await this.updateProfile(INITIAL_PROFILE);
    return INITIAL_PROFILE;
  }

  async updateProfile(profile: BusinessProfile) {
    const cleaned = cleanData(profile);
    if (cleaned.logoUrl && typeof cleaned.logoUrl === 'string' && cleaned.logoUrl.startsWith('data:image')) {
      try {
        cleaned.logoUrl = await compressImageDataUrl(cleaned.logoUrl, 300, 300, 0.7);
      } catch (e) {
        console.error("Failed to compress profile logoUrl:", e);
      }
    }
    await setDoc(doc(firestore, 'config', 'business_profile'), cleaned);
  }

  getCustomers(): Customer[] {
    try {
      const data = localStorage.getItem('pos_app_customers');
      if (data) return JSON.parse(data);
    } catch (e) {
      console.error("Failed to load customers from storage:", e);
    }
    return [];
  }

  saveOrUpdateCustomer(name: string, phone: string, amountSpent: number = 0): Customer {
    const customers = this.getCustomers();
    const existingIndex = customers.findIndex(c => 
      (phone && c.phone === phone) || (name && name.length > 0 && c.name.toLowerCase() === name.toLowerCase())
    );

    const now = new Date().toISOString();
    let updatedCustomer: Customer;

    if (existingIndex >= 0) {
      const existing = customers[existingIndex];
      updatedCustomer = {
        ...existing,
        name: name || existing.name,
        phone: phone || existing.phone,
        totalVisits: (existing.totalVisits || 1) + 1,
        totalSpent: (existing.totalSpent || 0) + amountSpent,
        lastVisit: now
      };
      customers[existingIndex] = updatedCustomer;
    } else {
      updatedCustomer = {
        id: `CUST_${Date.now()}`,
        name: name || 'Guest',
        phone: phone || '-',
        totalVisits: 1,
        totalSpent: amountSpent,
        lastVisit: now,
        createdAt: now
      };
      customers.push(updatedCustomer);
    }

    try {
      localStorage.setItem('pos_app_customers', JSON.stringify(customers));
      setDoc(doc(firestore, 'customers', updatedCustomer.id), cleanData(updatedCustomer)).catch(err => 
        console.error("Customer Firestore sync error:", err)
      );
    } catch (e) {
      console.error("Failed to save customer:", e);
    }

    return updatedCustomer;
  }
}

export const db = new FirestoreService();
