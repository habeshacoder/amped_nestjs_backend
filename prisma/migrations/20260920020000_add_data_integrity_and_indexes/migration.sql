-- Migration: 20260920020000_add_data_integrity_and_indexes
-- Description: Enforce unique composite constraints, check constraints for positive values/ranges, and indexes on foreign keys

-- 1. Composite Unique Constraints / Indexes
CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_id_material_id_key" 
  ON "favorite"("user_id", "material_id") 
  WHERE "material_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_id_channel_id_key" 
  ON "favorite"("user_id", "channel_id") 
  WHERE "channel_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "favorites_user_id_channel_material_id_key" 
  ON "favorite"("user_id", "channel_material_id") 
  WHERE "channel_material_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ratings_user_id_material_id_key" 
  ON "ratings"("user_id", "material_id") 
  WHERE "material_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ratings_user_id_channel_id_key" 
  ON "ratings"("user_id", "channel_id") 
  WHERE "channel_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "ratings_user_id_channel_material_id_key" 
  ON "ratings"("user_id", "channel_material_id") 
  WHERE "channel_material_id" IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "material_user_user_id_material_id_key" 
  ON "material_user"("user_id", "material_id");

CREATE UNIQUE INDEX IF NOT EXISTS "material_in_subscription_plan_sub_mat_key" 
  ON "material_in_subscription_plan"("subscriptionPlan_id", "channelMaterial_id");

CREATE UNIQUE INDEX IF NOT EXISTS "subscribed_users_user_id_subscription_id_key" 
  ON "subscribed_users"("user_id", "subscription_id") 
  WHERE "subscription_id" IS NOT NULL;

-- 2. Range & Sanity CHECK Constraints
ALTER TABLE "ratings" 
  DROP CONSTRAINT IF EXISTS "ratings_rating_range_check",
  ADD CONSTRAINT "ratings_rating_range_check" CHECK ("rating" >= 0 AND "rating" <= 5);

ALTER TABLE "materials" 
  DROP CONSTRAINT IF EXISTS "materials_price_positive_check",
  ADD CONSTRAINT "materials_price_positive_check" CHECK ("price" IS NULL OR "price" >= 0);

ALTER TABLE "materials" 
  DROP CONSTRAINT IF EXISTS "materials_lengths_check",
  ADD CONSTRAINT "materials_lengths_check" CHECK (("length_minute" IS NULL OR "length_minute" >= 0) AND ("length_page" IS NULL OR "length_page" >= 0));

ALTER TABLE "subscription_plan" 
  DROP CONSTRAINT IF EXISTS "subscription_plan_price_check",
  ADD CONSTRAINT "subscription_plan_price_check" CHECK ("price" >= 0);

-- 3. Foreign Key Lookup & Join Indexes
CREATE INDEX IF NOT EXISTS "idx_seller_profiles_user" ON "seller_profiles"("user_id");
CREATE INDEX IF NOT EXISTS "idx_materials_seller" ON "materials"("sellerProfile_id");
CREATE INDEX IF NOT EXISTS "idx_channels_seller" ON "channels"("sellerProfile_id");
CREATE INDEX IF NOT EXISTS "idx_channel_materials_seller" ON "channel_materials"("sellerProfile_id");
CREATE INDEX IF NOT EXISTS "idx_subscription_plan_channel" ON "subscription_plan"("channel_id");
CREATE INDEX IF NOT EXISTS "idx_ratings_material" ON "ratings"("material_id");
CREATE INDEX IF NOT EXISTS "idx_ratings_channel" ON "ratings"("channel_id");
CREATE INDEX IF NOT EXISTS "idx_ratings_user" ON "ratings"("user_id");
CREATE INDEX IF NOT EXISTS "idx_favorite_material" ON "favorite"("material_id");
CREATE INDEX IF NOT EXISTS "idx_favorite_channel" ON "favorite"("channel_id");
CREATE INDEX IF NOT EXISTS "idx_favorite_user" ON "favorite"("user_id");
CREATE INDEX IF NOT EXISTS "idx_password_resets_user" ON "password_resets"("user_id");
CREATE INDEX IF NOT EXISTS "idx_reports_user" ON "reports"("user_id");
CREATE INDEX IF NOT EXISTS "idx_reports_material" ON "reports"("material_id");
CREATE INDEX IF NOT EXISTS "idx_reports_channel" ON "reports"("channel_id");
CREATE INDEX IF NOT EXISTS "idx_replays_remark" ON "replays"("remark_id");
