package main

import (
	"fmt"
	"html/template"
	"net/http"
	"os"
	"reflect"

	"depot/controllers"
	// "depot/controllers/document"
	// "depot/controllers/spreadsheet"
	"depot/packets/cookie"
	"depot/packets/crypt"
	"depot/packets/user"
	"github.com/julienschmidt/httprouter"
)

var (
	dtmpls = "./templates/"
	dassts = "/assets/"
	dimgs  = "/imgs/"
	dusers = "./users/"
	sep    = string(os.PathSeparator)

	Templates = template.Must(template.ParseGlob(dtmpls + "*"))
	err       error

	Users = make(map[string]user.User)
	u     user.User

	C = controllers.Controller{}
)

func main() {
	fmt.Println("start")

	router := httprouter.New()

	router.GET("/", Index)
	router.POST("/auth/", Auth)

	router.GET("/spreadsheet/:file", Route("Spreadsheet"))
	router.POST("/spreadsheet/:file", Route("SpreadsheetSave"))

	router.GET("/document/:file", Route("Document"))
	router.POST("/document/:file", Route("DocumentSave"))

	router.POST("/upload/", Route("Upload"))

	router.ServeFiles(dassts+"*filepath", http.Dir("."+dassts))
	router.ServeFiles(dimgs+"*filepath", http.Dir("."+dimgs))

	err = http.ListenAndServe(":8080", router)
	checkerr(err)

	fmt.Println("end")
}

func Index(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Println("Index")

	hash := cookie.Get(r, "hash")
	u, b := Users[hash]
	if len(hash) == 0 || !b {
		err = Templates.ExecuteTemplate(w, "index", nil)
		checkerr(err)
		return
	}

	list, err := u.List()
	if err != nil {
		fmt.Println(err)
		return
	}

	err = Templates.ExecuteTemplate(w, "list", map[string][]user.FileList{"List": list})
	if err != nil {
		fmt.Println(err)
		return
	}
}

func Auth(w http.ResponseWriter, r *http.Request, _ httprouter.Params) {
	fmt.Println("Auth")
	r.ParseForm()

	hash := crypt.RandString(32)
	guser := r.PostForm.Get("user")
	gpass := r.PostForm.Get("pass")
	key := crypt.Getkey(guser, gpass)

	u := user.User{dusers, guser, key}
	Users[hash] = u

	err = u.Permisions()
	if err != nil {
		fmt.Println(err)
		w.Write([]byte("access denied"))
		delete(Users, hash)
		return
	}

	cookie.Set(w, "hash", hash)
	http.Redirect(w, r, "/", http.StatusFound)
}

func Route(name string) httprouter.Handle {
	return func(w http.ResponseWriter, r *http.Request, ps httprouter.Params) {
		hash := cookie.Get(r, "hash")
		u, b := Users[hash]
		if len(hash) == 0 || !b {
			http.Redirect(w, r, "/", http.StatusFound)
			return
		}

		c := controllers.Controller{w, r, ps, *Templates, u}
		methodVal := reflect.ValueOf(&c).MethodByName(name)
		methodIface := methodVal.Interface()
		method := methodIface.(func())
		method()
		fmt.Println(name)
	}
}

func checkerr(err error) {
	if err != nil {
		fmt.Println(err)
	}
}
