import {CompanyInterface} from "./CompanyInterface.ts";
import {TableInterface} from "./TableInterface.ts";

export interface StoreContextType {
    store: CompanyInterface | null;
    setStore: (store: CompanyInterface | null) => void;
    table: TableInterface | null;
    setTable: (table: TableInterface | null) => void;
}
