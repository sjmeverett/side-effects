import { MaybeAsync } from './util';

export type Task<T> = () => MaybeAsync<T>;
export type AsyncTask<T> = () => Promise<T>;

export default class TaskList<T> {
  private _tasks: AsyncTask<T>[];

  constructor(tasks: Task<T>[], private serial=false) {
    this._tasks = tasks.map(toAsync);
  }


  async run(): Promise<T[]> {
    if (this.serial) {
      let results: T[] = [];

      for (let task of this._tasks) {
        let result = await task();
        results.push(result);
      }

      return results;
      
    } else {
      return Promise.all(
        this._tasks.map((task) => task())
      );
    }
  }


  map<B>(fn: (value: T, index?: number) => B): TaskList<B> {
    let result = new TaskList<B>([], this.serial);
    
    result._tasks = this._tasks.map(
      (task) => () => task().then(fn)
    );

    return result;
  }
}

function toAsync<A>(fn: () => MaybeAsync<A>): () => Promise<A> {
  return () => {
    try {
      return Promise.resolve(fn());
    } catch (err) {
      return Promise.reject(err);
    }
  }
}
