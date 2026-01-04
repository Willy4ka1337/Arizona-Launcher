package main

import (
	"embed"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
)

//go:embed frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	err := wails.Run(&options.App{
		Title:  "Arizona",
		Width:  1024,
		Height: 768,
		MinWidth: 900,
		MinHeight: 600,
		MaxWidth: 1920,
		MaxHeight: 1080,
		Frameless: true,
		Windows: &windows.Options{
			DisableFramelessWindowDecorations: false,
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		CSSDragProperty: "widows",
        CSSDragValue:    "1",
		BackgroundColour: &options.RGBA{R: 11, G: 11, B: 11, A: 1},
		OnStartup:        app.startup,
		Bind: []interface{}{
			app,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}