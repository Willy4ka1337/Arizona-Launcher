package main

import (
	"io/ioutil"
	"log"
	"strings"
	"syscall"
	"unsafe"

	"golang.org/x/sys/windows"
)

var (
	modkernel32            = syscall.NewLazyDLL("kernel32.dll")
	procVirtualAllocEx     = modkernel32.NewProc("VirtualAllocEx")
	procVirtualFreeEx      = modkernel32.NewProc("VirtualFreeEx")
	procWriteProcessMemory = modkernel32.NewProc("WriteProcessMemory")
	procCreateRemoteThread = modkernel32.NewProc("CreateRemoteThread")
)

const PROCESS_ALL_ACCESS = 0x1F0FFF

func injectDLL(dllPath string) {
	processID, err := FindProcessID("gta_sa.exe")
	pId := uintptr(processID)
	kernel32 := windows.NewLazyDLL("kernel32.dll")

	pHandle, err := windows.OpenProcess(windows.PROCESS_CREATE_THREAD|windows.PROCESS_VM_OPERATION|windows.PROCESS_VM_WRITE|windows.PROCESS_VM_READ|windows.PROCESS_QUERY_INFORMATION, false, uint32(pId))
	if err != nil {
		log.Fatal(err)
	}

	VirtualAllocEx := kernel32.NewProc("VirtualAllocEx")
	vAlloc, _, err := VirtualAllocEx.Call(uintptr(pHandle), 0, uintptr(len(dllPath)+1), windows.MEM_RESERVE|windows.MEM_COMMIT, windows.PAGE_EXECUTE_READWRITE)
	
	bPtrDpath, err := windows.BytePtrFromString(dllPath)
	if err != nil {
		log.Fatal(err)
	}

	Zero := uintptr(0)
	err = windows.WriteProcessMemory(pHandle, vAlloc, bPtrDpath, uintptr(len(dllPath)+1), &Zero)
	if err != nil {
		log.Fatal(err)
	}
	
	LoadLibAddr, err := syscall.GetProcAddress(syscall.Handle(kernel32.Handle()), "LoadLibraryA")
	if err != nil {
		log.Fatal(err)
	}

	tHandle, _, _ := kernel32.NewProc("CreateRemoteThread").Call(uintptr(pHandle), 0, 0, LoadLibAddr, vAlloc, 0, 0)
	defer syscall.CloseHandle(syscall.Handle(tHandle))
}

func FindProcessID(processName string) (uint32, error) {
	const TH32CS_SNAPPROCESS = 0x00000002

	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	createToolhelp32Snapshot := kernel32.NewProc("CreateToolhelp32Snapshot")
	process32First := kernel32.NewProc("Process32FirstW")
	process32Next := kernel32.NewProc("Process32NextW")

	type ProcessEntry32 struct {
		Size              uint32
		CntUsage          uint32
		ProcessID         uint32
		DefaultHeapID     uintptr
		ModuleID          uint32
		CntThreads        uint32
		ParentProcessID   uint32
		PriorityClassBase int32
		Flags             uint32
		ExeFile           [260]uint16
	}

	snapshot, _, err := createToolhelp32Snapshot.Call(TH32CS_SNAPPROCESS, 0)
	if snapshot == 0 {
		return 0, err
	}
	defer syscall.CloseHandle(syscall.Handle(snapshot))

	var pe32 ProcessEntry32
	pe32.Size = uint32(unsafe.Sizeof(pe32))

	ret, _, err := process32First.Call(snapshot, uintptr(unsafe.Pointer(&pe32)))
	if ret == 0 {
		return 0, err
	}

	for {
		exeName := ""
		for i := 0; i < 260 && pe32.ExeFile[i] != 0; i++ {
			exeName += string(rune(pe32.ExeFile[i]))
		}

		if exeName == processName {
			return pe32.ProcessID, nil
		}

		ret, _, _ := process32Next.Call(snapshot, uintptr(unsafe.Pointer(&pe32)))
		if ret == 0 {
			break
		}
	}

	return 0, syscall.ERROR_NOT_FOUND
}

func InjectPlugins(exePath string) {
	gameDir := exePath
	if idx := strings.LastIndex(exePath, "gta_sa.exe"); idx != -1 {
		gameDir = exePath[:idx]
	}

	plugins := gameDir + "preloading_plugins"
	if DirExists(plugins) {
		files, _ := ioutil.ReadDir(plugins)

		for _, file := range files {
			filename := file.Name()
			if strings.HasSuffix(strings.ToLower(filename), ".dll") || strings.HasSuffix(strings.ToLower(filename), ".asi") {
				fullPath := plugins + filename
				injectDLL(fullPath)
			}
		}
	}
}