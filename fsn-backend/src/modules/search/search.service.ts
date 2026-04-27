import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  excerpt?: string;
  score: number;
  meta: Record<string, any>;
}

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(
    private es: ElasticsearchService,
    private config: ConfigService,
  ) {}

  async search(q: string, type?: string, filters: Record<string, any> = {}, page = 1, limit = 20): Promise<{
    results: SearchResult[];
    total: number;
    page: number;
    limit: number;
  }> {
    const from = (page - 1) * limit;

    const indices = type
      ? [`fsn_${type}`]
      : ['fsn_problems', 'fsn_solutions', 'fsn_blogs', 'fsn_users'];

    const query: any = {
      bool: {
        must: [
          {
            multi_match: {
              query: q,
              fields: ['title^3', 'description^2', 'tags^2', 'content_text', 'full_name'],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ],
        filter: this.buildFilters(filters),
      },
    };

    try {
      const response = await this.es.search({
        index: indices,
        from,
        size: limit,
        query,
        highlight: {
          fields: {
            title: {},
            description: { fragment_size: 150, number_of_fragments: 1 },
            content_text: { fragment_size: 150, number_of_fragments: 1 },
          },
        },
        _source: true,
      });

      const hits = response.hits.hits;
      const total = typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total as any)?.value ?? 0;

      const results: SearchResult[] = hits.map((hit: any) => ({
        type: hit._index.replace('fsn_', ''),
        id: hit._id,
        title: hit._source.title ?? hit._source.full_name ?? '',
        excerpt:
          hit.highlight?.description?.[0] ??
          hit.highlight?.content_text?.[0] ??
          (hit._source.description ?? '').slice(0, 150),
        score: hit._score ?? 0,
        meta: this.extractMeta(hit._index, hit._source),
      }));

      return { results, total, page, limit };
    } catch (err) {
      this.logger.error('Elasticsearch search error', err);
      return { results: [], total: 0, page, limit };
    }
  }

  async suggestions(q: string): Promise<string[]> {
    try {
      const response = await this.es.search({
        index: ['fsn_problems', 'fsn_solutions'],
        size: 5,
        query: {
          match_phrase_prefix: { title: { query: q, max_expansions: 10 } },
        },
        _source: ['title'],
      });
      return response.hits.hits.map((h: any) => h._source.title);
    } catch {
      return [];
    }
  }

  async ensureIndices() {
    const indices = [
      {
        name: 'fsn_problems',
        mappings: {
          properties: {
            title: { type: 'text', analyzer: 'standard' },
            description: { type: 'text' },
            category: { type: 'keyword' },
            urgency: { type: 'keyword' },
            status: { type: 'keyword' },
            tags: { type: 'keyword' },
            location: {
              properties: {
                state: { type: 'keyword' },
                geo_point: { type: 'geo_point' },
              },
            },
            created_at: { type: 'date' },
          },
        },
      },
      {
        name: 'fsn_solutions',
        mappings: {
          properties: {
            title: { type: 'text' },
            description: { type: 'text' },
            tech_tags: { type: 'keyword' },
            status: { type: 'keyword' },
            impact_score: { type: 'float' },
          },
        },
      },
    ];

    for (const { name, mappings } of indices) {
      const exists = await this.es.indices.exists({ index: name });
      if (!exists) {
        await this.es.indices.create({ index: name, mappings } as any);
        this.logger.log(`Created ES index: ${name}`);
      }
    }
  }

  private buildFilters(filters: Record<string, any>) {
    return Object.entries(filters)
      .filter(([, v]) => v !== undefined && v !== '')
      .map(([k, v]) => ({ term: { [k]: v } }));
  }

  private extractMeta(index: string, source: any): Record<string, any> {
    if (index === 'fsn_problems') {
      return {
        category: source.category,
        urgency: source.urgency,
        status: source.status,
        upvoteCount: source.upvote_count,
      };
    }
    if (index === 'fsn_solutions') {
      return { status: source.status, impactScore: source.impact_score };
    }
    if (index === 'fsn_blogs') {
      return { category: source.category, authorName: source.author_name };
    }
    return {};
  }
}