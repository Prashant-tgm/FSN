import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

// ── Content Block ─────────────────────────────────────────────────────────────

export type ContentBlockType =
  | 'heading'
  | 'paragraph'
  | 'image'
  | 'code'
  | 'quote'
  | 'divider'
  | 'embed';

export class ContentBlock {
  @Prop({ required: true, enum: ['heading', 'paragraph', 'image', 'code', 'quote', 'divider', 'embed'] })
  type: ContentBlockType;

  @Prop({ type: Object, required: true })
  data: {
    text?: string;
    level?: number;       // for heading: 1–4
    url?: string;         // for image/embed
    caption?: string;     // for image
    language?: string;    // for code
    source?: string;      // for quote
    service?: string;     // for embed (youtube, vimeo)
  };
}

// ── Blog Document ─────────────────────────────────────────────────────────────

export type BlogDocument = Blog & Document;

export enum BlogCategory {
  FIELD_REPORT = 'field_report',
  INNOVATION_STORY = 'innovation_story',
  HOW_TO = 'how_to',
  RESEARCH = 'research',
  OPINION = 'opinion',
}

@Schema({
  collection: 'blogs',
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
})
export class Blog {
  @Prop({ required: true })
  @ApiProperty()
  author_id: string; // UUID — references PostgreSQL users.id

  @Prop({ required: true, trim: true, maxlength: 400 })
  @ApiProperty()
  title: string;

  @Prop({ required: true, unique: true, lowercase: true })
  @ApiProperty()
  slug: string;

  @Prop({
    required: true,
    enum: BlogCategory,
    default: BlogCategory.FIELD_REPORT,
  })
  @ApiProperty({ enum: BlogCategory })
  category: BlogCategory;

  @Prop({ type: [Object], default: [] })
  @ApiProperty({ type: [Object] })
  content: ContentBlock[];

  @Prop({ default: '' })
  @ApiProperty()
  cover_image: string;

  @Prop({ type: [String], default: [] })
  @ApiProperty({ type: [String] })
  tags: string[];

  @Prop({ default: 0, min: 0 })
  @ApiProperty()
  clap_count: number;

  @Prop({ default: 0, min: 0 })
  @ApiProperty()
  view_count: number;

  @Prop({ default: false })
  @ApiProperty()
  is_featured: boolean;

  @Prop({ default: false })
  @ApiProperty()
  is_published: boolean;

  @Prop({ type: Date, default: null })
  @ApiProperty()
  published_at: Date | null;

  // Denormalized author info for fast reads
  @Prop({ type: Object })
  author_snapshot: {
    full_name: string;
    avatar_url?: string;
    role: string;
  };
}

export const BlogSchema = SchemaFactory.createForClass(Blog);

// ── Indexes ───────────────────────────────────────────────────────────────────
BlogSchema.index({ slug: 1 }, { unique: true });
BlogSchema.index({ author_id: 1 });
BlogSchema.index({ category: 1, is_published: 1 });
BlogSchema.index({ tags: 1 });
BlogSchema.index({ clap_count: -1 });
BlogSchema.index(
  { title: 'text', 'content.data.text': 'text', tags: 'text' },
  { name: 'blog_text_search' },
);
