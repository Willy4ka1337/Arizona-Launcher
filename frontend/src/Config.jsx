import { GetConfig, UpdateConfig, GetSavedStartCfgs } from '../wailsjs/go/main/App';

let cfg = {};

export async function loadConfig() {
    try {
        cfg = await GetConfig();
        return cfg;
    } catch (error) {
        console.error('Failed to load config:', error);
        return cfg;
    }
}

export async function saveCfg(newConfig) {
    try {
        await UpdateConfig(newConfig);
        cfg = newConfig;
        return true;
    } catch (error) {
        console.error('Failed to save config:', error);
        return false;
    }
}

export async function getSavedStartCfgs() {
    try {
        return await GetSavedStartCfgs();
    } catch (error) {
        console.error('Failed to get saved start configs:', error);
        return [];
    }
}

const parameterName = {
    "windowed": "window",
    "autoLogin": "x",
    "wideScreen": "widescreen",
    "preload": "ldo",
    "seasons": "seasons",
    "graphics": "graphics",
    "shitPc": "t",
    "cefDirtyRects": "cef_dirty_rects",
    "authCef": "auth_cef_enable",
    "grass": "enable_grass",
    "oldResolution": "16bpp",
    "hdrResolution": "allow_hdr",
}

const paramsNames = {
    "wideScreen": "Широкий экран",
    "autoLogin": "Автологин",
    "preload": "Предзагрузка",
    "windowed": "Запуск в окне",
    "seasons": "Времена года",
    "graphics": "Графика Plus",
    "shitPc": "Слабый ПК",
    "oldResolution": "Старые разрешения",
    "hdrResolution": "Поддержка HDR",
    "grass": "Растительность",
    "authCef": "Новая авторизация",
    "cefDirtyRects": "Оптимизация интерфейсов"
}

const launcherNames = {
    "onlyOneWindow": "Запуск только одного окна игры",
    "AutoStyle": "Автоматическое оформление",
    "ShowForegroundImage": "Показывать изображение на переднем плане",
    "ShowBackgroundImage": "Показывать изображение на заднем плане",
    "AutoCDN": "Автоматическое определение CDN серверов",
}

export {paramsNames, launcherNames}

export async function getStartParams(server_ip, name) {
    const result = [
        "-c",
        "-h", server_ip,
        "-p", "7777",
        "-n", name ?? cfg.name,
        "-mem", `${cfg.memory}`,
        "-arizona",
        "-referrer",
        "--remote-debugging-port=9222",
    ]
    for (const param of Object.keys(cfg.params)) {
        if (cfg.params[param]) {
            result.push(`-${parameterName[param]}`)
        }
    }
    if (!Object.keys(cfg.params).includes("windowed")) {
        result.push("-modern_scale")
    }
    return result
}