import { createContext, useContext } from 'react';

export interface GlobalContextType {
    setTheme: (theme: string) => void;
}

export const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
    const context = useContext(GlobalContext);
    if (!context) {
        throw new Error('useGlobal must be used within a GlobalProvider');
    }
    return context;
};