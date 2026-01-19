package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Params struct {
	WideScreen    	bool `json:"wideScreen"`
	AutoLogin     	bool `json:"autoLogin"`
	Preload       	bool `json:"preload"`
	Windowed      	bool `json:"windowed"`
	Seasons       	bool `json:"seasons"`
	Graphics      	bool `json:"graphics"`
	ShitPc        	bool `json:"shitPc"`
	CefDirtyRects 	bool `json:"cefDirtyRects"`
	AuthCef       	bool `json:"authCef"`
	Grass         	bool `json:"grass"`
	OldResolution 	bool `json:"oldResolution"`
	HdrResolution 	bool `json:"hdrResolution"`
	ModernScale  	bool `json:"modern_scale"`
}

type StartCfg struct {
	Id 		 		int    `json:"id"`
	Name           	string `json:"name"`
	Path           	string `json:"path"`
}

type Config struct {
	Name           	string `json:"name"`
	Path           	string `json:"path"`
	Memory         	int    `json:"memory"`
	SelectedServer 	int    `json:"selectedServer"`
	Params         	Params `json:"params"`
	CloseOnStartup 	bool   `json:"closeOnStartup"`
	SavedNames		[]string `json:"savedNames"`
	SavedPaths		[]string `json:"savedPaths"`
	SavedStartCfgs	[]StartCfg `json:"savedStartCfgs"`
}

var cfg *Config

func (a *App) GetConfig() *Config {
	return cfg
}

func LoadConfig() error {
	path :=filepath.Join(os.Getenv("USERPROFILE"), "Documents", "Arizona Launcher", "config.json")
	data, err := os.ReadFile(path)
	if err != nil {
		cfg = &Config{
			Memory: 4096,
			SelectedServer: 1,
			CloseOnStartup: true,
			Params: Params{
				AutoLogin: true,
				Windowed: true,
			},
			SavedNames: []string{},
			SavedPaths: []string{},
			SavedStartCfgs: []StartCfg{},
		}
		return SaveConfig()
	}

	err = json.Unmarshal(data, &cfg)
	if cfg.SavedNames == nil {
		cfg.SavedNames = []string{}
	}
	if cfg.SavedPaths == nil {
		cfg.SavedPaths = []string{}
	}
	if cfg.SavedStartCfgs == nil {
		cfg.SavedStartCfgs = []StartCfg{}
	}
	return err
}

func SaveConfig() error {
	path :=filepath.Join(os.Getenv("USERPROFILE"), "Documents", "Arizona Launcher", "config.json")
	data, err := json.MarshalIndent(cfg, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(path, data, 0644)
}

func (a *App) UpdateConfig(newConfig Config) error {
	cfg = &newConfig
	return SaveConfig()
}