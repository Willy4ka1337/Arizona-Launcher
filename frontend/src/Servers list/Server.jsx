import { useEffect, useRef } from "react"

const colorCache = new Map()

export default function Server({name, number, icon, selected, online, max_online, password, experienceMultiplier, selectServer}) {
    const sref = useRef()
    const callback = () => selectServer(number)

    useEffect(() => {
        let mounted = true
        if (selected && sref.current) {
            sref.current.parentElement.scrollIntoView({ block: 'nearest' })
        }

        window.go.main.App.GetServerIcon(name).then(path => {
            if (!mounted) return
            if (colorCache.has(path)) {
                return
            }
            window.go.main.App.GetImageColor(path).then(rgb => {
                if (!mounted) return
                colorCache.set(path, rgb)
            }).catch(() => {})
        }).catch(() => {})

        return () => { mounted = false }
    }, [])

    return (
        <div className="pb-2.5">
            <div
                ref={sref}
                onClick={callback}
                className={`box-border pr-2.5 relative rounded-lg ${selected ? 'bg-[linear-gradient(90deg,var(--serverGradientStart)_0%,rgba(0,0,0,0)_90%)]' : 'hover:bg-[linear-gradient(90deg,rgba(48,48,48,0.5)_0%,rgba(0,0,0,0)_90%)]'}`}
            >
                {selected && (
                    <div
                        className="w-1 h-full absolute left-0 top-0"
                        style={{ backgroundColor: 'var(--serverColor)' }}
                    />
                )}

                <div className="flex items-center h-16 py-1.5 pl-3">
                    <img src={icon} alt={name} className="w-8 h-8" />

                    <div className="ml-2.5 w-full flex justify-between items-center">
                        <div className="min-w-0">
                            <p className="font-bold text-xl truncate m-0 leading-5">{name}</p>
                            <div className="flex items-center">
                                <div className="rounded-full w-2.5 h-2.5 mt-0.5 mr-1.5"
                                    style={{ backgroundColor: (online >= 995 || password) ? '#FF2727' : (online >= 900 ? '#DEA140' : '#60DE40') }}
                                />
                                <p className="text-xs" style={{ color: password ? '#FF0000' : '#FFFFFF' }}>{online}/{max_online}</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex w-min self-center relative text-right items-center">
                        {experienceMultiplier > 0 && (
                            <div className="self-center mr-2.5 w-7 h-7 bg-[radial-gradient(circle,#ffc400_0%,#534900_100%)] border-2 border-[#ffc400] rounded-lg flex justify-center items-center text-xs font-semibold">
                                X{experienceMultiplier}
                            </div>
                        )}
                        <p className="font-bold text-base text-white/50">#{number}</p>
                    </div>
                </div>
            </div>
        </div>
    )
}