package main

import (
	"fmt"
	"path/filepath"
	"runtime"
	"syscall"
	"time"
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

// auto kernel32Dll{ ::GetModuleHandleA(libKernel32Name) };
// if (!kernel32Dll) {
//     kernel32Dll = ::LoadLibraryA(libKernel32Name);
// }
// if (kernel32Dll) {
//     const auto loadLibraryAddr{ reinterpret_cast< LPTHREAD_START_ROUTINE >(::GetProcAddress(kernel32Dll, "LoadLibraryA")) };
//     if (loadLibraryAddr) {
//         const auto hThread{ ::CreateRemoteThread(pi.hProcess, nullptr, 0u, loadLibraryAddr, allocMem, 0u, nullptr) };
//         if (hThread) {
//             ::WaitForSingleObject(hThread, INFINITE);
//             ::CloseHandle(hThread);
//         }
//     }
// }

// func InjectDLL(hProcess windows.Handle, dllPath string) error {
// 	dllPath, _ = filepath.Abs(dllPath)
	
// 	kernel32Dll, _, _ := getModuleHandle.Call(libKernel32Name)
// 	if kernel32Dll == 0 {
// 		kernel32Dll, _, _ = LoadLibraryA.Call(libKernel32Name)
// 	}

// 	if kernel32Dll != 0 {
// 		loadLibraryAddr, _, _ := getProcAddress.Call(kernel32Dll, uintptr(unsafe.Pointer(syscall.StringBytePtr("LoadLibraryA"))))
// 		if loadLibraryAddr != 0 {
// 			size := (len(dllPath) + 1) * 2
// 			allocAddr, _, _ := virtualAllocEx.Call(uintptr(hProcess), 0, uintptr(size), uintptr(windows.MEM_COMMIT|windows.MEM_RESERVE), uintptr(windows.PAGE_READWRITE))
// 			hThread, _, _ := createRemoteThread.Call( uintptr(hProcess), 0, 0, loadLibraryAddr, allocAddr, 0, 0)
// 			if hThread != 0 {
// 				waitForSingleObject.Call(hThread, uintptr(windows.INFINITE))
// 				closeHandle.Call(hThread)
// 			}
// 		}
// 	}

// 	// dllPathW, err := syscall.UTF16PtrFromString(dllPath)
// 	// if err != nil {
// 	// 	return fmt.Errorf("ошибка конвертации пути: %w", err)
// 	// }

// 	// size := (len(dllPath) + 1) * 2
// 	// allocAddr, _, err := virtualAllocEx.Call(
// 	// 	uintptr(hProcess),
// 	// 	0,
// 	// 	uintptr(size),
// 	// 	uintptr(windows.MEM_COMMIT|windows.MEM_RESERVE),
// 	// 	uintptr(windows.PAGE_READWRITE),
// 	// )
// 	// if allocAddr == 0 {
// 	// 	return fmt.Errorf("не удалось выделить память: %w", err)
// 	// }
// 	// defer virtualFreeEx.Call(uintptr(hProcess), allocAddr, 0, uintptr(windows.MEM_RELEASE))

// 	// var bytesWritten uintptr
// 	// ret, _, err := writeProcessMemory.Call(
// 	// 	uintptr(hProcess),
// 	// 	allocAddr,
// 	// 	uintptr(unsafe.Pointer(dllPathW)),
// 	// 	uintptr(size),
// 	// 	uintptr(unsafe.Pointer(&bytesWritten)),
// 	// )
// 	// if ret == 0 {
// 	// 	return fmt.Errorf("не удалось записать в память: %w", err)
// 	// }

// 	// kernel32Handle, _, _ := getModuleHandle.Call()
// 	// if kernel32Handle == 0 {
// 	// 	return fmt.Errorf("не удалось получить handle kernel32.dll")
// 	// }

// 	// loadLibraryAddr, _, _ := getProcAddress.Call(
// 	// 	kernel32Handle,
// 	// 	uintptr(unsafe.Pointer(syscall.StringBytePtr("LoadLibraryW"))),
// 	// )
// 	// if loadLibraryAddr == 0 {
// 	// 	return fmt.Errorf("не удалось получить адрес LoadLibraryW")
// 	// }

// 	// hThread, _, err := createRemoteThread.Call(
// 	// 	uintptr(hProcess),
// 	// 	0,
// 	// 	0,
// 	// 	loadLibraryAddr,
// 	// 	allocAddr,
// 	// 	0,
// 	// 	0,
// 	// )

// 	// if hThread == 0 {
// 	// 	return fmt.Errorf("не удалось создать удаленный поток: %w", err)
// 	// }
// 	// defer closeHandle.Call(hThread)

// 	// waitForSingleObject.Call(hThread, uintptr(windows.INFINITE))

// 	return nil
// }

func InjectDLL(hProcess windows.Handle, dllPath string) error {
    // Конвертируем путь в абсолютный
    dllPath, _ = filepath.Abs(dllPath)
    
    // Конвертируем путь в UTF-16 для записи в память (Windows использует Unicode)
    dllPathUTF16, err := syscall.UTF16PtrFromString(dllPath)
    if err != nil {
        return fmt.Errorf("ошибка конвертации пути: %w", err)
    }
    
    // Выделяем память в удаленном процессе
    pathSize := (len(dllPath) + 1) * 2 // размер в байтах для UTF-16 строки с нуль-терминатором
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
    
    // Записываем путь DLL в выделенную память
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
    
    // Получаем адрес LoadLibraryW (используем W версию для Unicode)
    kernel32Handle, _, _ := getModuleHandle.Call(uintptr(unsafe.Pointer(syscall.StringBytePtr("kernel32.dll"))))
    if kernel32Handle == 0 {
        kernel32Handle, _, _ = LoadLibraryA.Call(uintptr(unsafe.Pointer(syscall.StringBytePtr("kernel32.dll"))))
    }
    
    if kernel32Handle == 0 {
        return fmt.Errorf("не удалось получить handle kernel32.dll")
    }
    
    loadLibraryAddr, _, _ := getProcAddress.Call(
        kernel32Handle,
        uintptr(unsafe.Pointer(syscall.StringBytePtr("LoadLibraryW"))), // Используем W версию
    )
    
    if loadLibraryAddr == 0 {
        return fmt.Errorf("не удалось получить адрес LoadLibraryW")
    }
    
    // Создаем удаленный поток для загрузки DLL
    hThread, _, err := createRemoteThread.Call(
        uintptr(hProcess),
        0,
        0,
        loadLibraryAddr,
        allocAddr, // Передаем адрес с путем DLL
        0,
        0,
    )
    
    if hThread == 0 {
        return fmt.Errorf("не удалось создать удаленный поток: %v", err)
    }
    defer closeHandle.Call(hThread)
    
    // Ждем завершения потока
    waitForSingleObject.Call(hThread, windows.INFINITE)
    
    return nil
}

func InjectPlugins(pid int, exePath string) {
	fmt.Println("Начало инжекции:", time.Now())
	fmt.Println("Архитектура:", runtime.GOARCH)
	
	gameDir := filepath.Dir(exePath)
	pluginsDir := filepath.Join(gameDir, "preloading_plugins")
	fullPath := filepath.Join(pluginsDir, "#ArizonaPatches.dll")

	handle, _ := getProcessHandle(uint32(pid))
	_ = InjectDLL(handle, fullPath)
	
	fmt.Println("Инжекция завершена:", time.Now())
}