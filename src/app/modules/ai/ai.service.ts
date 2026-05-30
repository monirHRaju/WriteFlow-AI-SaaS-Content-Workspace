import OpenAI from "openai";
import { StatusCodes } from "http-status-codes";
import { getCache, setCache } from "../../utils/redis";
import { AiRepository } from "./ai.repository";
import {
  TDraftInput,
  TDraftOutput,
  TRewriteInput,
  TRewriteOutput,
} from "./ai.types";
import AppError from "../../errors/AppError";
import config from "../../config";
import logger from "../../utils/logger";
import { AgentType } from "@prisma/client";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: config.openaiApiKey,
});

// Rate limiter constants
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds
const MAX_REQUESTS_PER_HOUR = 10;

export class AiService {
  /**
   * Check and apply user rate limiting (10 requests per hour).
   * @param userId User ID
   * @returns true if within limits, false if rate limit exceeded
   */
  private static async checkRateLimit(userId: string): Promise<boolean> {
    const cacheKey = `ai:rate_limit:${userId}`;
    const currentCount = await getCache(cacheKey);

    if (currentCount === null) {
      // First request in this hour window
      await setCache(cacheKey, "1", RATE_LIMIT_WINDOW);
      return true;
    }

    const count = parseInt(currentCount, 10);
    if (count >= MAX_REQUESTS_PER_HOUR) {
      return false;
    }

    // Increment counter
    await setCache(cacheKey, (count + 1).toString(), RATE_LIMIT_WINDOW);
    return true;
  }

  /**
   * Check if OpenAI API key is properly configured.
   * Returns true if configured with actual API key (not placeholder).
   */
  private static isOpenAiConfigured(): boolean {
    const key = config.openaiApiKey;
    return !!(
      key &&
      key !== "change_me_openai_api_key" &&
      key.startsWith("sk-")
    );
  }

  /**
   * Generate mock draft response for fallback scenarios.
   */
  private static generateMockDraft(_input: TDraftInput): TDraftOutput {
    const mockContent = `This is a mock-generated draft for testing purposes. 
      Topic: ${_input.topic}
      Tone: ${_input.tone}
      Target Audience: ${_input.audience}
      
      [Mock content generated because OpenAI API is not fully configured]`;

    return {
      title: `Generated: ${_input.topic}`,
      metaDescription: `A ${_input.tone} piece about ${_input.topic} for ${_input.audience}`,
      tags: [
        _input.tone.toLowerCase(),
        _input.audience.toLowerCase(),
        _input.topic.toLowerCase(),
      ],
      content: mockContent,
    };
  }

  /**
   * Generate mock rewrite response for fallback scenarios.
   */
  private static generateMockRewrite(_input: TRewriteInput): TRewriteOutput {
    const modeDescriptions: Record<string, string> = {
      shorten: "shortened",
      expand: "expanded",
      formal: "formalized",
      casual: "casualized",
      persuasive: "made more persuasive",
      fix_grammar: "grammar-corrected",
    };

    return {
      rewrittenText: `[Mock ${modeDescriptions[_input.mode]} version]\n\n${_input.text}`,
    };
  }

  /**
   * Process a draft generation job.
   * @param userId User ID
   * @param input Draft input payload
   */
  static async processDraftJob(
    userId: string,
    input: TDraftInput,
  ): Promise<TDraftOutput> {
    try {
      // Apply rate limiting
      const withinLimit = await this.checkRateLimit(userId);
      if (!withinLimit) {
        throw new AppError(
          StatusCodes.TOO_MANY_REQUESTS,
          "Rate limit exceeded. Maximum 10 requests per hour allowed.",
        );
      }

      // Log the request
      const prompt = `Generate a ${input.tone} piece about "${input.topic}" for ${input.audience}`;

      // Create AI log entry
      const logEntry = await AiRepository.createLog({
        userId,
        agentType: AgentType.DRAFT,
        prompt,
        response: "", // Will be updated after processing
        tokensUsed: 0,
      });

      let result: TDraftOutput;

      // Check if OpenAI is configured
      if (!this.isOpenAiConfigured()) {
        logger.warn(
          `⚠️ OpenAI API not configured for user ${userId}. Using mock response.`,
        );
        result = this.generateMockDraft(input);
      } else {
        // Call OpenAI with JSON mode for structured response
        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a professional content writer. Generate content in ${input.tone} tone for ${input.audience} audience.`,
            },
            {
              role: "user",
              content: `Create a piece about: ${input.topic}`,
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
          max_tokens: 1000,
        });

        const content = response.choices[0]?.message?.content || "{}";
        result = JSON.parse(content) as TDraftOutput;

        // Track token usage
        const tokensUsed = response.usage?.total_tokens || 0;

        // Update log with actual response
        await AiRepository.updateLog(logEntry.id, {
          response: content,
          tokensUsed,
        });

        logger.info(
          `✅ Draft generation completed for user ${userId}. Tokens used: ${tokensUsed}`,
        );
      }

      return result;
    } catch (error) {
      logger.error(`❌ Error processing draft job: ${error}`);
      throw error;
    }
  }

  /**
   * Process a rewrite generation job.
   * @param userId User ID
   * @param input Rewrite input payload
   */
  static async processRewriteJob(
    userId: string,
    input: TRewriteInput,
  ): Promise<TRewriteOutput> {
    try {
      // Apply rate limiting
      const withinLimit = await this.checkRateLimit(userId);
      if (!withinLimit) {
        throw new AppError(
          StatusCodes.TOO_MANY_REQUESTS,
          "Rate limit exceeded. Maximum 10 requests per hour allowed.",
        );
      }

      // Log the request
      const prompt = `Rewrite the following text in ${input.mode} mode:\n\n${input.text}`;

      // Create AI log entry
      const logEntry = await AiRepository.createLog({
        userId,
        agentType: AgentType.REWRITE,
        prompt,
        response: "", // Will be updated after processing
        tokensUsed: 0,
      });

      let result: TRewriteOutput;

      // Check if OpenAI is configured
      if (!this.isOpenAiConfigured()) {
        logger.warn(
          `⚠️ OpenAI API not configured for user ${userId}. Using mock response.`,
        );
        result = this.generateMockRewrite(input);
      } else {
        // Determine system prompt based on rewrite mode
        const modeInstructions: Record<string, string> = {
          shorten: "Make the text concise and remove unnecessary details.",
          expand: "Expand the text with more details and examples.",
          formal: "Rewrite in a formal, professional tone.",
          casual: "Rewrite in a casual, conversational tone.",
          persuasive: "Rewrite to be more persuasive and compelling.",
          fix_grammar: "Fix grammar, spelling, and punctuation errors.",
        };

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You are a professional editor. ${modeInstructions[input.mode]} Respond with ONLY the rewritten text, no explanations.`,
            },
            {
              role: "user",
              content: input.text,
            },
          ],
          temperature: 0.7,
          max_tokens: 1000,
        });

        const rewrittenText =
          response.choices[0]?.message?.content || input.text;
        result = { rewrittenText };

        // Track token usage
        const tokensUsed = response.usage?.total_tokens || 0;

        // Update log with actual response
        await AiRepository.updateLog(logEntry.id, {
          response: rewrittenText,
          tokensUsed,
        });

        logger.info(
          `✅ Rewrite generation completed for user ${userId}. Mode: ${input.mode}. Tokens used: ${tokensUsed}`,
        );
      }

      return result;
    } catch (error) {
      logger.error(`❌ Error processing rewrite job: ${error}`);
      throw error;
    }
  }
}
