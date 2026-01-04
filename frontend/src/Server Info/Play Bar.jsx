import { useEffect, useState } from "react"
import classes from "./play.module.css"
import { getStartParams } from "../Config"
import { useConfig } from "../ConfigContext"
import { useUpdate } from "../UpdateContext"

export default function PlayBar({server_ip, server_number}) {
    const [gameStarted, setGameStarted] = useState(false)
    const [playLoader, setPlayLoader] = useState(false)
    const {config, saveConfig} = useConfig()
    const {isUpdateAvailable, updateAvaible, setUpdateAvaible, updateTab, setUpdateTab, UpdateInfo} = useUpdate()

    const startGame = async () => {
        if (playLoader) return
        if (server_ip.match(/\.arizona\-rp\.com/)) {
            try {
                setPlayLoader(!playLoader)
                const params = await getStartParams(server_ip)
                config.selectedServer = server_number
                saveConfig(config)
                
                await window.go.main.App.StartGame(`${config.path}\\gta_sa.exe`, params)
                window.runtime.EventsEmit('js:getgamestate')
            } catch (error) {
                console.error("error start game", error);
            }
        }
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

    useEffect(() => {
        isUpdateAvailable(config.path)
            .then(res => {
                setUpdateAvaible(res)
                if (res) {
                    UpdateInfo(config.path)
                }
            })
        setInterval(() => {
            isUpdateAvailable(config.path)
                .then(res => {
                    setUpdateAvaible(res)
                    if (res) {
                        UpdateInfo(config.path)
                    }
                })
        }, 5000);
    }, [])

    return (
        <>
            <div className={classes.mainBar}>
                <button className={`${classes.updateAvaible} ${updateAvaible ? classes.showUpdate : ""}`} onClick={() => {setUpdateTab(!updateTab)}}>Доступно обновление!</button>
                <button className={classes.playButton} onMouseDownCapture={startGame}>{playLoader ? <div className={classes.loader}></div> : <>{(gameStarted && config.closeOnStartup) ? "Закрыть" : "Играть"}</>}</button>
            </div>
        </>
    )
}