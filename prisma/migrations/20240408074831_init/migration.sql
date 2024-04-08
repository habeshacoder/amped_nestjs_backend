-- CreateEnum
CREATE TYPE "Sex" AS ENUM ('Male', 'Female', 'Unspecified');

-- CreateEnum
CREATE TYPE "Parent" AS ENUM ('Publication', 'Audio', 'Unspecified');

-- CreateEnum
CREATE TYPE "Type" AS ENUM ('Book', 'Magazine', 'Newspaper', 'Audiobook', 'Podcast', 'Drama', 'Unspecified');

-- CreateEnum
CREATE TYPE "Genere" AS ENUM ('Psycology', 'Commedy', 'Unspecified');

-- CreateEnum
CREATE TYPE "Catagory" AS ENUM ('Fiction', 'Story', 'Documentary', 'Unspecified');

-- CreateEnum
CREATE TYPE "ReportType" AS ENUM ('HateSpeach', 'GenderViolation', 'InappropriateAgeRange', 'Stereotype', 'Descrimination', 'Unspecified');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(255),
    "password" VARCHAR(255) NOT NULL,
    "provider" VARCHAR(255) NOT NULL DEFAULT 'local',
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "refresh_token" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_resets" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "reset_token" VARCHAR(500) NOT NULL,
    "otp" VARCHAR(255) NOT NULL,
    "expiries_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "password_resets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "first_name" VARCHAR(255) NOT NULL,
    "last_name" VARCHAR(255) NOT NULL,
    "sex" "Sex" NOT NULL DEFAULT 'Unspecified',
    "date_of_birth" VARCHAR(255) NOT NULL,
    "profile_image" VARCHAR(255),
    "cover_image" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seller_profiles" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "sex" "Sex" NOT NULL DEFAULT 'Unspecified',
    "date_of_birth" VARCHAR(255),
    "description" TEXT,
    "image" VARCHAR(255),
    "cover_image" VARCHAR(255),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "seller_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links_profile" (
    "id" SERIAL NOT NULL,
    "link" VARCHAR(255) NOT NULL,
    "sellerProfile_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "materials" (
    "id" SERIAL NOT NULL,
    "sellerProfile_id" INTEGER NOT NULL,
    "parent" "Parent" NOT NULL DEFAULT 'Unspecified',
    "type" "Type" NOT NULL DEFAULT 'Unspecified',
    "genere" "Genere" NOT NULL DEFAULT 'Unspecified',
    "catagory" "Catagory" NOT NULL DEFAULT 'Unspecified',
    "author" VARCHAR(255),
    "reader" VARCHAR(255),
    "translator" VARCHAR(255),
    "length_minute" DOUBLE PRECISION,
    "length_page" DOUBLE PRECISION,
    "first_published_at" TEXT,
    "language" VARCHAR(255),
    "publisher" VARCHAR(255),
    "episode" INTEGER,
    "continues_from" INTEGER,
    "material" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_images" (
    "id" SERIAL NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "cover" BOOLEAN NOT NULL DEFAULT false,
    "material_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_previews" (
    "id" SERIAL NOT NULL,
    "preview" VARCHAR(255) NOT NULL,
    "material_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channels" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "draft" BOOLEAN NOT NULL DEFAULT true,
    "sellerProfile_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_images" (
    "id" SERIAL NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "cover" BOOLEAN NOT NULL DEFAULT false,
    "channel_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_previews" (
    "id" SERIAL NOT NULL,
    "preview" VARCHAR(255) NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_links_channel" (
    "id" SERIAL NOT NULL,
    "link" VARCHAR(255) NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_links_channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plan" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "price" DOUBLE PRECISION NOT NULL,
    "channel_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_materials" (
    "id" SERIAL NOT NULL,
    "sellerProfile_id" INTEGER NOT NULL,
    "parent" "Parent" NOT NULL DEFAULT 'Unspecified',
    "type" "Type" NOT NULL DEFAULT 'Unspecified',
    "genere" "Genere" NOT NULL DEFAULT 'Unspecified',
    "catagory" "Catagory" NOT NULL DEFAULT 'Unspecified',
    "author" VARCHAR(255),
    "reader" VARCHAR(255),
    "translator" VARCHAR(255),
    "length_minute" DOUBLE PRECISION,
    "length_page" DOUBLE PRECISION,
    "first_published_at" TEXT,
    "language" VARCHAR(255),
    "publisher" VARCHAR(255),
    "episode" INTEGER,
    "continues_from" INTEGER,
    "material" VARCHAR(255) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_material_images" (
    "id" SERIAL NOT NULL,
    "image" VARCHAR(255) NOT NULL,
    "primary" BOOLEAN NOT NULL DEFAULT false,
    "cover" BOOLEAN NOT NULL DEFAULT false,
    "channel_material_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_material_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "channel_material_previews" (
    "id" SERIAL NOT NULL,
    "preview" VARCHAR(255) NOT NULL,
    "channel_material_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "channel_material_previews_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_in_subscription_plan" (
    "id" SERIAL NOT NULL,
    "subscriptionPlan_id" INTEGER NOT NULL,
    "channelMaterial_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_in_subscription_plan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "material_user" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "material_id" INTEGER NOT NULL,
    "is_paied" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ratings" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "rating" DOUBLE PRECISION NOT NULL,
    "remark" TEXT NOT NULL,
    "material_id" INTEGER,
    "channel_id" INTEGER,
    "channel_material_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ratings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "replays" (
    "id" SERIAL NOT NULL,
    "replay" TEXT NOT NULL,
    "remark_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "replays_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "report_type" "ReportType" NOT NULL DEFAULT 'Unspecified',
    "report_desc" TEXT NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "material_id" INTEGER,
    "channel_id" INTEGER,
    "channel_material_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscribed_users" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "subscription_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscribed_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "favorite" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "material_id" INTEGER,
    "channel_id" INTEGER,
    "channel_material_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "favorite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- AddForeignKey
ALTER TABLE "password_resets" ADD CONSTRAINT "password_resets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seller_profiles" ADD CONSTRAINT "seller_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links_profile" ADD CONSTRAINT "social_links_profile_sellerProfile_id_fkey" FOREIGN KEY ("sellerProfile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "materials" ADD CONSTRAINT "materials_sellerProfile_id_fkey" FOREIGN KEY ("sellerProfile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_images" ADD CONSTRAINT "material_images_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_previews" ADD CONSTRAINT "material_previews_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channels" ADD CONSTRAINT "channels_sellerProfile_id_fkey" FOREIGN KEY ("sellerProfile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_images" ADD CONSTRAINT "channel_images_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_previews" ADD CONSTRAINT "channel_previews_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_links_channel" ADD CONSTRAINT "social_links_channel_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscription_plan" ADD CONSTRAINT "subscription_plan_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_materials" ADD CONSTRAINT "channel_materials_sellerProfile_id_fkey" FOREIGN KEY ("sellerProfile_id") REFERENCES "seller_profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_material_images" ADD CONSTRAINT "channel_material_images_channel_material_id_fkey" FOREIGN KEY ("channel_material_id") REFERENCES "channel_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "channel_material_previews" ADD CONSTRAINT "channel_material_previews_channel_material_id_fkey" FOREIGN KEY ("channel_material_id") REFERENCES "channel_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_in_subscription_plan" ADD CONSTRAINT "material_in_subscription_plan_channelMaterial_id_fkey" FOREIGN KEY ("channelMaterial_id") REFERENCES "channel_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_in_subscription_plan" ADD CONSTRAINT "material_in_subscription_plan_subscriptionPlan_id_fkey" FOREIGN KEY ("subscriptionPlan_id") REFERENCES "subscription_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_user" ADD CONSTRAINT "material_user_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "material_user" ADD CONSTRAINT "material_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_channel_material_id_fkey" FOREIGN KEY ("channel_material_id") REFERENCES "channel_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ratings" ADD CONSTRAINT "ratings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "replays" ADD CONSTRAINT "replays_remark_id_fkey" FOREIGN KEY ("remark_id") REFERENCES "ratings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_channel_material_id_fkey" FOREIGN KEY ("channel_material_id") REFERENCES "channel_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribed_users" ADD CONSTRAINT "subscribed_users_subscription_id_fkey" FOREIGN KEY ("subscription_id") REFERENCES "subscription_plan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscribed_users" ADD CONSTRAINT "subscribed_users_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_channel_material_id_fkey" FOREIGN KEY ("channel_material_id") REFERENCES "channel_materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "favorite" ADD CONSTRAINT "favorite_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
