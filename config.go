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
	Id 			int    `json:"id"`
	Name       	string `json:"name"`
	Path       	string `json:"path"`
}

type Launcher struct {
	SelectedStyle			int 	`json:"SelectedStyle"`
	AutoStyle				bool 	`json:"AutoStyle"`
	ShowForegroundImage 	bool 	`json:"ShowForegroundImage"`
	ShowBackgroundImage 	bool 	`json:"ShowBackgroundImage"`
	CustomForegroundImage	string 	`json:"CustomForegroundImage"`
	CustomBackgroundColor	string 	`json:"CustomBackgroundColor"`
	CustomBackgroundImage	string 	`json:"CustomBackgroundImage"`
	OnlyOneWindow 			bool   	`json:"onlyOneWindow"`
	AutoCDN					bool	`json:"AutoCDN"`
	CDN						CDN
}

type CDN struct {
	Resources int `json:"Resources"`
	Sounds int `json:"Sounds"`
	ServerApi int `json:"ServerApi"`
}

type Config struct {
	Name           	string 		`json:"name"`
	Path           	string 		`json:"path"`
	Memory         	int    		`json:"memory"`
	SelectedServer 	int    		`json:"selectedServer"`
	Params         	Params 		`json:"params"`
	Launcher		Launcher
	SavedStartCfgs	[]StartCfg 	`json:"savedStartCfgs"`
}

var cfg *Config

func (a *App) GetConfig() *Config {
	return cfg
}

func LoadConfig() error {
	path := filepath.Join(os.Getenv("USERPROFILE"), "Documents", "Arizona Launcher", "config.json")
	data, err := os.ReadFile(path)
	if err != nil {
		cfg = &Config{
			Memory: 4096,
			SelectedServer: 1,
			Params: Params{
				AutoLogin: true,
				Windowed: true,
			},
			Launcher: Launcher{
				OnlyOneWindow: true,
				AutoStyle: true,
				SelectedStyle: 0,
				ShowForegroundImage: true,
				ShowBackgroundImage: true,
				CustomForegroundImage: "",
				CustomBackgroundColor: "",
				CustomBackgroundImage: "",
				AutoCDN: true,
				CDN: CDN{
					Resources: 0,
					Sounds: 0,
					ServerApi: 0,
				},
			},
			SavedStartCfgs: []StartCfg{},
		}
		return SaveConfig()
	}

	err = json.Unmarshal(data, &cfg)
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