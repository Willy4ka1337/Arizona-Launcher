import classes from "./style.module.css"
import exclamation from "/exclamation.svg"
import { useEffect, useState } from "react"
import { paramsNames } from "../Config"
import { useFolderDialog } from "../hooks/useFolderDialog"
import Toggle from "./toggle"
import { useConfig } from "../ConfigContext"

export default function Settings({setSettingsTab}) {
    const [path, setpath] = useState("")
    const [nickname, setnickname] = useState("")
    const [paramsKeys, setParamsKeys] = useState([])
    const [paramsValues, setParamsValues] = useState([])
    const {config, saveConfig} = useConfig()

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
        <>
        <div className={classes.main}>
            <div className={classes.settingsWrapper}>
                <p className={classes.textHeader0}>Настройки</p>
                <div className={classes.gameSettingsWrapper}>
                    <div className={classes.settingsColumn}>
                        <div>
                            <p className={classes.textHeader}>Путь к корневой папке</p>
                            <p className={classes.textDisabled}>Укажите путь к корневой папке, в которую будет установлена игра</p>
                            <div className={classes.gamefolderWrapper}>
                                <input type="text" className={`${classes.cinput} ${classes.gamefolderInput1}`} readOnly value={path} onMouseDownCapture={handleSelectFolder}/>
                            </div>
                        </div>
                        <div style={{marginTop: "50px"}}>
                            <p className={classes.textHeader}>Игровой ник</p>
                            <p className={classes.textDisabled}>Укажите игровой ник, который будет использоваться на сервере</p>
                            <div className={classes.nicknameWrapper}>
                                <input type="text" className={`${classes.cinput} ${classes.nicknameInput}`} value={nickname} onChange={(e) => {
                                    setnickname(e.target.value)
                                    config.name = e.target.value
                                    saveConfig(config)
                                }}/>
                            </div>
                        </div>
                        <div style={{marginTop: "50px"}}>
                            <p className={classes.textHeader}>Параметры запуска</p>
                            <p className={classes.textDisabled}>Выберите необходимые параметры запуска</p>
                            <div className={classes.gamestartWrapper}>
                                {paramsKeys.filter(value => paramsNames[value]).map((value, index) => (
                                    <Toggle key={index} enabled={paramsValues[index]} onChange={(e) => {
                                        config.params[value] = e.target.checked
                                        saveConfig(config)
                                    }}>{paramsNames[value]}</Toggle>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}