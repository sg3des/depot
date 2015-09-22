package controllers

import (
	"bufio"
	"depot/packets/user"
	"fmt"
	"github.com/julienschmidt/httprouter"
	"html/template"
	"net/http"
	"strings"
)

type Controller struct {
	W         http.ResponseWriter
	R         *http.Request
	PS        httprouter.Params
	Templates template.Template
	U         user.User
}

func (c *Controller) Upload() {
	fmt.Println("upload")

	err := c.R.ParseForm()
	if err != nil {
		fmt.Println("error parse form", err)
		http.Redirect(c.W, c.R, "/", http.StatusFound)
		return
	}

	file, header, err := c.R.FormFile("file")
	if err != nil {
		fmt.Println("error get file from request", err)
		http.Redirect(c.W, c.R, "/", http.StatusFound)
		return
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	data := strings.Join(lines, "\n")

	err = c.U.SaveFile([]byte(data), header.Filename)
	if err != nil {
		fmt.Println("error save file", err)
		http.Redirect(c.W, c.R, "/", http.StatusFound)
		return
	}

	http.Redirect(c.W, c.R, "/open/"+header.Filename, http.StatusFound)
}

func (c *Controller) Fff() {
	fmt.Println(c.W, c.PS.ByName("file"), c.U)
}
