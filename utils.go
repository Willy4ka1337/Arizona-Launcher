package main

import (
	"fmt"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	"github.com/shirou/gopsutil/v3/process"
	"golang.org/x/image/webp"
)

func DirExists(path string) bool {
    info, err := os.Stat(path)
    if os.IsNotExist(err) {
        return false
    }
    return info.IsDir()
}

func FileExists(filename string) bool {
    _, err := os.Stat(filename)
    return !os.IsNotExist(err)
}

func downloadFile(url string, filePath string) error {
    fmt.Println("Create file", filePath)
	output, err := os.Create(filePath)
	if err != nil {
		return fmt.Errorf("error creating file: %w", err)
	}

    fmt.Println("http get", url)
	resp, err := http.Get(url)
	if err != nil {
		return fmt.Errorf("error making HTTP request: %w", err)
	}

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("bad status: %s", resp.Status)
	}

	_, err = io.Copy(output, resp.Body)
	if err != nil {
		return fmt.Errorf("error copying data to file: %w", err)
	}

	return nil
}

func GetExecutableDir() string {
    exePath, err := os.Executable()
    if err != nil {
        return ""
    }
    return filepath.Dir(exePath)
}

func GetFrontendPath() string {
    exeDir := GetExecutableDir()
    return filepath.Join(exeDir, "frontend", "dist")
}

func GetAverageColorFromWebP(filename string) (int, int, int, error) {
    file, err := os.Open(filename)
    if err != nil {
        return 0, 0, 0, fmt.Errorf("error opening file: %v", err)
    }
    defer file.Close()

    img, err := webp.Decode(file)
    if err != nil {
        return 0, 0, 0, fmt.Errorf("error decoding WebP: %v", err)
    }

    bounds := img.Bounds()
    var totalR, totalG, totalB uint64
    pixelCount := uint64(bounds.Dx() * bounds.Dy())

    if pixelCount == 0 {
        return 0, 0, 0, fmt.Errorf("image has no pixels")
    }

    for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
        for x := bounds.Min.X; x < bounds.Max.X; x++ {
            r, g, b, _ := img.At(x, y).RGBA()
            totalR += uint64(r >> 8)
            totalG += uint64(g >> 8)
            totalB += uint64(b >> 8)
        }
    }

    avgR := int(totalR / pixelCount)
    avgG := int(totalG / pixelCount)
    avgB := int(totalB / pixelCount)

    return avgR, avgG, avgB, nil
}

func WatchGta(event func()) {
    go func() {
        for {
            event()
            time.Sleep(1 * time.Second)
        }
    }()
}

func IsGtaRunning() bool {
    processes, _ := process.Processes()
    for _, p := range processes {
        if name, _ := p.Name(); name == "gta_sa.exe" { return true }
    }
    return false
}

func KillGTA() error {
    cmd := exec.Command("taskkill", "/f", "/im", "gta_sa.exe")
    return cmd.Run()
}

func AddSavedStartCfg(name string, path string) error {
	id := 0
    for _, sc := range cfg.SavedStartCfgs {
		if sc.Id >= id {
            id = sc.Id + 1
        }
	}
    newCfg := StartCfg{Id: id, Name: name, Path: path}
	cfg.SavedStartCfgs = append(cfg.SavedStartCfgs, newCfg)
	return SaveConfig()
}

func IsSavedStartCfgExists(name string, path string) bool {
	for _, sc := range cfg.SavedStartCfgs {
		if sc.Name == name && sc.Path == path {
			return true
		}
	}
	return false
}