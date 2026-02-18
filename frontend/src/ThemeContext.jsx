import { createContext, useContext, useEffect, useState } from 'react';
import { loadConfig } from './Config';
import { setStyleColors } from './main';

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
    const [styleSettings, setStyleSettings] = useState({
        SelectedStyle: 0,
        AutoStyle: true,
    })
    const [styles, setStyles] = useState([])

    useEffect(() => {
        loadConfig().then(config => {
            setStyleSettings({
                SelectedStyle: config.Launcher.SelectedStyle,
                AutoStyle: config.Launcher.AutoStyle,
            })
            fetch("https://willy4ka.ru/resources/arzlauncher/styles.json").then((res) => res.json())
                .then((res) => {
                    setStyles(res)

                    setStyleColors({
                        bg: res[config.Launcher.SelectedStyle].backgroundColor,
                        server: res[config.Launcher.SelectedStyle].serverColor,
                        gradient: res[config.Launcher.SelectedStyle].serverGradientStart,
                    })
                })
        })
        
    }, [])

    return (
        <ThemeContext.Provider value={{styleSettings, styles}}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useTheme() {
    const context = useContext(ThemeContext)
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider')
    }
    return context
}