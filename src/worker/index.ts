/**
 * Web Worker implementation for image loading.
 * This module provides an abstraction over Web Workers to efficiently load and process images
 * in background threads, preventing the main UI thread from being blocked during image operations.
 */
import {unref} from 'vue';
import appEnv from "app-env";

const DEBUG_MODE = appEnv.VITE_WORKER_DEBUG;

/**
 * Debug function to log messages to the console.
 * Working with the worker is a bit tricky, so we need to have verbose output.
 * @param args - Arguments to be logged
 */
function debug(...args: any[]) {
  if (DEBUG_MODE) {
    console.log(...args);
  }
}

/**
 * Events that can be emitted by the image worker.
 */
export enum ImageWorkerEvent {
  IMAGE_LOADED = 'loaded'
};

/**
 * Interface representing a job in the queue
 */
interface ImageLoadJob {
  url: string;
  index: number;
  resolve: (image: ImageBitmap) => void;
  reject: (error: Error) => void;
}

/**
 * A class that encapsulates a Web Worker for loading images in a separate thread.
 * Each instance manages one worker that can load one image at a time.
 */
class ImageWorker {
  /** Resolution function for the current image loading promise */
  private resolve: ((image: ImageBitmap) => void) | undefined;

  /** Flag indicating if the worker is currently processing an image */
  private _busy: boolean = false;

  /** The actual Web Worker instance */
  private worker: Worker;

  /** The ID of the worker instance */
  private static id: number;

  /**
   * Creates a new ImageWorker instance.
   * Initializes the Web Worker and sets up the message event handler.
   */
  constructor() {
    // Assign a unique ID to the worker instance
    // Used only for debugging purposes
    ImageWorker.id = (ImageWorker.id || 0) + 1;

    try {
      const workerUrl = new URL('/worker.js', import.meta.env.VITE_WORKER_URL || import.meta.url);
      this.worker = new Worker(workerUrl);
    } catch (error) {
      console.error(`Failed to initialize worker ${ImageWorker.id}:`, error);
      throw new Error('Failed to initialize image worker');
    }
    this.worker.addEventListener('message', (event) => {
      debug(`Worker ${ImageWorker.id}`, event.data);
      this.resolve?.({image: event.data.imageBitmap, index: event.data.index, url: event.data.url});

      this.release();
    });
  }

  /**
   * Releases the worker, marking it as available for new tasks.
   * Resets the resolution function and busy flag.
   * Checks for queued jobs when becoming available.
   * @private
   */
  private release() {
    this._busy = false;
    this.resolve = undefined;

    // Check if there are pending jobs in the queue
    processNextJob();
  }

  /**
   * Checks if the worker is currently busy processing an image.
   * @returns True if the worker is busy, false otherwise
   */
  public get busy(): boolean {
    return this._busy;
  }

  /**
   * Loads an image from the specified URL using the Web Worker.
   * @param url - The URL of the image to load
   * @param index - The index of the image in the sequence
   * @returns Promise that resolves with the loaded ImageBitmap
   */
  public load(url: string, index: number): Promise<ImageBitmap> {
    this._busy = true;
    return new Promise((resolve) => {
      this.resolve = resolve;
      this.worker.postMessage({url: unref(url), index: unref(index)});
    });
  }
}

/** Pool of active worker instances */
const workerPool: ImageWorker[] = [];

/** Queue of pending image loading jobs */
const jobQueue: ImageLoadJob[] = [];

/**
 * Our limit of image workers.
 * This is the limit to allow additional workers in the future.
 */
const maxWorkers = 6;

/**
 * Actual worker limit based on hardware capability and max limit
 * @see https://html.spec.whatwg.org/multipage/workers.html#navigator.hardwareconcurrency
 */
const workerLimit = Math.min(navigator.hardwareConcurrency || 4, maxWorkers);

/**
 * Processes the next job in the queue if there are any jobs and available workers
 */
function processNextJob(): void {
  if (jobQueue.length === 0) {
    debug('No jobs in queue');
    return;
  }

  const availableWorker = workerPool.find(worker => !worker.busy);
  if (!availableWorker) {
    debug('No available workers to process queue');
    return;
  }

  const job = jobQueue.shift();
  if (!job) return;

  debug(`Processing queued job: ${job.url}, remaining queue: ${jobQueue.length}`);

  availableWorker.load(job.url, job.index)
    .then(job.resolve)
    .catch(job.reject);
}

/**
 * Loads an image from the provided URL using an available worker from the pool.
 * If no worker is available and we haven't reached the worker limit, a new worker is created.
 * If all workers are busy, the request is queued and processed when a worker becomes available.
 *
 * @param url - The URL of the image to load
 * @param index - The index of the image in the sequence
 * @returns Promise resolving with the loaded ImageBitmap
 */
export function workerLoadImage(url: string, index: number): Promise<ImageBitmap> {
  debug('Loading image with worker', url);

  // Create new workers until we reach the limit
  if (workerPool.length < workerLimit) {
    debug('Creating new worker');
    debug('Current worker pool size:', workerPool.length);
    workerPool.push(new ImageWorker());
  }

  let availableWorker = workerPool.find(worker => !worker.busy);
  debug('Number of free workers:', workerPool.filter(worker => !worker.busy).length);

  // If a worker is available, use it immediately
  if (availableWorker) {
    return availableWorker.load(url, index);
  }

  // Otherwise, queue the job and return a promise that will be resolved when a worker becomes available
  debug(`No available workers, queueing request: ${url}, queue length: ${jobQueue.length}`);
  return new Promise<ImageBitmap>((resolve, reject) => {
    jobQueue.push({url, index, resolve, reject});
  });
}
