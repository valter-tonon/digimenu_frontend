import React, { createContext, useState, useEffect, ReactNode } from 'react';
import {TableInterface} from "../../domain/types/TableInterface.ts";
import {CompanyInterface} from "../../domain/types/CompanyInterface.ts";
import {StoreContextType} from "../../domain/types/ContextInterface.ts";

export const StoreContext = createContext<StoreContextType | undefined>(undefined);

export const AppContextProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [store, setStore] = useState<CompanyInterface | null>(() => {
        const storedStore = localStorage.getItem('store');
        return storedStore ? JSON.parse(storedStore) : null;
    });

    const [table, setTable] = useState<TableInterface | null>(() => {
        const storedTable = localStorage.getItem('table');
        return storedTable ? JSON.parse(storedTable) : null;
    });

    useEffect(() => {
        localStorage.setItem('store', JSON.stringify(store));
    }, [store]);

    useEffect(() => {
        localStorage.setItem('table', JSON.stringify(table));
    }, [table]);

    return (
        <StoreContext.Provider value={{ store, setStore, table, setTable }}>
            {children}
        </StoreContext.Provider>
    );
};
