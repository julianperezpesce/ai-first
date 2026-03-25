package main

import (
    "encoding/json"
    "net/http"
    "log"
    "fmt"
)

type User struct {
    ID    int    `json:"id"`
    Name  string `json:"name"`
    Email string `json:"email"`
}

func main() {
    http.HandleFunc("/users", handleUsers)
    log.Fatal(http.ListenAndServe(":8080", nil))
}

func handleUsers(w http.ResponseWriter, r *http.Request) {
    users := []User{
        {ID: 1, Name: "John", Email: "john@example.com"},
        {ID: 2, Name: "Jane", Email: "jane@example.com"},
    }
    
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(users)
}

func fetchUserData(userID int) (*User, error) {
    resp, err := http.Get(fmt.Sprintf("https://api.example.com/users/%d", userID))
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()
    
    var user User
    if err := json.NewDecoder(resp.Body).Decode(&user); err != nil {
        return nil, err
    }
    return &user, nil
}
