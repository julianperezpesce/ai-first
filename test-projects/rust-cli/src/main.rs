use std::env;
use std::fs;

struct Config {
    name: String,
    version: String,
}

impl Config {
    fn new() -> Self {
        Config {
            name: env::var("APP_NAME").unwrap_or_else(|_| "rust-cli".to_string()),
            version: "1.0.0".to_string(),
        }
    }
    
    fn run(&self) {
        println!("Running {} v{}", self.name, self.version);
        self.process_files();
    }
    
    fn process_files(&self) {
        let path = ".";
        if let Ok(entries) = fs::read_dir(path) {
            for entry in entries.filter_map(Result::ok) {
                println!("{:?}", entry.path());
            }
        }
    }
}

fn main() {
    let config = Config::new();
    config.run();
}
