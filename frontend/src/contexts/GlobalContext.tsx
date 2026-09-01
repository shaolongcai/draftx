import { createContext, useContext } from 'react';

export interface GlobalContextType {
    setTheme: (theme: string) => void;
    trialEndDate: number | null; // 结束时间，单位为毫秒
    setTrialEndDate: (endDate: number | null) => void // 设置结束时间，单位为毫秒
}

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};