package main

import (
	"fmt"
	"io"
	"math"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strconv"
	"strings"
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
	width := bounds.Dx()
	height := bounds.Dy()
	totalPixels := width * height
	if totalPixels == 0 {
		return 0, 0, 0, fmt.Errorf("image has no pixels")
	}

	// Sample up to 10,000 pixels for performance
	maxSamples := 10000
	step := int(math.Sqrt(float64(totalPixels) / float64(maxSamples)))
	if step < 1 {
		step = 1
	}

	var totalR, totalG, totalB uint64
	sampleCount := 0

	for y := bounds.Min.Y; y < bounds.Max.Y; y += step {
		for x := bounds.Min.X; x < bounds.Max.X; x += step {
			r, g, b, _ := img.At(x, y).RGBA()
			totalR += uint64(r >> 8)
			totalG += uint64(g >> 8)
			totalB += uint64(b >> 8)
			sampleCount++
		}
	}

	if sampleCount == 0 {
		return 0, 0, 0, fmt.Errorf("no samples taken")
	}

	avgR := int(totalR / uint64(sampleCount))
	avgG := int(totalG / uint64(sampleCount))
	avgB := int(totalB / uint64(sampleCount))

	return avgR, avgG, avgB, nil
}

func IsGtaRunning() bool {
	processes, _ := process.Processes()
	for _, p := range processes {
		if name, _ := p.Name(); name == "gta_sa.exe" {
			return true
		}
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

func WatchGta(event func()) {
	go func() {
		for {
			event()
			time.Sleep(1 * time.Second)
		}
	}()
}

func GetCDN() string {
	result := []int{}
	srvs := [][]string{
		{"https://cdn.azresources.cloud", "https://reserve-cdn.azresources.cloud"},
		{"https://cdn.azsounds.cloud", "https://reserve-cdn.azsounds.cloud"},
		{"https://server-api.arizona.games", "https://reserve-server-api.arizona.games"},
	}
	for _, v := range srvs {
		for k, srv := range v {
			resp, err := http.Get(srv + "/ping.json")
			if err != nil {
				fmt.Println(err)
			}
			defer resp.Body.Close()

			if resp.StatusCode == 200 {
				result = append(result, k)
				break
			}
		}
	}
	strResult := make([]string, len(result))
	for i, idx := range result {
		strResult[i] = strconv.Itoa(idx)
	}
	
	joined := strings.Join(strResult, ",")
	return "-cdn " + joined
}