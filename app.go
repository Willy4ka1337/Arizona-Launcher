package main

import (
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx        context.Context
	downloader *Downloader
}

type ColorResult struct {
	R   int    `json:"r"`
	G   int    `json:"g"`
	B   int    `json:"b"`
	Err string `json:"error,omitempty"`
}

func NewApp() *App {
	return &App{}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
	a.downloader = NewDownloader(ctx)
	LoadConfig()
	servers, serr := getServersData()
	styles, sterr := GetStylesData()

	if serr == nil {
		for _, v := range servers.Arizona {
			dir := filepath.Join(os.Getenv("USERPROFILE"), "Documents", "Arizona Launcher")
			if !DirExists(dir) {
				os.MkdirAll(dir, 0755)
			}
			fullpath := filepath.Join(dir, v.Name+".webp")
			if !FileExists(fullpath) {
				downloadFile(v.Icon, fullpath)
			}
		}
	}

	if sterr == nil {
		for _, v := range styles {
			dir := filepath.Join(os.Getenv("USERPROFILE"), "Documents", "Arizona Launcher")
			if !DirExists(dir) {
				os.MkdirAll(dir, 0755)
			}
			fullpath := filepath.Join(dir, v.BackgroundImage)
			if !FileExists(fullpath) {
				downloadFile("https://willy4ka.ru/resources/arzlauncher/" + v.BackgroundImage, fullpath)
			}

			fullpath = filepath.Join(dir, v.ForegroundImage)
			if !FileExists(fullpath) {
				downloadFile("https://willy4ka.ru/resources/arzlauncher/" + v.ForegroundImage, fullpath)
			}
		}
	}

	runtime.EventsOn(a.ctx, "js:getgamestate", func(optionalData ...interface{}) {
		runtime.EventsEmit(a.ctx, "go:gamestate", IsGtaRunning())
	})

	WatchGta(
		func() {
			runtime.EventsEmit(a.ctx, "go:gamestate", IsGtaRunning())
		},
	)
}

func (a *App) GetStyleFile(name string) ([]byte, error) {
	return os.ReadFile(filepath.Join(os.Getenv("USERPROFILE"), "Documents", "Arizona Launcher", name))
}

func (a *App) GetImageColor(filename string) ColorResult {
	r, g, b, err := GetAverageColorFromWebP(filename)
	result := ColorResult{
		R: r,
		G: g,
		B: b,
	}

	if err != nil {
		result.Err = err.Error()
	}

	return result
}

func (a *App) StartGame(exePath string, params []string) error {
	if !IsGtaRunning() || !cfg.Launcher.OnlyOneWindow {
		exePath = strings.Trim(exePath, `"`)
		workingDir := filepath.Dir(exePath)

		cdn := GetCDN()
		params = append(params, cdn)

		cmd := exec.Command(exePath, params...)
		cmd.Dir = workingDir
		cmd.Stdout = os.Stdout
		cmd.Stderr = os.Stderr
		cmd.Stdin = os.Stdin

        if !IsSavedStartCfgExists(cfg.Name, cfg.Path) {
            AddSavedStartCfg(cfg.Name, cfg.Path)
        }

		err := cmd.Start()
		if err != nil {
			return err
		}

		InjectPlugins(cmd.Process.Pid, exePath)
		return nil
	} else {
		return KillGTA()
	}
}

func (a *App) MinimizeWindow() {
	runtime.WindowMinimise(a.ctx)
}

func (a *App) MaximizeWindow() {
	if runtime.WindowIsMaximised(a.ctx) {
		runtime.WindowUnmaximise(a.ctx)
	} else {
		runtime.WindowMaximise(a.ctx)
	}
}

func (a *App) CloseWindow() {
	runtime.Quit(a.ctx)
}

func (a *App) IsMaximized() bool {
	return runtime.WindowIsMaximised(a.ctx)
}

func (a *App) OpenFolderDialog() (string, error) {
	selection, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
		Title: "Выберите папку",
	})

	if err != nil {
		return "", err
	}

	updateFiles(selection)
	return selection, nil
}

func (a *App) OpenFolderDialogWithDefault(defaultDir string) (string, error) {
	_, err := os.Stat(defaultDir)
	if err != nil {
		if os.IsNotExist(err) {
			selection, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
				Title: "Выберите папку",
			})

			if err != nil {
				return "", err
			}

			return selection, nil
		}
	} else {
		selection, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{
			Title:            "Выберите папку",
			DefaultDirectory: defaultDir,
		})

		if err != nil {
			return "", err
		}

		updateFiles(selection)
		return selection, nil
	}
	return "", nil
}

func (a *App) RemoveSavedStartCfg(id int) error {
	for i, sc := range cfg.SavedStartCfgs {
		if sc.Id == id {
			cfg.SavedStartCfgs = append(cfg.SavedStartCfgs[:i], cfg.SavedStartCfgs[i+1:]...)
			return SaveConfig()
		}
	}
	return fmt.Errorf("StartCfg with id %d not found", id)
}

func (a *App) GetSavedStartCfgs() []StartCfg {
    return cfg.SavedStartCfgs
}