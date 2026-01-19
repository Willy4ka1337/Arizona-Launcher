import { useEffect, useState } from "react"
import classes from "./play.module.css"
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
    const {updateAvaible, updateTab, setUpdateTab, UpdateInfo} = useUpdate()
    const buttonText = () => {
        if (gameStarted && config.closeOnStartup) return "Закрыть"
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
            <div className={classes.mainBar}>
                <button className={`${classes.updateAvaible} ${updateAvaible ? classes.showUpdate : ""}`} onClick={() => {setUpdateTab(!updateTab)}}>Доступно обновление!</button>
                <button className={classes.playButton} onMouseDownCapture={() => {
                    setPlayLoader(!playLoader)
                    try {
                        startGame(server_ip, server_number, null, null, config, saveConfig, updateConfig)
                    } catch (error) {
                        setPlayLoader(false)
                        UpdateInfo(config.path)
                    }
                }}>{playLoader ? <div className={classes.loader}></div> : <>{buttonText()}</>}</button>
            </div>
        </>
    )
}