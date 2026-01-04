import { createContext, useContext, useEffect, useState } from 'react';
import { loadConfig, saveCfg } from './Config';

export const ConfigContext = createContext()

export function ConfigProvider({ children }) {
    const [config, setConfig] = useState({})
    const saveConfig = (cfg) => {
        setConfig(cfg)
        saveCfg(cfg)
    }
    useEffect(() => {
        loadConfig().then(cfg => {
            setConfig(cfg)
        })
    })

    return (
        <ConfigContext.Provider value={{config, saveConfig}}>
            {children}
        </ConfigContext.Provider>
    )
}

export function useConfig() {
    const context = useContext(ConfigContext)
    if (!context) {
        throw new Error('useConfig must be used within a ConfigProvider')
    }
    return context
}