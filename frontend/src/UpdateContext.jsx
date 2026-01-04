import { createContext, useContext, useEffect, useState } from 'react';
import {IsUpdateAvailable, GetMissingFiles, GetModifiedFiles, GetUpdates} from '../wailsjs/go/main/App'
import { loadConfig } from './Config';

export const UpdateContext = createContext()

async function isUpdateAvailable(directory) {
    try {
        return IsUpdateAvailable(directory)
    } catch (error) {
        console.error(error);
        return false
    }
}

function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

function getUpdateSize(files) {
    let result = 0
    files.forEach((file) => {
        result += file.Size
    })
    return result
}

export function UpdateProvider({ children }) {
    const [isUpdating, setIsUpdating] = useState(false)
    const [missingFilesLoaded, setMissingFilesLoaded] = useState([])
    const [modifiedFilesLoaded, setModifiedFilesLoaded] = useState([])
    const [updateSize, setUpdateSize] = useState("")
    const [updateAvaible, setUpdateAvaible] = useState(false)
    const [updateTab, setUpdateTab] = useState(false)
    
    const UpdateInfo = (path) => {
        GetUpdates(path)
            .then(res => {
                setMissingFilesLoaded(res.MissingFiles)
                setModifiedFilesLoaded(res.ModifiedFiles)
                setUpdateSize(formatBytes(getUpdateSize(res.DownloadFiles)))
                if (getUpdateSize(res.DownloadFiles) == 0) {
                    setUpdateTab(false)
                }
            })
    }

    useEffect(() => {
        loadConfig().then(config => {
            UpdateInfo(config.path)
        })
        setInterval(() => {
            loadConfig().then(config => {
                UpdateInfo(config.path)
            })
        }, 5000);
    }, [])

    return (
        <UpdateContext.Provider value={{isUpdating, setIsUpdating, missingFilesLoaded, setMissingFilesLoaded, modifiedFilesLoaded, setModifiedFilesLoaded, updateSize, setUpdateSize, isUpdateAvailable, UpdateInfo, updateAvaible, setUpdateAvaible, updateTab, setUpdateTab}}>
            {children}
        </UpdateContext.Provider>
    )
}

export function useUpdate() {
    const context = useContext(UpdateContext)
    if (!context) {
        throw new Error('useUpdate must be used within a UpdateProvider')
    }
    return context
}