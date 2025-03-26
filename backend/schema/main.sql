-- Create the tags table with additional constraints
CREATE TABLE tags (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL CHECK (length(name) > 0 AND length(name) <= 255),
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL 
        CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),  -- Enforces URL-friendly slug format
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the questions table with additional constraints
CREATE TABLE questions (
    id SERIAL PRIMARY KEY,
    question TEXT NOT NULL 
        CHECK (length(question) > 0 AND length(question) <= 1000),  -- Adds length validation
    answer TEXT 
        CHECK (answer IS NULL OR length(answer) > 0),  -- Ensures non-empty answer if provided
    tag_id INTEGER NOT NULL,
    votes_up INTEGER DEFAULT 0 CHECK (votes_up >= 0),  -- Ensures non-negative votes
    votes_down INTEGER DEFAULT 0 CHECK (votes_down >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- Optional: Create an index to improve query performance
CREATE INDEX idx_questions_tag_id ON questions(tag_id);