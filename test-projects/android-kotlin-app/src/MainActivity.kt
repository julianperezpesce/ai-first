package com.example.myapp

import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import kotlinx.android.synthetic.main.activity_main.*

class MainActivity : AppCompatActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        button.setOnClickListener {
            val intent = android.content.Intent(this, DetailActivity::class.java)
            intent.putExtra("user_id", 123)
            startActivity(intent)
        }
    }
    
    fun fetchUserData(userId: Int): User {
        return User(userId, "John Doe", "john@example.com")
    }
}

data class User(val id: Int, val name: String, val email: String)

class DetailActivity : AppCompatActivity() {
    private lateinit var viewModel: UserViewModel
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        viewModel = UserViewModel()
    }
}

class UserViewModel {
    val userLiveData = MutableLiveData<User>()
}
