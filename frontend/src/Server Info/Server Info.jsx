import { useEffect, useRef, useState } from "react"
import {PlayBar, startGame} from "./Play Bar"
import { useServers } from "../ServersContext"
import { useConfig } from "../ConfigContext"
import SavedCfg from "./SavedCfg"

export default function ServerInfo() {
    const [serverIcon, setServerIcon] = useState("")
    const {servers, selectedServer} = useServers()
    const {config, saveConfig, updateConfig} = useConfig()
    const image = useRef()
    const bg = useRef()
    const server = servers.arizona[selectedServer-1]
    
    useEffect(() => {
        setBgColor(serverIcon)
    }, [serverIcon])

    const setSrvIcon = async (name) => {
        try {
            const icon_path = await window.go.main.App.GetServerIcon(name);
            setServerIcon(icon_path)
        } catch (error) {
            console.error('Error loading window state:', error);
        }
    };

    const setBgColor = async (path) => {
        try {
            let result = await window.go.main.App.GetImageColor(path);
            if(bg?.current) {
                bg?.current?.style.setProperty("--bg-color", `rgba(${result.r}, ${result.g}, ${result.b}, 1.0)`)
            }
        } catch (error) {
            console.error('Error loading window state:', error);
        }
    };

    useEffect(() => {
        if (server?.name.length > 0) setSrvIcon(server?.name)
    }, [server])

    return (
        <>
            {server && (
            <div className="w-full box-border bg-(--bg-color) bg-cover bg-center select-none grid grid-rows-[auto_1fr] pt-12" ref={bg}>
                <div className="box-border ml-12 flex">
                    <img src={server?.icon} alt="logo" ref={image} className="w-16 h-16"/>
                    <div className="ml-2.5 content-around">
                        <div className="flex">
                            <p className="font-bold text-4xl m-0 leading-none mb-1.25">{server?.name}</p>
                        </div>
                        <div className="flex items-center">
                            <div className="rounded-full w-3 h-3 mr-1.25" style={{ backgroundColor: ((server?.online >= 995 || server?.password) ? "#FF2727" : (server?.online >= 900 ? "#DEA140" : "#60DE40")) }}></div>
                            <div className="flex items-end">
                                <p className="font-bold text-base m-0 leading-none">{server?.online}</p>
                                <p className="font-medium text-xs text-white/50">/{server?.maxplayers}</p>
                                <p className="font-medium text-xs text-white/50 pl-3">Очередь: {server?.queue}</p>
                                <p className="font-medium text-xs text-white/50 pl-3">Vice City: {servers.vc[0]?.queue}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="bg-black/45 h-full mt-12">
                        <div className="w-full h-full bg-linear-to-b from-transparent via-transparent to-black px-10 py-7 space-y-5">
                            {config.savedStartCfgs?.map((cfg, i) => (
                                <SavedCfg cfg={cfg} key={i} onClick={() => {
                                    startGame(server?.ip, server?.number, cfg.name, cfg.path, config, saveConfig, updateConfig)
                                }}/>
                            ))}
                        </div>
                    </div>
                    <PlayBar server_ip={server?.ip} server_number={server?.number}/>
                </div>
            </div>
            )}
        </>
    )
}