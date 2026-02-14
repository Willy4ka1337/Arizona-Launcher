import { useEffect, useState } from "react"
import { getStartParams } from "../Config"
import { useConfig } from "../ConfigContext"
import { useUpdate } from "../UpdateContext"

export const startGame = async (server_ip, server_number, name, path, config, saveConfig, updateConfig) => {
    if (server_ip.match(/\.arizona\-rp\.com/)) {
        try {
            const params = await getStartParams(server_ip, name ?? config.name)
            config.selectedServer = server_number
            saveConfig(config)
            setTimeout(() => {
                updateConfig()
            }, 1000);
            await window.go.main.App.StartGame(`${path ?? config.path}\\gta_sa.exe`, params)
            window.runtime.EventsEmit('js:getgamestate')
        } catch (error) {}
    }
}

export function PlayBar({server_ip, server_number}) {
    const [gameStarted, setGameStarted] = useState(false)
    const [playLoader, setPlayLoader] = useState(false)
    const {config, saveConfig, updateConfig} = useConfig()
    const [showtext, setShowtext] = useState(false)
    const [text, setText] = useState("")
    const {updateAvaible, updateTab, setUpdateTab} = useUpdate()
    const buttonText = () => {
        if (gameStarted && config.Launcher.onlyOneWindow) return "Закрыть"
        else return "Играть"
    }

    useEffect(() => {
        if (!window.runtime) return
        window.runtime.EventsOn('go:gamestate', (state) => {
            setPlayLoader(false)
            setGameStarted(state)
        })
        window.runtime.EventsEmit('js:getgamestate')
        return () => {
            if (window.runtime) {
                window.runtime.EventsOff('go:gamestate')
            }
        }
    }, [])

    return (
        <>
            <div className="w-full h-24 box-border px-12 fixed bottom-[5vh]">
                <button className={`border-none bg-transparent text-white font-medium text-base p-0 m-0 mb-5 invisible hover:text-gray-300 ${(updateAvaible || showtext) && 'visible'}`} onClick={() => {
                    if (updateAvaible) setUpdateTab(!updateTab)
                }}>{
                    updateAvaible ? "Доступно обновление!" : text
                }</button>
                <button className="bg-white text-black min-w-44 px-9 h-15 rounded-2xl font-bold text-3xl cursor-pointer flex justify-center items-center hover:bg-gray-200 hover:relative hover:top-0.5" onMouseDownCapture={() => {
                    setPlayLoader(!playLoader)
                    try {
                        startGame(server_ip, server_number, null, null, config, saveConfig, updateConfig)
                    } catch (error) {
                        setPlayLoader(false)
                    }
                }}>{playLoader ? <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div> : <>{buttonText()}</>}</button>
            </div>
        </>
    )
}