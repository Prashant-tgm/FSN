import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { PrismaService } from '../database/prisma.service';
import { QueueName, SearchJobName } from '../common/enums';

const INDEX_PROBLEMS  = 'fsn_problems';
const INDEX_SOLUTIONS = 'fsn_solutions';
const INDEX_BLOGS     = 'fsn_blogs';
const INDEX_USERS     = 'fsn_users';

@Processor(QueueName.SEARCH)
export class SearchProcessor {
  private readonly logger = new Logger(SearchProcessor.name);

  constructor(
    private prisma: PrismaService,
    private es: ElasticsearchService,
  ) {}

  // ── Problems ─────────────────────────────────────────────────────────────────

  @Process(SearchJobName.INDEX_PROBLEM)
  async indexProblem(job: Job<{ problemId: string }>) {
    const { problemId } = job.data;
    const problem = await this.prisma.problem.findUnique({
      where: { id: problemId },
      include: { poster: { select: { fullName: true, role: true } } },
    });
    if (!problem || problem.isDeleted) return;

    const loc = problem.location as any;
    await this.es.index({
      index: INDEX_PROBLEMS,
      id: problemId,
      document: {
        id: problemId,
        title: problem.title,
        description: problem.description,
        category: problem.category,
        urgency: problem.urgency,
        status: problem.status,
        tags: problem.tags,
        location: {
          state: loc?.state,
          district: loc?.district,
          geo_point:
            loc?.lat && loc?.lng
              ? { lat: loc.lat, lon: loc.lng }
              : undefined,
        },
        poster_name: problem.poster.fullName,
        poster_role: problem.poster.role,
        upvote_count: problem.upvoteCount,
        solution_count: problem.solutionCount,
        created_at: problem.createdAt,
      },
    });
    this.logger.debug(`Indexed problem: ${problemId}`);
  }

  @Process(SearchJobName.DELETE_PROBLEM)
  async deleteProblem(job: Job<{ problemId: string }>) {
    try {
      await this.es.delete({ index: INDEX_PROBLEMS, id: job.data.problemId });
    } catch {
      // Document may not exist yet — not an error
    }
  }

  // ── Solutions ─────────────────────────────────────────────────────────────────

  @Process(SearchJobName.INDEX_SOLUTION)
  async indexSolution(job: Job<{ solutionId: string }>) {
    const { solutionId } = job.data;
    const solution = await this.prisma.solution.findUnique({
      where: { id: solutionId },
      include: { innovator: { select: { fullName: true } } },
    });
    if (!solution || solution.isDeleted) return;

    await this.es.index({
      index: INDEX_SOLUTIONS,
      id: solutionId,
      document: {
        id: solutionId,
        title: solution.title,
        description: solution.description,
        tech_tags: solution.techTags,
        status: solution.status,
        impact_score: Number(solution.impactScore),
        upvote_count: solution.upvoteCount,
        innovator_name: solution.innovator.fullName,
        problem_id: solution.problemId,
        created_at: solution.createdAt,
      },
    });
    this.logger.debug(`Indexed solution: ${solutionId}`);
  }

  @Process(SearchJobName.DELETE_SOLUTION)
  async deleteSolution(job: Job<{ solutionId: string }>) {
    try {
      await this.es.delete({ index: INDEX_SOLUTIONS, id: job.data.solutionId });
    } catch {
      // no-op
    }
  }

  // ── Blogs ─────────────────────────────────────────────────────────────────────

  @Process(SearchJobName.INDEX_BLOG)
  async indexBlog(job: Job<{ blogId: string; title: string; tags: string[]; authorName: string; category: string; plainText: string }>) {
    const { blogId, title, tags, authorName, category, plainText } = job.data;

    await this.es.index({
      index: INDEX_BLOGS,
      id: blogId,
      document: {
        id: blogId,
        title,
        content_text: plainText,
        tags,
        category,
        author_name: authorName,
        indexed_at: new Date(),
      },
    });
    this.logger.debug(`Indexed blog: ${blogId}`);
  }
}
