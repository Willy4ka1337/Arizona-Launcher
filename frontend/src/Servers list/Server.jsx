import { useEffect, useRef, useState } from "react"
import classes from "./style.module.css"

export default function Server({name, number, icon, selected, online, max_online, password, experienceMultiplier, selectServer}) {
    const [color, setColor] = useState({r: 100, g: 100, b: 100})
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
        window.go.main.App.GetServerIcon(name).then(path => {
            window.go.main.App.GetImageColor(path).then(rgb => {
                setColor(rgb)
            })
        })
    }, [])
    return (
        <>
        <div className={classes.serverWrapper}>
            <div ref={sref}
                className={`box-border pr-2.5 relative ${selected && `bg-[linear-gradient(90deg,rgba(139,0,0,0.5)_0%,rgba(0,0,0,0)_90%)]`}`}
                onClick={callback}
                // style={selected ? {
                //     background: `linear-gradient(90deg, rgba(${color.r}, ${color.g}, ${color.b}, 0.5) 0%, rgba(0, 0, 0, 0) 90%)`
                // } : {}}
                >
                {selected && <div className="w-1 h-full absolute bg-red-900"
                // style={{
                //     background: `rgb(${color.r}, ${color.g}, ${color.b})`
                // }}
                ></div>}
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