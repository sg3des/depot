package cookie

import (
	"net/http"
	"time"
)

func Get(r *http.Request, name string) (value string) {
	value = ""
	if c, err := r.Cookie(name); err == nil {
		value = c.Value
	}
	return
}

func Set(w http.ResponseWriter, name, val string) {
	expiration := time.Now().Add(time.Hour)
	cookie := http.Cookie{Name: name, Path: "/", Value: val, Expires: expiration}
	http.SetCookie(w, &cookie)
}
