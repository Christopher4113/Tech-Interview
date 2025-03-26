#ifndef MODELS_H
#define MODELS_H

#include <string>

struct Tag {
    std::string id;
    std::string name;
    std::string description;
    std::string slug;
};

struct Question {
    std::string id;
    std::string tagId;
    std::string question;
    std::string answer;
    int votesUp = 0;
    int votesDown = 0;
};

#endif // MODELS_H