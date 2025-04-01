#ifndef ROUTES_H
#define ROUTES_H

#include <crow.h>
#include "database_service.h"  // Include the DatabaseService header

void setupRoutes(crow::SimpleApp& app, DatabaseService& dbService); 

#endif // ROUTES_H