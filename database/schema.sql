-- ==========================================================
-- NovaCart Relational Database Schema
-- Engine: SQLite 3 / Relational SQL DDL Definition
-- Currency Standard: Indian Rupees (INR / ₹)
-- ==========================================================

CREATE INDEX "auth_group_permissions_group_id_b120cbf9" ON "auth_group_permissions" ("group_id");

CREATE UNIQUE INDEX "auth_group_permissions_group_id_permission_id_0cd325b0_uniq" ON "auth_group_permissions" ("group_id", "permission_id");

CREATE INDEX "auth_group_permissions_permission_id_84c5c92e" ON "auth_group_permissions" ("permission_id");

CREATE INDEX "auth_permission_content_type_id_2f476e4b" ON "auth_permission" ("content_type_id");

CREATE UNIQUE INDEX "auth_permission_content_type_id_codename_01ab375a_uniq" ON "auth_permission" ("content_type_id", "codename");

CREATE INDEX "auth_user_groups_group_id_97559544" ON "auth_user_groups" ("group_id");

CREATE INDEX "auth_user_groups_user_id_6a12ed8b" ON "auth_user_groups" ("user_id");

CREATE UNIQUE INDEX "auth_user_groups_user_id_group_id_94350c0c_uniq" ON "auth_user_groups" ("user_id", "group_id");

CREATE INDEX "auth_user_user_permissions_permission_id_1fbb5f2c" ON "auth_user_user_permissions" ("permission_id");

CREATE INDEX "auth_user_user_permissions_user_id_a95ead1b" ON "auth_user_user_permissions" ("user_id");

CREATE UNIQUE INDEX "auth_user_user_permissions_user_id_permission_id_14a6b632_uniq" ON "auth_user_user_permissions" ("user_id", "permission_id");

CREATE INDEX "cart_app_cartitem_product_id_2459a9eb" ON "cart_app_cartitem" ("product_id");

CREATE INDEX "cart_app_cartitem_session_key_42240dc4" ON "cart_app_cartitem" ("session_key");

CREATE INDEX "cart_app_cartitem_user_id_a9528064" ON "cart_app_cartitem" ("user_id");

CREATE INDEX "cart_app_wishlistitem_product_id_d703e1bf" ON "cart_app_wishlistitem" ("product_id");

CREATE INDEX "cart_app_wishlistitem_session_key_5492bb3d" ON "cart_app_wishlistitem" ("session_key");

CREATE INDEX "cart_app_wishlistitem_user_id_25906963" ON "cart_app_wishlistitem" ("user_id");

CREATE INDEX "django_admin_log_content_type_id_c4bce8eb" ON "django_admin_log" ("content_type_id");

CREATE INDEX "django_admin_log_user_id_c564eba6" ON "django_admin_log" ("user_id");

CREATE UNIQUE INDEX "django_content_type_app_label_model_76bd3d3b_uniq" ON "django_content_type" ("app_label", "model");

CREATE INDEX "django_session_expire_date_a5c62663" ON "django_session" ("expire_date");

CREATE INDEX "notifications_app_notification_session_key_2ff881f3" ON "notifications_app_notification" ("session_key");

CREATE INDEX "notifications_app_notification_user_id_9d8bad78" ON "notifications_app_notification" ("user_id");

CREATE INDEX "orders_order_session_key_164d0e6e" ON "orders_order" ("session_key");

CREATE INDEX "orders_order_user_id_e9b59eb1" ON "orders_order" ("user_id");

CREATE INDEX "orders_orderitem_order_id_fe61a34d" ON "orders_orderitem" ("order_id");

CREATE INDEX "orders_orderitem_product_id_afe4254a" ON "orders_orderitem" ("product_id");

CREATE INDEX "products_product_category_id_9b594869" ON "products_product" ("category_id");

CREATE INDEX "products_review_product_id_d933ffa7" ON "products_review" ("product_id");

CREATE TABLE "accounts_profile" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "full_name" varchar(150) NOT NULL, "phone" varchar(20) NOT NULL, "address" text NOT NULL, "city" varchar(100) NOT NULL, "state" varchar(100) NOT NULL, "pincode" varchar(20) NOT NULL, "avatar" varchar(255) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "user_id" integer NOT NULL UNIQUE REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "auth_group" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(150) NOT NULL UNIQUE);

CREATE TABLE "auth_group_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "auth_permission" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "content_type_id" integer NOT NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, "codename" varchar(100) NOT NULL, "name" varchar(255) NOT NULL);

CREATE TABLE "auth_user" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "password" varchar(128) NOT NULL, "last_login" datetime NULL, "is_superuser" bool NOT NULL, "username" varchar(150) NOT NULL UNIQUE, "last_name" varchar(150) NOT NULL, "email" varchar(254) NOT NULL, "is_staff" bool NOT NULL, "is_active" bool NOT NULL, "date_joined" datetime NOT NULL, "first_name" varchar(150) NOT NULL);

CREATE TABLE "auth_user_groups" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "group_id" integer NOT NULL REFERENCES "auth_group" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "auth_user_user_permissions" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "permission_id" integer NOT NULL REFERENCES "auth_permission" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "cart_app_cartitem" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "session_key" varchar(100) NULL, "quantity" integer unsigned NOT NULL CHECK ("quantity" >= 0), "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "product_id" bigint NOT NULL REFERENCES "products_product" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "cart_app_wishlistitem" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "session_key" varchar(100) NULL, "created_at" datetime NOT NULL, "product_id" bigint NOT NULL REFERENCES "products_product" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "django_admin_log" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "object_id" text NULL, "object_repr" varchar(200) NOT NULL, "action_flag" smallint unsigned NOT NULL CHECK ("action_flag" >= 0), "change_message" text NOT NULL, "content_type_id" integer NULL REFERENCES "django_content_type" ("id") DEFERRABLE INITIALLY DEFERRED, "user_id" integer NOT NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "action_time" datetime NOT NULL);

CREATE TABLE "django_content_type" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "app_label" varchar(100) NOT NULL, "model" varchar(100) NOT NULL);

CREATE TABLE "django_migrations" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "app" varchar(255) NOT NULL, "name" varchar(255) NOT NULL, "applied" datetime NOT NULL);

CREATE TABLE "django_session" ("session_key" varchar(40) NOT NULL PRIMARY KEY, "session_data" text NOT NULL, "expire_date" datetime NOT NULL);

CREATE TABLE "notifications_app_notification" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "session_key" varchar(100) NULL, "title" varchar(200) NOT NULL, "message" text NOT NULL, "notif_type" varchar(50) NOT NULL, "icon_type" varchar(50) NOT NULL, "is_read" bool NOT NULL, "created_at" datetime NOT NULL, "user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "orders_order" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "order_number" varchar(50) NOT NULL UNIQUE, "session_key" varchar(100) NULL, "full_name" varchar(150) NOT NULL, "email" varchar(254) NOT NULL, "phone" varchar(20) NOT NULL, "address" text NOT NULL, "city" varchar(100) NOT NULL, "state" varchar(100) NOT NULL, "pincode" varchar(20) NOT NULL, "subtotal" decimal NOT NULL, "shipping" decimal NOT NULL, "tax" decimal NOT NULL, "total_amount" decimal NOT NULL, "payment_method" varchar(50) NOT NULL, "payment_status" varchar(50) NOT NULL, "order_status" varchar(50) NOT NULL, "tracking_step" integer NOT NULL, "estimated_delivery" varchar(100) NOT NULL, "created_at" datetime NOT NULL, "updated_at" datetime NOT NULL, "user_id" integer NULL REFERENCES "auth_user" ("id") DEFERRABLE INITIALLY DEFERRED, "discount" decimal NOT NULL, "payment_id" varchar(100) NULL UNIQUE);

CREATE TABLE "orders_orderitem" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "product_name" varchar(200) NOT NULL, "price" decimal NOT NULL, "quantity" integer unsigned NOT NULL CHECK ("quantity" >= 0), "image_url" varchar(255) NOT NULL, "order_id" bigint NOT NULL REFERENCES "orders_order" ("id") DEFERRABLE INITIALLY DEFERRED, "product_id" bigint NULL REFERENCES "products_product" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "products_category" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(100) NOT NULL, "slug" varchar(50) NOT NULL UNIQUE, "icon_url" varchar(255) NOT NULL, "product_count" integer NOT NULL);

CREATE TABLE "products_product" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "name" varchar(200) NOT NULL, "slug" varchar(50) NOT NULL UNIQUE, "description" text NOT NULL, "price" decimal NOT NULL, "original_price" decimal NULL, "rating" decimal NOT NULL, "reviews_count" integer NOT NULL, "stock" integer NOT NULL, "image_url" varchar(255) NOT NULL, "badge" varchar(50) NOT NULL, "is_featured" bool NOT NULL, "is_deal" bool NOT NULL, "created_at" datetime NOT NULL, "category_id" bigint NOT NULL REFERENCES "products_category" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE "products_review" ("id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, "author_name" varchar(100) NOT NULL, "rating" integer NOT NULL, "comment" text NOT NULL, "created_at" datetime NOT NULL, "product_id" bigint NOT NULL REFERENCES "products_product" ("id") DEFERRABLE INITIALLY DEFERRED);

CREATE TABLE sqlite_sequence(name,seq);

