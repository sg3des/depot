package user

import (
	"depot/packets/crypt"
	"fmt"
	"io/ioutil"
	"os"
	"path"
)

var (
	sep = string(os.PathSeparator)
)

type User struct {
	Dir  string
	User string
	Key  []byte
}

func (u *User) Permisions() (err error) {
	datadecrypt, err := u.ReadFile("test.enc")
	if err != nil {
		return
	}
	if string(datadecrypt) != u.User {
		err = fmt.Errorf("%s", "password incorrect")
	}
	return
}

func (u *User) ReadFile(file string) (datadecrypt []byte, err error) {
	data, err := ioutil.ReadFile(u.Dir + u.User + sep + file)
	if err != nil {
		return
	}

	datadecrypt, err = crypt.Decrypt(u.Key, data)
	if err != nil {
		return
	}
	return
}

func (u *User) SaveFile(data []byte, filename string) (err error) {
	dataenc, err := crypt.Encrypt(u.Key, data)
	if err != nil {
		return
	}
	err = ioutil.WriteFile(u.Dir+u.User+sep+filename, dataenc, 0755)
	if err != nil {
		return
	}
	return
}

type FileList struct {
	File string
	Type string
	Size int64
	Date string
}

func (u *User) List() (list []FileList, err error) {
	files, err := ioutil.ReadDir(u.Dir + u.User)
	for i := 0; i < len(files); i++ {
		if files[i].Name() == "test.enc" {
			continue
		}
		d := files[i].ModTime()

		datemod := fmt.Sprintf("%d %s %d", d.Day(), d.Month().String(), d.Year())

		filelist := FileList{files[i].Name(), Type(files[i].Name()), files[i].Size(), datemod}
		// fmt.Println(date)
		list = append(list, filelist)
	}
	return
}

func Type(file string) (t string) {
	switch path.Ext(file) {
	case ".csv":
		t = "spreadsheet"
		break
	default:
		t = "document"
		break
	}
	return
}
