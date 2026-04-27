-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('bop_user', 'ngo', 'innovator', 'admin');

-- CreateEnum
CREATE TYPE "ProblemCategory" AS ENUM ('agriculture', 'health', 'water', 'education', 'livelihood', 'infrastructure', 'energy', 'other');

-- CreateEnum
CREATE TYPE "ProblemUrgency" AS ENUM ('low', 'medium', 'high', 'critical');

-- CreateEnum
CREATE TYPE "ProblemStatus" AS ENUM ('open', 'in_progress', 'under_trial', 'solved', 'closed');

-- CreateEnum
CREATE TYPE "ProblemVisibility" AS ENUM ('public', 'community', 'private');

-- CreateEnum
CREATE TYPE "SolutionStatus" AS ENUM ('submitted', 'accepted', 'under_trial', 'implemented', 'rejected');

-- CreateEnum
CREATE TYPE "CoCreationStatus" AS ENUM ('pending', 'active', 'closed');

-- CreateEnum
CREATE TYPE "FeedbackCheckpoint" AS ENUM ('week1', 'month1', 'month3', 'month6');

-- CreateEnum
CREATE TYPE "WoFTier" AS ENUM ('bronze', 'silver', 'gold');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('problem', 'solution', 'blog');

-- CreateEnum
CREATE TYPE "CommentEntityType" AS ENUM ('solution', 'blog');

-- CreateEnum
CREATE TYPE "VoteValue" AS ENUM ('up', 'down');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "password_hash" VARCHAR(255),
    "full_name" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'bop_user',
    "avatar_url" TEXT,
    "bio" TEXT,
    "location" JSONB,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,
    "reputation_score" INTEGER NOT NULL DEFAULT 0,
    "oauth_provider" VARCHAR(50),
    "oauth_id" VARCHAR(255),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "problems" (
    "id" UUID NOT NULL,
    "posted_by" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "category" "ProblemCategory" NOT NULL,
    "location" JSONB NOT NULL,
    "urgency" "ProblemUrgency" NOT NULL DEFAULT 'medium',
    "people_affected" INTEGER,
    "status" "ProblemStatus" NOT NULL DEFAULT 'open',
    "visibility" "ProblemVisibility" NOT NULL DEFAULT 'public',
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "upvote_count" INTEGER NOT NULL DEFAULT 0,
    "solution_count" INTEGER NOT NULL DEFAULT 0,
    "media" JSONB,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "problems_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "solutions" (
    "id" UUID NOT NULL,
    "problem_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "title" VARCHAR(300) NOT NULL,
    "description" TEXT NOT NULL,
    "tech_tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "cost_estimate" JSONB,
    "timeline" JSONB,
    "status" "SolutionStatus" NOT NULL DEFAULT 'submitted',
    "co_creation_open" BOOLEAN NOT NULL DEFAULT false,
    "impact_score" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "upvote_count" INTEGER NOT NULL DEFAULT 0,
    "media" JSONB,
    "version" INTEGER NOT NULL DEFAULT 1,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "solutions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "feedback" (
    "id" UUID NOT NULL,
    "solution_id" UUID NOT NULL,
    "submitted_by" UUID NOT NULL,
    "rating" INTEGER NOT NULL,
    "what_worked" TEXT,
    "what_failed" TEXT,
    "suggestions" TEXT,
    "media" JSONB,
    "checkpoint" "FeedbackCheckpoint" NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "co_creations" (
    "id" UUID NOT NULL,
    "problem_id" UUID NOT NULL,
    "solution_id" UUID,
    "innovator_id" UUID NOT NULL,
    "community_user_id" UUID NOT NULL,
    "ngo_facilitator_id" UUID,
    "status" "CoCreationStatus" NOT NULL DEFAULT 'pending',
    "workspace_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "co_creations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" UUID NOT NULL,
    "co_creation_id" UUID NOT NULL,
    "notes" TEXT,
    "tasks" JSONB DEFAULT '[]',
    "files" JSONB DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversations" (
    "id" UUID NOT NULL,
    "co_creation_id" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "conversation_participants" (
    "conversation_id" UUID NOT NULL,
    "user_id" UUID NOT NULL,

    CONSTRAINT "conversation_participants_pkey" PRIMARY KEY ("conversation_id","user_id")
);

-- CreateTable
CREATE TABLE "messages" (
    "id" UUID NOT NULL,
    "conversation_id" UUID NOT NULL,
    "sender_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "comments" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" "CommentEntityType" NOT NULL,
    "entity_id" TEXT NOT NULL,
    "parent_id" UUID,
    "content" TEXT NOT NULL,
    "upvote_count" INTEGER NOT NULL DEFAULT 0,
    "is_deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "comments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "votes" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "entity_type" "EntityType" NOT NULL,
    "entity_id" UUID NOT NULL,
    "value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "votes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "type" VARCHAR(50) NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "body" TEXT NOT NULL,
    "read_at" TIMESTAMP(3),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wall_of_fame" (
    "id" UUID NOT NULL,
    "solution_id" UUID NOT NULL,
    "tier" "WoFTier" NOT NULL DEFAULT 'bronze',
    "award_year" INTEGER,
    "description" TEXT,
    "featured_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "wall_of_fame_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tags" (
    "id" UUID NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "usage_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tags_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "badge_type" VARCHAR(50) NOT NULL,
    "awarded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_phone_key" ON "users"("phone");

-- CreateIndex
CREATE INDEX "problems_category_status_urgency_idx" ON "problems"("category", "status", "urgency");

-- CreateIndex
CREATE INDEX "problems_posted_by_idx" ON "problems"("posted_by");

-- CreateIndex
CREATE INDEX "problems_created_at_idx" ON "problems"("created_at" DESC);

-- CreateIndex
CREATE INDEX "solutions_problem_id_status_idx" ON "solutions"("problem_id", "status");

-- CreateIndex
CREATE INDEX "solutions_submitted_by_idx" ON "solutions"("submitted_by");

-- CreateIndex
CREATE INDEX "solutions_impact_score_idx" ON "solutions"("impact_score" DESC);

-- CreateIndex
CREATE INDEX "feedback_solution_id_idx" ON "feedback"("solution_id");

-- CreateIndex
CREATE UNIQUE INDEX "feedback_solution_id_submitted_by_checkpoint_key" ON "feedback"("solution_id", "submitted_by", "checkpoint");

-- CreateIndex
CREATE UNIQUE INDEX "co_creations_workspace_id_key" ON "co_creations"("workspace_id");

-- CreateIndex
CREATE INDEX "co_creations_problem_id_status_idx" ON "co_creations"("problem_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_co_creation_id_key" ON "workspaces"("co_creation_id");

-- CreateIndex
CREATE INDEX "messages_conversation_id_created_at_idx" ON "messages"("conversation_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "comments_entity_type_entity_id_idx" ON "comments"("entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "votes_entity_type_entity_id_idx" ON "votes"("entity_type", "entity_id");

-- CreateIndex
CREATE UNIQUE INDEX "votes_user_id_entity_type_entity_id_key" ON "votes"("user_id", "entity_type", "entity_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");

-- CreateIndex
CREATE UNIQUE INDEX "wall_of_fame_solution_id_key" ON "wall_of_fame"("solution_id");

-- CreateIndex
CREATE INDEX "wall_of_fame_tier_award_year_idx" ON "wall_of_fame"("tier", "award_year");

-- CreateIndex
CREATE UNIQUE INDEX "tags_name_key" ON "tags"("name");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_type_key" ON "user_badges"("user_id", "badge_type");

-- AddForeignKey
ALTER TABLE "problems" ADD CONSTRAINT "problems_posted_by_fkey" FOREIGN KEY ("posted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "solutions" ADD CONSTRAINT "solutions_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_solution_id_fkey" FOREIGN KEY ("solution_id") REFERENCES "solutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "feedback" ADD CONSTRAINT "feedback_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_creations" ADD CONSTRAINT "co_creations_problem_id_fkey" FOREIGN KEY ("problem_id") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_creations" ADD CONSTRAINT "co_creations_solution_id_fkey" FOREIGN KEY ("solution_id") REFERENCES "solutions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_creations" ADD CONSTRAINT "co_creations_innovator_id_fkey" FOREIGN KEY ("innovator_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_creations" ADD CONSTRAINT "co_creations_community_user_id_fkey" FOREIGN KEY ("community_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "co_creations" ADD CONSTRAINT "co_creations_ngo_facilitator_id_fkey" FOREIGN KEY ("ngo_facilitator_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_co_creation_id_fkey" FOREIGN KEY ("co_creation_id") REFERENCES "co_creations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_participants" ADD CONSTRAINT "conversation_participants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comment_solution_fk" FOREIGN KEY ("entity_id") REFERENCES "solutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "comments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "votes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "vote_problem_fk" FOREIGN KEY ("entity_id") REFERENCES "problems"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "votes" ADD CONSTRAINT "vote_solution_fk" FOREIGN KEY ("entity_id") REFERENCES "solutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wall_of_fame" ADD CONSTRAINT "wall_of_fame_solution_id_fkey" FOREIGN KEY ("solution_id") REFERENCES "solutions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
