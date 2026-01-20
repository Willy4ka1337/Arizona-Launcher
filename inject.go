package main

import (
	"io/ioutil"
	"strings"
	"syscall"
	"time"
	"unsafe"
)

const (
	PROCESS_CREATE_THREAD     = 0x0002
	PROCESS_QUERY_INFORMATION = 0x0400
	PROCESS_VM_OPERATION      = 0x0008
	PROCESS_VM_WRITE          = 0x0020
	PROCESS_VM_READ           = 0x0010

	MEM_COMMIT  = 0x1000
	MEM_RESERVE = 0x2000

	PAGE_READWRITE = 0x04

	INFINITE = 0xFFFFFFFF
)

var (
	kernel32           = syscall.NewLazyDLL("kernel32.dll")
	openProcess        = kernel32.NewProc("OpenProcess")
	getModuleHandle    = kernel32.NewProc("GetModuleHandleW")
	getProcAddress     = kernel32.NewProc("GetProcAddress")
	virtualAllocEx     = kernel32.NewProc("VirtualAllocEx")
	writeProcessMemory = kernel32.NewProc("WriteProcessMemory")
	createRemoteThread = kernel32.NewProc("CreateRemoteThread")
	waitForSingleObject = kernel32.NewProc("WaitForSingleObject")
	closeHandle        = kernel32.NewProc("CloseHandle")
)

func waitForProcess(processName string) uint32 {
	for {
		if pid, err := findProcessID(processName); err == nil && pid != 0 {
			return pid
		}
		time.Sleep(10 * time.Millisecond)
	}
}

func InjectDLLToProcess(pid uint32, dllPath string) error {
	processAccess := PROCESS_CREATE_THREAD | PROCESS_QUERY_INFORMATION |
		PROCESS_VM_OPERATION | PROCESS_VM_WRITE | PROCESS_VM_READ
	processHandle, _, _ := openProcess.Call(
		uintptr(processAccess),
		uintptr(0),
		uintptr(pid),
	)

	if processHandle == 0 {
		return syscall.GetLastError()
	}
	defer closeHandle.Call(processHandle)

	kernel32Handle, _, _ := getModuleHandle.Call(uintptr(unsafe.Pointer(syscall.StringToUTF16Ptr("kernel32.dll"))))
	if kernel32Handle == 0 {
		return syscall.GetLastError()
	}

	loadLibraryAddr, _, _ := getProcAddress.Call(
		kernel32Handle,
		uintptr(unsafe.Pointer(syscall.StringBytePtr("LoadLibraryA"))),
	)
	if loadLibraryAddr == 0 {
		return syscall.GetLastError()
	}

	dllPathBytes := append([]byte(dllPath), 0)
	allocSize := uintptr(len(dllPathBytes))

	remoteMemory, _, _ := virtualAllocEx.Call(
		processHandle,
		0,
		allocSize,
		MEM_COMMIT|MEM_RESERVE,
		PAGE_READWRITE,
	)

	if remoteMemory == 0 {
		return syscall.GetLastError()
	}

	var bytesWritten uintptr
	result, _, _ := writeProcessMemory.Call(
		processHandle,
		remoteMemory,
		uintptr(unsafe.Pointer(&dllPathBytes[0])),
		allocSize,
		uintptr(unsafe.Pointer(&bytesWritten)),
	)

	if result == 0 {
		return syscall.GetLastError()
	}

	threadHandle, _, _ := createRemoteThread.Call(
		processHandle,
		0,
		0,
		loadLibraryAddr,
		remoteMemory,
		0,
		0,
	)

	if threadHandle == 0 {
		return syscall.GetLastError()
	}
	defer closeHandle.Call(threadHandle)

	waitResult, _, _ := waitForSingleObject.Call(
		threadHandle,
		INFINITE,
	)

	if waitResult != 0 {
		return syscall.GetLastError()
	}

	return nil
}

func InjectPlugins(exePath string) {
	pid := waitForProcess("gta_sa.exe")

	gameDir := exePath
	if idx := strings.LastIndex(exePath, "\\gta_sa.exe"); idx != -1 {
		gameDir = exePath[:idx]
	}

	plugins := gameDir + "\\preloading_plugins"
	if DirExists(plugins) {
		files, err := ioutil.ReadDir(plugins)
		if err != nil {
			return
		}

		for _, file := range files {
			filename := file.Name()
			if strings.HasSuffix(strings.ToLower(filename), ".dll") || strings.HasSuffix(strings.ToLower(filename), ".asi") {
				_ = InjectDLLToProcess(pid, plugins+"\\"+filename)
			}
		}
	}
}

func findProcessID(processName string) (uint32, error) {
	kernel32 := syscall.NewLazyDLL("kernel32.dll")
	createToolhelp32Snapshot := kernel32.NewProc("CreateToolhelp32Snapshot")
	process32First := kernel32.NewProc("Process32FirstW")
	process32Next := kernel32.NewProc("Process32NextW")
	closeHandle := kernel32.NewProc("CloseHandle")

	const TH32CS_SNAPPROCESS = 0x00000002

	snapshot, _, _ := createToolhelp32Snapshot.Call(TH32CS_SNAPPROCESS, 0)
	if snapshot == uintptr(syscall.InvalidHandle) {
		return 0, syscall.GetLastError()
	}
	defer closeHandle.Call(snapshot)

	type PROCESSENTRY32 struct {
		Size              uint32
		Usage             uint32
		ProcessID         uint32
		DefaultHeapID     uintptr
		ModuleID          uint32
		Threads           uint32
		ParentProcessID   uint32
		PriClassBase      int32
		Flags             uint32
		ExeFile           [260]uint16
	}

	var processEntry PROCESSENTRY32
	processEntry.Size = uint32(unsafe.Sizeof(processEntry))

	result, _, _ := process32First.Call(snapshot, uintptr(unsafe.Pointer(&processEntry)))
	if result == 0 {
		return 0, syscall.GetLastError()
	}

	for {
		exeName := syscall.UTF16ToString(processEntry.ExeFile[:])
		if strings.EqualFold(exeName, processName) {
			return processEntry.ProcessID, nil
		}

		result, _, _ := process32Next.Call(snapshot, uintptr(unsafe.Pointer(&processEntry)))
		if result == 0 {
			break
		}
	}

	return 0, syscall.ENOENT
}