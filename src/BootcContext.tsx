import { createContext } from 'react';
import { BootcAPI } from "./BootcAPI";


export const BootcStatusContext = createContext<BootcAPI|undefined>(undefined);
