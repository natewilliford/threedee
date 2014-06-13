package main

import (
	"image"
	"image/color"
)

func main() {
	m := image.NewRGBA(image.Rect(0, 0, 640, 480))
	m.Set(5, 5, color.RGBA{255, 0, 0, 255})
}
