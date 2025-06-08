erDiagram
    %% Core Settings Management
    Setting {
        string id PK
        string category
        string key
        string label
        string color
        int sortOrder
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    %% Organizations - Core Entity
    Organization {
        string id PK
        string name
        string priorityId FK
        string segmentId FK
        string distributorId FK
        string accountManager
        string address
        string city
        string state
        string zipCode
        string phone
        string website
        text notes
        datetime createdAt
        datetime updatedAt
        string createdBy
    }

    %% Contacts - Enhanced with Influence Tracking
    Contact {
        string id PK
        string organizationId FK
        string firstName
        string lastName
        string email
        string phone
        string roleId FK
        string influenceLevelId FK
        string decisionRoleId FK
        string linkedInUrl
        boolean isPrimary
        text notes
        datetime createdAt
        datetime updatedAt
        string createdBy
    }

    %% Products - Principal Integration
    Product {
        string id PK
        string name
        string principalId FK
        string category
        text description
        decimal price
        string sku
        boolean active
        datetime createdAt
        datetime updatedAt
        string createdBy
    }

    %% Opportunities - Sales Pipeline
    Opportunity {
        string id PK
        string organizationId FK
        string contactId FK
        string productId FK
        string stageId FK
        string status
        int probability
        decimal estimatedValue
        datetime expectedCloseDate
        text notes
        datetime createdAt
        datetime updatedAt
        string createdBy
    }

    %% Interactions - 6 Types Supported
    Interaction {
        string id PK
        string organizationId FK
        string contactId FK
        string opportunityId FK
        string typeId FK
        string subject
        text notes
        datetime scheduledDate
        datetime completedDate
        boolean isCompleted
        datetime createdAt
        datetime updatedAt
        string createdBy
    }

    %% Account Management
    User {
        string id PK
        string email
        string firstName
        string lastName
        string role
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    %% Audit Trail
    AuditLog {
        string id PK
        string entityType
        string entityId
        string action
        json oldValues
        json newValues
        string userId FK
        datetime createdAt
    }

    %% Relationships
    Organization ||--o{ Contact : "has contacts"
    Organization ||--o{ Interaction : "has interactions"
    Organization ||--o{ Opportunity : "has opportunities"
    
    Contact ||--o{ Interaction : "participates in"
    Contact ||--o{ Opportunity : "owns"
    
    Product ||--o{ Opportunity : "featured in"
    
    Opportunity ||--o{ Interaction : "generates"
    
    %% Settings Relationships
    Setting ||--o{ Organization : "priority/segment/distributor"
    Setting ||--o{ Contact : "role/influence/decision"
    Setting ||--o{ Product : "principal"
    Setting ||--o{ Opportunity : "stage"
    Setting ||--o{ Interaction : "type"
    
    %% User Relationships
    User ||--o{ Organization : "manages"
    User ||--o{ Interaction : "creates"
    User ||--o{ Opportunity : "owns"
    User ||--o{ AuditLog : "generates"

    %% Key Notes
    %% Priority: A-D (Green/Yellow/Orange/Red)
    %% Segments: Fine Dining, Fast Food, Healthcare, Catering, Institutional
    %% Distributors: Sysco, USF, PFG, Direct, Other
    %% Principals: 11 food service brands
    %% Interaction Types: Email, Call, In Person, Demo/sampled, Quoted price, Follow-up
    %% Pipeline Stages: Lead-discovery, Contacted, Sampled/Visited, Follow-up, Close