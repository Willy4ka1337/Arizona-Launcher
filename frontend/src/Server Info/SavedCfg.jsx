import xmark from "/Xmark.svg"
import { RemoveSavedStartCfg } from "../../wailsjs/go/main/App"
import { useConfig } from "../ConfigContext"

export default function SavedCfg({cfg, ...props}) {
    const {config, saveConfig, updateConfig} = useConfig()
    return (
        <div className="w-full h-24 flex justify-between items-center p-5 bg-black/30 rounded-xl border border-black/20 hover:border-white/50 hover:cursor-pointer" {...props}>
            <div>
                <p className="text-white text-xl font-bold">{cfg.name}</p>
                <p className="text-white text-sm">{cfg.path}</p>
            </div>
            <div className="flex items-center z-10">
                <img src={xmark} alt="" className="cursor-pointer w-8 h-8 mx-1" onClick={(e) => {
                    e.stopPropagation()
                    RemoveSavedStartCfg(cfg.id)
                    const newCfgs = config.savedStartCfgs.filter(item => item.id !== cfg.id)
                    config.savedStartCfgs = newCfgs
                    saveConfig(config)
                    updateConfig()
                }}/>
            </div>
        </div>
    )
}