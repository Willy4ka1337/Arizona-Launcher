package main

import (
	"encoding/json"
	"io"
	"net/http"
	"sort"
)

type Server struct {
	Number     			 int    `json:"number"`
	Name       			 string `json:"name"`
	IP         			 string `json:"ip"`
	Port       			 int    `json:"port"`
	Online     			 int    `json:"online"`
	MaxPlayers 			 int    `json:"maxplayers"`
	Password   			 bool   `json:"password"`
	Icon       			 string `json:"icon"`
	DonateMultiplier     int    `json:"donateMultiplier"`
	ExperienceMultiplier int    `json:"experienceMultiplier"`
}

type ArizonaInfo struct {
	Arizona []Server `json:"arizona"`
}

const (
	ArizonaServersListURL string = "https://api.arizona-five.com/launcher/servers"
)

func getServersData() (ArizonaInfo, error) {
	var servers ArizonaInfo
	resp, err := http.Get(ArizonaServersListURL)
	if err != nil {
		return servers, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
    if err != nil {
        return servers, err
    }
    err = json.Unmarshal(body, &servers)
    if err == nil {
        sort.Slice(servers.Arizona, func(a, b int) bool {
			return servers.Arizona[a].Number < servers.Arizona[b].Number
		})
    }
	return servers, err
}