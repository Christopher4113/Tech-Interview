cmake_minimum_required(VERSION 3.10)
project(PostgreSQLBackend)

set(CMAKE_CXX_STANDARD 17)

# Enable PkgConfig support
find_package(PkgConfig REQUIRED)

# Find required packages
find_package(PostgreSQL REQUIRED)
pkg_check_modules(NLOHMANN_JSON REQUIRED nlohmann_json)
pkg_check_modules(PQXX REQUIRED libpqxx)

# Add executable
add_executable(server 
    src/main.cpp 
    src/database_service.cpp 
    src/routes.cpp
)

# Include directories
target_include_directories(server PRIVATE 
    /usr/include  # Crow
    ${NLOHMANN_JSON_INCLUDE_DIRS}  # JSON from pkg-config
    ${PostgreSQL_INCLUDE_DIRS}  # PostgreSQL
    ${PQXX_INCLUDE_DIRS}
    src
)

# Link libraries
target_link_libraries(server 
    ${PostgreSQL_LIBRARIES}  # PostgreSQL
    ${PQXX_LIBRARIES}
    pthread
)
