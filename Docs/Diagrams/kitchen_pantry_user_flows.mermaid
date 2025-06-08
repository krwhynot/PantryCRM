flowchart TD
    %% Critical User Flows for Food Service CRM

    %% Main Dashboard Flow
    Start([Sales Rep Login]) --> Dashboard{Dashboard}
    Dashboard --> |Quick Add| QuickInteraction[Add Interaction - 30s Target]
    Dashboard --> |Priority View| APriority[A-Priority Organizations]
    Dashboard --> |Follow-ups| FollowUp[Today's Follow-ups]
    Dashboard --> |Search| Search[Global Search]

    %% Organization Management Flow - Core UX Priority
    Dashboard --> OrgList[Organizations List]
    OrgList --> |Filter| FilterOrg{Filter Options}
    FilterOrg --> |Priority| PriorityFilter[A-D Priority]
    FilterOrg --> |Segment| SegmentFilter[Fine Dining/Fast Food/etc]
    FilterOrg --> |Distributor| DistributorFilter[Sysco/USF/PFG/etc]
    
    OrgList --> |Select| OrgDetail[Organization Detail]
    OrgDetail --> |Edit| OrgEdit[Edit Organization]
    OrgDetail --> |Add Contact| AddContact[New Contact Form]
    OrgDetail --> |Add Interaction| AddInteraction[New Interaction]
    OrgDetail --> |View Pipeline| Pipeline[Opportunities Pipeline]

    %% Contact Management Flow
    OrgDetail --> ContactList[Contact List]
    ContactList --> |Select| ContactDetail[Contact Detail]
    ContactDetail --> |Edit| ContactEdit[Edit Contact]
    ContactDetail --> |LinkedIn| LinkedIn[LinkedIn Integration]
    ContactDetail --> |Call/Email| DirectContact[Direct Contact Actions]

    %% Interaction Entry Flow - 30-Second Target
    QuickInteraction --> InteractionType{Interaction Type}
    InteractionType --> |Email| EmailForm[Email Details]
    InteractionType --> |Call| CallForm[Call Notes]
    InteractionType --> |In Person| MeetingForm[Meeting Details]
    InteractionType --> |Demo| DemoForm[Demo/Sample Notes]
    InteractionType --> |Quote| QuoteForm[Price Quote Details]
    InteractionType --> |Follow-up| FollowForm[Follow-up Actions]
    
    EmailForm --> SaveInteraction[Save & Auto-Populate]
    CallForm --> SaveInteraction
    MeetingForm --> SaveInteraction
    DemoForm --> SaveInteraction
    QuoteForm --> SaveInteraction
    FollowForm --> SaveInteraction
    
    SaveInteraction --> FollowUpPrompt{Schedule Follow-up?}
    FollowUpPrompt --> |Yes| SetFollowUp[Set Follow-up Date]
    FollowUpPrompt --> |No| Complete[Complete Entry]
    SetFollowUp --> Complete

    %% Search Flow - Sub-Second Response
    Search --> SearchType{Search Type}
    SearchType --> |Organization| OrgSearch[Organization Search]
    SearchType --> |Contact| ContactSearch[Contact Search]
    SearchType --> |Product| ProductSearch[Product Search]
    
    OrgSearch --> |Results| OrgResults[Organization Results]
    ContactSearch --> |Results| ContactResults[Contact Results]
    ProductSearch --> |Results| ProductResults[Product Results]
    
    OrgResults --> |Select| OrgDetail
    ContactResults --> |Select| ContactDetail
    ProductResults --> |Select| ProductDetail[Product Detail]

    %% Pipeline Management Flow
    Pipeline --> StageView{Pipeline Stage}
    StageView --> |Lead| LeadStage[Lead Discovery]
    StageView --> |Contacted| ContactStage[Contacted]
    StageView --> |Sampled| SampleStage[Sampled/Visited]
    StageView --> |Follow-up| FollowStage[Follow-up]
    StageView --> |Close| CloseStage[Close Win/Loss]
    
    LeadStage --> MoveStage[Move to Next Stage]
    ContactStage --> MoveStage
    SampleStage --> MoveStage
    FollowStage --> MoveStage
    CloseStage --> MarkClosed[Mark as Closed]

    %% Reporting Flow
    Dashboard --> Reports[Reports Menu]
    Reports --> ReportType{Report Type}
    ReportType --> |Activity| ActivityReport[Activity Report]
    ReportType --> |Pipeline| PipelineReport[Pipeline Report]
    ReportType --> |Principal| PrincipalReport[Principal Performance]
    ReportType --> |Territory| TerritoryReport[Territory Analysis]
    
    ActivityReport --> ReportFilter[Apply Filters]
    PipelineReport --> ReportFilter
    PrincipalReport --> ReportFilter
    TerritoryReport --> ReportFilter
    
    ReportFilter --> GenerateReport[Generate Report <10s]
    GenerateReport --> ExportOptions[Export Options]

    %% Mobile-Optimized Flows
    Complete --> MobileCheck{Mobile Device?}
    MobileCheck --> |Yes| MobileOptimized[Touch-Optimized UI]
    MobileCheck --> |No| DesktopView[Desktop Interface]
    
    MobileOptimized --> TouchTargets[44px Touch Targets]
    TouchTargets --> SwipeActions[Swipe Actions]
    SwipeActions --> OfflineSync[Offline Sync]

    %% Error Handling
    SaveInteraction --> ErrorCheck{Save Successful?}
    ErrorCheck --> |No| ErrorMessage[Error Message + Retry]
    ErrorCheck --> |Yes| SuccessMessage[Success Confirmation]
    ErrorMessage --> RetryAction[Retry Action]
    RetryAction --> SaveInteraction

    %% Styling for UX Priority Elements
    classDef criticalPath fill:#ff6b6b,stroke:#cc5555,stroke-width:3px,color:#fff
    classDef performance fill:#4ecdc4,stroke:#3ba89f,stroke-width:2px,color:#fff
    classDef mobileFirst fill:#45b7d1,stroke:#357a99,stroke-width:2px,color:#fff
    classDef touchOptimized fill:#96ceb4,stroke:#7bb190,stroke-width:2px
    
    class QuickInteraction,SaveInteraction,Search,OrgSearch criticalPath
    class GenerateReport,OrgResults,ContactResults,ProductResults performance
    class MobileOptimized,TouchTargets,SwipeActions mobileFirst
    class AddInteraction,AddContact,InteractionType touchOptimized