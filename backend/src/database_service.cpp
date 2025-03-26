#include "database_service.h"
#include <iostream>
#include <pqxx/pqxx>

DatabaseService::DatabaseService(const std::string& dbConnectionString)
    : connectionString(dbConnectionString) {}

std::vector<Tag> DatabaseService::getAllTags() {
    std::vector<Tag> tags;
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        pqxx::result res = txn.exec("SELECT id, name, description, slug FROM tags");
        
        for (const auto& row : res) {
            Tag tag;
            tag.id = row["id"].as<std::string>();
            tag.name = row["name"].as<std::string>();
            tag.description = row["description"].as<std::string>();
            tag.slug = row["slug"].as<std::string>();
            tags.push_back(tag);
        }
        txn.commit();
    } catch (const std::exception& e) {
        std::cerr << "Error fetching tags: " << e.what() << std::endl;
    }
    return tags;
}
 
bool DatabaseService::tagExists(int tagId) {
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        pqxx::result res = txn.exec_params("SELECT COUNT(*) FROM tags WHERE id = $1", tagId);
        
        int count = res[0][0].as<int>();
        return count > 0;
    } catch (const std::exception& e) {
        std::cerr << "Error checking tag existence: " << e.what() << std::endl;
        return false;
    }
}

std::optional<Tag> DatabaseService::getTagBySlug(const std::string& slug) {
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        pqxx::result res = txn.exec_params("SELECT id, name, description FROM tags WHERE slug = $1", slug);
        
        if (!res.empty()) {
            Tag tag;
            tag.id = res[0]["id"].as<std::string>();
            tag.name = res[0]["name"].as<std::string>();
            tag.description = res[0]["description"].as<std::string>();
            tag.slug = slug;
            return tag;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error fetching tag by slug: " << e.what() << std::endl;
    }
    return std::nullopt;
}

std::string DatabaseService::insertTag(const Tag& tag) {
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        txn.exec_params("INSERT INTO tags (name, description, slug) VALUES ($1, $2, $3)", tag.name, tag.description, tag.slug);
        txn.commit();
        return "Success";
    } catch (const std::exception& e) {
        std::cerr << "Error inserting tag: " << e.what() << std::endl;
    }
    return "Failure";
}

std::vector<Question> DatabaseService::getQuestionsByTagId(const std::string& tagId) {
    std::vector<Question> questions;
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        pqxx::result res = txn.exec_params("SELECT id, question, answer, votes_up, votes_down FROM questions WHERE tag_id = $1", tagId);
        
        for (const auto& row : res) {
            Question question;
            question.id = row["id"].as<std::string>();
            question.tagId = tagId;
            question.question = row["question"].as<std::string>();
            question.answer = row["answer"].as<std::string>();
            question.votesUp = row["votes_up"].as<int>();
            question.votesDown = row["votes_down"].as<int>();
            questions.push_back(question);
        }
        txn.commit();
    } catch (const std::exception& e) {
        std::cerr << "Error fetching questions: " << e.what() << std::endl;
    }
    return questions;
}

std::optional<Question> DatabaseService::getQuestionById(const std::string& questionId) {
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        pqxx::result res = txn.exec_params("SELECT tag_id, question, answer, votes_up, votes_down FROM questions WHERE id = $1", questionId);
        
        if (!res.empty()) {
            Question question;
            question.id = questionId;
            question.tagId = res[0]["tag_id"].as<std::string>();
            question.question = res[0]["question"].as<std::string>();
            question.answer = res[0]["answer"].as<std::string>();
            question.votesUp = res[0]["votes_up"].as<int>();
            question.votesDown = res[0]["votes_down"].as<int>();
            return question;
        }
    } catch (const std::exception& e) {
        std::cerr << "Error fetching question: " << e.what() << std::endl;
    }
    return std::nullopt;
}

std::string DatabaseService::insertQuestion(const Question& question) {
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        
        // Safely convert tagId, handling potential conversion errors
        int tagId;
        try {
            tagId = std::stoi(question.tagId);
        } catch (const std::exception& e) {
            std::cerr << "Error converting tag ID: " << e.what() << std::endl;
            throw std::invalid_argument("Invalid tag ID format");
        }
        
        // Use parameterized query to insert the question and return the new ID
        pqxx::result res = txn.exec_params(
            "INSERT INTO questions (tag_id, question, answer, votes_up, votes_down) "
            "VALUES ($1, $2, $3, $4, $5) RETURNING id",
            tagId,
            question.question, 
            question.answer, 
            question.votesUp, 
            question.votesDown
        );
        
        txn.commit();
        
        // Return the newly inserted question's ID
        return res[0]["id"].as<std::string>();
    } catch (const std::exception& e) {
        std::cerr << "Error inserting question: " << e.what() << std::endl;
        throw;  // Re-throw the exception to propagate the error
    }
}

bool DatabaseService::updateQuestion(const Question& question) {
    try {
        pqxx::connection conn(connectionString);
        pqxx::work txn(conn);
        txn.exec_params("UPDATE questions SET votes_up = $1, votes_down = $2 WHERE id = $3",
                        question.votesUp, question.votesDown, question.id);
        txn.commit();
        return true;
    } catch (const std::exception& e) {
        std::cerr << "Error updating question: " << e.what() << std::endl;
    }
    return false;
}
