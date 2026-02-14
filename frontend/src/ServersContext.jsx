import { createContext, useContext, useEffect, useState } from 'react';
import { loadConfig } from './Config';

const ServersContext = createContext()

export function ServersProvider({ setLoaded, children }) {
    const [servers, setServers] = useState([])
    const [selectedServer, setSelectedServer] = useState(1)
    const updateArizonaInfo = () => {
        fetch("https://api.arizona-five.com/launcher/servers")
            .then((res) => res.json())
                .then((res) => {
                    Object.keys(res).forEach(key => {
                        res[key].sort((a, b) => a.number - b.number)
                    })
                    setServers(res)
                    setLoaded(true)
                })
    }

    useEffect(() => {
        let intervalId;
        loadConfig().then(config => {
            setSelectedServer(config.selectedServer ?? 1)
        })
        updateArizonaInfo()
        intervalId = setInterval(() => {
            updateArizonaInfo()
        }, 5000);

        return () => {
            if (intervalId) clearInterval(intervalId)
        }
    }, [])

    return (
        <ServersContext.Provider value={{servers, selectedServer, setSelectedServer}}>
            {children}
        </ServersContext.Provider>
    )
}

export function useServers() {
    const context = useContext(ServersContext)
    if (!context) {
        throw new Error('useServers must be used within a ServersProvider')
    }
    return context
}