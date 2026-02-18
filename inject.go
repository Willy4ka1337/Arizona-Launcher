package main

import (
	"fmt"
	"io/ioutil"
	"path/filepath"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	kernel32                  = syscall.NewLazyDLL("kernel32.dll")
	virtualAllocEx            = kernel32.NewProc("VirtualAllocEx")
	virtualFreeEx             = kernel32.NewProc("VirtualFreeEx")
	writeProcessMemory        = kernel32.NewProc("WriteProcessMemory")
	createRemoteThread        = kernel32.NewProc("CreateRemoteThread")
	waitForSingleObject       = kernel32.NewProc("WaitForSingleObject")
	closeHandle               = kernel32.NewProc("CloseHandle")
	getProcAddress            = kernel32.NewProc("GetProcAddress")
	getModuleHandle           = kernel32.NewProc("GetModuleHandleA")
	LoadLibraryA              = kernel32.NewProc("LoadLibraryA")
	LoadLibraryAddr           = kernel32.NewProc("LoadLibraryAddr")
	libKernel32Name			  = uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr("kernel32.dll")))
)

func getProcessHandle(pid uint32) (windows.Handle, error) {
	const PROCESS_ALL_ACCESS = 0x1F0FFF
	handle, err := windows.OpenProcess(
		PROCESS_ALL_ACCESS,
		false,
		pid,
	)

	if err != nil {
		return windows.InvalidHandle, fmt.Errorf("не удалось открыть процесс: %w", err)
	}

	return handle, nil
}

func InjectDLL(hProcess windows.Handle, dllPath string) error {
    dllPath, _ = filepath.Abs(dllPath)
    
    dllPathUTF16, err := syscall.UTF16PtrFromString(dllPath)
    if err != nil {
        return fmt.Errorf("ошибка конвертации пути: %w", err)
    }
    
    pathSize := (len(dllPath) + 1) * 2
    allocAddr, _, err := virtualAllocEx.Call(
        uintptr(hProcess),
        0,
        uintptr(pathSize),
        windows.MEM_COMMIT|windows.MEM_RESERVE,
        windows.PAGE_READWRITE,
    )
    
    if allocAddr == 0 {
        return fmt.Errorf("не удалось выделить память: %v", err)
    }
    defer virtualFreeEx.Call(uintptr(hProcess), allocAddr, 0, windows.MEM_RELEASE)
    
    var bytesWritten uintptr
    ret, _, err := writeProcessMemory.Call(
        uintptr(hProcess),
        allocAddr,
        uintptr(unsafe.Pointer(dllPathUTF16)),
        uintptr(pathSize),
        uintptr(unsafe.Pointer(&bytesWritten)),
    )
    
    if ret == 0 {
        return fmt.Errorf("не удалось записать в память: %v", err)
    }
    
    kernel32Handle, _, _ := getModuleHandle.Call(uintptr(unsafe.Pointer(syscall.StringBytePtr("kernel32.dll"))))
    if kernel32Handle == 0 {
        kernel32Handle, _, _ = LoadLibraryA.Call(uintptr(unsafe.Pointer(syscall.StringBytePtr("kernel32.dll"))))
    }
    
    if kernel32Handle == 0 {
        return fmt.Errorf("не удалось получить handle kernel32.dll")
    }
    
    loadLibraryAddr, _, _ := getProcAddress.Call(
        kernel32Handle,
        uintptr(unsafe.Pointer(syscall.StringBytePtr("LoadLibraryW"))),
    )
    
    if loadLibraryAddr == 0 {
        return fmt.Errorf("не удалось получить адрес LoadLibraryW")
    }

    hThread, _, err := createRemoteThread.Call(
        uintptr(hProcess),
        0,
        0,
        loadLibraryAddr,
        allocAddr,
        0,
        0,
    )
    
    if hThread == 0 {
        return fmt.Errorf("не удалось создать удаленный поток: %v", err)
    }
    defer closeHandle.Call(hThread)
    
    waitForSingleObject.Call(hThread, windows.INFINITE)
    
    return nil
}

func InjectPlugins(pid int, exePath string) {
	gameDir := filepath.Dir(exePath)
	pluginsDir := filepath.Join(gameDir, "preloading_plugins")
    handle, _ := getProcessHandle(uint32(pid))

    if DirExists(pluginsDir) {
		files, _ := ioutil.ReadDir(pluginsDir)

		for _, file := range files {
			filename := file.Name()
			if strings.HasSuffix(strings.ToLower(filename), ".dll") || strings.HasSuffix(strings.ToLower(filename), ".asi") {
                fullPath := filepath.Join(pluginsDir, filename)
                _ = InjectDLL(handle, fullPath)
			}
		}
	}

}