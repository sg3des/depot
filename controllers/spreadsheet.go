package controllers

import (
	"encoding/json"
	"fmt"
	"html"
	"io/ioutil"
	"regexp"
	"strings"
)

var Alphabet = map[int]string{0: "A", 1: "B", 2: "C", 3: "D", 4: "E", 5: "F", 6: "G", 7: "H", 8: "I", 9: "J", 10: "K", 11: "L", 12: "M", 13: "N", 14: "O", 15: "P", 16: "Q", 17: "R", 18: "S", 19: "T", 20: "U", 21: "V", 22: "W", 23: "X", 24: "Y", 25: "Z"}

var Al = map[string]string{"0": "A"}

type tSpreadSheet struct {
	Filename string
	Data     map[int][]string
	Alphabet map[int]string
}

func (c *Controller) Spreadsheet() {
	file := c.PS.ByName("file")
	data, err := c.U.ReadFile(file)
	if err != nil {
		c.W.Write([]byte(err.Error()))
		return
	}

	rows := regexp.MustCompile("\r\n|\r|\n").Split(string(data), -1)

	tSpreadSheet := &tSpreadSheet{file, make(map[int][]string), Alphabet}
	for i := 0; i < len(rows); i++ {
		rows[i] = strings.Trim(rows[i], "\"")
		tSpreadSheet.Data[i] = regexp.MustCompile("\";\"").Split(rows[i], -1)
		for j := 0; j < len(tSpreadSheet.Data[i]); j++ {
			tSpreadSheet.Data[i][j] = html.UnescapeString(tSpreadSheet.Data[i][j])
		}
	}

	err = c.Templates.ExecuteTemplate(c.W, "spreadsheet", tSpreadSheet)
	if err != nil {
		fmt.Println(err)
	}
}

func (c *Controller) SpreadsheetSave() {
	body, err := ioutil.ReadAll(c.R.Body)
	if err != nil {
		fmt.Println("save", err)
		return
	}
	var data []byte

	data, err = savePrepareTable(body)
	if err != nil {
		c.W.Write([]byte("parse table for save failed"))
		return
	}

	err = c.U.SaveFile(data, c.PS.ByName("file"))
	if err != nil {
		c.W.Write([]byte("save failed"))
		return
	}

	c.W.Write([]byte("save done"))
}

func savePrepareTable(body []byte) (data []byte, err error) {
	var jdata map[string][]string
	err = json.Unmarshal(body, &jdata)
	if err != nil {
		fmt.Println("save", err)
		return
	}

	var sdata []string
	for i := 0; i < len(jdata); i++ {
		si := fmt.Sprintf("%d", i)
		for i := 0; i < len(jdata[si]); i++ {
			jdata[si][i] = html.EscapeString(jdata[si][i])
		}
		sdata = append(sdata, "\""+strings.Join(jdata[si], "\";\"")+"\"")
	}
	data = []byte(strings.Join(sdata, "\r\n"))
	return
}
