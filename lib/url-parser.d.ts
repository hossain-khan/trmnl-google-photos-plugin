/**
 * Type definitions for lib/url-parser.js
 */

export interface ParseResult {
  valid: boolean;
  url?: string;
  albumId?: string;
  urlType?: 'short' | 'full';
  error?: string;
  errors?: string[];
}

export function parseAlbumUrl(url: string | null | undefined): ParseResult;
export function extractAlbumId(url: string): string | null;
export function isValidAlbumUrl(url: string): boolean;
export function normalizeAlbumUrl(url: string): string | null;
export function getErrorMessage(url: string): string;
