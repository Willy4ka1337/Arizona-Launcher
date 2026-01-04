package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

type Params struct {
	WideScreen    bool `json:"wideScreen"`
	AutoLogin     bool `json:"autoLogin"`
	Preload       bool `json:"preload"`
	Windowed      bool `json:"windowed"`
	Seasons       bool `json:"seasons"`
	Graphics      bool `json:"graphics"`
	ShitPc        bool `json:"shitPc"`
	CefDirtyRects bool `json:"cefDirtyRects"`
	AuthCef       bool `json:"authCef"`
	Grass         bool `json:"grass"`
	OldResolution bool `json:"oldResolution"`
	HdrResolution bool `json:"hdrResolution"`
	ModernScale  bool `json:"modern_scale"`
}

type Config struct {
	Name           string `json:"name"`
	Path           string `json:"path"`
	Memory         int    `json:"memory"`
	SelectedServer int    `json:"selectedServer"`
	Params         Params `json:"params"`
	Favorites      []int  `json:"favorites"`
	CloseOnStartup bool   `json:"closeOnStartup"`
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
			Favorites: []int{},
		}
		return SaveConfig()
	}

	err = json.Unmarshal(data, &cfg)
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