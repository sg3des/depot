package controllers

import (
	"encoding/json"
	"fmt"
	"html"
	"io/ioutil"
)

type tDocument struct {
	Filename string
	Data     string
}

func (c *Controller) Document() {
	file := c.PS.ByName("file")
	data, err := c.U.ReadFile(file)
	if err != nil {
		c.W.Write([]byte(err.Error()))
		return
	}
	tDocument := tDocument{file, html.UnescapeString(string(data))}
	c.Templates.ExecuteTemplate(c.W, "document", tDocument)
}

func (c *Controller) DocumentSave() {
	body, err := ioutil.ReadAll(c.R.Body)
	if err != nil {
		fmt.Println("save", err)
		return
	}

	var jdata map[string]string
	err = json.Unmarshal(body, &jdata)
	if err != nil {
		c.W.Write([]byte(err.Error()))
		return
	}

	data := html.EscapeString(jdata["text"])

	err = c.U.SaveFile([]byte(data), c.PS.ByName("file"))
	if err != nil {
		c.W.Write([]byte("save failed"))
		return
	}

	c.W.Write([]byte("save done"))
}
