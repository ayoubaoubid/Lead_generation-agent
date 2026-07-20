# Application services

Services implement use cases. They receive validated commands and a `ServiceContext`,
authorize the operation, coordinate domain rules and repository contracts, and return
typed results. They do not depend on HTTP, React or concrete provider SDKs.
