package main

import (
	"./packets/cookie"
	"fmt"
	"html/template"
	"io/ioutil"
	"net/http"
	"os"

	"github.com/julienschmidt/httprouter"
)

var (
	dtmpls = "/templates/"
	dassts = "/assets/"
	dimgs  = "/imgs/"
	dusers = "/users/"
	sep    = string(os.PathSeparator)

	Templates = template.Must(template.ParseGlob("." + dtmpls + "*"))

	Users = make(map[string]tUsers)
	err   error
)

type tUsers struct {
	User string
	Pass string
}

func main() {
	fmt.Println("start")

	router := httprouter.New()

	router.GET("/", Index)
	router.POST("/auth/", Auth)
	router.GET("/open/:file", Open)

	router.ServeFiles(dassts+"*filepath", http.Dir("."+dassts))
	router.ServeFiles(dimgs+"*filepath", http.Dir("."+dimgs))

	err = http.ListenAndServe(":8080", router)
	checkerr(err)

	fmt.Println("end")
}

func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	hash := cookie.Get(r, "hash")
	u, b := Users[hash]
	if len(hash) == 0 || !b {
		err = Templates.ExecuteTemplate(w, "index", nil)
		checkerr(err)
		return
	}

	list := []string{}
	files, err := ioutil.ReadDir("." + dusers + u.User)
	for i := 0; i < len(files); i++ {
		if files[i].Name() == "test.enc" {
			continue
		}
		list = append(list, files[i].Name())
	}

	err = Templates.ExecuteTemplate(w, "user", map[string][]string{"List": list})
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

}

func Auth(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {

	r.ParseForm()

	user := r.PostForm.Get("user")
	pass := r.PostForm.Get("pass")

	err = permisions(user, pass)
	if err != nil {
		w.Write([]byte("access denied"))
		return
	}

	hash := randString(32)
	Users[hash] = tUsers{user, pass}
	cookie.Set(w, "hash", hash)
	http.Redirect(w, r, "/", http.StatusFound)
	// Index(w, r, nil)
}

func Open(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
	var hash string
	if c, err := r.Cookie("hash"); err == nil {
		hash = c.Value
	}
	datadecrypt, err := readFile(Users[hash].User, Users[hash].Pass, ps.ByName("file"))
	if err != nil {
		w.Write([]byte(err.Error()))
		return
	}
	w.Write(datadecrypt)
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
