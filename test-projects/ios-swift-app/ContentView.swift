import SwiftUI

struct ContentView: View {
    @State private var users: [User] = []
    @State private var isLoading = false
    
    var body: some View {
        NavigationView {
            List(users) { user in
                NavigationLink(destination: DetailView(user: user)) {
                    UserRow(user: user)
                }
            }
            .navigationTitle("Users")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: fetchUsers) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
        }
    }
    
    func fetchUsers() {
        isLoading = true
        let url = URL(string: "https://api.example.com/users")!
        // Network call simulation
    }
}

struct User: Identifiable {
    let id: Int
    let name: String
    let email: String
}
