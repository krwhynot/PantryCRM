graph TB
    %% Client Layer
    subgraph "Client Devices - Multi-Device Support"
        Mobile[📱 Mobile Safari<br/>iOS/Android<br/>Touch Optimized]
        Tablet[📱 iPad Safari<br/>Primary Testing Device<br/>44px Touch Targets]
        Desktop[💻 Desktop Browser<br/>Windows Touch Laptop<br/>Mouse + Touch Support]
        WindowsTouch[💻 Windows Touch Laptop<br/>Primary Development Device<br/>Hybrid Input Support]
    end

    %% CDN & Performance Layer
    subgraph "Performance & Delivery"
        CDN[🌐 Azure CDN<br/>Static Assets<br/>Image Optimization]
        Cache[⚡ Application Cache<br/>Settings & Reports<br/>Product Lookups]
    end

    %% Application Layer
    subgraph "Application Tier - Azure App Service Basic B1 ($13/month)"
        direction TB
        
        subgraph "Frontend Framework"
            NextJS[⚛️ Next.js 15<br/>React 18.2.0 Stable<br/>Server-Side Rendering]
            TypeScript[📝 TypeScript Strict<br/>Type Safety<br/>IntelliSense]
            Components[🎨 shadcn/ui + Tremor<br/>Radix UI Primitives<br/>Accessible Components]
        end
        
        subgraph "NextCRM Foundation"
            NextCRMCore[🏗️ NextCRM Core<br/>Modified for Food Service<br/>Component Integration]
            Feedback[📝 Feedback Component<br/>User Support System]
            ModuleMenu[📋 Module Menu<br/>Navigation System]
            FulltextSearch[🔍 Fulltext Search<br/>Sub-second Response]
            AvatarDropdown[👤 Avatar Dropdown<br/>User Management]
        end

        subgraph "Backend Services"
            Express[🚀 Node.js + Express<br/>RESTful API Endpoints<br/>Server Actions]
            Auth[🔐 Auth.js Integration<br/>Multi-Provider Support<br/>Session Management]
            Validation[✅ Zod Schemas<br/>Input Validation<br/>Error Handling]
        end
    end

    %% Database Layer
    subgraph "Data Tier - Azure SQL Basic ($5/month)"
        direction TB
        
        SQLServer[🗄️ Azure SQL Database<br/>kitchenpantrycrm-server<br/>Central US Region]
        
        subgraph "Database Schema"
            Organizations[🏢 Organizations<br/>Priority A-D<br/>Segments & Distributors]
            Contacts[👥 Contacts<br/>Roles & Influence<br/>Decision Authority]
            Interactions[💬 Interactions<br/>6 Types Supported<br/>30-second Entry Target]
            Products[📦 Products<br/>11 Principals<br/>Category Management]
            Opportunities[💰 Opportunities<br/>5-Stage Pipeline<br/>Probability Tracking]
            Settings[⚙️ Settings<br/>Dynamic Configuration<br/>9 Categories]
            AuditTrail[📊 Audit Trail<br/>Change Tracking<br/>User Activity]
        end
        
        subgraph "Database Features"
            Indexing[📇 Strategic Indexing<br/>Sub-second Search<br/>Query Optimization]
            Constraints[🔒 Data Integrity<br/>Foreign Keys<br/>Check Constraints]
            Transactions[🔄 ACID Transactions<br/>Bulk Operations<br/>Rollback Support]
        end
    end

    %% ORM Layer
    subgraph "Data Access Layer"
        Prisma[🔧 Prisma ORM<br/>Type-Safe Queries<br/>Auto Schema Migration]
        PrismaClient[📡 Prisma Client<br/>Code Generation<br/>Query Optimization]
        SchemaValidation[✅ Schema Validation<br/>Compile-time Checks<br/>SQL Injection Prevention]
    end

    %% Infrastructure & Monitoring
    subgraph "Azure Infrastructure & Monitoring"
        AppInsights[📊 Application Insights<br/>Performance Monitoring<br/>Error Tracking]
        ResourceGroup[🏗️ Resource Group<br/>kitchenpantrycrm<br/>Centralized Management]
        Firewall[🛡️ SQL Firewall<br/>IP Restrictions<br/>Security Rules]
        Backup[💾 Automated Backups<br/>Point-in-time Recovery<br/>Disaster Recovery]
        CostAlert[💰 Cost Monitoring<br/>$18/month Limit<br/>Budget Alerts]
    end

    %% External Integrations
    subgraph "External Services"
        Email[📧 Email Services<br/>SMTP Integration<br/>Notification System]
        LinkedIn[👔 LinkedIn API<br/>Phase 3 Integration<br/>Profile Enhancement]
        ExcelImport[📊 Excel Import<br/>One-time Migration<br/>Data Validation]
    end

    %% Testing & Quality
    subgraph "Testing & Quality Assurance"
        Jest[🧪 Jest Testing<br/>Unit Tests<br/>Integration Tests]
        ReactTesting[⚛️ React Testing Library<br/>Component Testing<br/>User Interaction Tests]
        E2E[🔍 End-to-End Testing<br/>Multi-device Validation<br/>Touch Interface Testing]
    end

    %% CI/CD Pipeline
    subgraph "Development & Deployment"
        GitHub[📚 GitHub Repository<br/>Version Control<br/>Collaboration]
        GitHubActions[⚙️ GitHub Actions<br/>CI/CD Pipeline<br/>Automated Deployment]
        DevEnvironment[💻 Development Environment<br/>TypeScript + ESLint<br/>Hot Reload]
    end

    %% Connection Flow
    Mobile --> CDN
    Tablet --> CDN
    Desktop --> CDN
    WindowsTouch --> CDN
    
    CDN --> NextJS
    Cache --> NextJS
    
    NextJS --> NextCRMCore
    NextCRMCore --> Feedback
    NextCRMCore --> ModuleMenu
    NextCRMCore --> FulltextSearch
    NextCRMCore --> AvatarDropdown
    
    NextJS --> Express
    Express --> Auth
    Express --> Validation
    
    Express --> Prisma
    Prisma --> PrismaClient
    PrismaClient --> SQLServer
    
    SQLServer --> Organizations
    SQLServer --> Contacts
    SQLServer --> Interactions
    SQLServer --> Products
    SQLServer --> Opportunities
    SQLServer --> Settings
    SQLServer --> AuditTrail
    
    SQLServer --> Indexing
    SQLServer --> Constraints
    SQLServer --> Transactions
    
    Express --> AppInsights
    SQLServer --> Backup
    SQLServer --> Firewall
    
    Express --> Email
    Express --> LinkedIn
    Express --> ExcelImport
    
    GitHub --> GitHubActions
    GitHubActions --> NextJS
    
    NextJS --> Jest
    NextJS --> ReactTesting
    NextJS --> E2E

    %% Styling
    classDef azure fill:#0078d4,stroke:#004578,stroke-width:2px,color:#fff
    classDef framework fill:#61dafb,stroke:#21a1c4,stroke-width:2px,color:#000
    classDef database fill:#336791,stroke:#1e3a5f,stroke-width:2px,color:#fff
    classDef testing fill:#99424f,stroke:#6b2d35,stroke-width:2px,color:#fff
    classDef performance fill:#ff6b6b,stroke:#cc5555,stroke-width:3px,color:#fff
    classDef mobile fill:#45b7d1,stroke:#357a99,stroke-width:2px,color:#fff
    
    class SQLServer,AppInsights,ResourceGroup,CDN azure
    class NextJS,TypeScript,Components,Prisma framework
    class Organizations,Contacts,Interactions,Products,Opportunities database
    class Jest,ReactTesting,E2E testing
    class Cache,Indexing,FulltextSearch performance
    class Mobile,Tablet,WindowsTouch mobile