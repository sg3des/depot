package main

import (
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"
	"strings"
	"time"
)

var (
	dtmpls = "/templates/"
	dassts = "/assets/"
	dimgs  = "/imgs/"
	dusers = "/users/"
	sep    = string(os.PathSeparator)

	Templates = template.Must(template.ParseGlob("." + dtmpls + "*"))

	err error
)

func main() {
	fmt.Println("start")

	mux := http.NewServeMux()
	mux.Handle(dassts, http.StripPrefix(dassts, http.FileServer(http.Dir("."+dassts))))
	mux.Handle(dimgs, http.StripPrefix(dimgs, http.FileServer(http.Dir("."+dimgs))))
	mux.HandleFunc("/", index)
	mux.HandleFunc(dusers, user)
	err = http.ListenAndServe(":8081", mux)
	checkerr(err)

	fmt.Println("end")
}

func index(w http.ResponseWriter, r *http.Request) {
	fmt.Println("index")
	err = Templates.ExecuteTemplate(w, "index", nil)
	checkerr(err)
}

type tmplUser struct {
	List []string
}

func user(w http.ResponseWriter, r *http.Request) {
	err := r.ParseForm()
	if err != nil {
		w.Write([]byte(err.Error()))
		return
	}

	user := r.PostForm.Get("user")
	pass := r.PostForm.Get("pass")

	if len(user) == 0 {
		if c, err := r.Cookie("user"); err == nil {
			user = c.Value
		}
		if c, err := r.Cookie("pass"); err == nil {
			pass = c.Value
		}
	}

	err = permisions(user, pass)
	if err != nil {
		w.Write([]byte("access denied"))
		return
	}

	expiration := time.Now().Add(time.Hour)
	cookie := http.Cookie{Name: "user", Value: user, Expires: expiration}
	http.SetCookie(w, &cookie)

	cookie = http.Cookie{Name: "pass", Value: pass, Expires: expiration}
	http.SetCookie(w, &cookie)

	file := strings.Replace(r.URL.String(), dusers, "", 1)
	if len(file) == 0 {
		list := []string{}
		files, err := ioutil.ReadDir("." + dusers + user)
		for i := 0; i < len(files); i++ {
			if files[i].Name() == "test.enc" {
				continue
			}
			list = append(list, files[i].Name())
		}

		var data = &tmplUser{list}
		err = Templates.ExecuteTemplate(w, "user", data)
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
	} else {
		datadecrypt, err := readFile(user, pass, file)
		if err != nil {
			w.Write([]byte(err.Error()))
			return
		}
		w.Write(datadecrypt)
	}
}

func readFile(user, pass string, file string) (datadecrypt []byte, err error) {
	key := make([]byte, 64)
	key = append([]byte(user), key...)
	key = append([]byte(pass), key...)
	switch {
	case len(pass) <= 16:
		key = key[:16]
	case 32 >= len(pass) && len(pass) > 16:
		key = key[:32]
	case 64 >= len(pass) && len(pass) > 32:
		key = key[:64]
	}
	data, err := ioutil.ReadFile("." + dusers + user + sep + file)
	if err != nil {
		return
	}

	datadecrypt, err = decrypt(key, data)
	if err != nil {
		return
	}

	return
}

func permisions(user, pass string) (err error) {
	datadecrypt, err := readFile(user, pass, "test.enc")
	if err != nil {
		return
	}

	if string(datadecrypt) != user {
		err = fmt.Errorf("%s", "password incorrect")
	}

	return
}

func checkerr(err error) {
	if err != nil {
		panic(err)
	}
}
