import { useEffect, useRef, useState } from "react"
import {PlayBar, startGame} from "./Play Bar"
import { useServers } from "../ServersContext"
import { useConfig } from "../ConfigContext"
import SavedCfg from "./SavedCfg"
import { useTheme } from "../ThemeContext"

export default function ServerInfo() {
    const {servers, selectedServer} = useServers()
    const {config, saveConfig, updateConfig} = useConfig()
    const image = useRef()
    const bg = useRef()
    const server = servers?.arizona?.[selectedServer-1 || 0]
    const {styles} = useTheme();
    const [fgImg, setFgImg] = useState("")
    const [bgImg, setBgImg] = useState("")

    useEffect(() => {
        window.go.main.App.GetStyleFile(styles[config.Launcher.SelectedStyle]?.foregroundImage)
            .then(res => {
                setFgImg(`data:image/png;base64,${res}`);
            })
        window.go.main.App.GetStyleFile(styles[config.Launcher.SelectedStyle]?.backgroundImage)
            .then(res => {
                setBgImg(`data:image/png;base64,${res}`);
            })
            .catch(err => console.error('Ошибка:', err));
    }, [config.Launcher.SelectedStyle])

    return (
        <>
        <div className="w-full h-full box-border bg-(--background-color) bg-cover bg-center select-none grid grid-rows-[auto_1fr] pt-12 content-between" ref={bg}>
            <div className="z-2">
                <div className="box-border ml-12 flex">
                    <img src={server?.icon} alt="logo" ref={image} className="w-16 h-16"/>
                    <div className="ml-2.5 content-around">
                        <div className="flex">
                            <p className="font-bold text-4xl m-0 leading-none mb-1.25">{server?.name}</p>
                        </div>
                        <div className="flex items-center mt-1">
                            <div className="rounded-full w-3 h-3 mr-1.25" style={{ backgroundColor: ((server?.online >= 995 || server?.password) ? "#FF2727" : (server?.online >= 900 ? "#DEA140" : "#60DE40")) }}></div>
                            <div className="flex items-end">
                                <p className="font-bold text-base m-0 leading-none">{server?.online}</p>
                                <p className="font-medium text-xs text-white/70">/{server?.maxplayers}</p>
                                <p className="font-medium text-xs text-white/70 pl-3">Очередь: {server?.queue}</p>
                                <p className="font-medium text-xs text-white/70 pl-3">Vice City: {servers?.vc?.[0]?.queue}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className="mt-8 w-full h-[62vh] from-transparent via-transparent px-10 py-7 space-y-5 overflow-y-scroll [&::-webkit-scrollbar]:hidden">
                        {config.savedStartCfgs?.map((cfg, i) => (
                            <SavedCfg cfg={cfg} key={i} onClick={() => {
                                startGame(server?.ip, server?.number, cfg.name, cfg.path, config, saveConfig, updateConfig)
                            }}/>
                        ))}
                    </div>
                    <PlayBar server_ip={server?.ip} server_number={server?.number}/>
                </div>
            </div>
            {
                (styles.length > 0 && config.Launcher.ShowBackgroundImage &&
                    <div className="fixed top-0 left-0 w-full flex justify-end">
                        <img src={bgImg} alt="" draggable={false} className="h-screen"/>
                    </div>
                )
            }
            {
                (styles.length > 0 && config.Launcher.ShowForegroundImage &&
                    <div className="fixed top-0 left-0 w-full flex justify-end">
                        <img src={fgImg} alt="" draggable={false} className="h-screen"/>
                    </div>
                )
            }
        </div>
        </>
    )
}