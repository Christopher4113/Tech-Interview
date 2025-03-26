#ifndef DATABASE_SERVICE_H
#define DATABASE_SERVICE_H

#include <memory>
#include <string>
#include <vector>
#include <optional>
#include <pqxx/pqxx>
#include "models.h"

class DatabaseService {
public:
    DatabaseService(const std::string& dbConnectionString);

    // Tags methods
    std::vector<Tag> getAllTags();
    std::optional<Tag> getTagBySlug(const std::string& slug);
    std::string insertTag(const Tag& tag);
    bool tagExists(int tagId);

    // Questions methods
    std::vector<Question> getQuestionsByTagId(const std::string& tagId);
    std::optional<Question> getQuestionById(const std::string& questionId);
    std::string insertQuestion(const Question& question);
    bool updateQuestion(const Question& question);

private:
    std::string connectionString;
};

#endif // DATABASE_SERVICE_H
