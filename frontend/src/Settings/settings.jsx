import { useEffect, useState } from "react"
import { paramsNames } from "../Config"
import { useFolderDialog } from "../hooks/useFolderDialog"
import Toggle from "./toggle"
import { useConfig } from "../ConfigContext"

export default function Settings({ setSettingsTab }) {
    const [path, setpath] = useState("")
    const [nickname, setnickname] = useState("")
    const [paramsKeys, setParamsKeys] = useState([])
    const [paramsValues, setParamsValues] = useState([])
    const { config, saveConfig } = useConfig()

    useEffect(() => {
        const handleClick = (e) => {
            if (e.keyCode == 27) {
                setSettingsTab(false)
            }
        }
        setpath(config.path);
        setnickname(config.name);
        setParamsKeys(Object.keys(config.params));
        setParamsValues(Object.values(config.params));
        
        window.addEventListener('keyup', handleClick);

        return () => {
            window.removeEventListener('keyup', handleClick);
        };
    }, [])
    
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
                            <p className="font-bold text-[30px] text-white z-10">Путь к корневой папке</p>
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
                            <p className="font-bold text-[30px] text-white z-10">Игровой ник</p>
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
                            <p className="font-bold text-[30px] text-white z-10">Параметры запуска</p>
                            <p className="text-white/50 m-0 font-bold text-[12px]">Выберите необходимые параметры запуска</p>
                            <div className="box-border pt-[15px]">
                                {paramsKeys.filter(value => paramsNames[value]).map((value, index) => (
                                    <Toggle 
                                        key={index} 
                                        enabled={paramsValues[index]} 
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
                            <p className="font-bold text-[30px] text-white z-10">Настройки лаунчера</p>
                            <p className="text-white/50 m-0 font-bold text-[12px]">Настройте лаунчер под себя</p>
                            <div className="box-border pt-[15px]">
                                <Toggle enabled={!(config.closeOnStartup)} onChange={(e) => {
                                    config.closeOnStartup = !(e.target.checked)
                                    saveConfig(config)
                                }}>Открытие нескольких окон игры</Toggle>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}