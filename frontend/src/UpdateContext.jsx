import { createContext, useContext, useEffect, useState } from 'react';
import {IsUpdateAvailable, GetUpdates} from '../wailsjs/go/main/App'
import { useConfig } from './ConfigContext';
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
    const [checkFiles, setCheckFiles] = useState(false)
    
    const UpdateInfo = (path) => {
        setCheckFiles(true)
        GetUpdates(path)
            .then(res => {
                setCheckFiles(false)
                setMissingFilesLoaded(res.MissingFiles.sort((a, b) => a.Path.localeCompare(b.Path)))
                setModifiedFilesLoaded(res.ModifiedFiles.sort((a, b) => a.Path.localeCompare(b.Path)))
                setUpdateSize(formatBytes(getUpdateSize(res.DownloadFiles)))
                setUpdateAvaible(getUpdateSize(res.DownloadFiles) !== 0)
                if (getUpdateSize(res.DownloadFiles) == 0) {
                    setUpdateTab(false)
                }
            })
    }

    useEffect(() => {
        loadConfig().then(config => {
            UpdateInfo(config.path)
            setInterval(() => {
                UpdateInfo(config.path)
            }, 60000);
        })
    }, [])

    return (
        <UpdateContext.Provider value={{isUpdating, setIsUpdating, missingFilesLoaded, setMissingFilesLoaded, modifiedFilesLoaded, setModifiedFilesLoaded, updateSize, setUpdateSize, isUpdateAvailable, UpdateInfo, updateAvaible, setUpdateAvaible, updateTab, setUpdateTab, checkFiles}}>
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