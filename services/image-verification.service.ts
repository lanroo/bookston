

import { logger } from '@/utils/logger';

export class ImageVerificationService {

  static async verifyImageUrl(url: string): Promise<boolean> {
    if (!url || !url.trim()) {
      logger.debug('Image verification: Empty or invalid URL');
      return false;
    }

    try {
      logger.debug('Image verification: Checking URL', { url });
      const response = await fetch(url, { 
        method: 'HEAD',
        cache: 'no-cache',
      });
      
      const isAccessible = response.ok && response.status === 200;
      
      if (!isAccessible) {
        logger.warn('Image verification: URL not accessible', {
          url,
          status: response.status,
          statusText: response.statusText,
        });
      } else {
        logger.debug('Image verification: URL is accessible', { url, status: response.status });
      }
      
      return isAccessible;
    } catch (error) {
      logger.error('Image verification: Error verifying URL', error, { url });
      return false;
    }
  }


  static getSafeImageUrl(url: string | null | undefined, addTimestamp: boolean = false): string | null {
    if (!url || !url.trim()) {
      return null;
    }

    if (url.includes('?t=')) {
      return url;
    }

    if (addTimestamp) {
      return `${url}?t=${Date.now()}`;
    }

    return url;
  }
}

