import { useEffect, useRef } from "react"
import classes from "./style.module.css"

export default function Server({name, number, icon, selected, online, max_online, password, experienceMultiplier, selectServer}) {
    const sref = useRef()
    const callback = () => {
        selectServer(number)
    }
    useEffect(() => {
        if (selected) {
            if(sref.current) {
                sref.current.parentElement.scrollIntoView({
                    block: 'nearest'
                })
            }
        }
    }, [])
    return (
        <>
        <div className={classes.serverWrapper}>
            <div ref={sref}
                className={
                        selected
                        ? `${classes.server} ${classes.serverSelected}`
                        : classes.server
                    }
                onClick={callback}>
                <img src={icon} alt={name} className={classes.serverIcon}/>
                <div className={classes.serverInfo}>
                    <div>
                        <p className={classes.serverName}>{name}</p>
                        <div className={classes.serverOnlineInfo}>
                            <div className={classes.circle} style={{ backgroundColor: ((online >= 995 || password) ? "#FF2727" : (online >= 900 ? "#DEA140" : "#60DE40")) }}></div>
                            <p className={classes.serverOnline} style={{ color: password ? "#FF0000" : "#FFFFFF"}}>{online}/{max_online}</p>
                        </div>
                    </div>
                </div>
                <div className={classes.serverNumberDiv}>
                    {experienceMultiplier > 0 && <>
                        <div className={classes.serverPromotion}>
                            X{experienceMultiplier}
                        </div>
                    </>}
                    <p className={classes.serverNumber}>#{number}</p>
                </div>
            </div>
        </div>
        </>
    )
}