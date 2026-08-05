import React, { createContext, useContext, useState, useEffect } from 'react';

export type IndianState = 'Maharashtra' | 'Karnataka' | 'Goa' | 'Gujarat' | 'Tamil Nadu' | 'Delhi';

export interface AppSettings {
  electricityTariff: number; // ₹/kWh
  exportTariff: number; // ₹/kWh
  solarCapacity: number; // kW
  selectedState: IndianState;
  themeMode: 'light' | 'dark' | 'system';
}

export interface InverterDetails {
  status: 'Online' | 'Offline';
  currentPower: number; // kW
  todayGeneration: number; // kWh
  totalGeneration: number; // kWh
  houseUsage: number; // kWh
  gridImport: number; // kWh
  gridExport: number; // kWh
  savingsToday: number; // ₹
  savingsMonth: number; // ₹
  savingsLifetime: number; // ₹
  co2Reduced: number; // kg
  treesEquivalent: number;
  lastUpdated: string;
}

interface AppContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  data: InverterDetails;
  resetAllData: () => void;
  refreshData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const DEFAULT_SETTINGS: AppSettings = {
  electricityTariff: 7.5,
  exportTariff: 4.5,
  solarCapacity: 5.0,
  selectedState: 'Maharashtra',
  themeMode: 'system',
};

export const AppContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [data, setData] = useState<InverterDetails>({
    status: 'Online',
    currentPower: 3.6,
    todayGeneration: 12.8,
    totalGeneration: 5600,
    houseUsage: 9.4,
    gridImport: 1.3,
    gridExport: 5.2,
    savingsToday: 94,
    savingsMonth: 2884,
    savingsLifetime: 42500,
    co2Reduced: 3420,
    treesEquivalent: 140,
    lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  });

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prev) => {
      const updated = { ...prev, ...newSettings };
      return updated;
    });
  };

  const resetAllData = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  // Recalculate metrics whenever settings change
  useEffect(() => {
    // Basic scaling based on capacity
    const capacityRatio = settings.solarCapacity / 5.0; // 5kW is the base standard
    
    // Solar generation scales with capacity. A 5kW system generates around 20 kWh on a good day.
    // Let's assume today is a slightly cloudy day, generation is 12.8 kWh for 5kW.
    const todayGeneration = Math.round(12.8 * capacityRatio * 10) / 10;
    
    // Current power output is a snapshot of generation, scaled by capacity.
    const currentPower = Math.round(3.6 * capacityRatio * 10) / 10;
    
    // House usage is independent but let's keep it around 9.4 kWh for simulation
    const houseUsage = 9.4;
    
    // Net Metering logic:
    // Generation = Self Consumption + Grid Export
    // Self Consumption = Generation - Grid Export
    // House Usage = Self Consumption + Grid Import = Generation - Grid Export + Grid Import
    // Therefore, Grid Export - Grid Import = Generation - House Usage
    // Net energy exported = Generation - House Usage
    // If positive, Grid Export = Net energy exported + Grid Import
    // If negative, Grid Import = House Usage - Generation
    
    let gridExport = 0;
    let gridImport = 0;
    
    const balance = todayGeneration - houseUsage;
    if (balance > 0) {
      gridExport = Math.round(balance * 10) / 10;
      gridImport = 1.3; // minimum baseline import for peak shifts
      // Adjust export to be net positive
      gridExport = Math.round((balance + gridImport) * 10) / 10;
    } else {
      gridImport = Math.round((Math.abs(balance) + 1.0) * 10) / 10;
      gridExport = 1.0; // baseline export
    }

    // Savings Formula for Indian Net Metering:
    // Today's Savings = (Self Consumption * Import Tariff) + (Grid Export * Export Tariff) - (Grid Import * Import Tariff)
    // Self Consumption = Generation - Grid Export
    const selfConsumption = Math.max(0, todayGeneration - gridExport);
    const savingsToday = Math.round(
      (selfConsumption * settings.electricityTariff) + 
      (gridExport * settings.exportTariff) - 
      (gridImport * settings.electricityTariff)
    );

    // Lifetime metrics scaled by capacity
    const totalGeneration = Math.round(5600 * capacityRatio);
    const savingsLifetime = Math.round(
      totalGeneration * 0.7 * settings.electricityTariff + 
      totalGeneration * 0.3 * settings.exportTariff
    );
    const savingsMonth = Math.round(savingsLifetime / 15); // approximation for active month

    // CO2 offset: ~0.82 kg CO2 per kWh of solar energy in India
    const co2Reduced = Math.round(totalGeneration * 0.82);
    
    // Trees equivalent: 1 mature tree absorbs ~22kg of CO2 per year.
    // Let's assume total lifetime impact equates to standard tree carbon storage capacity.
    const treesEquivalent = Math.round(co2Reduced / 22);

    setData((prev) => ({
      ...prev,
      todayGeneration,
      currentPower,
      houseUsage,
      gridExport,
      gridImport,
      savingsToday,
      savingsMonth,
      savingsLifetime,
      co2Reduced,
      treesEquivalent,
      lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    }));
  }, [settings]);

  const refreshData = () => {
    // Simulate minor fluctuations to make the live data feel active
    setData((prev) => {
      const randomFluctuation = (Math.random() - 0.5) * 0.2; // +/- 0.1 kW
      const newPower = Math.max(0, Math.round((prev.currentPower + randomFluctuation) * 10) / 10);
      return {
        ...prev,
        currentPower: newPower,
        lastUpdated: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      };
    });
  };

  return (
    <AppContext.Provider value={{ settings, updateSettings, data, resetAllData, refreshData }}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppContextProvider');
  }
  return context;
};
