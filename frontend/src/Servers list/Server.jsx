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
                className={`box-border pr-2.5 relative ${selected && "bg-[linear-gradient(90deg,rgba(100,100,100,0.5)_0%,rgba(0,0,0,0)_90%)]"}`}
                onClick={callback}>
                {selected && <div className="w-1 h-full bg-[rgba(100,100,100,1)] absolute"></div>}
                <div className="flex items-center h-16 py-1.5 pl-3">
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
                            <div className="self-center mr-2.5 w-7 h-7 bg-[radial-gradient(circle,#ffc400_0%,#534900_100%)] border-2 border-[#ffc400] rounded-lg flex justify-center items-center text-xs font-semibold">
                                X{experienceMultiplier}
                            </div>
                        </>}
                        <p className={classes.serverNumber}>#{number}</p>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}