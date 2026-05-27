import { create } from 'zustand';
import NetInfo from '@react-native-community/netinfo';
import { 
  localDB, 
  LocalFarmer, 
  LocalEntry, 
  LocalPayment, 
  LocalVillage, 
  LocalAllocation 
} from './db';
import { allocatePaymentFIFO, reconstructLedgerFIFO } from './fifo';
import { Language } from './translations';

// Use the local development server URL when testing on a physical device.
// Since the backend is running on the computer, replace localhost with the machine's local IP.
const BACKEND_URL = 'http://192.168.1.13:4000';

export interface UserSession {
  id: string;
  phone: string;
  name: string;
  businessName: string;
  language: Language;
  pinHash: string;
}

export interface ServiceRateConfig {
  name: string;
  rate: number;
}

interface LedgerState {
  currentUser: UserSession | null;
  language: Language;
  theme: 'light' | 'dark';
  activeRates: ServiceRateConfig[];
  villages: LocalVillage[];
  farmers: LocalFarmer[];
  entries: LocalEntry[];
  payments: LocalPayment[];
  allocations: LocalAllocation[];
  
  // App UI/Sync States
  isOffline: boolean;
  isSyncing: boolean;
  isOnboarded: boolean;
  syncQueueLength: number;
  isInitialized: boolean;

  // Actions
  initialize: () => Promise<void>;
  setOnboarded: (onboarded: boolean) => Promise<void>;
  setLanguage: (lang: Language) => Promise<void>;
  setTheme: (theme: 'light' | 'dark') => Promise<void>;
  updateRates: (rates: ServiceRateConfig[]) => Promise<void>;
  setCurrentUser: (user: UserSession | null) => Promise<void>;
  setOfflineStatus: (offline: boolean) => void;
  
  // Ledger operations
  addFarmer: (name: string, villageName: string, phone?: string, notes?: string) => Promise<LocalFarmer>;
  addEntry: (farmerId: string, serviceName: string, cropName: string, area: number, ratePerBigha: number, date?: string, notes?: string, totalAmountOverride?: number) => Promise<LocalEntry>;
  addPayment: (farmerId: string, amount: number, method: string, date?: string, notes?: string) => Promise<LocalPayment>;
  
  // Sync
  syncWithCloud: () => Promise<boolean>;
  fetchDataFromCloud: (userId: string) => Promise<boolean>;
  clearLocalCache: () => Promise<void>;
}

export const useLedgerStore = create<LedgerState>((set, get) => {
  // Subscribe to NetInfo for connection status in React Native
  NetInfo.addEventListener(state => {
    const isOffline = !(state.isConnected && state.isInternetReachable !== false);
    const wasOffline = get().isOffline;
    set({ isOffline });
    
    if (wasOffline && !isOffline) {
      get().syncWithCloud();
    }
  });

  return {
    currentUser: null,
    language: 'hinglish',
    theme: 'light',
    activeRates: [
      { name: 'water', rate: 100 },
      { name: 'tractor', rate: 800 },
      { name: 'spray', rate: 150 },
      { name: 'seeds', rate: 400 },
      { name: 'labor', rate: 350 },
    ],
    villages: [],
    farmers: [],
    entries: [],
    payments: [],
    allocations: [],
    
    isOffline: false,
    isSyncing: false,
    isOnboarded: false,
    syncQueueLength: 0,
    isInitialized: false,

    initialize: async () => {
      if (get().isInitialized) return;
      try {
        const currentUser = await localDB.getSetting('currentUser');
        const language = await localDB.getSetting('language') || 'hinglish';
        const theme = await localDB.getSetting('theme') || 'light';
        const activeRates = await localDB.getSetting('activeRates');
        const isOnboarded = await localDB.getSetting('isOnboarded') || false;
        
        let farmers: LocalFarmer[] = [];
        let entries: LocalEntry[] = [];
        let payments: LocalPayment[] = [];
        let villages: LocalVillage[] = [];
        const queue = await localDB.getQueue();

        if (currentUser) {
          farmers = await localDB.getFarmersByUser(currentUser.id);
          entries = await localDB.getEntriesByUser(currentUser.id);
          payments = await localDB.getPaymentsByUser(currentUser.id);
          villages = await localDB.getVillagesByUser(currentUser.id);
        }

        set({
          currentUser,
          language,
          theme,
          activeRates: activeRates || get().activeRates,
          isOnboarded,
          farmers,
          entries,
          payments,
          villages,
          syncQueueLength: queue.length,
          isInitialized: true
        });

        // Trigger automatic sync if online and has queued items
        const netState = await NetInfo.fetch();
        const isOnline = !!(netState.isConnected && netState.isInternetReachable !== false);
        set({ isOffline: !isOnline });

        if (isOnline) {
          if (queue.length > 0) {
            get().syncWithCloud();
          } else if (currentUser) {
            get().fetchDataFromCloud(currentUser.id);
          }
        }
      } catch (err) {
        console.error('Failed to initialize local store', err);
      }
    },

    setOnboarded: async (onboarded) => {
      await localDB.saveSetting('isOnboarded', onboarded);
      set({ isOnboarded: onboarded });
    },

    setLanguage: async (lang) => {
      await localDB.saveSetting('language', lang);
      set({ language: lang });
    },

    setTheme: async (theme) => {
      await localDB.saveSetting('theme', theme);
      set({ theme });
    },

    updateRates: async (rates) => {
      await localDB.saveSetting('activeRates', rates);
      set({ activeRates: rates });
      
      const { currentUser } = get();
      if (currentUser) {
        await localDB.enqueue({
          action: 'UPDATE_SETTINGS',
          payload: { rates, userId: currentUser.id },
          timestamp: Date.now()
        });
        set({ syncQueueLength: (await localDB.getQueue()).length });
        get().syncWithCloud();
      }
    },

    setCurrentUser: async (user) => {
      await localDB.saveSetting('currentUser', user);
      set({ currentUser: user });
      if (user) {
        // Reload data for this user
        const farmers = await localDB.getFarmersByUser(user.id);
        const entries = await localDB.getEntriesByUser(user.id);
        const payments = await localDB.getPaymentsByUser(user.id);
        const villages = await localDB.getVillagesByUser(user.id);
        const queue = await localDB.getQueue();
        
        set({
          farmers,
          entries,
          payments,
          villages,
          syncQueueLength: queue.length
        });

        // Fetch user data from cloud to hydrate device
        const netState = await NetInfo.fetch();
        const isOnline = !!(netState.isConnected && netState.isInternetReachable !== false);
        if (isOnline) {
          get().fetchDataFromCloud(user.id);
        }
      } else {
        set({
          farmers: [],
          entries: [],
          payments: [],
          villages: [],
          syncQueueLength: 0
        });
      }
    },

    setOfflineStatus: (offline) => {
      set({ isOffline: offline });
    },

    addFarmer: async (name, villageName, phone, notes) => {
      const { currentUser } = get();
      const userId = currentUser?.id || 'demo-user';
      
      let village = get().villages.find(v => v.name.toLowerCase() === villageName.toLowerCase());
      if (!village) {
        village = {
          id: `vil-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
          name: villageName.trim(),
          userId,
          createdAt: new Date().toISOString()
        };
        await localDB.saveVillage(village);
        set(state => ({ villages: [...state.villages, village!] }));
        
        await localDB.enqueue({
          action: 'CREATE_VILLAGE',
          payload: village,
          timestamp: Date.now()
        });
      }

      const newFarmer: LocalFarmer = {
        id: `far-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        name: name.trim(),
        phone: phone?.trim() || undefined,
        villageId: village.id,
        villageName: village.name,
        notes: notes?.trim() || undefined,
        userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      await localDB.saveFarmer(newFarmer);
      set(state => ({ farmers: [...state.farmers, newFarmer] }));

      await localDB.enqueue({
        action: 'CREATE_FARMER',
        payload: newFarmer,
        timestamp: Date.now()
      });

      set({ syncQueueLength: (await localDB.getQueue()).length });
      get().syncWithCloud();

      return newFarmer;
    },

    addEntry: async (farmerId, serviceName, cropName, area, ratePerBigha, dateString, notes, totalAmountOverride) => {
      const { currentUser, farmers } = get();
      const userId = currentUser?.id || 'demo-user';
      const farmer = farmers.find(f => f.id === farmerId);
      
      const totalAmount = totalAmountOverride !== undefined ? totalAmountOverride : Number((area * ratePerBigha).toFixed(2));
      const newEntry: LocalEntry = {
        id: `ent-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        farmerId,
        farmerName: farmer?.name || 'Kisan',
        serviceName,
        cropName,
        area,
        ratePerBigha,
        totalAmount,
        remainingAmount: totalAmount,
        status: 'PENDING',
        date: dateString || new Date().toISOString(),
        notes: notes || undefined,
        userId,
        createdAt: new Date().toISOString()
      };

      await localDB.saveEntry(newEntry);
      
      const farmerEntries = [...get().entries.filter(e => e.farmerId === farmerId), newEntry];
      const farmerPayments = get().payments.filter(p => p.farmerId === farmerId);

      const reconstruction = reconstructLedgerFIFO(farmerEntries, farmerPayments);
      
      await localDB.clearAllocationsForFarmer(farmerId);
      for (const allocation of reconstruction.allocations) {
        await localDB.saveAllocation({
          id: allocation.id,
          entryId: allocation.entryId,
          paymentId: allocation.paymentId,
          amount: allocation.amount,
          createdAt: new Date().toISOString()
        });
      }

      for (const entry of reconstruction.updatedEntries) {
        const localEntry = farmerEntries.find(e => e.id === entry.id)!;
        localEntry.remainingAmount = entry.remainingAmount;
        localEntry.status = entry.status;
        await localDB.saveEntry(localEntry);
      }

      const updatedPayments = get().payments.map(p => {
        const unalloc = reconstruction.unallocatedPayments.find(up => up.paymentId === p.id);
        return unalloc ? { ...p, remainingAmount: unalloc.remainingAmount } : p;
      });
      for (const pay of updatedPayments) {
        if (pay.farmerId === farmerId) {
          await localDB.savePayment(pay);
        }
      }

      const allEntries = await localDB.getEntriesByUser(userId);
      const allPayments = await localDB.getPaymentsByUser(userId);
      set({ entries: allEntries, payments: allPayments });

      await localDB.enqueue({
        action: 'CREATE_ENTRY',
        payload: {
          id: newEntry.id,
          farmerId: newEntry.farmerId,
          serviceName: newEntry.serviceName,
          cropName: newEntry.cropName,
          area: newEntry.area,
          ratePerBigha: newEntry.ratePerBigha,
          totalAmount: newEntry.totalAmount,
          date: newEntry.date,
          notes: newEntry.notes,
          userId: newEntry.userId
        },
        timestamp: Date.now()
      });

      set({ syncQueueLength: (await localDB.getQueue()).length });
      get().syncWithCloud();

      return newEntry;
    },

    addPayment: async (farmerId, amount, method, dateString, notes) => {
      const { currentUser, farmers } = get();
      const userId = currentUser?.id || 'demo-user';
      const farmer = farmers.find(f => f.id === farmerId);

      const newPayment: LocalPayment = {
        id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        farmerId,
        farmerName: farmer?.name || 'Kisan',
        amount,
        remainingAmount: amount,
        date: dateString || new Date().toISOString(),
        method,
        notes: notes || undefined,
        userId,
        createdAt: new Date().toISOString()
      };

      await localDB.savePayment(newPayment);

      const farmerEntries = get().entries.filter(e => e.farmerId === farmerId);
      const farmerPayments = [...get().payments.filter(p => p.farmerId === farmerId), newPayment];

      const reconstruction = reconstructLedgerFIFO(farmerEntries, farmerPayments);

      await localDB.clearAllocationsForFarmer(farmerId);
      for (const allocation of reconstruction.allocations) {
        await localDB.saveAllocation({
          id: allocation.id,
          entryId: allocation.entryId,
          paymentId: allocation.paymentId,
          amount: allocation.amount,
          createdAt: new Date().toISOString()
        });
      }

      for (const entry of reconstruction.updatedEntries) {
        const localEntry = farmerEntries.find(e => e.id === entry.id)!;
        localEntry.remainingAmount = entry.remainingAmount;
        localEntry.status = entry.status;
        await localDB.saveEntry(localEntry);
      }

      for (const pay of farmerPayments) {
        const unalloc = reconstruction.unallocatedPayments.find(up => up.paymentId === pay.id);
        pay.remainingAmount = unalloc ? unalloc.remainingAmount : 0;
        await localDB.savePayment(pay);
      }

      const allEntries = await localDB.getEntriesByUser(userId);
      const allPayments = await localDB.getPaymentsByUser(userId);
      set({ entries: allEntries, payments: allPayments });

      await localDB.enqueue({
        action: 'CREATE_PAYMENT',
        payload: {
          id: newPayment.id,
          farmerId: newPayment.farmerId,
          amount: newPayment.amount,
          date: newPayment.date,
          method: newPayment.method,
          notes: newPayment.notes,
          userId: newPayment.userId
        },
        timestamp: Date.now()
      });

      set({ syncQueueLength: (await localDB.getQueue()).length });
      get().syncWithCloud();

      return newPayment;
    },

    syncWithCloud: async () => {
      if (get().isSyncing || get().isOffline) return false;
      
      const queue = await localDB.getQueue();
      if (queue.length === 0) return true;

      set({ isSyncing: true });

      try {
        const response = await fetch(`${BACKEND_URL}/api/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ batch: queue }),
        });
        
        if (response.ok) {
          for (const item of queue) {
            if (item.id !== undefined) {
              await localDB.dequeue(item.id);
            }
          }
          
          const { currentUser } = get();
          if (currentUser) {
            await get().fetchDataFromCloud(currentUser.id);
          }
          
          set({ isSyncing: false, syncQueueLength: 0 });
          return true;
        } else {
          const errData = await response.json().catch(() => ({}));
          console.warn('Background sync failed:', errData.error || response.statusText);
          set({ isSyncing: false, syncQueueLength: (await localDB.getQueue()).length });
          return false;
        }
      } catch (err) {
        console.error('Background sync failed:', err);
        set({ isSyncing: false, syncQueueLength: (await localDB.getQueue()).length });
        return false;
      }
    },

    fetchDataFromCloud: async (userId: string) => {
      if (get().isOffline) return false;
      try {
        const response = await fetch(`${BACKEND_URL}/api/sync?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`Cloud fetch failed: ${response.statusText}`);
        }
        const res = await response.json();
        if (res.success && res.data) {
          await localDB.syncCloudData(res.data);
          
          set({
            villages: res.data.villages || [],
            farmers: res.data.farmers || [],
            entries: res.data.entries || [],
            payments: res.data.payments || [],
            allocations: res.data.allocations || []
          });
          return true;
        }
        return false;
      } catch (err) {
        console.error('Failed to pull data from cloud:', err);
        return false;
      }
    },

    clearLocalCache: async () => {
      await localDB.clearAllData();
      set({
        currentUser: null,
        farmers: [],
        entries: [],
        payments: [],
        villages: [],
        allocations: [],
        isOnboarded: false,
        syncQueueLength: 0
      });
    }
  };
});
export { BACKEND_URL };
