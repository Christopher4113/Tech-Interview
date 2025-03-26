#include "routes.h"
#include <nlohmann/json.hpp>

using json = nlohmann::json;

void setupRoutes(crow::SimpleApp& app, DatabaseService& dbService) {
    // CORS middleware
    auto corsMiddleware = [](crow::request& req, crow::response& res) {
        res.set_header("Access-Control-Allow-Origin", "*");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    };

    // GET /api/tags - Get all tags
    CROW_ROUTE(app, "/api/tags")
    .methods("GET"_method)
    ([&](const crow::request& req) {
        crow::response res;
        corsMiddleware(const_cast<crow::request&>(req), res);
        
        auto tags = dbService.getAllTags();  // Query the database for all tags
        json responseJson = {
            {"tags", json::array()}
        };

        for (const auto& tag : tags) {
            responseJson["tags"].push_back({
                {"id", tag.id},
                {"name", tag.name},
                {"description", tag.description},
                {"slug", tag.slug}
            });
        }

        res.body = responseJson.dump();
        res.set_header("Content-Type", "application/json");
        return res;
    });

    // GET /api/questions/tag/slug/:slug - Get questions by tag slug
    CROW_ROUTE(app, "/api/questions/tag/slug/<string>")
    .methods("GET"_method)
    ([&](const crow::request& req, const std::string& tagSlug) {
        crow::response res;
        
        try {
            // Check if tag exists by slug
            auto tagOpt = dbService.getTagBySlug(tagSlug);
            if (!tagOpt) {
                res.code = 404;
                res.body = json{{"error", "Tag not found"}}.dump();
                return res;
            }

            // Get questions for this tag
            auto questions = dbService.getQuestionsByTagId(tagOpt->id);
            
            json responseJson = {
                {"questions", json::array()}
            };

            for (const auto& question : questions) {
                responseJson["questions"].push_back({
                    {"id", question.id},
                    {"question", question.question},
                    {"answer", question.answer},
                    {"tagId", question.tagId},
                    {"votesUp", question.votesUp},
                    {"votesDown", question.votesDown}
                });
            }

            res.body = responseJson.dump();
            res.set_header("Content-Type", "application/json");
        } catch (const std::exception& e) {
            res.code = 500;
            res.body = json{{"error", "Internal server error"}}.dump();
        }

        return res;
    });

    // PUT /api/questions/:questionId/vote - Vote on a question
    CROW_ROUTE(app, "/api/questions/<string>/vote")
    .methods("PUT"_method)
    ([&](const crow::request& req, const std::string& questionId) {
        crow::response res;
        
        try {
            auto jsonBody = json::parse(req.body);
            std::string voteType = jsonBody["voteType"];

            auto questionOpt = dbService.getQuestionById(questionId);  // Retrieve question from DB
            if (!questionOpt) {
                res.code = 404;
                res.body = json{{"error", "Question not found"}}.dump();
                return res;
            }

            Question question = *questionOpt;
            if (voteType == "up") {
                question.votesUp++;
            } else if (voteType == "down") {
                question.votesDown++;
            }

            dbService.updateQuestion(question);  // Update question in DB

            res.body = json{
                {"question", {
                    {"id", question.id},
                    {"tagId", question.tagId},
                    {"question", question.question},
                    {"answer", question.answer},
                    {"votesUp", question.votesUp},
                    {"votesDown", question.votesDown}
                }}
            }.dump();
            res.set_header("Content-Type", "application/json");
        } catch (const std::exception& e) {
            res.code = 400;
            res.body = json{{"error", "Invalid vote request"}}.dump();
        }

        return res;
    });

    // POST /api/questions - Add a new question with improved validation
    CROW_ROUTE(app, "/api/questions")
.methods("POST"_method)
([&](const crow::request& req) {
    crow::response res;
    
    try {
        auto jsonBody = json::parse(req.body);
        
        // Validate required fields
        if (!jsonBody.contains("question") || 
            !jsonBody.contains("answer") || 
            !jsonBody.contains("tagId")) {
            res.code = 400;
            res.body = json{{"error", "Missing required fields"}}.dump();
            return res;
        }

        // Validate and convert tag ID
        int tagId;
        try {
            tagId = std::stoi(jsonBody["tagId"].get<std::string>());
        } catch (const std::exception& e) {
            res.code = 400;
            res.body = json{{"error", "Invalid tag ID format"}}.dump();
            return res;
        }

        // Check if tag exists
        if (!dbService.tagExists(tagId)) {
            res.code = 404;
            res.body = json{{"error", "Tag does not exist"}}.dump();
            return res;
        }

        Question newQuestion;
        newQuestion.question = jsonBody["question"].get<std::string>();
        newQuestion.answer = jsonBody["answer"].get<std::string>();
        newQuestion.tagId = std::to_string(tagId);  // Convert back to string for consistency
        newQuestion.votesUp = jsonBody.value("votesUp", 0);
        newQuestion.votesDown = jsonBody.value("votesDown", 0);

        std::string insertedQuestionId = dbService.insertQuestion(newQuestion);
        auto insertedQuestionOpt = dbService.getQuestionById(insertedQuestionId);

        if (insertedQuestionOpt) {
            const auto& insertedQuestion = *insertedQuestionOpt;
            res.body = json{
                {"question", {
                    {"id", insertedQuestion.id},
                    {"tagId", insertedQuestion.tagId},
                    {"question", insertedQuestion.question},
                    {"answer", insertedQuestion.answer},
                    {"votesUp", insertedQuestion.votesUp},
                    {"votesDown", insertedQuestion.votesDown}
                }}
            }.dump();
            res.set_header("Content-Type", "application/json");
        } else {
            res.code = 500;
            res.body = json{{"error", "Failed to retrieve inserted question"}}.dump();
        }
    } catch (const json::parse_error& e) {
        res.code = 400;
        res.body = json{{"error", "Invalid JSON format"}}.dump();
    } catch (const std::exception& e) {
        res.code = 400;
        res.body = json{{"error", "Invalid question request"}}.dump();
    }

    return res;
});
    
}