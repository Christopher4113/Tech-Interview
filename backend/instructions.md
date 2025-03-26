# Backend Development Setup

## Getting this to run on Windows is painful, so that's why the below instructions are for Linux

## Prerequisites

- **Ubuntu x64 (or WSL on Windows)**
- **C++ Compiler** (`g++`)
- **CMake** (version 3.10+)
- **PostgreSQL** (Ensure the database is set up and running)
- **Crow Framework** (for handling routes)
- **nlohmann/json** (for JSON parsing)
- **libpqxx** (for PostgreSQL connectivity)

## Setting Up the Database

1. Start PostgreSQL and create the database:

```sh
sudo -u postgres psql
```

2. Run the following SQL commands:

```sql
CREATE DATABASE my_database;
CREATE USER my_user WITH ENCRYPTED PASSWORD 'my_password';
GRANT ALL PRIVILEGES ON DATABASE my_database TO my_user;
```

3. Exit PostgreSQL and apply schema:

```sh
psql -U my_user -d my_database -f main.sql
```

You might have to move main.sql to a desired path, or locate to the one found in this directory

## Building the Backend

1. Navigate to the `backend` directory:

```sh
cd backend
```

2. Create a `build` directory and run CMake:

```sh
mkdir build && cd build
cmake ..
make
```

## Running the Backend

Run the compiled server:

```sh
./server
```

By default, the backend should be running on `http://127.0.0.1:8080`

## API Endpoints

### Tags

- **GET /api/tags** 
  - Fetch all tags
  - Response: List of tags with `id`, `name`, `description`, and `slug`

### Questions

- **POST /api/questions** 
  - Create a new question
  - Request Body:
    ```json
    {
      "question": "What is the capital of France?",
      "answer": "Paris",
      "tagId": "1",
      "votesUp": 0,
      "votesDown": 0
    }
    ```
  - Response: Created question object with generated ID

- **GET /api/questions/tag/slug/{slug}**
  - Retrieve questions for a specific tag
  - Example: `/api/questions/tag/slug/general-knowledge`
  - Response: 
    ```json
    {
      "questions": [
        {
          "id": "1",
          "question": "What is the capital of France?",
          "answer": "Paris",
          "tagId": "1",
          "votesUp": 0,
          "votesDown": 0
        }
      ]
    }
    ```

- **PUT /api/questions/{questionId}/vote** 
  - Vote on a question
  - Request Body:
    ```json
    {
      "voteType": "up"
    }
    ```
  - Response: Updated question object with new vote counts

## Testing the API (you can use curl, but I just use postman)

### Inserting a Tag
```bash
curl -X POST http://localhost:8000/api/tags \
     -H "Content-Type: application/json" \
     -d '{
         "name": "Geography",
         "description": "Questions about world geography",
         "slug": "geography"
     }'
```

### Inserting a Question
```bash
curl -X POST http://localhost:8000/api/questions \
     -H "Content-Type: application/json" \
     -d '{
         "question": "What is the capital of France?",
         "answer": "Paris",
         "tagId": "1",
         "votesUp": 0,
         "votesDown": 0
     }'
```

### Voting on a Question
```bash
curl -X PUT http://localhost:8000/api/questions/1/vote \
     -H "Content-Type: application/json" \
     -d '{"voteType": "up"}'
```