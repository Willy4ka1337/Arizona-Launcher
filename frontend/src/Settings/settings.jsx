import { useEffect, useState } from "react"
import { paramsNames, launcherNames } from "../Config"
import { useFolderDialog } from "../hooks/useFolderDialog"
import Toggle from "./toggle"
import { useConfig } from "../ConfigContext"
import { useTheme } from "../ThemeContext"
import { setStyleColors } from "../main"
import { useUpdate } from "../UpdateContext"
import { CDNSettings } from "./cdn"

export default function Settings({ setSettingsTab }) {
    const [path, setpath] = useState("")
    const [nickname, setnickname] = useState("")
    const [paramsKeys, setParamsKeys] = useState([])
    const [launcherKeys, setLauncherKeys] = useState([])
    const { config, saveConfig } = useConfig()
    const { styles } = useTheme()
    const [selectedOption, setSelectedOption] = useState(config.Launcher.SelectedStyle) //styles[config.Launcher.SelectedStyle]?.name
    const [selectedCDN1, setSelectedCDN1] = useState(config.Launcher.CDN.Resources)
    const [selectedCDN2, setSelectedCDN2] = useState(config.Launcher.CDN.Sounds)
    const [selectedCDN3, setSelectedCDN3] = useState(config.Launcher.CDN.ServerApi)
    const [autoCDN, setAutoCDN] = useState(config.Launcher.AutoCDN)
    const [checkUpdateText, setCheckUpdateText] = useState("Проверить файлы игры")
    const [playLoader, setPlayLoader] = useState(false)
    const { UpdateInfo } = useUpdate()

    useEffect(() => {
        const handleClick = (e) => {
            if (e.keyCode == 27) {
                setSettingsTab(false)
            }
        }
        setpath(config.path);
        setnickname(config.name);
        setParamsKeys(Object.keys(config.params));
        setLauncherKeys(Object.keys(config.Launcher));
        
        window.addEventListener('keyup', handleClick);

        return () => {
            window.removeEventListener('keyup', handleClick);
        };
    }, [config, styles, setSettingsTab])
    
    const { openFolderDialog } = useFolderDialog();
    const handleSelectFolder = async () => {
        setTimeout(() => {
            openFolderDialog(config.path)
                .then(path => {
                    if (path) {
                        setpath(path);
                        config.path = path
                        saveConfig(config)
                    }
                })
        }, 100);
    }

    return (
        <div className="w-full h-full p-[50px_0_0_50px] box-border select-none">
            <div className="w-full h-full pr-[50px] box-border pb-[50px] overflow-y-scroll">
                <p className="font-bold text-[36px] text-white">Настройки</p>
                <div className="mt-[50px] flex flex-wrap justify-between w-full">
                    <div className="w-xl space-y-12">
                        <div>
                            <p className="font-bold text-3xl text-white z-10">Путь к корневой папке</p>
                            <p className="text-white/50 m-0 font-bold text-[12px]">Укажите путь к корневой папке, в которую будет установлена игра</p>
                            <div className="flex mt-5">
                                <input
                                    type="text" 
                                    className="w-[450px] h-[50px] bg-[#202020] border-none outline-none px-5 text-white font-sans font-semibold text-base flex items-center box-border rounded-xl cursor-pointer"
                                    readOnly 
                                    value={path}
                                    onMouseDownCapture={handleSelectFolder}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-3xl text-white z-10">Игровой ник</p>
                            <p className="text-white/50 m-0 font-bold text-[12px]">Укажите игровой ник, который будет использоваться на сервере</p>
                            <div className="flex items-center mt-5">
                                <input 
                                    type="text" 
                                    className="w-[450px] h-[50px] bg-[#202020] border-none outline-none px-5 text-white font-sans font-semibold text-base flex items-center box-border rounded-xl" 
                                    value={nickname} 
                                    onChange={(e) => {
                                        setnickname(e.target.value)
                                        config.name = e.target.value
                                        saveConfig(config)
                                    }}
                                />
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-3xl text-white z-10">Параметры запуска</p>
                            <p className="text-white/50 m-0 font-bold text-[12px]">Выберите необходимые параметры запуска</p>
                            <div className="box-border pt-[15px]">
                                {paramsKeys.filter(value => paramsNames[value]).map((value, index) => (
                                    <Toggle 
                                        key={index} 
                                        enabled={config.params[value]}
                                        onChange={(e) => {
                                            config.params[value] = e.target.checked
                                            saveConfig(config)
                                        }}
                                    >
                                        {paramsNames[value]}
                                    </Toggle>
                                ))}
                            </div>
                        </div>
                        <div>
                            <p className="font-bold text-3xl text-white z-10">Настройки лаунчера</p>
                            <p className="text-white/50 m-0 font-bold text-[12px]">Настройте лаунчер под себя</p>
                            <div className="box-border pt-[15px]">
                                {launcherKeys.filter(value => launcherNames[value]).map((value, index) => (
                                    <Toggle 
                                        key={index}
                                        enabled={config.Launcher[value]}
                                        onChange={(e) => {
                                            config.Launcher[value] = e.target.checked
                                            saveConfig(config)
                                            if (value == "AutoCDN") {
                                                setAutoCDN(e.target.checked)
                                            }
                                        }}
                                    >
                                        {launcherNames[value]}
                                    </Toggle>
                                ))}
                                {
                                    !autoCDN &&
                                    <div className="mt-10">
                                        <p className="font-bold text-xl text-white z-10">Выбор CDN серверов</p>
                                        <div className="pt-3 w-3xs space-y-2">
                                            <CDNSettings
                                                title={"Ресурсы"}
                                                value={selectedCDN1}
                                                name={"Resources"}
                                                onChange={(e) => {
                                                    setSelectedCDN1(e.target.value)
                                                    config.Launcher.CDN.Resources = parseInt(e.target.value)
                                                    saveConfig(config)
                                                }}
                                            />
                                            <CDNSettings
                                                title={"Звуки"}
                                                value={selectedCDN2}
                                                name={"Sounds"}
                                                onChange={(e) => {
                                                    setSelectedCDN2(e.target.value)
                                                    config.Launcher.CDN.Sounds = parseInt(e.target.value)
                                                    saveConfig(config)
                                                }}
                                            />
                                            <CDNSettings
                                                title={"Server API"}
                                                value={selectedCDN3}
                                                name={"ServerApi"}
                                                onChange={(e) => {
                                                    setSelectedCDN3(e.target.value)
                                                    config.Launcher.CDN.ServerApi = parseInt(e.target.value)
                                                    saveConfig(config)
                                                }}
                                            />
                                        </div>
                                    </div>
                                }
                                <div className="mt-10">
                                    <p className="font-bold text-xl text-white z-10">Стиль оформления лаунчера</p>
                                    <div className="w-40 pt-3">
                                        <div className="w-full bg-neutral-800 rounded-xl px-4 py-2 flex">
                                            <select style={{ color: styles[config.Launcher.SelectedStyle].serverColor }} name="launcherstyle" id="launcherstyle" value={selectedOption} onChange={(e) => {
                                                setSelectedOption(e.target.value);
                                                config.Launcher.SelectedStyle = parseInt(e.target.value);
                                                setStyleColors({
                                                    bg: styles[config.Launcher.SelectedStyle].backgroundColor,
                                                    server: styles[config.Launcher.SelectedStyle].serverColor,
                                                    gradient: styles[config.Launcher.SelectedStyle].serverGradientStart,
                                                })
                                                saveConfig(config);
                                            }} className="bg-neutral-800 w-full h-8 outline-0 rounded-xl px-4">
                                                {styles.map((el, i) => (
                                                    <option key={i} value={el.id}
                                                    style={{ color: el.serverColor }}>
                                                        {el.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                                <button className="bg-white text-black min-w-80 px-6 h-14 text-2xl flex justify-center items-center rounded-2xl mt-10 font-bold cursor-pointer hover:bg-gray-200 hover:relative hover:top-0.5"
                                onMouseDownCapture={() => {
                                    if (playLoader) return
                                    setPlayLoader(true)
                                    UpdateInfo(config.path)
                                    setTimeout(() => {
                                        setPlayLoader(false)
                                    }, 20000);
                                }}>{
                                    playLoader ? <div className="w-4 h-4 border-2 border-gray-300 border-t-black rounded-full animate-spin"></div> : checkUpdateText
                                }</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}