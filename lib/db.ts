import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalFarmer {
  id: string;
  name: string;
  phone?: string;
  villageId?: string;
  villageName?: string;
  notes?: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LocalVillage {
  id: string;
  name: string;
  userId: string;
  createdAt: string;
}

export interface LocalEntry {
  id: string;
  farmerId: string;
  farmerName: string;
  serviceName: string;
  cropName: string;
  area: number;
  ratePerBigha: number;
  totalAmount: number;
  remainingAmount: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | string;
  date: string;
  notes?: string;
  userId: string;
  createdAt: string;
}

export interface LocalPayment {
  id: string;
  farmerId: string;
  farmerName: string;
  amount: number;
  remainingAmount: number;
  date: string;
  method: 'CASH' | 'UPI' | 'BANK' | string;
  notes?: string;
  userId: string;
  createdAt: string;
}

export interface LocalAllocation {
  id: string;
  entryId: string;
  paymentId: string;
  amount: number;
  createdAt: string;
}

export interface SyncQueueItem {
  id?: number;
  action: 'CREATE_FARMER' | 'CREATE_ENTRY' | 'CREATE_PAYMENT' | 'UPDATE_SETTINGS' | 'CREATE_VILLAGE';
  payload: any;
  timestamp: number;
}

const STORAGE_KEYS = {
  farmers: 'farmmitra_farmers',
  villages: 'farmmitra_villages',
  entries: 'farmmitra_entries',
  payments: 'farmmitra_payments',
  allocations: 'farmmitra_allocations',
  settings: 'farmmitra_settings',
  syncQueue: 'farmmitra_syncQueue',
};

async function getJSON<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const val = await AsyncStorage.getItem(key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    console.error(`Failed to read key: ${key}`, e);
    return defaultValue;
  }
}

async function saveJSON(key: string, data: any): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error(`Failed to save key: ${key}`, e);
  }
}

export const localDB = {
  // Farmers Methods
  async saveFarmer(farmer: LocalFarmer) {
    const farmers = await getJSON<LocalFarmer[]>(STORAGE_KEYS.farmers, []);
    const index = farmers.findIndex(f => f.id === farmer.id);
    if (index > -1) {
      farmers[index] = farmer;
    } else {
      farmers.push(farmer);
    }
    await saveJSON(STORAGE_KEYS.farmers, farmers);
  },

  async getFarmer(id: string) {
    const farmers = await getJSON<LocalFarmer[]>(STORAGE_KEYS.farmers, []);
    return farmers.find(f => f.id === id);
  },

  async getFarmersByUser(userId: string) {
    const farmers = await getJSON<LocalFarmer[]>(STORAGE_KEYS.farmers, []);
    return farmers.filter(f => f.userId === userId);
  },

  async deleteFarmer(id: string) {
    const farmers = await getJSON<LocalFarmer[]>(STORAGE_KEYS.farmers, []);
    const updated = farmers.filter(f => f.id !== id);
    await saveJSON(STORAGE_KEYS.farmers, updated);
  },

  // Villages Methods
  async saveVillage(village: LocalVillage) {
    const villages = await getJSON<LocalVillage[]>(STORAGE_KEYS.villages, []);
    const index = villages.findIndex(v => v.id === village.id);
    if (index > -1) {
      villages[index] = village;
    } else {
      villages.push(village);
    }
    await saveJSON(STORAGE_KEYS.villages, villages);
  },

  async getVillagesByUser(userId: string) {
    const villages = await getJSON<LocalVillage[]>(STORAGE_KEYS.villages, []);
    return villages.filter(v => v.userId === userId);
  },

  // Entries Methods
  async saveEntry(entry: LocalEntry) {
    const entries = await getJSON<LocalEntry[]>(STORAGE_KEYS.entries, []);
    const index = entries.findIndex(e => e.id === entry.id);
    if (index > -1) {
      entries[index] = entry;
    } else {
      entries.push(entry);
    }
    await saveJSON(STORAGE_KEYS.entries, entries);
  },

  async getEntriesByUser(userId: string) {
    const entries = await getJSON<LocalEntry[]>(STORAGE_KEYS.entries, []);
    return entries.filter(e => e.userId === userId);
  },

  async getEntriesByFarmer(farmerId: string) {
    const entries = await getJSON<LocalEntry[]>(STORAGE_KEYS.entries, []);
    return entries.filter(e => e.farmerId === farmerId);
  },

  async deleteEntry(id: string) {
    const entries = await getJSON<LocalEntry[]>(STORAGE_KEYS.entries, []);
    const updated = entries.filter(e => e.id !== id);
    await saveJSON(STORAGE_KEYS.entries, updated);
  },

  // Payments Methods
  async savePayment(payment: LocalPayment) {
    const payments = await getJSON<LocalPayment[]>(STORAGE_KEYS.payments, []);
    const index = payments.findIndex(p => p.id === payment.id);
    if (index > -1) {
      payments[index] = payment;
    } else {
      payments.push(payment);
    }
    await saveJSON(STORAGE_KEYS.payments, payments);
  },

  async getPaymentsByUser(userId: string) {
    const payments = await getJSON<LocalPayment[]>(STORAGE_KEYS.payments, []);
    return payments.filter(p => p.userId === userId);
  },

  async getPaymentsByFarmer(farmerId: string) {
    const payments = await getJSON<LocalPayment[]>(STORAGE_KEYS.payments, []);
    return payments.filter(p => p.farmerId === farmerId);
  },

  async deletePayment(id: string) {
    const payments = await getJSON<LocalPayment[]>(STORAGE_KEYS.payments, []);
    const updated = payments.filter(p => p.id !== id);
    await saveJSON(STORAGE_KEYS.payments, updated);
  },

  // Allocations Methods
  async saveAllocation(allocation: LocalAllocation) {
    const allocations = await getJSON<LocalAllocation[]>(STORAGE_KEYS.allocations, []);
    const index = allocations.findIndex(a => a.id === allocation.id);
    if (index > -1) {
      allocations[index] = allocation;
    } else {
      allocations.push(allocation);
    }
    await saveJSON(STORAGE_KEYS.allocations, allocations);
  },

  async getAllocationsByEntry(entryId: string) {
    const allocations = await getJSON<LocalAllocation[]>(STORAGE_KEYS.allocations, []);
    return allocations.filter(a => a.entryId === entryId);
  },

  async getAllocationsByPayment(paymentId: string) {
    const allocations = await getJSON<LocalAllocation[]>(STORAGE_KEYS.allocations, []);
    return allocations.filter(a => a.paymentId === paymentId);
  },

  async clearAllocationsForFarmer(farmerId: string) {
    const entries = await this.getEntriesByFarmer(farmerId);
    const entryIds = new Set(entries.map(e => e.id));
    const allocations = await getJSON<LocalAllocation[]>(STORAGE_KEYS.allocations, []);
    const updated = allocations.filter(a => !entryIds.has(a.entryId));
    await saveJSON(STORAGE_KEYS.allocations, updated);
  },

  // Settings Methods
  async saveSetting(key: string, value: any) {
    const settings = await getJSON<Record<string, any>>(STORAGE_KEYS.settings, {});
    settings[key] = value;
    await saveJSON(STORAGE_KEYS.settings, settings);
  },

  async getSetting(key: string) {
    const settings = await getJSON<Record<string, any>>(STORAGE_KEYS.settings, {});
    return settings[key] !== undefined ? settings[key] : null;
  },

  // Sync Queue Methods
  async enqueue(item: SyncQueueItem) {
    const queue = await getJSON<SyncQueueItem[]>(STORAGE_KEYS.syncQueue, []);
    const nextId = queue.length > 0 ? Math.max(...queue.map(q => q.id || 0)) + 1 : 1;
    queue.push({ ...item, id: nextId });
    await saveJSON(STORAGE_KEYS.syncQueue, queue);
  },

  async getQueue() {
    return getJSON<SyncQueueItem[]>(STORAGE_KEYS.syncQueue, []);
  },

  async dequeue(id: number) {
    const queue = await getJSON<SyncQueueItem[]>(STORAGE_KEYS.syncQueue, []);
    const updated = queue.filter(q => q.id !== id);
    await saveJSON(STORAGE_KEYS.syncQueue, updated);
  },

  async clearQueue() {
    await saveJSON(STORAGE_KEYS.syncQueue, []);
  },

  // Re-hydrate local db from cloud data
  async syncCloudData(data: {
    villages: LocalVillage[];
    farmers: LocalFarmer[];
    entries: LocalEntry[];
    payments: LocalPayment[];
    allocations: LocalAllocation[];
  }) {
    await saveJSON(STORAGE_KEYS.villages, data.villages);
    await saveJSON(STORAGE_KEYS.farmers, data.farmers);
    await saveJSON(STORAGE_KEYS.entries, data.entries);
    await saveJSON(STORAGE_KEYS.payments, data.payments);
    await saveJSON(STORAGE_KEYS.allocations, data.allocations);
  },

  // Clear Database (e.g. on Logout)
  async clearAllData() {
    await AsyncStorage.multiRemove(Object.values(STORAGE_KEYS));
  }
};
