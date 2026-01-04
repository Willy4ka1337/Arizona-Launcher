import { GetConfig, UpdateConfig } from '../wailsjs/go/main/App';

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

export function getConfig() {
    return cfg;
}

export async function updateConfigPartial(updates) {
    const updatedConfig = {
        ...cfg,
        ...updates
    };
    return await saveCfg(updatedConfig);
}

export async function updateParams(paramsUpdates) {
    const updatedConfig = {
        ...cfg,
        params: {
            ...cfg.params,
            ...paramsUpdates
        }
    };
    return await saveCfg(updatedConfig);
}

export async function addToFavorites(serverId) {
    if (!cfg.favorites.includes(serverId)) {
        const updatedFavorites = [...cfg.favorites, serverId];
        return await updateConfigPartial({ favorites: updatedFavorites });
    }
    return true;
}

export async function removeFromFavorites(serverId) {
    const updatedFavorites = cfg.favorites.filter(id => id !== serverId);
    return await updateConfigPartial({ favorites: updatedFavorites });
}

export function isFavorite(serverId) {
    return cfg.favorites.includes(serverId);
}

// WideScreen: "wideScreen",
// AutoLogin: "autoLogin",
// Preload: "preload",
// AutoClean: "autoClean",
// Windowed: "windowed",
// TestBranch: "testBranch",
// Seasons: "seasons",
// Rtree: "rtree",
// Graphics: "graphics",
// ShitPc: "shitPc",
// CefDirtyRects: "cefDirtyRects",
// CefAuth: "authCef",
// Grass: "grass",
// OldResolution: "oldResolution",
// HdrResolution: "hdrResolution"

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

export {paramsNames}

export async function getStartParams(server_ip) {
    const result = [
        "-c",
        "-h", server_ip,
        "-p", "7777",
        "-n", cfg.name,
        "-mem", `${cfg.memory}`,
        "-arizona",
        "-referrer",
        "-cdn", "1,1,0",
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