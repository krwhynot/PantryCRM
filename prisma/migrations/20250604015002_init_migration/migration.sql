BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Setting] (
    [id] NVARCHAR(1000) NOT NULL,
    [category] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [label] NVARCHAR(1000),
    [color] NVARCHAR(1000),
    [sortOrder] INT NOT NULL,
    [active] BIT NOT NULL CONSTRAINT [Setting_active_df] DEFAULT 1,
    [metadata] TEXT,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Setting_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Setting_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Setting_category_key_key] UNIQUE NONCLUSTERED ([category],[key])
);

-- CreateTable
CREATE TABLE [dbo].[User] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000),
    [image] NVARCHAR(1000),
    [emailVerified] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [User_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [User_isActive_df] DEFAULT 1,
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'user',
    [lastLoginAt] DATETIME2,
    CONSTRAINT [User_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [User_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Account] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(1000) NOT NULL,
    [provider] NVARCHAR(1000) NOT NULL,
    [providerAccountId] NVARCHAR(1000) NOT NULL,
    [refresh_token] TEXT,
    [access_token] TEXT,
    [expires_at] INT,
    [token_type] NVARCHAR(1000),
    [scope] NVARCHAR(1000),
    [id_token] TEXT,
    [session_state] NVARCHAR(1000),
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Account_provider_providerAccountId_key] UNIQUE NONCLUSTERED ([provider],[providerAccountId])
);

-- CreateTable
CREATE TABLE [dbo].[Session] (
    [id] NVARCHAR(1000) NOT NULL,
    [sessionToken] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Session_sessionToken_key] UNIQUE NONCLUSTERED ([sessionToken])
);

-- CreateTable
CREATE TABLE [dbo].[VerificationToken] (
    [identifier] NVARCHAR(1000) NOT NULL,
    [token] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [VerificationToken_token_key] UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [VerificationToken_identifier_token_key] UNIQUE NONCLUSTERED ([identifier],[token])
);

-- CreateTable
CREATE TABLE [dbo].[Organization] (
    [id] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [description] TEXT,
    [website] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [email] NVARCHAR(1000),
    [addressLine1] NVARCHAR(1000),
    [addressLine2] NVARCHAR(1000),
    [city] NVARCHAR(1000),
    [state] NVARCHAR(1000),
    [postalCode] NVARCHAR(1000),
    [country] NVARCHAR(1000),
    [isActive] BIT NOT NULL CONSTRAINT [Organization_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Organization_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [accountManagerId] NVARCHAR(1000),
    [priorityId] NVARCHAR(1000),
    [segmentId] NVARCHAR(1000),
    [distributorId] NVARCHAR(1000),
    [annualRevenue] DECIMAL(18,2),
    [totalValue] DECIMAL(18,2),
    CONSTRAINT [Organization_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[OrganizationUser] (
    [id] NVARCHAR(1000) NOT NULL,
    [organizationId] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [role] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [OrganizationUser_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [OrganizationUser_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [OrganizationUser_organizationId_userId_key] UNIQUE NONCLUSTERED ([organizationId],[userId])
);

-- CreateTable
CREATE TABLE [dbo].[Contact] (
    [id] NVARCHAR(1000) NOT NULL,
    [organizationId] NVARCHAR(1000) NOT NULL,
    [firstName] NVARCHAR(1000) NOT NULL,
    [lastName] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000),
    [phone] NVARCHAR(1000),
    [title] NVARCHAR(1000),
    [roleId] NVARCHAR(1000),
    [notes] TEXT,
    [isActive] BIT NOT NULL CONSTRAINT [Contact_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Contact_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Contact_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Interaction] (
    [id] NVARCHAR(1000) NOT NULL,
    [organizationId] NVARCHAR(1000) NOT NULL,
    [contactId] NVARCHAR(1000),
    [userId] NVARCHAR(1000) NOT NULL,
    [interactionDate] DATETIME2 NOT NULL,
    [typeId] NVARCHAR(1000) NOT NULL,
    [notes] TEXT,
    [followUpDate] DATETIME2,
    [isCompleted] BIT NOT NULL CONSTRAINT [Interaction_isCompleted_df] DEFAULT 0,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Interaction_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Interaction_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateTable
CREATE TABLE [dbo].[Opportunity] (
    [id] NVARCHAR(1000) NOT NULL,
    [organizationId] NVARCHAR(1000) NOT NULL,
    [contactId] NVARCHAR(1000),
    [userId] NVARCHAR(1000) NOT NULL,
    [principal] NVARCHAR(1000) NOT NULL,
    [stage] NVARCHAR(1000) NOT NULL,
    [status] NVARCHAR(1000) NOT NULL,
    [source] NVARCHAR(1000),
    [reason] TEXT,
    [probability] INT NOT NULL,
    [expectedRevenue] DECIMAL(10,2),
    [expectedCloseDate] DATETIME2,
    [notes] TEXT,
    [isActive] BIT NOT NULL CONSTRAINT [Opportunity_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Opportunity_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Opportunity_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Setting_category_active_idx] ON [dbo].[Setting]([category], [active]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_email_idx] ON [dbo].[User]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_isActive_idx] ON [dbo].[User]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_name_idx] ON [dbo].[Organization]([name]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_city_idx] ON [dbo].[Organization]([city]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_state_idx] ON [dbo].[Organization]([state]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_postalCode_idx] ON [dbo].[Organization]([postalCode]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_country_idx] ON [dbo].[Organization]([country]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_accountManagerId_idx] ON [dbo].[Organization]([accountManagerId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_priorityId_idx] ON [dbo].[Organization]([priorityId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_segmentId_idx] ON [dbo].[Organization]([segmentId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_distributorId_idx] ON [dbo].[Organization]([distributorId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Organization_isActive_idx] ON [dbo].[Organization]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [OrganizationUser_organizationId_idx] ON [dbo].[OrganizationUser]([organizationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_organizationId_idx] ON [dbo].[Contact]([organizationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_firstName_idx] ON [dbo].[Contact]([firstName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_lastName_idx] ON [dbo].[Contact]([lastName]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_email_idx] ON [dbo].[Contact]([email]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_phone_idx] ON [dbo].[Contact]([phone]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_isActive_idx] ON [dbo].[Contact]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Interaction_organizationId_idx] ON [dbo].[Interaction]([organizationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Interaction_contactId_idx] ON [dbo].[Interaction]([contactId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Interaction_userId_idx] ON [dbo].[Interaction]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Interaction_interactionDate_idx] ON [dbo].[Interaction]([interactionDate]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_organizationId_idx] ON [dbo].[Opportunity]([organizationId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_contactId_idx] ON [dbo].[Opportunity]([contactId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_userId_idx] ON [dbo].[Opportunity]([userId]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_principal_idx] ON [dbo].[Opportunity]([principal]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_stage_idx] ON [dbo].[Opportunity]([stage]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_status_idx] ON [dbo].[Opportunity]([status]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_isActive_idx] ON [dbo].[Opportunity]([isActive]);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Opportunity_expectedCloseDate_idx] ON [dbo].[Opportunity]([expectedCloseDate]);

-- AddForeignKey
ALTER TABLE [dbo].[Account] ADD CONSTRAINT [Account_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Organization] ADD CONSTRAINT [Organization_priorityId_fkey] FOREIGN KEY ([priorityId]) REFERENCES [dbo].[Setting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Organization] ADD CONSTRAINT [Organization_segmentId_fkey] FOREIGN KEY ([segmentId]) REFERENCES [dbo].[Setting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Organization] ADD CONSTRAINT [Organization_distributorId_fkey] FOREIGN KEY ([distributorId]) REFERENCES [dbo].[Setting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Organization] ADD CONSTRAINT [Organization_accountManagerId_fkey] FOREIGN KEY ([accountManagerId]) REFERENCES [dbo].[User]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrganizationUser] ADD CONSTRAINT [OrganizationUser_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[Organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[OrganizationUser] ADD CONSTRAINT [OrganizationUser_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[Organization]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Interaction] ADD CONSTRAINT [Interaction_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[Organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Interaction] ADD CONSTRAINT [Interaction_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[Contact]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Interaction] ADD CONSTRAINT [Interaction_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[Organization]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_contactId_fkey] FOREIGN KEY ([contactId]) REFERENCES [dbo].[Contact]([id]) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Opportunity] ADD CONSTRAINT [Opportunity_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
