import React from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import App from './App'

const container = document.getElementById('root')

const root = createRoot(container)

root.render(
    <React.StrictMode>
        <App/>
    </React.StrictMode>
)

export function setStyleColors({bg, server, gradient} = {}) {
    const root = document.documentElement;
    if (bg) root.style.setProperty('--background-color', bg);
    if (server) root.style.setProperty('--serverColor', server);
    if (gradient) root.style.setProperty('--serverGradientStart', gradient);
}