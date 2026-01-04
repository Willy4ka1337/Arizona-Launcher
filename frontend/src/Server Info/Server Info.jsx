import classes from "./style.module.css"
import { useEffect, useRef, useState } from "react"
import PlayBar from "./Play Bar"

export default function ServerInfo({servers, selectedServer}) {
    const [serverIcon, setServerIcon] = useState("")
    const image = useRef()
    const bg = useRef()
    const server = servers[selectedServer-1]    

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
            <div className={classes.mainServerWindow} ref={bg}>
                <div className={classes.serverInfo}>
                    <img src={server?.icon} alt="logo" ref={image} className={classes.serverIcon}/>
                    <div className={classes.serverInfot}>
                        <div className={classes.serverNameDiv}>
                            <p className={classes.serverName}>{server?.name}</p>
                        </div>
                        <div className={classes.serverOnlineDiv}>
                            <div className={classes.circle} style={{ backgroundColor: ((server?.online >= 995 || server?.password) ? "#FF2727" : (server?.online >= 900 ? "#DEA140" : "#60DE40")) }}></div>
                            <div className={classes.serverOnlineDiv1}>
                                <p className={classes.serverOnline} style={{ color: server?.password ? "#FF0000" : "#FFFFFF"}}>{server?.online}</p>
                                <p className={classes.serverOnlineMax} style={{ color: server?.password ? "#FF0000" : "rgba(255, 255, 255, 0.5)"}}>/{server?.maxplayers}</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div>
                    <div className={classes.serverInformation}>
                        <div className={classes.upsideGradient}></div>
                    </div>
                    <PlayBar server_ip={server?.ip} server_number={server?.number}/>
                </div>
            </div>
        </>
    )
}