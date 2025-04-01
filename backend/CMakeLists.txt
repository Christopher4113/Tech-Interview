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

# Include directories for macOS
target_include_directories(server PRIVATE 
    /usr/local/include  # macOS Intel Homebrew path
    /opt/homebrew/include  # Apple Silicon Homebrew path
    ${NLOHMANN_JSON_INCLUDE_DIRS}
    ${PostgreSQL_INCLUDE_DIRS}
    ${PQXX_INCLUDE_DIRS}
    src
)

# Link directories for macOS
link_directories(
    /usr/local/lib
    /opt/homebrew/lib
    ${PQXX_LIBRARY_DIRS}
)

# Link libraries with explicit paths for macOS
target_link_libraries(server 
    ${PostgreSQL_LIBRARIES}
    /opt/homebrew/lib/libpqxx.dylib  # Using the symlink found in your system
    pthread
)

# Print debug information
message(STATUS "PostgreSQL_LIBRARIES: ${PostgreSQL_LIBRARIES}")
message(STATUS "PQXX_LIBRARIES: ${PQXX_LIBRARIES}")
message(STATUS "PQXX_LIBRARY_DIRS: ${PQXX_LIBRARY_DIRS}")
