package main

import (
	"crypto/md5"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"

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
	Hash     string
}

type LocalFile struct {
	Path     string
	Size     int64
	Modified int64
	Exists   bool
	Type     string
	Hash     string
}

type ComparisonResult struct {
	MissingFiles    []FileInfo
	ModifiedFiles   []FileInfo
	CorrectFiles    []FileInfo
	DownloadFiles   []FileInfo
	TotalJSONFiles  int
	TotalLocalFiles int
}

type FilesConfig struct {
	TargetDir string
	GameURL   string
}

type HashCacheEntry struct {
	Size     int64  `json:"size"`
	Modified int64  `json:"modified"`
	Hash     string `json:"hash"`
}

type HashCache map[string]HashCacheEntry

var files *ComparisonResult

func updateFiles(directory string) {
	files = ValidateGameFiles(directory)
}

func (a *App) DownloadFiles(directory string) {
	var fileInfos []struct {
		Path string
		Size int64
	}

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
	hasRealErrors := false
	stop := false

	for _, f := range files.DownloadFiles {
		url := fmt.Sprintf("https://pc.az-ins.com/release/game/%s", f.Path)
		fullPath := filepath.Join(directory, f.Path)

		runtime.EventsEmit(a.ctx, "download-started", f.Path)

		err := a.downloader.DownloadFile(url, fullPath)
		if err != nil {
			if strings.Contains(err.Error(), "загрузка отменена") {
				runtime.EventsEmit(a.ctx, "download-error", f.Path, err.Error())
				stop = true
				break
			} else {
				hasRealErrors = true
				runtime.EventsEmit(a.ctx, "download-error", f.Path, err.Error())
				continue
			}
		}
		if err == nil {
			UpdateHashCacheForFile(directory, f)
		}
	}

	if !hasRealErrors {
		if stop {
			runtime.EventsEmit(a.ctx, "downloads-stopped")
		} else {
			runtime.EventsEmit(a.ctx, "all-downloads-complete")
		}
	}
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

func (a *App) GetUpdates(directory string) *ComparisonResult {
	updateFiles(directory)
	return files
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
				Hash:     entry.Hash,
			})
		}
	}

	return files
}

func LoadGameFiles(config FilesConfig) []FileEntry {
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

func ComputeFileMD5(path string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()

	h := md5.New()
	if _, err := io.Copy(h, f); err != nil {
		return "", err
	}
	return fmt.Sprintf("%x", h.Sum(nil)), nil
}

func LoadHashCache(gameDir string) HashCache {
	path := filepath.Join(gameDir, ".hashcache.json")

	data, err := os.ReadFile(path)
	if err != nil {
		return make(HashCache)
	}

	var cache HashCache
	if err := json.Unmarshal(data, &cache); err != nil {
		return make(HashCache)
	}

	return cache
}

func SaveHashCache(gameDir string, cache HashCache) {
	path := filepath.Join(gameDir, ".hashcache.json")

	data, _ := json.MarshalIndent(cache, "", "  ")
	_ = os.WriteFile(path, data, 0644)
}

func ValidateGameFiles(directory string) *ComparisonResult {
	config := FilesConfig{
		TargetDir: directory,
		GameURL:   "https://pc.az-ins.com/release/game.json",
	}

	game := LoadGameFiles(config)
	jsonFiles := CollectAllFiles(game, "")
	hashCache := LoadHashCache(directory)

	result := &ComparisonResult{
		TotalJSONFiles: len(jsonFiles),
	}

	for _, jf := range jsonFiles {
		localPath := filepath.Join(directory, jf.Path)
		cacheKey := strings.ToLower(jf.Path)

		info, err := os.Stat(localPath)
		if err != nil {
			delete(hashCache, cacheKey)

			result.MissingFiles = append(result.MissingFiles, jf)
			result.DownloadFiles = append(result.DownloadFiles, jf)
			continue
		}

		cacheEntry, exists := hashCache[cacheKey]

		if !exists {
			hash, err := ComputeFileMD5(localPath)
			if err != nil || hash != jf.Hash {
				result.ModifiedFiles = append(result.ModifiedFiles, jf)
				result.DownloadFiles = append(result.DownloadFiles, jf)
				continue
			}

			hashCache[cacheKey] = HashCacheEntry{
				Size:     info.Size(),
				Modified: info.ModTime().Unix(),
				Hash:     hash,
			}

			result.CorrectFiles = append(result.CorrectFiles, jf)
			continue
		}

		if cacheEntry.Hash != jf.Hash {
			result.ModifiedFiles = append(result.ModifiedFiles, jf)
			result.DownloadFiles = append(result.DownloadFiles, jf)
		} else {
			result.CorrectFiles = append(result.CorrectFiles, jf)
		}
	}

	CleanupHashCache(directory, hashCache)
	SaveHashCache(directory, hashCache)
	return result
}

func IsFileModified(jsonFile FileInfo, localFile LocalFile, baseDir string, cache map[string]string) bool {
	if jsonFile.Size != localFile.Size {
		return true
	}

	if jsonFile.Modified != localFile.Modified {
		return true
	}

	if jsonFile.Hash != "" {
		key := strings.ToLower(localFile.Path)
		// If cached hash equals the expected hash, assume file is correct
		if cachedHash, ok := cache[key]; ok && cachedHash == jsonFile.Hash {
			return false
		}

		fullPath := filepath.Join(baseDir, localFile.Path)
		hash, err := ComputeFileMD5(fullPath)
		if err != nil {
			return true
		}

		// Update cache with the computed hash for future checks
		cache[key] = hash

		return hash != jsonFile.Hash
	}

	return false
}

func UpdateHashCacheForFile(gameDir string, file FileInfo) {
	cache := LoadHashCache(gameDir)

	fullPath := filepath.Join(gameDir, file.Path)
	info, err := os.Stat(fullPath)
	if err != nil {
		return
	}

	hash, err := ComputeFileMD5(fullPath)
	if err != nil {
		return
	}

	cache[strings.ToLower(file.Path)] = HashCacheEntry{
		Size:     info.Size(),
		Modified: info.ModTime().Unix(),
		Hash:     hash,
	}

	CleanupHashCache(gameDir, cache)
	SaveHashCache(gameDir, cache)
}

func CleanupHashCache(gameDir string, cache HashCache) {
	for path := range cache {
		fullPath := filepath.Join(gameDir, path)
		if _, err := os.Stat(fullPath); err != nil {
			delete(cache, path)
		}
	}
}