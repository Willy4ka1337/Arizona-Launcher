import Servers from './Servers list/Servers';
import ServerInfo from './Server Info/Server Info';
import Settings from './Settings/settings'
import { useState } from 'react';
import classes from "./style.module.css"
import xmark from "/Xmark.svg"
import minus from "/Minus.svg"
import settings from "/Settings.svg"
import Angle from "/AngleDown.svg"
import UpdateTab from './Update/Update';
import { ConfigProvider } from './ConfigContext';
import { UpdateProvider } from './UpdateContext';
import { ServersProvider } from './ServersContext';

function App() {
    const [settingsTab, setSettingsTab] = useState(false)
    const [loaded, setLoaded] = useState(false)

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
                    <ServersProvider setLoaded={setLoaded}>
                        <div className="h-screen">
                            <div className="z-11 absolute top-0 left-[300px] w-[calc(100%-300px)] py-2.5 pr-4 box-border user-select-none justify-items-end [widows:1]">
                                <div className="flex">
                                    {!settingsTab ? (
                                        <img src={settings} alt="" className="cursor-pointer w-8 h-8 mx-1 transition-transform duration-700 ease-in-out hover:rotate-360" onMouseDownCapture={() => {setSettingsTab(!settingsTab)}}/>
                                    ) : (
                                        <img src={Angle} alt="" className="cursor-pointer w-8 h-8 mx-1 rotate-90" onMouseDownCapture={() => {setSettingsTab(!settingsTab)}}/>
                                    )}
                                    <img src={minus} alt="" className="cursor-pointer w-8 h-8 mx-1" onMouseDownCapture={handleMinimize}/>
                                    <img src={xmark} alt="" className="cursor-pointer w-8 h-8 mx-1" onMouseDownCapture={handleClose}/>
                                </div>
                            </div>
                            {loaded ? <>
                            <div className="flex h-screen">
                                {settingsTab ? <Settings setSettingsTab={setSettingsTab}/> : <>
                                    <Servers/>
                                    <ServerInfo/>
                                    <UpdateTab/>
                                </>}
                            </div>
                            </> : <>
                            <div className={classes.loaderWrapper}>
                                <div className={classes.loader}></div>
                            </div>
                            </>}
                            <div className='w-full h-full pointer-events-none fixed top-0 left-0 flex justify-end items-end pr-3 pb-2 text-white/20 text-sm z-10'>by Willy4ka</div>
                        </div>
                    </ServersProvider>
                </UpdateProvider>
            </ConfigProvider>
        </>
    );
}

export default App;