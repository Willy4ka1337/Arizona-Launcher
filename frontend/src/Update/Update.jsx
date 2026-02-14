import { useConfig } from "../ConfigContext"
import { useUpdate } from "../UpdateContext"
import xmark from "/Xmark.svg"
import { useEffect, useRef, useState } from "react"

export default function UpdateTab() {
    const [downloadData, setDownloadData] = useState({
        fileDownloading: "",
        filesLoaded: [],
        percentDownloaded: 0.0,
        speed: 0.0,
        totalFiles: 0,
        downloadedFiles: 0,
        totalSize: 0,
        downloadedSize: 0,
    })
    const {isUpdating, setIsUpdating, missingFilesLoaded, modifiedFilesLoaded, updateSize, setUpdateAvaible, updateTab, setUpdateTab, UpdateInfo} = useUpdate()
    const {config} = useConfig()
    const progress = useRef()

    
    async function StartUpdate() {
        try {
            await window.go.main.App.DownloadFiles(config.path)
        } catch (error) {
            console.error(error);
        }
    }

    async function cancelUpdate() {
        try {
            await window.go.main.App.StopDownloads()
        } catch (error) {
            console.error(error);
        }
    }

    function buttonCallback() {
        if (!isUpdating) {
            StartUpdate()
        } else {
            cancelUpdate()
        }
    }

    function formatSpeed(bytes, decimals = 2) {
        if (bytes === 0) return '0 kb/s';
        const k = 1024;
        const sizes = ['kb', 'mb', 'gb', 'tb'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i] + '/s'
    }

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + sizes[i];
    }
    
    useEffect(() => {
        if (!window.runtime) return
        window.runtime.EventsOn('download-progress', (data) => {
            setDownloadData(data)
        })
        window.runtime.EventsOn('download-started', () => {
            setIsUpdating(true)
        })
        window.runtime.EventsOn('download-error', (path, error) => {
            // setIsUpdating(false)
        })
        window.runtime.EventsOn('downloads-stopping', () => {
            // setIsUpdating(false)
        })
        window.runtime.EventsOn("downloads-stopped", () => {
            setIsUpdating(false)
        });
        window.runtime.EventsOn("all-downloads-complete", () => {
            setIsUpdating(false)
            setUpdateTab(false)
            setUpdateAvaible(false)
            UpdateInfo(config.path)
            // isUpdateAvailable(config.path)
            //     .then(res => setUpdateAvaible(res))
        })
        return () => {
            if (window.runtime) {
                window.runtime.EventsOff('download-progress')
                window.runtime.EventsOff('download-started')
                window.runtime.EventsOff('download-error')
                window.runtime.EventsOff('downloads-stopping')
                window.runtime.EventsOff('downloads-stopped')
                window.runtime.EventsOff('all-downloads-complete')
            }
        }
    }, [])

    useEffect(() => {
        if (progress.current) progress.current.style.width = `${downloadData.percentDownloaded}%`
    }, [downloadData.percentDownloaded, isUpdating])

    return (
        <>
        {
            updateTab &&
            <div className="fixed w-full h-full bg-black/40 flex justify-center items-center select-none z-2">
                <div className="w-[70vw] h-[70vh] bg-black/10 rounded-2xl backdrop-blur-2xl border border-white/50 box-border flex flex-wrap">
                    <div className="w-full flex justify-end pr-5 pt-5">
                        <img src={xmark} alt="" className="fixed cursor-pointer" onMouseDownCapture={() => {setUpdateTab(false)}}/>
                    </div>
                    <div className="w-full px-16 pt-9 pb-7">
                        <div>
                            <p className="text-3xl font-bold">{isUpdating ? "Установка обновления" : `Обновление игры на ${updateSize}`}</p>
                            {isUpdating &&
                            <>
                            <div className="w-full h-8 bg-white rounded-2xl mt-5 overflow-hidden flex relative">
                                <div className="w-0 h-full bg-neutral-400" ref={progress}></div>
                                <div className="absolute w-full h-8 px-6 flex justify-between items-center text-black text-base font-bold">
                                    <p>Загрузка: {downloadData.fileDownloading}</p>
                                    <div className="flex">
                                        <span className="mr-5">{`${formatBytes(downloadData.downloadedSize)}/${formatBytes(downloadData.totalSize)}`}</span>
                                        <span>{downloadData.percentDownloaded.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-full flex justify-center text-sm mt-1">{formatSpeed(downloadData.speed)}</div>
                            </>
                            }
                        </div>
                        {isUpdating ? <>
                        <div className="my-5">
                            <p className="text-xl font-bold">Установленно:</p>
                            <div className="mt-2 h-[27vh] overflow-y-scroll [&::-webkit-scrollbar]:hidden">
                                {downloadData?.filesLoaded?.map((file, i) => (
                                    <p className="text-base font-medium text-white/60" key={i}>{file}</p>
                                ))}
                            </div>
                        </div>
                        </> : <>
                        <div className="flex gap-10 justify-center">
                            <div className="mt-5 overflow-x-hidden">
                                <p className="text-xl font-bold">Новые файлы:</p>
                                <div className="mt-2 h-72 overflow-y-scroll [&::-webkit-scrollbar]:hidden">
                                    {missingFilesLoaded?.map((file, i) => (
                                        <p className="text-base font-medium text-white/60" key={i}>{file.Path}</p>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-5 overflow-x-hidden">
                                <p className="text-xl font-bold">Измененные файлы:</p>
                                <div className="mt-2 h-[37vh] overflow-y-scroll [&::-webkit-scrollbar]:hidden">
                                    {modifiedFilesLoaded?.map((file, i) => (
                                        <p className="text-base font-medium text-white/60" key={i}>{file.Path}</p>
                                    ))}
                                </div>
                            </div>
                        </div>
                        </>}
                        <button className="bg-white text-black w-45 h-13 rounded-2xl text-2xl font-bold hover:relative hover:top-0.5 hover:bg-gray-200 cursor-pointer" onClick={buttonCallback}>{isUpdating ? "Отмена" : "Установить"}</button>
                    </div>
                </div>
            </div>
        }
        </>
    )
}