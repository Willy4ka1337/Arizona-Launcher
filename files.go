package main

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type FileEntry struct {
	Type       string      `json:"type"`
	Name       string      `json:"name"`
	Size       int64       `json:"size,omitempty"`
	Hash       string      `json:"hash,omitempty"`
	DateChange int64       `json:"date_change,omitempty"`
	Data       []FileEntry `json:"data,omitempty"`
}

type FileInfo struct {
	Path     string
	Size     int64
	Modified int64
	Type     string
}

type LocalFile struct {
	Path     string
	Size     int64
	Modified int64
	Exists   bool
	Type     string
}

type ComparisonResult struct {
	MissingFiles     []FileInfo
	ModifiedFiles    []FileInfo
	CorrectFiles     []FileInfo
	DownloadFiles	 []FileInfo
	TotalJSONFiles   int
	TotalLocalFiles  int
}

type FilesConfig struct {
	TargetDir    	string
	GameURL  		string
}

var files *ComparisonResult

func updateFiles(directory string)  {
	config := FilesConfig{
		TargetDir:    	directory,
		GameURL:  		"https://pc.az-ins.com/release/game.json",
	}
	game := LoadGameFiles(config)
	allGameFiles := CollectAllFiles(game, "")
	localFiles := ScanLocalFiles(config.TargetDir)
	files = CompareFiles(allGameFiles, localFiles)
}

func (a *App) DownloadFiles(directory string) {
	if files == nil {
		updateFiles(directory)
	}

	var fileInfos []struct {
		Path string
		Size int64
	}

	// Собираем информацию о файлах
	for _, file := range files.DownloadFiles {
		fileInfos = append(fileInfos, struct {
			Path string
			Size int64
		}{
			Path: file.Path,
			Size: file.Size,
		})
	}

	a.downloader.SetFilesInfo(fileInfos)

	// Запускаем загрузку всех файлов параллельно
	var wg sync.WaitGroup
	errors := make(chan error, len(files.DownloadFiles))

	for _, file := range files.DownloadFiles {
		wg.Add(1)
		
		go func(f FileInfo) {
			defer wg.Done()
			
			url := fmt.Sprintf("https://pc.az-ins.com/release/game/%s", f.Path)
			fullPath := filepath.Join(directory, f.Path)
			
			runtime.EventsEmit(a.ctx, "download-started", f.Path)

			err := a.downloader.DownloadFile(url, fullPath)
			if err != nil {
				if !strings.Contains(err.Error(), "загрузка отменена") {
					runtime.EventsEmit(a.ctx, "download-error", f.Path, err.Error())
				}
				errors <- err
			} else {
				runtime.EventsEmit(a.ctx, "download-finished", f.Path)
			}
		}(file)
	}

	go func() {
		wg.Wait()
		close(errors)
		
		hasRealErrors := false
		stop := false
		for err := range errors {
			if err != nil && !strings.Contains(err.Error(), "загрузка отменена") {
				hasRealErrors = true
			}
			if strings.Contains(err.Error(), "загрузка отменена") {
				stop = true
			}
		}
		
		if !hasRealErrors {
			if stop {
				runtime.EventsEmit(a.ctx, "downloads-stopped")
			} else {
				runtime.EventsEmit(a.ctx, "all-downloads-complete")
			}
		}
	}()
}

func (a *App) StopDownloads() bool {
	if a.downloader != nil {
		runtime.EventsEmit(a.ctx, "downloads-stopping")
		a.downloader.StopAll()
		a.downloader.ResetProgress()
		runtime.EventsEmit(a.ctx, "downloads-stopped")
		return true
	}
	return false
}

func (a *App) GetDownloadProgress() DownloadProgress {
	if a.downloader != nil {
		return a.downloader.GetProgress()
	}
	return DownloadProgress{}
}

func (a *App) GetUpdates(directory string) *ComparisonResult  {
	if files == nil {
		updateFiles(directory)
	}
	return files;
}

func (a *App) GetMissingFiles(directory string) []FileInfo {
	if files == nil {
		updateFiles(directory)
	}
	return files.MissingFiles
}

func (a *App) GetModifiedFiles(directory string) []FileInfo {
	if files == nil {
		updateFiles(directory)
	}
	return files.ModifiedFiles
}

func (a *App) IsUpdateAvailable(directory string) bool {
	updateFiles(directory)
	return (len(files.DownloadFiles) > 0)
}

func CollectAllFiles(entries []FileEntry, basePath string) []FileInfo {
	var files []FileInfo
	
	for _, entry := range entries {
		currentPath := filepath.Join(basePath, entry.Name)
		
		if entry.Type == "dir" {
			files = append(files, CollectAllFiles(entry.Data, currentPath)...)
		} else {
			normalizedPath := filepath.ToSlash(currentPath)
			
			files = append(files, FileInfo{
				Path:     normalizedPath,
				Size:     entry.Size,
				Modified: entry.DateChange,
				Type:     entry.Type,
			})
		}
	}
	
	return files
}

func LoadGameFiles(config FilesConfig) ([]FileEntry) {
	var GameData struct {
		Data []FileEntry `json:"data"`
	}

	resp, err := http.Get(config.GameURL)
	if err != nil {
		return nil
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil
	}

	if err := json.Unmarshal(body, &GameData); err != nil {
		return nil
	}

	return GameData.Data
}

func ScanLocalFiles(rootDir string) (map[string]LocalFile) {
	localFiles := make(map[string]LocalFile)

	err := filepath.Walk(rootDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}

		if info.IsDir() {
			return nil
		}

		relPath, err := filepath.Rel(rootDir, path)
		if err != nil {
			return err
		}

		relPath = filepath.ToSlash(relPath)
		normalizedKey := strings.ToLower(relPath)

		localFiles[normalizedKey] = LocalFile{
			Path:     relPath,
			Size:     info.Size(),
			Modified: info.ModTime().Unix(),
			Exists:   true,
		}

		return nil
	})

	if err != nil {
		return nil
	}

	return localFiles
}

func CompareFiles(jsonFiles []FileInfo, localFiles map[string]LocalFile) *ComparisonResult {
	result := &ComparisonResult{
		MissingFiles:    make([]FileInfo, 0),
		ModifiedFiles:   make([]FileInfo, 0),
		CorrectFiles:    make([]FileInfo, 0),
		DownloadFiles:	 make([]FileInfo, 0),
		TotalJSONFiles:  len(jsonFiles),
		TotalLocalFiles: len(localFiles),
	}

	matchedLocalFiles := make(map[string]bool)

	jsonFilesMap := make(map[string]FileInfo)
	for _, jsonFile := range jsonFiles {
		key := strings.ToLower(jsonFile.Path)
		jsonFilesMap[key] = jsonFile
	}

	for localKey, localFile := range localFiles {
		if jsonFile, exists := jsonFilesMap[localKey]; exists {
			matchedLocalFiles[localKey] = true
			
			if IsFileModified(jsonFile, localFile) {
				result.ModifiedFiles = append(result.ModifiedFiles, jsonFile)
				result.DownloadFiles = append(result.DownloadFiles, jsonFile)
			} else {
				result.CorrectFiles = append(result.CorrectFiles, jsonFile)
			}
			delete(jsonFilesMap, localKey)
		}
	}

	for _, jsonFile := range jsonFilesMap {
		result.MissingFiles = append(result.MissingFiles, jsonFile)
		result.DownloadFiles = append(result.DownloadFiles, jsonFile)
	}

	return result
}

func IsFileModified(jsonFile FileInfo, localFile LocalFile) bool {
	return (jsonFile.Size != localFile.Size)
}