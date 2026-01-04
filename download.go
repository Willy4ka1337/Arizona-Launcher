package main

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"sync"
	"sync/atomic"
	"time"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type DownloadProgress struct {
	FileDownloading    string   `json:"fileDownloading"`
	FilesLoaded        []string `json:"filesLoaded"`
	PercentDownloaded  float64  `json:"percentDownloaded"`
	Speed              float64  `json:"speed"`
	TotalFiles         int      `json:"totalFiles"`
	DownloadedFiles    int      `json:"downloadedFiles"`
	TotalSize          int64    `json:"totalSize"`
	DownloadedSize     int64    `json:"downloadedSize"`
	CurrentFile        string   `json:"currentFile"`
	CurrentFilePercent float64  `json:"currentFilePercent"`
	CurrentFileSize    int64    `json:"currentFileSize"`
	CurrentFileLoaded  int64    `json:"currentFileLoaded"`
}

type DownloadResult struct {
	FilePath string
	Err      error
}

type Downloader struct {
	mu              sync.Mutex
	activeDownloads map[string]context.CancelFunc
	ctx             context.Context
	progress        DownloadProgress
	progressMutex   sync.RWMutex
	totalSizeMap    map[string]int64
	fileSizes       map[string]int64
	lastEmitTime    time.Time
	emitMutex       sync.Mutex
}

func NewDownloader(ctx context.Context) *Downloader {
	return &Downloader{
		activeDownloads: make(map[string]context.CancelFunc),
		ctx:             ctx,
		progress: DownloadProgress{
			FilesLoaded: []string{},
		},
		totalSizeMap: make(map[string]int64),
		fileSizes:    make(map[string]int64),
		lastEmitTime: time.Now(),
	}
}

func (d *Downloader) emitProgress() {
	d.emitMutex.Lock()
	defer d.emitMutex.Unlock()

	now := time.Now()
	if now.Sub(d.lastEmitTime) < 500*time.Millisecond {
		return
	}

	d.progressMutex.RLock()
	progress := d.progress
	d.progressMutex.RUnlock()

	if d.ctx != nil {
		runtime.EventsEmit(d.ctx, "download-progress", progress)
	}

	d.lastEmitTime = now
}

func (d *Downloader) SetFilesInfo(files []struct {
	Path string
	Size int64
}) {
	d.progressMutex.Lock()
	defer d.progressMutex.Unlock()

	d.progress.TotalFiles = len(files)
	d.progress.DownloadedFiles = 0
	d.progress.TotalSize = 0
	d.progress.DownloadedSize = 0
	d.progress.PercentDownloaded = 0

	d.totalSizeMap = make(map[string]int64)
	d.fileSizes = make(map[string]int64)

	for _, file := range files {
		d.totalSizeMap[file.Path] = 0
		d.fileSizes[file.Path] = file.Size
		d.progress.TotalSize += file.Size
	}
}

func (d *Downloader) updateFileProgress(filePath string, downloadedBytes int64, fileSize int64) {
	d.progressMutex.Lock()
	defer d.progressMutex.Unlock()

	if oldBytes, exists := d.totalSizeMap[filePath]; exists {
		d.progress.DownloadedSize += downloadedBytes - oldBytes
		d.totalSizeMap[filePath] = downloadedBytes
	} else {
		d.progress.DownloadedSize += downloadedBytes
		d.totalSizeMap[filePath] = downloadedBytes
	}

	d.progress.CurrentFile = filepath.Base(filePath)
	d.progress.CurrentFileLoaded = downloadedBytes
	d.progress.CurrentFileSize = fileSize

	if fileSize > 0 {
		d.progress.CurrentFilePercent = float64(downloadedBytes) / float64(fileSize) * 100
	}

	if d.progress.TotalSize > 0 {
		d.progress.PercentDownloaded = float64(d.progress.DownloadedSize) / float64(d.progress.TotalSize) * 100
	}

	go d.emitProgress()
}

func (d *Downloader) updateCurrentFile(fileName string, speed float64) {
	d.progressMutex.Lock()
	d.progress.FileDownloading = filepath.Base(fileName)
	d.progress.Speed = speed
	d.progressMutex.Unlock()

	go d.emitProgress()
}

func (d *Downloader) markFileComplete(fileName string, filePath string, speed float64) {
	d.progressMutex.Lock()

	d.progress.FilesLoaded = append(d.progress.FilesLoaded, fileName)
	d.progress.DownloadedFiles++
	d.progress.Speed = speed

	if fileSize, exists := d.fileSizes[filePath]; exists {
		d.totalSizeMap[filePath] = fileSize
	}

	progress := d.progress
	d.progressMutex.Unlock()

	if d.ctx != nil {
		runtime.EventsEmit(d.ctx, "download-progress", progress)
	}
}

type WriteCounter struct {
	TotalBytes    atomic.Uint64
	ContentLength uint64
	FileName      string
	FilePath      string
	ctx           context.Context
	StartTime     time.Time
	LastTime      time.Time
	LastBytes     uint64
	SpeedKBps     float64
	downloader    *Downloader
	mu            sync.Mutex
}

func NewWriteCounter(ctx context.Context, fileName, filePath string, contentLength uint64, downloader *Downloader) *WriteCounter {
	return &WriteCounter{
		ContentLength: contentLength,
		FileName:      fileName,
		FilePath:      filePath,
		ctx:           ctx,
		StartTime:     time.Now(),
		LastTime:      time.Now(),
		downloader:    downloader,
	}
}

func (wc *WriteCounter) GetAverageSpeed() float64 {
	elapsed := time.Since(wc.StartTime).Seconds()
	if elapsed == 0 {
		return 0
	}
	return float64(wc.TotalBytes.Load()) / elapsed / 1024
}

type cancelableWriter struct {
	ctx        context.Context
	file       *os.File
	downloader *Downloader
	fileName   string
	filePath   string
	fileSize   uint64

	totalRead  uint64
	startTime  time.Time
	lastUpdate time.Time
	lastBytes  uint64
	speed      float64
	mu         sync.Mutex
}

func (cw *cancelableWriter) Write(p []byte) (int, error) {
	if cw.ctx.Err() != nil {
		return 0, cw.ctx.Err()
	}

	n := len(p)

	if _, err := cw.file.Write(p); err != nil {
		return 0, err
	}

	cw.mu.Lock()
	defer cw.mu.Unlock()

	if cw.startTime.IsZero() {
		cw.startTime = time.Now()
		cw.lastUpdate = cw.startTime
	}

	cw.totalRead += uint64(n)

	now := time.Now()
	if now.Sub(cw.lastUpdate) >= 100*time.Millisecond {
		elapsed := now.Sub(cw.lastUpdate).Seconds()
		if elapsed > 0 {
			bytesSinceLast := cw.totalRead - cw.lastBytes
			cw.speed = float64(bytesSinceLast) / elapsed / 1024
		}

		if cw.downloader != nil {
			cw.downloader.updateCurrentFile(cw.fileName, cw.speed)
			cw.downloader.updateFileProgress(cw.filePath, int64(cw.totalRead), int64(cw.fileSize))
		}

		cw.lastBytes = cw.totalRead
		cw.lastUpdate = now
	}

	return n, nil
}

func (d *Downloader) DownloadFile(url string, fullPath string) error {
	cancelCtx, cancel := context.WithCancel(d.ctx)

	d.mu.Lock()
	d.activeDownloads[fullPath] = cancel
	d.mu.Unlock()

	defer func() {
		d.mu.Lock()
		delete(d.activeDownloads, fullPath)
		d.mu.Unlock()
		cancel()
	}()

	req, err := http.NewRequestWithContext(cancelCtx, "GET", url, nil)
	if err != nil {
		return fmt.Errorf("ошибка создания запроса: %v", err)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return fmt.Errorf("ошибка запроса: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("ошибка HTTP: %s", resp.Status)
	}

	dirPath := filepath.Dir(fullPath)
	if err := os.MkdirAll(dirPath, 0755); err != nil {
		return fmt.Errorf("не удалось создать директорию %s: %v", dirPath, err)
	}

	tmpFile := fullPath + ".tmp"
	file, err := os.Create(tmpFile)
	if err != nil {
		return fmt.Errorf("не удалось создать файл: %v", err)
	}

	contentLength, _ := strconv.ParseUint(resp.Header.Get("Content-Length"), 10, 64)
	fileName := filepath.Base(fullPath)

	writer := &cancelableWriter{
		ctx:        cancelCtx,
		file:       file,
		downloader: d,
		fileName:   fileName,
		filePath:   fullPath,
		fileSize:   contentLength,
	}

	_, err = io.Copy(writer, resp.Body)

	// close file and handle errors
	if closeErr := file.Close(); closeErr != nil {
		os.Remove(tmpFile)
		return fmt.Errorf("ошибка при закрытии файла: %v", closeErr)
	}

	// handle cancellation
	if cancelCtx.Err() == context.Canceled {
		os.Remove(tmpFile)
		return fmt.Errorf("загрузка отменена")
	}

	if err != nil {
		os.Remove(tmpFile)
		return fmt.Errorf("ошибка при записи файла: %v", err)
	}

	if err := os.Rename(tmpFile, fullPath); err != nil {
		os.Remove(tmpFile)
		return fmt.Errorf("не удалось переименовать файл: %v", err)
	}

	// average speed in KB/s
	writer.mu.Lock()
	elapsed := time.Since(writer.startTime).Seconds()
	avgSpeed := 0.0
	if elapsed > 0 {
		avgSpeed = float64(writer.totalRead) / elapsed / 1024
	}
	writer.mu.Unlock()

	if d != nil {
		d.markFileComplete(fileName, fullPath, avgSpeed)
	}

	return nil
}

func (d *Downloader) StopDownload(filePath string) bool {
	d.mu.Lock()
	cancel, exists := d.activeDownloads[filePath]
	d.mu.Unlock()

	if exists && cancel != nil {
		cancel()
		return true
	}
	return false
}

func (d *Downloader) StopAll() {
	d.mu.Lock()
	defer d.mu.Unlock()

	for _, cancel := range d.activeDownloads {
		if cancel != nil {
			cancel()
		}
	}

	d.activeDownloads = make(map[string]context.CancelFunc)
}

func (d *Downloader) ResetProgress() {
	d.progressMutex.Lock()
	defer d.progressMutex.Unlock()

	d.progress = DownloadProgress{
		FileDownloading:   "",
		FilesLoaded:       []string{},
		PercentDownloaded: 0,
		Speed:             0,
		TotalFiles:        d.progress.TotalFiles,
		DownloadedFiles:   0,
		TotalSize:         d.progress.TotalSize,
		DownloadedSize:    0,
	}

	d.totalSizeMap = make(map[string]int64)
}

func (d *Downloader) GetProgress() DownloadProgress {
	d.progressMutex.RLock()
	defer d.progressMutex.RUnlock()
	return d.progress
}
