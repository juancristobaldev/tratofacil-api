-- CreateTable
CREATE TABLE `wp_users` (
    `ID` INTEGER NOT NULL AUTO_INCREMENT,
    `user_login` VARCHAR(60) NOT NULL,
    `user_pass` VARCHAR(255) NOT NULL,
    `user_nicename` VARCHAR(50) NOT NULL,
    `user_email` VARCHAR(100) NOT NULL,
    `user_url` VARCHAR(100) NOT NULL DEFAULT '',
    `user_registered` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_activation_key` VARCHAR(255) NOT NULL DEFAULT '',
    `user_status` INTEGER NOT NULL DEFAULT 0,
    `display_name` VARCHAR(250) NOT NULL DEFAULT '',

    UNIQUE INDEX `wp_users_user_login_key`(`user_login`),
    UNIQUE INDEX `wp_users_user_email_key`(`user_email`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_usermeta` (
    `umeta_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `meta_key` VARCHAR(255) NOT NULL,
    `meta_value` LONGTEXT NULL,

    INDEX `user_id`(`user_id`),
    INDEX `meta_key`(`meta_key`),
    PRIMARY KEY (`umeta_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Provider` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `wcCategoryId` INTEGER NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `location` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `bio` TEXT NULL,
    `phone` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Provider_userId_key`(`userId`),
    UNIQUE INDEX `Provider_wcCategoryId_key`(`wcCategoryId`),
    UNIQUE INDEX `Provider_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `provider_reviews` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerId` INTEGER NOT NULL,
    `clientId` INTEGER NOT NULL,
    `orderId` INTEGER NULL,
    `rating` INTEGER NOT NULL,
    `comment` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `provider_reviews_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderCertificate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `providerId` INTEGER NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `institution` VARCHAR(191) NULL,
    `year` INTEGER NULL,
    `fileUrl` VARCHAR(191) NOT NULL,
    `verified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BankAccount` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `bankName` VARCHAR(191) NOT NULL,
    `accountNumber` VARCHAR(191) NOT NULL,
    `accountType` VARCHAR(191) NOT NULL,
    `rut` VARCHAR(191) NULL,
    `email` VARCHAR(191) NULL,
    `providerId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `BankAccount_providerId_key`(`providerId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_terms` (
    `term_id` BIGINT NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(200) NOT NULL,
    `slug` VARCHAR(200) NOT NULL DEFAULT '',
    `term_group` BIGINT NOT NULL DEFAULT 0,

    INDEX `slug`(`slug`),
    INDEX `name`(`name`),
    PRIMARY KEY (`term_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_term_taxonomy` (
    `term_taxonomy_id` BIGINT NOT NULL AUTO_INCREMENT,
    `term_id` BIGINT NOT NULL,
    `taxonomy` VARCHAR(32) NOT NULL,
    `description` LONGTEXT NOT NULL,
    `parent` BIGINT NOT NULL DEFAULT 0,
    `count` BIGINT NOT NULL DEFAULT 0,

    INDEX `taxonomy`(`taxonomy`),
    UNIQUE INDEX `term_id_taxonomy`(`term_id`, `taxonomy`),
    PRIMARY KEY (`term_taxonomy_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_term_relationships` (
    `object_id` BIGINT NOT NULL,
    `term_taxonomy_id` BIGINT NOT NULL,
    `term_order` INTEGER NOT NULL DEFAULT 0,

    INDEX `term_taxonomy_id`(`term_taxonomy_id`),
    PRIMARY KEY (`object_id`, `term_taxonomy_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_posts` (
    `ID` BIGINT NOT NULL AUTO_INCREMENT,
    `post_author` BIGINT NOT NULL DEFAULT 0,
    `post_date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `post_date_gmt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `post_content` LONGTEXT NOT NULL DEFAULT '',
    `post_title` TEXT NOT NULL DEFAULT '',
    `post_excerpt` TEXT NOT NULL DEFAULT '',
    `post_status` VARCHAR(20) NOT NULL DEFAULT 'publish',
    `comment_status` VARCHAR(20) NOT NULL DEFAULT 'closed',
    `ping_status` VARCHAR(20) NOT NULL DEFAULT 'closed',
    `post_password` VARCHAR(255) NOT NULL DEFAULT '',
    `post_name` VARCHAR(200) NOT NULL DEFAULT '',
    `to_ping` TEXT NOT NULL DEFAULT '',
    `pinged` TEXT NOT NULL DEFAULT '',
    `post_modified` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `post_modified_gmt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `post_content_filtered` LONGTEXT NOT NULL DEFAULT '',
    `post_parent` BIGINT NOT NULL DEFAULT 0,
    `guid` VARCHAR(255) NOT NULL DEFAULT '',
    `menu_order` INTEGER NOT NULL DEFAULT 0,
    `post_type` VARCHAR(20) NOT NULL DEFAULT 'product',
    `post_mime_type` VARCHAR(100) NOT NULL DEFAULT '',
    `comment_count` BIGINT NOT NULL DEFAULT 0,

    INDEX `post_name`(`post_name`),
    INDEX `type_status_date`(`post_type`, `post_status`, `post_date`, `ID`),
    PRIMARY KEY (`ID`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `wp_postmeta` (
    `meta_id` BIGINT NOT NULL AUTO_INCREMENT,
    `post_id` BIGINT NOT NULL,
    `meta_key` VARCHAR(255) NULL,
    `meta_value` LONGTEXT NULL,

    INDEX `post_id`(`post_id`),
    INDEX `meta_key`(`meta_key`),
    PRIMARY KEY (`meta_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Order` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clientId` INTEGER NOT NULL,
    `total` DOUBLE NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED', 'FAILED', 'SUCCESS') NOT NULL DEFAULT 'PENDING',
    `wcOrderId` INTEGER NULL,
    `wcOrderKey` VARCHAR(191) NULL,
    `productId` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Order_wcOrderId_key`(`wcOrderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `amount` DOUBLE NOT NULL,
    `provider` ENUM('WEBPAY', 'MERCADOPAGO', 'TRANSFER') NOT NULL,
    `status` ENUM('INITIATED', 'CONFIRMED', 'FAILED') NOT NULL DEFAULT 'INITIATED',
    `transactionId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payment_orderId_key`(`orderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `EmailVerification` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `EmailVerification_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `wp_usermeta` ADD CONSTRAINT `wp_usermeta_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `wp_users`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Provider` ADD CONSTRAINT `Provider_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `wp_users`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provider_reviews` ADD CONSTRAINT `provider_reviews_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provider_reviews` ADD CONSTRAINT `provider_reviews_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `wp_users`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `provider_reviews` ADD CONSTRAINT `provider_reviews_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderCertificate` ADD CONSTRAINT `ProviderCertificate_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BankAccount` ADD CONSTRAINT `BankAccount_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `Provider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wp_term_taxonomy` ADD CONSTRAINT `wp_term_taxonomy_term_id_fkey` FOREIGN KEY (`term_id`) REFERENCES `wp_terms`(`term_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wp_term_relationships` ADD CONSTRAINT `wp_term_relationships_term_taxonomy_id_fkey` FOREIGN KEY (`term_taxonomy_id`) REFERENCES `wp_term_taxonomy`(`term_taxonomy_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wp_term_relationships` ADD CONSTRAINT `wp_term_relationships_object_id_fkey` FOREIGN KEY (`object_id`) REFERENCES `wp_posts`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `wp_postmeta` ADD CONSTRAINT `wp_postmeta_post_id_fkey` FOREIGN KEY (`post_id`) REFERENCES `wp_posts`(`ID`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Order` ADD CONSTRAINT `Order_clientId_fkey` FOREIGN KEY (`clientId`) REFERENCES `wp_users`(`ID`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `Order`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

