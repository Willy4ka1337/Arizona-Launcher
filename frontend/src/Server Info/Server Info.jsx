import { useEffect, useRef, useState } from "react"
import {PlayBar, startGame} from "./Play Bar"
import { useServers } from "../ServersContext"
import { useConfig } from "../ConfigContext"
import SavedCfg from "./SavedCfg"
import hikka from "/hikka.png"

export default function ServerInfo() {
    const [serverIcon, setServerIcon] = useState("")
    const {servers, selectedServer} = useServers()
    const {config, saveConfig, updateConfig} = useConfig()
    const image = useRef()
    const bg = useRef()
    const server = servers.arizona[selectedServer-1]
    
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

    function rgbToHsl({r, g, b}) {
        r /= 255;
        g /= 255;
        b /= 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            
            h /= 6;
        }

        return {
            h: Math.round(h * 360),
            s: Math.round(s * 100),
            l: Math.round(l * 100)
        };
    }

    function hslToRgb({h, s, l}) {
        h = h % 360 / 360;
        s = s / 100;
        l = l / 100;

        let r, g, b;

        if (s === 0) {
            r = g = b = l;
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;

            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return {
            r: Math.round(r * 255),
            g: Math.round(g * 255),
            b: Math.round(b * 255)
        };
    }

    const setBgColor = async (path) => {
        try {
            let rgb = await window.go.main.App.GetImageColor(path);
            let hsl = rgbToHsl(rgb)
            if (hsl.l > 40) hsl.l = 40
            rgb = hslToRgb(hsl)
            
            if(bg?.current) {
                bg?.current?.style.setProperty("--bg-color", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 1.0)`)
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
        <div className="w-full h-full box-border bg-[#200505] bg-cover bg-center select-none grid grid-rows-[auto_1fr] pt-12 content-between" ref={bg}>
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
                                <p className="font-medium text-xs text-white/70 pl-3">Vice City: {servers.vc[0]?.queue}</p>
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
            <div className="fixed top-0 left-0 w-full flex justify-end">
                <img src={hikka} alt="" draggable={false} className="h-[140vh]"/>
            </div>
        </div>
        </>
    )
}