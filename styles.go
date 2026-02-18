package main

import (
	"encoding/json"
	"io"
	"net/http"
)

type Style struct {
	Id                  int `json:"id"`
	Name                string `json:"name"`
	BackgroundImage     string `json:"backgroundImage"`
	ForegroundImage     string `json:"foregroundImage"`
	BackgroundColor     string `json:"backgroundColor"`
	ServerColor         string `json:"serverColor"`
	ServerGradientStart string `json:"serverGradientStart"`
}

type Styles []Style

func GetStylesData() (Styles, error) {
	var styles Styles
	resp, err := http.Get("https://willy4ka.ru/resources/arzlauncher/styles.json")
	if err != nil {
		return styles, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return styles, err
	}
	err = json.Unmarshal(body, &styles)
	return styles, err
}