/*
  Warnings:

  - You are about to drop the column `roleId` on the `Contact` table. All the data in the column will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Contact] DROP COLUMN [roleId];
ALTER TABLE [dbo].[Contact] ADD [positionId] NVARCHAR(1000);

-- CreateIndex
CREATE NONCLUSTERED INDEX [Contact_positionId_idx] ON [dbo].[Contact]([positionId]);

-- AddForeignKey
ALTER TABLE [dbo].[Contact] ADD CONSTRAINT [Contact_positionId_fkey] FOREIGN KEY ([positionId]) REFERENCES [dbo].[Setting]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
