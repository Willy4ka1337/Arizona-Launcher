import Servers from './Servers list/Servers';
import ServerInfo from './Server Info/Server Info';
import Settings from './Settings/settings'
import { useEffect, useState } from 'react';
import classes from "./style.module.css"
import xmark from "/Xmark.svg"
import minus from "/Minus.svg"
import settings from "/Settings.svg"
import Angle from "/AngleDown.svg"
import { loadConfig } from './Config';
import { ConfigProvider } from './ConfigContext';
import UpdateTab from './Update/Update';
import { UpdateProvider } from './UpdateContext';

function App() {
    const [settingsTab, setSettingsTab] = useState(false)
    const [servers, setServers] = useState([])
    const [selectedServer, setSelectedServer] = useState()
    const [loaded, setLoaded] = useState(false)
    
    const updateArizonaInfo = () => {
        fetch("https://api.arizona-five.com/launcher/servers")
            .then((res) => res.json())
                .then((res) => {
                    res.arizona.sort((a, b) => a.number - b.number)
                    setServers(res.arizona)
                    setLoaded(true)
                })
    }

    useEffect(() => {
        loadConfig().then(cfg => {
            setSelectedServer(cfg.selectedServer)
        })
        updateArizonaInfo()
        setInterval(() => {
            updateArizonaInfo()
        }, 5000);
    }, [])

    const handleMinimize = async () => {
        try {
            await window.go.main.App.MinimizeWindow();
        } catch (error) {
            console.error('Error minimizing window:', error);
        }
    };

    const handleClose = async () => {
        try {
            await window.go.main.App.CloseWindow();
        } catch (error) {
            console.error('Error closing window:', error);
        }
    };

    return (
        <>
            <ConfigProvider>
                <UpdateProvider>
                    <div className="h-screen">
                        <div className={classes.windowHeader}>
                            <div className={classes.windowControls}>
                                {!settingsTab ? <>
                                    <img src={settings} alt="" className={`${classes.headerIcon} ${classes.settingsButton}`} onMouseDownCapture={() => {setSettingsTab(!settingsTab)}}/>
                                </> : <>
                                    <img src={Angle} alt="" className={`${classes.headerIcon} ${classes.anglebutton}`} onMouseDownCapture={() => {setSettingsTab(!settingsTab)}}/>
                                </>}
                                <img src={minus}    alt="" className={classes.headerIcon} onMouseDownCapture={handleMinimize}/>
                                <img src={xmark}    alt="" className={classes.headerIcon} onMouseDownCapture={handleClose}/>
                            </div>
                        </div>
                        {loaded ? <>
                        <div className={classes.main}>
                            {settingsTab ? <Settings setSettingsTab={setSettingsTab}/> : <>
                                <Servers
                                    servers={servers}
                                    selectedServer = {selectedServer}
                                    setSelectedServer = {setSelectedServer}
                                />
                                <ServerInfo
                                    servers={servers}
                                    selectedServer = {selectedServer}
                                />
                                <UpdateTab/>
                            </>}
                        </div>
                        </> : <>
                        <div className={classes.loaderWrapper}>
                            <div className={classes.loader}></div>
                        </div>
                        </>}
                    </div>
                </UpdateProvider>
            </ConfigProvider>
        </>
    );
}

export default App;