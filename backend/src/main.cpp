#include <crow.h>
#include <nlohmann/json.hpp>
#include "database_service.h"
#include "routes.h"

// Load environment variables
#include <cstdlib>
#include <fstream>

std::string loadEnvironmentVariable(const std::string& key) {
    const char* value = std::getenv(key.c_str());
    if (value) return std::string(value);
    
    // Fallback to .env file
    std::ifstream envFile(".env");
    std::string line;
    while (std::getline(envFile, line)) {
        size_t delimiterPos = line.find('=');
        if (delimiterPos != std::string::npos) {
            std::string envKey = line.substr(0, delimiterPos);
            std::string envValue = line.substr(delimiterPos + 1);
            if (envKey == key) return envValue;
        }
    }
    
    throw std::runtime_error("Environment variable not found: " + key);
}

int main() {
    // Load database connection string from environment
    std::string dbConnectionString = loadEnvironmentVariable("DATABASE_URL");

    // Initialize Database Service with PostgreSQL connection string
    DatabaseService dbService(dbConnectionString);

    // Create Crow app
    crow::SimpleApp app;

    // Setup routes with Database service
    setupRoutes(app, dbService);

    // Configure and run server
    app.port(8000)
       .multithreaded()
       .run();

    return 0;
}